import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { benchmarkClause } from "@/ai/analysis";

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
        contract: { select: { jurisdiction: true, contractType: true } },
      },
    });

    if (!clause) {
      return NextResponse.json(
        { error: "Clause not found" },
        { status: 404 }
      );
    }

    const category = clause.category || clause.contract.contractType || "general";

    const result = await benchmarkClause(
      clause.clauseText,
      category,
      clause.contract.jurisdiction
    );

    await db.analysisResult.create({
      data: {
        contractId: clause.contractId,
        userId,
        analysisType: "benchmark",
        resultJson: JSON.parse(JSON.stringify(result)),
        riskScore: result.clause_score,
        jurisdiction: clause.contract.jurisdiction,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/clauses/[id]/benchmark error:", error);
    return NextResponse.json(
      { error: "Failed to benchmark clause" },
      { status: 500 }
    );
  }
}
