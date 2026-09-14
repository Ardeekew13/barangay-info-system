/**
 * Builds a Google OAuth2 client from environment variables instead of the
 * local credentials.json/token.json files -- needed because a Vercel Cron
 * function's filesystem is fresh on every invocation, so there's nowhere to
 * keep a token file between runs.
 *
 * Set these three in the Vercel project's Environment Variables:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 *
 * `npx tsx scripts/print-vercel-backup-env.ts` prints the exact values to
 * paste in, read from your already-authorized local credentials.json/token.json.
 */

import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

export function getEnvAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN env vars. " +
        "Run `npx tsx scripts/print-vercel-backup-env.ts` locally and add them in Vercel.",
    );
  }

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return oAuth2Client;
}
