import { openai, AI_MODEL } from "@/lib/openai";
import { mapWithConcurrency } from "@/lib/utils";
import {
  SYSTEM_PROMPTS,
  type ReviewerProfile,
  type RewriteStyle,
} from "./prompts";

// ─── Result types ────────────────────────────────────────────────────────────

export type Severity = "low" | "medium" | "high" | "critical";

export interface ClauseIssue {
  type: string;
  severity: Severity;
  description: string;
}

export interface ClauseAnalysis {
  risk_score: number | null;
  bias_score: number | null;
  strength_score: number | null;
  confidence_score: number | null;
  issues: ClauseIssue[];
  suggested_revision: string;
  explanation: string;
}

export interface Loophole {
  title: string;
  type: string;
  severity: Severity;
  affected_clause: string;
  description: string;
  recommended_fix: string;
}

export interface ContractReview {
  summary: string;
  loopholes: { overall_risk_score: number | null; loopholes: Loophole[] };
  fairness: {
    fairness_score: number | null;
    party_advantage: string;
    favored_party: string;
    overall_assessment: string;
    unconscionability_flags: { clause: string; reason: string }[];
  };
}

export interface StressTestResult {
  attack_scenarios: {
    attacker_role: string;
    attack_vector: string;
    argument: string;
    success_probability: number | null;
  }[];
  litigation_risk: number | null;
  severity_index: number | null;
  weak_interpretations: {
    original_text: string;
    interpretation_a: string;
    interpretation_b: string;
    danger_level: Severity;
  }[];
  defense_suggestions: {
    vulnerability: string;
    suggested_language: string;
    priority: Severity;
  }[];
}

export interface RewriteResult {
  rewritten_clause: string;
  changes_summary: { change_made: string; reason: string }[];
  enforceability_notes: string;
  readability_score: number | null;
  legal_strength_score: number | null;
}

export interface EthicsResult {
  ethics_score: number | null;
  issues: {
    type: string;
    severity: Severity;
    affected_text: string;
    description: string;
    suggested_fix: string;
  }[];
  inclusive_language_suggestions: { original: string; suggested: string }[];
}

export interface BenchmarkResult {
  clause_score: number | null;
  percentile_rank: number | null;
  usage_frequency: string;
  court_reception: string;
  strengths: string[];
  weaknesses: string[];
  missing_elements: string[];
  improvement_suggestions: { area: string; suggested: string; impact: string }[];
}

// ─── Limits (the main levers on token cost and latency) ─────────────────────

/** Max characters of a single clause sent for analysis. */
const CLAUSE_CHARS = 2500;
/** Clauses are reviewed several per request to avoid repeating the prompt. */
const BATCH_CHARS = 7000;
const BATCH_SIZE = 6;
const BATCH_CONCURRENCY = 6;
/** Clauses shorter than this (headings, signature lines) are not scored. */
const MIN_CLAUSE_CHARS = 40;
/** Max characters of a whole document sent to whole-document reviews. */
const DOCUMENT_CHARS = 48_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function callAI<T>(
  systemPrompt: string,
  userContent: string,
  maxTokens: number
): Promise<T> {
  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: 0.2,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from AI model");

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error(`AI returned invalid JSON: ${content.slice(0, 200)}`);
  }
}

/** Clamps an AI-provided score to an integer 0–100, or null if missing. */
export function toScore(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  return Math.round(Math.min(100, Math.max(0, n)));
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const list = (v: unknown): any[] => (Array.isArray(v) ? v : []);
const strList = (v: unknown) => list(v).map(str).filter(Boolean);
const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];
const severity = (v: unknown): Severity =>
  SEVERITIES.includes(v as Severity) ? (v as Severity) : "medium";

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** Keeps the start and end of very long documents (parties, governing law, signatures). */
export function fitDocument(text: string, max = DOCUMENT_CHARS) {
  if (text.length <= max) return text;
  const head = Math.floor(max * 0.8);
  return `${text.slice(0, head)}\n\n[… middle of document omitted for length …]\n\n${text.slice(text.length - (max - head))}`;
}

