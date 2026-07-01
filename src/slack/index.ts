/**
 * Main Slack bot process — manages all 7 specialized AI agents.
 *
 * Features:
 * - Multi-bot responses: multiple agents can reply to the same message
 * - Proactive updates: scheduled check-ins twice daily
 * - Deep links: bots link to dashboard views when relevant
 * - All actions write to shared SQLite → dashboard reflects everything
 */

import "dotenv/config";
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
import { getMeme, shouldSendMeme } from "@/lib/agents/memes";
import { logAgentAction } from "@/lib/memory/store";
import type { BaseAgent } from "@/lib/agents/base";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const allAgents = [
  scoutAgent, analystAgent, strategistAgent, opsAgent,
  engineerAgent, coachAgent, qaAgent,
];

const router = new AgentRouter();
const agentClients: Map<string, WebClient> = new Map();
const botUserIds: Set<string> = new Set();
let jobSearchChannelId = "";

// Which agents might care about which topics (for multi-bot replies)
const TOPIC_AGENTS: Record<string, string[]> = {
  new_job: ["scout", "analyst"],           // Scout found it, Analyst should score
  scored_high: ["analyst", "strategist"],   // Analyst scored, Jim should draft
  email_draft: ["strategist", "ops"],       // Jim drafted, Angela tracks it
  pipeline: ["ops", "analyst"],             // Angela manages, Oscar provides data
  learning: ["coach", "analyst"],           // Holly teaches, Oscar identifies gaps
  feature: ["engineer", "qa"],              // Darryl builds, Stanley tests
};

function deepLink(path: string, label?: string): string {
  const url = `${DASHBOARD_URL}${path}`;
  return label ? `<${url}|${label}>` : `<${url}|View in Dashboard>`;
}

async function postAsAgent(agentName: string, channel: string, text: string, threadTs?: string) {
  const client = agentClients.get(agentName);
  if (!client) return;
  await client.chat.postMessage({ channel, text, thread_ts: threadTs, unfurl_links: false });
}

async function initializeAgents() {
  console.log("Initializing AI agent team...\n");
  for (const agent of allAgents) {
    const botToken = agent.getBotToken();
    const appToken = agent.getAppToken();
    if (!botToken || !appToken) {
      console.log(`  ⚠ ${agent.config.displayName}: Missing tokens, skipping`);
      continue;
    }
    try {
      const client = new WebClient(botToken);
      const authResult = await client.auth.test();
      const botUserId = authResult.user_id as string;
      router.registerAgent(agent, botUserId);
      agentClients.set(agent.config.name, client);
      botUserIds.add(botUserId);
      console.log(`  ✓ ${agent.config.displayName} (${botUserId})`);
    } catch (error) {
      console.error(`  ✗ ${agent.config.displayName}: ${error}`);
    }
  }
  console.log(`\n${agentClients.size} agents registered.\n`);
}

/**
 * Determine which agents should respond to a message.
 * Returns 1-3 agents based on relevance.
 */
function getRespondingAgents(text: string): BaseAgent[] {
  const lower = text.toLowerCase();
  const agents: BaseAgent[] = [];

  // Primary agent from router
  const primary = router.routeMessage(
    { text, userId: "", channelId: "" },
    undefined
  );
  if (primary) agents.push(primary);

  // Check if secondary agents should chime in
  if (lower.includes("score") && lower.includes("find")) {
    addIfMissing(agents, "scout");
    addIfMissing(agents, "analyst");
  }
  if (lower.includes("email") || lower.includes("outreach") || lower.includes("draft")) {
    addIfMissing(agents, "strategist");
    if (lower.includes("follow") || lower.includes("track")) addIfMissing(agents, "ops");
  }
  if (lower.includes("interview") || lower.includes("prep")) {
    addIfMissing(agents, "coach");
    addIfMissing(agents, "ops");
  }
  if (lower.includes("pipeline") || lower.includes("status")) {
    addIfMissing(agents, "ops");
    addIfMissing(agents, "analyst");
  }

  // Default to Scout if no one matched
  if (agents.length === 0) {
    const scout = router.getAgent("scout");
    if (scout) agents.push(scout);
  }

  return agents.slice(0, 3); // Max 3 respondents
}

function addIfMissing(agents: BaseAgent[], name: string) {
  if (!agents.find(a => a.config.name === name)) {
    const agent = router.getAgent(name);
    if (agent) agents.push(agent);
  }
}

/**
 * Enhance agent response with context about what other agents are doing
 * and include relevant deep links.
 */
