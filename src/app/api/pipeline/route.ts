/**
 * GET /api/pipeline — Get pipeline stats and entries
 * PUT /api/pipeline — Update a job's pipeline stage
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc, sql } from "drizzle-orm";
import { logAgentAction } from "@/lib/memory/store";

const STAGES = [
  "discovered",
  "queued",
  "outreached",
  "applied",
  "interviewing",
  "offer",
  "passed",
] as const;

export async function GET() {
  try {
    // Get count per stage
    const stageCounts = await Promise.all(
      STAGES.map(async (stage) => {
        const count = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.pipeline)
          .where(eq(schema.pipeline.stage, stage));
        return { stage, count: count[0]?.count ?? 0 };
      })
    );

    // Get recent pipeline entries with job details
    const recentEntries = await db
      .select({
        pipeline: schema.pipeline,
        job: schema.jobs,
      })
      .from(schema.pipeline)
      .innerJoin(schema.jobs, eq(schema.pipeline.jobId, schema.jobs.id))
      .orderBy(desc(schema.pipeline.updatedAt))
      .limit(50);

    return NextResponse.json({
      stages: stageCounts,
      entries: recentEntries,
      total: stageCounts.reduce((sum, s) => sum + s.count, 0),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch pipeline" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, stage, notes } = body;

    if (!jobId || !stage) {
      return NextResponse.json(
        { error: "jobId and stage required" },
        { status: 400 }
      );
    }

    if (!STAGES.includes(stage)) {
      return NextResponse.json(
        { error: `Invalid stage. Must be one of: ${STAGES.join(", ")}` },
        { status: 400 }
      );
    }

    await db
      .update(schema.pipeline)
      .set({
        stage,
        notes: notes || undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.pipeline.jobId, jobId));

    await logAgentAction("ops", "update_pipeline", {
      jobId,
      newStage: stage,
    });

    return NextResponse.json({ success: true, jobId, stage });
  } catch {
    return NextResponse.json(
      { error: "Failed to update pipeline" },
      { status: 500 }
    );
  }
}
