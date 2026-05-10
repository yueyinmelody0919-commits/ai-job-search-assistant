/**
 * GET /api/agents/config — Return agent configs, capabilities, recent logs, scheduled tasks
 * GET /api/agents/config?agent=scout — Return detailed config for a specific agent
 * PATCH /api/agents/config — Toggle a capability on/off for an agent
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { logAgentAction } from "@/lib/memory/store";

const AGENT_CAPABILITIES: Record<string, string[]> = {
  scout: ["Search JSearch API", "Search Adzuna API", "Discover jobs", "Research companies via Tavily"],
  analyst: ["Score jobs via Claude API", "Update Thompson Sampling weights", "Process feedback"],
  strategist: ["Draft emails via Claude API", "Send emails via Gmail API", "Look up contacts via Apollo"],
  ops: ["Manage pipeline stages", "Create Google Calendar events", "Update Google Sheets tracker"],
  engineer: ["Manage whitelist", "Suggest features", "Monitor agent performance"],
  coach: ["Recommend learning resources", "Identify skill gaps", "Search courses via Tavily"],
  qa: ["Investigate bugs", "Monitor test results", "Track error logs"],
};

const AGENT_SCHEDULES: Record<string, Array<{ task: string; frequency: string }>> = {
  scout: [
    { task: "Scan JSearch + Adzuna for new listings", frequency: "Every 6 hours" },
    { task: "Web search for hiring trends", frequency: "Daily" },
  ],
  analyst: [
    { task: "Score unscored jobs via Claude API", frequency: "After each scan" },
    { task: "Market research on hot companies", frequency: "Daily" },
  ],
  strategist: [
    { task: "Auto-draft emails for 85+ scored jobs", frequency: "After scoring" },
  ],
  ops: [
    { task: "Check for overdue follow-ups", frequency: "Daily 9am ET" },
    { task: "Update pipeline stage tracking", frequency: "On new activity" },
  ],
  engineer: [
    { task: "Review agent logs and user feedback", frequency: "Weekly" },
    { task: "Suggest features based on usage patterns", frequency: "Weekly" },
  ],
  coach: [
    { task: "Review job requirements vs profile", frequency: "Weekly" },
    { task: "Scan for relevant courses and certifications", frequency: "Weekly" },
  ],
  qa: [
    { task: "Monitor error logs and test results", frequency: "Continuous" },
    { task: "Archive resolved bugs", frequency: "Weekly" },
  ],
};

const AGENT_META: Record<string, { displayName: string; character: string; role: string; avatar: string }> = {
  scout: { displayName: "Scout", character: "Dwight Schrute", role: "Discovery & Research", avatar: "/avatars/dwight.jpg" },
  analyst: { displayName: "Analyst", character: "Oscar Martinez", role: "Scoring & Market Intel", avatar: "/avatars/oscar.jpg" },
  strategist: { displayName: "Strategist", character: "Jim Halpert", role: "Outreach & Networking", avatar: "/avatars/jim.jpg" },
  ops: { displayName: "Ops", character: "Angela Martin", role: "Pipeline & Scheduling", avatar: "/avatars/angela.jpg" },
  engineer: { displayName: "Engineer", character: "Darryl Philbin", role: "Platform Development", avatar: "/avatars/darryl.jpg" },
  coach: { displayName: "Coach", character: "Holly Flax", role: "Learning & Development", avatar: "/avatars/holly.jpg" },
  qa: { displayName: "QA", character: "Stanley Hudson", role: "Quality Assurance", avatar: "/avatars/stanley.jpg" },
};

export { AGENT_CAPABILITIES };

async function getCapabilitiesWithOverrides(agentName: string) {
  const baseCaps = AGENT_CAPABILITIES[agentName] || [];
  const overrides = await db
    .select()
    .from(schema.agentConfigs)
    .where(eq(schema.agentConfigs.agent, agentName));

  const overrideMap = new Map(overrides.map((o) => [o.capability, o.enabled]));

  return baseCaps.map((cap) => ({
    name: cap,
    enabled: overrideMap.get(cap) ?? true,
  }));
}

export async function GET(request: NextRequest) {
  const agentName = request.nextUrl.searchParams.get("agent");

  try {
    const agents = agentName ? [agentName] : Object.keys(AGENT_META);

    const results = await Promise.all(
      agents.map(async (name) => {
        const meta = AGENT_META[name];
        if (!meta) return null;

        const recentLogs = await db
          .select()
          .from(schema.agentLogs)
          .where(eq(schema.agentLogs.agent, name))
          .orderBy(desc(schema.agentLogs.createdAt))
          .limit(20);

        const totalActions = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.agentLogs)
          .where(eq(schema.agentLogs.agent, name));

        const learnings = await db
          .select()
          .from(schema.agentLearnings)
          .where(eq(schema.agentLearnings.agent, name))
          .orderBy(desc(schema.agentLearnings.createdAt))
          .limit(10);

        const knowledge = await db
          .select()
          .from(schema.knowledge)
          .where(eq(schema.knowledge.agent, name))
          .orderBy(desc(schema.knowledge.createdAt))
          .limit(10);

        const capabilities = await getCapabilitiesWithOverrides(name);

        return {
          name,
          ...meta,
          capabilities,
          schedule: AGENT_SCHEDULES[name] || [],
          totalActions: totalActions[0]?.count ?? 0,
          recentLogs,
          learnings,
          knowledge,
        };
      })
    );

    return NextResponse.json({ agents: results.filter(Boolean) });
  } catch {
    return NextResponse.json({ error: "Failed to fetch agent config" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { agent, capability, enabled } = await request.json();

    if (!agent || !capability || typeof enabled !== "boolean") {
      return NextResponse.json({ error: "agent, capability, and enabled (boolean) are required" }, { status: 400 });
    }

    if (!AGENT_META[agent]) {
      return NextResponse.json({ error: `Unknown agent: ${agent}` }, { status: 400 });
    }

    if (!AGENT_CAPABILITIES[agent]?.includes(capability)) {
      return NextResponse.json({ error: `Unknown capability "${capability}" for agent "${agent}"` }, { status: 400 });
    }

    // Upsert: check if row exists
    const existing = await db
      .select()
      .from(schema.agentConfigs)
      .where(
        and(
          eq(schema.agentConfigs.agent, agent),
          eq(schema.agentConfigs.capability, capability)
        )
      )
      .limit(1);

    if (existing[0]) {
      await db
        .update(schema.agentConfigs)
        .set({ enabled, updatedAt: new Date().toISOString() })
        .where(eq(schema.agentConfigs.id, existing[0].id));
    } else {
      await db.insert(schema.agentConfigs).values({
        agent,
        capability,
        enabled,
      });
    }

    await logAgentAction(agent, "capability_toggled", { capability, enabled });

    return NextResponse.json({ success: true, agent, capability, enabled });
  } catch {
    return NextResponse.json({ error: "Failed to update agent config" }, { status: 500 });
  }
}