function addDeepLinks(agentName: string, response: string, text: string): string {
  const lower = text.toLowerCase();
  let links = "";

  if (agentName === "scout" || lower.includes("job") || lower.includes("find")) {
    links += `\n${deepLink("/feed", "📋 Job Feed")}`;
  }
  if (agentName === "analyst" || lower.includes("score")) {
    links += `\n${deepLink("/preferences", "⚙️ Scoring Preferences")}`;
  }
  if (agentName === "ops" || lower.includes("pipeline") || lower.includes("status")) {
    links += `\n${deepLink("/pipeline", "📊 Pipeline")}`;
  }
  if (agentName === "strategist" || lower.includes("email") || lower.includes("outreach")) {
    links += `\n${deepLink("/feed", "✉️ Draft Emails")}`;
  }
  if (agentName === "coach" || lower.includes("learn")) {
    links += `\n${deepLink("/learning", "📚 Learning Dashboard")}`;
  }
  if (agentName === "engineer") {
    links += `\n${deepLink("/agents", "🤖 Agent Status")}`;
  }

  return links ? `${response}\n${links}` : response;
}

const characterMap: Record<string, string> = {
  scout: "dwight", analyst: "oscar", strategist: "jim", ops: "angela",
  engineer: "darryl", coach: "holly", qa: "stanley",
};

function detectSituation(text: string, response: string): string {
  const combined = `${text} ${response}`.toLowerCase();
  if (combined.includes("found") || combined.includes("success")) return "success";
  if (combined.includes("actually") || combined.includes("incorrect")) return "correcting";
  if (combined.includes("overdue") || combined.includes("late")) return "disapproval";
  if (combined.includes("fixed") || combined.includes("done")) return "done";
  return "casual";
}

/**
 * Scheduled proactive updates — runs twice daily.
 */
async function sendProactiveUpdate() {
  if (!jobSearchChannelId) return;

  console.log("[scheduled] Running proactive update...");

  // Scout: check for new jobs
  try {
    const scanRes = await fetch(`${DASHBOARD_URL}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "scan" }),
    });
    const scanData = await scanRes.json();

    if (scanData.count > 0) {
      const jobList = scanData.newJobs
        .slice(0, 5)
        .map((j: { title: string; company: string }) => `• *${j.title}* at ${j.company}`)
        .join("\n");

      await postAsAgent("scout", jobSearchChannelId,
        `FACT: I have completed my scheduled reconnaissance. ${scanData.count} new opportunities identified.\n\n${jobList}\n\n${deepLink("/feed", "📋 View all in Job Feed")}`
      );

      // Score them
      await fetch(`${DASHBOARD_URL}/api/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch: true }),
      });

      await postAsAgent("analyst", jobSearchChannelId,
        `Actually, I've already scored the new batch. ${deepLink("/feed", "Check the scores here")}.`
      );
    }
  } catch (err) {
    console.error("[scheduled] Scan failed:", err);
  }

  // Angela: check follow-ups
  try {
    const pipelineRes = await fetch(`${DASHBOARD_URL}/api/pipeline`);
    const pipelineData = await pipelineRes.json();
    const outreached = pipelineData.stages?.find((s: { stage: string }) => s.stage === "outreached")?.count || 0;

    if (outreached > 0) {
      await postAsAgent("ops", jobSearchChannelId,
        `You have ${outreached} outreached jobs awaiting replies. I have organized follow-ups by priority. You're welcome.\n\n${deepLink("/pipeline", "📊 View Pipeline")}`
      );
    }
  } catch { /* */ }

  await logAgentAction("system", "proactive_update", { timestamp: new Date().toISOString() });
}

