import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getSessionUser, jsonError, unauthorized } from "@/lib/api";
import { IngestError, ingestDocument } from "@/lib/ingest";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/file-types";
import { toJurisdictionCode } from "@/config/jurisdictions";

// Scanned documents are OCR'd during upload, which can take a while.
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10") || 10));
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "";

    const where: Prisma.ContractWhereInput = { userId: user.id };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { cleanedText: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;

    const [contracts, total] = await Promise.all([
      db.contract.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          jurisdiction: true,
          contractType: true,
          riskScore: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { clauses: true } },
        },
      }),
      db.contract.count({ where }),
    ]);

    return NextResponse.json({
      contracts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/contracts error:", error);
    return jsonError("Failed to fetch contracts", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const formData = await req.formData();
    const file = formData.get("file");
    const title = (formData.get("title") as string | null)?.trim();
    const contractType = (formData.get("contractType") as string | null)?.trim() || null;

    if (!(file instanceof File)) return jsonError("File is required", 400);
    if (!title) return jsonError("Title is required", 400);
    if (file.size === 0) return jsonError("The file is empty", 400);
    if (file.size > MAX_UPLOAD_BYTES) return jsonError(`File is larger than ${MAX_UPLOAD_LABEL}`, 400);

    const profile = await db.user.findUnique({
      where: { id: user.id },
      select: { jurisdiction: true },
    });
    const jurisdiction = toJurisdictionCode(
      formData.get("jurisdiction"),
      toJurisdictionCode(profile?.jurisdiction)
    );

    let document;
    try {
      document = await ingestDocument(Buffer.from(await file.arrayBuffer()), file.name);
    } catch (error) {
      if (error instanceof IngestError) return jsonError(error.message, 400);
      throw error;
    }

    const contract = await db.contract.create({
      data: {
        title: title.slice(0, 200),
        fileName: file.name,
        fileType: document.fileType,
        rawText: document.rawText,
        cleanedText: document.cleanedText,
        jurisdiction,
        contractType,
        status: "uploaded",
        userId: user.id,
        clauses: { createMany: { data: document.clauses } },
      },
      select: { id: true, title: true, _count: { select: { clauses: true } } },
    });

    return NextResponse.json({ ...contract, usedOcr: document.usedOcr }, { status: 201 });
  } catch (error) {
    console.error("POST /api/contracts error:", error);
    return jsonError("Failed to upload contract", 500);
  }
}
