/**
 * Frontend client for the certificate generation API.
 *
 * Endpoint: POST /api/certificates/[key]
 * Query params:
 *   format  = "pdf" (default) | "docx"
 *   persist = "true" | "false"
 */

export class CertificateApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public fields?: string[]
  ) {
    super(message);
  }
}

export interface RenderCertificateInput {
  templateKey: string;
  residentId?: string;
  values: Record<string, string>;
  /** "preview" = no audit log (persist=false); "generate" = writes audit log (persist=true) */
  mode: "preview" | "generate";
  /** "pdf" (default) or "docx" */
  format?: "pdf" | "docx";
}

/**
 * Calls the certificate API and returns an object URL for the resulting file blob.
 * The caller is responsible for revoking the URL when it's no longer needed.
 */
export async function renderCertificate({
  templateKey,
  residentId,
  values,
  mode,
  format = "pdf",
}: RenderCertificateInput): Promise<string> {
  const params = new URLSearchParams({
    format,
    persist: mode === "generate" ? "true" : "false",
  });

  const res = await fetch(`/api/certificates/${templateKey}?${params}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ residentId, values }),
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new CertificateApiError(error.code, error.message, error.fields);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
