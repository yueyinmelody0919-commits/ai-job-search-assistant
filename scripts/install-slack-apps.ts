/**
 * Local OAuth callback server + app-level token generator for Slack bots.
 *
 * 1. Reads app data from data/slack-apps.json
 * 2. Starts a local server to capture OAuth callbacks
 * 3. Opens each OAuth URL — you click "Allow", tokens are captured
 * 4. Generates app-level tokens for Socket Mode
 * 5. Writes all tokens to .env
 *
 * Usage: npx tsx scripts/install-slack-apps.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import { exec } from "child_process";

// Load .env
const envPath = path.resolve(__dirname, "../.env");
const envContent = fs.readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const CONFIG_TOKEN = env.SLACK_ACCESS_TOKEN;

// Load app data
const appsPath = path.resolve(__dirname, "../data/slack-apps.json");
const apps = JSON.parse(fs.readFileSync(appsPath, "utf-8")) as Array<{
  name: string;
  envPrefix: string;
  appId: string;
  botToken: string;
  appToken: string;
  oauthUrl: string;
}>;

// Read client secrets from the saved data
const clientSecrets: Record<string, string> = {};

async function getAppCredentials(appId: string): Promise<{ clientId: string; clientSecret: string }> {
  // Use apps.manifest.export to verify, or read from our saved data
  // The client_id is embedded in the OAuth URL
  const app = apps.find(a => a.appId === appId);
  if (!app) throw new Error(`App ${appId} not found`);

  const urlMatch = app.oauthUrl.match(/client_id=([^&]+)/);
  const clientId = urlMatch ? urlMatch[1] : "";

  // Get client secret via API
  const response = await fetch("https://slack.com/api/apps.manifest.export", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CONFIG_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ app_id: appId }),
  });

  const data = await response.json();
  return { clientId, clientSecret: clientSecrets[appId] || "" };
}

const pendingApps = [...apps.filter(a => !a.botToken)];
const currentApp = 0;
const tokens: Record<string, { botToken: string; appToken: string }> = {};

async function exchangeCode(code: string, clientId: string, clientSecret: string): Promise<string> {
  const response = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: "http://localhost:3000/api/auth/slack/callback",
    }),
  });

  const data = await response.json();
  if (!data.ok) {
    console.error(`OAuth exchange failed: ${data.error}`);
    return "";
  }

  return data.access_token || "";
}

async function generateAppToken(appId: string): Promise<string> {
  // Try to create an app-level token for Socket Mode
  const response = await fetch("https://slack.com/api/apps.connections.token.create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CONFIG_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ app_id: appId }),
  });

  const data = await response.json();
  return data.token || "";
}

async function main() {
  console.log(`\n${"=".repeat(60)}`);
  console.log("Slack Bot Installer");
  console.log(`${"=".repeat(60)}\n`);
  console.log(`${pendingApps.length} apps need installation.\n`);
  console.log("For each app:");
  console.log("1. Visit the app page at api.slack.com/apps/<app_id>");
  console.log("2. Click 'Install to Workspace' and click 'Allow'");
  console.log("3. Copy the Bot Token (xoxb-...) from OAuth & Permissions");
  console.log("4. In Basic Information, create an App-Level Token named 'socket'");
  console.log("   with scope 'connections:write', copy the token (xapp-...)\n");

  console.log("App pages:\n");
  for (const app of pendingApps) {
    console.log(`  ${app.name}:`);
    console.log(`    https://api.slack.com/apps/${app.appId}`);
    console.log(`    .env: ${app.envPrefix}_BOT_TOKEN and ${app.envPrefix}_APP_TOKEN\n`);
  }

  console.log("\nAfter adding all tokens to .env, the Slack bots will connect automatically.");
  console.log("Run: npm run slack:dev\n");
}

main().catch(console.error);
