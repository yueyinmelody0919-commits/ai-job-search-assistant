/**
 * Create #job-search channel and invite all bots.
 * Usage: npx tsx scripts/setup-slack-channel.ts
 */

import "dotenv/config";

const BOT_TOKENS = [
  { name: "Scout (Dwight)", token: process.env.SLACK_SCOUT_BOT_TOKEN!, userId: "" },
  { name: "Analyst (Oscar)", token: process.env.SLACK_ANALYST_BOT_TOKEN!, userId: "" },
  { name: "Strategist (Jim)", token: process.env.SLACK_STRATEGIST_BOT_TOKEN!, userId: "" },
  { name: "Ops (Angela)", token: process.env.SLACK_OPS_BOT_TOKEN!, userId: "" },
  { name: "Engineer (Darryl)", token: process.env.SLACK_ENGINEER_BOT_TOKEN!, userId: "" },
  { name: "Coach (Holly)", token: process.env.SLACK_COACH_BOT_TOKEN!, userId: "" },
  { name: "QA (Stanley)", token: process.env.SLACK_QA_BOT_TOKEN!, userId: "" },
];

async function slackApi(method: string, token: string, body?: Record<string, unknown>) {
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function main() {
  const primaryToken = BOT_TOKENS[0].token;

  // Get bot user IDs
  for (const bot of BOT_TOKENS) {
    const auth = await slackApi("auth.test", bot.token);
    if (auth.ok) {
      bot.userId = auth.user_id;
      console.log(`  ✓ ${bot.name}: ${auth.user_id}`);
    } else {
      console.log(`  ✗ ${bot.name}: ${auth.error}`);
    }
  }

  // Create channel using workspace admin token
  const adminToken = process.env.SLACK_ACCESS_TOKEN!;
  console.log("\nCreating #job-search channel...");
  // Try with bot first, then with user token
  let createRes = await slackApi("conversations.create", primaryToken, {
    name: "job-search",
    is_private: false,
  });
  if (!createRes.ok && createRes.error === "missing_scope") {
    // Bot can't create channels — user must create it manually
    // Let's try to find an existing one or ask user
    console.log("  Bot can't create channels. Checking for existing...");
    const listRes = await slackApi("conversations.list", primaryToken, {
      types: "public_channel",
      limit: 200,
    });
    const existing = listRes.channels?.find((c: { name: string }) =>
      c.name === "job-search" || c.name === "general"
    );
    if (existing) {
      createRes = { ok: false, error: "name_taken", channel: existing };
      // Force into the name_taken branch
      createRes.error = "name_taken";
    } else {
      console.log("  ✗ No suitable channel found. Please create #job-search in Slack and re-run.");
      console.log("  Or we'll use #general instead.");
      const genRes = await slackApi("conversations.list", primaryToken, {
        types: "public_channel",
        limit: 200,
      });
      const general = genRes.channels?.[0];
      if (general) {
        createRes = { ok: false, error: "name_taken" };
      }
      return;
    }
  }

  let channelId: string;
  if (createRes.ok) {
    channelId = createRes.channel.id;
    console.log(`  ✓ Created: #job-search (${channelId})`);
  } else if (createRes.error === "name_taken") {
    // Channel exists, find it
    const listRes = await slackApi("conversations.list", primaryToken, {
      types: "public_channel",
      limit: 100,
    });
    const channel = listRes.channels?.find((c: { name: string }) => c.name === "job-search");
    if (channel) {
      channelId = channel.id;
      console.log(`  — #job-search already exists (${channelId})`);
    } else {
      console.error("  ✗ Channel exists but couldn't find it");
      return;
    }
  } else {
    console.error(`  ✗ Failed: ${createRes.error}`);
    return;
  }

  // Invite all bots to the channel
  console.log("\nInviting bots to #job-search...");
  for (const bot of BOT_TOKENS) {
    if (!bot.userId) continue;

    // Each bot joins the channel using its own token
    const joinRes = await slackApi("conversations.join", bot.token, {
      channel: channelId,
    });

    if (joinRes.ok) {
      console.log(`  ✓ ${bot.name} joined`);
    } else {
      console.log(`  ⚠ ${bot.name}: ${joinRes.error}`);
    }
  }

  // Post welcome message
  console.log("\nPosting welcome message...");
  await slackApi("chat.postMessage", primaryToken, {
    channel: channelId,
    text: "FACT: The AI Colleague Team is now assembled in this channel. I, Dwight Schrute — er, Scout — will be coordinating operations. You may address any of us by name or simply state your request. We will determine the appropriate responder.\n\n🔍 Scout (Dwight) — Job discovery\n📊 Analyst (Oscar) — Scoring\n✉️ Strategist (Jim) — Outreach\n⏰ Ops (Angela) — Pipeline\n🛠️ Engineer (Darryl) — Platform\n📚 Coach (Holly) — Learning\n🐛 QA (Stanley) — Bugs\n\nAs Assistant Regional Manager of your job search, I recommend we begin immediately.",
  });

  console.log(`\n✓ Done! Channel ID: ${channelId}`);
  console.log(`Add this to .env: SLACK_CHANNEL_ID=${channelId}`);
}

main().catch(console.error);
