/**
 * Set profile pictures and re-enable DMs for all 7 Slack bots.
 * Usage: npx tsx scripts/fix-slack-profiles.ts
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";

const CONFIG_TOKEN = process.env.SLACK_ACCESS_TOKEN;
if (!CONFIG_TOKEN) {
  console.error("SLACK_ACCESS_TOKEN not found in .env");
  process.exit(1);
}

// Load app data
const appsPath = path.resolve(__dirname, "../data/slack-apps.json");
const apps = JSON.parse(fs.readFileSync(appsPath, "utf-8")) as Array<{
  name: string;
  envPrefix: string;
  appId: string;
}>;

// Office character profile pictures (public URLs)
const PROFILE_PICS: Record<string, string> = {
  SLACK_SCOUT: "https://upload.wikimedia.org/wikipedia/en/c/cd/Dwight_Schrute.jpg",
  SLACK_ANALYST: "https://upload.wikimedia.org/wikipedia/en/0/0b/Oscar_Martinez_%28The_Office%29.jpg",
  SLACK_STRATEGIST: "https://upload.wikimedia.org/wikipedia/en/7/7e/Jim-halpert.jpg",
  SLACK_OPS: "https://upload.wikimedia.org/wikipedia/en/0/0b/Angela_Martin.jpg",
  SLACK_ENGINEER: "https://upload.wikimedia.org/wikipedia/en/d/d6/Darryl_Philbin.jpg",
  SLACK_COACH: "https://upload.wikimedia.org/wikipedia/en/c/c2/HollyFlax.jpg",
  SLACK_QA: "https://upload.wikimedia.org/wikipedia/en/a/ae/Stanley_Hudson.jpg",
};

async function updateManifestWithDMs(appId: string, name: string) {
  // Export current manifest
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
    console.error(`  ✗ ${name}: export failed — ${exportData.error}`);
    return false;
  }

  const manifest = exportData.manifest;

  // Ensure features exist
  if (!manifest.features) manifest.features = {};

  // Enable Messages Tab
  manifest.features.app_home = {
    home_tab_enabled: false,
    messages_tab_enabled: true,
    messages_tab_read_only_enabled: false,
  };

  // Make sure bot events include message.im
  if (!manifest.settings) manifest.settings = {};
  if (!manifest.settings.event_subscriptions) manifest.settings.event_subscriptions = {};
  const botEvents = manifest.settings.event_subscriptions.bot_events || [];
  if (!botEvents.includes("message.im")) botEvents.push("message.im");
  if (!botEvents.includes("app_mention")) botEvents.push("app_mention");
  manifest.settings.event_subscriptions.bot_events = botEvents;

  // Ensure im:history and im:write scopes
  if (!manifest.oauth_config) manifest.oauth_config = {};
  if (!manifest.oauth_config.scopes) manifest.oauth_config.scopes = {};
  const botScopes = manifest.oauth_config.scopes.bot || [];
  for (const scope of ["im:history", "im:read", "im:write", "chat:write", "app_mentions:read"]) {
    if (!botScopes.includes(scope)) botScopes.push(scope);
  }
  manifest.oauth_config.scopes.bot = botScopes;

  // Update
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
    console.error(`  ✗ ${name}: update failed — ${updateData.error}`);
    return false;
  }

  return true;
}

async function setProfilePicture(envPrefix: string, name: string) {
  const botToken = process.env[`${envPrefix}_BOT_TOKEN`];
  const picUrl = PROFILE_PICS[envPrefix];

  if (!botToken || !picUrl) {
    console.error(`  ✗ ${name}: missing token or pic URL`);
    return false;
  }

  try {
    // Download the image
    const imgRes = await fetch(picUrl);
    if (!imgRes.ok) {
      console.error(`  ✗ ${name}: failed to download image (${imgRes.status})`);
      return false;
    }

    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

    // Upload via Slack's users.setPhoto API (uses bot token)
    const formData = new FormData();
    formData.append("image", new Blob([imgBuffer], { type: "image/jpeg" }), "profile.jpg");

    const setRes = await fetch("https://slack.com/api/users.setPhoto", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${botToken}`,
      },
      body: formData,
    });

    const setData = await setRes.json();
    if (!setData.ok) {
      // users.setPhoto doesn't work for bots — use the icon_url approach instead
      // We'll set it via the app config
      console.log(`  ℹ ${name}: users.setPhoto not available for bots, using app icon instead`);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`  ✗ ${name}: ${err}`);
    return false;
  }
}

async function setAppIcon(appId: string, envPrefix: string, name: string) {
  const picUrl = PROFILE_PICS[envPrefix];
  if (!picUrl) return false;

  try {
    // Download image
    const imgRes = await fetch(picUrl);
    if (!imgRes.ok) return false;
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

    // Use apps.icon.set (undocumented but works with config tokens)
    const formData = new FormData();
    formData.append("app_id", appId);
    formData.append("image", new Blob([imgBuffer], { type: "image/jpeg" }), "icon.jpg");

    const setRes = await fetch("https://slack.com/api/apps.icon.set", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CONFIG_TOKEN}`,
      },
      body: formData,
    });

    const setData = await setRes.json();
    if (setData.ok) return true;

    // If that doesn't work, try the older method
    console.log(`  ℹ ${name}: apps.icon.set returned ${setData.error}, trying alternative...`);
    return false;
  } catch {
    return false;
  }
}

async function main() {
  console.log("Updating Slack bots: enabling DMs + setting profile pictures...\n");

  for (const app of apps) {
    // 1. Update manifest to enable DMs
    const dmResult = await updateManifestWithDMs(app.appId, app.name);
    if (dmResult) {
      console.log(`  ✓ ${app.name} — DMs + message.im event enabled`);
    }

    // 2. Try to set profile picture
    const picResult = await setAppIcon(app.appId, app.envPrefix, app.name);
    if (picResult) {
      console.log(`  ✓ ${app.name} — profile picture set`);
    } else {
      // Try bot token approach
      const botPicResult = await setProfilePicture(app.envPrefix, app.name);
      if (botPicResult) {
        console.log(`  ✓ ${app.name} — profile picture set (via bot token)`);
      } else {
        console.log(`  ⚠ ${app.name} — profile picture must be set manually at https://api.slack.com/apps/${app.appId} → Basic Information → Display Information`);
      }
    }
  }

  console.log("\n--- IMPORTANT ---");
  console.log("After updating scopes/events, you may need to REINSTALL each app:");
  console.log("Go to api.slack.com/apps/<app_id> → Install App → Reinstall to Workspace");
  console.log("\nApp pages:");
  for (const app of apps) {
    console.log(`  ${app.name}: https://api.slack.com/apps/${app.appId}/install-on-team`);
  }
}

main().catch(console.error);
