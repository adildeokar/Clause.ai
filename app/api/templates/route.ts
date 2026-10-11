import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getSessionUser, jsonError, readJson, unauthorized } from "@/lib/api";
import { toJurisdictionCode } from "@/config/jurisdictions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const templates = await db.template.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        jurisdiction: true,
        content: true,
        fields: true,
        createdAt: true,
      },
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error("GET /api/templates error:", error);
    return jsonError("Failed to fetch templates", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== "admin") return jsonError("Forbidden", 403);

    const { name, description, category, jurisdiction, content, fields } = await readJson(req);
    if (!name || !category || !content) {
      return jsonError("name, category, and content are required", 400);
    }

    const template = await db.template.create({
      data: {
        name,
        description: description || null,
        category,
        jurisdiction: toJurisdictionCode(jurisdiction),
        content,
        fields: Array.isArray(fields) ? (fields as Prisma.InputJsonValue) : undefined,
      },
    });
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("POST /api/templates error:", error);
    return jsonError("Failed to create template", 500);
  }
}
