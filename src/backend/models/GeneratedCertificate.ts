import { Schema, model, models, Types } from "mongoose";

const generatedCertificateSchema = new Schema(
  {
    templateKey: { type: String, required: true },
    templateVersion: { type: Number, required: true },
    residentId: { type: Types.ObjectId, ref: "Resident" },
    data: { type: Schema.Types.Mixed, required: true }, // snapshot of every resolved placeholder value
    generatedBy: { type: Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default models.GeneratedCertificate || model("GeneratedCertificate", generatedCertificateSchema);
