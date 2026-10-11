/**
 * Text extraction and clause segmentation for uploaded documents.
 * Pure functions only — OCR (which calls the AI) lives in lib/ingest.ts.
 */

import type { SupportedExtension } from "@/lib/file-types";

export interface ParsedClause {
  clauseNumber: number;
  clauseTitle: string | null;
  clauseText: string;
  category: string | null;
}

// ─── Extraction ──────────────────────────────────────────────────────────────

function decodeEntities(text: string) {
  const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return named[entity.toLowerCase()] ?? match;
  });
}

function htmlToText(html: string) {
  return decodeEntities(
    html
      .replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|li|tr|section|article|blockquote)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  );
}

function decodeTextBuffer(buffer: Buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xfe) return buffer.subarray(2).toString("utf16le");
  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) return buffer.subarray(3).toString("utf-8");
  return buffer.toString("utf-8");
}

const RTF_SKIP_DESTINATIONS = new Set([
  "fonttbl", "colortbl", "stylesheet", "info", "pict", "object", "header", "footer",
  "headerl", "headerr", "footerl", "footerr", "generator", "xmlnstbl", "listtable",
  "listoverridetable", "rsidtbl", "themedata", "colorschememapping", "datastore",
  "latentstyles", "filetbl", "revtbl", "fldinst",
]);
const RTF_SYMBOLS: Record<string, string> = {
  par: "\n", line: "\n", sect: "\n", page: "\n", row: "\n", tab: " ", cell: " ",
  emdash: "—", endash: "–", bullet: "•", lquote: "‘", rquote: "’", ldblquote: "“", rdblquote: "”",
};

/** Minimal RTF reader: keeps visible text, drops formatting and metadata groups. */
function rtfToText(rtf: string) {
  let out = "";
  let skip = false;
  let unicodeSkip = 1;
  const stack: boolean[] = [];
  let i = 0;

  while (i < rtf.length) {
    const ch = rtf[i];
    if (ch === "{") {
      stack.push(skip);
      i++;
    } else if (ch === "}") {
      skip = stack.pop() ?? false;
      i++;
    } else if (ch === "\\") {
      const next = rtf[i + 1];
      if (next === "\\" || next === "{" || next === "}") {
        if (!skip) out += next;
        i += 2;
      } else if (next === "'") {
        if (!skip) out += String.fromCharCode(parseInt(rtf.slice(i + 2, i + 4), 16));
        i += 4;
      } else if (next === "*") {
        skip = true;
        i += 2;
      } else {
        const match = /^([a-zA-Z]+)(-?\d+)? ?/.exec(rtf.slice(i + 1, i + 40));
        if (!match) {
          if (!skip && next === "~") out += " ";
          if (!skip && (next === "\n" || next === "\r")) out += "\n";
          i += 2;
          continue;
        }
        const [token, word, param] = match;
        i += 1 + token.length;
        if (RTF_SKIP_DESTINATIONS.has(word)) {
          skip = true;
        } else if (skip) {
          continue;
        } else if (word === "u" && param) {
          let code = parseInt(param, 10);
          if (code < 0) code += 65536;
          out += String.fromCharCode(code);
          i += rtf[i] === "\\" && rtf[i + 1] === "'" ? 4 : unicodeSkip;
        } else if (word === "uc" && param) {
          unicodeSkip = parseInt(param, 10);
        } else if (RTF_SYMBOLS[word]) {
          out += RTF_SYMBOLS[word];
        }
      }
    } else {
      if (!skip && ch !== "\r" && ch !== "\n") out += ch;
      i++;
    }
  }
  return out;
}

async function odtToText(buffer: Buffer) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file("content.xml")?.async("string");
  if (!xml) throw new Error("Invalid ODT file");
  return decodeEntities(
    xml
      .replace(/<text:(tab|s)\s*\/>/g, " ")
      .replace(/<text:line-break\s*\/>/g, "\n")
      .replace(/<\/text:(p|h)>/g, "\n")
      .replace(/<[^>]+>/g, "")
  );
}

/**
 * Extracts the raw text of a document. Images return empty text (they need OCR).
 * Throws if the file cannot be read.
 */
export async function extractText(
  buffer: Buffer,
  ext: SupportedExtension
): Promise<{ text: string; pageCount?: number }> {
  switch (ext) {
    case "pdf": {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      return { text: data.text, pageCount: data.numpages };
    }
    case "docx": {
      const mammoth = await import("mammoth");
      return { text: (await mammoth.extractRawText({ buffer })).value };
    }
    case "doc": {
      const WordExtractor = (await import("word-extractor")).default;
      const doc = await new WordExtractor().extract(buffer);
      return { text: doc.getBody() };
    }
    case "odt":
      return { text: await odtToText(buffer) };
    case "rtf":
      return { text: rtfToText(buffer.toString("latin1")) };
    case "html":
    case "htm":
      return { text: htmlToText(decodeTextBuffer(buffer)) };
    case "txt":
    case "md":
      return { text: decodeTextBuffer(buffer) };
    default:
      return { text: "" };
  }
}

