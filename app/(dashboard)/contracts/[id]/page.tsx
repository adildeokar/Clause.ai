"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Shield,
  AlertTriangle,
  TrendingUp,
  Zap,
  PenTool,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock,
  Scale,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface Clause {
  id: string;
  clauseNumber: number;
  clauseTitle: string | null;
  clauseText: string;
  riskScore: number | null;
  biasScore: number | null;
  strengthScore: number | null;
  analysisJson: any;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { versions: number; stressTests: number };
}

interface Analysis {
  id: string;
  analysisType: string;
  resultJson: any;
  riskScore: number | null;
  confidenceScore: number | null;
  jurisdiction: string | null;
  createdAt: string;
}

interface Contract {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  status: string;
  jurisdiction: string;
  contractType: string | null;
  riskScore: number | null;
  biasScore: number | null;
  strengthScore: number | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
  clauses: Clause[];
  analyses: Analysis[];
}

function getRiskVariant(score: number | null) {
  if (score === null) return "secondary" as const;
  if (score < 3) return "low" as const;
  if (score < 5) return "medium" as const;
  if (score < 7) return "high" as const;
  return "critical" as const;
}

function getScoreColor(score: number | null) {
  if (score === null) return "#6b7280";
  if (score < 3) return "#22c55e";
  if (score < 5) return "#eab308";
  if (score < 7) return "#f97316";
  return "#ef4444";
}

function getStrengthColor(score: number | null) {
  if (score === null) return "#6b7280";
  if (score >= 7) return "#22c55e";
  if (score >= 5) return "#eab308";
  if (score >= 3) return "#f97316";
  return "#ef4444";
}

