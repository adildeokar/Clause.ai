"use client";

import { useState } from "react";
import { AlertTriangle, Check, Loader2 } from "lucide-react";

import type {
  BenchmarkResult,
  ContractReview,
  EthicsResult,
  RewriteResult,
  Severity,
  StressTestResult,
} from "@/ai/analysis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRiskLevel, getStrengthLevel } from "@/lib/utils";

/**
 * Readable views of the AI results stored in `resultJson` or returned by the
 * clause actions. Every field is optional at runtime: older stored results may
 * predate the current shapes.
 */

const label = (value: string) => value.replace(/_/g, " ");

function SeverityBadge({ severity }: { severity: Severity | string }) {
  const variant =
    severity === "critical" || severity === "high" ? "critical" : severity === "medium" ? "medium" : "low";
  return (
    <Badge variant={variant} className="py-0 text-[10px] capitalize">
      {severity}
    </Badge>
  );
}

function Heading({ children, className = "text-[#006A3B]" }: { children: React.ReactNode; className?: string }) {
  return <h5 className={`mb-1.5 text-xs font-semibold uppercase tracking-wider ${className}`}>{children}</h5>;
}

function Score({ name, value, higherIsBetter = false }: { name: string; value: number | null; higherIsBetter?: boolean }) {
  if (value === null || value === undefined) return null;
  return (
    <Badge variant={higherIsBetter ? getStrengthLevel(value) : getRiskLevel(value)}>
      {name}: {Math.round(value)}
    </Badge>
  );
}

