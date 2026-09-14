import type { NextApiRequest, NextApiResponse } from "next";
import { runBackup } from "@/backend/services/backup/core";
import { getEnvAuthClient } from "@/backend/services/backup/envAuth";

/**
 * Hit weekly by Vercel Cron (see vercel.json). Dumps every MongoDB collection,
 * zips it, and uploads it to the "Barangay Backups" Google Drive folder --
 * the same thing `npm run backup` does locally, but running unattended in
 * production against the Atlas database.
 *
 * Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` on cron
 * invocations when a CRON_SECRET env var is set on the project, so we check
 * that here to make sure this endpoint can't be triggered by anyone else.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    return res.status(500).json({ error: "MONGODB_URI is not set" });
  }

  try {
    const auth = getEnvAuthClient();
    const result = await runBackup(mongodbUri, auth);
    console.log(`[backup] uploaded ${result.fileName}; collections: ${result.collectionsSummary.join(", ")}`);
    if (result.removedFromDrive.length) {
      console.log(`[backup] pruned old Drive backups: ${result.removedFromDrive.join(", ")}`);
    }
    return res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    console.error("[backup] failed:", err);
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
}
