import { Schema, model, models } from "mongoose";

/**
 * Singleton settings document holding the current constant O.R. (Official
 * Receipt) number. Certificates that need one just use this value as-is --
 * it does NOT auto-increment. The clerk sets it once here (e.g. whenever a
 * new physical receipt is issued) and every certificate generated in the
 * meantime reuses that same number, so nobody has to type it in each time.
 * There is always exactly one document in this collection, keyed by
 * `_id: "or-number"`.
 */
const certificateCounterSchema = new Schema(
  {
    _id: { type: String, default: "or-number" },
    orNumber: { type: String, required: true, default: "" },
  },
  { timestamps: true }
);

export default models.CertificateCounter || model("CertificateCounter", certificateCounterSchema);
