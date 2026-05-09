/**
 * Creates all 7 Slack bot apps using the apps.manifest.create API.
 * Requires SLACK_ACCESS_TOKEN (configuration token) in .env.
 *
 * Usage: npx tsx scripts/create-slack-apps.ts
 */

import * as fs from "fs";
import * as path from "path";

// Load .env manually
const envPath = path.resolve(__dirname, "../.env");
const envContent = fs.readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const CONFIG_TOKEN = env.SLACK_ACCESS_TOKEN;
if (!CONFIG_TOKEN) {
  console.error("SLACK_ACCESS_TOKEN not found in .env");
  process.exit(1);
}

const bots = [
  {
    envPrefix: "SLACK_SCOUT",
    name: "Scout (Dwight)",
    description: "FACT: I am the best job finder. Assistant Regional Manager of your job search.",
    color: "#8B4513",
  },
  {
    envPrefix: "SLACK_ANALYST",
    name: "Analyst (Oscar)",
    description: "Actually, the data suggests you should listen to me.",
    color: "#1E3A5F",
  },
  {
    envPrefix: "SLACK_STRATEGIST",
    name: "Strategist (Jim)",
    description: "So here's what I'm thinking... *looks at camera*",
    color: "#2E8B57",
  },
  {
    envPrefix: "SLACK_OPS",
    name: "Ops (Angela)",
    description: "Your follow-up is OVERDUE. I have organized this by priority.",
    color: "#800020",
  },
  {
    envPrefix: "SLACK_ENGINEER",
    name: "Engineer (Darryl)",
    description: "Yo, I was thinking we could improve this. That's a Darryl Philbin original.",
    color: "#4A4A4A",
  },
  {
    envPrefix: "SLACK_COACH",
    name: "Coach (Holly)",
    description: "Ooh, that's a great growth opportunity! I put together a learning plan!",
    color: "#DA70D6",
  },
  {
    envPrefix: "SLACK_QA",
    name: "QA (Stanley)",
    description: "Did I stutter? The bug is fixed. Can I go home now?",
    color: "#696969",
  },
];

function buildManifest(bot: (typeof bots)[0]) {
  return {
    display_information: {
      name: bot.name,
      description: bot.description,
      background_color: bot.color,
    },
    features: {
      bot_user: {
        display_name: bot.name,
        always_online: true,
      },
    },
    oauth_config: {
      scopes: {
        bot: [
          "app_mentions:read",
          "chat:write",
          "im:history",
          "im:read",
          "im:write",
          "channels:history",
          "channels:read",
          "files:write",
          "users:read",
        ],
      },
    },
    settings: {
      event_subscriptions: {
        bot_events: ["app_mention", "message.im"],
      },
      interactivity: {
        is_enabled: false,
      },
      org_deploy_enabled: false,
      socket_mode_enabled: true,
      token_rotation_enabled: false,
    },
  };
}

async function createApp(bot: (typeof bots)[0]): Promise<{
  appId: string;
  clientId: string;
  clientSecret: string;
}> {
  const manifest = buildManifest(bot);

  const response = await fetch("https://slack.com/api/apps.manifest.create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CONFIG_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ manifest }),
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(
      `Failed to create ${bot.name}: ${data.error} - ${JSON.stringify(data.errors || data.response_metadata?.messages || [])}`
    );
  }

  return {
    appId: data.app_id,
    clientId: data.credentials?.client_id || "",
    clientSecret: data.credentials?.client_secret || "",
  };
}

async function installApp(appId: string, clientId: string, clientSecret: string): Promise<{
  botToken: string;
  appToken: string;
}> {
  // Step 1: Generate app-level token for Socket Mode
  const appTokenResponse = await fetch("https://slack.com/api/apps.token.create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CONFIG_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_id: appId,
      scopes: ["connections:write"],
      name: "socket-token",
    }),
  });

  // This might not work via config token - we'll try the manifest install flow
  const appTokenData = await appTokenResponse.json();

  // Step 2: Try to install via tooling API
  const installResponse = await fetch("https://slack.com/api/apps.install", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CONFIG_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_id: appId,
    }),
  });

  const installData = await installResponse.json();

  return {
    botToken: installData.bot_token || installData.access_token || "",
    appToken: appTokenData.token || "",
  };
}

async function main() {
  console.log("Creating 7 Slack bot apps...\n");

  const results: Array<{
    name: string;
    envPrefix: string;
    appId: string;
    botToken: string;
    appToken: string;
    oauthUrl: string;
  }> = [];

  for (const bot of bots) {
    try {
      console.log(`Creating ${bot.name}...`);
      const { appId, clientId, clientSecret } = await createApp(bot);
      console.log(`  ✓ Created: app_id=${appId}`);

      // Try to install and get tokens
      let botToken = "";
      let appToken = "";
      try {
        const tokens = await installApp(appId, clientId, clientSecret);
        botToken = tokens.botToken;
        appToken = tokens.appToken;
        if (botToken) console.log(`  ✓ Installed with bot token`);
        if (appToken) console.log(`  ✓ App-level token created`);
      } catch (e) {
        console.log(`  ⚠ Auto-install not available — manual OAuth needed`);
      }

      const oauthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=app_mentions:read,chat:write,im:history,im:read,im:write,channels:history,channels:read,files:write,users:read&redirect_uri=http://localhost:3000/api/auth/slack/callback`;

      results.push({
        name: bot.name,
        envPrefix: bot.envPrefix,
        appId,
        botToken,
        appToken,
        oauthUrl,
      });
    } catch (error) {
      console.error(`  ✗ Failed: ${error}`);
    }
  }

  // Output results
  console.log("\n\n=== RESULTS ===\n");

  const envLines: string[] = [];
  const manualInstallUrls: string[] = [];

  for (const r of results) {
    if (r.botToken && r.appToken) {
      envLines.push(`${r.envPrefix}_BOT_TOKEN=${r.botToken}`);
      envLines.push(`${r.envPrefix}_APP_TOKEN=${r.appToken}`);
    } else {
      manualInstallUrls.push(`${r.name}: ${r.oauthUrl}`);
      envLines.push(`# ${r.envPrefix}_BOT_TOKEN= (needs manual OAuth — see URL below)`);
      envLines.push(`# ${r.envPrefix}_APP_TOKEN= (generate at api.slack.com/apps/${r.appId})`);
    }
  }

  if (envLines.length > 0) {
    console.log("Add to .env:\n");
    console.log(envLines.join("\n"));
  }

  if (manualInstallUrls.length > 0) {
    console.log("\n\nManual install needed — visit these URLs and click Allow:\n");
    for (const url of manualInstallUrls) {
      console.log(url);
    }
  }

  // Save results to a file for reference
  fs.writeFileSync(
    path.resolve(__dirname, "../data/slack-apps.json"),
    JSON.stringify(results, null, 2)
  );
  console.log("\n\nResults saved to data/slack-apps.json");
}

main().catch(console.error);
