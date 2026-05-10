import { describe, it, expect, vi } from "vitest";
import { AgentRouter } from "@/slack/router";
import { BaseAgent } from "@/lib/agents/base";

vi.mock("@/lib/integrations/claude", () => ({
  chat: vi.fn().mockResolvedValue("Mock response"),
}));
vi.mock("@/lib/memory/store", () => ({
  logAgentAction: vi.fn(),
  storeKnowledge: vi.fn(),
  storeAgentLearning: vi.fn(),
}));

function createMockAgent(name: string): BaseAgent {
  return new (class extends BaseAgent {})(
    {
      name,
      displayName: `${name} Agent`,
      character: name,
      role: name,
      emoji: "🤖",
      slackBotTokenEnv: `${name.toUpperCase()}_BOT_TOKEN`,
      slackAppTokenEnv: `${name.toUpperCase()}_APP_TOKEN`,
      systemPrompt: `You are ${name}.`,
    }
  );
}

describe("AgentRouter", () => {
  it("registers and retrieves agents", () => {
    const router = new AgentRouter();
    const agent = createMockAgent("scout");
    router.registerAgent(agent, "U001");

    expect(router.getAgent("scout")).toBe(agent);
    expect(router.getAllAgents()).toHaveLength(1);
  });

  it("routes DMs to the correct bot", () => {
    const router = new AgentRouter();
    const scout = createMockAgent("scout");
    const analyst = createMockAgent("analyst");
    router.registerAgent(scout, "U001");
    router.registerAgent(analyst, "U002");

    const result = router.routeMessage(
      { text: "Hello", userId: "user1", channelId: "DM" },
      "U001"
    );
    expect(result?.config.name).toBe("scout");
  });

  it("routes @mentions to the correct agent", () => {
    const router = new AgentRouter();
    const scout = createMockAgent("scout");
    const analyst = createMockAgent("analyst");
    router.registerAgent(scout, "U001");
    router.registerAgent(analyst, "U002");

    const result = router.routeMessage({
      text: "Hey <@U002> score this job",
      userId: "user1",
      channelId: "C001",
    });
    expect(result?.config.name).toBe("analyst");
  });

  it("routes based on keywords when no mention", () => {
    const router = new AgentRouter();
    router.registerAgent(createMockAgent("scout"), "U001");
    router.registerAgent(createMockAgent("analyst"), "U002");
    router.registerAgent(createMockAgent("strategist"), "U003");
    router.registerAgent(createMockAgent("ops"), "U004");
    router.registerAgent(createMockAgent("engineer"), "U005");
    router.registerAgent(createMockAgent("coach"), "U006");
    router.registerAgent(createMockAgent("qa"), "U007");

    expect(
      router.routeMessage({ text: "find me new jobs", userId: "u", channelId: "c" })?.config.name
    ).toBe("scout");

    expect(
      router.routeMessage({ text: "score this role", userId: "u", channelId: "c" })?.config.name
    ).toBe("analyst");

    expect(
      router.routeMessage({ text: "draft an email", userId: "u", channelId: "c" })?.config.name
    ).toBe("strategist");

    expect(
      router.routeMessage({ text: "pipeline status", userId: "u", channelId: "c" })?.config.name
    ).toBe("ops");

    expect(
      router.routeMessage({ text: "build a feature", userId: "u", channelId: "c" })?.config.name
    ).toBe("engineer");

    expect(
      router.routeMessage({ text: "learn new skills", userId: "u", channelId: "c" })?.config.name
    ).toBe("coach");

    expect(
      router.routeMessage({ text: "there's a bug", userId: "u", channelId: "c" })?.config.name
    ).toBe("qa");
  });

  it("returns null for unroutable messages", () => {
    const router = new AgentRouter();
    const result = router.routeMessage({
      text: "hello world",
      userId: "u",
      channelId: "c",
    });
    expect(result).toBeNull();
  });
});
