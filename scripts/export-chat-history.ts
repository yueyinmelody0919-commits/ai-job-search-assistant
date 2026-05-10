/**
 * Export the full Claude Code conversation history to a well-organized markdown file.
 * Usage: npx tsx scripts/export-chat-history.ts
 */

import * as fs from "fs";
import * as path from "path";

const JSONL_PATH = path.resolve(
  process.env.HOME || "~",
  ".claude/projects/-Users-melodyyin-Desktop-Leena/18175066-b227-49c5-8860-ecedcc43f4f4.jsonl"
);
const OUTPUT_PATH = path.resolve(__dirname, "../FULL_CHAT_HISTORY.md");

interface Entry {
  type: string;
  message?: { role: string; content: string | Array<{ type: string; text?: string }> };
  timestamp?: string;
  isMeta?: boolean;
  uuid?: string;
}

function extractText(content: string | Array<{ type: string; text?: string }> | undefined): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.filter(c => c.type === "text" && c.text).map(c => c.text!).join("\n");
  }
  return "";
}

function isSystemMessage(text: string): boolean {
  if (text.startsWith("<local-command")) return true;
  if (text.startsWith("<command-name>")) return true;
  if (text.startsWith("<local-command-stdout>")) return true;
  if (text.startsWith("<local-command-caveat>")) return true;
  if (text.startsWith("<bash-")) return true;
  if (text.startsWith("<system-reminder>")) return true;
  if (text.startsWith("<available-deferred")) return true;
  if (text.match(/^<[a-z-]+>/)) return true;
  return false;
}

function isUserMessage(text: string): boolean {
  if (!text || text.length < 3) return false;
  if (isSystemMessage(text)) return false;
  // Extract real user text from messages that contain system tags
  return true;
}

function cleanUserMessage(text: string): string {
  // Remove XML tags but keep real content
  let cleaned = text;
  // Remove specific tags and their content
  cleaned = cleaned.replace(/<local-command-caveat>[\s\S]*?<\/local-command-caveat>/g, "");
  cleaned = cleaned.replace(/<local-command-stdout>[\s\S]*?<\/local-command-stdout>/g, "");
  cleaned = cleaned.replace(/<bash-input>[\s\S]*?<\/bash-input>/g, "");
  cleaned = cleaned.replace(/<bash-stdout>[\s\S]*?<\/bash-stdout>/g, "");
  cleaned = cleaned.replace(/<bash-stderr>[\s\S]*?<\/bash-stderr>/g, "");
  cleaned = cleaned.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "");
  cleaned = cleaned.replace(/<command-name>[\s\S]*?<\/command-name>/g, "");
  cleaned = cleaned.replace(/<command-message>[\s\S]*?<\/command-message>/g, "");
  cleaned = cleaned.replace(/<command-args>[\s\S]*?<\/command-args>/g, "");
  cleaned = cleaned.replace(/<available-deferred-tools>[\s\S]*?<\/available-deferred-tools>/g, "");
  return cleaned.trim();
}

function formatTS(ts: string | undefined): string {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  } catch { return ""; }
}

