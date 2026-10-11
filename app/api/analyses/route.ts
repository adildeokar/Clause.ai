import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, jsonError, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

function countIssues(analysisType: string, result: any): number {
  if (!result || typeof result !== "object") return 0;
  const len = (value: unknown) => (Array.isArray(value) ? value.length : 0);

  switch (analysisType) {
    case "full":
      return (
        len(result.loopholes?.loopholes) +
        (Array.isArray(result.clauseResults)
          ? result.clauseResults.reduce(
              (sum: number, clause: any) => sum + len(clause?.issues),
              0
            )
          : 0)
      );
    case "ethics":
      return len(result.issues);
    case "benchmark":
      return len(result.improvement_suggestions);
    default:
      return 0;
  }
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const analyses = await db.analysisResult.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { contract: { select: { title: true } } },
    });

    return NextResponse.json(
      analyses.map((a) => ({
        id: a.id,
        contractId: a.contractId,
        contractTitle: a.contract.title,
        type: a.analysisType,
        riskScore: a.riskScore,
        issuesFound: countIssues(a.analysisType, a.resultJson),
        createdAt: a.createdAt,
      }))
    );
  } catch (error) {
    console.error("GET /api/analyses error:", error);
    return jsonError("Failed to fetch analyses", 500);
  }
}