/** A PDF with almost no extractable text is a scan and needs OCR. */
export function isLikelyScanned(text: string, pageCount = 1) {
  const chars = text.replace(/\s/g, "").length;
  return chars < 100 || chars / Math.max(pageCount, 1) < 40;
}

// ─── Cleaning ────────────────────────────────────────────────────────────────

const NOISE_LINE =
  /^(?:(?:page|página|pagina)\s*\d+(?:\s*(?:of|sur|de|\/)\s*\d+)?|\d{1,4}|-\s*\d+\s*-|\d+\s*\/\s*\d+)$/i;

/**
 * Normalizes whitespace, drops page numbers and re-joins lines that a PDF
 * wrapped mid-sentence, keeping real line breaks (headings, list items).
 */
export function cleanText(rawText: string): string {
  if (!rawText) return "";

  const lines = rawText
    .replace(/\r\n?/g, "\n")
    .replace(/[   \t\f\v]/g, " ")
    .replace(/[​-‍﻿]/g, "")
    .split("\n")
    .map((line) => line.replace(/ {2,}/g, " ").trim())
    .filter((line) => line && !NOISE_LINE.test(line));

  const merged: string[] = [];
  for (const line of lines) {
    const prev = merged[merged.length - 1];
    if (prev && !/[.:;!?)\]"”»]$/.test(prev) && /^[a-zà-ÿ(]/.test(line)) {
      merged[merged.length - 1] = `${prev} ${line}`;
    } else {
      merged.push(line);
    }
  }
  return merged.join("\n").trim();
}

// ─── Clause segmentation ─────────────────────────────────────────────────────

type HeadingKind = "keyword" | "number" | "roman" | "caps";

interface Heading {
  line: number;
  kind: HeadingKind;
  level: number;
  number?: number;
  rest: string;
}

const KEYWORD_HEADING =
  /^(?:article|art\.|artigo|section|sec\.|seção|secção|clause|cláusula|clausula|chapitre|chapter|capítulo|titre|título|schedule|annexe?|anexo|exhibit|appendix)\s+(?:\d+(?:\.\d+)*|[ivxlcdm]{1,6}|premier|première|primeir[ao]|segund[ao]|terceir[ao]|quart[ao]|quint[ao]|sext[ao]|s[ée]tim[ao]|oitav[ao]|non[ao]|d[ée]cim[ao]|vig[ée]sim[ao]|[a-z])[ºª°]?/i;
const NUMBER_HEADING = /^(\d{1,2})[ºª°]?((?:\.\d{1,2}){0,3})(\.|\))?\s+(.+)$/;
const ROMAN_HEADING = /^([IVXLC]{1,6})(?:\.|\)|\s*[-–—])\s*(.+)$/;
const STARTS_UPPER = /^[A-ZÀ-ÝÇ"“«(]/;
const MAX_HEADING_LINE = 160;

function detectHeading(line: string, index: number): Heading | null {
  const keyword = KEYWORD_HEADING.exec(line);
  if (keyword) {
    const rest = line.slice(keyword[0].length);
    if (rest === "" || /^\s*[-–—:.)]/.test(rest) || /^\s+[A-ZÀ-ÝÇ"“«(]/.test(rest)) {
      return { line: index, kind: "keyword", level: 1, rest: rest.replace(/^\s*[-–—:.)]?\s*/, "") };
    }
  }

  const numbered = NUMBER_HEADING.exec(line);
  if (numbered && line.length <= 2000) {
    const [, major, subs, terminator, rest] = numbered;
    const isAllCaps = rest === rest.toUpperCase() && /[A-ZÀ-Ý]{3}/.test(rest);
    if ((subs || terminator || isAllCaps) && STARTS_UPPER.test(rest)) {
      return {
        line: index,
        kind: "number",
        level: 1 + (subs.match(/\./g)?.length ?? 0),
        number: Number(major),
        rest,
      };
    }
  }

  if (line.length <= MAX_HEADING_LINE) {
    const roman = ROMAN_HEADING.exec(line);
    if (roman && STARTS_UPPER.test(roman[2])) {
      return { line: index, kind: "roman", level: 1, rest: roman[2] };
    }
  }

  const letters = line.replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (
    line.length >= 4 &&
    line.length <= 80 &&
    letters.length >= 4 &&
    letters.length / line.length >= 0.6 &&
    line === line.toUpperCase() &&
    !/[,;]$/.test(line)
  ) {
    return { line: index, kind: "caps", level: 1, rest: line };
  }
  return null;
}

