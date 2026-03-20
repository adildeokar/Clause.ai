"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  AlertTriangle,
  BarChart3,
  Shield,
  TrendingUp,
  TrendingDown,
  Upload,
  ArrowRight,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  totalContracts: number;
  avgRiskScore: number;
  totalClauses: number;
  highRiskClauses: number;
  recentContracts: {
    id: string;
    title: string;
    status: string;
    riskScore: number | null;
    createdAt: string;
    _count: { clauses: number };
  }[];
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

function getRiskVariant(score: number | null) {
  if (score === null) return "secondary" as const;
  if (score < 3) return "low" as const;
  if (score < 5) return "medium" as const;
  if (score < 7) return "high" as const;
  return "critical" as const;
}

function getRiskLabel(score: number | null) {
  if (score === null) return "N/A";
  if (score < 3) return "Low";
  if (score < 5) return "Medium";
  if (score < 7) return "High";
  return "Critical";
}

function getStatusColor(status: string) {
  switch (status) {
    case "analyzed":
      return "text-green-400";
    case "parsing":
      return "text-yellow-400";
    case "error":
      return "text-red-400";
    default:
      return "text-blue-400";
  }
}

const STRENGTH_MOCK_DATA = [
  { month: "Jan", score: 6.2 },
  { month: "Feb", score: 6.8 },
  { month: "Mar", score: 7.1 },
  { month: "Apr", score: 6.5 },
  { month: "May", score: 7.4 },
  { month: "Jun", score: 7.8 },
  { month: "Jul", score: 7.2 },
  { month: "Aug", score: 8.1 },
];

function StatCardSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-10 rounded-lg bg-white/[0.06]" />
        <div className="h-5 w-16 rounded bg-white/[0.06]" />
      </div>
      <div className="h-8 w-20 rounded bg-white/[0.06] mb-2" />
      <div className="h-4 w-28 rounded bg-white/[0.06]" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="h-5 w-40 rounded bg-white/[0.06] mb-6" />
      <div className="h-[260px] rounded bg-white/[0.06]" />
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">
        {payload[0].value.toFixed(1)}
      </p>
    </div>
  );
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
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

  const riskDistData = stats
    ? [
        { name: "Low", value: stats.riskDistribution.low, color: "#22c55e" },
        {
          name: "Medium",
          value: stats.riskDistribution.medium,
          color: "#eab308",
        },
        { name: "High", value: stats.riskDistribution.high, color: "#f97316" },
        {
          name: "Critical",
          value: stats.riskDistribution.critical,
          color: "#ef4444",
        },
      ]
    : [];

  const statCards = [
    {
      label: "Total Contracts",
      value: stats?.totalContracts ?? 0,
      icon: FileText,
      accent: "text-blue-400",
      bg: "bg-blue-500/10",
      trend: "+12%",
      trendUp: true,
    },
    {
      label: "Risk Average",
      value: stats?.avgRiskScore?.toFixed(1) ?? "0.0",
      icon: AlertTriangle,
      accent:
        (stats?.avgRiskScore ?? 0) >= 7
          ? "text-red-400"
          : (stats?.avgRiskScore ?? 0) >= 5
            ? "text-orange-400"
            : (stats?.avgRiskScore ?? 0) >= 3
              ? "text-yellow-400"
              : "text-green-400",
      bg:
        (stats?.avgRiskScore ?? 0) >= 7
          ? "bg-red-500/10"
          : (stats?.avgRiskScore ?? 0) >= 5
            ? "bg-orange-500/10"
            : (stats?.avgRiskScore ?? 0) >= 3
              ? "bg-yellow-500/10"
              : "bg-green-500/10",
      trend: "-8%",
      trendUp: false,
    },
    {
      label: "Clauses Analyzed",
      value: stats?.totalClauses ?? 0,
      icon: BarChart3,
      accent: "text-purple-400",
      bg: "bg-purple-500/10",
      trend: "+24%",
      trendUp: true,
    },
    {
      label: "High Risk Clauses",
      value: stats?.highRiskClauses ?? 0,
      icon: Shield,
      accent: "text-red-400",
      bg: "bg-red-500/10",
      trend: "-3%",
      trendUp: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground">
            Monitor your contract portfolio at a glance.
          </p>
        </div>
        <Link href="/contracts/upload">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Upload className="h-4 w-4" />
            Upload Contract
          </Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="glass-card p-6 transition-all duration-200 hover:bg-white/[0.06]">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}>
                      <Icon className={`h-5 w-5 ${card.accent}`} />
                    </div>
                    <span
                      className={`flex items-center gap-1 text-xs font-medium ${card.trendUp ? "text-green-400" : "text-red-400"}`}
                    >
                      {card.trendUp ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {card.trend}
                    </span>
                  </div>
                  <p className="text-3xl font-bold tracking-tight">
                    {card.value}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {card.label}
                  </p>
                </div>
              );
            })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Risk Distribution */}
        {loading ? (
          <ChartSkeleton />
        ) : (
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-6">
              Risk Distribution
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={riskDistData} barSize={40}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(0 0% 64%)", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(0 0% 64%)", fontSize: 12 }}
                  allowDecimals={false}
                />
                <RechartsTooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {riskDistData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Contracts */}
        {loading ? (
          <ChartSkeleton />
        ) : (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-foreground">
                Recent Contracts
              </h3>
              <Link href="/contracts">
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-foreground">
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            {stats?.recentContracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No contracts yet
                </p>
                <Link href="/contracts/upload" className="mt-3">
                  <Button variant="outline" size="sm">
                    Upload your first
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.recentContracts.map((contract) => (
                  <Link
                    key={contract.id}
                    href={`/contracts/${contract.id}`}
                    className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                        <FileText className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {contract.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(contract.createdAt).toLocaleDateString()}
                          <span className="text-white/20">|</span>
                          <span>{contract._count.clauses} clauses</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-xs capitalize ${getStatusColor(contract.status)}`}
                      >
                        {contract.status}
                      </span>
                      {contract.riskScore !== null && (
                        <Badge variant={getRiskVariant(contract.riskScore)}>
                          {contract.riskScore.toFixed(1)}
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contract Strength Score Trend */}
      {loading ? (
        <ChartSkeleton />
      ) : (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-6">
            Contract Strength Score Trend
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={STRENGTH_MOCK_DATA}>
              <defs>
                <linearGradient id="strengthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(0 0% 64%)", fontSize: 12 }}
              />
              <YAxis
                domain={[0, 10]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(0 0% 64%)", fontSize: 12 }}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#strengthGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
