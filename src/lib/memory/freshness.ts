/**
 * Freshness management for the knowledge base.
 * Ensures agents work with up-to-date information.
 */

import { db, schema } from "../db";
import { sql, and, lt, eq } from "drizzle-orm";

/**
 * Check if a knowledge entry is still fresh.
 */
export function isFresh(expiresAt: string | null): boolean {
  if (!expiresAt) return true; // No expiry = always fresh
  return new Date(expiresAt) > new Date();
}

/**
 * Decay freshness scores for all knowledge entries.
 * Called periodically (e.g., daily) to reduce freshness over time.
 */
export async function decayFreshness(
  decayRate: number = 0.95
): Promise<void> {
  await db
    .update(schema.knowledge)
    .set({
      freshnessScore: sql`${schema.knowledge.freshnessScore} * ${decayRate}`,
    });
}

/**
 * Get stale knowledge entries that need refreshing.
 * Returns entries whose freshness score has dropped below threshold
 * or whose expiry date has passed.
 */
export async function getStaleEntries(
  freshnessThreshold: number = 0.3
): Promise<
  Array<{ id: number; category: string; title: string; agent: string }>
> {
  return db
    .select({
      id: schema.knowledge.id,
      category: schema.knowledge.category,
      title: schema.knowledge.title,
      agent: schema.knowledge.agent,
    })
    .from(schema.knowledge)
    .where(
      sql`${schema.knowledge.freshnessScore} < ${freshnessThreshold} OR (${schema.knowledge.expiresAt} IS NOT NULL AND ${schema.knowledge.expiresAt} < datetime('now'))`
    );
}

/**
 * Refresh a knowledge entry with new content.
 */
export async function refreshEntry(
  id: number,
  newContent: string,
  newSourceUrl?: string,
  newExpiresInDays?: number
): Promise<void> {
  const expiresAt = newExpiresInDays
    ? new Date(
        Date.now() + newExpiresInDays * 24 * 60 * 60 * 1000
      ).toISOString()
    : undefined;

  await db
    .update(schema.knowledge)
    .set({
      content: newContent,
      sourceUrl: newSourceUrl || undefined,
      freshnessScore: 1.0,
      expiresAt: expiresAt || undefined,
    })
    .where(eq(schema.knowledge.id, id));
}

/**
 * Get knowledge freshness report for dashboard.
 */
export async function getFreshnessReport(): Promise<{
  total: number;
  fresh: number;
  stale: number;
  expired: number;
}> {
  const all = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.knowledge);

  const fresh = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.knowledge)
    .where(
      and(
        sql`${schema.knowledge.freshnessScore} >= 0.3`,
        sql`(${schema.knowledge.expiresAt} IS NULL OR ${schema.knowledge.expiresAt} > datetime('now'))`
      )
    );

  const expired = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.knowledge)
    .where(
      and(
        sql`${schema.knowledge.expiresAt} IS NOT NULL`,
        lt(schema.knowledge.expiresAt, new Date().toISOString())
      )
    );

  const total = all[0]?.count ?? 0;
  const freshCount = fresh[0]?.count ?? 0;
  const expiredCount = expired[0]?.count ?? 0;

  return {
    total,
    fresh: freshCount,
    stale: total - freshCount - expiredCount,
    expired: expiredCount,
  };
}
