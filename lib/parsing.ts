/**
 * Document parsing pipeline for legal contract analysis.
 * Supports PDF, DOCX, TXT, RTF, and MD file types.
 */

export interface ParsedDocument {
  rawText: string;
  cleanedText: string;
  clauses: ParsedClause[];
}

export interface ParsedClause {
  clauseNumber: number;
  clauseTitle: string | null;
  clauseText: string;
  category: string | null;
}

const SUPPORTED_FILE_TYPES = ["pdf", "docx", "txt", "rtf", "md"] as const;
type SupportedFileType = (typeof SUPPORTED_FILE_TYPES)[number];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Payment: ["payment", "fee", "invoice", "billing", "remittance", "consideration"],
  Termination: ["termination", "terminate", "expiration", "cancellation", "rescission"],
  Liability: ["liability", "liable", "damages", "limitation of liability", "cap on damages"],
  Confidentiality: ["confidential", "confidentiality", "non-disclosure", "nda", "proprietary"],
  IP: ["intellectual property", "copyright", "patent", "trademark", "ip rights", "ownership"],
  "Dispute Resolution": ["dispute", "arbitration", "mediation", "litigation", "jurisdiction"],
  "Force Majeure": ["force majeure", "act of god", "unforeseeable", "beyond control"],
  "Governing Law": ["governing law", "choice of law", "applicable law", "jurisdiction"],
  Indemnification: ["indemnify", "indemnification", "hold harmless", "indemnity"],
  Warranty: ["warranty", "warrant", "representation", "disclaimer"],
  "Non-Compete": ["non-compete", "noncompetition", "restrictive covenant", "competition"],
  Assignment: ["assignment", "assign", "transfer", "novation"],
  Amendment: ["amendment", "modification", "amend", "change"],
  Severability: ["severability", "severable", "invalidity"],
  Notices: ["notice", "notices", "notification", "communicate"],
  General: ["general provisions", "miscellaneous", "entire agreement", "interpretation"],
};

const SECTION_PATTERNS = [
  /^(?:Article\s+[IVXLCDM]+|[IVXLCDM]+\.)\s*(?:[-–—:]\s*)?(.+)?$/im,
  /^(?:Section\s+)?(\d+(?:\.\d+)*\.?)\s*(?:[-–—:]\s*)?(.+)?$/im,
  /^(?:Clause\s+)?(\d+(?:\.\d+)*)\s*(?:[-–—:]\s*)?(.+)?$/im,
  /^(?:CLAUSE\s+)?(\d+(?:\.\d+)*)\s*(?:[-–—:]\s*)?(.+)?$/im,
  /^(\d{1,3}\.\d{1,3}(?:\.\d{1,3})?)\s+(?:[-–—:]\s*)?(.+)?$/im,
  /^(\d{1,3}\.)\s+(?:[-–—:]\s*)?(.+)?$/im,
  /^[a-z]\)\s*/im,
  /^\([a-z]\)\s*/im,
];

const PAGE_NUMBER_PATTERN = /^\s*(?:page\s+)?\d+\s*$/gim;
const HEADER_FOOTER_PATTERN = /^(?:CONFIDENTIAL|DRAFT|Page \d+ of \d+|©|Copyright|\d{4}\s*[-–]\s*\d{4})\s*$/gim;

async function parsePDF(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
}

async function parseDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function parsePlainText(buffer: Buffer): string {
  return buffer.toString("utf-8");
}

function parseRTF(buffer: Buffer): string {
  const raw = buffer.toString("utf-8");
  return raw
    .replace(/\\[a-z]+\d*\s?/g, " ")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/[{}]/g, " ")
    .replace(/\\\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Cleans raw extracted text by removing excessive whitespace,
 * normalizing line endings, and stripping common artifacts.
 */
export function cleanText(rawText: string): string {
  if (!rawText || typeof rawText !== "string") return "";

  let cleaned = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\f/g, "\n");

  cleaned = cleaned.replace(PAGE_NUMBER_PATTERN, "\n");
  cleaned = cleaned.replace(HEADER_FOOTER_PATTERN, "\n");

  cleaned = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+/g, " ");

  return cleaned.trim();
}

