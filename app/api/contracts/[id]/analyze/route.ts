import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getSessionUser, jsonError, unauthorized } from "@/lib/api";
import { analyzeClauses, reviewContract, type ClauseAnalysis } from "@/ai/analysis";
import type { ReviewerProfile } from "@/ai/prompts";

// Clause batches and the whole-document review run concurrently; allow the
// longest duration the Vercel Hobby plan permits.
export const maxDuration = 60;

function average(values: (number | null)[]) {
  const present = values.filter((v): v is number => v !== null);
  return present.length ? present.reduce((a, b) => a + b, 0) / present.length : null;
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const contract = await db.contract.findFirst({
    where: { id: params.id, userId: user.id },
    include: { clauses: { orderBy: { clauseNumber: "asc" } } },
  });
  if (!contract) return jsonError("Contract not found", 404);

  try {
    await db.contract.update({ where: { id: contract.id }, data: { status: "parsing" } });

    const profile = await db.riskProfile.findUnique({ where: { userId: user.id } });
    const reviewer: ReviewerProfile = {
      riskTolerance: profile?.riskTolerance,
      focusAreas: Array.isArray(profile?.preferredClauses)
        ? (profile.preferredClauses as string[])
        : [],
    };

    const [analyses, review] = await Promise.all([
      analyzeClauses(contract.clauses, contract.jurisdiction, contract.contractType, reviewer),
      reviewContract(contract.cleanedText, contract.jurisdiction, contract.contractType, reviewer),
    ]);

    const scored = contract.clauses.filter((c) => analyses.has(c.clauseNumber));
    if (contract.clauses.length > 0 && scored.length === 0) {
      throw new Error("All clause analyses failed");
    }

    const results = scored.map((clause) => ({
      clause,
      analysis: analyses.get(clause.clauseNumber) as ClauseAnalysis,
    }));

    const riskScore = average(results.map((r) => r.analysis.risk_score));
    const biasScore = average(results.map((r) => r.analysis.bias_score));
    const strengthScore = average(results.map((r) => r.analysis.strength_score));
    const confidenceScore = average(results.map((r) => r.analysis.confidence_score));

    const clauseResults = results.map(({ clause, analysis }) => ({
      clauseId: clause.id,
      clauseNumber: clause.clauseNumber,
      ...analysis,
    }));

    const [analysisResult] = await db.$transaction([
      db.analysisResult.create({
        data: {
          contractId: contract.id,
          userId: user.id,
          analysisType: "full",
          resultJson: {
            clauseResults,
            loopholes: review.loopholes,
            fairness: review.fairness,
          } as unknown as Prisma.InputJsonValue,
          riskScore,
          confidenceScore,
          jurisdiction: contract.jurisdiction,
        },
      }),
      db.contract.update({
        where: { id: contract.id },
        data: {
          status: "analyzed",
          riskScore,
          biasScore,
          strengthScore,
          summary: review.summary || null,
        },
      }),
      ...results.map(({ clause, analysis }) =>
        db.clause.update({
          where: { id: clause.id },
          data: {
            riskScore: analysis.risk_score,
            biasScore: analysis.bias_score,
            strengthScore: analysis.strength_score,
            analysisJson: analysis as unknown as Prisma.InputJsonValue,
          },
        })
      ),
    ]);

    return NextResponse.json({
      analysisId: analysisResult.id,
      overallScores: { riskScore, biasScore, strengthScore },
      clausesAnalyzed: results.length,
      clausesTotal: contract.clauses.length,
    });
  } catch (error) {
    console.error("POST /api/contracts/[id]/analyze error:", error);
    await db.contract
      .update({ where: { id: contract.id }, data: { status: "error" } })
      .catch(() => {});
    return jsonError("Analysis failed. Please try again.", 500);
  }
}
