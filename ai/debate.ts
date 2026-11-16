import { CLAUSE_CHARS, callAI, list, str, strList, toScore, truncate } from "./analysis";
import { SYSTEM_PROMPTS } from "./prompts";

/**
 * "Break My Clause": a Challenger agent tries to break a clause, a Defender
 * agent defends it, and a Judge agent scores both sides. Each agent sees the
 * clause and the full transcript so far, so every turn answers the last one.
 */

export type DebateSpeaker = "challenger" | "defender";
export type DebateWinner = DebateSpeaker | "draw";

export interface DebateTurn {
  speaker: DebateSpeaker;
  round: number;
  headline: string;
  argument: string;
}

export interface DebateVerdict {
  challenger_score: number;
  defender_score: number;
  /** 0–100, how well the clause survived the debate (100 = unbreakable). */
  resilience_score: number;
  winner: DebateWinner;
  rounds: { round: number; winner: DebateWinner }[];
  decisive_point: string;
  reasoning: string;
  vulnerabilities: string[];
  recommended_revision: string;
}

export interface DebateClause {
  clauseNumber: number;
  clauseTitle: string | null;
  clauseText: string;
}

export const DEBATE_ROUNDS = 2;

/** Agents argue with some variety; the judge decides deterministically. */
const AGENT_TEMPERATURE = 0.6;
const JUDGE_TEMPERATURE = 0;
/** A score gap smaller than this is a draw. */
const DRAW_MARGIN = 5;

/** One bad response (invalid JSON, a timeout) should not throw away the debate so far. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i >= attempts) throw error;
      console.warn(`Debate step failed (attempt ${i}), retrying:`, error);
    }
  }
}

const SPEAKER_LABEL: Record<DebateSpeaker, string> = {
  challenger: "CHALLENGER",
  defender: "DEFENDER",
};

/** The order of turns: each round is an attack followed by a defence. */
export function debateSchedule(): { speaker: DebateSpeaker; round: number }[] {
  return Array.from({ length: DEBATE_ROUNDS }, (_, i) => [
    { speaker: "challenger" as const, round: i + 1 },
    { speaker: "defender" as const, round: i + 1 },
  ]).flat();
}

function clauseBlock(clause: DebateClause, contractType?: string | null) {
  const heading = `Clause ${clause.clauseNumber}${clause.clauseTitle ? ` — ${clause.clauseTitle}` : ""}`;
  return `Contract type: ${contractType || "contract"}\n### ${heading}\n${truncate(clause.clauseText, CLAUSE_CHARS)}`;
}

function transcriptBlock(turns: DebateTurn[]) {
  if (turns.length === 0) return "";
  return `\n\nDebate so far:\n${turns
    .map((t) => `[Round ${t.round}] ${SPEAKER_LABEL[t.speaker]}: ${t.headline}\n${t.argument}`)
    .join("\n\n")}`;
}

function turnInstruction(speaker: DebateSpeaker, round: number) {
  const last = round === DEBATE_ROUNDS;
  if (speaker === "challenger") {
    return round === 1
      ? "Your turn: open with the strongest attacks on this clause."
      : "Your turn: rebut the Defender and press the weakest point of their defence.";
  }
  return last
    ? "Your turn: closing defence. Answer the Challenger's latest points and sum up why the clause holds."
    : "Your turn: rebut the Challenger's attacks point by point.";
}

/** Runs one agent turn. */
export async function debateTurn(
  speaker: DebateSpeaker,
  round: number,
  clause: DebateClause,
  previous: DebateTurn[],
  jurisdiction: string,
  contractType?: string | null
): Promise<DebateTurn> {
  const prompt =
    speaker === "challenger"
      ? SYSTEM_PROMPTS.debateChallenger(jurisdiction)
      : SYSTEM_PROMPTS.debateDefender(jurisdiction);
  return withRetry(async () => {
    const raw = await callAI<any>(
      prompt,
      `${clauseBlock(clause, contractType)}${transcriptBlock(previous)}\n\n${turnInstruction(speaker, round)}`,
      450,
      AGENT_TEMPERATURE
    );
    const argument = str(raw?.argument);
    if (!argument) throw new Error(`The ${speaker} returned an empty argument`);
    return { speaker, round, headline: str(raw?.headline) || "Argument", argument };
  });
}

const WINNERS: DebateWinner[] = ["challenger", "defender", "draw"];

/**
 * The resilience score and the winner are derived from the judge's two scores
 * rather than taken from the model, so the verdict is always self-consistent.
 */
export function scoreDebate(challengerScore: number, defenderScore: number) {
  const resilience = Math.round(Math.min(100, Math.max(0, 50 + (defenderScore - challengerScore) / 2)));
  const gap = defenderScore - challengerScore;
  const winner: DebateWinner =
    Math.abs(gap) < DRAW_MARGIN ? "draw" : gap > 0 ? "defender" : "challenger";
  return { resilience, winner };
}

export async function judgeDebate(
  clause: DebateClause,
  turns: DebateTurn[],
  jurisdiction: string,
  contractType?: string | null
): Promise<DebateVerdict> {
  const { raw, challenger, defender } = await withRetry(async () => {
    const raw = await callAI<any>(
      SYSTEM_PROMPTS.debateJudge(jurisdiction),
      `${clauseBlock(clause, contractType)}${transcriptBlock(turns)}\n\nThe debate is over. Deliver your verdict.`,
      900,
      JUDGE_TEMPERATURE
    );
    const challenger = toScore(raw?.challenger_score);
    const defender = toScore(raw?.defender_score);
    if (challenger === null || defender === null) throw new Error("The judge returned no scores");
    return { raw, challenger, defender };
  });
  const { resilience, winner } = scoreDebate(challenger, defender);

  const rounds = list(raw?.rounds)
    .map((r) => ({
      round: Number(r?.round),
      winner: WINNERS.includes(r?.winner) ? (r.winner as DebateWinner) : "draw",
    }))
    .filter((r) => Number.isInteger(r.round) && r.round >= 1 && r.round <= DEBATE_ROUNDS)
    .slice(0, DEBATE_ROUNDS);

  return {
    challenger_score: challenger,
    defender_score: defender,
    resilience_score: resilience,
    winner,
    rounds,
    decisive_point: str(raw?.decisive_point),
    reasoning: str(raw?.reasoning),
    vulnerabilities: strList(raw?.vulnerabilities).slice(0, 3),
    recommended_revision: str(raw?.recommended_revision),
  };
}
