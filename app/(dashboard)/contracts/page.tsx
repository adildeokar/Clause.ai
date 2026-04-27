"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  Upload,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  File,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
  createdAt: string;
  updatedAt: string;
  _count: { clauses: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_FILTERS = ["All", "uploaded", "analyzed", "parsing", "error"] as const;

function getRiskVariant(score: number | null) {
  if (score === null) return "secondary" as const;
  if (score < 3) return "low" as const;
  if (score < 5) return "medium" as const;
  if (score < 7) return "high" as const;
  return "critical" as const;
}

function getRiskLabel(score: number | null) {
  if (score === null) return "Pending";
  if (score < 3) return "Low Risk";
  if (score < 5) return "Medium";
  if (score < 7) return "High Risk";
  return "Critical";
}

function getFileIcon(fileType: string) {
  const colors: Record<string, string> = {
    pdf: "text-red-400 bg-red-500/10",
    docx: "text-blue-400 bg-blue-500/10",
    doc: "text-blue-400 bg-blue-500/10",
    txt: "text-green-400 bg-green-500/10",
  };
  return colors[fileType.toLowerCase()] ?? "text-muted-foreground bg-muted";
}

function ContractCardSkeleton() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted" />
          <div>
            <div className="h-4 w-40 rounded bg-muted mb-2" />
            <div className="h-3 w-24 rounded bg-muted" />
          </div>
        </div>
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
      <div className="flex items-center gap-3 mt-4">
        <div className="h-5 w-20 rounded-full bg-muted" />
        <div className="h-5 w-24 rounded-full bg-muted" />
      </div>
    </div>
  );
}

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchContracts() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "12" });
        if (search) params.set("search", search);
        if (statusFilter !== "All") params.set("status", statusFilter);

        const res = await fetch(`/api/contracts?${params}`);
        if (!res.ok) throw new Error("Failed to fetch contracts");
        const data = await res.json();
        setContracts(data.contracts);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchContracts();
  }, [page, search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const debouncedSearch = useMemo(() => {
    let timer: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => setSearch(value), 300);
    };
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <p className="text-lg text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
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
          <h2 className="text-2xl font-bold tracking-tight">Contracts</h2>
          <p className="text-muted-foreground">
            {pagination
              ? `${pagination.total} contract${pagination.total !== 1 ? "s" : ""} total`
              : "Manage and analyze your contracts."}
          </p>
        </div>
        <Link href="/contracts/upload">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Upload className="h-4 w-4" />
            Upload New Contract
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contracts..."
            className="pl-9 border-border bg-muted/50"
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {STATUS_FILTERS.map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "ghost"}
              size="sm"
              className={
                statusFilter === status
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "text-muted-foreground hover:text-foreground"
              }
              onClick={() => setStatusFilter(status)}
            >
              {status === "All" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Contract Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ContractCardSkeleton key={i} />
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 mb-4">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No contracts found</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            {search || statusFilter !== "All"
              ? "Try adjusting your search or filters."
              : "Upload your first contract to get started with AI-powered analysis."}
          </p>
          {!search && statusFilter === "All" && (
            <Link href="/contracts/upload">
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Upload className="h-4 w-4" />
                Upload Contract
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contracts.map((contract) => (
            <Link
              key={contract.id}
              href={`/contracts/${contract.id}`}
              className="glass-card p-5 transition-all duration-200 hover:bg-muted hover:border-primary/25 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${getFileIcon(contract.fileType)}`}
                  >
                    <File className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate group-hover:text-blue-400 transition-colors">
                      {contract.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {contract.fileName}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <Clock className="h-3 w-3" />
                {new Date(contract.createdAt).toLocaleDateString()}
                {contract.contractType && (
                  <>
                    <span className="text-white/20">|</span>
                    <span className="truncate">{contract.contractType}</span>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      contract.status === "analyzed"
                        ? "low"
                        : contract.status === "error"
                          ? "critical"
                          : contract.status === "parsing"
                            ? "medium"
                            : "secondary"
                    }
                  >
                    {contract.status}
                  </Badge>
                  <Badge variant="outline" className="text-muted-foreground">
                    {contract._count.clauses} clauses
                  </Badge>
                </div>
                {contract.riskScore !== null && (
                  <Badge variant={getRiskVariant(contract.riskScore)}>
                    {getRiskLabel(contract.riskScore)} ({contract.riskScore.toFixed(1)})
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
