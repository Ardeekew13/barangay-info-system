import PizZip from "pizzip";

/**
 * Scans a .docx buffer's body/header/footer XML for {{TOKEN}} placeholders.
 * XML tags are stripped before matching so a tag split across adjacent
 * Word "runs" (a common side effect of spell-check/autocorrect) still reads as one string.
 */
export function scanPlaceholders(docxBuffer: Buffer): string[] {
  const zip = new PizZip(docxBuffer);
  const xmlParts = Object.keys(zip.files).filter(
    (name) => name === "word/document.xml" || /word\/(header|footer)\d*\.xml/.test(name)
  );

  const tags = new Set<string>();
  for (const part of xmlParts) {
    const xml = zip.file(part)?.asText() ?? "";
    const flattened = xml.replace(/<[^>]+>/g, "");
    for (const m of flattened.matchAll(/{{\s*([A-Z0-9_]+)\s*}}/g)) tags.add(m[1]);
  }
  return Array.from(tags);
}
