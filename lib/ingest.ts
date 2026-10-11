import type { ChatCompletionContentPart } from "openai/resources/chat/completions";

import { SYSTEM_PROMPTS } from "@/ai/prompts";
import { openai, AI_MODEL } from "@/lib/openai";
import { mapWithConcurrency } from "@/lib/utils";
import { extractText, isLikelyScanned, structureText } from "@/lib/parsing";
import {
  SUPPORTED_EXTENSIONS,
  getExtension,
  isImageExtension,
  isSupportedExtension,
} from "@/lib/file-types";

/** An error whose message is safe and useful to show to the user. */
export class IngestError extends Error {}

/** Scanned PDFs are OCR'd page by page, in parallel, up to this many pages. */
const OCR_MAX_PAGES = 30;
const OCR_CONCURRENCY = 6;

async function ocrPart(part: ChatCompletionContentPart): Promise<string> {
  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    temperature: 0,
    max_tokens: 3000,
    messages: [
      { role: "system", content: SYSTEM_PROMPTS.ocr },
      { role: "user", content: [part] },
    ],
  });
  return response.choices[0]?.message?.content?.trim() ?? "";
}

async function ocrImage(buffer: Buffer, ext: string) {
  const mime = ext === "jpg" ? "jpeg" : ext;
  return ocrPart({
    type: "image_url",
    image_url: { url: `data:image/${mime};base64,${buffer.toString("base64")}`, detail: "high" },
  });
}

async function ocrPdf(buffer: Buffer) {
  const { PDFDocument } = await import("pdf-lib");
  const source = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const pageCount = source.getPageCount();
  if (pageCount > OCR_MAX_PAGES) {
    throw new IngestError(
      `This PDF is a scan (no selectable text) with ${pageCount} pages. Scanned documents are limited to ${OCR_MAX_PAGES} pages — please upload a text-based PDF or split the file.`
    );
  }

  // One single-page PDF per request keeps each call small and lets pages run in parallel.
  const pages = await Promise.all(
    source.getPageIndices().map(async (index) => {
      const single = await PDFDocument.create();
      const [page] = await single.copyPages(source, [index]);
      single.addPage(page);
      return Buffer.from(await single.save()).toString("base64");
    })
  );

  const results = await mapWithConcurrency(pages, OCR_CONCURRENCY, (base64) =>
    ocrPart({
      type: "file",
      file: { filename: "page.pdf", file_data: `data:application/pdf;base64,${base64}` },
    })
  );
  if (results.every((r) => r.status === "rejected")) {
    throw (results[0] as PromiseRejectedResult).reason;
  }
  return results.map((r) => (r.status === "fulfilled" ? r.value : "")).join("\n");
}

/**
 * Turns an uploaded file into clean text and clauses. Text-based formats are
 * parsed locally for free; scans and images fall back to AI OCR.
 */
export async function ingestDocument(buffer: Buffer, fileName: string) {
  const ext = getExtension(fileName);
  if (!isSupportedExtension(ext)) {
    throw new IngestError(
      `Unsupported file type${ext ? ` ".${ext}"` : ""}. Supported: ${SUPPORTED_EXTENSIONS.join(", ")}.`
    );
  }

  let rawText: string;
  let usedOcr = false;

  if (isImageExtension(ext)) {
    rawText = await runOcr(() => ocrImage(buffer, ext));
    usedOcr = true;
  } else {
    let extracted;
    try {
      extracted = await extractText(buffer, ext);
    } catch (error) {
      console.error(`Text extraction failed for .${ext}:`, error);
      throw new IngestError(
        "Could not read this file. It may be corrupted, password-protected or not a real ." + ext + " file."
      );
    }
    rawText = extracted.text;
    if (ext === "pdf" && isLikelyScanned(rawText, extracted.pageCount)) {
      rawText = await runOcr(() => ocrPdf(buffer));
      usedOcr = true;
    }
  }

  const { cleanedText, clauses } = structureText(rawText);
  if (!cleanedText) {
    throw new IngestError(
      usedOcr
        ? "No readable text was found in this document."
        : "This file contains no text."
    );
  }

  return { fileType: ext, rawText, cleanedText, clauses, usedOcr };
}

async function runOcr(fn: () => Promise<string>) {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof IngestError) throw error;
    console.error("OCR failed:", error);
    throw new IngestError(
      "Text recognition for this scanned document failed. Please try again in a moment."
    );
  }
}
