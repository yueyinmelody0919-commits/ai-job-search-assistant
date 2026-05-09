/**
 * JSearch API integration (via RapidAPI).
 * Aggregates job listings from LinkedIn, Indeed, Glassdoor via Google for Jobs.
 * Free tier: 500 requests/month.
 */

import type { NewJob } from "../db/schema";

const JSEARCH_BASE_URL = "https://jsearch.p.rapidapi.com";

interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo: string | null;
  job_description: string;
  job_apply_link: string;
  job_city: string;
  job_state: string;
  job_country: string;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
  job_posted_at_datetime_utc: string;
  job_is_remote: boolean;
}

interface JSearchResponse {
  status: string;
  data: JSearchJob[];
  request_id: string;
}

export interface JobSearchParams {
  query: string;
  location?: string;
  page?: number;
  numPages?: number;
  datePosted?: "today" | "3days" | "week" | "month" | "all";
  remoteOnly?: boolean;
  employmentType?: "FULLTIME" | "PARTTIME" | "CONTRACTOR" | "INTERN";
}

/**
 * Search for jobs via JSearch API.
 */
export async function searchJobs(
  params: JobSearchParams
): Promise<NewJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    throw new Error("RAPIDAPI_KEY not configured");
  }

  const searchParams = new URLSearchParams({
    query: params.query,
    page: String(params.page ?? 1),
    num_pages: String(params.numPages ?? 1),
    date_posted: params.datePosted ?? "week",
  });

  if (params.location) {
    searchParams.set("query", `${params.query} in ${params.location}`);
  }
  if (params.remoteOnly) {
    searchParams.set("remote_jobs_only", "true");
  }
  if (params.employmentType) {
    searchParams.set("employment_types", params.employmentType);
  }

  const response = await fetch(
    `${JSEARCH_BASE_URL}/search?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`JSearch API error (${response.status}): ${text}`);
  }

  const data: JSearchResponse = await response.json();

  return (data.data || []).map((job) => mapToNewJob(job));
}

/**
 * Get job details by ID.
 */
export async function getJobDetails(jobId: string): Promise<NewJob | null> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    throw new Error("RAPIDAPI_KEY not configured");
  }

  const response = await fetch(
    `${JSEARCH_BASE_URL}/job-details?job_id=${encodeURIComponent(jobId)}`,
    {
      method: "GET",
      headers: {
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
    }
  );

  if (!response.ok) return null;

  const data: JSearchResponse = await response.json();
  if (!data.data || data.data.length === 0) return null;

  return mapToNewJob(data.data[0]);
}

function mapToNewJob(job: JSearchJob): NewJob {
  const location = [job.job_city, job.job_state, job.job_country]
    .filter(Boolean)
    .join(", ");

  return {
    source: "jsearch",
    externalId: job.job_id,
    title: job.job_title,
    company: job.employer_name,
    description: job.job_description,
    url: job.job_apply_link,
    location: job.job_is_remote ? `Remote / ${location}` : location,
    salaryMin: job.job_min_salary,
    salaryMax: job.job_max_salary,
    salaryCurrency: job.job_salary_currency,
    companyLogo: job.employer_logo,
    rawJson: JSON.stringify(job),
  };
}

/**
 * Default search queries for Melody's target roles.
 */
export const DEFAULT_SEARCH_QUERIES = [
  "Director Strategy Operations B2B SaaS",
  "Director GTM Operations",
  "Head of Business Operations tech",
  "Chief of Staff CEO startup",
  "VP Revenue Operations SaaS",
  "Director RevOps",
  "Head of Strategy Operations AI",
];

export const DEFAULT_LOCATIONS = ["New York", "San Francisco"];
