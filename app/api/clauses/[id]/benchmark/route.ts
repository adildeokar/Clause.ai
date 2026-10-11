import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getSessionUser, jsonError, unauthorized } from "@/lib/api";
import { benchmarkClause } from "@/ai/analysis";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const clause = await db.clause.findFirst({
      where: { id: params.id, contract: { userId: user.id } },
      include: { contract: { select: { jurisdiction: true, contractType: true } } },
    });
    if (!clause) return jsonError("Clause not found", 404);

    const category = clause.category || clause.contract.contractType || "general";
    const result = await benchmarkClause(clause.clauseText, category, clause.contract.jurisdiction);

    await db.analysisResult.create({
      data: {
        contractId: clause.contractId,
        userId: user.id,
        analysisType: "benchmark",
        resultJson: result as unknown as Prisma.InputJsonValue,
        // clause_score is a quality score (100 = best); store it as risk.
        riskScore: result.clause_score === null ? null : 100 - result.clause_score,
        jurisdiction: clause.contract.jurisdiction,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/clauses/[id]/benchmark error:", error);
    return jsonError("Failed to benchmark clause", 500);
  }
}
