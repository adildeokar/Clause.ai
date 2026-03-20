import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rewriteClause, type RewriteResult } from "@/ai/analysis";
import { type RewriteStyle } from "@/ai/prompts";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { text, style, jurisdiction } = body;

    if (!text || !style || !jurisdiction) {
      return NextResponse.json(
        { error: "text, style, and jurisdiction are required" },
        { status: 400 }
      );
    }

    const validStyles: RewriteStyle[] = [
      "corporate",
      "startup_friendly",
      "assertive",
      "plain_language",
    ];

    const styleMap: Record<string, RewriteStyle> = {
      corporate: "corporate",
      startup: "startup_friendly",
      startup_friendly: "startup_friendly",
      assertive: "assertive",
      plain: "plain_language",
      plain_language: "plain_language",
    };

    const mappedStyle = styleMap[style] || style;
    if (!validStyles.includes(mappedStyle as RewriteStyle)) {
      return NextResponse.json(
        { error: `Invalid style. Use: ${validStyles.join(", ")}` },
        { status: 400 }
      );
    }

    const result: RewriteResult = await rewriteClause(
      text,
      mappedStyle as RewriteStyle,
      jurisdiction
    );

    return NextResponse.json({
      rewritten: result.rewritten_clause,
      rewrittenText: result.rewritten_clause,
      style: result.style_applied,
      changes: result.changes_summary,
      readabilityScore: result.readability_score,
      legalStrengthScore: result.legal_strength_score,
      enforceabilityNotes: result.enforceability_notes,
    });
  } catch (error) {
    console.error("POST /api/clauses/rewrite error:", error);
    return NextResponse.json(
      { error: "Failed to rewrite clause" },
      { status: 500 }
    );
  }
}
