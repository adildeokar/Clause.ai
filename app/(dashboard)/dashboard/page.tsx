"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { StatCard } from "@/components/app/stat-card";
import { TemplateCarousel } from "@/components/app/template-carousel";
import {
  RecentContractsTable,
  type RecentContractRow,
} from "@/components/app/recent-contracts-table";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalContracts: number;
  avgRiskScore: number;
  totalClauses: number;
  highRiskClauses: number;
  activeContracts: number;
  highAlertContracts: number;
  expiringSoonContracts: number;
  pendingContracts: number;
  recentContracts: RecentContractRow[];
}

interface Template {
  id: string;
  name: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, templatesRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/templates"),
        ]);
        if (!statsRes.ok) throw new Error("Failed to fetch dashboard");
        const statsData = await statsRes.json();
        setStats(statsData);
        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          setTemplates(
            (templatesData.templates ?? templatesData ?? []).slice(0, 8).map(
              (t: { id: string; name: string }) => ({
                id: t.id,
                name: t.name,
              })
            )
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
        setTemplatesLoading(false);
      }
    }
    load();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertTriangle className="h-12 w-12 text-[#F83446]" />
        <p className="text-lg text-[#868686]">{error}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="border-[#006A3B] text-[#006A3B]"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-9">
      <section className="flex flex-col gap-4">
        <h1 className="text-[32px] font-medium leading-tight tracking-[-0.08px] text-black">
          Draft New Contract
        </h1>
        <TemplateCarousel templates={templates} loading={templatesLoading} />
      </section>

      <hr className="border-[#CCE1D8]" />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          variant="active"
          value={loading ? "—" : (stats?.activeContracts ?? 0)}
          label="Active"
          sublabel="Contracts"
        />
        <StatCard
          variant="alert"
          value={loading ? "—" : (stats?.highAlertContracts ?? 0)}
          label="High Alerts"
          sublabel="Contracts"
        />
        <StatCard
          variant="expiring"
          value={loading ? "—" : (stats?.expiringSoonContracts ?? 0)}
          label="Expiring Soon"
          sublabel="Contracts"
        />
        <StatCard
          variant="pending"
          value={loading ? "—" : (stats?.pendingContracts ?? 0)}
          label="Pending"
          sublabel="Contracts"
        />
      </section>

      <RecentContractsTable
        contracts={stats?.recentContracts ?? []}
        search={search}
        onSearchChange={setSearch}
        loading={loading}
      />
    </div>
  );
}
