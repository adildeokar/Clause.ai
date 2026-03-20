import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// TODO: Add rate limiting middleware

export async function GET(
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

    const clause = await db.clause.findFirst({
      where: {
        id,
        contract: { userId },
      },
      include: {
        versions: { orderBy: { version: "desc" } },
        stressTests: { orderBy: { createdAt: "desc" }, take: 5 },
        contract: { select: { id: true, title: true, jurisdiction: true, contractType: true } },
      },
    });

    if (!clause) {
      return NextResponse.json(
        { error: "Clause not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(clause);
  } catch (error) {
    console.error("GET /api/clauses/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch clause" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const { clauseText, changeReason } = body;

    if (!clauseText || typeof clauseText !== "string") {
      return NextResponse.json(
        { error: "clauseText is required" },
        { status: 400 }
      );
    }

    const clause = await db.clause.findFirst({
      where: {
        id,
        contract: { userId },
      },
      include: {
        versions: { orderBy: { version: "desc" }, take: 1 },
      },
    });

    if (!clause) {
      return NextResponse.json(
        { error: "Clause not found" },
        { status: 404 }
      );
    }

    const nextVersion = (clause.versions[0]?.version ?? 0) + 1;

    const [updatedClause] = await db.$transaction([
      db.clause.update({
        where: { id },
        data: {
          clauseText,
          riskScore: null,
          biasScore: null,
          strengthScore: null,
          analysisJson: Prisma.DbNull,
        },
      }),
      db.clauseVersion.create({
        data: {
          clauseId: id,
          version: nextVersion,
          clauseText,
          changeReason: changeReason || null,
          changedBy: userId,
        },
      }),
    ]);

    return NextResponse.json(updatedClause);
  } catch (error) {
    console.error("PATCH /api/clauses/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update clause" },
      { status: 500 }
    );
  }
}
