import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getSessionUser, jsonError, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Risk score (0–100) at or above which a contract counts as a high alert. */
const HIGH_ALERT_RISK = 70;

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const userId = user.id;

    const [totalContracts, activeContracts, highAlertContracts, pendingContracts, recentContracts] =
      await Promise.all([
        db.contract.count({ where: { userId } }),
        db.contract.count({ where: { userId, status: "analyzed" } }),
        db.contract.count({ where: { userId, riskScore: { gte: HIGH_ALERT_RISK } } }),
        db.contract.count({ where: { userId, status: { in: ["uploaded", "parsing"] } } }),
        db.contract.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 10,
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
      ]);

    return NextResponse.json({
      totalContracts,
      activeContracts,
      highAlertContracts,
      pendingContracts,
      recentContracts,
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return jsonError("Failed to fetch dashboard stats", 500);
  }
}
