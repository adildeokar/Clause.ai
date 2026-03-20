"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Calendar,
  PieChart as PieChartIcon,
  Activity,
  Shield,
  Scale,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type DateRange = "7d" | "30d" | "90d" | "all";

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

const RISK_TREND_DATA = [
  { date: "Jan", avgRisk: 5.2, contracts: 8 },
  { date: "Feb", avgRisk: 4.8, contracts: 12 },
  { date: "Mar", avgRisk: 5.5, contracts: 10 },
  { date: "Apr", avgRisk: 4.2, contracts: 15 },
  { date: "May", avgRisk: 3.9, contracts: 18 },
  { date: "Jun", avgRisk: 4.5, contracts: 14 },
  { date: "Jul", avgRisk: 3.7, contracts: 20 },
  { date: "Aug", avgRisk: 3.2, contracts: 22 },
  { date: "Sep", avgRisk: 3.8, contracts: 19 },
  { date: "Oct", avgRisk: 2.9, contracts: 25 },
  { date: "Nov", avgRisk: 3.1, contracts: 23 },
  { date: "Dec", avgRisk: 2.6, contracts: 28 },
];

const CLAUSE_DISTRIBUTION_DATA = [
  { name: "Payment Terms", value: 85, color: "#3b82f6" },
  { name: "Termination", value: 72, color: "#8b5cf6" },
  { name: "Liability", value: 68, color: "#ef4444" },
  { name: "Confidentiality", value: 55, color: "#22c55e" },
  { name: "IP Rights", value: 45, color: "#f59e0b" },
  { name: "Indemnification", value: 38, color: "#06b6d4" },
  { name: "Force Majeure", value: 30, color: "#ec4899" },
  { name: "Other", value: 42, color: "#6b7280" },
];

const JURISDICTION_DATA = [
  { jurisdiction: "US", contracts: 120, avgRisk: 4.2, avgEthics: 7.8 },
  { jurisdiction: "India", contracts: 85, avgRisk: 5.1, avgEthics: 6.9 },
  { jurisdiction: "UK", contracts: 65, avgRisk: 3.8, avgEthics: 8.1 },
];

const TOP_RISK_CLAUSES = [
  { clause: "Unlimited liability for indirect damages", category: "Liability", riskScore: 9.2, contract: "Vendor Agreement - SupplyChain Pro", jurisdiction: "US" },
  { clause: "Unilateral termination without cure period", category: "Termination", riskScore: 8.7, contract: "Service Agreement - TechCorp", jurisdiction: "US" },
  { clause: "IP assignment without compensation", category: "Intellectual Property", riskScore: 8.4, contract: "Employment Contract - Global Solutions", jurisdiction: "IN" },
  { clause: "Non-compete exceeding 24 months", category: "Non-Compete", riskScore: 8.1, contract: "Partnership Agreement - InnoVentures", jurisdiction: "UK" },
  { clause: "Broad indemnification with no cap", category: "Indemnification", riskScore: 7.8, contract: "MSA - Acme Corp", jurisdiction: "US" },
  { clause: "Auto-renewal without notice requirement", category: "Termination", riskScore: 7.5, contract: "Software License - CloudBase", jurisdiction: "UK" },
  { clause: "Data processing without GDPR compliance", category: "Data Protection", riskScore: 7.3, contract: "Vendor Agreement - DataFlow", jurisdiction: "UK" },
];

const ETHICS_DISTRIBUTION = [
  { range: "0-2", count: 5, color: "#ef4444" },
  { range: "2-4", count: 12, color: "#f97316" },
  { range: "4-6", count: 35, color: "#eab308" },
  { range: "6-8", count: 58, color: "#22c55e" },
  { range: "8-10", count: 40, color: "#10b981" },
];

