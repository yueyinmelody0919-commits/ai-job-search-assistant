/**
 * Gmail API integration.
 * Sends outreach emails and reads thread status via Google OAuth.
 */

const GMAIL_BASE_URL = "https://gmail.googleapis.com/gmail/v1/users/me";

/**
 * Get an OAuth access token using the refresh token.
 */
async function getAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Google OAuth credentials not configured (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)"
    );
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to refresh Google token: ${text}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create a draft email in Gmail.
 */
export async function createDraft(
  to: string,
  subject: string,
  body: string
): Promise<{ id: string; threadId: string }> {
  const token = await getAccessToken();

  const rawMessage = createRawEmail(to, subject, body);

  const response = await fetch(`${GMAIL_BASE_URL}/drafts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: { raw: rawMessage },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gmail draft creation failed: ${text}`);
  }

  const data = await response.json();
  return { id: data.id, threadId: data.message.threadId };
}

/**
 * Send an email via Gmail.
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<{ id: string; threadId: string }> {
  const token = await getAccessToken();

  const rawMessage = createRawEmail(to, subject, body);

  const response = await fetch(`${GMAIL_BASE_URL}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: rawMessage }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gmail send failed: ${text}`);
  }

  const data = await response.json();
  return { id: data.id, threadId: data.threadId };
}

/**
 * List recent threads matching a query.
 */
export async function searchThreads(
  query: string,
  maxResults: number = 10
): Promise<Array<{ id: string; snippet: string }>> {
  const token = await getAccessToken();

  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
  });

  const response = await fetch(
    `${GMAIL_BASE_URL}/threads?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) return [];

  const data = await response.json();
  return (data.threads || []).map(
    (t: { id: string; snippet: string }) => ({
      id: t.id,
      snippet: t.snippet,
    })
  );
}

/**
 * Get thread details to check for replies.
 */
export async function getThread(
  threadId: string
): Promise<{ messageCount: number; hasReply: boolean; lastDate: string }> {
  const token = await getAccessToken();

  const response = await fetch(`${GMAIL_BASE_URL}/threads/${threadId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    return { messageCount: 0, hasReply: false, lastDate: "" };
  }

  const data = await response.json();
  const messages = data.messages || [];

  return {
    messageCount: messages.length,
    hasReply: messages.length > 1,
    lastDate:
      messages.length > 0
        ? new Date(
            parseInt(messages[messages.length - 1].internalDate)
          ).toISOString()
        : "",
  };
}

function createRawEmail(to: string, subject: string, body: string): string {
  const email = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\r\n");

  return Buffer.from(email).toString("base64url");
}
