/**
 * Core certificate generation service.
 *
 * Flow:
 *   1. Load template metadata from MongoDB (CertificateTemplate)
 *   2. Resolve all placeholder values:
 *        - "system"   → today's date, captain name, barangay, etc.
 *        - "resident" → resident's name, civil status, address, etc.
 *        - "manual"   → clerk-supplied values from the request body
 *   3. Validate that every required placeholder has a value
 *   4. Load the .docx template buffer from GridFS
 *   5. Replace {{PLACEHOLDERS}} via docxtemplater (renderDocx)
 *   6. Optionally convert to PDF via LibreOffice (convertToPdf)
 *   7. Optionally write an audit log entry (GeneratedCertificate)
 */

import CertificateTemplate from "@/backend/models/CertificateTemplate";
import GeneratedCertificate from "@/backend/models/GeneratedCertificate";
import Resident from "@/backend/models/Resident";
import { loadTemplateFile } from "./templateStorage";
import { renderDocx } from "./renderDocx";
import { convertToPdfQueued } from "./convertToPdf";
import { resolveSystemValues, resolveResidentValues } from "./systemValues";

/**
 * Clerks type amounts free-form ("5000", "5,000", "5000.5"). Normalize any
 * currency-typed manual field to "5,000.00" style formatting so every
 * certificate shows a consistently formatted peso amount regardless of how
 * it was typed.
 */
function formatCurrency(raw: string): string {
  if (!raw) return raw;
  const numeric = Number(raw.replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(numeric)) return raw;
  return numeric.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Error types ────────────────────────────────────────────────────────────

export class NotFoundError extends Error {}

export class ValidationError extends Error {
  constructor(message: string, public fields: string[]) {
    super(message);
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GenerateInput {
  /** MongoDB ObjectId of the resident — required when any placeholder has source: "resident" */
  residentId?: string;
  /** Clerk-supplied values for placeholders with source: "manual" */
  values: Record<string, string>;
  /** The authenticated user's id — stored in the audit log */
  userId: string;
  /** When false the call is a preview and no audit log entry is written. Default: true */
  persist?: boolean;
}

export interface GenerateResult {
  /** Filled .docx buffer — use this if format=docx */
  filledDocx: Buffer;
  /** PDF buffer — use this if format=pdf */
  pdf: Buffer;
}

// ─── Main function ───────────────────────────────────────────────────────────

export async function generateCertificate(
  templateKey: string,
  input: GenerateInput
): Promise<GenerateResult> {
  // 1. Load template
  const template = await CertificateTemplate.findOne({ key: templateKey, isActive: true });
  if (!template) throw new NotFoundError(`Unknown or inactive template: ${templateKey}`);

  // 2. Resolve values
  const resident = input.residentId ? await Resident.findById(input.residentId).populate("sitio") : null;
  const systemValues = await resolveSystemValues();
  const residentValues = resolveResidentValues(resident);

  const data: Record<string, string> = {};
  for (const p of template.placeholders) {
    if (p.source === "system") data[p.key] = systemValues[p.key] ?? "";
    else if (p.source === "resident") data[p.key] = residentValues[p.key] ?? "";
    else data[p.key] = input.values[p.key] ?? "";

    if (p.type === "currency") data[p.key] = formatCurrency(data[p.key]);
  }

  // 3. Validate required fields
  const missingRequired: string[] = template.placeholders
    .filter((p: any) => p.required && !data[p.key])
    .map((p: any) => p.key);
  if (missingRequired.length) {
    throw new ValidationError("Missing required fields", missingRequired);
  }

  // 4. Load template file from GridFS
  const docxBuffer = await loadTemplateFile(template.docxFileId);

  // 5. Replace placeholders
  const filledDocx = renderDocx(docxBuffer, data);

  // 6. Convert to PDF
  const pdf = await convertToPdfQueued(filledDocx);

  // 7. Audit log
  if (input.persist !== false) {
    await GeneratedCertificate.create({
      templateKey,
      templateVersion: template.version,
      residentId: input.residentId,
      data,
      generatedBy: input.userId,
    });
  }

  return { filledDocx, pdf };
}
