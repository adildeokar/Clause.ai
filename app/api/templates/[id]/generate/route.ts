import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getSessionUser, jsonError, readJson, unauthorized } from "@/lib/api";
import { generateFromTemplate } from "@/ai/analysis";
import { localLanguage } from "@/ai/prompts";
import { structureText } from "@/lib/parsing";
import { toJurisdictionCode } from "@/config/jurisdictions";

export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { fields, jurisdiction, useLocalLanguage } = await readJson(req);
    if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
      return jsonError("fields object is required", 400);
    }

    const template = await db.template.findFirst({ where: { id: params.id, isActive: true } });
    if (!template) return jsonError("Template not found", 404);

    const code = toJurisdictionCode(jurisdiction, toJurisdictionCode(template.jurisdiction));
    const language = useLocalLanguage ? localLanguage(code) : "English";

    const result = await generateFromTemplate(template.content, fields, code, language);
    const { cleanedText, clauses } = structureText(result.generated_contract);

    const contract = await db.contract.create({
      data: {
        title: `${template.name} (${code})`,
        fileName: `${template.name.toLowerCase().replace(/\s+/g, "-")}.txt`,
        fileType: "txt",
        rawText: result.generated_contract,
        cleanedText,
        jurisdiction: code,
        contractType: template.category,
        status: "uploaded",
        userId: user.id,
        clauses: { createMany: { data: clauses } },
      },
      select: { id: true, title: true },
    });

    return NextResponse.json(
      { contract: { ...contract, text: result.generated_contract }, notes: result.notes },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/templates/[id]/generate error:", error);
    return jsonError("Failed to generate contract from template", 500);
  }
}