/** Keeps a run of top-level numbered headings that count up 1, 2, 3, … */
function sequentialNumbers(headings: Heading[]) {
  const kept: Heading[] = [];
  for (const heading of headings) {
    const last = kept[kept.length - 1];
    if (!last || heading.number === (last.number ?? 0) + 1) kept.push(heading);
  }
  return kept;
}

function chooseBoundaries(headings: Heading[]): Heading[] {
  const of = (kind: HeadingKind, maxLevel = 1) =>
    headings.filter((h) => h.kind === kind && h.level <= maxLevel);

  const keyword = of("keyword");
  if (keyword.length >= 2) return keyword;

  const topNumbers = of("number");
  const sequential = sequentialNumbers(topNumbers);
  if (sequential.length >= 2) return sequential;
  if (topNumbers.length >= 2) return topNumbers;

  const twoLevelNumbers = of("number", 2);
  if (twoLevelNumbers.length >= 2) return twoLevelNumbers;

  const roman = of("roman");
  if (roman.length >= 2) return roman;

  const caps = of("caps");
  return caps.length >= 3 ? caps : [];
}

function toTitleCase(text: string) {
  return text.toLowerCase().replace(/(^|[\s(\-–—/])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
}

function headingTitle(heading: Heading, line: string, nextLine?: string): string | null {
  let title = heading.kind === "caps" ? line : heading.rest.trim();

  if (!title && heading.kind === "keyword") {
    // "ARTICLE 1" alone on a line, title on the next line.
    title =
      nextLine && nextLine.length <= 60 && !/[.;:]$/.test(nextLine) ? nextLine : line.trim();
  } else {
    // "Payment. Client pays…" → "Payment"; a full sentence is not a title.
    const cut = title.search(/[.:]\s/);
    if (cut > 0 && cut <= 60) title = title.slice(0, cut);
    else if (title.length > 80 || (/[.;]$/.test(title) && title.split(/\s+/).length > 6)) title = "";
  }

  title = title.replace(/[\s.:–—-]+$/, "").trim();
  if (!title) return null;
  if (title === title.toUpperCase() && /\p{L}{2}/u.test(title)) title = toTitleCase(title);
  return title.length > 120 ? `${title.slice(0, 117)}…` : title;
}

/** Splits text into roughly `size`-character chunks at line boundaries. */
function chunkLines(text: string, size: number): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const line of text.split("\n")) {
    if (current && current.length + line.length > size) {
      chunks.push(current);
      current = "";
    }
    if (line.length > size * 1.5) {
      // Very long single line: split at sentence ends.
      for (const sentence of line.match(/[^.!?]+[.!?]+["”»)]?\s*|[^.!?]+$/g) ?? [line]) {
        if (current && current.length + sentence.length > size) {
          chunks.push(current);
          current = "";
        }
        current += sentence;
      }
    } else {
      current = current ? `${current}\n${line}` : line;
    }
  }
  if (current.trim()) chunks.push(current);
  return chunks.map((c) => c.trim()).filter(Boolean);
}

const CATEGORY_KEYWORDS: [string, string[]][] = [
  ["Definitions", ["definition", "définition", "definições", "interpretation", "interprétation"]],
  ["Payment", ["payment", "fees", "invoice", "price", "remuneration", "paiement", "prix", "facture", "rémunération", "pagamento", "preço", "remuneração", "honorários", "fatura"]],
  ["Term & Termination", ["termination", "terminate", "duration", "renewal", "résiliation", "durée", "rescisão", "resilição", "vigência", "renovação"]],
  ["Liability", ["liability", "liable", "damages", "responsabilité", "dommages", "responsabilidade", "danos"]],
  ["Indemnification", ["indemnif", "hold harmless", "indemnité", "indeniza"]],
  ["Confidentiality", ["confidential", "non-disclosure", "confidentialité", "sigilo", "confidencial"]],
  ["Intellectual Property", ["intellectual property", "copyright", "patent", "trademark", "propriété intellectuelle", "droit d'auteur", "propriedade intelectual", "direitos autorais"]],
  ["Data Protection", ["personal data", "data protection", "gdpr", "privacy", "données personnelles", "rgpd", "dados pessoais", "lgpd", "privacidade"]],
  ["Dispute Resolution", ["dispute", "arbitration", "mediation", "litige", "arbitrage", "médiation", "litígio", "arbitragem", "mediação", "foro"]],
  ["Governing Law", ["governing law", "applicable law", "loi applicable", "droit applicable", "lei aplicável", "legislação aplicável"]],
  ["Force Majeure", ["force majeure", "act of god", "força maior", "caso fortuito"]],
  ["Warranty", ["warrant", "representation", "garantie", "garantia"]],
  ["Non-Compete", ["non-compete", "non-competition", "non-solicit", "non-concurrence", "não concorrência", "exclusivity", "exclusivité", "exclusividade"]],
  ["Assignment", ["assignment", "assign", "cession", "cessão"]],
  ["Notices", ["notices", "notification", "notificação", "notificações"]],
  ["General", ["miscellaneous", "entire agreement", "severability", "amendment", "dispositions générales", "disposições gerais"]],
];

function categorize(title: string | null, text: string): string | null {
  const titleLower = (title ?? "").toLowerCase();
  const textLower = text.slice(0, 600).toLowerCase();
  let best: string | null = null;
  let bestScore = 0;
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    let score = 0;
    for (const keyword of keywords) {
      if (titleLower.includes(keyword)) score += 3;
      if (textLower.includes(keyword)) score += 1;
    }
    if (score > bestScore) {
      best = category;
      bestScore = score;
    }
  }
  return best;
}

const MAX_CLAUSE_CHARS = 5000;
const CHUNK_CHARS = 2000;
const MAX_CLAUSES = 150;

interface Segment {
  title: string | null;
  text: string;
}

/** A heading with no body, or a stray line too short to stand as a clause. */
function isFragment(text: string) {
  return text.length < 40 || (!text.includes("\n") && text.length < 90 && !/[.;:]$/.test(text));
}

/** Splits cleaned text into clauses using the document's own heading structure. */
export function splitIntoClauses(cleanedText: string): ParsedClause[] {
  if (!cleanedText.trim()) return [];

  const lines = cleanedText.split("\n");
  const headings: Heading[] = [];
  lines.forEach((line, i) => {
    const heading = detectHeading(line, i);
    if (heading) headings.push(heading);
  });
  const boundaries = chooseBoundaries(headings);

  let segments: Segment[] = [];
  if (boundaries.length === 0) {
    segments = chunkLines(cleanedText, CHUNK_CHARS).map((text) => ({ title: null, text }));
  } else {
    const preamble = lines.slice(0, boundaries[0].line).join("\n").trim();
    if (preamble) segments.push({ title: "Preamble", text: preamble });
    boundaries.forEach((boundary, i) => {
      const end = i + 1 < boundaries.length ? boundaries[i + 1].line : lines.length;
      segments.push({
        title: headingTitle(boundary, lines[boundary.line], lines[boundary.line + 1]),
        text: lines.slice(boundary.line, end).join("\n").trim(),
      });
    });
  }

  // Fold heading-only fragments (a title line with no body, a document title
  // before the first clause) into the clause that follows, or precedes at the end.
  const merged: Segment[] = [];
  let carry: Segment | null = null;
  for (const segment of segments) {
    const current: Segment = carry
      ? {
          title: carry.title && carry.title !== "Preamble" ? carry.title : segment.title,
          text: `${carry.text}\n${segment.text}`,
        }
      : segment;
    carry = null;
    if (isFragment(current.text)) carry = current;
    else merged.push(current);
  }
  if (carry) {
    const last = merged[merged.length - 1];
    if (last) last.text = `${last.text}\n${carry.text}`;
    else merged.push(carry);
  }

  // Split oversized clauses so analysis and chat retrieval stay granular.
  let result: Segment[] = merged.flatMap((segment) =>
    segment.text.length <= MAX_CLAUSE_CHARS
      ? [segment]
      : chunkLines(segment.text, CHUNK_CHARS).map((text, i) => ({
          title: i === 0 ? segment.title : segment.title ? `${segment.title} (cont.)` : null,
          text,
        }))
  );

  // Bound the clause count for very long documents.
  while (result.length > MAX_CLAUSES) {
    const pairs: Segment[] = [];
    for (let i = 0; i < result.length; i += 2) {
      const [a, b] = [result[i], result[i + 1]];
      pairs.push(b ? { title: a.title ?? b.title, text: `${a.text}\n${b.text}` } : a);
    }
    result = pairs;
  }

  return result.map((segment, i) => ({
    clauseNumber: i + 1,
    clauseTitle: segment.title,
    clauseText: segment.text,
    category: categorize(segment.title, segment.text),
  }));
}

/** Cleans raw text and splits it into clauses. */
export function structureText(rawText: string) {
  const cleanedText = cleanText(rawText);
  return { cleanedText, clauses: splitIntoClauses(cleanedText) };
}
