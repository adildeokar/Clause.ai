import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// TODO: Add rate limiting middleware
// TODO: Replace text-based search with vector embeddings for true semantic search

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const body = await req.json();

    const { query } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 }
      );
    }

    const searchTerm = query.trim();

    const [contracts, clauses] = await Promise.all([
      db.contract.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { cleanedText: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          title: true,
          status: true,
          jurisdiction: true,
          contractType: true,
          riskScore: true,
          createdAt: true,
          _count: { select: { clauses: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.clause.findMany({
        where: {
          contract: { userId },
          clauseText: { contains: searchTerm, mode: "insensitive" },
        },
        select: {
          id: true,
          clauseNumber: true,
          clauseTitle: true,
          clauseText: true,
          category: true,
          riskScore: true,
          contract: {
            select: { id: true, title: true },
          },
        },
        take: 50,
      }),
    ]);

    return NextResponse.json({
      contracts,
      clauses: clauses.map((c) => ({
        ...c,
        clauseText:
          c.clauseText.length > 500
            ? c.clauseText.slice(0, 500) + "..."
            : c.clauseText,
      })),
      totalContracts: contracts.length,
      totalClauses: clauses.length,
    });
  } catch (error) {
    console.error("POST /api/search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
