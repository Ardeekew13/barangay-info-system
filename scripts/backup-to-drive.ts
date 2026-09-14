/**
 * Run: npx tsx scripts/backup-to-drive.ts
 *
 * One-time setup — see BACKUP_SETUP.md for the full walkthrough:
 *   1. Create a Google Cloud project, enable the Google Drive API.
 *   2. Create an OAuth 2.0 Client ID (type: Desktop app), download the JSON,
 *      save it as `credentials.json` in the project root.
 *   3. Run this script once. It prints a URL — open it, sign in with the
 *      Google account you want backups saved to, approve access, and paste
 *      the code back into the terminal. This creates `token.json` so every
 *      run after that is fully automatic (no browser needed again).
 *
 * This does the same backup as the weekly Vercel Cron job in production
 * (src/pages/api/cron/backup.ts) -- both call the shared logic in
 * src/backend/services/backup/core.ts. Use this script to run a backup
 * on demand from your Mac, or to complete the one-time Google OAuth flow
 * that scripts/print-vercel-backup-env.ts then reads from.
 */

import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";
import readline from "readline";
import { google } from "googleapis";
import { runBackup, type OAuth2Client } from "../src/backend/services/backup/core";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

const CREDENTIALS_PATH =
  process.env.GOOGLE_CREDENTIALS_PATH || path.resolve(__dirname, "../credentials.json");
const TOKEN_PATH = process.env.GOOGLE_TOKEN_PATH || path.resolve(__dirname, "../token.json");
const LOCAL_BACKUP_DIR = path.resolve(__dirname, "../backups");

// drive.file = the app can only see/manage files IT created. It cannot browse
// the rest of your Drive. Safest scope for an unattended backup script.
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

async function getAuthorizedClient(): Promise<OAuth2Client> {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error(`❌ Missing ${CREDENTIALS_PATH}`);
    console.error(
      "   Download an OAuth Desktop App credentials.json from Google Cloud Console and place it there.\n" +
        "   See BACKUP_SETUP.md for the step-by-step instructions.",
    );
    process.exit(1);
  }

  const parsed = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
  const { client_secret, client_id, redirect_uris } = parsed.installed || parsed.web;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (fs.existsSync(TOKEN_PATH)) {
    oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8")));
    return oAuth2Client;
  }

  const authUrl = oAuth2Client.generateAuthUrl({ access_type: "offline", scope: SCOPES });

  console.log("\n🔑 First-time setup: open this URL, sign in, and approve access:\n");
  console.log(authUrl);
  console.log("");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise<string>((resolve) => {
    rl.question("Paste the code you received here: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log(`✅ Saved token to ${TOKEN_PATH} — future runs will be fully automatic.\n`);
  if (!tokens.refresh_token) {
    console.log(
      "⚠️  No refresh_token in the response (Google only sends one the first time you " +
        "authorize this app). If you ever need a fresh one, revoke access at " +
        "https://myaccount.google.com/permissions and run this script again.",
    );
  }

  return oAuth2Client;
}

async function main() {
  const auth = await getAuthorizedClient();
  console.log("✅ Authorized. Starting backup...\n");
  const result = await runBackup(MONGODB_URI, auth, LOCAL_BACKUP_DIR);

  for (const line of result.collectionsSummary) console.log(`📄 Dumped ${line}`);
  console.log(`🗜️  Created backups/${result.fileName}`);
  console.log(`☁️  Uploaded ${result.fileName} to Google Drive`);
  for (const name of result.removedFromDrive) console.log(`🗑️  Removed old Drive backup: ${name}`);
  for (const name of result.removedLocally) console.log(`🗑️  Removed old local backup: ${name}`);

  console.log("\n✅ Backup complete.");
}

main().catch((err) => {
  console.error("❌ Backup failed:", err.message || err);
  process.exit(1);
});
