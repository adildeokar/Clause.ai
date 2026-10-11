import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseDocument, SUPPORTED_FILE_TYPES } from "@/lib/parsing";

// TODO: Add rate limiting middleware

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { cleanedText: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [contracts, total] = await Promise.all([
      db.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { clauses: true } },
        },
      }),
      db.contract.count({ where }),
    ]);

    return NextResponse.json({
      contracts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/contracts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch contracts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const jurisdiction = (formData.get("jurisdiction") as string) || "US";
    const contractType = formData.get("contractType") as string | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    const fileExtension = (file.name.split(".").pop() || "").toLowerCase();
    if (!(SUPPORTED_FILE_TYPES as readonly string[]).includes(fileExtension)) {
      return NextResponse.json(
        {
          error: `Unsupported file type. Supported: ${SUPPORTED_FILE_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let parsed;
    try {
      parsed = await parseDocument(buffer, fileExtension);
    } catch (error) {
      console.error("POST /api/contracts parse error:", error);
      return NextResponse.json(
        { error: "Could not read this file. It may be corrupted or password-protected." },
        { status: 400 }
      );
    }

    if (!parsed.cleanedText.trim()) {
      return NextResponse.json(
        {
          error:
            "No text could be extracted from this file. Scanned/image-only PDFs are not supported.",
        },
        { status: 400 }
      );
    }

    const contract = await db.contract.create({
      data: {
        title,
        fileName: file.name,
        fileType: fileExtension,
        rawText: parsed.rawText,
        cleanedText: parsed.cleanedText,
        jurisdiction,
        contractType,
        status: "uploaded",
        userId,
        clauses: {
          create: parsed.clauses.map((clause) => ({
            clauseNumber: clause.clauseNumber,
            clauseTitle: clause.clauseTitle,
            clauseText: clause.clauseText,
            category: clause.category,
          })),
        },
      },
      include: {
        clauses: true,
        _count: { select: { clauses: true } },
      },
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error("POST /api/contracts error:", error);
    return NextResponse.json(
      { error: "Failed to create contract" },
      { status: 500 }
    );
  }
}
