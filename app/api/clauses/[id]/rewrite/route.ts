import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { rewriteClause } from "@/ai/analysis";
import type { RewriteStyle } from "@/ai/prompts";

// TODO: Add rate limiting middleware

const VALID_STYLES: RewriteStyle[] = [
  "corporate",
  "startup_friendly",
  "assertive",
  "plain_language",
];

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
    const body = await req.json();

    const { style, jurisdiction } = body;

    if (!style || !VALID_STYLES.includes(style)) {
      return NextResponse.json(
        {
          error: `Invalid style. Must be one of: ${VALID_STYLES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const clause = await db.clause.findFirst({
      where: {
        id,
        contract: { userId },
      },
      include: {
        contract: { select: { jurisdiction: true } },
        versions: { orderBy: { version: "desc" }, take: 1 },
      },
    });

    if (!clause) {
      return NextResponse.json(
        { error: "Clause not found" },
        { status: 404 }
      );
    }

    const effectiveJurisdiction = jurisdiction || clause.contract.jurisdiction;

    const result = await rewriteClause(
      clause.clauseText,
      style as RewriteStyle,
      effectiveJurisdiction
    );

    const nextVersion = (clause.versions[0]?.version ?? 0) + 1;

    await db.clauseVersion.create({
      data: {
        clauseId: id,
        version: nextVersion,
        clauseText: result.rewritten_clause,
        changeReason: `AI rewrite in ${style} style`,
        changedBy: userId,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/clauses/[id]/rewrite error:", error);
    return NextResponse.json(
      { error: "Failed to rewrite clause" },
      { status: 500 }
    );
  }
}
