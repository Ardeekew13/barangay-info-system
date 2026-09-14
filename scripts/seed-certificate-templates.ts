/**
 * Run: npx tsx scripts/seed-certificate-templates.ts
 * Uploads the tokenized .docx sample templates into GridFS and registers
 * their CertificateTemplate metadata (placeholders + sources).
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

const PlaceholderSchema = new mongoose.Schema(
  {
    key: String,
    label: String,
    source: String,
    type: String,
    required: Boolean,
    options: [String],
  },
  { _id: false }
);

const CertificateTemplateSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true },
    name: String,
    category: String,
    description: String,
    docxFileId: mongoose.Schema.Types.ObjectId,
    placeholders: [PlaceholderSchema],
    version: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const CertificateTemplate =
  mongoose.models.CertificateTemplate || mongoose.model("CertificateTemplate", CertificateTemplateSchema);

// Common date/system fields every one of these templates uses.
const SYSTEM_DATE_PLACEHOLDERS = [
  { key: "DATE", label: "Date (e.g. June 12, 2026)", source: "system", type: "text", required: true },
  { key: "DATE_DAY", label: "Date - Day", source: "system", type: "text", required: true },
  { key: "DATE_DAY_SUFFIX", label: "Date - Day Suffix", source: "system", type: "text", required: true },
  { key: "DATE_MONTH", label: "Date - Month", source: "system", type: "text", required: true },
  { key: "DATE_YEAR", label: "Date - Year", source: "system", type: "text", required: true },
  { key: "DATE_ISSUED", label: "Date Issued", source: "system", type: "text", required: true },
  { key: "DATE_SHORT", label: "Date Issued (short)", source: "system", type: "text", required: true },
  { key: "CAPTAIN_NAME", label: "Barangay Captain", source: "system", type: "text", required: true },
  { key: "ISSUED_AT", label: "Issued At", source: "system", type: "text", required: true },
];

// Each certificate is tied to its own physical receipt, so the O.R. number is typed in
// by the clerk every time -- it's not something that can be auto-filled or reused.
const OR_NUMBER_PLACEHOLDER = { key: "OR_NUMBER", label: "O.R. Number", source: "manual", type: "text", required: true };

const TEMPLATES = [
  {
    key: "barangay-clearance-resident",
    name: "Barangay Clearance (Resident)",
    category: "Clearance",
    file: "resident-clearance.template.docx",
    placeholders: [
      { key: "FULL_NAME", label: "Full Name", source: "resident", type: "text", required: true },
      { key: "HONORIFIC", label: "Mr./Mrs./Ms. (auto from gender + civil status)", source: "resident", type: "text", required: true },
      { key: "PRONOUN", label: "He/She (auto from gender)", source: "resident", type: "text", required: true },
      { key: "CIVIL_STATUS", label: "Civil Status", source: "resident", type: "text", required: true },
      { key: "BARANGAY", label: "Barangay", source: "system", type: "text", required: true },
      ...SYSTEM_DATE_PLACEHOLDERS,
      OR_NUMBER_PLACEHOLDER,
    ],
  },
  {
    key: "barangay-clearance-non-resident",
    name: "Barangay Clearance (Non-Resident)",
    category: "Clearance",
    file: "non-resident-clearance.template.docx",
    placeholders: [
      // Non-residents aren't in the resident database, so their name has to be typed in by hand.
      { key: "FULL_NAME", label: "Full Name", source: "manual", type: "text", required: true },
      { key: "FROM_BARANGAY", label: "From Barangay", source: "manual", type: "text", required: true },
      ...SYSTEM_DATE_PLACEHOLDERS,
      OR_NUMBER_PLACEHOLDER,
    ],
  },
  {
    key: "barangay-business-certification",
    name: "Barangay Business Certification",
    category: "Certification",
    file: "busines-certification.template.docx",
    placeholders: [
      { key: "FULL_NAME", label: "Full Name", source: "resident", type: "text", required: true },
      { key: "BARANGAY", label: "From Barangay", source: "manual", type: "text", required: true },
      { key: "BUSINESS_TYPE", label: "Business Type", source: "manual", type: "text", required: true },
      ...SYSTEM_DATE_PLACEHOLDERS,
      OR_NUMBER_PLACEHOLDER,
    ],
  },
  {
    key: "certificate-of-indigency",
    name: "Certificate of Indigency",
    category: "Certification",
    file: "certificate-of-indigency.template.docx",
    placeholders: [
      { key: "FULL_NAME", label: "Full Name", source: "resident", type: "text", required: true },
      { key: "HONORIFIC", label: "Mr./Mrs./Ms. (auto from gender + civil status)", source: "resident", type: "text", required: true },
      { key: "PRONOUN", label: "He/She (auto from gender)", source: "resident", type: "text", required: true },
      { key: "ADDRESS", label: "Address", source: "resident", type: "text", required: true },
      { key: "BARANGAY", label: "Barangay", source: "system", type: "text", required: true },
      { key: "PARENT_LABEL", label: "Father/Mother (auto from gender)", source: "resident", type: "text", required: true },
      { key: "CHILD_NAME", label: "Child's Name (if applicable)", source: "manual", type: "text", required: false },
      ...SYSTEM_DATE_PLACEHOLDERS,
      OR_NUMBER_PLACEHOLDER,
    ],
  },
  {
    key: "certificate-of-good-moral-character",
    name: "Certificate of Good Moral Character",
    category: "Certification",
    file: "good-moral-character.template.docx",
    placeholders: [
      { key: "FULL_NAME", label: "Full Name", source: "resident", type: "text", required: true },
      { key: "HONORIFIC", label: "Mr./Mrs./Ms. (auto from gender + civil status)", source: "resident", type: "text", required: true },
      { key: "POSITION", label: "Position/Role in Barangay", source: "manual", type: "text", required: true },
      { key: "BARANGAY", label: "Barangay", source: "system", type: "text", required: true },
      ...SYSTEM_DATE_PLACEHOLDERS,
      OR_NUMBER_PLACEHOLDER,
    ],
  },
  {
    // Plain proof-of-residency certificate -- distinct from "certificate-of-residency-bhw" below,
    // which additionally certifies years of service as a Barangay Health Worker.
    key: "certificate-of-residency",
    name: "Certificate of Residency",
    category: "Certification",
    file: "certificate-of-residency.template.docx",
    placeholders: [
      { key: "FULL_NAME", label: "Full Name", source: "resident", type: "text", required: true },
      { key: "AGE", label: "Age", source: "resident", type: "text", required: true },
      { key: "CIVIL_STATUS", label: "Civil Status", source: "resident", type: "text", required: true },
      { key: "YEARS_OF_RESIDENCY", label: "Years of Residency", source: "manual", type: "text", required: true },
      { key: "BARANGAY", label: "Barangay", source: "system", type: "text", required: true },
      ...SYSTEM_DATE_PLACEHOLDERS,
      OR_NUMBER_PLACEHOLDER,
    ],
  },
  {
    // Residency + service certificate for a Barangay Health Worker (BHW) -- used to certify
    // tenure/years of service, not just residency. Kept as a separate template/key from
    // "certificate-of-residency" since the content and purpose differ.
    key: "certificate-of-residency-bhw",
    name: "Certificate of Residency (Barangay Health Worker)",
    category: "Certification",
    file: "certificate-of-residency-bhw.template.docx",
    placeholders: [
      { key: "FULL_NAME", label: "Full Name", source: "resident", type: "text", required: true },
      { key: "AGE", label: "Age", source: "resident", type: "text", required: true },
      { key: "CIVIL_STATUS", label: "Civil Status", source: "resident", type: "text", required: true },
      { key: "BIRTH_DATE", label: "Birth Date", source: "resident", type: "text", required: true },
      { key: "BARANGAY", label: "Barangay", source: "system", type: "text", required: true },
      { key: "SERVICE_START_DATE", label: "BHW Service Start Date", source: "manual", type: "text", required: true },
      { key: "YEARS_OF_SERVICE", label: "Years of Service", source: "manual", type: "text", required: true },
      { key: "REQUESTOR_NAME", label: "Requested By", source: "manual", type: "text", required: true },
      ...SYSTEM_DATE_PLACEHOLDERS,
      OR_NUMBER_PLACEHOLDER,
    ],
  },
  {
    key: "certificate-of-low-income",
    name: "Certificate of Low Income",
    category: "Certification",
    file: "certificate-of-low-income.template.docx",
    placeholders: [
      { key: "FULL_NAME", label: "Full Name", source: "resident", type: "text", required: true },
      { key: "HONORIFIC", label: "Mr./Mrs./Ms. (auto from gender + civil status)", source: "resident", type: "text", required: true },
      { key: "ADDRESS", label: "Address", source: "resident", type: "text", required: true },
      { key: "DAUGHTER_NAME", label: "Daughter's Name", source: "manual", type: "text", required: true },
      { key: "MONTHLY_INCOME", label: "Monthly Income", source: "manual", type: "currency", required: true },
      { key: "BARANGAY", label: "Barangay", source: "system", type: "text", required: true },
      ...SYSTEM_DATE_PLACEHOLDERS,
      OR_NUMBER_PLACEHOLDER,
    ],
  },
  {
    // Same certificate type as "certificate-of-low-income" above but for a different
    // household situation (income in support of a scholarship application). Kept as a
    // separate template/key since the wording and fields differ.
    key: "certificate-of-low-income-2",
    name: "Certificate of Low Income (Scholarship Support)",
    category: "Certification",
    file: "certificate-of-low-income-2.template.docx",
    placeholders: [
      { key: "FULL_NAME", label: "Full Name", source: "resident", type: "text", required: true },
      { key: "HONORIFIC", label: "Mr./Mrs./Ms. (auto from gender + civil status)", source: "resident", type: "text", required: true },
      { key: "ADDRESS", label: "Address", source: "resident", type: "text", required: true },
      { key: "SPOUSE_NAME", label: "Spouse's Name", source: "manual", type: "text", required: true },
      { key: "CHILD_NAME", label: "Child's Name", source: "manual", type: "text", required: true },
      { key: "OCCUPATION", label: "Occupation", source: "resident", type: "text", required: true },
      { key: "MONTHLY_INCOME", label: "Monthly Income", source: "manual", type: "currency", required: true },
      { key: "BARANGAY", label: "Barangay", source: "system", type: "text", required: true },
      ...SYSTEM_DATE_PLACEHOLDERS,
      OR_NUMBER_PLACEHOLDER,
    ],
  },
  {
    key: "certification-senior-citizen",
    name: "Certification of Low Income (Senior Citizen)",
    category: "Certification",
    file: "certification-senior-citizen.template.docx",
    placeholders: [
      { key: "FULL_NAME", label: "Full Name", source: "resident", type: "text", required: true },
      { key: "HONORIFIC", label: "Mr./Mrs./Ms. (auto from gender + civil status)", source: "resident", type: "text", required: true },
      { key: "ADDRESS", label: "Address", source: "resident", type: "text", required: true },
      { key: "SPOUSE_NAME", label: "Spouse's Name", source: "manual", type: "text", required: true },
      { key: "CHILD_NAME", label: "Child's Name", source: "manual", type: "text", required: true },
      { key: "MONTHLY_PENSION", label: "Monthly Pension", source: "manual", type: "currency", required: true },
      { key: "BARANGAY", label: "Barangay", source: "system", type: "text", required: true },
      ...SYSTEM_DATE_PLACEHOLDERS,
      OR_NUMBER_PLACEHOLDER,
    ],
  },
  {
    key: "certification-for-burial",
    name: "Certification for Burial Assistance",
    category: "Certification",
    file: "certification-for-burial.template.docx",
    placeholders: [
      { key: "DECEASED_NAME", label: "Deceased's Name", source: "manual", type: "text", required: true },
      { key: "REQUESTOR_NAME", label: "Requested By", source: "manual", type: "text", required: true },
      { key: "BARANGAY", label: "Barangay", source: "system", type: "text", required: true },
      ...SYSTEM_DATE_PLACEHOLDERS,
      OR_NUMBER_PLACEHOLDER,
    ],
  },
  {
    key: "certification-first-time-jobseeker",
    name: "Certification (First-Time Jobseeker)",
    category: "Certification",
    file: "certification-first-time-jobseeker.template.docx",
    placeholders: [
      { key: "FULL_NAME", label: "Full Name", source: "resident", type: "text", required: true },
      { key: "BARANGAY", label: "Barangay", source: "system", type: "text", required: true },
      ...SYSTEM_DATE_PLACEHOLDERS,
      OR_NUMBER_PLACEHOLDER,
    ],
  },
  {
    // Covers two people at once (no single "resident" selector) -- both names are manual fields.
    key: "certificate-of-cohabitation",
    name: "Certificate of Cohabitation",
    category: "Certification",
    file: "certificate-of-cohabitation.template.docx",
    placeholders: [
      { key: "FULL_NAME_1", label: "Full Name (Partner 1)", source: "manual", type: "text", required: true },
      { key: "BIRTH_DATE_1", label: "Birth Date (Partner 1)", source: "manual", type: "text", required: true },
      { key: "BIRTHPLACE_1", label: "Birthplace (Partner 1)", source: "manual", type: "text", required: true },
      { key: "FULL_NAME_2", label: "Full Name (Partner 2)", source: "manual", type: "text", required: true },
      { key: "BIRTH_DATE_2", label: "Birth Date (Partner 2)", source: "manual", type: "text", required: true },
      { key: "BIRTHPLACE_2", label: "Birthplace (Partner 2)", source: "manual", type: "text", required: true },
      { key: "YEARS_COHABITING", label: "Years Living Together", source: "manual", type: "text", required: true },
      { key: "BARANGAY", label: "Barangay", source: "system", type: "text", required: true },
      ...SYSTEM_DATE_PLACEHOLDERS,
      OR_NUMBER_PLACEHOLDER,
    ],
  },
  {
    // No {{OR_NUMBER}} in this doc -- omitted here so clerks aren't asked for an O.R. number
    // that would never appear on the certificate.
    key: "certificate-of-attestation",
    name: "Certificate of Attestation (Low Income)",
    category: "Certification",
    file: "certificate-of-attestation.template.docx",
    placeholders: [
      { key: "FULL_NAME", label: "Full Name", source: "resident", type: "text", required: true },
      { key: "HONORIFIC", label: "Mr./Mrs./Ms. (auto from gender + civil status)", source: "resident", type: "text", required: true },
      { key: "AGE", label: "Age", source: "resident", type: "text", required: true },
      { key: "POSITION", label: "Position/Role", source: "manual", type: "text", required: true },
      { key: "MONTHLY_INCOME", label: "Monthly Income", source: "manual", type: "currency", required: true },
      { key: "BARANGAY", label: "Barangay", source: "system", type: "text", required: true },
      ...SYSTEM_DATE_PLACEHOLDERS,
    ],
  },
  {
    // No {{OR_NUMBER}} in this doc -- it's certified/approved by the captain and mayor, not paid for.
    key: "certification-bala",
    name: "Certification (Barangay Livestock Aide)",
    category: "Certification",
    file: "certification-bala.template.docx",
    placeholders: [
      { key: "FULL_NAME", label: "Full Name", source: "resident", type: "text", required: true },
      { key: "PRONOUN", label: "He/She (auto from gender)", source: "resident", type: "text", required: true },
      { key: "POSITION", label: "Position/Role", source: "manual", type: "text", required: true },
      { key: "MAYOR_NAME", label: "Municipal Mayor's Name", source: "manual", type: "text", required: true },
      { key: "BARANGAY", label: "Barangay", source: "system", type: "text", required: true },
      ...SYSTEM_DATE_PLACEHOLDERS,
    ],
  },
  {
    key: "certification-cutting-trees",
    name: "Certification (Tree Cutting Permit Support)",
    category: "Certification",
    file: "certification-cutting-trees.template.docx",
    placeholders: [
      { key: "FULL_NAME", label: "Full Name", source: "resident", type: "text", required: true },
      { key: "HONORIFIC", label: "Mr./Mrs./Ms. (auto from gender + civil status)", source: "resident", type: "text", required: true },
      { key: "LOT_LOCATION", label: "Lot Location", source: "manual", type: "text", required: true },
      { key: "BARANGAY", label: "Barangay", source: "system", type: "text", required: true },
      ...SYSTEM_DATE_PLACEHOLDERS,
      OR_NUMBER_PLACEHOLDER,
    ],
  },
  {
    // Barangay-wide statement -- no named resident, no O.R. number, no manual fields at all.
    key: "certification-no-smuggled-cigarettes",
    name: "Certification (No Smuggled Cigarettes)",
    category: "Certification",
    file: "certification-no-smuggled-cigarettes.template.docx",
    placeholders: [
      { key: "BARANGAY", label: "Barangay", source: "system", type: "text", required: true },
      ...SYSTEM_DATE_PLACEHOLDERS,
    ],
  },
  {
    // No {{OR_NUMBER}} in this doc (O.R. line is left blank in the source).
    key: "certification-electric-bill",
    name: "Certification (Electric Bill Proof of Residence)",
    category: "Certification",
    file: "certification-electric-bill.template.docx",
    placeholders: [
      { key: "FULL_NAME", label: "Full Name", source: "resident", type: "text", required: true },
      { key: "HONORIFIC", label: "Mr./Mrs./Ms. (auto from gender + civil status)", source: "resident", type: "text", required: true },
      { key: "PRONOUN", label: "He/She (auto from gender)", source: "resident", type: "text", required: true },
      { key: "PRONOUN_POSSESSIVE", label: "His/Her (auto from gender)", source: "resident", type: "text", required: true },
      { key: "ADDRESS", label: "Address", source: "resident", type: "text", required: true },
      { key: "RELATIVE_RELATION", label: "Relative's Relation (e.g. grandfather, uncle)", source: "manual", type: "text", required: true },
      { key: "RELATIVE_NAME", label: "Relative's Name", source: "manual", type: "text", required: true },
      { key: "BILL_PAYER_NAME", label: "Who Pays the Bill", source: "manual", type: "text", required: true },
      { key: "BARANGAY", label: "Barangay", source: "system", type: "text", required: true },
      ...SYSTEM_DATE_PLACEHOLDERS,
    ],
  },
  {
    // Same certificate type as "certification-electric-bill" above, but this source doc has an
    // {{OR_NUMBER}} filled in and no separate bill-payer name -- kept as its own template/key.
    key: "certification-electric-bill-2",
    name: "Certification (Electric Bill Proof of Residence) — Alt",
    category: "Certification",
    file: "certification-electric-bill-2.template.docx",
    placeholders: [
      { key: "FULL_NAME", label: "Full Name", source: "resident", type: "text", required: true },
      { key: "HONORIFIC", label: "Mr./Mrs./Ms. (auto from gender + civil status)", source: "resident", type: "text", required: true },
      { key: "PRONOUN", label: "He/She (auto from gender)", source: "resident", type: "text", required: true },
      { key: "PRONOUN_POSSESSIVE", label: "His/Her (auto from gender)", source: "resident", type: "text", required: true },
      { key: "ADDRESS", label: "Address", source: "resident", type: "text", required: true },
      { key: "RELATIVE_RELATION", label: "Relative's Relation (e.g. grandfather, uncle)", source: "manual", type: "text", required: true },
      { key: "RELATIVE_NAME", label: "Relative's Name", source: "manual", type: "text", required: true },
      { key: "BARANGAY", label: "Barangay", source: "system", type: "text", required: true },
      ...SYSTEM_DATE_PLACEHOLDERS,
      OR_NUMBER_PLACEHOLDER,
    ],
  },
  {
    // A personal letter, not a captain-issued certificate -- no CAPTAIN_NAME/OR_NUMBER in this doc.
    key: "authorization-letter",
    name: "Authorization Letter (Claim on Behalf)",
    category: "General",
    file: "authorization-letter.template.docx",
    placeholders: [
      { key: "FULL_NAME", label: "Full Name (Letter Signer)", source: "resident", type: "text", required: true },
      { key: "HONORIFIC", label: "Mr./Mrs./Ms. (auto from gender + civil status)", source: "resident", type: "text", required: true },
      { key: "RELATIONSHIP", label: "Relationship to the person being authorized (e.g. mother, father, spouse)", source: "manual", type: "text", required: true },
      { key: "AUTHORIZED_PERSON_NAME", label: "Person Being Authorized (Full Name)", source: "manual", type: "text", required: true },
      { key: "DOCUMENT_TO_CLAIM", label: "Document/item being claimed (e.g. MDR, Certificate of Residency, ID)", source: "manual", type: "text", required: true },
      { key: "PURPOSE", label: "Purpose (e.g. hospitalization, school requirement)", source: "manual", type: "text", required: true },
      { key: "BARANGAY", label: "Barangay", source: "system", type: "text", required: true },
      ...SYSTEM_DATE_PLACEHOLDERS,
    ],
  },
  {
    key: "certification-building-permit",
    name: "Certification (Building Permit Support)",
    category: "Certification",
    file: "certification-building-permit.template.docx",
    placeholders: [
      { key: "FULL_NAME", label: "Full Name", source: "resident", type: "text", required: true },
      { key: "HONORIFIC", label: "Mr./Mrs./Ms. (auto from gender + civil status)", source: "resident", type: "text", required: true },
      { key: "ADDRESS", label: "Address", source: "resident", type: "text", required: true },
      { key: "LOT_NUMBER", label: "Lot Number", source: "manual", type: "text", required: true },
      { key: "BARANGAY", label: "Barangay", source: "system", type: "text", required: true },
      ...SYSTEM_DATE_PLACEHOLDERS,
      OR_NUMBER_PLACEHOLDER,
    ],
  },
  {
    key: "certification-no-adverse-claim",
    name: "Certification of No Adverse Claim",
    category: "Certification",
    file: "certification-no-adverse-claim.template.docx",
    placeholders: [
      { key: "FULL_NAME", label: "Full Name (Landowner)", source: "resident", type: "text", required: true },
      { key: "HONORIFIC", label: "Mr./Mrs./Ms. (auto from gender + civil status)", source: "resident", type: "text", required: true },
      { key: "PRONOUN_POSSESSIVE", label: "His/Her (auto from gender)", source: "resident", type: "text", required: true },
      { key: "LOT_NUMBER", label: "Lot Number", source: "manual", type: "text", required: true },
      { key: "SITIO", label: "Sitio", source: "resident", type: "text", required: true },
      { key: "LAND_AREA", label: "Land Area (sq. meter)", source: "manual", type: "text", required: true },
      { key: "BARANGAY", label: "Barangay", source: "system", type: "text", required: true },
      ...SYSTEM_DATE_PLACEHOLDERS,
      OR_NUMBER_PLACEHOLDER,
    ],
  },
];

async function seed() {
  const isUpdate = process.argv.includes("--update");

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db!;
  const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "certificateTemplates" });

  for (const t of TEMPLATES) {
    const existing = await CertificateTemplate.findOne({ key: t.key });

    if (existing && !isUpdate) {
      console.log(`Skipping "${t.key}" -- already registered. Use --update to overwrite.`);
      continue;
    }

    const docsDir = path.resolve(__dirname, "../public/docs");
    const buffer = fs.readFileSync(path.join(docsDir, t.file));

    // If updating, delete old GridFS file first
    if (existing) {
      try {
        await bucket.delete(existing.docxFileId);
      } catch (e) {
        // old file may already be gone
      }
    }

    const docxFileId: mongoose.Types.ObjectId = await new Promise((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(t.file);
      uploadStream.on("error", reject);
      uploadStream.on("finish", () => resolve(uploadStream.id as mongoose.Types.ObjectId));
      uploadStream.end(buffer);
    });

    if (existing) {
      await CertificateTemplate.updateOne(
        { key: t.key },
        {
          name: t.name,
          category: t.category,
          docxFileId,
          placeholders: t.placeholders,
          version: (existing.version || 1) + 1,
        }
      );
      console.log(`Updated "${t.key}" (v${(existing.version || 1) + 1})`);
    } else {
      await CertificateTemplate.create({
        key: t.key,
        name: t.name,
        category: t.category,
        docxFileId,
        placeholders: t.placeholders,
      });
      console.log(`Registered "${t.key}" (${t.placeholders.length} placeholders)`);
    }
  }

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
