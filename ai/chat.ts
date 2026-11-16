import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { db } from "@/lib/db";
import { openai, AI_MODEL, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS } from "@/lib/openai";
import { mapWithConcurrency } from "@/lib/utils";
import { fitDocument } from "./analysis";
import { SYSTEM_PROMPTS } from "./prompts";

/**
 * "Chat with document". Documents that fit comfortably in the prompt are sent
 * whole, which gives the most reliable answers. Longer documents use hybrid
 * retrieval: clause embeddings ranked by similarity to the question, boosted by
 * keyword overlap and by explicit "clause 5" / "article 5" references.
 */

export interface ChatClause {
  id: string;
  clauseNumber: number;
  clauseTitle: string | null;
  clauseText: string;
}

export interface ChatDocument {
  title: string;
  contractType: string | null;
  summary: string | null;
  cleanedText: string;
  clauses: ChatClause[];
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** Up to this size (~10k tokens) the whole document goes into the prompt. */
const FULL_DOCUMENT_CHARS = 40_000;
/** Budget for retrieved clauses when the document is larger. */
const RETRIEVAL_CHARS = 20_000;
const RETRIEVAL_CLAUSE_CHARS = 5_000;
const TOP_K = 8;
const KEYWORD_WEIGHT = 0.2;

const EMBED_BATCH = 64;
const EMBED_CONCURRENCY = 4;
const EMBED_INPUT_CHARS = 8_000;

export const MAX_QUESTION_CHARS = 2_000;
/** Earlier messages sent along so follow-up questions make sense. */
export const HISTORY_MESSAGES = 8;

function clauseBlock(clause: ChatClause, maxChars = Infinity) {
  const text =
    clause.clauseText.length > maxChars ? `${clause.clauseText.slice(0, maxChars)}…` : clause.clauseText;
  return `### Clause ${clause.clauseNumber}${clause.clauseTitle ? ` — ${clause.clauseTitle}` : ""}\n${text}`;
}

// ─── Embeddings ──────────────────────────────────────────────────────────────

async function embed(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    input: texts.map((t) => t.slice(0, EMBED_INPUT_CHARS) || " "),
  });
  return response.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

/** Embeddings for every clause, computing and storing the missing or stale ones. */
async function clauseVectors(clauses: ChatClause[]): Promise<Map<string, number[]>> {
  const stored = await db.clauseEmbedding.findMany({
    where: { clauseId: { in: clauses.map((c) => c.id) } },
  });
  const vectors = new Map<string, number[]>(
    stored.filter((e) => e.vector.length === EMBEDDING_DIMENSIONS).map((e) => [e.clauseId, e.vector])
  );

  const missing = clauses.filter((c) => !vectors.has(c.id));
  if (missing.length === 0) return vectors;

  const batches: ChatClause[][] = [];
  for (let i = 0; i < missing.length; i += EMBED_BATCH) batches.push(missing.slice(i, i + EMBED_BATCH));
  const results = await mapWithConcurrency(batches, EMBED_CONCURRENCY, (batch) =>
    embed(batch.map((c) => `${c.clauseTitle ?? ""}\n${c.clauseText}`))
  );

  const rows: { clauseId: string; vector: number[] }[] = [];
  results.forEach((result, i) => {
    if (result.status === "rejected") throw result.reason;
    batches[i].forEach((clause, j) => rows.push({ clauseId: clause.id, vector: result.value[j] }));
  });

  const ids = rows.map((r) => r.clauseId);
  await db.$transaction([
    // Drops vectors of another size before replacing them.
    db.clauseEmbedding.deleteMany({ where: { clauseId: { in: ids } } }),
    db.clauseEmbedding.createMany({ data: rows, skipDuplicates: true }),
  ]);
  for (const row of rows) vectors.set(row.clauseId, row.vector);
  return vectors;
}

function cosine(a: number[], b: number[]) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

// ─── Keyword signals ─────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  "what", "which", "when", "where", "does", "this", "that", "there", "their", "with", "from", "have",
  "about", "would", "could", "should", "will", "into", "under", "after", "before", "they", "them",
  "contract", "agreement", "clause", "clauses", "document", "please", "tell", "explain",
  "quel", "quelle", "quels", "pour", "dans", "avec", "sont", "cette", "contrat",
  "qual", "quais", "para", "como", "esta", "este", "isso", "contrato",
]);

function keywords(text: string) {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
    )
  );
}

const REFERENCE =
  /(?:\b(?:clauses?|cl\.|articles?|art\.|sections?|sec\.|cláusulas?|clausulas?|artigos?)|§)\s*(\d{1,3})\b/giu;

