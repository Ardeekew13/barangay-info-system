/**
 * One-off batch fix: re-uploads the corrected .docx files (Documentary Stamp
 * Paid box: OR.NO on top / Date Issued below, star seal centered, missing
 * {{DATE_SHORT}} / {{OR_NUMBER}} tokens added) into GridFS for every
 * certificate template that needed it, without touching any other template.
 *
 * Run this ON YOUR MAC, from the project root, with the dev server free to
 * be stopped or running (either is fine -- this talks to Mongo directly,
 * not through the Next.js app):
 *
 *   node fix-templates.js
 *
 * It reads MONGODB_URI from .env.local, so run it from the project root.
 * Safe to re-run -- it just re-uploads the same fixed files again.
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const PizZip = require("pizzip");

// ---- load MONGODB_URI from .env.local without adding a dotenv dependency ----
function loadEnvLocal() {
  const envPath = path.join(__dirname, ".env.local");
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}
loadEnvLocal();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env.local -- aborting.");
  process.exit(1);
}

// key -> fixed file in public/docs/
const TEMPLATES_TO_FIX = [
  ["barangay-clearance-resident", "resident-clearance.template.docx"],
  ["barangay-clearance-non-resident", "non-resident-clearance.template.docx"],
  ["barangay-business-certification", "busines-certification.template.docx"],
  ["certificate-of-indigency", "certificate-of-indigency.template.docx"],
  ["certificate-of-good-moral-character", "good-moral-character.template.docx"],
  ["certificate-of-residency", "certificate-of-residency.template.docx"],
  ["certificate-of-residency-bhw", "certificate-of-residency-bhw.template.docx"],
  ["certificate-of-low-income", "certificate-of-low-income.template.docx"],
  ["certificate-of-low-income-2", "certificate-of-low-income-2.template.docx"],
  ["certification-senior-citizen", "certification-senior-citizen.template.docx"],
  ["certification-for-burial", "certification-for-burial.template.docx"],
  ["certificate-of-cohabitation", "certificate-of-cohabitation.template.docx"],
  ["certification-cutting-trees", "certification-cutting-trees.template.docx"],
  ["certificate-of-attestation", "certificate-of-attestation.template.docx"],
  ["certification-electric-bill", "certification-electric-bill.template.docx"],
  ["certification-electric-bill-2", "certification-electric-bill-2.template.docx"],
  ["certification-bala", "certification-bala.template.docx"],
  ["authorization-letter", "authorization-letter.template.docx"],
  ["certification-building-permit", "certification-building-permit.template.docx"],
  ["certification-no-adverse-claim", "certification-no-adverse-claim.template.docx"],
];

const BUCKET_NAME = "certificateTemplates";

// A few tags are brand-new (not on the existing template doc yet) but shouldn'''t
// default to a manual clerk-typed field -- they'''re computed from the resident record,
// same as HONORIFIC. Listed here so the batch fix wires them up correctly the first time.
const KNOWN_NEW_PLACEHOLDERS = {
  PRONOUN: { label: "He/She (auto from gender)", source: "resident", type: "text", required: true },
  PRONOUN_POSSESSIVE: { label: "His/Her (auto from gender)", source: "resident", type: "text", required: true },
};

// Mirrors src/backend/models/CertificateTemplate.ts closely enough for this script's needs.
const PlaceholderSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    source: { type: String, enum: ["resident", "manual", "system"], required: true },
    type: { type: String, enum: ["text", "date", "number", "currency", "select"], default: "text" },
    required: { type: Boolean, default: true },
    options: [String],
  },
  { _id: false }
);
const CertificateTemplateSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, default: "General" },
    description: String,
    docxFileId: { type: mongoose.Types.ObjectId, required: true },
    placeholders: [PlaceholderSchema],
    version: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
const CertificateTemplate =
  mongoose.models.CertificateTemplate || mongoose.model("CertificateTemplate", CertificateTemplateSchema);

// Same logic as src/backend/services/certificates/placeholderScanner.ts
function scanPlaceholders(buffer) {
  const zip = new PizZip(buffer);
  const xmlParts = Object.keys(zip.files).filter(
    (name) => name === "word/document.xml" || /word\/(header|footer)\d*\.xml/.test(name)
  );
  const tags = new Set();
  for (const part of xmlParts) {
    const xml = zip.file(part) ? zip.file(part).asText() : "";
    const flattened = xml.replace(/<[^>]+>/g, "");
    for (const m of flattened.matchAll(/{{\s*([A-Z0-9_]+)\s*}}/g)) tags.add(m[1]);
  }
  return Array.from(tags);
}

async function saveTemplateFile(bucket, buffer, filename) {
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename);
    uploadStream.on("error", reject);
    uploadStream.on("finish", () => resolve(uploadStream.id));
    uploadStream.end(buffer);
  });
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET_NAME });

  console.log(`Connected. Fixing ${TEMPLATES_TO_FIX.length} templates...\n`);

  for (const [key, filename] of TEMPLATES_TO_FIX) {
    try {
      const existing = await CertificateTemplate.findOne({ key });
      if (!existing) {
        console.log(`  [SKIP] ${key} -- no template found in the database with this key`);
        continue;
      }

      const filePath = path.join(__dirname, "public", "docs", filename);
      const buffer = fs.readFileSync(filePath);
      const detectedTags = scanPlaceholders(buffer);

      const existingByKey = new Map(existing.placeholders.map((p) => [p.key, p]));
      const placeholders = detectedTags.map((tag) => {
        const prev = existingByKey.get(tag);
        if (prev) return prev;
        if (KNOWN_NEW_PLACEHOLDERS[tag]) return { key: tag, ...KNOWN_NEW_PLACEHOLDERS[tag] };
        return { key: tag, label: tag.replace(/_/g, " "), source: "manual", type: "text", required: true };
      });
      const removedTags = existing.placeholders.map((p) => p.key).filter((k) => !detectedTags.includes(k));

      const newFileId = await saveTemplateFile(bucket, buffer, filename);

      const oldFileId = existing.docxFileId;
      existing.docxFileId = newFileId;
      existing.placeholders = placeholders;
      existing.version = (existing.version || 1) + 1;
      await existing.save();

      try {
        await bucket.delete(oldFileId);
      } catch (e) {
        // old GridFS file may already be gone -- fine
      }

      const note = removedTags.length ? ` (dropped unused tags: ${removedTags.join(", ")})` : "";
      console.log(`  [OK]   ${key} -> v${existing.version}${note}`);
    } catch (err) {
      console.log(`  [FAIL] ${key} -- ${err.message}`);
    }
  }

  console.log("\nDone.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
