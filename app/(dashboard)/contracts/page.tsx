"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Upload,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { ContractsTable, type ContractTableRow } from "@/components/app/contracts-table";
import { mapStatusToStage } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_FILTERS = ["All", "analyzed", "uploaded", "parsing", "error"] as const;

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractTableRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchContracts() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "20" });
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

  const debouncedSearch = useMemo(() => {
    let timer: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setPage(1);
        setSearch(value);
      }, 300);
    };
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertTriangle className="h-12 w-12 text-[#F83446]" />
        <p className="text-lg text-[#868686]">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="border-[#006A3B] text-[#006A3B]"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Repository"
        description={
          pagination
            ? `${pagination.total} contract${pagination.total !== 1 ? "s" : ""} in your library`
            : "Manage and analyze your contracts."
        }
        action={{ label: "Upload contract", href: "/contracts/upload" }}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#4B4B4B]" />
          <Input
            placeholder="Search contracts"
            className="h-8 border-[#DDDDDD] pl-10 text-[#4B4B4B] placeholder:text-[#868686]"
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-[#868686]" />
          {STATUS_FILTERS.map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "ghost"}
              size="sm"
              className={
                statusFilter === status
                  ? "bg-[#006A3B] hover:bg-[#005a32]"
                  : "text-[#868686] hover:bg-[#F4F7F6] hover:text-black"
              }
              onClick={() => {
                setPage(1);
                setStatusFilter(status);
              }}
            >
              {status === "All" ? "All" : mapStatusToStage(status)}
            </Button>
          ))}
          <Link href="/contracts/upload">
            <Button className="gap-2 bg-[#006A3B] hover:bg-[#005a32]">
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </Link>
        </div>
      </div>

      <ContractsTable
        contracts={contracts}
        loading={loading}
        emptyMessage={search || statusFilter !== "All" ? "No contracts match your filters." : "No contracts yet — upload your first one."}
      />

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="gap-1 border-[#DDDDDD]"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="px-4 text-sm text-[#868686]">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="gap-1 border-[#DDDDDD]"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
