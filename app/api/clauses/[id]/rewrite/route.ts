import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getSessionUser, jsonError, readJson, unauthorized } from "@/lib/api";
import { rewriteClause } from "@/ai/analysis";
import { REWRITE_STYLES, type RewriteStyle } from "@/ai/prompts";

/** Suggests a rewrite. Nothing is saved until the user applies it (PATCH /api/clauses/[id]). */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { style = "plain_language" } = await readJson(req);
    if (!REWRITE_STYLES.includes(style)) {
      return jsonError(`Invalid style. Must be one of: ${REWRITE_STYLES.join(", ")}`, 400);
    }

    const clause = await db.clause.findFirst({
      where: { id: params.id, contract: { userId: user.id } },
      include: { contract: { select: { jurisdiction: true } } },
    });
    if (!clause) return jsonError("Clause not found", 404);

    const result = await rewriteClause(
      clause.clauseText,
      style as RewriteStyle,
      clause.contract.jurisdiction
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/clauses/[id]/rewrite error:", error);
    return jsonError("Failed to rewrite clause", 500);
  }
}
