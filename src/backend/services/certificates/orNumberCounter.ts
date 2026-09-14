import CertificateCounter from "@/backend/models/CertificateCounter";

const SETTINGS_ID = "or-number";

/**
 * The current constant O.R. number, set once in the admin settings and
 * reused as-is on every certificate that needs one -- it does not
 * auto-increment. Returns "" if it hasn't been set yet.
 */
export async function getOrNumber(): Promise<string> {
  const doc = await CertificateCounter.findById(SETTINGS_ID);
  return doc?.orNumber ?? "";
}

/** Admin update -- change the constant O.R. number (e.g. when a new receipt is issued). */
export async function setOrNumber(value: string): Promise<string> {
  const doc = await CertificateCounter.findOneAndUpdate(
    { _id: SETTINGS_ID },
    { orNumber: value },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc.orNumber;
}
