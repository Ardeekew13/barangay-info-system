import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export class MissingPlaceholderError extends Error {
  constructor(public tags: string[]) {
    super(`Unresolved placeholders in template: ${tags.join(", ")}`);
  }
}

/**
 * Fills {{TOKEN}} placeholders in a .docx template buffer with data.
 * Only text nodes are rewritten -- fonts, spacing, margins, tables, and
 * images from the original template are preserved untouched.
 */
export function renderDocx(templateBuffer: Buffer, data: Record<string, string>): Buffer {
  const zip = new PizZip(templateBuffer);
  const missing = new Set<string>();

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" },
    nullGetter: (part: any) => {
      missing.add(part.value);
      return "";
    },
  });

  doc.render(data);

  if (missing.size > 0) {
    throw new MissingPlaceholderError(Array.from(missing));
  }

  return doc.getZip().generate({ type: "nodebuffer" });
}
