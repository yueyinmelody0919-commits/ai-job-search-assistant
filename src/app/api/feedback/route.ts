/**
 * POST /api/feedback — Submit feedback on a job (thumbs up/down)
 * GET /api/feedback — Get feedback history
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
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
