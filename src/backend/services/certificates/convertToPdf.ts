import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, readFile, mkdtemp, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import os from "node:os";
import path from "node:path";
import pLimit from "p-limit";

const execFileAsync = promisify(execFile);

// soffice is heavyweight and holds a lock on its user profile -- cap concurrent conversions
const limit = pLimit(2);

export function convertToPdfQueued(docxBuffer: Buffer): Promise<Buffer> {
  return limit(() => convertToPdf(docxBuffer));
}

async function convertToPdf(docxBuffer: Buffer): Promise<Buffer> {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "cert-"));
  const inputPath = path.join(workDir, `${randomUUID()}.docx`);

  try {
    await writeFile(inputPath, docxBuffer);
    await execFileAsync(
      "soffice",
      [
        "--headless",
        "--norestore",
        `-env:UserInstallation=file://${path.join(workDir, "lo-profile")}`, // isolated profile per call -> safe to run concurrently
        "--convert-to",
        "pdf",
        "--outdir",
        workDir,
        inputPath,
      ],
      { timeout: 30_000 }
    );
    return await readFile(inputPath.replace(/\.docx$/, ".pdf"));
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      throw new Error(
        "LibreOffice ('soffice') is not installed on this host. It's required to convert generated certificates to PDF -- install libreoffice (e.g. `apt-get install libreoffice` in your Docker image, or `brew install libreoffice` locally)."
      );
    }
    throw err;
  } finally {
    await rm(workDir, { recursive: true, force: true }); // never leave a filled docx/pdf on disk
  }
}
