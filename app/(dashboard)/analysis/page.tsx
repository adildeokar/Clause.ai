"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Plus,
  AlertTriangle,
  Shield,
  Scale,
  Swords,
  Heart,
  Clock,
  BarChart3,
  TrendingUp,
  FileText,
  Eye,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type AnalysisType = "loophole" | "fairness" | "adversarial" | "ethics";

interface Analysis {
  id: string;
  contractId: string;
  contractTitle: string;
  type: AnalysisType;
  riskScore: number;
  issuesFound: number;
  createdAt: string;
  status: "completed" | "in_progress" | "failed";
}

interface AvailableContract {
  id: string;
  title: string;
  status: string;
}

const ANALYSIS_TYPES: { value: AnalysisType; label: string; icon: typeof Shield; color: string; bg: string }[] = [
  { value: "loophole", label: "Loophole Detection", icon: Search, color: "text-orange-400", bg: "bg-orange-500/10" },
  { value: "fairness", label: "Fairness Analysis", icon: Scale, color: "text-blue-400", bg: "bg-blue-500/10" },
  { value: "adversarial", label: "Adversarial Review", icon: Swords, color: "text-red-400", bg: "bg-red-500/10" },
  { value: "ethics", label: "Ethics Assessment", icon: Heart, color: "text-purple-400", bg: "bg-purple-500/10" },
];

const MOCK_ANALYSES: Analysis[] = [
  { id: "a1", contractId: "c1", contractTitle: "Master Service Agreement - Acme Corp", type: "loophole", riskScore: 7.2, issuesFound: 5, createdAt: "2025-03-15T10:30:00Z", status: "completed" },
  { id: "a2", contractId: "c2", contractTitle: "NDA - TechStart Inc", type: "fairness", riskScore: 3.1, issuesFound: 2, createdAt: "2025-03-14T14:00:00Z", status: "completed" },
  { id: "a3", contractId: "c1", contractTitle: "Master Service Agreement - Acme Corp", type: "ethics", riskScore: 4.5, issuesFound: 3, createdAt: "2025-03-14T09:15:00Z", status: "completed" },
  { id: "a4", contractId: "c3", contractTitle: "Employment Contract - Global Solutions", type: "adversarial", riskScore: 8.4, issuesFound: 8, createdAt: "2025-03-13T16:45:00Z", status: "completed" },
  { id: "a5", contractId: "c4", contractTitle: "Software License Agreement - CloudBase", type: "loophole", riskScore: 5.6, issuesFound: 4, createdAt: "2025-03-13T11:20:00Z", status: "completed" },
  { id: "a6", contractId: "c5", contractTitle: "Partnership Agreement - InnoVentures", type: "fairness", riskScore: 2.8, issuesFound: 1, createdAt: "2025-03-12T08:30:00Z", status: "completed" },
  { id: "a7", contractId: "c3", contractTitle: "Employment Contract - Global Solutions", type: "ethics", riskScore: 6.1, issuesFound: 4, createdAt: "2025-03-11T15:00:00Z", status: "completed" },
  { id: "a8", contractId: "c6", contractTitle: "Vendor Agreement - SupplyChain Pro", type: "adversarial", riskScore: 9.1, issuesFound: 11, createdAt: "2025-03-10T13:00:00Z", status: "completed" },
];

function getRiskVariant(score: number) {
  if (score < 3) return "low" as const;
  if (score < 5) return "medium" as const;
  if (score < 7) return "high" as const;
  return "critical" as const;
}

function getRiskLabel(score: number) {
  if (score < 3) return "Low";
  if (score < 5) return "Medium";
  if (score < 7) return "High";
  return "Critical";
}

function getTypeConfig(type: AnalysisType) {
  return ANALYSIS_TYPES.find((t) => t.value === type)!;
}

function StatCardSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-10 rounded-lg bg-muted" />
      </div>
      <div className="h-8 w-20 rounded bg-muted mb-2" />
      <div className="h-4 w-28 rounded bg-muted" />
    </div>
  );
}

function AnalysisCardSkeleton() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted" />
          <div>
            <div className="h-4 w-44 rounded bg-muted mb-2" />
            <div className="h-3 w-24 rounded bg-muted" />
          </div>
        </div>
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
      <div className="flex items-center gap-3 mt-3">
        <div className="h-5 w-20 rounded-full bg-muted" />
        <div className="h-5 w-24 rounded-full bg-muted" />
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contracts, setContracts] = useState<AvailableContract[]>([]);
  const [selectedContract, setSelectedContract] = useState("");
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<AnalysisType>("loophole");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    async function fetchAnalyses() {
      try {
        setAnalyses(MOCK_ANALYSES);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analyses");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalyses();
  }, []);

  useEffect(() => {
    if (!dialogOpen) return;
    async function fetchContracts() {
      try {
        const res = await fetch("/api/contracts?limit=50");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setContracts(
          data.contracts?.map((c: any) => ({ id: c.id, title: c.title, status: c.status })) ?? []
        );
      } catch {
        setContracts([]);
      }
    }
    fetchContracts();
  }, [dialogOpen]);

  const filteredAnalyses = useMemo(() => {
    return analyses.filter((a) => {
      const matchesSearch = !search || a.contractTitle.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || a.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [analyses, search, typeFilter]);

  const stats = useMemo(() => {
    if (analyses.length === 0) return null;
    const avgRisk = analyses.reduce((sum, a) => sum + a.riskScore, 0) / analyses.length;
    const issueCounts: Record<string, number> = {};
    analyses.forEach((a) => {
      const config = getTypeConfig(a.type);
      issueCounts[config.label] = (issueCounts[config.label] || 0) + a.issuesFound;
    });
    const mostCommon = Object.entries(issueCounts).sort((a, b) => b[1] - a[1])[0];
    return {
      total: analyses.length,
      avgRisk: avgRisk.toFixed(1),
      mostCommonType: mostCommon?.[0] ?? "N/A",
      mostCommonCount: mostCommon?.[1] ?? 0,
    };
  }, [analyses]);

  const debouncedSearch = useMemo(() => {
    let timer: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => setSearch(value), 300);
    };
  }, []);

  async function handleStartAnalysis() {
    if (!selectedContract) return;
    setStarting(true);
    try {
      const res = await fetch(`/api/contracts/${selectedContract}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedAnalysisType }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      setDialogOpen(false);
      window.location.reload();
    } catch {
      setError("Failed to start analysis. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <p className="text-lg text-muted-foreground">{error}</p>
        <Button onClick={() => { setError(null); window.location.reload(); }} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analysis</h2>
          <p className="text-muted-foreground">
            Review AI-powered contract analyses and risk assessments.
          </p>
        </div>
        <Button
          className="gap-2 bg-blue-600 hover:bg-blue-700"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          New Analysis
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <div className="glass-card p-6 transition-all duration-200 hover:bg-muted">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                </div>
                <TrendingUp className="h-4 w-4 text-green-400" />
              </div>
              <p className="text-3xl font-bold tracking-tight">{stats?.total ?? 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Analyses</p>
            </div>
            <div className="glass-card p-6 transition-all duration-200 hover:bg-muted">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  parseFloat(stats?.avgRisk ?? "0") >= 7 ? "bg-red-500/10" : parseFloat(stats?.avgRisk ?? "0") >= 5 ? "bg-orange-500/10" : parseFloat(stats?.avgRisk ?? "0") >= 3 ? "bg-yellow-500/10" : "bg-green-500/10"
                )}>
                  <AlertTriangle className={cn(
                    "h-5 w-5",
                    parseFloat(stats?.avgRisk ?? "0") >= 7 ? "text-red-400" : parseFloat(stats?.avgRisk ?? "0") >= 5 ? "text-orange-400" : parseFloat(stats?.avgRisk ?? "0") >= 3 ? "text-yellow-400" : "text-green-400"
                  )} />
                </div>
              </div>
              <p className="text-3xl font-bold tracking-tight">{stats?.avgRisk ?? "0.0"}</p>
              <p className="text-sm text-muted-foreground mt-1">Average Risk Score</p>
            </div>
            <div className="glass-card p-6 transition-all duration-200 hover:bg-muted">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                </div>
              </div>
              <p className="text-3xl font-bold tracking-tight">{stats?.mostCommonCount ?? 0}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Most Common: {stats?.mostCommonType ?? "N/A"}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by contract name..."
            className="pl-9 border-border bg-muted/50"
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Button
            variant={typeFilter === "all" ? "default" : "ghost"}
            size="sm"
            className={typeFilter === "all" ? "bg-blue-600 hover:bg-blue-700" : "text-muted-foreground hover:text-foreground"}
            onClick={() => setTypeFilter("all")}
          >
            All
          </Button>
          {ANALYSIS_TYPES.map((t) => (
            <Button
              key={t.value}
              variant={typeFilter === t.value ? "default" : "ghost"}
              size="sm"
              className={typeFilter === t.value ? "bg-blue-600 hover:bg-blue-700" : "text-muted-foreground hover:text-foreground"}
              onClick={() => setTypeFilter(t.value)}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Analysis List */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <AnalysisCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredAnalyses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 mb-4">
            <Shield className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No analyses found</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            {search || typeFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Start a new analysis to review your contracts."}
          </p>
          {!search && typeFilter === "all" && (
            <Button
              className="gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              New Analysis
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAnalyses.map((analysis) => {
            const typeConfig = getTypeConfig(analysis.type);
            const TypeIcon = typeConfig.icon;
            return (
              <Link
                key={analysis.id}
                href={`/contracts/${analysis.contractId}`}
                className="glass-card p-5 transition-all duration-200 hover:bg-muted hover:border-primary/25 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", typeConfig.bg)}>
                      <TypeIcon className={cn("h-5 w-5", typeConfig.color)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-blue-400 transition-colors">
                        {analysis.contractTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">{typeConfig.label}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <Clock className="h-3 w-3" />
                  {new Date(analysis.createdAt).toLocaleDateString()}
                  <span className="text-white/20">|</span>
                  <span>{analysis.issuesFound} issues found</span>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-muted-foreground">
                    {analysis.status === "completed" ? "Completed" : analysis.status === "in_progress" ? "In Progress" : "Failed"}
                  </Badge>
                  <Badge variant={getRiskVariant(analysis.riskScore)}>
                    {getRiskLabel(analysis.riskScore)} ({analysis.riskScore.toFixed(1)})
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* New Analysis Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle>Start New Analysis</DialogTitle>
            <DialogDescription>
              Select a contract and analysis type to begin AI-powered review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Contract</label>
              <Select value={selectedContract} onValueChange={setSelectedContract}>
                <SelectTrigger className="border-border bg-muted/50">
                  <SelectValue placeholder="Select a contract..." />
                </SelectTrigger>
                <SelectContent>
                  {contracts.length === 0 ? (
                    <SelectItem value="_none" disabled>No contracts available</SelectItem>
                  ) : (
                    contracts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Analysis Type</label>
              <div className="grid grid-cols-2 gap-2">
                {ANALYSIS_TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setSelectedAnalysisType(t.value)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-3 text-sm transition-all",
                        selectedAnalysisType === t.value
                          ? "border-blue-500/50 bg-blue-500/10 text-foreground"
                          : "border-border bg-muted/50 text-muted-foreground hover:bg-muted/60"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", t.color)} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
              disabled={!selectedContract || starting}
              onClick={handleStartAnalysis}
            >
              {starting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {starting ? "Starting Analysis..." : "Start Analysis"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
