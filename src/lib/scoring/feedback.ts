/**
 * Feedback processing — bridges user feedback to Thompson Sampling updates.
 */

import { db, schema } from "../db";
import { eq } from "drizzle-orm";
import {
  updateWeights,
  betaMean,
  type DimensionWeight,
} from "./thompson";

// Map feedback tags to scoring dimensions for targeted updates
const TAG_TO_DIMENSION: Record<string, string> = {
  wrong_seniority: "title_seniority",
  wrong_function: "function_alignment",
  wrong_location: "location",
  too_early_stage: "company_stage",
  not_ai_native: "ai_native",
  wrong_industry: "industry",
  comp_too_low: "comp_signal",
  bad_reporting_line: "reporting_line",
  low_growth: "growth_trajectory",
};

/**
 * Process a feedback signal and update Thompson Sampling weights.
 */
export async function processFeedback(
  jobId: number,
  type: "thumbs_up" | "thumbs_down",
  tag?: string,
  comment?: string
): Promise<DimensionWeight[]> {
  // 1. Record the feedback
  await db.insert(schema.feedback).values({
    jobId,
    type,
    tag: tag || null,
    comment: comment || null,
  });

  // 2. Get the job's per-dimension scores
  const scores = await db.query.jobScores.findMany({
    where: eq(schema.jobScores.jobId, jobId),
  });

  const jobScoreMap = new Map<string, number>();
  for (const s of scores) {
    jobScoreMap.set(s.dimension, s.score);
  }

  // 3. Get current preference weights
  const currentPrefs = await db.query.preferences.findMany();
  const dimensions: DimensionWeight[] = currentPrefs.map((p) => ({
    dimension: p.dimension,
    alpha: p.alpha,
    beta: p.beta_param,
    effectiveWeight: p.effectiveWeight,
  }));

  // 4. Determine target dimension from tag
  const targetDimension = tag ? TAG_TO_DIMENSION[tag] : undefined;

  // 5. Update weights via Thompson Sampling
  const updated = updateWeights(
    dimensions,
    jobScoreMap,
    type === "thumbs_up",
    targetDimension
  );

  // 6. Persist updated weights
  for (const dim of updated) {
    await db
      .update(schema.preferences)
      .set({
        alpha: dim.alpha,
        beta_param: dim.beta,
        effectiveWeight: betaMean(dim.alpha, dim.beta),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.preferences.dimension, dim.dimension));
  }

  return updated;
}

/**
 * Get the current effective weights (deterministic, not sampled).
 */
export async function getCurrentWeights(): Promise<DimensionWeight[]> {
  const prefs = await db.query.preferences.findMany();
  return prefs.map((p) => ({
    dimension: p.dimension,
    alpha: p.alpha,
    beta: p.beta_param,
    effectiveWeight: p.effectiveWeight,
  }));
}
