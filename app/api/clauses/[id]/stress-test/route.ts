import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getSessionUser, jsonError, unauthorized } from "@/lib/api";
import { stressTestClause } from "@/ai/analysis";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const clause = await db.clause.findFirst({
      where: { id: params.id, contract: { userId: user.id } },
      include: { contract: { select: { jurisdiction: true } } },
    });
    if (!clause) return jsonError("Clause not found", 404);

    const result = await stressTestClause(clause.clauseText, clause.contract.jurisdiction);

    await db.stressTest.create({
      data: {
        clauseId: clause.id,
        attackScenarios: result.attack_scenarios as unknown as Prisma.InputJsonValue,
        litigationRisk: result.litigation_risk,
        severityIndex: result.severity_index,
        weaknesses: {
          weak_interpretations: result.weak_interpretations,
          defense_suggestions: result.defense_suggestions,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/clauses/[id]/stress-test error:", error);
    return jsonError("Failed to run stress test", 500);
  }
}
