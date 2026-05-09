/**
 * Google OAuth Refresh Token Generator.
 *
 * 1. Opens Google consent screen in your browser
 * 2. You click "Allow"
 * 3. Captures the auth code via a local callback server
 * 4. Exchanges it for a refresh token
 * 5. Prints the token to paste into .env
 *
 * Usage: npx tsx scripts/get-google-token.ts
 */

import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";

// Load .env
const envPath = path.resolve(__dirname, "../.env");
const envContent = fs.readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.+)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const CLIENT_ID = env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3456/callback";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env");
  process.exit(1);
}

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPES)}` +
  `&access_type=offline` +
  `&prompt=consent`;

async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`Token exchange failed: ${data.error} — ${data.error_description}`);
  }

  return data.refresh_token;
}

async function main() {
  console.log("Google OAuth Refresh Token Generator\n");
  console.log("IMPORTANT: Before running this, go to Google Cloud Console:");
  console.log(`  https://console.cloud.google.com/apis/credentials`);
  console.log(`  Edit your OAuth client → Add this redirect URI:`);
  console.log(`  ${REDIRECT_URI}\n`);

  // Start local server to capture callback
  const server = http.createServer(async (req, res) => {
    if (!req.url?.startsWith("/callback")) {
      res.writeHead(404);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:3456`);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`<h1>Error: ${error}</h1><p>Please try again.</p>`);
      server.close();
      return;
    }

    if (!code) {
      res.writeHead(400, { "Content-Type": "text/html" });
      res.end("<h1>No code received</h1>");
      return;
    }

    try {
      const refreshToken = await exchangeCodeForToken(code);

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`
        <html><body style="font-family: sans-serif; padding: 40px; background: #111; color: #fff;">
          <h1 style="color: #4ade80;">✓ Success!</h1>
          <p>Refresh token obtained. You can close this tab.</p>
          <p style="color: #666;">Check your terminal for the token.</p>
        </body></html>
      `);

      console.log("\n✓ Refresh token obtained!\n");
      console.log("Add this to your .env file:\n");
      console.log(`GOOGLE_REFRESH_TOKEN=${refreshToken}\n`);

      server.close();
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/html" });
      res.end(`<h1>Error</h1><pre>${err}</pre>`);
      console.error(err);
      server.close();
    }
  });

  server.listen(3456, () => {
    console.log("Waiting for OAuth callback on http://localhost:3456/callback\n");
    console.log("Opening Google consent screen...\n");

    // Open browser
    exec(`open "${authUrl}"`);
  });
}

main().catch(console.error);
