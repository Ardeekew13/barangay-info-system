import { Schema, model, models, Types } from "mongoose";

const PlaceholderSchema = new Schema(
  {
    key: { type: String, required: true }, // e.g. "FULL_NAME" -- matches the {{FULL_NAME}} tag in the docx exactly
    label: { type: String, required: true }, // "Full Name" -- shown on the generation form
    source: { type: String, enum: ["resident", "manual", "system"], required: true },
    type: { type: String, enum: ["text", "date", "number", "currency", "select"], default: "text" },
    required: { type: Boolean, default: true },
    options: [String], // only used when type: "select"
  },
  { _id: false }
);

const certificateTemplateSchema = new Schema(
  {
    key: { type: String, required: true, unique: true }, // "barangay-clearance-resident"
    name: { type: String, required: true }, // "Barangay Clearance (Resident)"
    category: { type: String, default: "General" },
    description: String,
    docxFileId: { type: Types.ObjectId, required: true }, // GridFS file id of the .docx template
    placeholders: [PlaceholderSchema],
    version: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.CertificateTemplate || model("CertificateTemplate", certificateTemplateSchema);
