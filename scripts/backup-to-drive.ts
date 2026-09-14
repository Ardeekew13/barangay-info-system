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
 * What it does every run:
 *   - Dumps every MongoDB collection to a JSON file
 *   - Zips them into one timestamped archive
 *   - Uploads the zip to a "Barangay Backups" folder in Google Drive
 *   - Deletes old backups beyond the retention count, both locally and on Drive
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";
import os from "os";
import readline from "readline";
import archiver from "archiver";
import { google } from "googleapis";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

const CREDENTIALS_PATH =
  process.env.GOOGLE_CREDENTIALS_PATH || path.resolve(__dirname, "../credentials.json");
const TOKEN_PATH = process.env.GOOGLE_TOKEN_PATH || path.resolve(__dirname, "../token.json");
const DRIVE_FOLDER_NAME = process.env.GOOGLE_DRIVE_FOLDER_NAME || "Barangay Backups";
const RETENTION_COUNT = Number(process.env.BACKUP_RETENTION_COUNT || 8);
const LOCAL_BACKUP_DIR = path.resolve(__dirname, "../backups");

// drive.file = the app can only see/manage files IT created. It cannot browse
// the rest of your Drive. Safest scope for an unattended backup script.
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

function timestamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

// ---------- Google auth ----------

async function getAuthorizedClient() {
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

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

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

  return oAuth2Client;
}

async function getOrCreateBackupFolder(drive: any): Promise<string> {
  const res = await drive.files.list({
    q: `name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
    spaces: "drive",
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id as string;
  }

  const folder = await drive.files.create({
    requestBody: {
      name: DRIVE_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
    },
    fields: "id",
  });

  console.log(`📁 Created "${DRIVE_FOLDER_NAME}" folder in Google Drive`);
  return folder.data.id as string;
}

async function uploadToDrive(filePath: string, fileName: string) {
  const auth = await getAuthorizedClient();
  const drive = google.drive({ version: "v3", auth: auth as any });
  const folderId = await getOrCreateBackupFolder(drive);

  await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType: "application/zip",
      body: fs.createReadStream(filePath),
    },
  });

  console.log(`☁️  Uploaded ${fileName} to Google Drive`);

  // Retention: keep only the most recent N backups in the Drive folder
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id, name, createdTime)",
    orderBy: "createdTime desc",
    spaces: "drive",
  });

  const files = res.data.files || [];
  const toDelete = files.slice(RETENTION_COUNT);
  for (const f of toDelete) {
    await drive.files.delete({ fileId: f.id as string });
    console.log(`🗑️  Removed old Drive backup: ${f.name}`);
  }
}

// ---------- Mongo dump ----------

async function dumpCollectionsToJson(destDir: string) {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  const db = mongoose.connection.db!;
  const collections = await db.listCollections().toArray();

  fs.mkdirSync(destDir, { recursive: true });

  for (const { name } of collections) {
    const docs = await db.collection(name).find({}).toArray();
    fs.writeFileSync(path.join(destDir, `${name}.json`), JSON.stringify(docs, null, 2));
    console.log(`📄 Dumped ${name} (${docs.length} documents)`);
  }

  await mongoose.disconnect();
}

function zipDirectory(sourceDir: string, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve());
    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

function cleanupLocalBackups() {
  if (!fs.existsSync(LOCAL_BACKUP_DIR)) return;
  const files = fs
    .readdirSync(LOCAL_BACKUP_DIR)
    .filter((f) => f.endsWith(".zip"))
    .map((f) => ({ name: f, time: fs.statSync(path.join(LOCAL_BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.time - a.time);

  for (const f of files.slice(RETENTION_COUNT)) {
    fs.unlinkSync(path.join(LOCAL_BACKUP_DIR, f.name));
    console.log(`🗑️  Removed old local backup: ${f.name}`);
  }
}

// ---------- Main ----------

async function main() {
  const ts = timestamp();
  const tmpDir = path.join(os.tmpdir(), `brgy-backup-${ts}`);
  const zipName = `barangay-backup-${ts}.zip`;
  const zipPath = path.join(LOCAL_BACKUP_DIR, zipName);

  fs.mkdirSync(LOCAL_BACKUP_DIR, { recursive: true });

  await dumpCollectionsToJson(tmpDir);
  await zipDirectory(tmpDir, zipPath);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(`🗜️  Created ${zipPath}`);

  await uploadToDrive(zipPath, zipName);
  cleanupLocalBackups();

  console.log("\n✅ Backup complete.");
}

main().catch((err) => {
  console.error("❌ Backup failed:", err.message || err);
  process.exit(1);
});