/** Clause numbers the question refers to explicitly, e.g. "clause 4" or "article 12". */
export function referencedNumbers(question: string): number[] {
  return Array.from(question.matchAll(REFERENCE), (m) => Number(m[1]));
}

/** True if the clause is number `n` in the app or starts with the heading "n" / "Article n". */
function matchesNumber(clause: ChatClause, n: number) {
  if (clause.clauseNumber === n) return true;
  const firstLine = clause.clauseText.split("\n", 1)[0];
  return new RegExp(`^(?:[\\p{L}.]+\\s+)?${n}(?:[.)ºª°:\\s–—-]|$)`, "iu").test(firstLine);
}

// ─── Context ─────────────────────────────────────────────────────────────────

export interface ChatContext {
  mode: "full" | "retrieval";
  text: string;
  clauseNumbers: number[];
}

/** The document text the answer is grounded in. */
export async function buildContext(
  document: ChatDocument,
  question: string,
  previousQuestion?: string
): Promise<ChatContext> {
  const { clauses } = document;
  if (clauses.length === 0) {
    return { mode: "full", text: fitDocument(document.cleanedText, FULL_DOCUMENT_CHARS), clauseNumbers: [] };
  }

  const full = clauses.map((c) => clauseBlock(c)).join("\n\n");
  if (full.length <= FULL_DOCUMENT_CHARS) {
    return { mode: "full", text: full, clauseNumbers: clauses.map((c) => c.clauseNumber) };
  }

  // A follow-up ("and for the other party?") is retrieved together with the question before it.
  const query = previousQuestion ? `${previousQuestion}\n${question}` : question;
  const [vectors, [queryVector]] = await Promise.all([clauseVectors(clauses), embed([query])]);

  const terms = keywords(query);
  const ranked = clauses
    .map((clause) => {
      const haystack = `${clause.clauseTitle ?? ""} ${clause.clauseText}`.toLowerCase();
      const overlap = terms.length ? terms.filter((t) => haystack.includes(t)).length / terms.length : 0;
      const vector = vectors.get(clause.id);
      return { clause, score: (vector ? cosine(queryVector, vector) : 0) + KEYWORD_WEIGHT * overlap };
    })
    .sort((a, b) => b.score - a.score)
    .map((r) => r.clause);

  // Explicitly referenced clauses first, then the opening clause (the parties), then by relevance.
  const referenced = referencedNumbers(question).flatMap((n) => clauses.filter((c) => matchesNumber(c, n)));
  const ordered = [...referenced, clauses[0], ...ranked];

  const picked = new Map<string, ChatClause>();
  let used = 0;
  for (const clause of ordered) {
    if (picked.size >= TOP_K + referenced.length) break;
    if (picked.has(clause.id)) continue;
    const size = Math.min(clause.clauseText.length, RETRIEVAL_CLAUSE_CHARS);
    if (used + size > RETRIEVAL_CHARS && picked.size > 0) continue;
    picked.set(clause.id, clause);
    used += size;
  }

  const selected = Array.from(picked.values()).sort((a, b) => a.clauseNumber - b.clauseNumber);
  return {
    mode: "retrieval",
    text: selected.map((c) => clauseBlock(c, RETRIEVAL_CLAUSE_CHARS)).join("\n\n"),
    clauseNumbers: selected.map((c) => c.clauseNumber),
  };
}

/** The full prompt: instructions, the document, recent history, then the question. */
export function buildMessages(
  document: ChatDocument,
  context: ChatContext,
  history: ChatTurn[],
  question: string,
  jurisdiction: string,
  voice?: string | null
): ChatCompletionMessageParam[] {
  const about = [
    `Document title: ${document.title}`,
    document.contractType ? `Document type: ${document.contractType}` : "",
    `Total clauses: ${document.clauses.length}`,
    document.summary ? `Summary: ${document.summary}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const scope =
    context.mode === "full"
      ? "The complete document text follows."
      : `The document is long, so only the clauses most relevant to the question follow (clauses ${context.clauseNumbers.join(", ")} of ${document.clauses.length}). If the answer may be in a clause you cannot see, say so.`;

  return [
    { role: "system", content: SYSTEM_PROMPTS.documentChat(jurisdiction, voice) },
    { role: "system", content: `${about}\n\n${scope}\n\n${context.text}` },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: question },
  ];
}

export function streamAnswer(messages: ChatCompletionMessageParam[]) {
  return openai.chat.completions.create({
    model: AI_MODEL,
    messages,
    temperature: 0.2,
    max_tokens: 800,
    stream: true,
  });
}
