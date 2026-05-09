/**
 * GET /api/agents — Get agent status and recent activity
 * POST /api/agents — Trigger agent actions (scan, research, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { desc, eq, sql } from "drizzle-orm";
import { webSearch, AGENT_SEARCH_QUERIES, researchCompany } from "@/lib/integrations/websearch";
import { storeKnowledge, logAgentAction } from "@/lib/memory/store";

export async function GET() {
  try {
    const agents = [
      "scout", "analyst", "strategist", "ops", "engineer", "coach", "qa",
    ];

    const agentData = await Promise.all(
      agents.map(async (name) => {
        // Get last action
        const lastAction = await db
          .select()
          .from(schema.agentLogs)
          .where(eq(schema.agentLogs.agent, name))
          .orderBy(desc(schema.agentLogs.createdAt))
          .limit(1);

        // Get action count today
        const todayCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.agentLogs)
          .where(
            sql`${schema.agentLogs.agent} = ${name} AND ${schema.agentLogs.createdAt} > datetime('now', '-1 day')`
          );

        // Get learnings count
        const learnings = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.agentLearnings)
          .where(eq(schema.agentLearnings.agent, name));

        return {
          name,
          lastAction: lastAction[0] || null,
          actionsToday: todayCount[0]?.count ?? 0,
          totalLearnings: learnings[0]?.count ?? 0,
          status: lastAction[0] ? "active" : "idle",
        };
      })
    );

    return NextResponse.json({ agents: agentData });
  } catch {
    return NextResponse.json({ error: "Failed to fetch agent data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, agent, params } = await request.json();

    switch (action) {
      case "research": {
        // Trigger periodic web research for an agent
        const queries = AGENT_SEARCH_QUERIES[agent];
        if (!queries) {
          return NextResponse.json({ error: `No queries for agent: ${agent}` }, { status: 400 });
        }

        const results = [];
        for (const query of queries.slice(0, 2)) {
          try {
            const searchResult = await webSearch(query, {
              maxResults: 3,
              includeAnswer: true,
            });

            // Store findings in shared knowledge
            if (searchResult.answer) {
              await storeKnowledge(
                agent,
                "market",
                query,
                searchResult.answer,
                searchResult.results[0]?.url,
                7
              );
            }

            results.push({
              query,
              resultCount: searchResult.results.length,
              answer: searchResult.answer?.slice(0, 200),
            });
          } catch {
            results.push({ query, error: "Search failed" });
          }
        }

        await logAgentAction(agent, "periodic_research", {
          queriesRun: results.length,
        });

        return NextResponse.json({ action: "research", agent, results });
      }

      case "research_company": {
        const { company } = params || {};
        if (!company) {
          return NextResponse.json({ error: "company required" }, { status: 400 });
        }

        const result = await researchCompany(company);

        // Store in knowledge base
        if (result.answer) {
          await storeKnowledge(
            "scout",
            "company",
            `Company Research: ${company}`,
            result.answer,
            result.results[0]?.url,
            30
          );
        }

        await logAgentAction("scout", "research_company", { company });

        return NextResponse.json({ company, research: result });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
