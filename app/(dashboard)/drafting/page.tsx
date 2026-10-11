"use client";

import { useState } from "react";
import {
  PenTool,
  ArrowRight,
  Check,
  RefreshCw,
  Copy,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JurisdictionSelect } from "@/components/app/jurisdiction-select";
import { useWorkingJurisdiction } from "@/components/layout/jurisdiction-context";
import { jurisdictionName, type JurisdictionCode } from "@/config/jurisdictions";
import type { RewriteStyle } from "@/ai/prompts";
import type { RewriteResult } from "@/ai/analysis";
import { cn } from "@/lib/utils";

interface DraftResult extends RewriteResult {
  id: string;
  original: string;
  style: RewriteStyle;
  jurisdiction: JurisdictionCode;
  timestamp: string;
}

const STYLES: { value: RewriteStyle; label: string; description: string }[] = [
  { value: "corporate", label: "Corporate", description: "Formal, precise, enterprise-ready language" },
  { value: "startup_friendly", label: "Startup Friendly", description: "Balanced, modern, and approachable tone" },
  { value: "assertive", label: "Assertive", description: "Strong, protective, favors your position" },
  { value: "plain_language", label: "Plain Language", description: "Clear, simple, easy to understand" },
];

const MAX_CHARS = 5000;

const SAMPLE_CLAUSES = [
  {
    label: "Liability Limitation",
    text: "The Company shall not be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.",
  },
  {
    label: "Termination Clause",
    text: "Either party may terminate this Agreement at any time upon thirty (30) days prior written notice to the other party. Upon termination, all rights and obligations shall cease except for those that by their nature survive termination.",
  },
  {
    label: "Indemnification",
    text: "You agree to indemnify, defend and hold harmless the Company and its officers, directors, employees, agents and third parties, for any losses, costs, liabilities and expenses relating to or arising out of your use of the services.",
  },
  {
    label: "Confidentiality",
    text: "The receiving party shall not disclose any confidential information to any third party without the prior written consent of the disclosing party and shall use confidential information solely for the purpose of performing its obligations under this Agreement.",
  },
];

/** Word-level highlight of words that appear in only one of the two texts. */
function highlightWords(text: string, other: string) {
  const otherWords = new Set(other.split(/\s+/).filter(Boolean));
  return text.split(/(\s+)/).map((word) => ({
    text: word,
    changed: word.trim() !== "" && !otherWords.has(word),
  }));
}

const styleLabel = (style: RewriteStyle) => STYLES.find((s) => s.value === style)?.label ?? style;

