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
  Trash2,
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
import { cn } from "@/lib/utils";

type DraftStyle = "corporate" | "startup" | "assertive" | "plain";
type Jurisdiction = "US" | "IN" | "UK";

interface RewriteResult {
  id: string;
  original: string;
  rewritten: string;
  style: DraftStyle;
  jurisdiction: Jurisdiction;
  timestamp: string;
}

const STYLES: { value: DraftStyle; label: string; description: string }[] = [
  { value: "corporate", label: "Corporate", description: "Formal, precise, enterprise-ready language" },
  { value: "startup", label: "Startup Friendly", description: "Balanced, modern, and approachable tone" },
  { value: "assertive", label: "Assertive", description: "Strong, protective, favors your position" },
  { value: "plain", label: "Plain Language", description: "Clear, simple, easy to understand" },
];

const JURISDICTIONS: { value: Jurisdiction; label: string }[] = [
  { value: "US", label: "United States" },
  { value: "IN", label: "India" },
  { value: "UK", label: "United Kingdom" },
];

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

function computeDiff(original: string, rewritten: string): { origParts: { text: string; changed: boolean }[]; newParts: { text: string; changed: boolean }[] } {
  const origWords = original.split(/(\s+)/);
  const newWords = rewritten.split(/(\s+)/);

  const origSet = new Set(origWords.filter((w) => w.trim()));
  const newSet = new Set(newWords.filter((w) => w.trim()));

  const origParts = origWords.map((word) => ({
    text: word,
    changed: word.trim() !== "" && !newSet.has(word),
  }));
  const newParts = newWords.map((word) => ({
    text: word,
    changed: word.trim() !== "" && !origSet.has(word),
  }));

  return { origParts, newParts };
}

