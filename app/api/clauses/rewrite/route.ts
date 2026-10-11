import { NextRequest, NextResponse } from "next/server";

import { getSessionUser, jsonError, readJson, unauthorized } from "@/lib/api";
import { rewriteClause } from "@/ai/analysis";
import { REWRITE_STYLES, type RewriteStyle } from "@/ai/prompts";
import { isJurisdictionCode } from "@/config/jurisdictions";

const MAX_TEXT_CHARS = 5000;

/** Free-form clause rewrite used by the Drafting page. */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { text, style, jurisdiction } = await readJson(req);
    if (typeof text !== "string" || !text.trim()) return jsonError("text is required", 400);
    if (text.length > MAX_TEXT_CHARS) {
      return jsonError(`Clause is too long (max ${MAX_TEXT_CHARS} characters)`, 400);
    }
    if (!REWRITE_STYLES.includes(style)) {
      return jsonError(`Invalid style. Use: ${REWRITE_STYLES.join(", ")}`, 400);
    }
    if (!isJurisdictionCode(jurisdiction)) return jsonError("Unsupported jurisdiction", 400);

    const result = await rewriteClause(text.trim(), style as RewriteStyle, jurisdiction);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/clauses/rewrite error:", error);
    return jsonError("Failed to rewrite clause", 500);
  }
}
