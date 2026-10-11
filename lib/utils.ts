import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

/**
 * All AI scores (risk, bias, strength, confidence, ...) are on a 0–100 scale,
 * matching the prompts in ai/prompts.ts and the values stored in the database.
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score < 30) return "low";
  if (score < 50) return "medium";
  if (score < 70) return "high";
  return "critical";
}

/** For "higher is better" scores such as strength, fairness or ethics. */
export function getStrengthLevel(score: number): RiskLevel {
  if (score >= 70) return "low";
  if (score >= 50) return "medium";
  if (score >= 30) return "high";
  return "critical";
}

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

export function formatScore(score: number): string {
  return Math.round(score).toString();
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

/** Runs `fn` over `items` with at most `limit` calls in flight. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      try {
        results[index] = { status: "fulfilled", value: await fn(items[index]) };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
