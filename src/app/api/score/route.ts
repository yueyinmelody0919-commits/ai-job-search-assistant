/**
 * POST /api/score — Score a job using Claude API
 * POST /api/score/batch — Score multiple unscored jobs
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, sql, isNull } from "drizzle-orm";
import { scoreJob } from "@/lib/integrations/claude";
import {
  SCORING_SYSTEM_PROMPT,
  buildScoringPrompt,
  type LLMScoreResult,
} from "@/lib/scoring/rubric";
import { computeCompositeScore, betaMean } from "@/lib/scoring/thompson";
import { logAgentAction } from "@/lib/memory/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, batch } = body;

    if (batch) {
      // Score all unscored jobs
      const unscoredJobs = await db
        .select()
        .from(schema.jobs)
        .where(isNull(schema.jobs.scoredAt))
        .limit(10);

      const results = [];
      for (const job of unscoredJobs) {
        try {
          const score = await scoreOneJob(job.id);
          results.push({ jobId: job.id, score, status: "scored" });
        } catch {
          results.push({ jobId: job.id, score: null, status: "failed" });
        }
      }

      await logAgentAction("analyst", "batch_score", {
        total: unscoredJobs.length,
        scored: results.filter((r) => r.status === "scored").length,
      });

      return NextResponse.json({ results });
    }

    if (jobId) {
      const score = await scoreOneJob(jobId);
      return NextResponse.json({ jobId, score });
    }

    return NextResponse.json(
      { error: "Provide jobId or batch: true" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Scoring failed" },
      { status: 500 }
    );
  }
}

async function scoreOneJob(
  jobId: number
): Promise<LLMScoreResult> {
  const job = await db
    .select()
    .from(schema.jobs)
    .where(eq(schema.jobs.id, jobId))
    .limit(1);

  if (!job[0]) throw new Error(`Job ${jobId} not found`);

  const prompt = buildScoringPrompt(job[0]);
  const result = (await scoreJob(SCORING_SYSTEM_PROMPT, prompt)) as unknown as LLMScoreResult;

  // Store per-dimension scores
  const dimensions = [
    "title_seniority",
    "function_alignment",
    "company_stage",
    "ai_native",
    "location",
    "reporting_line",
    "comp_signal",
    "industry",
    "growth_trajectory",
  ] as const;

  // Compute overall score ourselves using our weights (not Claude's self-computed number)
  const currentPrefs = await db.query.preferences.findMany();
  const weights = new Map<string, number>();
  const dimScores = new Map<string, number>();

  for (const pref of currentPrefs) {
    weights.set(pref.dimension, pref.effectiveWeight);
  }

  for (const dim of dimensions) {
    const dimScore = result[dim];
    if (dimScore) {
      dimScores.set(dim, dimScore.score);
    }
  }

  // Normalize weights to sum to 1
  let weightSum = 0;
  for (const w of weights.values()) weightSum += w;
  if (weightSum > 0) {
    for (const [k, v] of weights) weights.set(k, v / weightSum);
  }

  const overallScore = computeCompositeScore(dimScores, weights);

  for (const dim of dimensions) {
    const dimScore = result[dim];
    if (dimScore) {
      await db.insert(schema.jobScores).values({
        jobId,
        dimension: dim,
        score: dimScore.score,
        reason: dimScore.reason,
        overallScore,
        passNumber: 2,
        scoredByAgent: "analyst",
      });
    }
  }

  // Mark job as scored
  await db
    .update(schema.jobs)
    .set({ scoredAt: new Date().toISOString() })
    .where(eq(schema.jobs.id, jobId));

  await logAgentAction("analyst", "score_job", {
    jobId,
    overallScore: result.overall,
    recommendation: result.recommendation,
  });

  return result;
}