function CircularScore({
  score,
  label,
  color,
  size = 80,
}: {
  score: number | null;
  label: string;
  color: string;
  size?: number;
}) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score !== null ? (score / 10) * circumference : 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={4}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={4}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-lg font-bold"
          style={{ color }}
        >
          {score !== null ? score.toFixed(1) : "—"}
        </span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function ClauseCard({
  clause,
  onStressTest,
  onRewrite,
  onBenchmark,
}: {
  clause: Clause;
  onStressTest: (id: string) => void;
  onRewrite: (id: string) => void;
  onBenchmark: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<any>(null);

  const analysis = clause.analysisJson;
  const hasScores =
    clause.riskScore !== null ||
    clause.biasScore !== null ||
    clause.strengthScore !== null;

  async function handleAction(
    action: "stress-test" | "rewrite" | "benchmark"
  ) {
    setActionLoading(action);
    setActionResult(null);
    try {
      const res = await fetch(`/api/clauses/${clause.id}/${action}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Action failed");
      const data = await res.json();
      setActionResult({ action, data });
    } catch {
      setActionResult({ action, error: "Failed. Try again." });
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="glass-card overflow-hidden transition-all duration-200 hover:border-white/[0.12]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-xs font-bold text-blue-400">
            {clause.clauseNumber}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {clause.clauseTitle || `Clause ${clause.clauseNumber}`}
            </p>
            {clause.category && (
              <span className="text-xs text-muted-foreground">
                {clause.category}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {hasScores && (
            <div className="hidden sm:flex items-center gap-2">
              {clause.riskScore !== null && (
                <Badge variant={getRiskVariant(clause.riskScore)}>
                  Risk: {clause.riskScore.toFixed(1)}
                </Badge>
              )}
              {clause.biasScore !== null && (
                <Badge
                  variant={getRiskVariant(clause.biasScore)}
                  className="hidden md:inline-flex"
                >
                  Bias: {clause.biasScore.toFixed(1)}
                </Badge>
              )}
              {clause.strengthScore !== null && (
                <Badge
                  variant={
                    clause.strengthScore >= 7
                      ? "low"
                      : clause.strengthScore >= 4
                        ? "medium"
                        : "critical"
                  }
                  className="hidden lg:inline-flex"
                >
                  Strength: {clause.strengthScore.toFixed(1)}
                </Badge>
              )}
            </div>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/[0.06] px-5 py-4 space-y-4">
          {/* Clause Text */}
          <div className="rounded-lg bg-white/[0.02] p-4">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {clause.clauseText}
            </p>
          </div>

          {/* Scores (mobile) */}
          {hasScores && (
            <div className="flex flex-wrap gap-2 sm:hidden">
              {clause.riskScore !== null && (
                <Badge variant={getRiskVariant(clause.riskScore)}>
                  Risk: {clause.riskScore.toFixed(1)}
                </Badge>
              )}
              {clause.biasScore !== null && (
                <Badge variant={getRiskVariant(clause.biasScore)}>
                  Bias: {clause.biasScore.toFixed(1)}
                </Badge>
              )}
              {clause.strengthScore !== null && (
                <Badge
                  variant={
                    clause.strengthScore >= 7
                      ? "low"
                      : clause.strengthScore >= 4
                        ? "medium"
                        : "critical"
                  }
                >
                  Strength: {clause.strengthScore.toFixed(1)}
                </Badge>
              )}
            </div>
          )}

          {/* Analysis details */}
          {analysis && (
            <div className="space-y-3">
              {analysis.issues && analysis.issues.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
                    Issues ({analysis.issues.length})
                  </h4>
                  <ul className="space-y-2">
                    {analysis.issues.map((issue: any, i: number) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <AlertTriangle className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                        <div>
                          {typeof issue === "string" ? (
                            issue
                          ) : (
                            <>
                              <span className="font-medium text-foreground">
                                {issue.type && `[${issue.type}] `}
                              </span>
                              {issue.description || JSON.stringify(issue)}
                              {issue.severity && (
                                <Badge
                                  variant={
                                    issue.severity === "critical" || issue.severity === "high"
                                      ? "critical"
                                      : issue.severity === "medium"
                                        ? "medium"
                                        : "low"
                                  }
                                  className="ml-2 text-[10px] py-0"
                                >
                                  {issue.severity}
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.suggested_revision && (
                <div>
                  <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">
                    Suggested Revision
                  </h4>
                  <p className="text-sm text-muted-foreground bg-green-500/5 border border-green-500/10 rounded-lg p-3">
                    {analysis.suggested_revision}
                  </p>
                </div>
              )}
              {analysis.explanation && (
                <div>
                  <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
                    Explanation
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {analysis.explanation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Result */}
          {actionResult && (
            <div className="rounded-lg bg-white/[0.02] p-4 border border-white/[0.06]">
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 text-blue-400">
                {actionResult.action === "stress-test"
                  ? "Stress Test Result"
                  : actionResult.action === "rewrite"
                    ? "Rewrite Suggestion"
                    : "Benchmark Result"}
              </h4>
              {actionResult.error ? (
                <p className="text-sm text-red-400">{actionResult.error}</p>
              ) : (
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(actionResult.data, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-white/[0.08] text-xs"
              disabled={actionLoading !== null}
              onClick={() => handleAction("stress-test")}
            >
              {actionLoading === "stress-test" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Zap className="h-3 w-3" />
              )}
              Stress Test
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-white/[0.08] text-xs"
              disabled={actionLoading !== null}
              onClick={() => handleAction("rewrite")}
            >
              {actionLoading === "rewrite" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <PenTool className="h-3 w-3" />
              )}
              Rewrite
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-white/[0.08] text-xs"
              disabled={actionLoading !== null}
              onClick={() => handleAction("benchmark")}
            >
              {actionLoading === "benchmark" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <BarChart3 className="h-3 w-3" />
              )}
              Benchmark
            </Button>
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-white/[0.06]">
            {clause._count.versions > 0 && (
              <span>{clause._count.versions} version(s)</span>
            )}
            {clause._count.stressTests > 0 && (
              <span>{clause._count.stressTests} stress test(s)</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 rounded bg-white/[0.06]" />
      <div className="flex gap-4">
        <div className="h-5 w-20 rounded-full bg-white/[0.06]" />
        <div className="h-5 w-24 rounded-full bg-white/[0.06]" />
        <div className="h-5 w-20 rounded-full bg-white/[0.06]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-6">
            <div className="h-20 w-20 rounded-full bg-white/[0.06] mx-auto mb-3" />
            <div className="h-4 w-24 rounded bg-white/[0.06] mx-auto" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card h-16" />
        ))}
      </div>
    </div>
  );
}

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContract = useCallback(async () => {
    try {
      const res = await fetch(`/api/contracts/${id}`);
      if (!res.ok) throw new Error("Contract not found");
      const data = await res.json();
      setContract(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/contracts/${id}/analyze`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Analysis failed");
      await fetchContract();
    } catch {
      setError("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) return <PageSkeleton />;

  if (error || !contract) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <p className="text-lg text-muted-foreground">
          {error || "Contract not found"}
        </p>
        <Button onClick={() => router.push("/contracts")} variant="outline">
          Back to Contracts
        </Button>
      </div>
    );
  }

  const latestAnalysis = contract.analyses[0];

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/contracts"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contracts
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {contract.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="outline">{contract.jurisdiction}</Badge>
              {contract.contractType && (
                <Badge variant="secondary">{contract.contractType}</Badge>
              )}
              <Badge
                variant={
                  contract.status === "analyzed"
                    ? "low"
                    : contract.status === "error"
                      ? "critical"
                      : "secondary"
                }
              >
                {contract.status}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(contract.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700 shrink-0"
            disabled={analyzing || contract.status === "parsing"}
            onClick={handleAnalyze}
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {contract.status === "analyzed"
                  ? "Re-analyze"
                  : "Analyze Contract"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card p-6 flex flex-col items-center">
          <CircularScore
            score={contract.riskScore}
            label="Risk Score"
            color={getScoreColor(contract.riskScore)}
          />
        </div>
        <div className="glass-card p-6 flex flex-col items-center">
          <CircularScore
            score={contract.biasScore}
            label="Bias Score"
            color={getScoreColor(contract.biasScore)}
          />
        </div>
        <div className="glass-card p-6 flex flex-col items-center">
          <CircularScore
            score={contract.strengthScore}
            label="Strength Score"
            color={getStrengthColor(contract.strengthScore)}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="clauses">
        <TabsList className="bg-white/[0.04] border border-white/[0.06]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clauses">
            Clauses ({contract.clauses.length})
          </TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {contract.summary && (
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold mb-3">Summary</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {contract.summary}
              </p>
            </div>
          )}

          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold mb-4">Contract Details</h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "File Name", value: contract.fileName },
                { label: "File Type", value: contract.fileType.toUpperCase() },
                { label: "Jurisdiction", value: contract.jurisdiction },
                {
                  label: "Contract Type",
                  value: contract.contractType || "Not specified",
                },
                { label: "Total Clauses", value: contract.clauses.length },
                {
                  label: "Analyses Run",
                  value: contract.analyses.length,
                },
                {
                  label: "Created",
                  value: new Date(contract.createdAt).toLocaleString(),
                },
                {
                  label: "Last Updated",
                  value: new Date(contract.updatedAt).toLocaleString(),
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-sm font-medium mt-0.5">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Clause Score Distribution */}
          {contract.clauses.some((c) => c.riskScore !== null) && (
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold mb-4">
                Clause Risk Distribution
              </h3>
              <div className="space-y-3">
                {contract.clauses
                  .filter((c) => c.riskScore !== null)
                  .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
                  .map((clause) => (
                    <div key={clause.id} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-24 truncate shrink-0">
                        {clause.clauseTitle || `Clause ${clause.clauseNumber}`}
                      </span>
                      <div className="flex-1">
                        <Progress
                          value={(clause.riskScore! / 10) * 100}
                          className="h-2 bg-white/[0.06]"
                        />
                      </div>
                      <Badge
                        variant={getRiskVariant(clause.riskScore)}
                        className="shrink-0"
                      >
                        {clause.riskScore!.toFixed(1)}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Clauses Tab */}
        <TabsContent value="clauses" className="space-y-3 mt-6">
          {contract.clauses.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No clauses extracted yet. Run analysis to extract and score
                clauses.
              </p>
            </div>
          ) : (
            contract.clauses.map((clause) => (
              <ClauseCard
                key={clause.id}
                clause={clause}
                onStressTest={(id) => {}}
                onRewrite={(id) => {}}
                onBenchmark={(id) => {}}
              />
            ))
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6 mt-6">
          {contract.analyses.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                No analysis results yet.
              </p>
              <Button
                className="gap-2 bg-blue-600 hover:bg-blue-700"
                disabled={analyzing}
                onClick={handleAnalyze}
              >
                {analyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Run Analysis
              </Button>
            </div>
          ) : (
            contract.analyses.map((analysis) => (
              <div key={analysis.id} className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="capitalize">
                      {analysis.analysisType}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(analysis.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {analysis.riskScore !== null && (
                      <Badge variant={getRiskVariant(analysis.riskScore)}>
                        Risk: {analysis.riskScore.toFixed(1)}
                      </Badge>
                    )}
                    {analysis.confidenceScore !== null && (
                      <span className="text-xs text-muted-foreground">
                        Confidence:{" "}
                        {(analysis.confidenceScore * 10).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Loopholes */}
                {analysis.resultJson?.loopholes && (
                  <div>
                    <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">
                      Detected Loopholes
                    </h4>
                    {typeof analysis.resultJson.loopholes === "string" ? (
                      <p className="text-sm text-muted-foreground">
                        {analysis.resultJson.loopholes}
                      </p>
                    ) : (
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-white/[0.02] rounded-lg p-3 overflow-x-auto">
                        {JSON.stringify(
                          analysis.resultJson.loopholes,
                          null,
                          2
                        )}
                      </pre>
                    )}
                  </div>
                )}

                {/* Fairness */}
                {analysis.resultJson?.fairness && (
                  <div>
                    <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
                      Fairness Assessment
                    </h4>
                    {typeof analysis.resultJson.fairness === "string" ? (
                      <p className="text-sm text-muted-foreground">
                        {analysis.resultJson.fairness}
                      </p>
                    ) : (
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-white/[0.02] rounded-lg p-3 overflow-x-auto">
                        {JSON.stringify(
                          analysis.resultJson.fairness,
                          null,
                          2
                        )}
                      </pre>
                    )}
                  </div>
                )}

                {/* Clause-level results */}
                {analysis.resultJson?.clauseResults &&
                  analysis.resultJson.clauseResults.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
                        Clause Results ({analysis.resultJson.clauseResults.length})
                      </h4>
                      <div className="space-y-2">
                        {analysis.resultJson.clauseResults
                          .slice(0, 5)
                          .map((cr: any, i: number) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2"
                            >
                              <span className="text-xs text-muted-foreground truncate">
                                Clause {i + 1}
                              </span>
                              <div className="flex gap-2">
                                {cr.risk_score !== undefined && (
                                  <Badge
                                    variant={getRiskVariant(cr.risk_score)}
                                  >
                                    R: {cr.risk_score.toFixed(1)}
                                  </Badge>
                                )}
                                {cr.bias_score !== undefined && (
                                  <Badge
                                    variant={getRiskVariant(cr.bias_score)}
                                  >
                                    B: {cr.bias_score.toFixed(1)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            ))
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-6">
          {contract.clauses.every((c) => c._count.versions === 0) ? (
            <div className="glass-card p-12 text-center">
              <Clock className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No clause versions yet. Rewrites and edits will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {contract.clauses
                .filter((c) => c._count.versions > 0)
                .map((clause) => (
                  <div key={clause.id} className="glass-card p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-xs font-bold text-purple-400">
                        {clause.clauseNumber}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {clause.clauseTitle ||
                            `Clause ${clause.clauseNumber}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {clause._count.versions} version(s) &middot;{" "}
                          {clause._count.stressTests} stress test(s)
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
