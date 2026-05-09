import { describe, it, expect } from "vitest";
import { hardFilter, type HardFilterResult } from "@/lib/scoring/rubric";
import type { Job } from "@/lib/db/schema";

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 1,
    source: "jsearch",
    externalId: "test-1",
    title: "Director of Strategy & Operations",
    company: "Acme AI",
    description:
      "We are a B2B SaaS company looking for a Director to lead GTM operations. Must be based in NYC or willing to relocate.",
    url: "https://example.com/job/1",
    location: "New York, NY",
    salaryMin: 350000,
    salaryMax: 450000,
    salaryCurrency: "USD",
    companyLogo: null,
    rawJson: null,
    discoveredAt: new Date().toISOString(),
    scoredAt: null,
    ...overrides,
  };
}

describe("Hard Filter (Pass 1)", () => {
  it("passes a perfect match job", () => {
    const result = hardFilter(makeJob());
    expect(result.passed).toBe(true);
    expect(result.failedGates).toHaveLength(0);
    expect(result.matchedGates).toContain("seniority");
    expect(result.matchedGates).toContain("function");
    expect(result.matchedGates).toContain("location");
    expect(result.matchedGates).toContain("company_type");
  });

  it("fails on wrong seniority", () => {
    const result = hardFilter(
      makeJob({
        title: "Junior Analyst",
        description: "Entry level analytics role at a B2B SaaS company in NYC.",
      })
    );
    expect(result.passed).toBe(false);
    expect(result.failedGates).toContain("seniority");
  });

  it("fails on wrong function", () => {
    const result = hardFilter(
      makeJob({
        title: "Director of Engineering",
        description:
          "Lead the engineering team building our AI platform in NYC.",
      })
    );
    expect(result.passed).toBe(false);
    expect(result.failedGates).toContain("function");
  });

  it("fails on wrong location", () => {
    const result = hardFilter(
      makeJob({
        location: "Austin, TX",
        description:
          "Director of GTM Operations at a B2B SaaS company in Austin.",
      })
    );
    expect(result.passed).toBe(false);
    expect(result.failedGates).toContain("location");
  });

  it("passes CoS (Chief of Staff) roles", () => {
    const result = hardFilter(
      makeJob({
        title: "Chief of Staff to CEO",
        description:
          "Chief of Staff role at Series C AI company in San Francisco. B2B SaaS.",
        location: "San Francisco, CA",
      })
    );
    expect(result.passed).toBe(true);
  });

  it("passes VP-level roles", () => {
    const result = hardFilter(
      makeJob({
        title: "VP of Revenue Operations",
        description:
          "Lead rev ops at a high-growth B2B SaaS company in NYC.",
      })
    );
    expect(result.passed).toBe(true);
  });

  it("passes remote roles", () => {
    const result = hardFilter(
      makeJob({
        title: "Head of Strategy & Operations",
        description: "Remote-first B2B SaaS company. Lead GTM operations.",
        location: "Remote",
      })
    );
    expect(result.passed).toBe(true);
  });

  it("passes Bay Area roles", () => {
    const result = hardFilter(
      makeJob({
        title: "Director, Business Operations",
        description:
          "Join our AI platform company in the Bay Area. B2B enterprise SaaS.",
        location: "Palo Alto, CA",
      })
    );
    expect(result.passed).toBe(true);
  });
});
