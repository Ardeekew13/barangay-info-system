/**
 * Frontend client for the certificate-template file endpoints (multipart --
 * these stay REST rather than GraphQL since they carry a binary file).
 *
 *   POST /api/certificates/upload          -- register a brand-new template
 *   POST /api/certificates/[key]/replace   -- swap the .docx behind an existing template
 */

export class TemplateFileApiError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
  }
}

async function parseErrorOrThrow(res: Response): Promise<never> {
  let body: any = {};
  try {
    body = await res.json();
  } catch {
    // ignore -- fall through to generic error below
  }
  const err = body?.error;
  throw new TemplateFileApiError(err?.code ?? "UNKNOWN", err?.message ?? `Request failed (${res.status})`);
}

export interface UploadTemplateInput {
  key: string;
  name: string;
  category: string;
  file: File;
}

export async function uploadCertificateTemplate({ key, name, category, file }: UploadTemplateInput) {
  const formData = new FormData();
  formData.append("key", key);
  formData.append("name", name);
  formData.append("category", category);
  formData.append("file", file);

  const res = await fetch("/api/certificates/upload", { method: "POST", body: formData });
  if (!res.ok) return parseErrorOrThrow(res);
  return res.json();
}

export async function replaceCertificateTemplateFile(key: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`/api/certificates/${key}/replace`, { method: "POST", body: formData });
  if (!res.ok) return parseErrorOrThrow(res);
  return res.json();
}
