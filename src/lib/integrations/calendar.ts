/**
 * Google Calendar API integration.
 * Creates follow-up reminders, interview prep blocks, and scheduling.
 */

const CALENDAR_BASE_URL =
  "https://www.googleapis.com/calendar/v3/calendars/primary";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google OAuth credentials not configured");
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

  if (!response.ok) throw new Error("Failed to refresh Google token");
  const data = await response.json();
  return data.access_token;
}

/**
 * Create a follow-up reminder event.
 */
export async function createFollowUpReminder(
  company: string,
  jobTitle: string,
  followUpDate: Date,
  notes?: string
): Promise<{ eventId: string; htmlLink: string }> {
  const token = await getAccessToken();

  const event = {
    summary: `Follow up: ${company} — ${jobTitle}`,
    description: `Follow up on your application/outreach for ${jobTitle} at ${company}.\n\n${notes || ""}`,
    start: {
      dateTime: followUpDate.toISOString(),
      timeZone: "America/New_York",
    },
    end: {
      dateTime: new Date(
        followUpDate.getTime() + 30 * 60 * 1000
      ).toISOString(),
      timeZone: "America/New_York",
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 30 },
        { method: "email", minutes: 60 },
      ],
    },
    colorId: "5", // Yellow — follow-up
  };

  const response = await fetch(`${CALENDAR_BASE_URL}/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Calendar event creation failed: ${text}`);
  }

  const data = await response.json();
  return { eventId: data.id, htmlLink: data.htmlLink };
}

/**
 * Create an interview prep block.
 */
export async function createInterviewPrepBlock(
  company: string,
  jobTitle: string,
  interviewDate: Date,
  prepNotes?: string
): Promise<{ eventId: string; htmlLink: string }> {
  const token = await getAccessToken();

  // Create a 1-hour prep block the day before the interview
  const prepDate = new Date(interviewDate.getTime() - 24 * 60 * 60 * 1000);
  prepDate.setHours(10, 0, 0, 0); // 10 AM

  const event = {
    summary: `Interview Prep: ${company} — ${jobTitle}`,
    description: `Prepare for your interview at ${company} for ${jobTitle}.\n\n${prepNotes || "Review company research, prepare STAR stories, review job description."}`,
    start: {
      dateTime: prepDate.toISOString(),
      timeZone: "America/New_York",
    },
    end: {
      dateTime: new Date(prepDate.getTime() + 60 * 60 * 1000).toISOString(),
      timeZone: "America/New_York",
    },
    reminders: {
      useDefault: false,
      overrides: [{ method: "popup", minutes: 60 }],
    },
    colorId: "9", // Blue — prep
  };

  const response = await fetch(`${CALENDAR_BASE_URL}/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Calendar event creation failed: ${text}`);
  }

  const data = await response.json();
  return { eventId: data.id, htmlLink: data.htmlLink };
}

/**
 * List upcoming follow-up events.
 */
export async function getUpcomingFollowUps(
  daysAhead: number = 7
): Promise<
  Array<{ id: string; summary: string; start: string; htmlLink: string }>
> {
  const token = await getAccessToken();

  const now = new Date().toISOString();
  const future = new Date(
    Date.now() + daysAhead * 24 * 60 * 60 * 1000
  ).toISOString();

  const params = new URLSearchParams({
    timeMin: now,
    timeMax: future,
    q: "Follow up",
    singleEvents: "true",
    orderBy: "startTime",
  });

  const response = await fetch(
    `${CALENDAR_BASE_URL}/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) return [];

  const data = await response.json();
  return (data.items || []).map(
    (e: {
      id: string;
      summary: string;
      start: { dateTime: string };
      htmlLink: string;
    }) => ({
      id: e.id,
      summary: e.summary,
      start: e.start?.dateTime || "",
      htmlLink: e.htmlLink,
    })
  );
}
