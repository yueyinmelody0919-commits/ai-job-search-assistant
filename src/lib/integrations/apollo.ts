/**
 * Apollo.io API integration.
 * People and company enrichment — find contacts at target companies.
 * Free tier: 50 email credits/month.
 */

const APOLLO_BASE_URL = "https://api.apollo.io/v1";

function getApiKey(): string {
  const key = process.env.APOLLO_API_KEY;
  if (!key) throw new Error("APOLLO_API_KEY not configured");
  return key;
}

export interface ApolloContact {
  id: string;
  name: string;
  title: string;
  email: string | null;
  linkedinUrl: string | null;
  company: string;
  companyId: string | null;
}

export interface ApolloCompany {
  id: string;
  name: string;
  domain: string;
  industry: string;
  employeeCount: number;
  fundingTotal: number | null;
  fundingStage: string | null;
  linkedinUrl: string | null;
  description: string;
}

/**
 * Search for people at a specific company.
 */
export async function searchPeople(
  companyName: string,
  options?: {
    titles?: string[];
    limit?: number;
  }
): Promise<ApolloContact[]> {
  const apiKey = getApiKey();

  const body: Record<string, unknown> = {
    q_organization_name: companyName,
    per_page: options?.limit ?? 10,
    person_titles: options?.titles ?? [
      "VP",
      "Director",
      "Head of",
      "Chief",
      "CEO",
      "CRO",
      "COO",
      "CSO",
    ],
  };

  const response = await fetch(`${APOLLO_BASE_URL}/mixed_people/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Apollo people search failed: ${text}`);
  }

  const data = await response.json();

  return (data.people || []).map(
    (p: {
      id: string;
      name: string;
      title: string;
      email: string | null;
      linkedin_url: string | null;
      organization: { name: string; id: string } | null;
    }) => ({
      id: p.id,
      name: p.name,
      title: p.title,
      email: p.email,
      linkedinUrl: p.linkedin_url,
      company: p.organization?.name || companyName,
      companyId: p.organization?.id || null,
    })
  );
}

/**
 * Enrich a company by domain or name.
 */
export async function enrichCompany(
  domain: string
): Promise<ApolloCompany | null> {
  const apiKey = getApiKey();

  const response = await fetch(`${APOLLO_BASE_URL}/organizations/enrich`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
  });

  // Apollo's enrich endpoint uses query params
  const enrichUrl = `${APOLLO_BASE_URL}/organizations/enrich?domain=${encodeURIComponent(domain)}`;

  const enrichResponse = await fetch(enrichUrl, {
    headers: { "X-Api-Key": apiKey },
  });

  if (!enrichResponse.ok) return null;

  const data = await enrichResponse.json();
  const org = data.organization;
  if (!org) return null;

  return {
    id: org.id,
    name: org.name,
    domain: org.primary_domain || domain,
    industry: org.industry || "",
    employeeCount: org.estimated_num_employees || 0,
    fundingTotal: org.total_funding ? parseFloat(org.total_funding) : null,
    fundingStage: org.latest_funding_stage || null,
    linkedinUrl: org.linkedin_url || null,
    description: org.short_description || "",
  };
}

/**
 * Find potential warm introductions at a company.
 * Returns contacts sorted by title relevance for networking.
 */
export async function findWarmIntros(
  companyName: string
): Promise<ApolloContact[]> {
  // Search for senior leaders who would be relevant networking contacts
  return searchPeople(companyName, {
    titles: [
      "CEO",
      "COO",
      "CRO",
      "Chief of Staff",
      "VP Operations",
      "VP Strategy",
      "Director Strategy",
      "Director Operations",
      "Head of People",
      "VP People",
    ],
    limit: 5,
  });
}