async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   Job Search OS                          ║");
  console.log("║   Specialized AI agents                  ║");
  console.log("╚══════════════════════════════════════════╝\n");

  await initializeAgents();

  if (agentClients.size === 0) {
    console.log("No agents have valid Slack credentials.");
    process.exit(0);
  }

  // Find the #job-search channel
  const scoutClient = agentClients.get("scout")!;
  const channelsRes = await scoutClient.conversations.list({ types: "public_channel", limit: 100 });
  const jobChannel = channelsRes.channels?.find(c => c.name === "job-search");
  if (jobChannel) {
    jobSearchChannelId = jobChannel.id!;
    console.log(`  📢 Bound to #job-search (${jobSearchChannelId})`);
  }

  // Primary listener (Scout)
  const primaryAgent = allAgents.find(a => a.getBotToken() && a.getAppToken())!;
  const primaryApp = new App({
    token: primaryAgent.getBotToken()!,
    appToken: primaryAgent.getAppToken()!,
    socketMode: true,
    logLevel: LogLevel.WARN,
  });

  // Handle all channel messages
  primaryApp.message(async ({ message }) => {
    if ("bot_id" in message && message.bot_id) return;
    if ("subtype" in message && message.subtype) return;
    if (!("text" in message) || !message.text) return;

    const text = message.text;
    const channel = message.channel;
    const threadTs = "thread_ts" in message ? message.thread_ts : message.ts;
    const userId = "user" in message ? message.user : undefined;

    if (userId && botUserIds.has(userId)) return;

    console.log(`[channel] ${text.slice(0, 100)}`);

    // Get all agents that should respond
    const respondingAgents = getRespondingAgents(text);

    for (const agent of respondingAgents) {
      try {
        // Add context for secondary responders
        const contextPrefix = respondingAgents.length > 1 && agent !== respondingAgents[0]
          ? `[Following up on what ${respondingAgents[0].config.character} said] `
          : "";

        const response = await agent.respond(contextPrefix + text, channel);
        const withLinks = addDeepLinks(agent.config.name, response, text);

        console.log(`  → ${agent.config.name}: ${response.slice(0, 80)}...`);
        await postAsAgent(agent.config.name, channel, withLinks, threadTs);

        // Log to DB so dashboard sees it
        await logAgentAction(agent.config.name, "slack_response", {
          channel, userMessage: text.slice(0, 200), responseLength: response.length,
        });

        // Maybe meme (only first responder)
        if (agent === respondingAgents[0]) {
          const situation = detectSituation(text, response);
          const character = characterMap[agent.config.name];
          if (character && shouldSendMeme(situation)) {
            const meme = await getMeme(character, situation);
            if (meme) {
              const memeClient = agentClients.get(agent.config.name);
              if (memeClient) {
                await memeClient.chat.postMessage({
                  channel, text: "",
                  blocks: [{ type: "image", image_url: meme, alt_text: `${agent.config.character} meme` }],
                  thread_ts: threadTs,
                });
              }
            }
          }
        }

        // Small delay between multi-bot responses so they feel natural
        if (respondingAgents.length > 1) {
          await new Promise(r => setTimeout(r, 1500));
        }
      } catch (error) {
        console.error(`  ✗ ${agent.config.name} error:`, error);
        const err = error instanceof Error ? error : new Error(String(error));
        const bugId = await agent.reportBug(
          `${agent.config.displayName} failed to respond in Slack`,
          `Agent encountered an error while processing a channel message.`,
          err,
          { userMessage: text.slice(0, 500), channel },
        );
        await postAsAgent("qa", channel,
          `Did I stutter? Something broke with ${agent.config.character}. I've logged bug #${bugId}. ${deepLink("/bugs", "🐛 View Bug Reports")}`,
          threadTs
        );
      }
    }
  });

  // Handle @mentions
  primaryApp.event("app_mention", async ({ event }) => {
    const text = event.text;
    const channel = event.channel;
    const threadTs = event.thread_ts || event.ts;

    const cleanText = text.replace(/<@[A-Z0-9]+>/g, "").trim();
    const respondingAgents = getRespondingAgents(cleanText);

    for (const agent of respondingAgents) {
      try {
        const response = await agent.respond(cleanText, channel);
        const withLinks = addDeepLinks(agent.config.name, response, cleanText);
        await postAsAgent(agent.config.name, channel, withLinks, threadTs);
        await logAgentAction(agent.config.name, "slack_mention_response", {
          channel, userMessage: cleanText.slice(0, 200),
        });
      } catch (error) {
        console.error(`  ✗ ${agent.config.name} error:`, error);
      }
    }
  });

  await primaryApp.start();
  console.log("  ▶ Primary listener active\n");

  // Schedule proactive updates (every 12 hours)
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;
  setInterval(sendProactiveUpdate, TWELVE_HOURS);

  // Run first proactive update in 30 seconds (so we don't block startup)
  setTimeout(sendProactiveUpdate, 30_000);

  console.log("Routing (multi-bot enabled):");
  console.log("  Jobs/discovery → Scout + Analyst");
  console.log("  Scoring → Analyst + (Scout if finding too)");
  console.log("  Email/outreach → Strategist + Ops");
  console.log("  Pipeline/status → Ops + Analyst");
  console.log("  Interview/prep → Coach + Ops");
  console.log("  Features → Engineer + QA");
  console.log("  Anything else → Scout\n");
  console.log("Proactive updates: every 12 hours");
  console.log(`Dashboard: ${DASHBOARD_URL}\n`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
