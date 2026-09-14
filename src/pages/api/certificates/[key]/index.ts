/**
 * POST /api/certificates/[key]
 *
 * Generates a certificate from a DOCX template stored in GridFS.
 * Placeholders like {{FULL_NAME}} are replaced with supplied + system values.
 *
 * Query params:
 *   format  = "pdf" (default) | "docx"   – response content type
 *   persist = "true" | "false" (default) – whether to write an audit log entry
 *
 * Body (JSON):
 *   residentId  – optional MongoDB ObjectId; required when the template has resident-sourced placeholders
 *   values      – key/value map for manual placeholders (e.g. { OR_NUMBER: "12345" })
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import connectDB from "@/lib/mongodb";
import {
  generateCertificate,
  NotFoundError,
  ValidationError,
} from "@/backend/services/certificates/generateCertificate";
import { MissingPlaceholderError } from "@/backend/services/certificates/renderDocx";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST" } });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Sign in required" } });
  }

  try {
    await connectDB();

    const templateKey = req.query.key as string;
    const format = (req.query.format as string) === "docx" ? "docx" : "pdf";
    const persist = req.query.persist === "true";
    const { residentId, values } = req.body ?? {};

    const result = await generateCertificate(templateKey, {
      residentId,
      values: values ?? {},
      userId: (session.user as any).id,
      persist,
    });

    if (format === "docx") {
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="${templateKey}.docx"`);
      return res.status(200).send(result.filledDocx);
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${templateKey}.pdf"`);
    return res.status(200).send(result.pdf);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: { code: "TEMPLATE_NOT_FOUND", message: err.message } });
    }
    if (err instanceof ValidationError) {
      return res.status(422).json({ error: { code: "MISSING_FIELDS", message: err.message, fields: err.fields } });
    }
    if (err instanceof MissingPlaceholderError) {
      return res.status(500).json({ error: { code: "TEMPLATE_TAG_UNRESOLVED", message: err.message, tags: err.tags } });
    }
    console.error("[certificate generate]", err);
    return res.status(500).json({ error: { code: "INTERNAL", message: "Failed to generate certificate" } });
  }
}