function getRiskVariant(score: number) {
  if (score < 3) return "low" as const;
  if (score < 5) return "medium" as const;
  if (score < 7) return "high" as const;
  return "critical" as const;
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-sm">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((item: any, idx: number) => (
        <p key={idx} className="font-semibold" style={{ color: item.color }}>
          {item.name}: {typeof item.value === "number" ? item.value.toFixed(1) : item.value}
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-sm">
      <p className="text-muted-foreground">{payload[0].name}</p>
      <p className="font-semibold text-foreground">{payload[0].value} clauses</p>
    </div>
  );
};

function ChartSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="h-5 w-40 rounded bg-white/[0.06] mb-6" />
      <div className="h-[280px] rounded bg-white/[0.06]" />
    </div>
  );
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [dateRange]);

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
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your contract portfolio and risk landscape.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {DATE_RANGES.map((range) => (
            <Button
              key={range.value}
              variant={dateRange === range.value ? "default" : "ghost"}
              size="sm"
              className={dateRange === range.value ? "bg-blue-600 hover:bg-blue-700" : "text-muted-foreground hover:text-foreground"}
              onClick={() => { setLoading(true); setDateRange(range.value); }}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Mock Data Notice */}
      <div className="glass-card p-3 border-blue-500/20 flex items-center gap-2">
        <Activity className="h-4 w-4 text-blue-400 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Displaying sample analytics data. Connect to <code className="text-blue-400">/api/dashboard/stats</code> for live metrics.
        </p>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Risk Score Trends */}
        {loading ? (
          <ChartSkeleton />
        ) : (
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-foreground">Risk Score Trends</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={RISK_TREND_DATA}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
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
                <RechartsTooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="avgRisk"
                  name="Avg Risk"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Clause Category Distribution */}
        {loading ? (
          <ChartSkeleton />
        ) : (
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChartIcon className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-foreground">Clause Category Distribution</h3>
            </div>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={280}>
                <PieChart>
                  <Pie
                    data={CLAUSE_DISTRIBUTION_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {CLAUSE_DISTRIBUTION_DATA.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {CLAUSE_DISTRIBUTION_DATA.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Jurisdiction Comparison */}
        {loading ? (
          <ChartSkeleton />
        ) : (
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-4 w-4 text-green-400" />
              <h3 className="text-sm font-semibold text-foreground">Jurisdiction Comparison</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={JURISDICTION_DATA} barSize={32}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="jurisdiction"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(0 0% 64%)", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(0 0% 64%)", fontSize: 12 }}
                />
                <RechartsTooltip content={<ChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: "hsl(0 0% 64%)" }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar dataKey="contracts" name="Contracts" fill="#3b82f6" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgRisk" name="Avg Risk" fill="#ef4444" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgEthics" name="Avg Ethics" fill="#22c55e" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Ethics Score Distribution */}
        {loading ? (
          <ChartSkeleton />
        ) : (
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Scale className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-foreground">Ethics Score Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ETHICS_DISTRIBUTION} barSize={48}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="range"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(0 0% 64%)", fontSize: 12 }}
                  label={{ value: "Score Range", position: "insideBottom", offset: -5, style: { fill: "hsl(0 0% 50%)", fontSize: 11 } }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(0 0% 64%)", fontSize: 12 }}
                  label={{ value: "Contracts", angle: -90, position: "insideLeft", style: { fill: "hsl(0 0% 50%)", fontSize: 11 } }}
                />
                <RechartsTooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Contracts" radius={[6, 6, 0, 0]}>
                  {ETHICS_DISTRIBUTION.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Risk Clauses Table */}
      {loading ? (
        <ChartSkeleton />
      ) : (
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-semibold text-foreground">Top Risk Clauses</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Clause</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Category</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Contract</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Jurisdiction</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {TOP_RISK_CLAUSES.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-4 text-foreground max-w-[280px] truncate">{item.clause}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-muted-foreground text-xs">{item.category}</Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">{item.contract}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs">{item.jurisdiction}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={getRiskVariant(item.riskScore)}>
                        {item.riskScore.toFixed(1)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
