/**
 * GET /api/preferences — Return current scoring weights + feedback count
 */

import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const preferences = await db.select().from(schema.preferences);

    const feedbackCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.feedback);

    const feedbackCount = feedbackCountResult[0]?.count || 0;

    return NextResponse.json({
      preferences: preferences.map((p) => ({
        dimension: p.dimension,
        alpha: p.alpha,
        betaParam: p.beta_param,
        effectiveWeight: p.effectiveWeight,
      })),
      feedbackCount,
    });
  } catch {
    return NextResponse.json(
      { preferences: [], feedbackCount: 0 },
      { status: 200 }
    );
  }
}
