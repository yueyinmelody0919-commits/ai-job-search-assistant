/**
 * POST /api/feedback — Submit feedback on a job (thumbs up/down)
 * PATCH /api/feedback — Boost a job's score (thumbs up action)
 * GET /api/feedback — Get feedback history
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { desc, eq, and } from "drizzle-orm";
import { processFeedback, getCurrentWeights } from "@/lib/scoring/feedback";
import { logAgentAction } from "@/lib/memory/store";

export async function GET() {
  try {
    const feedbackHistory = await db
      .select()
      .from(schema.feedback)
      .orderBy(desc(schema.feedback.createdAt))
      .limit(100);

    const currentWeights = await getCurrentWeights();

    return NextResponse.json({
      feedback: feedbackHistory,
      currentWeights,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, type, tag, comment } = body;

    if (!jobId || !type) {
      return NextResponse.json(
        { error: "jobId and type are required" },
        { status: 400 }
      );
    }

    if (!["thumbs_up", "thumbs_down"].includes(type)) {
      return NextResponse.json(
        { error: "type must be 'thumbs_up' or 'thumbs_down'" },
        { status: 400 }
      );
    }

    const updatedWeights = await processFeedback(jobId, type, tag, comment);

    await logAgentAction("analyst", "process_feedback", {
      jobId,
      type,
      tag,
      weightsUpdated: updatedWeights.length,
    });

    return NextResponse.json({
      success: true,
      updatedWeights,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process feedback" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/feedback — Boost a job's score to at least 70 on thumbs-up
 */
export async function PATCH(request: NextRequest) {
  try {
    const { jobId, action } = await request.json();

    if (action === "boost" && jobId) {
      // Get current scores for this job
      const scores = await db
        .select()
        .from(schema.jobScores)
        .where(
          and(
            eq(schema.jobScores.jobId, jobId),
            eq(schema.jobScores.passNumber, 2)
          )
        );

      if (scores.length > 0) {
        const currentOverall = scores[0].overallScore || 0;

        if (currentOverall < 70) {
          // Boost overall score to 70 for all dimension rows
          for (const score of scores) {
            await db
              .update(schema.jobScores)
              .set({ overallScore: 70 })
              .where(eq(schema.jobScores.id, score.id));
          }
        }
      }

      // Move to queued stage if not already past it
      const pipeline = await db
        .select()
        .from(schema.pipeline)
        .where(eq(schema.pipeline.jobId, jobId))
        .limit(1);

      if (pipeline[0] && pipeline[0].stage === "discovered") {
        await db
          .update(schema.pipeline)
          .set({ stage: "queued", updatedAt: new Date().toISOString() })
          .where(eq(schema.pipeline.id, pipeline[0].id));
      }

      await logAgentAction("analyst", "score_boosted", {
        jobId,
        reason: "user_thumbs_up",
        newScore: 70,
      });

      return NextResponse.json({ success: true, jobId, boostedTo: 70 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Boost failed" }, { status: 500 });
  }
}
