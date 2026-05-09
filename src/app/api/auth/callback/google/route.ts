/**
 * GET /api/auth/callback/google — OAuth callback handler.
 * Exchanges the auth code for a refresh token and displays it.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;background:#111;color:#fff;">
        <h1 style="color:#ef4444;">OAuth Error: ${error}</h1>
        <p>Please try again.</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  if (!code) {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;background:#111;color:#fff;">
        <h1>No auth code received</h1>
        <p><a href="/api/auth/google-setup" style="color:#60a5fa;">Try again</a></p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/callback/google";

  if (!clientId || !clientSecret) {
    return new NextResponse("Google credentials not configured", { status: 500 });
  }

  // Exchange code for tokens
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;background:#111;color:#fff;">
        <h1 style="color:#ef4444;">Token Exchange Failed</h1>
        <p>${tokenData.error}: ${tokenData.error_description}</p>
        <p><a href="/api/auth/google-setup" style="color:#60a5fa;">Try again</a></p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  const refreshToken = tokenData.refresh_token;

  return new NextResponse(
    `<html><body style="font-family:sans-serif;padding:40px;background:#111;color:#fff;">
      <h1 style="color:#4ade80;">Success!</h1>
      <p>Add this to your <code>.env</code> file:</p>
      <pre style="background:#222;padding:16px;border-radius:8px;border:1px solid #333;overflow-x:auto;user-select:all;">GOOGLE_REFRESH_TOKEN=${refreshToken || "(no refresh token — try revoking access at myaccount.google.com/permissions and retry)"}</pre>
      <p style="color:#666;margin-top:16px;">Then restart the dev server. Email, Calendar, and Sheets will work.</p>
      <p><a href="/" style="color:#60a5fa;">Back to Dashboard</a></p>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
