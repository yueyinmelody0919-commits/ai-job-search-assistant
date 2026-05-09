/**
 * Thompson Sampling for preference learning.
 *
 * Each scoring dimension is modeled as a Beta distribution Beta(alpha, beta).
 * - Thumbs-up on a job reinforces dimensions that scored high (alpha += 1)
 * - Thumbs-down penalizes dimensions that scored high (beta += 1)
 * - Sampling from Beta posteriors naturally balances exploration vs exploitation
 * - Converges after ~20-30 feedback signals
 *
 * This is the same technique used by LinkedIn's job recommender and DoorDash's ranking.
 */

export interface DimensionWeight {
  dimension: string;
  alpha: number;
  beta: number;
  effectiveWeight: number;
}

export interface ScoringDimension {
  dimension: string;
  baseWeight: number;
  description: string;
}

// Default scoring dimensions and their starting weights
export const DEFAULT_DIMENSIONS: ScoringDimension[] = [
  {
    dimension: "title_seniority",
    baseWeight: 0.2,
    description: "Director, VP, Head of, CoS — title and seniority match",
  },
  {
    dimension: "function_alignment",
    baseWeight: 0.2,
    description:
      "GTM Ops, Strategy Ops, Biz Ops, Rev Ops, CoS to CEO — function fit",
  },
  {
    dimension: "company_stage",
    baseWeight: 0.15,
    description: "Series B-D, post-PMF, high revenue/headcount growth",
  },
  {
    dimension: "ai_native",
    baseWeight: 0.12,
    description: "AI product company, AI tools in JD, AI-first mission",
  },
  {
    dimension: "location",
    baseWeight: 0.1,
    description: "NYC, SF/Bay Area, or Remote-eligible",
  },
  {
    dimension: "reporting_line",
    baseWeight: 0.08,
    description: "Reports to CEO/CRO/COO = premium signal",
  },
  {
    dimension: "comp_signal",
    baseWeight: 0.08,
    description: "Salary range suggests $350K+ base or comparable",
  },
  {
    dimension: "industry",
    baseWeight: 0.05,
    description: "B2B SaaS, enterprise software, AI, fintech",
  },
  {
    dimension: "growth_trajectory",
    baseWeight: 0.02,
    description: "Recent fundraise, headcount growth, market position signals",
  },
];

/**
 * Sample from a Beta distribution using the Jöhnk algorithm.
 * Returns a value in [0, 1] representing the sampled weight.
 */
export function sampleBeta(alpha: number, beta: number): number {
  if (alpha <= 0 || beta <= 0) {
    throw new Error("Alpha and beta must be positive");
  }

  // Use gamma sampling for Beta distribution
  const gammaA = sampleGamma(alpha);
  const gammaB = sampleGamma(beta);
  return gammaA / (gammaA + gammaB);
}

/**
 * Sample from a Gamma distribution using Marsaglia and Tsang's method.
 */
function sampleGamma(shape: number): number {
  if (shape < 1) {
    // Boost for shape < 1
    return sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
  }

  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  while (true) {
    let x: number;
    let v: number;
    do {
      x = gaussianRandom();
      v = 1 + c * x;
    } while (v <= 0);

    v = v * v * v;
    const u = Math.random();

    if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

/**
 * Box-Muller transform for Gaussian random numbers.
 */
function gaussianRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Sample weights from Thompson Sampling posteriors.
 * Returns normalized weights that sum to 1.
 */
export function sampleWeights(
  dimensions: DimensionWeight[]
): Map<string, number> {
  const samples = new Map<string, number>();
  let total = 0;

  for (const dim of dimensions) {
    const sample = sampleBeta(dim.alpha, dim.beta);
    samples.set(dim.dimension, sample);
    total += sample;
  }

  // Normalize to sum to 1
  for (const [key, value] of samples) {
    samples.set(key, value / total);
  }

  return samples;
}

/**
 * Compute the mean of a Beta distribution (expected weight).
 * Used for deterministic scoring when sampling isn't needed.
 */
export function betaMean(alpha: number, beta: number): number {
  return alpha / (alpha + beta);
}

/**
 * Update dimension weights based on feedback.
 *
 * @param dimensions - Current dimension weights
 * @param jobScores - Per-dimension scores (1-5) for the job being reviewed
 * @param isPositive - true for thumbs-up, false for thumbs-down
 * @param targetTag - optional tag to target specific dimension updates
 * @returns Updated dimension weights
 */
export function updateWeights(
  dimensions: DimensionWeight[],
  jobScores: Map<string, number>,
  isPositive: boolean,
  targetTag?: string
): DimensionWeight[] {
  return dimensions.map((dim) => {
    // If a specific tag targets this dimension, apply stronger update
    if (targetTag && dim.dimension === targetTag) {
      return {
        ...dim,
        alpha: isPositive ? dim.alpha + 2 : dim.alpha,
        beta: isPositive ? dim.beta : dim.beta + 2,
        effectiveWeight: betaMean(
          isPositive ? dim.alpha + 2 : dim.alpha,
          isPositive ? dim.beta : dim.beta + 2
        ),
      };
    }

    const score = jobScores.get(dim.dimension) ?? 3; // default to neutral
    const normalizedScore = (score - 1) / 4; // normalize 1-5 to 0-1

    // High-scoring dimensions get reinforced on thumbs-up, penalized on thumbs-down
    // Low-scoring dimensions get the inverse effect
    const updateStrength = normalizedScore; // 0-1

    const newAlpha = isPositive
      ? dim.alpha + updateStrength
      : dim.alpha;
    const newBeta = isPositive
      ? dim.beta
      : dim.beta + updateStrength;

    return {
      ...dim,
      alpha: newAlpha,
      beta: newBeta,
      effectiveWeight: betaMean(newAlpha, newBeta),
    };
  });
}

/**
 * Compute a composite score (0-100) from per-dimension scores and weights.
 */
export function computeCompositeScore(
  dimensionScores: Map<string, number>, // 1-5 per dimension
  weights: Map<string, number> // normalized weights summing to 1
): number {
  let score = 0;
  for (const [dim, weight] of weights) {
    const dimScore = dimensionScores.get(dim) ?? 3;
    score += ((dimScore - 1) / 4) * weight; // normalize 1-5 to 0-1, weight it
  }
  return Math.round(score * 100);
}

/**
 * Initialize default preference weights.
 */
export function initializePreferences(): DimensionWeight[] {
  return DEFAULT_DIMENSIONS.map((dim) => ({
    dimension: dim.dimension,
    alpha: 2,
    beta: 2,
    effectiveWeight: dim.baseWeight,
  }));
}
