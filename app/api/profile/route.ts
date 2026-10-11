import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getSessionUser, jsonError, readJson, unauthorized } from "@/lib/api";
import { isJurisdictionCode } from "@/config/jurisdictions";

export const dynamic = "force-dynamic";

const RISK_TOLERANCES = ["conservative", "moderate", "aggressive"];
const VOICE_PROFILES = ["corporate", "concise", "educational"];

async function loadProfile(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      role: true,
      jurisdiction: true,
      riskProfile: {
        select: { riskTolerance: true, preferredClauses: true, voiceProfile: true },
      },
    },
  });
  if (!user) return null;
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    jurisdiction: user.jurisdiction,
    riskProfile: {
      riskTolerance: user.riskProfile?.riskTolerance ?? "moderate",
      preferredClauses: Array.isArray(user.riskProfile?.preferredClauses)
        ? user.riskProfile.preferredClauses
        : [],
      voiceProfile: VOICE_PROFILES.includes(user.riskProfile?.voiceProfile ?? "")
        ? user.riskProfile!.voiceProfile
        : "concise",
    },
  };
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const profile = await loadProfile(user.id);
    if (!profile) return unauthorized();
    return NextResponse.json(profile);
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return jsonError("Failed to load profile", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = await readJson(req);
    const data: Prisma.UserUpdateInput = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) return jsonError("Name cannot be empty", 400);
      data.name = body.name.trim().slice(0, 100);
    }
    if (body.jurisdiction !== undefined) {
      if (!isJurisdictionCode(body.jurisdiction)) return jsonError("Unsupported jurisdiction", 400);
      data.jurisdiction = body.jurisdiction;
    }

    if (body.riskProfile && typeof body.riskProfile === "object") {
      const { riskTolerance, preferredClauses, voiceProfile } = body.riskProfile;
      const risk: Prisma.RiskProfileUpdateInput = {};
      if (RISK_TOLERANCES.includes(riskTolerance)) risk.riskTolerance = riskTolerance;
      if (VOICE_PROFILES.includes(voiceProfile)) risk.voiceProfile = voiceProfile;
      if (Array.isArray(preferredClauses)) {
        risk.preferredClauses = preferredClauses
          .filter((c: unknown) => typeof c === "string")
          .slice(0, 20);
      }
      data.riskProfile = {
        upsert: {
          create: risk as Prisma.RiskProfileCreateWithoutUserInput,
          update: risk,
        },
      };
    }

    await db.user.update({ where: { id: user.id }, data });
    return NextResponse.json(await loadProfile(user.id));
  } catch (error) {
    console.error("PATCH /api/profile error:", error);
    return jsonError("Failed to update profile", 500);
  }
}
