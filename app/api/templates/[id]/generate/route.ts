import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateFromTemplate } from "@/ai/analysis";
import { cleanText, splitIntoClauses } from "@/lib/parsing";

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
    const body = await req.json();

    const { fields, jurisdiction } = body;

    if (!fields || typeof fields !== "object") {
      return NextResponse.json(
        { error: "fields object is required" },
        { status: 400 }
      );
    }

    const template = await db.template.findFirst({
      where: { id, isActive: true },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const effectiveJurisdiction = jurisdiction || template.jurisdiction;

    const result = await generateFromTemplate(
      template.content,
      fields,
      effectiveJurisdiction
    );

    const cleanedText = cleanText(result.generated_contract);
    const parsedClauses = splitIntoClauses(cleanedText);

    const contract = await db.contract.create({
      data: {
        title: `${template.name} - Generated`,
        fileName: `${template.name.toLowerCase().replace(/\s+/g, "-")}.txt`,
        fileType: "txt",
        rawText: result.generated_contract,
        cleanedText,
        jurisdiction: effectiveJurisdiction,
        contractType: template.category,
        status: "uploaded",
        userId,
        clauses: {
          create: parsedClauses.map((clause) => ({
            clauseNumber: clause.clauseNumber,
            clauseTitle: clause.clauseTitle,
            clauseText: clause.clauseText,
            category: clause.category,
          })),
        },
      },
      include: {
        clauses: true,
      },
    });

    return NextResponse.json({
      contract,
      notes: result.notes,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/templates/[id]/generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate contract from template" },
      { status: 500 }
    );
  }
}
