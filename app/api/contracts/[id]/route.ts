import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getSessionUser, jsonError, readJson, unauthorized } from "@/lib/api";
import { isJurisdictionCode } from "@/config/jurisdictions";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const contract = await db.contract.findFirst({
      where: { id: params.id, userId: user.id },
      omit: { rawText: true, cleanedText: true },
      include: {
        clauses: {
          orderBy: { clauseNumber: "asc" },
          include: { _count: { select: { versions: true, stressTests: true } } },
        },
        analyses: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });

    if (!contract) return jsonError("Contract not found", 404);
    return NextResponse.json(contract);
  } catch (error) {
    console.error("GET /api/contracts/[id] error:", error);
    return jsonError("Failed to fetch contract", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const existing = await db.contract.findFirst({
      where: { id: params.id, userId: user.id },
      select: { id: true },
    });
    if (!existing) return jsonError("Contract not found", 404);

    const body = await readJson(req);
    const data: Prisma.ContractUpdateInput = {};
    if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim().slice(0, 200);
    if (typeof body.contractType === "string") data.contractType = body.contractType.trim() || null;
    if (body.jurisdiction !== undefined) {
      if (!isJurisdictionCode(body.jurisdiction)) return jsonError("Unsupported jurisdiction", 400);
      data.jurisdiction = body.jurisdiction;
    }

    const contract = await db.contract.update({
      where: { id: params.id },
      data,
      select: { id: true, title: true, jurisdiction: true, contractType: true },
    });
    return NextResponse.json(contract);
  } catch (error) {
    console.error("PATCH /api/contracts/[id] error:", error);
    return jsonError("Failed to update contract", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { count } = await db.contract.deleteMany({
      where: { id: params.id, userId: user.id },
    });
    if (count === 0) return jsonError("Contract not found", 404);
    return NextResponse.json({ message: "Contract deleted" });
  } catch (error) {
    console.error("DELETE /api/contracts/[id] error:", error);
    return jsonError("Failed to delete contract", 500);
  }
}
