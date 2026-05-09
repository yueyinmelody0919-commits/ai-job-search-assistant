/**
 * Quick test: verify all 7 Slack bots can authenticate.
 * Usage: npx tsx scripts/test-slack-bots.ts
 */

import * as fs from "fs";
import * as path from "path";

// Load .env
const envPath = path.resolve(__dirname, "../.env");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.+)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const bots = [
  { name: "Scout (Dwight)", tokenEnv: "SLACK_SCOUT_BOT_TOKEN" },
  { name: "Analyst (Oscar)", tokenEnv: "SLACK_ANALYST_BOT_TOKEN" },
  { name: "Strategist (Jim)", tokenEnv: "SLACK_STRATEGIST_BOT_TOKEN" },
  { name: "Ops (Angela)", tokenEnv: "SLACK_OPS_BOT_TOKEN" },
  { name: "Engineer (Darryl)", tokenEnv: "SLACK_ENGINEER_BOT_TOKEN" },
  { name: "Coach (Holly)", tokenEnv: "SLACK_COACH_BOT_TOKEN" },
  { name: "QA (Stanley)", tokenEnv: "SLACK_QA_BOT_TOKEN" },
];

async function testBot(name: string, token: string): Promise<{ name: string; ok: boolean; userId?: string; error?: string }> {
  try {
    const response = await fetch("https://slack.com/api/auth.test", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.ok) {
      return { name, ok: true, userId: data.user_id };
    } else {
      return { name, ok: false, error: data.error };
    }
  } catch (err) {
    return { name, ok: false, error: String(err) };
  }
}

async function main() {
  console.log("Testing Slack bot connections...\n");

  let passed = 0;
  let failed = 0;

  for (const bot of bots) {
    const token = process.env[bot.tokenEnv];
    if (!token) {
      console.log(`  ✗ ${bot.name}: No token configured`);
      failed++;
      continue;
    }

    const result = await testBot(bot.name, token);
    if (result.ok) {
      console.log(`  ✓ ${bot.name} — authenticated (user: ${result.userId})`);
      passed++;
    } else {
      console.log(`  ✗ ${bot.name} — failed: ${result.error}`);
      failed++;
    }
  }

  console.log(`\n${passed}/${bots.length} bots authenticated successfully.`);
  if (failed > 0) {
    console.log(`${failed} bots failed — check tokens in .env.`);
  }

  // Also test sending a message with Scout
  if (passed > 0) {
    console.log("\nAttempting to post a test message with Scout...");
    const scoutToken = process.env.SLACK_SCOUT_BOT_TOKEN;
    if (scoutToken) {
      // Find a channel to post in (try listing conversations)
      const channelsRes = await fetch("https://slack.com/api/conversations.list?types=public_channel&limit=5", {
        headers: { Authorization: `Bearer ${scoutToken}` },
      });
      const channelsData = await channelsRes.json();

      if (channelsData.ok && channelsData.channels?.length > 0) {
        const channel = channelsData.channels[0];
        console.log(`  Found channel: #${channel.name} (${channel.id})`);

        // Post a test message
        const postRes = await fetch("https://slack.com/api/chat.postMessage", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${scoutToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channel: channel.id,
            text: "FACT: Scout (Dwight) is online and ready to find jobs. As Assistant Regional Manager of your job search, I will not rest until every opportunity has been identified and cataloged. 🔍",
          }),
        });

        const postData = await postRes.json();
        if (postData.ok) {
          console.log(`  ✓ Message posted successfully to #${channel.name}`);
        } else {
          console.log(`  ✗ Message failed: ${postData.error}`);
          if (postData.error === "not_in_channel") {
            console.log(`    → Scout needs to be invited to #${channel.name}. Type /invite @Scout (Dwight) in the channel.`);
          }
        }
      } else {
        console.log("  No channels found or bot can't list them.");
      }
    }
  }
}

main().catch(console.error);
