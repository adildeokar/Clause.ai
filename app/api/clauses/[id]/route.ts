import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getSessionUser, jsonError, readJson, unauthorized } from "@/lib/api";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const clause = await db.clause.findFirst({
      where: { id: params.id, contract: { userId: user.id } },
      include: {
        versions: { orderBy: { version: "desc" } },
        stressTests: { orderBy: { createdAt: "desc" }, take: 5 },
        contract: { select: { id: true, title: true, jurisdiction: true, contractType: true } },
      },
    });

    if (!clause) return jsonError("Clause not found", 404);
    return NextResponse.json(clause);
  } catch (error) {
    console.error("GET /api/clauses/[id] error:", error);
    return jsonError("Failed to fetch clause", 500);
  }
}

/** Replaces a clause's text, recording a new version and clearing stale analysis. */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { clauseText, changeReason } = await readJson(req);
    if (typeof clauseText !== "string" || !clauseText.trim()) {
      return jsonError("clauseText is required", 400);
    }

    const clause = await db.clause.findFirst({
      where: { id: params.id, contract: { userId: user.id } },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (!clause) return jsonError("Clause not found", 404);

    const [updatedClause] = await db.$transaction([
      db.clause.update({
        where: { id: clause.id },
        data: {
          clauseText: clauseText.trim(),
          riskScore: null,
          biasScore: null,
          strengthScore: null,
          analysisJson: Prisma.DbNull,
        },
      }),
      db.clauseVersion.create({
        data: {
          clauseId: clause.id,
          version: (clause.versions[0]?.version ?? 0) + 1,
          clauseText: clauseText.trim(),
          changeReason: typeof changeReason === "string" ? changeReason : null,
          changedBy: user.id,
        },
      }),
      // The text changed, so its chat-retrieval embedding is stale.
      db.clauseEmbedding.deleteMany({ where: { clauseId: clause.id } }),
    ]);

    return NextResponse.json(updatedClause);
  } catch (error) {
    console.error("PATCH /api/clauses/[id] error:", error);
    return jsonError("Failed to update clause", 500);
  }
}