function normalizeClauseAnalysis(raw: any): ClauseAnalysis {
  return {
    risk_score: toScore(raw?.risk_score),
    bias_score: toScore(raw?.bias_score),
    strength_score: toScore(raw?.strength_score),
    confidence_score: toScore(raw?.confidence_score),
    issues: list(raw?.issues)
      .slice(0, 3)
      .map((i) => ({
        type: str(i?.type) || "risk",
        severity: severity(i?.severity),
        description: str(i?.description),
      }))
      .filter((i) => i.description),
    suggested_revision: str(raw?.suggested_revision),
    explanation: str(raw?.explanation),
  };
}

// ─── Analysis ────────────────────────────────────────────────────────────────

export interface ClauseInput {
  clauseNumber: number;
  clauseTitle: string | null;
  clauseText: string;
}

/**
 * Reviews all clauses of a contract in batched, concurrent requests.
 * Returns analyses keyed by clause number; clauses whose batch failed are absent.
 */
export async function analyzeClauses(
  clauses: ClauseInput[],
  jurisdiction: string,
  contractType?: string | null,
  reviewer?: ReviewerProfile
): Promise<Map<number, ClauseAnalysis>> {
  const batches: ClauseInput[][] = [];
  let current: ClauseInput[] = [];
  let currentChars = 0;

  for (const clause of clauses) {
    if (clause.clauseText.trim().length < MIN_CLAUSE_CHARS) continue;
    const size = Math.min(clause.clauseText.length, CLAUSE_CHARS);
    if (current.length >= BATCH_SIZE || (current.length > 0 && currentChars + size > BATCH_CHARS)) {
      batches.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(clause);
    currentChars += size;
  }
  if (current.length) batches.push(current);

  const systemPrompt = SYSTEM_PROMPTS.clauseBatch(jurisdiction, contractType, reviewer);
  const settled = await mapWithConcurrency(batches, BATCH_CONCURRENCY, (batch) =>
    callAI<{ results?: unknown }>(
      systemPrompt,
      batch
        .map(
          (c) =>
            `### Clause ${c.clauseNumber}${c.clauseTitle ? ` — ${c.clauseTitle}` : ""}\n${truncate(c.clauseText, CLAUSE_CHARS)}`
        )
        .join("\n\n"),
      120 + 260 * batch.length
    )
  );

  const analyses = new Map<number, ClauseAnalysis>();
  settled.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error("Clause batch analysis failed:", result.reason);
      return;
    }
    const expected = new Set(batches[i].map((c) => c.clauseNumber));
    for (const raw of list(result.value.results)) {
      const number = Number(raw?.clause_number);
      if (expected.has(number)) analyses.set(number, normalizeClauseAnalysis(raw));
    }
  });
  return analyses;
}

export async function reviewContract(
  contractText: string,
  jurisdiction: string,
  contractType?: string | null,
  reviewer?: ReviewerProfile
): Promise<ContractReview> {
  const raw = await callAI<any>(
    SYSTEM_PROMPTS.contractReview(jurisdiction, contractType, reviewer),
    fitDocument(contractText),
    1500
  );
  return {
    summary: str(raw?.summary),
    loopholes: {
      overall_risk_score: toScore(raw?.loopholes?.overall_risk_score),
      loopholes: list(raw?.loopholes?.loopholes)
        .slice(0, 6)
        .map((l) => ({
          title: str(l?.title),
          type: str(l?.type),
          severity: severity(l?.severity),
          affected_clause: str(l?.affected_clause),
          description: str(l?.description),
          recommended_fix: str(l?.recommended_fix),
        }))
        .filter((l) => l.title || l.description),
    },
    fairness: {
      fairness_score: toScore(raw?.fairness?.fairness_score),
      party_advantage: str(raw?.fairness?.party_advantage) || "balanced",
      favored_party: str(raw?.fairness?.favored_party),
      overall_assessment: str(raw?.fairness?.overall_assessment),
      unconscionability_flags: list(raw?.fairness?.unconscionability_flags)
        .slice(0, 3)
        .map((f) => ({ clause: str(f?.clause), reason: str(f?.reason) }))
        .filter((f) => f.reason),
    },
  };
}

