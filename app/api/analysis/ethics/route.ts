import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getSessionUser, jsonError, readJson, unauthorized } from "@/lib/api";
import { scanEthics } from "@/ai/analysis";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { contractId } = await readJson(req);
    if (typeof contractId !== "string") return jsonError("contractId is required", 400);

    const contract = await db.contract.findFirst({
      where: { id: contractId, userId: user.id },
      select: { id: true, cleanedText: true, jurisdiction: true },
    });
    if (!contract) return jsonError("Contract not found", 404);

    const result = await scanEthics(contract.cleanedText, contract.jurisdiction);

    await db.analysisResult.create({
      data: {
        contractId: contract.id,
        userId: user.id,
        analysisType: "ethics",
        resultJson: result as unknown as Prisma.InputJsonValue,
        // ethics_score is 100 = fully ethical; store it as risk.
        riskScore: result.ethics_score === null ? null : 100 - result.ethics_score,
        jurisdiction: contract.jurisdiction,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/analysis/ethics error:", error);
    return jsonError("Failed to run ethics scan", 500);
  }
}
