/**
 * Base Agent class — shared logic for all AI colleagues.
 * Each agent has: a persona (system prompt), a Slack identity, and access to shared memory.
 */

import { chat, type ClaudeMessage } from "../integrations/claude";
import { logAgentAction, storeKnowledge, storeAgentLearning } from "../memory/store";
import type { KnowledgeCategory } from "../memory/store";

export interface AgentConfig {
  name: string;         // e.g. "scout"
  displayName: string;  // e.g. "Scout (Dwight)"
  character: string;    // e.g. "Dwight Schrute"
  role: string;         // e.g. "Discovery & Research"
  systemPrompt: string;
  slackBotTokenEnv: string;
  slackAppTokenEnv: string;
  emoji: string;
}

export class BaseAgent {
  config: AgentConfig;
  conversationHistory: Map<string, ClaudeMessage[]> = new Map();

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Respond to a user message with the agent's persona.
   */
  async respond(
    userMessage: string,
    channelId?: string
  ): Promise<string> {
    const history = this.conversationHistory.get(channelId || "default") || [];

    const response = await chat(
      this.config.systemPrompt,
      [...history, { role: "user", content: userMessage }],
      { temperature: 0.8, maxTokens: 1024 }
    );

    // Update conversation history (keep last 20 messages)
    const updatedHistory = [
      ...history,
      { role: "user" as const, content: userMessage },
      { role: "assistant" as const, content: response },
    ].slice(-20);
    this.conversationHistory.set(channelId || "default", updatedHistory);

    // Log the action
    await this.log("respond", {
      userMessage: userMessage.slice(0, 100),
      responseLength: response.length,
      channelId,
    });

    return response;
  }

  /**
   * Log an action to the shared memory system.
   */
  async log(
    action: string,
    details?: Record<string, unknown>,
    outcome?: string
  ): Promise<void> {
    await logAgentAction(this.config.name, action, details, outcome);
  }

  /**
   * Store knowledge in the shared memory.
   */
  async remember(
    category: KnowledgeCategory,
    title: string,
    content: string,
    sourceUrl?: string,
    expiresInDays?: number
  ): Promise<void> {
    await storeKnowledge(
      this.config.name,
      category,
      title,
      content,
      sourceUrl,
      expiresInDays
    );
  }

  /**
   * Record a learning for self-improvement.
   */
  async learn(learning: string): Promise<void> {
    await storeAgentLearning(this.config.name, learning);
  }

  /**
   * Get Slack bot token from environment.
   */
  getBotToken(): string | undefined {
    return process.env[this.config.slackBotTokenEnv];
  }

  /**
   * Get Slack app token from environment.
   */
  getAppToken(): string | undefined {
    return process.env[this.config.slackAppTokenEnv];
  }

  /**
   * Check if this agent has valid Slack credentials.
   */
  isSlackConfigured(): boolean {
    return !!(this.getBotToken() && this.getAppToken());
  }
}
