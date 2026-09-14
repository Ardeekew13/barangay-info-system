/**
 * Shared backup logic used by both:
 *   - scripts/backup-to-drive.ts (run manually/locally, file-based OAuth)
 *   - src/pages/api/cron/backup.ts (run by Vercel Cron in production, env-var OAuth)
 *
 * Dumps every MongoDB collection to JSON, zips them, uploads the zip to a
 * "Barangay Backups" folder in Google Drive, and (when a local backups
 * directory is given) prunes old local + Drive backups beyond the retention
 * count.
 */

import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import os from "os";
import archiver from "archiver";
import type { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

const DRIVE_FOLDER_NAME = process.env.GOOGLE_DRIVE_FOLDER_NAME || "Barangay Backups";
const RETENTION_COUNT = Number(process.env.BACKUP_RETENTION_COUNT || 8);

function timestamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

async function dumpCollectionsToJson(mongodbUri: string, destDir: string) {
  const alreadyConnected = mongoose.connection.readyState === 1;
  if (!alreadyConnected) await mongoose.connect(mongodbUri);

  const db = mongoose.connection.db!;
  const collections = await db.listCollections().toArray();

  fs.mkdirSync(destDir, { recursive: true });

  const summary: string[] = [];
  for (const { name } of collections) {
    const docs = await db.collection(name).find({}).toArray();
    fs.writeFileSync(path.join(destDir, `${name}.json`), JSON.stringify(docs, null, 2));
    summary.push(`${name} (${docs.length})`);
  }

  if (!alreadyConnected) await mongoose.disconnect();
  return summary;
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
    requestBody: { name: DRIVE_FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" },
    fields: "id",
  });
  return folder.data.id as string;
}

async function uploadToDrive(auth: OAuth2Client, filePath: string, fileName: string) {
  const drive = google.drive({ version: "v3", auth: auth as any });
  const folderId = await getOrCreateBackupFolder(drive);

  await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType: "application/zip", body: fs.createReadStream(filePath) },
  });

  // Retention: keep only the most recent N backups in the Drive folder.
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id, name, createdTime)",
    orderBy: "createdTime desc",
    spaces: "drive",
  });
  const files = res.data.files || [];
  const removed: string[] = [];
  for (const f of files.slice(RETENTION_COUNT)) {
    await drive.files.delete({ fileId: f.id as string });
    removed.push(f.name as string);
  }
  return removed;
}

function cleanupLocalBackups(localBackupDir: string) {
  if (!fs.existsSync(localBackupDir)) return [];
  const files = fs
    .readdirSync(localBackupDir)
    .filter((f) => f.endsWith(".zip"))
    .map((f) => ({ name: f, time: fs.statSync(path.join(localBackupDir, f)).mtimeMs }))
    .sort((a, b) => b.time - a.time);

  const removed: string[] = [];
  for (const f of files.slice(RETENTION_COUNT)) {
    fs.unlinkSync(path.join(localBackupDir, f.name));
    removed.push(f.name);
  }
  return removed;
}

export interface BackupResult {
  fileName: string;
  collectionsSummary: string[];
  removedFromDrive: string[];
  removedLocally: string[];
}

/**
 * Runs one full backup: dump -> zip -> upload -> prune.
 *
 * `localBackupDir`, when given, is where the zip is kept on disk afterwards
 * (and pruned to the retention count) -- used by the local script so you
 * have a copy on your Mac too. When omitted (the Vercel Cron route), the zip
 * is built in the OS tmp dir and not kept around, since a serverless
 * function's filesystem doesn't persist between invocations anyway.
 */
export async function runBackup(
  mongodbUri: string,
  auth: OAuth2Client,
  localBackupDir?: string,
): Promise<BackupResult> {
  const ts = timestamp();
  const dumpDir = path.join(os.tmpdir(), `brgy-backup-${ts}`);
  const zipName = `barangay-backup-${ts}.zip`;
  const zipDir = localBackupDir || os.tmpdir();
  const zipPath = path.join(zipDir, zipName);

  fs.mkdirSync(zipDir, { recursive: true });

  const collectionsSummary = await dumpCollectionsToJson(mongodbUri, dumpDir);
  await zipDirectory(dumpDir, zipPath);
  fs.rmSync(dumpDir, { recursive: true, force: true });

  const removedFromDrive = await uploadToDrive(auth, zipPath, zipName);

  let removedLocally: string[] = [];
  if (localBackupDir) {
    removedLocally = cleanupLocalBackups(localBackupDir);
  } else {
    fs.rmSync(zipPath, { force: true });
  }

  return { fileName: zipName, collectionsSummary, removedFromDrive, removedLocally };
}
