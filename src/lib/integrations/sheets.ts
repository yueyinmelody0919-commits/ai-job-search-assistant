/**
 * Google Sheets API integration.
 * Application tracking CRM — read/write pipeline data to a shared spreadsheet.
 */

const SHEETS_BASE_URL = "https://sheets.googleapis.com/v4/spreadsheets";

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

// Sheet headers for the application tracker
const HEADERS = [
  "Job ID",
  "Title",
  "Company",
  "Location",
  "Score",
  "Stage",
  "Source",
  "URL",
  "Date Added",
  "Last Updated",
  "Notes",
];

/**
 * Create a new spreadsheet for tracking applications.
 */
export async function createTracker(): Promise<string> {
  const token = await getAccessToken();

  const response = await fetch(SHEETS_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        title: "Melody's Job Search Tracker",
      },
      sheets: [
        {
          properties: { title: "Pipeline" },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: HEADERS.map((h) => ({
                    userEnteredValue: { stringValue: h },
                    userEnteredFormat: { textFormat: { bold: true } },
                  })),
                },
              ],
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create spreadsheet: ${text}`);
  }

  const data = await response.json();
  return data.spreadsheetId;
}

/**
 * Add a job to the tracker spreadsheet.
 */
export async function addJobToTracker(
  spreadsheetId: string,
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    score: number;
    stage: string;
    source: string;
    url: string;
    notes?: string;
  }
): Promise<void> {
  const token = await getAccessToken();
  const now = new Date().toISOString().split("T")[0];

  const values = [
    [
      job.id,
      job.title,
      job.company,
      job.location,
      job.score,
      job.stage,
      job.source,
      job.url,
      now,
      now,
      job.notes || "",
    ],
  ];

  const response = await fetch(
    `${SHEETS_BASE_URL}/${spreadsheetId}/values/Pipeline!A:K:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to add job to tracker: ${text}`);
  }
}

/**
 * Update a job's stage in the tracker.
 */
export async function updateJobStage(
  spreadsheetId: string,
  jobId: number,
  newStage: string
): Promise<void> {
  const token = await getAccessToken();

  // First, find the row with this job ID
  const getResponse = await fetch(
    `${SHEETS_BASE_URL}/${spreadsheetId}/values/Pipeline!A:A`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!getResponse.ok) return;

  const data = await getResponse.json();
  const values: string[][] = data.values || [];

  const rowIndex = values.findIndex(
    (row) => String(row[0]) === String(jobId)
  );
  if (rowIndex === -1) return;

  // Update stage (column F) and last updated (column J)
  const now = new Date().toISOString().split("T")[0];
  await fetch(
    `${SHEETS_BASE_URL}/${spreadsheetId}/values/Pipeline!F${rowIndex + 1}:J${rowIndex + 1}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [[newStage, null, null, null, now]],
      }),
    }
  );
}

/**
 * Read all jobs from the tracker.
 */
export async function readTracker(
  spreadsheetId: string
): Promise<Array<Record<string, string>>> {
  const token = await getAccessToken();

  const response = await fetch(
    `${SHEETS_BASE_URL}/${spreadsheetId}/values/Pipeline!A:K`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) return [];

  const data = await response.json();
  const rows: string[][] = data.values || [];

  if (rows.length <= 1) return [];

  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] || "";
    });
    return obj;
  });
}
