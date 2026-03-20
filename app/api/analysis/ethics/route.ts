import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { scanEthics } from "@/ai/analysis";

// TODO: Add rate limiting middleware

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const body = await req.json();

    const { contractId, jurisdiction } = body;

    if (!contractId) {
      return NextResponse.json(
        { error: "contractId is required" },
        { status: 400 }
      );
    }

    const contract = await db.contract.findFirst({
      where: { id: contractId, userId },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    const effectiveJurisdiction = jurisdiction || contract.jurisdiction;

    const result = await scanEthics(
      contract.cleanedText,
      effectiveJurisdiction
    );

    await db.analysisResult.create({
      data: {
        contractId,
        userId,
        analysisType: "ethics",
        resultJson: JSON.parse(JSON.stringify(result)),
        riskScore: result.ethics_score,
        jurisdiction: effectiveJurisdiction,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/analysis/ethics error:", error);
    return NextResponse.json(
      { error: "Failed to run ethics scan" },
      { status: 500 }
    );
  }
}
