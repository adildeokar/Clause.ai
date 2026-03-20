import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  analyzeClause,
  detectLoopholes,
  assessFairness,
  type ClauseAnalysisResult,
} from "@/ai/analysis";

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

    const contract = await db.contract.findFirst({
      where: { id, userId },
      include: { clauses: { orderBy: { clauseNumber: "asc" } } },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    await db.contract.update({
      where: { id },
      data: { status: "parsing" },
    });

    const clauseResults: Array<{
      clauseId: string;
      analysis: ClauseAnalysisResult;
    }> = [];

    for (const clause of contract.clauses) {
      const analysis = await analyzeClause(
        clause.clauseText,
        contract.jurisdiction,
        contract.contractType || undefined
      );

      await db.clause.update({
        where: { id: clause.id },
        data: {
          riskScore: analysis.risk_score,
          biasScore: analysis.bias_score,
          strengthScore: analysis.strength_score,
          analysisJson: JSON.parse(JSON.stringify(analysis)),
        },
      });

      clauseResults.push({ clauseId: clause.id, analysis });
    }

    const [loopholes, fairness] = await Promise.all([
      detectLoopholes(contract.cleanedText, contract.jurisdiction),
      assessFairness(contract.cleanedText, contract.jurisdiction),
    ]);

    const clauseCount = clauseResults.length || 1;
    const avgRiskScore =
      clauseResults.reduce((sum, r) => sum + r.analysis.risk_score, 0) / clauseCount;
    const avgBiasScore =
      clauseResults.reduce((sum, r) => sum + r.analysis.bias_score, 0) / clauseCount;
    const avgStrengthScore =
      clauseResults.reduce((sum, r) => sum + r.analysis.strength_score, 0) / clauseCount;

    await db.contract.update({
      where: { id },
      data: {
        status: "analyzed",
        riskScore: avgRiskScore,
        biasScore: avgBiasScore,
        strengthScore: avgStrengthScore,
      },
    });

    const analysisResult = await db.analysisResult.create({
      data: {
        contractId: id,
        userId,
        analysisType: "full",
        resultJson: JSON.parse(JSON.stringify({
          clauseResults: clauseResults.map((r) => ({
            clauseId: r.clauseId,
            ...r.analysis,
          })),
          loopholes,
          fairness,
        })),
        riskScore: avgRiskScore,
        confidenceScore:
          clauseResults.reduce((sum, r) => sum + r.analysis.confidence_score, 0) /
          clauseCount,
        jurisdiction: contract.jurisdiction,
      },
    });

    return NextResponse.json({
      analysisId: analysisResult.id,
      contractId: id,
      overallScores: {
        riskScore: avgRiskScore,
        biasScore: avgBiasScore,
        strengthScore: avgStrengthScore,
      },
      clauseResults: clauseResults.map((r) => ({
        clauseId: r.clauseId,
        ...r.analysis,
      })),
      loopholes,
      fairness,
    });
  } catch (error) {
    console.error("POST /api/contracts/[id]/analyze error:", error);

    const { id } = await params;
    await db.contract
      .update({ where: { id }, data: { status: "error" } })
      .catch(() => {});

    return NextResponse.json(
      { error: "Failed to analyze contract" },
      { status: 500 }
    );
  }
}
