/**
 * Run: npx tsx scripts/print-vercel-backup-env.ts
 *
 * Reads your already-authorized credentials.json + token.json (created by
 * `npm run backup` the first time you ran it) and prints the exact env var
 * values to add in Vercel so the weekly Cron backup can authenticate to
 * Google Drive without needing those files on the server.
 *
 * Add each of these in Vercel: Project -> Settings -> Environment Variables
 * (Production, at minimum):
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_REFRESH_TOKEN
 *   CRON_SECRET        (any random string -- generate with `openssl rand -hex 32`)
 *   MONGODB_URI        (your Atlas connection string)
 */

import path from "path";
import fs from "fs";

const CREDENTIALS_PATH = path.resolve(__dirname, "../credentials.json");
const TOKEN_PATH = path.resolve(__dirname, "../token.json");

if (!fs.existsSync(CREDENTIALS_PATH) || !fs.existsSync(TOKEN_PATH)) {
  console.error("❌ Missing credentials.json and/or token.json.");
  console.error("   Run `npx tsx scripts/backup-to-drive.ts` first to complete the one-time Google sign-in.");
  process.exit(1);
}

const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
const { client_id, client_secret } = credentials.installed || credentials.web;
const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));

if (!token.refresh_token) {
  console.error("❌ token.json has no refresh_token.");
  console.error(
    "   Google only issues one the first time an app is authorized. Revoke access at " +
      "https://myaccount.google.com/permissions, delete token.json, and re-run `npx tsx scripts/backup-to-drive.ts`.",
  );
  process.exit(1);
}

console.log("Paste these into Vercel (Project -> Settings -> Environment Variables):\n");
console.log(`GOOGLE_CLIENT_ID=${client_id}`);
console.log(`GOOGLE_CLIENT_SECRET=${client_secret}`);
console.log(`GOOGLE_REFRESH_TOKEN=${token.refresh_token}`);
console.log("\n(Also add CRON_SECRET, MONGODB_URI, NEXTAUTH_SECRET, NEXTAUTH_URL -- see the deploy instructions.)");
