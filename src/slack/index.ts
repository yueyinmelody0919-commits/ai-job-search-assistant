/**
 * Main Slack bot process — manages all 7 AI colleagues.
 * Runs as a separate process from the Next.js dashboard.
 *
 * Usage: npm run slack:dev
 */

import { App, LogLevel } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import { AgentRouter } from "./router";
import { scoutAgent } from "./personas/dwight";
import { analystAgent } from "./personas/oscar";
import { strategistAgent } from "./personas/jim";
import { opsAgent } from "./personas/angela";
import { engineerAgent } from "./personas/darryl";
import { coachAgent } from "./personas/holly";
import { qaAgent } from "./personas/stanley";
import { logAgentAction } from "@/lib/memory/store";

// All agent instances
const allAgents = [
  scoutAgent,
  analystAgent,
  strategistAgent,
  opsAgent,
  engineerAgent,
  coachAgent,
  qaAgent,
];

const router = new AgentRouter();

// Create a Slack Bolt app for each agent that has credentials
const apps: Array<{ agent: typeof allAgents[0]; app: App; client: WebClient }> = [];

async function initializeAgents() {
  console.log("Initializing AI Colleague Team...\n");

  for (const agent of allAgents) {
    const botToken = agent.getBotToken();
    const appToken = agent.getAppToken();

    if (!botToken || !appToken) {
      console.log(`  ⚠ ${agent.config.displayName}: Missing tokens, skipping`);
      continue;
    }

    try {
      const app = new App({
        token: botToken,
        appToken: appToken,
        socketMode: true,
        logLevel: LogLevel.WARN,
      });

      const client = new WebClient(botToken);

      // Get bot user ID
      const authResult = await client.auth.test();
      const botUserId = authResult.user_id as string;

      router.registerAgent(agent, botUserId);
      apps.push({ agent, app, client });

      console.log(`  ✓ ${agent.config.displayName} (${botUserId})`);
    } catch (error) {
      console.error(`  ✗ ${agent.config.displayName}: ${error}`);
    }
  }

  console.log(`\n${apps.length} agents online.\n`);
}

function setupMessageHandlers() {
  for (const { agent, app, client } of apps) {
    // Handle DMs
    app.message(async ({ message, say }) => {
      // Skip bot messages to prevent loops
      if ("bot_id" in message && message.bot_id) return;
      if (!("text" in message) || !message.text) return;

      const text = message.text;
      const channelId = message.channel;

      try {
        console.log(`[${agent.config.name}] DM: ${text.slice(0, 80)}...`);

        const response = await agent.respond(text, channelId);

        // Send response
        await say({
          text: response,
          thread_ts: "thread_ts" in message ? message.thread_ts : undefined,
        });

        // Maybe send a meme
        const meme = await router.getMemeForAgent(
          agent.config.name,
          detectSituation(text, response)
        );
        if (meme) {
          await say({
            blocks: [
              {
                type: "image",
                image_url: meme,
                alt_text: `${agent.config.character} meme`,
              },
            ],
            thread_ts: "thread_ts" in message ? message.thread_ts : undefined,
          });
        }
      } catch (error) {
        console.error(`[${agent.config.name}] Error:`, error);
        await say("I ran into an issue processing that. Stanley has been notified.");
      }
    });

    // Handle @mentions in channels
    app.event("app_mention", async ({ event, say }) => {
      const text = event.text;
      const channelId = event.channel;

      try {
        console.log(`[${agent.config.name}] Mention: ${text.slice(0, 80)}...`);

        // Strip the bot mention from the text
        const cleanText = text.replace(/<@[A-Z0-9]+>/g, "").trim();

        const response = await agent.respond(cleanText, channelId);

        await say({
          text: response,
          thread_ts: event.thread_ts || event.ts,
        });

        // Maybe send a meme
        const meme = await router.getMemeForAgent(
          agent.config.name,
          detectSituation(cleanText, response)
        );
        if (meme) {
          await say({
            blocks: [
              {
                type: "image",
                image_url: meme,
                alt_text: `${agent.config.character} meme`,
              },
            ],
            thread_ts: event.thread_ts || event.ts,
          });
        }
      } catch (error) {
        console.error(`[${agent.config.name}] Error:`, error);
      }
    });
  }
}

/**
 * Detect the "situation" for meme selection based on message content.
 */
function detectSituation(userMessage: string, agentResponse: string): string {
  const combined = `${userMessage} ${agentResponse}`.toLowerCase();

  if (combined.includes("found") || combined.includes("success") || combined.includes("great")) return "success";
  if (combined.includes("wrong") || combined.includes("actually") || combined.includes("incorrect")) return "correcting";
  if (combined.includes("overdue") || combined.includes("late") || combined.includes("miss")) return "disapproval";
  if (combined.includes("fixed") || combined.includes("done") || combined.includes("complete")) return "done";
  if (combined.includes("prank") || combined.includes("dwight")) return "prank";
  if (combined.includes("learn") || combined.includes("course") || combined.includes("grow")) return "excited";

  return "casual";
}

async function startAllApps() {
  const startPromises = apps.map(async ({ agent, app }) => {
    await app.start();
    console.log(`  ▶ ${agent.config.displayName} listening`);
  });

  await Promise.all(startPromises);

  await logAgentAction("system", "slack_startup", {
    agentsOnline: apps.length,
    agents: apps.map((a) => a.agent.config.name),
  });

  console.log("\nAll agents are listening. Press Ctrl+C to stop.\n");
}

// Main
async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   Melody's AI Colleague Team             ║");
  console.log("║   Dunder Mifflin Branch                  ║");
  console.log("╚══════════════════════════════════════════╝\n");

  await initializeAgents();

  if (apps.length === 0) {
    console.log("No agents have valid Slack credentials.");
    console.log("Add bot tokens to .env and restart.");
    console.log("See docs/slack-setup.md for instructions.");
    process.exit(0);
  }

  setupMessageHandlers();
  await startAllApps();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
