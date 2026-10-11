"use client";

import Link from "next/link";

import { StageBadge } from "@/components/app/stage-badge";
import { mapStatusToStage } from "@/lib/design-tokens";
import { jurisdictionName } from "@/config/jurisdictions";
import { cn, formatDate, formatScore, getRiskLevel, type RiskLevel } from "@/lib/utils";

export interface ContractTableRow {
  id: string;
  title: string;
  status: string;
  jurisdiction: string;
  contractType: string | null;
  riskScore: number | null;
  createdAt: string;
  updatedAt: string;
  _count?: { clauses: number };
}

interface ContractsTableProps {
  contracts: ContractTableRow[];
  loading?: boolean;
  emptyMessage?: string;
}

const COLUMNS = [
  { key: "title", label: "CONTRACT NAME", className: "min-w-[200px]" },
  { key: "stage", label: "STAGE", className: "min-w-[100px]" },
  { key: "uploaded", label: "UPLOADED", className: "min-w-[140px]" },
  { key: "region", label: "REGION", className: "min-w-[120px]" },
  { key: "risk", label: "RISK SCORE", className: "min-w-[100px]" },
  { key: "clauses", label: "CLAUSES", className: "min-w-[90px]" },
  { key: "dept", label: "TYPE", className: "min-w-[120px]" },
] as const;

function riskColor(score: number | null) {
  if (score === null) return "text-[#868686]";
  const colors: Record<RiskLevel, string> = {
    critical: "text-[#F83446]",
    high: "text-[#B97502]",
    medium: "text-[#D79900]",
    low: "text-[#006A3B]",
  };
  return colors[getRiskLevel(score)];
}

export function ContractsTable({
  contracts,
  loading,
  emptyMessage = "No contracts found.",
}: ContractsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#CCE1D8]">
      <table className="w-full min-w-[960px] border-collapse text-left">
        <thead>
          <tr className="bg-white">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "border-b border-[#CCE1D8] px-5 py-4 text-sm font-normal text-[#A6A6A6]",
                  col.className
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className="border-b border-[#CCE1D8] px-5 py-4"
                  >
                    <div className="h-4 animate-pulse rounded bg-[#E8E8E8]" />
                  </td>
                ))}
              </tr>
            ))
          ) : contracts.length === 0 ? (
            <tr>
              <td
                colSpan={COLUMNS.length}
                className="px-5 py-16 text-center text-sm text-[#868686]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            contracts.map((contract) => (
              <tr key={contract.id} className="transition-colors hover:bg-[#F4F7F6]">
                <td className="border-b border-[#CCE1D8] px-5 py-4">
                  <Link
                    href={`/contracts/${contract.id}`}
                    className="block max-w-[220px] truncate text-base font-medium text-black hover:text-[#006A3B]"
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
                  {jurisdictionName(contract.jurisdiction)}
                </td>
                <td
                  className={cn(
                    "border-b border-[#CCE1D8] px-5 py-4 text-base font-medium",
                    riskColor(contract.riskScore)
                  )}
                >
                  {contract.riskScore !== null
                    ? formatScore(contract.riskScore)
                    : "—"}
                </td>
                <td className="border-b border-[#CCE1D8] px-5 py-4 text-base text-black">
                  {contract._count?.clauses ?? "—"}
                </td>
                <td className="border-b border-[#CCE1D8] px-5 py-4 text-base text-black">
                  {contract.contractType ?? "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
