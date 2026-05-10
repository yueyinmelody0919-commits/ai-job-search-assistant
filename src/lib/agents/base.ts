/**
 * Base Agent class — shared logic for all AI colleagues.
 * Each agent has: a persona (system prompt), a Slack identity, access to
 * shared memory, and the ability to file bug reports.
 */

import { chat, type ClaudeMessage } from "../integrations/claude";
import { logAgentAction, storeKnowledge, storeAgentLearning } from "../memory/store";
import type { KnowledgeCategory } from "../memory/store";
import { fileBug } from "./bugs";

export interface AgentConfig {
  name: string;
  displayName: string;
  character: string;
  role: string;
  systemPrompt: string;
  slackBotTokenEnv: string;
  slackAppTokenEnv: string;
  emoji: string;
}

// Capabilities each agent knows about — used in error context
const AGENT_CAPABILITIES: Record<string, string[]> = {
  scout: ["search JSearch API", "search Adzuna API", "discover jobs", "research companies via Tavily"],
  analyst: ["score jobs via Claude API", "update Thompson Sampling weights", "process feedback"],
  strategist: ["draft emails via Claude API", "send emails via Gmail API", "look up contacts via Apollo"],
  ops: ["manage pipeline stages", "create Google Calendar events", "update Google Sheets tracker"],
  engineer: ["manage whitelist", "suggest features", "monitor agent performance"],
  coach: ["recommend learning resources", "identify skill gaps", "search courses via Tavily"],
  qa: ["investigate bugs", "monitor test results", "track error logs"],
};

export class BaseAgent {
  config: AgentConfig;
  conversationHistory: Map<string, ClaudeMessage[]> = new Map();

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Respond to a user message with the agent's persona.
   * Files a bug report if Claude API fails.
   */
  async respond(
    userMessage: string,
    channelId?: string
  ): Promise<string> {
    const history = this.conversationHistory.get(channelId || "default") || [];

    // Inject capability awareness into the system prompt
    const capabilities = AGENT_CAPABILITIES[this.config.name] || [];
    const capabilityNote = capabilities.length > 0
      ? `\n\nYour capabilities: ${capabilities.join(", ")}. If a user asks you to do something outside your capabilities, tell them which colleague can help. If you encounter an error using one of your capabilities, tell the user you've logged a bug report.`
      : "";

    try {
      const response = await chat(
        this.config.systemPrompt + capabilityNote,
        [...history, { role: "user", content: userMessage }],
        { temperature: 0.8, maxTokens: 1024 }
      );

      const updatedHistory = [
        ...history,
        { role: "user" as const, content: userMessage },
        { role: "assistant" as const, content: response },
      ].slice(-20);
      this.conversationHistory.set(channelId || "default", updatedHistory);

      await this.log("respond", {
        userMessage: userMessage.slice(0, 100),
        responseLength: response.length,
        channelId,
      });

      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      await this.reportBug(
        `${this.config.displayName} failed to respond`,
        `Agent could not generate a response to user message.`,
        err,
        { userMessage: userMessage.slice(0, 500), channelId }
      );
      return `I ran into an issue and logged bug report #${Date.now()}. Stanley is on it. (${err.message})`;
    }
  }

  /**
   * File a bug report with a clean, actionable fix prompt.
   */
  async reportBug(
    title: string,
    description: string,
    error?: Error,
    context?: Record<string, unknown>,
    severity?: "low" | "medium" | "high" | "critical"
  ): Promise<number> {
    const bugId = await fileBug({
      title,
      description,
      reportedBy: this.config.name,
      severity: severity || (error ? "high" : "medium"),
      errorMessage: error?.message,
      stackTrace: error?.stack,
      context: {
        agent: this.config.name,
        role: this.config.role,
        capabilities: AGENT_CAPABILITIES[this.config.name],
        ...context,
      },
    });

    await this.log("bug_reported", { bugId, title, severity });
    return bugId;
  }

  async log(action: string, details?: Record<string, unknown>, outcome?: string): Promise<void> {
    await logAgentAction(this.config.name, action, details, outcome);
  }

  async remember(category: KnowledgeCategory, title: string, content: string, sourceUrl?: string, expiresInDays?: number): Promise<void> {
    await storeKnowledge(this.config.name, category, title, content, sourceUrl, expiresInDays);
  }

  async learn(learning: string): Promise<void> {
    await storeAgentLearning(this.config.name, learning);
  }

  getBotToken(): string | undefined {
    return process.env[this.config.slackBotTokenEnv];
  }

  getAppToken(): string | undefined {
    return process.env[this.config.slackAppTokenEnv];
  }

  isSlackConfigured(): boolean {
    return !!(this.getBotToken() && this.getAppToken());
  }
}
