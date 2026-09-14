import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import formidable from "formidable";
import { readFile } from "node:fs/promises";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import connectDB from "@/lib/mongodb";
import CertificateTemplate from "@/backend/models/CertificateTemplate";
import { saveTemplateFile, deleteTemplateFile } from "@/backend/services/certificates/templateStorage";
import { scanPlaceholders } from "@/backend/services/certificates/placeholderScanner";

export const config = { api: { bodyParser: false } };

/**
 * POST /api/certificates/[key]/replace
 *
 * Swaps the .docx file behind an existing template (admin only) -- the UI
 * equivalent of re-running `seed-certificate-templates.ts --update` for a
 * single template. Existing placeholder config (label/source/required) is
 * preserved for tags still present in the new file; brand-new tags are
 * appended as "manual"/required so an admin can review them afterwards.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST" } });

  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Only admins can replace certificate templates" } });
  }

  try {
    const key = req.query.key as string;

    await connectDB();

    const existing = await CertificateTemplate.findOne({ key });
    if (!existing) {
      return res.status(404).json({ error: { code: "TEMPLATE_NOT_FOUND", message: `Unknown template: ${key}` } });
    }

    const form = formidable({ maxFileSize: 10 * 1024 * 1024 }); // 10MB is generous for a .docx
    const [, files] = await form.parse(req);
    const file = files.file?.[0];

    if (!file) {
      return res.status(422).json({ error: { code: "MISSING_FIELDS", message: "file is required" } });
    }
    if (!file.originalFilename?.toLowerCase().endsWith(".docx")) {
      return res.status(422).json({ error: { code: "INVALID_FILE", message: "Only .docx files are supported" } });
    }

    const buffer = await readFile(file.filepath);
    const detectedTags = scanPlaceholders(buffer);

    // Preserve existing placeholder config for tags still present; append new tags as manual defaults.
    const existingByKey = new Map(existing.placeholders.map((p: any) => [p.key, p]));
    const placeholders = detectedTags.map((tag) => {
      const prev = existingByKey.get(tag);
      if (prev) return prev;
      return { key: tag, label: tag.replace(/_/g, " "), source: "manual", type: "text", required: true };
    });
    const removedTags = existing.placeholders.map((p: any) => p.key).filter((k: string) => !detectedTags.includes(k));

    const docxFileId = await saveTemplateFile(buffer, file.originalFilename);

    try {
      await deleteTemplateFile(existing.docxFileId);
    } catch (e) {
      // old GridFS file may already be gone -- don't block the swap on that
    }

    existing.docxFileId = docxFileId;
    existing.placeholders = placeholders as any;
    existing.version = (existing.version || 1) + 1;
    await existing.save();

    return res.status(200).json({ template: existing, detectedTags, removedTags });
  } catch (error: any) {
    console.error("Certificate template replace failed:", error);
    return res.status(500).json({ error: { code: "INTERNAL", message: "Failed to replace template file" } });
  }
}
