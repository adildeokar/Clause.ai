"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Search } from "lucide-react";

import { StatCard } from "@/components/app/stat-card";
import { TemplateCarousel } from "@/components/app/template-carousel";
import { ContractsTable, type ContractTableRow } from "@/components/app/contracts-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DashboardStats {
  totalContracts: number;
  activeContracts: number;
  highAlertContracts: number;
  pendingContracts: number;
  recentContracts: ContractTableRow[];
}

interface Template {
  id: string;
  name: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, templatesRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/templates"),
        ]);
        if (!statsRes.ok) throw new Error("Failed to load the dashboard");
        setStats(await statsRes.json());
        if (templatesRes.ok) {
          const data: Template[] = await templatesRes.json();
          setTemplates(data.slice(0, 8).map(({ id, name }) => ({ id, name })));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load the dashboard");
      } finally {
        setLoading(false);
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

  const value = (n: number | undefined) => (loading ? "—" : n ?? 0);
  const recent = (stats?.recentContracts ?? []).filter((c) =>
    c.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="flex flex-col gap-9">
      <section className="flex flex-col gap-4">
        <h1 className="text-[32px] font-medium leading-tight tracking-[-0.08px] text-black">
          Draft New Contract
        </h1>
        <TemplateCarousel templates={templates} loading={loading} />
      </section>

      <hr className="border-[#CCE1D8]" />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard variant="active" value={value(stats?.activeContracts)} label="Analyzed" sublabel="Contracts" />
        <StatCard variant="alert" value={value(stats?.highAlertContracts)} label="High Risk" sublabel="Contracts" />
        <StatCard variant="pending" value={value(stats?.pendingContracts)} label="Awaiting" sublabel="Analysis" />
        <StatCard variant="total" value={value(stats?.totalContracts)} label="Total" sublabel="Contracts" />
      </section>

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
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-[min(339px,60vw)] rounded border border-[#DDDDDD] bg-white pr-10 text-base text-[#282828] placeholder:text-[#868686]"
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#4B4B4B]" />
            </div>
            <Link
              href="/contracts"
              className="inline-flex h-8 items-center gap-1 rounded bg-[#006A3B] px-3 text-sm font-medium text-white hover:bg-[#005a32]"
            >
              See all
              <ArrowUpRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
        <ContractsTable
          contracts={recent}
          loading={loading}
          emptyMessage={search ? "No contracts match your search." : "No contracts yet — upload your first one."}
        />
      </section>
    </div>
  );
}
