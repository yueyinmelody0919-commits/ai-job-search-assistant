import { describe, it, expect } from "vitest";
import {
  sampleBeta,
  betaMean,
  updateWeights,
  computeCompositeScore,
  initializePreferences,
  sampleWeights,
  type DimensionWeight,
} from "@/lib/scoring/thompson";

describe("Thompson Sampling", () => {
  describe("sampleBeta", () => {
    it("returns values between 0 and 1", () => {
      for (let i = 0; i < 100; i++) {
        const sample = sampleBeta(2, 2);
        expect(sample).toBeGreaterThanOrEqual(0);
        expect(sample).toBeLessThanOrEqual(1);
      }
    });

    it("throws for non-positive parameters", () => {
      expect(() => sampleBeta(0, 1)).toThrow();
      expect(() => sampleBeta(1, 0)).toThrow();
      expect(() => sampleBeta(-1, 1)).toThrow();
    });

    it("produces higher mean for higher alpha", () => {
      const samples_high = Array.from({ length: 1000 }, () =>
        sampleBeta(10, 2)
      );
      const samples_low = Array.from({ length: 1000 }, () =>
        sampleBeta(2, 10)
      );
      const mean_high =
        samples_high.reduce((a, b) => a + b) / samples_high.length;
      const mean_low =
        samples_low.reduce((a, b) => a + b) / samples_low.length;
      expect(mean_high).toBeGreaterThan(mean_low);
    });
  });

  describe("betaMean", () => {
    it("returns 0.5 for symmetric distribution", () => {
      expect(betaMean(2, 2)).toBe(0.5);
      expect(betaMean(5, 5)).toBe(0.5);
    });

    it("returns higher value for higher alpha", () => {
      expect(betaMean(8, 2)).toBeGreaterThan(betaMean(2, 8));
    });

    it("computes correctly", () => {
      expect(betaMean(3, 1)).toBe(0.75);
      expect(betaMean(1, 3)).toBe(0.25);
    });
  });

  describe("updateWeights", () => {
    const baseDimensions: DimensionWeight[] = [
      {
        dimension: "title_seniority",
        alpha: 2,
        beta: 2,
        effectiveWeight: 0.5,
      },
      {
        dimension: "company_stage",
        alpha: 2,
        beta: 2,
        effectiveWeight: 0.5,
      },
    ];

    it("increases alpha on positive feedback for high-scoring dimensions", () => {
      const jobScores = new Map([
        ["title_seniority", 5],
        ["company_stage", 1],
      ]);

      const updated = updateWeights(baseDimensions, jobScores, true);

      // Title scored 5 → normalized to 1.0 → alpha increases by 1.0
      expect(updated[0].alpha).toBeGreaterThan(2);
      // Company scored 1 → normalized to 0.0 → alpha unchanged
      expect(updated[1].alpha).toBe(2);
    });

    it("increases beta on negative feedback for high-scoring dimensions", () => {
      const jobScores = new Map([
        ["title_seniority", 5],
        ["company_stage", 1],
      ]);

      const updated = updateWeights(baseDimensions, jobScores, false);

      // Title scored 5 → normalized to 1.0 → beta increases by 1.0
      expect(updated[0].beta).toBeGreaterThan(2);
      // Company scored 1 → normalized to 0.0 → beta unchanged
      expect(updated[1].beta).toBe(2);
    });

    it("applies stronger update when tag matches dimension", () => {
      const jobScores = new Map([
        ["title_seniority", 3],
        ["company_stage", 3],
      ]);

      const updated = updateWeights(
        baseDimensions,
        jobScores,
        false,
        "company_stage"
      );

      // Tagged dimension gets +2 to beta
      expect(updated[1].beta).toBe(4);
    });
  });

  describe("computeCompositeScore", () => {
    it("returns 100 for perfect scores with equal weights", () => {
      const scores = new Map([
        ["a", 5],
        ["b", 5],
      ]);
      const weights = new Map([
        ["a", 0.5],
        ["b", 0.5],
      ]);
      expect(computeCompositeScore(scores, weights)).toBe(100);
    });

    it("returns 0 for lowest scores", () => {
      const scores = new Map([
        ["a", 1],
        ["b", 1],
      ]);
      const weights = new Map([
        ["a", 0.5],
        ["b", 0.5],
      ]);
      expect(computeCompositeScore(scores, weights)).toBe(0);
    });

    it("respects weight differences", () => {
      const scores = new Map([
        ["a", 5],
        ["b", 1],
      ]);
      const weightsAHeavy = new Map([
        ["a", 0.9],
        ["b", 0.1],
      ]);
      const weightsBHeavy = new Map([
        ["a", 0.1],
        ["b", 0.9],
      ]);

      expect(computeCompositeScore(scores, weightsAHeavy)).toBeGreaterThan(
        computeCompositeScore(scores, weightsBHeavy)
      );
    });
  });

  describe("sampleWeights", () => {
    it("returns normalized weights summing to ~1", () => {
      const dims = initializePreferences();
      const weights = sampleWeights(dims);

      let total = 0;
      for (const w of weights.values()) {
        total += w;
      }
      expect(total).toBeCloseTo(1, 5);
    });

    it("returns a weight for every dimension", () => {
      const dims = initializePreferences();
      const weights = sampleWeights(dims);
      expect(weights.size).toBe(dims.length);
    });
  });

  describe("initializePreferences", () => {
    it("creates all 9 dimensions", () => {
      const prefs = initializePreferences();
      expect(prefs).toHaveLength(9);
    });

    it("initializes with Beta(2,2) priors", () => {
      const prefs = initializePreferences();
      for (const p of prefs) {
        expect(p.alpha).toBe(2);
        expect(p.beta).toBe(2);
      }
    });
  });
});
