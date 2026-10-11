"use client";

import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";

import { StageBadge } from "@/components/app/stage-badge";
import { mapStatusToStage } from "@/lib/design-tokens";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface RecentContractRow {
  id: string;
  title: string;
  status: string;
  jurisdiction: string;
  createdAt: string;
  updatedAt: string;
}

interface RecentContractsTableProps {
  contracts: RecentContractRow[];
  search: string;
  onSearchChange: (value: string) => void;
  loading?: boolean;
}

const COLUMNS = [
  { key: "title", label: "CONTRACT NAME", width: "min-w-[200px]" },
  { key: "stage", label: "STAGE", width: "min-w-[100px]" },
  { key: "agreement", label: "AGREEMENT DATE", width: "min-w-[140px]" },
  { key: "region", label: "REGION", width: "min-w-[120px]" },
  { key: "start", label: "LIC. START DATE", width: "min-w-[140px]" },
  { key: "end", label: "LIC. EXP DATE", width: "min-w-[140px]" },
  { key: "dept", label: "DEPT", width: "min-w-[120px]" },
] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function jurisdictionLabel(code: string) {
  const map: Record<string, string> = {
    US: "United States",
    IN: "India",
    UK: "United Kingdom",
  };
  return map[code] ?? code;
}

export function RecentContractsTable({
  contracts,
  search,
  onSearchChange,
  loading,
}: RecentContractsTableProps) {
  const filtered = contracts.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-[32px] font-medium leading-tight tracking-[-0.08px] text-black">
          Recent Contracts
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Search contracts"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 w-[min(339px,100%)] min-w-[203px] rounded border border-[#DDDDDD] bg-white pr-10 text-base text-[#282828] placeholder:text-[#868686] focus-visible:border-[#66A689] focus-visible:ring-[#006A3B]/20"
            />
            <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#4B4B4B]" />
          </div>
          <Link
            href="/contracts"
            className="inline-flex h-8 items-center gap-2 rounded bg-[#006A3B] px-2 py-3.5 text-sm font-medium text-white shadow-[0px_2px_2px_rgba(51,136,98,0.08)]"
          >
            See all
            <ArrowUpRight className="h-6 w-6" />
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#CCE1D8]">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="bg-white">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "border-b border-[#CCE1D8] px-5 py-4 text-sm font-normal text-[#A6A6A6]",
                    col.width
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {COLUMNS.map((col) => (
                    <td key={col.key} className="border-b border-[#CCE1D8] px-5 py-4">
                      <div className="h-4 animate-pulse rounded bg-[#E8E8E8]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-5 py-12 text-center text-sm text-[#868686]"
                >
                  No contracts found.
                </td>
              </tr>
            ) : (
              filtered.map((contract, index) => (
                <tr
                  key={contract.id}
                  className={cn(
                    "transition-colors hover:bg-[#E8E8E8]/60",
                    index === 1 && "bg-[#E8E8E8]"
                  )}
                >
                  <td className="border-b border-[#CCE1D8] px-5 py-4">
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="block max-w-[200px] truncate text-base font-medium text-black"
                    >
                      {contract.title}
                    </Link>
                  </td>
                  <td className="border-b border-[#CCE1D8] px-5 py-4">
                    <StageBadge stage={mapStatusToStage(contract.status)} />
                  </td>
                  <td className="border-b border-[#CCE1D8] px-5 py-4 text-base text-black">
                    {formatDate(contract.createdAt)}
                  </td>
                  <td className="border-b border-[#CCE1D8] px-5 py-4 text-base text-black">
                    {jurisdictionLabel(contract.jurisdiction)}
                  </td>
                  <td className="border-b border-[#CCE1D8] px-5 py-4 text-base text-black">
                    {formatDate(contract.createdAt)}
                  </td>
                  <td className="border-b border-[#CCE1D8] px-5 py-4 text-base text-black">
                    {formatDate(contract.updatedAt)}
                  </td>
                  <td className="border-b border-[#CCE1D8] px-5 py-4 text-base text-black">
                    {contract.status === "analyzed" ? "Legal" : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
