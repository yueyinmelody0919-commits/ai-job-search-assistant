/**
 * Adzuna API integration.
 * Job listings across 12 countries with salary data.
 * Free tier with generous rate limits.
 */

import type { NewJob } from "../db/schema";

const ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs";

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  description: string;
  redirect_url: string;
  location: { display_name: string; area: string[] };
  salary_min?: number;
  salary_max?: number;
  created: string;
  category: { label: string; tag: string };
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
  mean: number;
}

export interface AdzunaSearchParams {
  query: string;
  location?: string;
  country?: string; // 'us' | 'gb' | etc.
  page?: number;
  resultsPerPage?: number;
  maxDaysOld?: number;
  salaryMin?: number;
  sortBy?: "relevance" | "date" | "salary";
}

/**
 * Search for jobs via Adzuna API.
 */
export async function searchAdzunaJobs(
  params: AdzunaSearchParams
): Promise<NewJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    throw new Error("ADZUNA_APP_ID and ADZUNA_APP_KEY not configured");
  }

  const country = params.country ?? "us";
  const page = params.page ?? 1;

  const searchParams = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what: params.query,
    results_per_page: String(params.resultsPerPage ?? 20),
  });

  if (params.location) {
    searchParams.set("where", params.location);
  }
  if (params.maxDaysOld) {
    searchParams.set("max_days_old", String(params.maxDaysOld));
  }
  if (params.salaryMin) {
    searchParams.set("salary_min", String(params.salaryMin));
  }
  if (params.sortBy) {
    searchParams.set("sort_by", params.sortBy);
  }

  const url = `${ADZUNA_BASE_URL}/${country}/search/${page}?${searchParams.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Adzuna API error (${response.status}): ${text}`);
  }

  const data: AdzunaResponse = await response.json();

  return (data.results || []).map((job) => mapToNewJob(job));
}

/**
 * Get salary data for a role/location from Adzuna.
 */
export async function getSalaryData(
  role: string,
  location: string,
  country: string = "us"
): Promise<{ mean: number; count: number } | null> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) return null;

  const searchParams = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what: role,
    where: location,
    content_type: "application/json",
  });

  const url = `${ADZUNA_BASE_URL}/${country}/search/1?${searchParams.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data: AdzunaResponse = await response.json();
    return { mean: data.mean, count: data.count };
  } catch {
    return null;
  }
}

function mapToNewJob(job: AdzunaJob): NewJob {
  return {
    source: "adzuna",
    externalId: job.id,
    title: job.title,
    company: job.company?.display_name || "Unknown",
    description: job.description,
    url: job.redirect_url,
    location: job.location?.display_name || "",
    salaryMin: job.salary_min ?? null,
    salaryMax: job.salary_max ?? null,
    salaryCurrency: "USD",
    companyLogo: null,
    rawJson: JSON.stringify(job),
  };
}
