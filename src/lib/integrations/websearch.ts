/**
 * Web search integration via Tavily API.
 * Powers periodic research by all agents.
 * Free tier: 1,000 searches/month.
 */

const TAVILY_BASE_URL = "https://api.tavily.com";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

interface TavilyResponse {
  results: TavilyResult[];
  answer?: string;
}

/**
 * Perform a web search via Tavily.
 */
export async function webSearch(
  query: string,
  options?: {
    maxResults?: number;
    searchDepth?: "basic" | "advanced";
    includeAnswer?: boolean;
    topic?: "general" | "news";
  }
): Promise<{
  results: TavilyResult[];
  answer?: string;
}> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY not configured");
  }

  const response = await fetch(`${TAVILY_BASE_URL}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: options?.maxResults ?? 5,
      search_depth: options?.searchDepth ?? "basic",
      include_answer: options?.includeAnswer ?? true,
      topic: options?.topic ?? "general",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Tavily search failed (${response.status}): ${text}`);
  }

  const data: TavilyResponse = await response.json();
  return {
    results: data.results || [],
    answer: data.answer,
  };
}

/**
 * Agent-specific search queries for periodic research.
 */
export const AGENT_SEARCH_QUERIES: Record<string, string[]> = {
  scout: [
    "hot tech companies hiring director strategy operations 2026",
    "series B C D startups hiring NYC San Francisco",
    "AI companies hiring GTM operations leaders",
    "chief of staff CEO openings high growth startups",
  ],
  analyst: [
    "director strategy operations salary benchmarks 2026",
    "B2B SaaS GTM operations compensation trends",
    "job market trends director level operations roles",
    "AI company hiring trends enterprise SaaS",
  ],
  strategist: [
    "best practices cold outreach job search 2026",
    "networking strategies director level job search",
    "how to reach hiring managers at tech companies",
    "job search email templates that get responses",
  ],
  engineer: [
    "AI job search automation tools 2026",
    "Claude Code MCP servers new releases",
    "multi-agent system best practices",
    "job search assistant features innovations",
  ],
  coach: [
    "skills needed director strategy operations AI companies",
    "best courses GTM operations strategy",
    "interview preparation director level tech companies",
    "AI tools certifications for operations leaders",
  ],
};

/**
 * Research a specific company for the dossier.
 */
export async function researchCompany(
  companyName: string
): Promise<{
  results: TavilyResult[];
  answer?: string;
}> {
  return webSearch(`${companyName} company funding news culture 2026`, {
    maxResults: 5,
    searchDepth: "advanced",
    includeAnswer: true,
  });
}
