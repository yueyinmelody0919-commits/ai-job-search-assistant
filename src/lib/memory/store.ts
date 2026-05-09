/**
 * Central Memory System.
 * Shared knowledge base for all agents with freshness management.
 */

import { db, schema } from "../db";
import { eq, and, lt, desc, sql } from "drizzle-orm";
import type { KnowledgeEntry } from "../db/schema";

export type KnowledgeCategory =
  | "market"
  | "company"
  | "skill"
  | "tool"
  | "trend";

/**
 * Store a knowledge entry from an agent.
 */
export async function storeKnowledge(
  agent: string,
  category: KnowledgeCategory,
  title: string,
  content: string,
  sourceUrl?: string,
  expiresInDays?: number
): Promise<number> {
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : getDefaultExpiry(category);

  const result = await db.insert(schema.knowledge).values({
    agent,
    category,
    title,
    content,
    sourceUrl: sourceUrl || null,
    freshnessScore: 1.0,
    expiresAt,
  });

  return Number(result.lastInsertRowid);
}

/**
 * Query knowledge by category and/or agent.
 */
export async function queryKnowledge(
  options?: {
    category?: KnowledgeCategory;
    agent?: string;
    limit?: number;
    freshOnly?: boolean;
  }
): Promise<KnowledgeEntry[]> {
  const conditions = [];

  if (options?.category) {
    conditions.push(eq(schema.knowledge.category, options.category));
  }
  if (options?.agent) {
    conditions.push(eq(schema.knowledge.agent, options.agent));
  }
  if (options?.freshOnly) {
    conditions.push(
      sql`(${schema.knowledge.expiresAt} IS NULL OR ${schema.knowledge.expiresAt} > datetime('now'))`
    );
  }

  const query = db
    .select()
    .from(schema.knowledge)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(schema.knowledge.createdAt))
    .limit(options?.limit ?? 50);

  return query;
}

/**
 * Search knowledge by text content.
 */
export async function searchKnowledge(
  searchText: string,
  limit: number = 10
): Promise<KnowledgeEntry[]> {
  // SQLite LIKE-based search (FTS would be better for production)
  return db
    .select()
    .from(schema.knowledge)
    .where(
      sql`(${schema.knowledge.title} LIKE ${'%' + searchText + '%'} OR ${schema.knowledge.content} LIKE ${'%' + searchText + '%'})`
    )
    .orderBy(desc(schema.knowledge.freshnessScore))
    .limit(limit);
}

/**
 * Clean up expired knowledge entries.
 */
export async function cleanupExpired(): Promise<number> {
  const result = await db
    .delete(schema.knowledge)
    .where(
      and(
        sql`${schema.knowledge.expiresAt} IS NOT NULL`,
        lt(schema.knowledge.expiresAt, new Date().toISOString())
      )
    );

  return result.rowsAffected;
}

/**
 * Log an agent action.
 */
export async function logAgentAction(
  agent: string,
  action: string,
  details?: Record<string, unknown>,
  outcome?: string
): Promise<void> {
  await db.insert(schema.agentLogs).values({
    agent,
    action,
    details: details ? JSON.stringify(details) : null,
    outcome: outcome || "success",
  });
}

/**
 * Store an agent learning for self-improvement.
 */
export async function storeAgentLearning(
  agent: string,
  learning: string
): Promise<void> {
  await db.insert(schema.agentLearnings).values({
    agent,
    learning,
    appliedToPrompt: false,
  });
}

/**
 * Get recent agent logs.
 */
export async function getRecentLogs(
  agent?: string,
  limit: number = 20
): Promise<Array<{
  agent: string;
  action: string;
  details: string | null;
  outcome: string | null;
  createdAt: string;
}>> {
  const conditions = agent ? eq(schema.agentLogs.agent, agent) : undefined;

  return db
    .select()
    .from(schema.agentLogs)
    .where(conditions)
    .orderBy(desc(schema.agentLogs.createdAt))
    .limit(limit);
}

function getDefaultExpiry(category: KnowledgeCategory): string {
  const now = Date.now();
  const days = {
    market: 7,
    company: 30,
    skill: 90,
    tool: 30,
    trend: 14,
  };
  return new Date(
    now + (days[category] || 30) * 24 * 60 * 60 * 1000
  ).toISOString();
}
