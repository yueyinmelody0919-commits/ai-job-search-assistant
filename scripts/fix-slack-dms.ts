/**
 * Enable DMs for all 7 Slack bots by updating their manifests.
 * Usage: npx tsx scripts/fix-slack-dms.ts
 */

import * as fs from "fs";
import * as path from "path";

// Load .env
const envPath = path.resolve(__dirname, "../.env");
const envContent = fs.readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.+)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const CONFIG_TOKEN = env.SLACK_ACCESS_TOKEN;
if (!CONFIG_TOKEN) {
  console.error("SLACK_ACCESS_TOKEN not found in .env");
  process.exit(1);
}

// Load app data
const appsPath = path.resolve(__dirname, "../data/slack-apps.json");
const apps = JSON.parse(fs.readFileSync(appsPath, "utf-8")) as Array<{
  name: string;
  appId: string;
}>;

async function updateManifest(appId: string, name: string) {
  // First, export current manifest
  const exportRes = await fetch("https://slack.com/api/apps.manifest.export", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CONFIG_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ app_id: appId }),
  });

  const exportData = await exportRes.json();
  if (!exportData.ok) {
    console.error(`  ✗ ${name}: Failed to export manifest — ${exportData.error}`);
    return false;
  }

  const manifest = exportData.manifest;

  // Enable Messages Tab with DMs
  if (!manifest.features) manifest.features = {};
  manifest.features.app_home = {
    home_tab_enabled: false,
    messages_tab_enabled: true,
    messages_tab_read_only_enabled: false,
  };

  // Update the manifest
  const updateRes = await fetch("https://slack.com/api/apps.manifest.update", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CONFIG_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ app_id: appId, manifest }),
  });

  const updateData = await updateRes.json();
  if (!updateData.ok) {
    console.error(`  ✗ ${name}: Failed to update — ${updateData.error} ${JSON.stringify(updateData.errors || [])}`);
    return false;
  }

  return true;
}

async function main() {
  console.log("Enabling DMs for all Slack bots...\n");

  let fixed = 0;
  for (const app of apps) {
    const success = await updateManifest(app.appId, app.name);
    if (success) {
      console.log(`  ✓ ${app.name} — DMs enabled`);
      fixed++;
    }
  }

  console.log(`\n${fixed}/${apps.length} bots updated.`);
}

main().catch(console.error);