export async function stressTestClause(
  clauseText: string,
  jurisdiction: string
): Promise<StressTestResult> {
  const raw = await callAI<any>(
    SYSTEM_PROMPTS.stressTest(jurisdiction),
    truncate(clauseText, CLAUSE_CHARS),
    900
  );
  return {
    attack_scenarios: list(raw?.attack_scenarios)
      .slice(0, 3)
      .map((a) => ({
        attacker_role: str(a?.attacker_role),
        attack_vector: str(a?.attack_vector),
        argument: str(a?.argument),
        success_probability: toScore(a?.success_probability),
      })),
    litigation_risk: toScore(raw?.litigation_risk),
    severity_index: toScore(raw?.severity_index),
    weak_interpretations: list(raw?.weak_interpretations)
      .slice(0, 2)
      .map((w) => ({
        original_text: str(w?.original_text),
        interpretation_a: str(w?.interpretation_a),
        interpretation_b: str(w?.interpretation_b),
        danger_level: severity(w?.danger_level),
      })),
    defense_suggestions: list(raw?.defense_suggestions)
      .slice(0, 2)
      .map((d) => ({
        vulnerability: str(d?.vulnerability),
        suggested_language: str(d?.suggested_language),
        priority: severity(d?.priority),
      })),
  };
}

export async function rewriteClause(
  clauseText: string,
  style: RewriteStyle,
  jurisdiction: string
): Promise<RewriteResult> {
  const raw = await callAI<any>(
    SYSTEM_PROMPTS.rewrite(jurisdiction, style),
    truncate(clauseText, CLAUSE_CHARS),
    1200
  );
  const rewritten = str(raw?.rewritten_clause);
  if (!rewritten) throw new Error("AI returned an empty rewrite");
  return {
    rewritten_clause: rewritten,
    changes_summary: list(raw?.changes_summary)
      .slice(0, 4)
      .map((c) => ({ change_made: str(c?.change_made), reason: str(c?.reason) }))
      .filter((c) => c.change_made),
    enforceability_notes: str(raw?.enforceability_notes),
    readability_score: toScore(raw?.readability_score),
    legal_strength_score: toScore(raw?.legal_strength_score),
  };
}

export async function scanEthics(
  contractText: string,
  jurisdiction: string
): Promise<EthicsResult> {
  const raw = await callAI<any>(
    SYSTEM_PROMPTS.ethics(jurisdiction),
    fitDocument(contractText),
    1200
  );
  return {
    ethics_score: toScore(raw?.ethics_score),
    issues: list(raw?.issues)
      .slice(0, 6)
      .map((i) => ({
        type: str(i?.type),
        severity: severity(i?.severity),
        affected_text: str(i?.affected_text),
        description: str(i?.description),
        suggested_fix: str(i?.suggested_fix),
      }))
      .filter((i) => i.description),
    inclusive_language_suggestions: list(raw?.inclusive_language_suggestions)
      .slice(0, 4)
      .map((s) => ({ original: str(s?.original), suggested: str(s?.suggested) }))
      .filter((s) => s.original && s.suggested),
  };
}

export async function benchmarkClause(
  clauseText: string,
  category: string,
  jurisdiction: string
): Promise<BenchmarkResult> {
  const raw = await callAI<any>(
    SYSTEM_PROMPTS.benchmark(jurisdiction, category),
    truncate(clauseText, CLAUSE_CHARS),
    700
  );
  return {
    clause_score: toScore(raw?.clause_score),
    percentile_rank: toScore(raw?.percentile_rank),
    usage_frequency: str(raw?.usage_frequency),
    court_reception: str(raw?.court_reception),
    strengths: strList(raw?.strengths).slice(0, 3),
    weaknesses: strList(raw?.weaknesses).slice(0, 3),
    missing_elements: strList(raw?.missing_elements).slice(0, 3),
    improvement_suggestions: list(raw?.improvement_suggestions)
      .slice(0, 3)
      .map((s) => ({ area: str(s?.area), suggested: str(s?.suggested), impact: str(s?.impact) }))
      .filter((s) => s.suggested),
  };
}

export async function generateFromTemplate(
  templateContent: string,
  fields: Record<string, string>,
  jurisdiction: string,
  language: string
): Promise<{ generated_contract: string; notes: string[] }> {
  const raw = await callAI<any>(
    SYSTEM_PROMPTS.generateFromTemplate(jurisdiction, language),
    `Template:\n${templateContent}\n\nField values:\n${JSON.stringify(fields)}`,
    4000
  );
  const contract = str(raw?.generated_contract);
  if (!contract) throw new Error("AI returned an empty contract");
  return { generated_contract: contract, notes: strList(raw?.notes).slice(0, 4) };
}
