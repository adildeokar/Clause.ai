import { openai, AI_MODEL } from "@/lib/openai";
import { SYSTEM_PROMPTS, RewriteStyle, SummaryViewType } from "./prompts";

// ─── Response Types ──────────────────────────────────────────────────────────

export interface ClauseIssue {
  type: "risk" | "bias" | "ambiguity" | "missing_provision" | "enforceability";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  affected_party: "first_party" | "second_party" | "both" | "neutral";
  legal_basis: string;
}

export interface ClauseAnalysisResult {
  risk_score: number;
  bias_score: number;
  strength_score: number;
  issues: ClauseIssue[];
  suggested_revision: string;
  explanation: string;
  confidence_score: number;
}

export interface Loophole {
  id: string;
  type:
    | "ambiguity"
    | "missing_condition"
    | "one_sided"
    | "no_reciprocity"
    | "weak_termination"
    | "penalty_imbalance"
    | "undefined_term"
    | "liability_gap"
    | "time_gap";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  affected_clause: string;
  exploitation_scenario: string;
  recommended_fix: string;
  legal_reference: string;
}

export interface LoopholeDetectionResult {
  loopholes: Loophole[];
  overall_risk_score: number;
  recommendations: {
    priority: "immediate" | "high" | "medium" | "low";
    action: string;
    rationale: string;
  }[];
}

export interface FairnessResult {
  fairness_score: number;
  party_advantage: "first_party" | "second_party" | "balanced";
  advantage_magnitude: "slight" | "moderate" | "significant" | "severe";
  assessment_areas: {
    area: string;
    score: number;
    favors: "first_party" | "second_party" | "balanced";
    analysis: string;
    suggestion: string;
  }[];
  unconscionability_flags: {
    clause: string;
    reason: string;
    legal_standard: string;
  }[];
  overall_assessment: string;
}

export interface AttackScenario {
  attacker_role:
    | "plaintiff_attorney"
    | "defense_attorney"
    | "regulator"
    | "arbitrator";
  attack_vector: string;
  argument: string;
  success_probability: number;
  potential_outcome: string;
  precedent: string;
}

export interface WeakInterpretation {
  original_text: string;
  interpretation_a: string;
  interpretation_b: string;
  danger_level: "low" | "medium" | "high" | "critical";
  resolution: string;
}

export interface DefenseSuggestion {
  vulnerability: string;
  suggested_language: string;
  defense_rationale: string;
  priority: "critical" | "high" | "medium" | "low";
}

export interface StressTestResult {
  attack_scenarios: AttackScenario[];
  litigation_risk: number;
  weak_interpretations: WeakInterpretation[];
  severity_index: number;
  defense_suggestions: DefenseSuggestion[];
}

export interface RewriteResult {
  rewritten_clause: string;
  style_applied: RewriteStyle;
  changes_summary: {
    original_element: string;
    change_made: string;
    reason: string;
  }[];
  enforceability_notes: string;
  readability_score: number;
  legal_strength_score: number;
}

export interface EthicsScanResult {
  ethics_score: number;
  issues: {
    type:
      | "gender_bias"
      | "racial_exclusion"
      | "geographic_bias"
      | "power_imbalance"
      | "age_discrimination"
      | "disability_exclusion"
      | "socioeconomic_bias"
      | "cultural_insensitivity"
      | "language_accessibility";
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    affected_text: string;
    impact: string;
    legal_risk: string;
    suggested_fix: string;
  }[];
  recommendations: {
    category: string;
    current_state: string;
    recommended_change: string;
    priority: "immediate" | "high" | "medium" | "low";
    compliance_reference: string;
  }[];
  inclusive_language_suggestions: {
    original: string;
    suggested: string;
  }[];
}

export interface BenchmarkResult {
  clause_score: number;
  usage_frequency: {
    score: number;
    label: "rare" | "uncommon" | "common" | "standard" | "universal";
    explanation: string;
  };
  industry_popularity: {
    score: number;
    trending: "increasing" | "stable" | "decreasing";
    industries: string[];
  };
  legal_enforceability: {
    score: number;
    jurisdiction_specific: string;
    known_challenges: string[];
    court_reception: "favorable" | "neutral" | "unfavorable" | "untested";
  };
  benchmark_data: {
    percentile_rank: number;
    strengths: string[];
    weaknesses: string[];
    missing_elements: string[];
    model_clause_alignment: number;
  };
  improvement_suggestions: {
    area: string;
    current: string;
    suggested: string;
    impact: "minor" | "moderate" | "significant";
  }[];
}

