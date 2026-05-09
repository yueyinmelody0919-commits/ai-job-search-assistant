import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchJobs, DEFAULT_SEARCH_QUERIES } from "@/lib/integrations/jsearch";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("JSearch Integration", () => {
  beforeEach(() => {
    vi.stubEnv("RAPIDAPI_KEY", "test-key");
    mockFetch.mockReset();
  });

  it("throws if RAPIDAPI_KEY is not set", async () => {
    vi.stubEnv("RAPIDAPI_KEY", "");
    await expect(
      searchJobs({ query: "test" })
    ).rejects.toThrow("RAPIDAPI_KEY not configured");
  });

  it("calls JSearch API with correct headers", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: "OK", data: [] }),
    });

    await searchJobs({ query: "Director Strategy Operations" });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("jsearch.p.rapidapi.com/search"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "x-rapidapi-key": "test-key",
        }),
      })
    );
  });

  it("maps JSearch response to NewJob format", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "OK",
          data: [
            {
              job_id: "abc123",
              job_title: "Director of Strategy",
              employer_name: "Acme AI",
              employer_logo: "https://logo.com/acme.png",
              job_description: "Lead strategy...",
              job_apply_link: "https://apply.com/123",
              job_city: "New York",
              job_state: "NY",
              job_country: "US",
              job_min_salary: 350000,
              job_max_salary: 450000,
              job_salary_currency: "USD",
              job_is_remote: false,
            },
          ],
        }),
    });

    const jobs = await searchJobs({ query: "test" });
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: "jsearch",
      externalId: "abc123",
      title: "Director of Strategy",
      company: "Acme AI",
      location: "New York, NY, US",
      salaryMin: 350000,
      salaryMax: 450000,
    });
  });

  it("handles remote jobs correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "OK",
          data: [
            {
              job_id: "remote1",
              job_title: "Head of Ops",
              employer_name: "Remote Co",
              employer_logo: null,
              job_description: "Remote role...",
              job_apply_link: "https://apply.com/r1",
              job_city: "",
              job_state: "",
              job_country: "US",
              job_min_salary: null,
              job_max_salary: null,
              job_salary_currency: null,
              job_is_remote: true,
            },
          ],
        }),
    });

    const jobs = await searchJobs({ query: "test" });
    expect(jobs[0].location).toContain("Remote");
  });

  it("throws on API error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: () => Promise.resolve("Rate limit exceeded"),
    });

    await expect(searchJobs({ query: "test" })).rejects.toThrow(
      "JSearch API error (429)"
    );
  });

  it("has valid default search queries", () => {
    expect(DEFAULT_SEARCH_QUERIES.length).toBeGreaterThan(0);
    for (const q of DEFAULT_SEARCH_QUERIES) {
      expect(typeof q).toBe("string");
      expect(q.length).toBeGreaterThan(0);
    }
  });
});