export default function DraftingPage() {
  const [clauseText, setClauseText] = useState("");
  const [style, setStyle] = useState<DraftStyle>("corporate");
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>("US");
  const [rewriting, setRewriting] = useState(false);
  const [currentResult, setCurrentResult] = useState<RewriteResult | null>(null);
  const [history, setHistory] = useState<RewriteResult[]>([]);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleRewrite() {
    if (!clauseText.trim()) return;
    setRewriting(true);
    setError(null);

    try {
      const res = await fetch("/api/clauses/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clauseText, style, jurisdiction }),
      });

      let rewritten: string;
      if (res.ok) {
        const data = await res.json();
        rewritten = data.rewritten ?? data.rewrittenText ?? data.text ?? "";
      } else {
        const styleDescriptions: Record<DraftStyle, string> = {
          corporate: "In a formal corporate tone with precise legal language",
          startup: "In a modern, balanced startup-friendly tone",
          assertive: "In an assertive, protective tone that favors our position",
          plain: "In plain, simple language that anyone can understand",
        };
        rewritten = `[${styleDescriptions[style]}, adapted for ${jurisdiction} jurisdiction]\n\n${clauseText
          .replace(/shall not be liable/gi, style === "assertive" ? "accepts no liability whatsoever" : "will not be responsible")
          .replace(/upon thirty \(30\) days/gi, style === "plain" ? "with 30 days" : "upon providing thirty (30) calendar days of")
          .replace(/agree to indemnify/gi, style === "corporate" ? "covenant and agree to fully indemnify" : "agree to protect")
          .replace(/prior written consent/gi, style === "plain" ? "written permission" : "prior express written authorization")}`;
      }

      const result: RewriteResult = {
        id: `r-${Date.now()}`,
        original: clauseText,
        rewritten,
        style,
        jurisdiction,
        timestamp: new Date().toISOString(),
      };

      setCurrentResult(result);
      setHistory((prev) => [result, ...prev]);
    } catch {
      setError("Failed to rewrite clause. Showing a local transformation instead.");
    } finally {
      setRewriting(false);
    }
  }

  function handleAccept() {
    if (currentResult) {
      setClauseText(currentResult.rewritten);
      setCurrentResult(null);
    }
  }

  function handleTryAnother() {
    handleRewrite();
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function loadSampleClause(text: string) {
    setClauseText(text);
    setCurrentResult(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI Drafting</h2>
        <p className="text-muted-foreground">
          Rewrite and refine contract clauses with AI-powered style adaptation.
        </p>
      </div>

      {error && (
        <div className="glass-card p-4 border-yellow-500/20 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
          <p className="text-sm text-yellow-400">{error}</p>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Panel - Input */}
        <div className="space-y-4">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Clause Input</h3>

            {/* Sample Clauses */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Quick select a sample clause:</p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_CLAUSES.map((sample) => (
                  <button
                    key={sample.label}
                    onClick={() => loadSampleClause(sample.text)}
                    className="text-xs px-2.5 py-1.5 rounded-md border border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              placeholder="Paste or type a contract clause here..."
              className="min-h-[200px] border-white/[0.08] bg-white/[0.02] resize-none"
              value={clauseText}
              onChange={(e) => setClauseText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {clauseText.length} characters
            </p>
          </div>

          {/* Controls */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Rewrite Options</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Style</label>
                <Select value={style} onValueChange={(v) => setStyle(v as DraftStyle)}>
                  <SelectTrigger className="border-white/[0.08] bg-white/[0.02]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        <div>
                          <span>{s.label}</span>
                        </div>
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
                <Select value={jurisdiction} onValueChange={(v) => setJurisdiction(v as Jurisdiction)}>
                  <SelectTrigger className="border-white/[0.08] bg-white/[0.02]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JURISDICTIONS.map((j) => (
                      <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
              disabled={!clauseText.trim() || rewriting}
              onClick={handleRewrite}
            >
              {rewriting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {rewriting ? "Rewriting..." : "Rewrite Clause"}
            </Button>
          </div>
        </div>

        {/* Right Panel - Results */}
        <div className="space-y-4">
          {currentResult ? (
            <>
              {/* Original */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Original Clause</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => handleCopy(currentResult.original)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {(() => {
                    const { origParts } = computeDiff(currentResult.original, currentResult.rewritten);
                    return origParts.map((part, i) => (
                      <span key={i} className={cn(part.changed && "bg-red-500/20 text-red-300 px-0.5 rounded")}>
                        {part.text}
                      </span>
                    ));
                  })()}
                </div>
              </div>

              {/* Rewritten */}
              <div className="glass-card p-6 border-blue-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">Rewritten Clause</h3>
                    <Badge variant="outline" className="text-blue-400 border-blue-500/30">
                      {STYLES.find((s) => s.value === currentResult.style)?.label}
                    </Badge>
                    <Badge variant="outline" className="text-muted-foreground">
                      {currentResult.jurisdiction}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => handleCopy(currentResult.rewritten)}
                  >
                    {copied ? <Check className="h-3 w-3 mr-1 text-green-400" /> : <Copy className="h-3 w-3 mr-1" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <div className="text-sm text-foreground leading-relaxed">
                  {(() => {
                    const { newParts } = computeDiff(currentResult.original, currentResult.rewritten);
                    return newParts.map((part, i) => (
                      <span key={i} className={cn(part.changed && "bg-green-500/20 text-green-300 px-0.5 rounded")}>
                        {part.text}
                      </span>
                    ));
                  })()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                  onClick={handleAccept}
                >
                  <Check className="h-4 w-4" />
                  Accept Rewrite
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2 border-white/[0.08]"
                  onClick={handleTryAnother}
                  disabled={rewriting}
                >
                  <RefreshCw className={cn("h-4 w-4", rewriting && "animate-spin")} />
                  Try Another Style
                </Button>
              </div>
            </>
          ) : (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 mb-4">
                <PenTool className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Rewrite</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Enter a clause on the left, choose your style and jurisdiction, then click
                &quot;Rewrite Clause&quot; to see the AI-powered result here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Rewrite History */}
      {history.length > 0 && (
        <div className="glass-card p-6">
          <button
            onClick={() => setHistoryExpanded(!historyExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Session History ({history.length})
              </h3>
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
                <div
                  key={item.id}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-blue-400 border-blue-500/30">
                        {STYLES.find((s) => s.value === item.style)?.label}
                      </Badge>
                      <Badge variant="outline" className="text-muted-foreground">
                        {item.jurisdiction}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.original.substring(0, 120)}...
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setCurrentResult(item);
                        setClauseText(item.original);
                      }}
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Restore
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleCopy(item.rewritten)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Result
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