export interface SummaryResult {
  title: string;
  view_type: SummaryViewType;
  executive_summary: string;
  key_terms: {
    term: string;
    summary: string;
    importance: "critical" | "important" | "standard";
    action_required: string | null;
  }[];
  obligations: {
    party: string;
    obligation: string;
    deadline: string | null;
    consequence: string;
  }[];
  risk_highlights: {
    risk: string;
    severity: "low" | "medium" | "high" | "critical";
    mitigation: string;
  }[];
  recommended_actions: string[];
  jurisdiction_notes: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function callAI<T>(systemPrompt: string, userContent: string): Promise<T> {
  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from AI model");
  }

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error(
      `Failed to parse AI response as JSON: ${content.slice(0, 200)}`
    );
  }
}

// ─── Analysis Functions ──────────────────────────────────────────────────────

export async function analyzeClause(
  clauseText: string,
  jurisdiction: string,
  contractType?: string
): Promise<ClauseAnalysisResult> {
  const prompt = SYSTEM_PROMPTS.clauseAnalysis(jurisdiction, contractType);
  return callAI<ClauseAnalysisResult>(prompt, clauseText);
}

export async function detectLoopholes(
  contractText: string,
  jurisdiction: string
): Promise<LoopholeDetectionResult> {
  const prompt = SYSTEM_PROMPTS.loopholeDetection(jurisdiction);
  return callAI<LoopholeDetectionResult>(prompt, contractText);
}

export async function assessFairness(
  contractText: string,
  jurisdiction: string
): Promise<FairnessResult> {
  const prompt = SYSTEM_PROMPTS.fairnessAssessment(jurisdiction);
  return callAI<FairnessResult>(prompt, contractText);
}

export async function stressTestClause(
  clauseText: string,
  jurisdiction: string
): Promise<StressTestResult> {
  const prompt = SYSTEM_PROMPTS.adversarialStressTest(jurisdiction);
  return callAI<StressTestResult>(prompt, clauseText);
}

export async function rewriteClause(
  clauseText: string,
  style: RewriteStyle,
  jurisdiction: string
): Promise<RewriteResult> {
  const prompt = SYSTEM_PROMPTS.clauseRewrite(jurisdiction, style);
  return callAI<RewriteResult>(prompt, clauseText);
}

export async function scanEthics(
  contractText: string,
  jurisdiction: string
): Promise<EthicsScanResult> {
  const prompt = SYSTEM_PROMPTS.ethicsBiasScanner(jurisdiction);
  return callAI<EthicsScanResult>(prompt, contractText);
}

export async function benchmarkClause(
  clauseText: string,
  category: string,
  jurisdiction: string
): Promise<BenchmarkResult> {
  const prompt = SYSTEM_PROMPTS.clauseBenchmark(jurisdiction, category);
  return callAI<BenchmarkResult>(prompt, clauseText);
}

export async function generateSummary(
  contractText: string,
  jurisdiction: string,
  viewType: SummaryViewType
): Promise<SummaryResult> {
  const prompt = SYSTEM_PROMPTS.legalSummary(jurisdiction, viewType);
  return callAI<SummaryResult>(prompt, contractText);
}

export async function generateFromTemplate(
  templateContent: string,
  fields: Record<string, string>,
  jurisdiction: string
): Promise<{ generated_contract: string; notes: string[] }> {
  const systemPrompt = `
You are an expert contract drafter for ${jurisdiction} jurisdiction.

Given a contract template and field values, generate a complete, legally sound contract.
Fill in all template placeholders with the provided field values.
Ensure the final document is coherent, consistent, and compliant with ${jurisdiction} law.

You MUST respond with valid JSON only, no markdown, no extra text. Use this exact structure:
{
  "generated_contract": "<the complete generated contract text>",
  "notes": ["<any notes about assumptions made or fields that need review>"]
}`;

  const userContent = `Template:\n${templateContent}\n\nField Values:\n${JSON.stringify(fields, null, 2)}`;
  return callAI<{ generated_contract: string; notes: string[] }>(
    systemPrompt,
    userContent
  );
}