export default function DraftingPage() {
  const { jurisdiction: workingJurisdiction } = useWorkingJurisdiction();
  const [clauseText, setClauseText] = useState("");
  const [style, setStyle] = useState<RewriteStyle>("corporate");
  const [jurisdictionChoice, setJurisdictionChoice] = useState<JurisdictionCode | null>(null);
  const [rewriting, setRewriting] = useState(false);
  const [currentResult, setCurrentResult] = useState<DraftResult | null>(null);
  const [history, setHistory] = useState<DraftResult[]>([]);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const jurisdiction = jurisdictionChoice ?? workingJurisdiction;

  async function handleRewrite() {
    const text = clauseText.trim();
    if (!text) return;
    setRewriting(true);
    setError(null);

    try {
      const res = await fetch("/api/clauses/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, style, jurisdiction }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "The rewrite failed. Please try again.");

      const result: DraftResult = {
        ...(data as RewriteResult),
        id: `r-${Date.now()}`,
        original: text,
        style,
        jurisdiction,
        timestamp: new Date().toISOString(),
      };
      setCurrentResult(result);
      setHistory((prev) => [result, ...prev].slice(0, 20));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The rewrite failed. Please try again.");
    } finally {
      setRewriting(false);
    }
  }

  function handleAccept() {
    if (!currentResult) return;
    setClauseText(currentResult.rewritten_clause);
    setCurrentResult(null);
  }

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-medium leading-tight tracking-[-0.08px] text-black">Drafting</h1>
        <p className="mt-1 text-base text-[#868686]">
          Rewrite and refine contract clauses for any supported jurisdiction — including France and Brazil.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="glass-card p-6">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Clause Input</h3>
            <div className="mb-4">
              <p className="mb-2 text-xs text-muted-foreground">Quick select a sample clause:</p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_CLAUSES.map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => {
                      setClauseText(sample.text);
                      setCurrentResult(null);
                    }}
                    className="rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              placeholder="Paste or type a contract clause here — in any language."
              className="min-h-[200px] resize-none border-border bg-muted/50"
              value={clauseText}
              maxLength={MAX_CHARS}
              onChange={(e) => setClauseText(e.target.value)}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {clauseText.length} / {MAX_CHARS} characters
            </p>
          </div>

          <div className="glass-card space-y-4 p-6">
            <h3 className="text-sm font-semibold text-foreground">Rewrite Options</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Style</label>
                <Select value={style} onValueChange={(v) => setStyle(v as RewriteStyle)}>
                  <SelectTrigger className="border-border bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {STYLES.find((s) => s.value === style)?.description}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Jurisdiction</label>
                <JurisdictionSelect
                  value={jurisdiction}
                  onChange={setJurisdictionChoice}
                  className="border-border bg-muted/50"
                />
              </div>
            </div>
            <Button
              className="w-full gap-2 bg-[#006A3B] hover:bg-[#005a32]"
              disabled={!clauseText.trim() || rewriting}
              onClick={handleRewrite}
            >
              {rewriting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {rewriting ? "Rewriting…" : "Rewrite Clause"}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {currentResult ? (
            <>
              <div className="glass-card p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Original Clause</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => handleCopy(currentResult.original, "original")}
                  >
                    {copied === "original" ? <Check className="mr-1 h-3 w-3 text-green-600" /> : <Copy className="mr-1 h-3 w-3" />}
                    {copied === "original" ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {highlightWords(currentResult.original, currentResult.rewritten_clause).map((part, i) => (
                    <span key={i} className={cn(part.changed && "rounded bg-red-500/10 px-0.5 text-red-700 line-through decoration-red-400/60")}>
                      {part.text}
                    </span>
                  ))}
                </p>
              </div>

              <div className="glass-card border-[#66A689]/30 p-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">Rewritten Clause</h3>
                    <Badge variant="outline" className="border-[#66A689]/30 text-[#006A3B]">
                      {styleLabel(currentResult.style)}
                    </Badge>
                    <Badge variant="outline" className="text-muted-foreground">
                      {jurisdictionName(currentResult.jurisdiction)}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => handleCopy(currentResult.rewritten_clause, "rewritten")}
                  >
                    {copied === "rewritten" ? <Check className="mr-1 h-3 w-3 text-green-600" /> : <Copy className="mr-1 h-3 w-3" />}
                    {copied === "rewritten" ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {highlightWords(currentResult.rewritten_clause, currentResult.original).map((part, i) => (
                    <span key={i} className={cn(part.changed && "rounded bg-green-500/15 px-0.5 text-green-800")}>
                      {part.text}
                    </span>
                  ))}
                </p>

                {(currentResult.changes_summary.length > 0 || currentResult.enforceability_notes) && (
                  <div className="mt-4 space-y-2 border-t border-border pt-4">
                    {currentResult.changes_summary.length > 0 && (
                      <ul className="space-y-1.5">
                        {currentResult.changes_summary.map((change, i) => (
                          <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                            <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#006A3B]" />
                            <span>
                              <span className="font-medium text-foreground">{change.change_made}</span>
                              {change.reason && ` — ${change.reason}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {currentResult.enforceability_notes && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Enforceability: </span>
                        {currentResult.enforceability_notes}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 gap-2 bg-[#006A3B] hover:bg-[#005a32]" onClick={handleAccept}>
                  <Check className="h-4 w-4" />
                  Use This Version
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2 border-border"
                  onClick={handleRewrite}
                  disabled={rewriting}
                >
                  <RefreshCw className={cn("h-4 w-4", rewriting && "animate-spin")} />
                  Regenerate
                </Button>
              </div>
            </>
          ) : (
            <div className="glass-card flex min-h-[400px] flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E5F0EB]">
                <PenTool className="h-8 w-8 text-[#006A3B]" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Ready to Rewrite</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Enter a clause on the left, choose a style and jurisdiction, then click
                &quot;Rewrite Clause&quot;.
              </p>
            </div>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="glass-card p-6">
          <button
            type="button"
            onClick={() => setHistoryExpanded(!historyExpanded)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Session History ({history.length})</h3>
            </div>
            {historyExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {historyExpanded && (
            <div className="mt-4 space-y-3">
              {history.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-muted/50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-[#66A689]/30 text-[#006A3B]">
                        {styleLabel(item.style)}
                      </Badge>
                      <Badge variant="outline" className="text-muted-foreground">
                        {item.jurisdiction}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{item.original}</p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setCurrentResult(item);
                        setClauseText(item.original);
                      }}
                    >
                      <ArrowRight className="mr-1 h-3 w-3" />
                      Restore
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleCopy(item.rewritten_clause, item.id)}
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      {copied === item.id ? "Copied" : "Copy Result"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
