import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDraft, sendEmail, searchThreads } from "@/lib/integrations/gmail";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("Gmail Integration", () => {
  beforeEach(() => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "test-client-id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-secret");
    vi.stubEnv("GOOGLE_REFRESH_TOKEN", "test-refresh-token");
    mockFetch.mockReset();
  });

  // Helper: mock token refresh
  function mockTokenRefresh() {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ access_token: "test-access-token" }),
    });
  }

  it("throws if Google credentials not configured", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    await expect(
      createDraft("test@test.com", "Test", "Body")
    ).rejects.toThrow("Google OAuth credentials not configured");
  });

  it("creates a draft with correct format", async () => {
    mockTokenRefresh();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "draft-123",
          message: { threadId: "thread-456" },
        }),
    });

    const result = await createDraft(
      "hiring@acme.com",
      "Re: Director Role",
      "Hi, I'm interested..."
    );

    expect(result.id).toBe("draft-123");
    expect(result.threadId).toBe("thread-456");

    // Verify the second fetch call (first is token refresh)
    const [url, options] = mockFetch.mock.calls[1];
    expect(url).toContain("gmail.googleapis.com");
    expect(url).toContain("drafts");
    expect(options.headers.Authorization).toBe("Bearer test-access-token");
  });

  it("sends email successfully", async () => {
    mockTokenRefresh();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "msg-789",
          threadId: "thread-101",
        }),
    });

    const result = await sendEmail(
      "hiring@acme.com",
      "Re: Director of Ops",
      "Hello, following up..."
    );

    expect(result.id).toBe("msg-789");
    expect(result.threadId).toBe("thread-101");
  });

  it("searches threads with query", async () => {
    mockTokenRefresh();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          threads: [
            { id: "t1", snippet: "Re: Director role at Acme" },
            { id: "t2", snippet: "Following up on application" },
          ],
        }),
    });

    const threads = await searchThreads("Director");
    expect(threads).toHaveLength(2);
    expect(threads[0].id).toBe("t1");
  });

  it("returns empty array on search failure", async () => {
    mockTokenRefresh();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const threads = await searchThreads("test");
    expect(threads).toHaveLength(0);
  });
});