function categorizeClause(text: string): string | null {
  const lowerText = text.toLowerCase();
  const combined = `${text} ${lowerText}`;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (combined.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  return null;
}

function extractClauseTitle(firstLine: string, fullText: string): string | null {
  const trimmed = firstLine.trim();
  if (!trimmed || trimmed.length > 200) return null;

  const titleMatch = trimmed.match(/^[\d.a-zA-Z)\]]+\s*[-–—:]\s*(.+)$/);
  if (titleMatch) {
    const title = titleMatch[1].trim();
    return title.length > 0 && title.length <= 200 ? title : null;
  }

  const shortLine = trimmed.length <= 100 ? trimmed : trimmed.slice(0, 100);
  const words = shortLine.split(/\s+/);
  if (words.length <= 10 && !shortLine.endsWith(".")) {
    return shortLine;
  }
  return null;
}

function findSectionBoundaries(text: string): Array<{ index: number; match: RegExpMatchArray }> {
  const boundaries: Array<{ index: number; match: RegExpMatchArray }> = [];
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;

    for (const pattern of SECTION_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match && match[0].length <= 150) {
        boundaries.push({ index: i, match });
        break;
      }
    }
  }

  return boundaries;
}

/**
 * Splits cleaned text into structured clauses based on section markers.
 * Falls back to paragraph splitting if no sections are detected.
 */
export function splitIntoClauses(cleanedText: string): ParsedClause[] {
  if (!cleanedText || typeof cleanedText !== "string") {
    return [
      {
        clauseNumber: 1,
        clauseTitle: null,
        clauseText: "",
        category: null,
      },
    ];
  }

  const boundaries = findSectionBoundaries(cleanedText);
  const lines = cleanedText.split("\n");

  if (boundaries.length === 0) {
    const paragraphs = cleanedText
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (paragraphs.length === 0) {
      return [
        {
          clauseNumber: 1,
          clauseTitle: null,
          clauseText: cleanedText,
          category: categorizeClause(cleanedText),
        },
      ];
    }

    return paragraphs.map((text, idx) => ({
      clauseNumber: idx + 1,
      clauseTitle: null,
      clauseText: text,
      category: categorizeClause(text),
    }));
  }

  const clauses: ParsedClause[] = [];

  for (let i = 0; i < boundaries.length; i++) {
    const startLine = boundaries[i].index;
    const endLine = i < boundaries.length - 1 ? boundaries[i + 1].index : lines.length;
    const clauseLines = lines.slice(startLine, endLine);
    const clauseText = clauseLines.join("\n").trim();

    if (!clauseText) continue;

    const firstLine = clauseLines[0] ?? "";
    const clauseTitle = extractClauseTitle(firstLine, clauseText);

    clauses.push({
      clauseNumber: clauses.length + 1,
      clauseTitle,
      clauseText,
      category: categorizeClause(clauseText),
    });
  }

  if (clauses.length === 0) {
    return [
      {
        clauseNumber: 1,
        clauseTitle: null,
        clauseText: cleanedText,
        category: categorizeClause(cleanedText),
      },
    ];
  }

  return clauses;
}

function normalizeFileType(fileType: string): SupportedFileType | null {
  const normalized = fileType.toLowerCase().replace(/^\./, "");
  return SUPPORTED_FILE_TYPES.includes(normalized as SupportedFileType)
    ? (normalized as SupportedFileType)
    : null;
}

async function extractRawText(buffer: Buffer, fileType: SupportedFileType): Promise<string> {
  switch (fileType) {
    case "pdf":
      return parsePDF(buffer);
    case "docx":
      return parseDOCX(buffer);
    case "txt":
    case "md":
      return parsePlainText(buffer);
    case "rtf":
      return parseRTF(buffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Parses a document buffer and returns structured content with clauses.
 * Handles PDF, DOCX, TXT, RTF, and MD formats.
 */
export async function parseDocument(
  buffer: Buffer,
  fileType: string
): Promise<ParsedDocument> {
  const normalizedType = normalizeFileType(fileType);

  if (!normalizedType) {
    throw new Error(
      `Unsupported file type: "${fileType}". Supported types: ${SUPPORTED_FILE_TYPES.join(", ")}`
    );
  }

  let rawText: string;

  try {
    rawText = await extractRawText(buffer, normalizedType);
  } catch {
    rawText = buffer.toString("utf-8");
  }

  if (!rawText || typeof rawText !== "string") {
    rawText = "";
  }

  const cleanedText = cleanText(rawText);
  let clauses: ParsedClause[];

  try {
    clauses = splitIntoClauses(cleanedText);
  } catch {
    clauses = [
      {
        clauseNumber: 1,
        clauseTitle: null,
        clauseText: cleanedText || rawText,
        category: null,
      },
    ];
  }

  return {
    rawText,
    cleanedText,
    clauses,
  };
}
