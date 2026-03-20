import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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

    const contract = await db.contract.findFirst({
      where: { id, userId },
      include: {
        clauses: {
          orderBy: { clauseNumber: "asc" },
          include: {
            _count: { select: { versions: true, stressTests: true } },
          },
        },
        analyses: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error("GET /api/contracts/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch contract" },
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

    const existing = await db.contract.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    const allowedFields = ["title", "jurisdiction", "contractType", "status", "summary"];
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const contract = await db.contract.update({
      where: { id },
      data: updateData,
      include: {
        clauses: { orderBy: { clauseNumber: "asc" } },
      },
    });

    return NextResponse.json(contract);
  } catch (error) {
    console.error("PATCH /api/contracts/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update contract" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const existing = await db.contract.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    await db.contract.delete({ where: { id } });

    return NextResponse.json({ message: "Contract deleted" });
  } catch (error) {
    console.error("DELETE /api/contracts/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete contract" },
      { status: 500 }
    );
  }
}