function BulletList({ items, tone = "text-[#868686]" }: { items: string[]; tone?: string }) {
  if (!items?.length) return null;
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-[#4B4B4B]">
          <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-current ${tone}`} />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function StressTestView({ result }: { result: StressTestResult }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Score name="Litigation risk" value={result.litigation_risk} />
        <Score name="Severity" value={result.severity_index} />
      </div>

      {result.attack_scenarios?.length > 0 && (
        <div>
          <Heading className="text-[#E5484D]">Attack scenarios</Heading>
          <div className="space-y-2">
            {result.attack_scenarios.map((a, i) => (
              <div key={i} className="rounded-lg border border-[#E8E8E8] bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium capitalize text-[#282828]">
                    {label(a.attacker_role)}
                    {a.attack_vector ? ` — ${a.attack_vector}` : ""}
                  </p>
                  {a.success_probability !== null && (
                    <Badge variant={getRiskLevel(a.success_probability)}>
                      {Math.round(a.success_probability)}% likely
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[#4B4B4B]">{a.argument}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.weak_interpretations?.length > 0 && (
        <div>
          <Heading className="text-orange-500">Ambiguous wording</Heading>
          <div className="space-y-2">
            {result.weak_interpretations.map((w, i) => (
              <div key={i} className="rounded-lg border border-[#E8E8E8] bg-white p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="italic text-[#282828]">“{w.original_text}”</p>
                  <SeverityBadge severity={w.danger_level} />
                </div>
                <p className="mt-1.5 text-[#4B4B4B]">
                  <span className="font-medium text-[#282828]">Reading A:</span> {w.interpretation_a}
                </p>
                <p className="mt-1 text-[#4B4B4B]">
                  <span className="font-medium text-[#282828]">Reading B:</span> {w.interpretation_b}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.defense_suggestions?.length > 0 && (
        <div>
          <Heading>How to defend it</Heading>
          <div className="space-y-2">
            {result.defense_suggestions.map((d, i) => (
              <div key={i} className="rounded-lg border border-[#CCE1D8] bg-[#F2F8F5] p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-[#282828]">{d.vulnerability}</p>
                  <SeverityBadge severity={d.priority} />
                </div>
                <p className="mt-1 whitespace-pre-wrap text-[#4B4B4B]">{d.suggested_language}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function RewriteView({
  result,
  onApply,
}: {
  result: RewriteResult;
  /** Replaces the clause text with the rewrite. Rejects on failure. */
  onApply: (text: string) => Promise<void>;
}) {
  const [state, setState] = useState<"idle" | "saving" | "applied" | "failed">("idle");

  async function apply() {
    setState("saving");
    try {
      await onApply(result.rewritten_clause);
      setState("applied");
    } catch {
      setState("failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Score name="Readability" value={result.readability_score} higherIsBetter />
        <Score name="Legal strength" value={result.legal_strength_score} higherIsBetter />
      </div>
      <p className="whitespace-pre-wrap rounded-lg border border-[#CCE1D8] bg-[#F2F8F5] p-3 text-sm leading-relaxed text-[#282828]">
        {result.rewritten_clause}
      </p>

      {result.changes_summary?.length > 0 && (
        <div>
          <Heading>What changed</Heading>
          <ul className="space-y-1.5">
            {result.changes_summary.map((c, i) => (
              <li key={i} className="text-sm text-[#4B4B4B]">
                <span className="font-medium text-[#282828]">{c.change_made}</span>
                {c.reason ? ` — ${c.reason}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.enforceability_notes && (
        <p className="text-sm text-[#868686]">
          <span className="font-medium text-[#4B4B4B]">Enforceability:</span> {result.enforceability_notes}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          className="gap-1.5 bg-[#006A3B] text-xs hover:bg-[#005a32]"
          disabled={state === "saving" || state === "applied"}
          onClick={apply}
        >
          {state === "saving" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          {state === "applied" ? "Applied to the clause" : "Apply rewrite"}
        </Button>
        {state === "applied" && (
          <span className="text-xs text-[#868686]">Saved as a new version. Re-analyze to rescore it.</span>
        )}
        {state === "failed" && <span className="text-xs text-red-600">Could not apply the rewrite. Try again.</span>}
      </div>
    </div>
  );
}

export function BenchmarkView({ result }: { result: BenchmarkResult }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Score name="Clause score" value={result.clause_score} higherIsBetter />
        <Score name="Percentile" value={result.percentile_rank} higherIsBetter />
        {result.usage_frequency && (
          <Badge variant="secondary" className="capitalize">
            Usage: {label(result.usage_frequency)}
          </Badge>
        )}
        {result.court_reception && (
          <Badge variant="secondary" className="capitalize">
            Courts: {label(result.court_reception)}
          </Badge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {result.strengths?.length > 0 && (
          <div>
            <Heading>Strengths</Heading>
            <BulletList items={result.strengths} tone="text-[#006A3B]" />
          </div>
        )}
        {result.weaknesses?.length > 0 && (
          <div>
            <Heading className="text-[#E5484D]">Weaknesses</Heading>
            <BulletList items={result.weaknesses} tone="text-[#E5484D]" />
          </div>
        )}
        {result.missing_elements?.length > 0 && (
          <div>
            <Heading className="text-orange-500">Missing</Heading>
            <BulletList items={result.missing_elements} tone="text-orange-500" />
          </div>
        )}
      </div>

      {result.improvement_suggestions?.length > 0 && (
        <div>
          <Heading>Suggested improvements</Heading>
          <div className="space-y-2">
            {result.improvement_suggestions.map((s, i) => (
              <div key={i} className="rounded-lg border border-[#E8E8E8] bg-white p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-[#282828]">{s.area}</p>
                  {s.impact && (
                    <Badge variant="secondary" className="shrink-0 py-0 text-[10px] capitalize">
                      {s.impact} impact
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-[#4B4B4B]">{s.suggested}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function LoopholesView({ loopholes }: { loopholes: ContractReview["loopholes"] }) {
  const items = loopholes?.loopholes ?? [];
  if (items.length === 0) {
    return <p className="text-sm text-[#868686]">No loopholes were detected.</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((l, i) => (
        <div key={i} className="rounded-lg border border-[#E8E8E8] bg-white p-3 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-medium text-[#282828]">{l.title || label(l.type)}</p>
            <div className="flex shrink-0 items-center gap-1.5">
              {l.affected_clause && (
                <Badge variant="secondary" className="py-0 text-[10px]">
                  {l.affected_clause}
                </Badge>
              )}
              <SeverityBadge severity={l.severity} />
            </div>
          </div>
          {l.description && <p className="mt-1 text-[#4B4B4B]">{l.description}</p>}
          {l.recommended_fix && (
            <p className="mt-1.5 text-[#4B4B4B]">
              <span className="font-medium text-[#006A3B]">Fix:</span> {l.recommended_fix}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

const ADVANTAGE_LABEL: Record<string, string> = {
  first_party: "Favours the first party",
  second_party: "Favours the second party",
  balanced: "Balanced",
};

export function FairnessView({ fairness }: { fairness: ContractReview["fairness"] }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Score name="Fairness" value={fairness.fairness_score} higherIsBetter />
        {fairness.party_advantage && (
          <Badge variant="secondary">
            {ADVANTAGE_LABEL[fairness.party_advantage] ?? label(fairness.party_advantage)}
            {fairness.favored_party && fairness.party_advantage !== "balanced" ? ` (${fairness.favored_party})` : ""}
          </Badge>
        )}
      </div>
      {fairness.overall_assessment && (
        <p className="text-sm leading-relaxed text-[#4B4B4B]">{fairness.overall_assessment}</p>
      )}
      {fairness.unconscionability_flags?.length > 0 && (
        <ul className="space-y-1.5">
          {fairness.unconscionability_flags.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#4B4B4B]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E5484D]" />
              <span>
                {f.clause && <span className="font-medium text-[#282828]">{f.clause}: </span>}
                {f.reason}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EthicsView({ result }: { result: EthicsResult }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Score name="Ethics" value={result.ethics_score} higherIsBetter />
      </div>
      {result.issues?.length > 0 ? (
        <div className="space-y-2">
          {result.issues.map((issue, i) => (
            <div key={i} className="rounded-lg border border-[#E8E8E8] bg-white p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium capitalize text-[#282828]">{label(issue.type)}</p>
                <SeverityBadge severity={issue.severity} />
              </div>
              {issue.affected_text && <p className="mt-1 italic text-[#868686]">“{issue.affected_text}”</p>}
              <p className="mt-1 text-[#4B4B4B]">{issue.description}</p>
              {issue.suggested_fix && (
                <p className="mt-1.5 text-[#4B4B4B]">
                  <span className="font-medium text-[#006A3B]">Fix:</span> {issue.suggested_fix}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#868686]">No ethics or bias issues were found.</p>
      )}
      {result.inclusive_language_suggestions?.length > 0 && (
        <div>
          <Heading>Inclusive language</Heading>
          <ul className="space-y-1">
            {result.inclusive_language_suggestions.map((s, i) => (
              <li key={i} className="text-sm text-[#4B4B4B]">
                <span className="text-[#868686] line-through">{s.original}</span> → {s.suggested}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
