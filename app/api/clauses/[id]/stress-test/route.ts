import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { stressTestClause } from "@/ai/analysis";

// TODO: Add rate limiting middleware

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const { id } = await params;

    const clause = await db.clause.findFirst({
      where: {
        id,
        contract: { userId },
      },
      include: {
        contract: { select: { jurisdiction: true } },
      },
    });

    if (!clause) {
      return NextResponse.json(
        { error: "Clause not found" },
        { status: 404 }
      );
    }

    const result = await stressTestClause(
      clause.clauseText,
      clause.contract.jurisdiction
    );

    const stressTest = await db.stressTest.create({
      data: {
        clauseId: id,
        attackScenarios: JSON.parse(JSON.stringify(result.attack_scenarios)),
        litigationRisk: result.litigation_risk,
        severityIndex: result.severity_index,
        weaknesses: JSON.parse(JSON.stringify({
          weak_interpretations: result.weak_interpretations,
          defense_suggestions: result.defense_suggestions,
        })),
      },
    });

    return NextResponse.json({
      stressTestId: stressTest.id,
      ...result,
    });
  } catch (error) {
    console.error("POST /api/clauses/[id]/stress-test error:", error);
    return NextResponse.json(
      { error: "Failed to run stress test" },
      { status: 500 }
    );
  }
}
