/**
 * Two-pass job scoring rubric.
 *
 * Pass 1: Hard filter (no LLM) — instant binary gates
 * Pass 2: Deep LLM score — structured JSON rubric via Claude API
 */

import type { Job } from "../db/schema";

// ─── Pass 1: Hard Filter ────────────────────────────────────────

const SENIORITY_KEYWORDS = [
  "director",
  "vp",
  "vice president",
  "head of",
  "chief of staff",
  "senior director",
  "svp",
  "evp",
  "c-suite",
  "coo",
  "cro",
  "cso",
  "cos",
];

const FUNCTION_KEYWORDS = [
  "strategy",
  "operations",
  "gtm",
  "go-to-market",
  "go to market",
  "revenue ops",
  "revops",
  "rev ops",
  "business ops",
  "biz ops",
  "chief of staff",
  "cos",
  "sales ops",
  "marketing ops",
  "growth ops",
];

const LOCATION_KEYWORDS = [
  "new york",
  "nyc",
  "manhattan",
  "brooklyn",
  "san francisco",
  "sf",
  "bay area",
  "silicon valley",
  "palo alto",
  "menlo park",
  "mountain view",
  "sunnyvale",
  "remote",
  "hybrid",
];

const COMPANY_TYPE_KEYWORDS = [
  "b2b",
  "saas",
  "software",
  "tech",
  "ai",
  "artificial intelligence",
  "machine learning",
  "ml",
  "platform",
  "enterprise",
  "cloud",
  "data",
];

export interface HardFilterResult {
  passed: boolean;
  failedGates: string[];
  matchedGates: string[];
}

/**
 * Pass 1: Apply hard binary gates. Jobs failing any gate are auto-archived.
 */
export function hardFilter(job: Job): HardFilterResult {
  const titleLower = (job.title || "").toLowerCase();
  const descLower = (job.description || "").toLowerCase();
  const locationLower = (job.location || "").toLowerCase();
  const fullText = `${titleLower} ${descLower}`;

  const failedGates: string[] = [];
  const matchedGates: string[] = [];

  // Gate 1: Seniority — MUST appear in the TITLE (not just description)
  const seniorityMatch = SENIORITY_KEYWORDS.some((kw) => titleLower.includes(kw));
  if (seniorityMatch) matchedGates.push("seniority");
  else failedGates.push("seniority");

  // Gate 2: Function — title or description
  const functionMatch = FUNCTION_KEYWORDS.some(
    (kw) => titleLower.includes(kw) || descLower.includes(kw)
  );
  if (functionMatch) matchedGates.push("function");
  else failedGates.push("function");

  // Gate 3: Location
  const locationMatch = LOCATION_KEYWORDS.some(
    (kw) => locationLower.includes(kw) || descLower.includes(kw)
  );
  if (locationMatch) matchedGates.push("location");
  else failedGates.push("location");

  // Gate 4: Company type (more lenient — check full text)
  const companyTypeMatch = COMPANY_TYPE_KEYWORDS.some((kw) =>
    fullText.includes(kw)
  );
  if (companyTypeMatch) matchedGates.push("company_type");
  else failedGates.push("company_type");

  // Gate 5: Salary floor — configurable via MIN_SALARY_FLOOR (default: disabled).
  // When set, a listed salary below the floor fails the gate. Listings without
  // salary data always pass, since ranges are frequently omitted.
  const salaryFloor = Number(process.env.MIN_SALARY_FLOOR) || 0;
  if (salaryFloor > 0 && job.salaryMax && job.salaryMax < salaryFloor) {
    failedGates.push("salary_floor");
  } else {
    matchedGates.push("salary_floor");
  }

  return {
    passed: failedGates.length === 0,
    failedGates,
    matchedGates,
  };
}

// ─── Pass 2: LLM Deep Score Prompt ─────────────────────────────

// Candidate profile the scorer evaluates against. Override via CANDIDATE_PROFILE
// in .env to point the whole system at your own search. The default below is an
// illustrative example profile.
const CANDIDATE_PROFILE =
  process.env.CANDIDATE_PROFILE ||
  `- Current Role: Marketing Strategy & Operations lead (Director-level scope, small team)
- Background: MBA (Business Analytics), management consulting, corporate finance
- Expertise: GTM strategy, pipeline optimization, AI-powered outbound, lead scoring, marketing automation
- Key Achievement: Deployed AI SDR and intent-based outbound (multi-million-dollar pipeline impact)
- Target: Director+ roles in GTM Ops, Strategy Ops, Business Ops, or Chief of Staff to CEO
- Target Companies: High-growth B2B SaaS/tech, ideally Series B-D
- Location: NYC (primary), open to Bay Area / remote
- Comp Target: competitive senior-leadership compensation (configurable)`;

export const SCORING_SYSTEM_PROMPT = `You are a job-fit scoring analyst. You evaluate job listings against a candidate's profile using a structured rubric.

CANDIDATE PROFILE:
${CANDIDATE_PROFILE}

SCORING INSTRUCTIONS:
Score each dimension on a 1-5 scale with reasoning. Then compute an overall score (0-100).

Respond with ONLY valid JSON matching this exact schema:
{
  "title_seniority": { "score": <1-5>, "reason": "<brief explanation>" },
  "function_alignment": { "score": <1-5>, "reason": "<brief explanation>" },
  "company_stage": { "score": <1-5>, "reason": "<brief explanation>" },
  "ai_native": { "score": <1-5>, "reason": "<brief explanation>" },
  "location": { "score": <1-5>, "reason": "<brief explanation>" },
  "reporting_line": { "score": <1-5>, "reason": "<brief explanation>" },
  "comp_signal": { "score": <1-5>, "reason": "<brief explanation>" },
  "industry": { "score": <1-5>, "reason": "<brief explanation>" },
  "growth_trajectory": { "score": <1-5>, "reason": "<brief explanation>" },
  "overall": <0-100>,
  "recommendation": "<1-2 sentence summary of fit and suggested action>"
}`;

export function buildScoringPrompt(job: Job): string {
  return `Score this job listing:

TITLE: ${job.title}
COMPANY: ${job.company}
LOCATION: ${job.location || "Not specified"}
SALARY: ${job.salaryMin ? `$${job.salaryMin}` : "Not listed"}${job.salaryMax ? ` - $${job.salaryMax}` : ""}
URL: ${job.url || "N/A"}

DESCRIPTION:
${job.description || "No description available"}

Score this job against the candidate profile using the rubric. Return ONLY the JSON.`;
}

export interface DimensionScore {
  score: number;
  reason: string;
}

export interface LLMScoreResult {
  title_seniority: DimensionScore;
  function_alignment: DimensionScore;
  company_stage: DimensionScore;
  ai_native: DimensionScore;
  location: DimensionScore;
  reporting_line: DimensionScore;
  comp_signal: DimensionScore;
  industry: DimensionScore;
  growth_trajectory: DimensionScore;
  overall: number;
  recommendation: string;
}
