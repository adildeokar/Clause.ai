import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getSessionUser, jsonError, unauthorized } from "@/lib/api";
import {
  debateSchedule,
  debateTurn,
  judgeDebate,
  type DebateTurn,
} from "@/ai/debate";

// Four agent turns and a verdict run one after another.
export const maxDuration = 60;

/** Clauses shorter than this (headings, signature lines) have nothing to argue about. */
const MIN_DEBATE_CHARS = 40;

type Params = { params: { id: string } };

function findClause(id: string, userId: string) {
  return db.clause.findFirst({
    where: { id, contract: { userId } },
    include: { contract: { select: { jurisdiction: true, contractType: true } } },
  });
}

/** The most recent debate for a clause, or null. */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const clause = await db.clause.findFirst({
      where: { id: params.id, contract: { userId: user.id } },
      select: { id: true },
    });
    if (!clause) return jsonError("Clause not found", 404);

    const debate = await db.clauseDebate.findFirst({
      where: { clauseId: clause.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ debate });
  } catch (error) {
    console.error("GET /api/clauses/[id]/debate error:", error);
    return jsonError("Failed to load the debate", 500);
  }
}

/**
 * Runs a new debate and streams it as newline-delimited JSON events:
 * {type:"start", steps}, then {type:"thinking", speaker} and {type:"turn", turn}
 * for each argument, then {type:"verdict", verdict, debate} or {type:"error", error}.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  let clause;
  try {
    clause = await findClause(params.id, user.id);
  } catch (error) {
    console.error("POST /api/clauses/[id]/debate lookup error:", error);
    return jsonError("Failed to start the debate", 500);
  }
  if (!clause) return jsonError("Clause not found", 404);
  if (clause.clauseText.trim().length < MIN_DEBATE_CHARS) {
    return jsonError("This clause is too short to debate.", 400);
  }

  const { jurisdiction, contractType } = clause.contract;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const send = (event: Record<string, unknown>) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          // The client went away; keep going so the debate is still saved.
          open = false;
        }
      };

      try {
        const schedule = debateSchedule();
        // Every agent turn plus the verdict.
        send({ type: "start", steps: schedule.length + 1 });

        const turns: DebateTurn[] = [];
        for (const { speaker, round } of schedule) {
          send({ type: "thinking", speaker, round });
          const turn = await debateTurn(speaker, round, clause, turns, jurisdiction, contractType);
          turns.push(turn);
          send({ type: "turn", turn });
        }

        send({ type: "thinking", speaker: "judge" });
        const verdict = await judgeDebate(clause, turns, jurisdiction, contractType);

        const debate = await db.clauseDebate.create({
          data: {
            clauseId: clause.id,
            userId: user.id,
            transcript: turns as unknown as Prisma.InputJsonValue,
            verdict: verdict as unknown as Prisma.InputJsonValue,
            challengerScore: verdict.challenger_score,
            defenderScore: verdict.defender_score,
            resilienceScore: verdict.resilience_score,
            winner: verdict.winner,
          },
        });
        send({ type: "verdict", verdict, debate });
      } catch (error) {
        console.error("POST /api/clauses/[id]/debate error:", error);
        send({ type: "error", error: "The debate could not be completed. Please try again." });
      } finally {
        if (open) {
          try {
            controller.close();
          } catch {
            // Already closed by the client.
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
