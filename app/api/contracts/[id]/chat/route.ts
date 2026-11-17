import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getSessionUser, jsonError, readJson, unauthorized } from "@/lib/api";
import {
  HISTORY_MESSAGES,
  MAX_QUESTION_CHARS,
  buildContext,
  buildMessages,
  streamAnswer,
  type ChatTurn,
} from "@/ai/chat";

// The first question on a long document also embeds all of its clauses.
export const maxDuration = 60;

/** Messages returned when the chat is opened. */
const HISTORY_LIMIT = 100;

type Params = { params: { id: string } };

async function ownsContract(contractId: string, userId: string) {
  const contract = await db.contract.findFirst({
    where: { id: contractId, userId },
    select: { id: true },
  });
  return contract !== null;
}

/** The conversation so far, oldest first. */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!(await ownsContract(params.id, user.id))) return jsonError("Contract not found", 404);

    const latest = await db.chatMessage.findMany({
      where: { contractId: params.id, userId: user.id },
      orderBy: { createdAt: "desc" },
      take: HISTORY_LIMIT,
      select: { id: true, role: true, content: true, createdAt: true },
    });
    return NextResponse.json({ messages: latest.reverse() });
  } catch (error) {
    console.error("GET /api/contracts/[id]/chat error:", error);
    return jsonError("Failed to load the conversation", 500);
  }
}

/** Clears the conversation. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!(await ownsContract(params.id, user.id))) return jsonError("Contract not found", 404);

    await db.chatMessage.deleteMany({ where: { contractId: params.id, userId: user.id } });
    return NextResponse.json({ message: "Conversation cleared" });
  } catch (error) {
    console.error("DELETE /api/contracts/[id]/chat error:", error);
    return jsonError("Failed to clear the conversation", 500);
  }
}

/** Answers a question about the document, streaming the answer as plain text. */
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const body = await readJson(req);
  const question = typeof body.message === "string" ? body.message.trim() : "";
  if (!question) return jsonError("message is required", 400);
  if (question.length > MAX_QUESTION_CHARS) {
    return jsonError(`Questions are limited to ${MAX_QUESTION_CHARS} characters.`, 400);
  }

  const askedAt = new Date();
  let completion: Awaited<ReturnType<typeof streamAnswer>>;
  try {
    const contract = await db.contract.findFirst({
      where: { id: params.id, userId: user.id },
      select: {
        title: true,
        contractType: true,
        summary: true,
        cleanedText: true,
        jurisdiction: true,
        clauses: {
          orderBy: { clauseNumber: "asc" },
          select: { id: true, clauseNumber: true, clauseTitle: true, clauseText: true },
        },
      },
    });
    if (!contract) return jsonError("Contract not found", 404);

    const [recent, profile] = await Promise.all([
      db.chatMessage.findMany({
        where: { contractId: params.id, userId: user.id },
        orderBy: { createdAt: "desc" },
        take: HISTORY_MESSAGES,
        select: { role: true, content: true },
      }),
      db.riskProfile.findUnique({ where: { userId: user.id }, select: { voiceProfile: true } }),
    ]);
    const history = recent
      .reverse()
      .filter((m): m is ChatTurn => m.role === "user" || m.role === "assistant");
    const previousQuestion = [...history].reverse().find((m) => m.role === "user")?.content;

    const context = await buildContext(contract, question, previousQuestion);
    completion = await streamAnswer(
      buildMessages(contract, context, history, question, contract.jurisdiction, profile?.voiceProfile)
    );
  } catch (error) {
    console.error("POST /api/contracts/[id]/chat error:", error);
    return jsonError("The assistant is unavailable right now. Please try again.", 500);
  }

  const encoder = new TextEncoder();
  let answer = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let failure: unknown = null;
      try {
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content;
          if (!delta) continue;
          answer += delta;
          controller.enqueue(encoder.encode(delta));
        }
      } catch (error) {
        // An abort from the client also lands here; whatever was answered is still saved.
        if (!completion.controller.signal.aborted) {
          console.error("POST /api/contracts/[id]/chat stream error:", error);
          failure = error;
        }
      }

      // Saved before the stream ends: a follow-up question must find this exchange in the
      // history, and a serverless function may be frozen once the response is complete.
      answer = answer.trim();
      if (answer) {
        await db.chatMessage
          .createMany({
            data: [
              { contractId: params.id, userId: user.id, role: "user", content: question, createdAt: askedAt },
              { contractId: params.id, userId: user.id, role: "assistant", content: answer },
            ],
          })
          .catch((error) => console.error("Failed to save chat messages:", error));
      }

      try {
        if (failure) controller.error(failure);
        else controller.close();
      } catch {
        // The client already went away.
      }
    },
    cancel() {
      completion.controller.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
