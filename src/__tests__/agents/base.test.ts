import { describe, it, expect, vi } from "vitest";
import { BaseAgent, type AgentConfig } from "@/lib/agents/base";

// Mock the dependencies
vi.mock("@/lib/integrations/claude", () => ({
  chat: vi.fn().mockResolvedValue("Test response from Claude"),
}));

vi.mock("@/lib/memory/store", () => ({
  logAgentAction: vi.fn().mockResolvedValue(undefined),
  storeKnowledge: vi.fn().mockResolvedValue(1),
  storeAgentLearning: vi.fn().mockResolvedValue(undefined),
}));

const testConfig: AgentConfig = {
  name: "test_agent",
  displayName: "Test Agent",
  character: "Test Character",
  role: "Testing",
  emoji: "🧪",
  slackBotTokenEnv: "TEST_BOT_TOKEN",
  slackAppTokenEnv: "TEST_APP_TOKEN",
  systemPrompt: "You are a test agent.",
};

class TestAgent extends BaseAgent {}

describe("BaseAgent", () => {
  it("creates an agent with config", () => {
    const agent = new TestAgent(testConfig);
    expect(agent.config.name).toBe("test_agent");
    expect(agent.config.character).toBe("Test Character");
  });

  it("responds to messages using Claude", async () => {
    const agent = new TestAgent(testConfig);
    const response = await agent.respond("Hello");
    expect(response).toBe("Test response from Claude");
  });

  it("maintains conversation history per channel", async () => {
    const agent = new TestAgent(testConfig);

    await agent.respond("Message 1", "channel-1");
    await agent.respond("Message 2", "channel-2");

    expect(agent.conversationHistory.get("channel-1")).toHaveLength(2);
    expect(agent.conversationHistory.get("channel-2")).toHaveLength(2);
  });

  it("checks Slack configuration", () => {
    const agent = new TestAgent(testConfig);

    // No env vars set
    expect(agent.isSlackConfigured()).toBe(false);

    // Set env vars
    vi.stubEnv("TEST_BOT_TOKEN", "xoxb-test");
    vi.stubEnv("TEST_APP_TOKEN", "xapp-test");
    expect(agent.isSlackConfigured()).toBe(true);
  });
});
