/**
 * Slack message router — routes incoming messages to the correct agent.
 */

import type { BaseAgent } from "@/lib/agents/base";
import { getMeme, shouldSendMeme } from "@/lib/agents/memes";

export interface SlackMessage {
  text: string;
  userId: string;
  channelId: string;
  threadTs?: string;
  botId?: string;
}

export class AgentRouter {
  private agents: Map<string, BaseAgent> = new Map();
  private botUserIds: Map<string, string> = new Map(); // botUserId → agentName

  registerAgent(agent: BaseAgent, botUserId?: string) {
    this.agents.set(agent.config.name, agent);
    if (botUserId) {
      this.botUserIds.set(botUserId, agent.config.name);
    }
  }

  getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Determine which agent should handle a message.
   * In DMs, route to the specific bot that received the DM.
   * In channels, route based on @mention.
   */
  routeMessage(
    message: SlackMessage,
    recipientBotUserId?: string
  ): BaseAgent | null {
    // If this is a DM to a specific bot
    if (recipientBotUserId) {
      const agentName = this.botUserIds.get(recipientBotUserId);
      if (agentName) return this.agents.get(agentName) || null;
    }

    // Check for @mentions in message text
    for (const [botUserId, agentName] of this.botUserIds) {
      if (message.text.includes(`<@${botUserId}>`)) {
        return this.agents.get(agentName) || null;
      }
    }

    // Keyword-based routing for untagged channel messages
    const text = message.text.toLowerCase();

    if (text.includes("find") || text.includes("search") || text.includes("discover") || text.includes("scout")) {
      return this.agents.get("scout") || null;
    }
    if (text.includes("score") || text.includes("analyze") || text.includes("compare") || text.includes("analyst")) {
      return this.agents.get("analyst") || null;
    }
    if (text.includes("email") || text.includes("draft") || text.includes("outreach") || text.includes("network") || text.includes("strategist")) {
      return this.agents.get("strategist") || null;
    }
    if (text.includes("pipeline") || text.includes("status") || text.includes("follow") || text.includes("schedule") || text.includes("ops")) {
      return this.agents.get("ops") || null;
    }
    if (text.includes("feature") || text.includes("build") || text.includes("whitelist") || text.includes("engineer")) {
      return this.agents.get("engineer") || null;
    }
    if (text.includes("learn") || text.includes("skill") || text.includes("course") || text.includes("coach")) {
      return this.agents.get("coach") || null;
    }
    if (text.includes("bug") || text.includes("broken") || text.includes("error") || text.includes("fix") || text.includes("qa")) {
      return this.agents.get("qa") || null;
    }

    return null;
  }

  /**
   * Get a meme response if the situation warrants it.
   */
  async getMemeForAgent(
    agentName: string,
    situation: string
  ): Promise<string | null> {
    const agent = this.agents.get(agentName);
    if (!agent) return null;

    const characterMap: Record<string, string> = {
      scout: "dwight",
      analyst: "oscar",
      strategist: "jim",
      ops: "angela",
      engineer: "darryl",
      coach: "holly",
      qa: "stanley",
    };

    const character = characterMap[agentName];
    if (!character) return null;

    if (!shouldSendMeme(situation)) return null;

    return getMeme(character, situation);
  }
}
