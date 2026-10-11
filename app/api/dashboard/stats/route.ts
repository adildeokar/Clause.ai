import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// TODO: Add rate limiting middleware

export const dynamic = "force-dynamic";
// TODO: Add caching for dashboard stats (e.g., Redis or in-memory with TTL)

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalContracts,
      contractScores,
      totalClauses,
      highRiskClauses,
      recentContracts,
      riskDistribution,
      activeContracts,
      highAlertContracts,
      expiringSoonContracts,
      pendingContracts,
    ] = await Promise.all([
      db.contract.count({ where: { userId } }),

      db.contract.aggregate({
        where: { userId, riskScore: { not: null } },
        _avg: { riskScore: true },
      }),

      db.clause.count({
        where: { contract: { userId } },
      }),

      db.clause.count({
        where: {
          contract: { userId },
          riskScore: { gte: 70 },
        },
      }),

      db.contract.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          status: true,
          jurisdiction: true,
          riskScore: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { clauses: true } },
        },
      }),

      Promise.all([
        db.contract.count({
          where: { userId, riskScore: { lt: 30 } },
        }),
        db.contract.count({
          where: { userId, riskScore: { gte: 30, lt: 50 } },
        }),
        db.contract.count({
          where: { userId, riskScore: { gte: 50, lt: 70 } },
        }),
        db.contract.count({
          where: { userId, riskScore: { gte: 70 } },
        }),
      ]),

      db.contract.count({
        where: { userId, status: "analyzed" },
      }),

      db.contract.count({
        where: { userId, riskScore: { gte: 70 } },
      }),

      db.contract.count({
        where: {
          userId,
          status: "analyzed",
          updatedAt: { lte: thirtyDaysAgo },
        },
      }),

      db.contract.count({
        where: {
          userId,
          status: { in: ["uploaded", "parsing"] },
        },
      }),
    ]);

    return NextResponse.json({
      totalContracts,
      avgRiskScore: contractScores._avg.riskScore ?? 0,
      totalClauses,
      highRiskClauses,
      recentContracts,
      activeContracts,
      highAlertContracts,
      expiringSoonContracts,
      pendingContracts,
      riskDistribution: {
        low: riskDistribution[0],
        medium: riskDistribution[1],
        high: riskDistribution[2],
        critical: riskDistribution[3],
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