// Section detection
const SECTIONS: Array<{ pattern: RegExp; title: string; phase: string }> = [
  { pattern: /sign into my github/i, title: "GitHub Authentication", phase: "Setup" },
  { pattern: /use https:\/\/context7/i, title: "MCP Server Configuration", phase: "Setup" },
  { pattern: /important job interview/i, title: "Assignment Review & Initial Strategy", phase: "Planning" },
  { pattern: /Go with the recommendations/i, title: "Multi-Agent Architecture & Scoring Research", phase: "Planning" },
  { pattern: /create an engineer AI colleague/i, title: "Full System Design — 7 Agents, TDD, Hosting", phase: "Planning" },
  { pattern: /go ahead with phase two/i, title: "Phase 2 — Core Engine & Integrations", phase: "Building" },
  { pattern: /I added the slack team id/i, title: "Phase 4 — Slack Bot Creation & Agent Personas", phase: "Building" },
  { pattern: /keep building phase 5/i, title: "Phase 5 — Advanced Dashboard (React Flow, Charts)", phase: "Building" },
  { pattern: /what is left to do to have the dashboard show real data/i, title: "Wiring Dashboard to Real API Data", phase: "Integration" },
  { pattern: /can you create and save the tokens for the slack bots/i, title: "Slack Bot Token Setup", phase: "Integration" },
  { pattern: /Which of these fields should I use for the bot token/i, title: "Bot Token vs App Token Clarification", phase: "Integration" },
  { pattern: /I added the bot tokens/i, title: "Slack Bot Testing & Verification", phase: "Integration" },
  { pattern: /access blocked.*oauth/i, title: "Google OAuth Troubleshooting", phase: "Debugging" },
  { pattern: /redirect_uri_mismatch/i, title: "OAuth Redirect URI Fix", phase: "Debugging" },
  { pattern: /added the refresh token/i, title: "Google Integration Live", phase: "Integration" },
  { pattern: /Sending messages to this app has been turned off/i, title: "Slack DM Permission Fix", phase: "Debugging" },
  { pattern: /get a single channel/i, title: "Slack Channel-Based Communication", phase: "Integration" },
  { pattern: /I asked Find me.*no one responded/i, title: "Fixing Slack Channel Listener", phase: "Debugging" },
  { pattern: /get a michael scott/i, title: "Michael Scott Avatar", phase: "Polish" },
  { pattern: /have them just reply in the channel/i, title: "Multi-Bot Responses & Proactive Updates", phase: "Enhancement" },
  { pattern: /agents to be aware of what their capabilities/i, title: "Bug Reporting System", phase: "Enhancement" },
  { pattern: /have you been saving my prompts/i, title: "Prompt Logging & Avatar Fixes", phase: "Documentation" },
  { pattern: /agents should have context.*fresh/i, title: "Agent Context System & Permissions", phase: "Enhancement" },
  { pattern: /almost all of the leads don't fit/i, title: "Fix: Scoring, Filters, Dashboard Cleanup", phase: "Bug Fixes" },
  { pattern: /instead of just approve.*disapprove/i, title: "Written Feedback for Jobs", phase: "Enhancement" },
  { pattern: /network map doesn't do anything/i, title: "Fix: Remove Mock Data from Network", phase: "Bug Fixes" },
  { pattern: /links on learning/i, title: "Fix: L&D Links", phase: "Bug Fixes" },
  { pattern: /focus more on content/i, title: "Content-Focused Dashboard", phase: "Enhancement" },
  { pattern: /agent page.*see and modify/i, title: "Agent Settings & Configuration", phase: "Enhancement" },
  { pattern: /can you access our full chat history/i, title: "Complete Chat History Export", phase: "Documentation" },
];

function main() {
  console.log("Reading conversation log...");
  const raw = fs.readFileSync(JSONL_PATH, "utf-8");
  const lines = raw.split("\n").filter(l => l.trim());

  // Parse all entries
  const messages: Array<{ role: "user" | "assistant"; text: string; ts: string }> = [];

  for (const line of lines) {
    try {
      const entry: Entry = JSON.parse(line);
      if (!entry.message) continue;

      const role = entry.message.role;
      const rawText = extractText(entry.message.content);
      const ts = entry.timestamp || "";

      if (role === "user") {
        if (entry.isMeta) continue;
        const cleaned = cleanUserMessage(rawText);
        if (cleaned && cleaned.length > 3 && !isSystemMessage(cleaned)) {
          messages.push({ role: "user", text: cleaned, ts });
        }
      } else if (role === "assistant") {
        const text = cleanUserMessage(rawText);
        if (text && text.length > 15) {
          messages.push({ role: "assistant", text, ts });
        }
      }
    } catch { /* skip */ }
  }

  console.log(`Extracted ${messages.length} messages (${messages.filter(m => m.role === "user").length} user, ${messages.filter(m => m.role === "assistant").length} assistant)`);

  // Build markdown
  const md: string[] = [];
  md.push("# Complete Chat History — Melody's AI Colleague Team");
  md.push("");
  md.push("> Full conversation log from the build session of the Leena AI interview assignment.");
  md.push(`> **Date**: May 9, 2026 | **Messages**: ${messages.length} | **User prompts**: ${messages.filter(m => m.role === "user").length}`);
  md.push(`> **Project**: Multi-agent Job Search Assistant — 7 AI colleagues with The Office personas`);
  md.push("");
  md.push("---");
  md.push("");
  md.push("## How to Read This File");
  md.push("");
  md.push("- **User messages** (Melody) are shown in full as blockquotes");
  md.push("- **Claude responses** are collapsed by default — click ▶ to expand");
  md.push("- **Section headers** mark major topic shifts");
  md.push("- Phases: Setup → Planning → Building → Integration → Debugging → Enhancement → Documentation → Bug Fixes");
  md.push("- All timestamps in NYC time (ET)");
  md.push("");
  md.push("---");
  md.push("");

  let currentPhase = "";
  let msgNum = 0;

  for (const msg of messages) {
    msgNum++;

    // Check for section break
    if (msg.role === "user") {
      for (const sec of SECTIONS) {
        if (sec.pattern.test(msg.text)) {
          if (sec.phase !== currentPhase) {
            currentPhase = sec.phase;
            md.push("");
            md.push("---");
            md.push("");
            md.push(`# Phase: ${currentPhase}`);
            md.push("");
          }
          md.push(`## ${sec.title}`);
          md.push("");
          break;
        }
      }
    }

    const ts = formatTS(msg.ts);
    const tsLabel = ts ? ` — *${ts} ET*` : "";

    if (msg.role === "user") {
      md.push(`### 💬 Melody${tsLabel}`);
      md.push("");
      for (const line of msg.text.split("\n")) {
        md.push(`> ${line}`);
      }
      md.push("");
    } else {
      const preview = msg.text.slice(0, 120).replace(/\n/g, " ").replace(/[#*`]/g, "").trim();
      md.push(`<details>`);
      md.push(`<summary>🤖 <strong>Claude</strong>${tsLabel} — <em>${preview}...</em></summary>`);
      md.push("");
      md.push("```");
      md.push(msg.text);
      md.push("```");
      md.push("");
      md.push(`</details>`);
      md.push("");
    }
  }

  fs.writeFileSync(OUTPUT_PATH, md.join("\n"));
  const sizeKB = (fs.statSync(OUTPUT_PATH).size / 1024).toFixed(0);
  console.log(`\nWritten to: FULL_CHAT_HISTORY.md (${sizeKB} KB)`);
}

main();
