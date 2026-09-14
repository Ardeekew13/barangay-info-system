import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import formidable from "formidable";
import { readFile } from "node:fs/promises";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import connectDB from "@/lib/mongodb";
import CertificateTemplate from "@/backend/models/CertificateTemplate";
import { saveTemplateFile } from "@/backend/services/certificates/templateStorage";
import { scanPlaceholders } from "@/backend/services/certificates/placeholderScanner";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST" } });

  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Only admins can upload certificate templates" } });
  }

  try {
    const form = formidable({ maxFileSize: 10 * 1024 * 1024 }); // 10MB is generous for a .docx
    const [fields, files] = await form.parse(req);

    const key = fields.key?.[0];
    const name = fields.name?.[0];
    const category = fields.category?.[0] || "General";
    const file = files.file?.[0];

    if (!key || !name || !file) {
      return res.status(422).json({ error: { code: "MISSING_FIELDS", message: "key, name, and file are required" } });
    }
    if (!file.originalFilename?.toLowerCase().endsWith(".docx")) {
      return res.status(422).json({ error: { code: "INVALID_FILE", message: "Only .docx files are supported" } });
    }

    await connectDB();

    const existing = await CertificateTemplate.findOne({ key });
    if (existing) {
      return res.status(409).json({ error: { code: "DUPLICATE_KEY", message: `A template with key "${key}" already exists` } });
    }

    const buffer = await readFile(file.filepath);
    const detectedTags = scanPlaceholders(buffer);
    const docxFileId = await saveTemplateFile(buffer, file.originalFilename);

    const template = await CertificateTemplate.create({
      key,
      name,
      category,
      docxFileId,
      // Auto-populated from the tags found in the docx -- admin reviews/edits labels, sources,
      // and required-ness via updateCertificateTemplatePlaceholders before clerks can use it well.
      placeholders: detectedTags.map((tag) => ({
        key: tag,
        label: tag.replace(/_/g, " "),
        source: "manual",
        type: "text",
        required: true,
      })),
    });

    return res.status(201).json({ template, detectedTags });
  } catch (error: any) {
    console.error("Certificate template upload failed:", error);
    return res.status(500).json({ error: { code: "INTERNAL", message: "Failed to upload template" } });
  }
}
