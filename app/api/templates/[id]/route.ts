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

    const template = await db.template.findFirst({ where: { id: params.id, isActive: true } });
    if (!template) return jsonError("Template not found", 404);
    return NextResponse.json(template);
  } catch (error) {
    console.error("GET /api/templates/[id] error:", error);
    return jsonError("Failed to fetch template", 500);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== "admin") return jsonError("Forbidden", 403);

    const body = await readJson(req);
    const data: Prisma.TemplateUpdateInput = {};
    for (const field of ["name", "description", "category", "content"] as const) {
      if (typeof body[field] === "string") data[field] = body[field];
    }
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (Array.isArray(body.fields)) data.fields = body.fields;
    if (body.jurisdiction !== undefined) {
      if (!isJurisdictionCode(body.jurisdiction)) return jsonError("Unsupported jurisdiction", 400);
      data.jurisdiction = body.jurisdiction;
    }

    const template = await db.template.update({ where: { id: params.id }, data }).catch(() => null);
    if (!template) return jsonError("Template not found", 404);
    return NextResponse.json(template);
  } catch (error) {
    console.error("PUT /api/templates/[id] error:", error);
    return jsonError("Failed to update template", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== "admin") return jsonError("Forbidden", 403);

    const { count } = await db.template.deleteMany({ where: { id: params.id } });
    if (count === 0) return jsonError("Template not found", 404);
    return NextResponse.json({ message: "Template deleted" });
  } catch (error) {
    console.error("DELETE /api/templates/[id] error:", error);
    return jsonError("Failed to delete template", 500);
  }
}
