"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Gavel,
  Loader2,
  RotateCcw,
  Shield,
  Swords,
} from "lucide-react";

import type { DebateSpeaker, DebateTurn, DebateVerdict, DebateWinner } from "@/ai/debate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn, formatDate, getStrengthLevel } from "@/lib/utils";

export interface DebateClauseInfo {
  id: string;
  clauseNumber: number;
  clauseTitle: string | null;
  clauseText: string;
}

interface SavedDebate {
  transcript: DebateTurn[];
  verdict: DebateVerdict;
  createdAt: string;
}

type Phase = "loading" | "running" | "done" | "error";
type Thinking = DebateSpeaker | "judge" | null;

const SIDES = {
  challenger: {
    label: "Challenger",
    role: "Opposing counsel",
    icon: Swords,
    color: "#E5484D",
    bubble: "border-[#F5C2C4] bg-[#FDF3F3]",
    thinking: "is preparing an attack…",
  },
  defender: {
    label: "Defender",
    role: "Drafting counsel",
    icon: Shield,
    color: "#006A3B",
    bubble: "border-[#CCE1D8] bg-[#F2F8F5]",
    thinking: "is preparing a defence…",
  },
} as const;

const WINNER_LABEL: Record<DebateWinner, string> = {
  challenger: "The Challenger broke the clause",
  defender: "The Defender held the clause",
  draw: "Too close to call",
};

const LEVEL_COLOR = { low: "#22c55e", medium: "#eab308", high: "#f97316", critical: "#ef4444" };

/** Parses a newline-delimited JSON response as it streams in. */
async function* readEvents(res: Response): AsyncGenerator<any> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline: number;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line) yield JSON.parse(line);
    }
  }
  if (buffer.trim()) yield JSON.parse(buffer);
}

function TurnBubble({ turn }: { turn: DebateTurn }) {
  const side = SIDES[turn.speaker];
  const Icon = side.icon;
  const right = turn.speaker === "defender";
  return (
    <div className={cn("flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300", right && "flex-row-reverse")}>
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: side.color }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className={cn("max-w-[85%] rounded-xl border px-4 py-3", side.bubble)}>
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: side.color }}>
          {side.label} · Round {turn.round}
        </p>
        <p className="mt-1 text-sm font-semibold text-[#282828]">{turn.headline}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#4B4B4B]">{turn.argument}</p>
      </div>
    </div>
  );
}

function ThinkingBubble({ who }: { who: Exclude<Thinking, null> }) {
  const isJudge = who === "judge";
  const color = isJudge ? "#282828" : SIDES[who].color;
  const Icon = isJudge ? Gavel : SIDES[who].icon;
  return (
    <div className={cn("flex items-center gap-3", who === "defender" && "flex-row-reverse", isJudge && "justify-center")}>
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: color }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex items-center gap-2 rounded-xl border border-[#E8E8E8] bg-white px-4 py-2.5 text-sm text-[#868686]">
        <span className="flex gap-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="h-1.5 w-1.5 animate-bounce rounded-full"
              style={{ backgroundColor: color, animationDelay: `${delay}ms` }}
            />
          ))}
        </span>
        {isJudge ? "The judge is deliberating…" : `${SIDES[who].label} ${SIDES[who].thinking}`}
      </span>
    </div>
  );
}

function Scoreboard({ verdict }: { verdict: DebateVerdict }) {
  const total = verdict.challenger_score + verdict.defender_score || 1;
  const challengerShare = (verdict.challenger_score / total) * 100;
  const resilienceColor = LEVEL_COLOR[getStrengthLevel(verdict.resilience_score)];
  return (
    <div className="rounded-xl border border-[#E8E8E8] bg-white p-5">
      <div className="flex flex-col items-center text-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#868686]">Clause resilience</span>
        <span className="mt-1 text-5xl font-semibold tabular-nums" style={{ color: resilienceColor }}>
          {verdict.resilience_score}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[#282828]">
          <Gavel className="h-4 w-4" />
          {WINNER_LABEL[verdict.winner]}
        </span>
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex justify-between text-xs font-medium">
          <span style={{ color: SIDES.challenger.color }}>Challenger {verdict.challenger_score}</span>
          <span style={{ color: SIDES.defender.color }}>Defender {verdict.defender_score}</span>
        </div>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-[#F4F7F6]">
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${challengerShare}%`, backgroundColor: SIDES.challenger.color }}
          />
          <div className="h-full flex-1" style={{ backgroundColor: SIDES.defender.color }} />
        </div>
      </div>

      {verdict.rounds.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {verdict.rounds.map((r) => (
            <Badge key={r.round} variant="secondary" className="font-medium">
              Round {r.round}:{" "}
              {r.winner === "draw" ? "draw" : SIDES[r.winner].label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function ClauseDebateDialog({
  clause,
  open,
  onOpenChange,
  onDebated,
  onRevisionApplied,
}: {
  clause: DebateClauseInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a new debate is saved, so the clause score can refresh. */
  onDebated: () => void;
  /** Called after the judge's revision replaced the clause text. */
  onRevisionApplied: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [turns, setTurns] = useState<DebateTurn[]>([]);
  const [thinking, setThinking] = useState<Thinking>(null);
  const [verdict, setVerdict] = useState<DebateVerdict | null>(null);
  const [debatedAt, setDebatedAt] = useState<string | null>(null);
  const [steps, setSteps] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [showClause, setShowClause] = useState(false);
  const [applyState, setApplyState] = useState<"idle" | "saving" | "applied" | "failed">("idle");
  const loadedRef = useRef(false);
  const runningRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const runDebate = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setPhase("running");
    setTurns([]);
    setVerdict(null);
    setError(null);
    setApplyState("idle");
    setThinking("challenger");
    try {
      const res = await fetch(`/api/clauses/${clause.id}/debate`, { method: "POST" });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "The debate could not be started.");
      }
      let finished = false;
      for await (const event of readEvents(res)) {
        if (event.type === "start") setSteps(event.steps);
        else if (event.type === "thinking") setThinking(event.speaker);
        else if (event.type === "turn") setTurns((prev) => [...prev, event.turn]);
        else if (event.type === "verdict") {
          setVerdict(event.verdict);
          setDebatedAt(event.debate.createdAt);
          finished = true;
        } else if (event.type === "error") throw new Error(event.error);
      }
      if (!finished) throw new Error("The debate was interrupted. Please try again.");
      setPhase("done");
      // The scoreboard appears above the transcript; bring it into view.
      requestAnimationFrame(() => bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" }));
      onDebated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The debate could not be completed.");
      setPhase("error");
    } finally {
      setThinking(null);
      runningRef.current = false;
    }
  }, [clause.id, onDebated]);

  // On first open, show the last debate; if there is none, start one.
  useEffect(() => {
    if (!open || loadedRef.current) return;
    loadedRef.current = true;
    (async () => {
      try {
        const res = await fetch(`/api/clauses/${clause.id}/debate`);
        if (!res.ok) throw new Error();
        const { debate } = (await res.json()) as { debate: SavedDebate | null };
        if (debate) {
          setTurns(debate.transcript);
          setVerdict(debate.verdict);
          setDebatedAt(debate.createdAt);
          setPhase("done");
          return;
        }
      } catch {
        // Fall through and run a fresh debate.
      }
      runDebate();
    })();
  }, [open, clause.id, runDebate]);

  // Text edits elsewhere clear saved debates, so the next open starts over.
  useEffect(() => {
    if (!runningRef.current) loadedRef.current = false;
  }, [clause.clauseText]);

  useEffect(() => {
    if (phase === "running") bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, thinking, phase]);

  async function applyRevision() {
    if (!verdict?.recommended_revision) return;
    setApplyState("saving");
    try {
      const res = await fetch(`/api/clauses/${clause.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clauseText: verdict.recommended_revision,
          changeReason: "Break My Clause — judge's recommended revision",
        }),
      });
      if (!res.ok) throw new Error();
      setApplyState("applied");
      onRevisionApplied();
    } catch {
      setApplyState("failed");
    }
  }

  const running = phase === "running";
  const progress = Math.min(100, Math.round(((turns.length + (verdict ? 1 : 0)) / steps) * 100));
  const rounds = Array.from(new Set(turns.map((t) => t.round)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] max-w-3xl flex-col gap-0 overflow-hidden bg-white p-0 sm:rounded-xl">
        {/* Header */}
        <div className="border-b border-[#E8E8E8] px-6 pb-4 pt-5">
          <div className="flex items-center gap-2 pr-8">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FDF3F3] text-[#E5484D]">
              <Swords className="h-4 w-4" />
            </span>
            <DialogTitle className="text-lg font-semibold text-[#282828]">Break My Clause</DialogTitle>
          </div>
          <DialogDescription className="mt-1.5 text-sm text-[#868686]">
            Two AI counsel argue over{" "}
            <span className="font-medium text-[#282828]">
              Clause {clause.clauseNumber}
              {clause.clauseTitle ? ` — ${clause.clauseTitle}` : ""}
            </span>
            . A judge scores who prevails and gives the clause its resilience score.
          </DialogDescription>
          <button
            type="button"
            onClick={() => setShowClause((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#006A3B] hover:underline"
          >
            {showClause ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showClause ? "Hide clause text" : "Show clause text"}
          </button>
          {showClause && (
            <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-[#F4F7F6] p-3 text-xs leading-relaxed text-[#4B4B4B]">
              {clause.clauseText}
            </p>
          )}
          {running && (
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#F4F7F6]">
              <div className="h-full bg-[#006A3B] transition-all duration-500" style={{ width: `${Math.max(progress, 4)}%` }} />
            </div>
          )}
        </div>

        {/* Body */}
        <div ref={bodyRef} className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {phase === "loading" && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#868686]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          )}

          {verdict && !running && <Scoreboard verdict={verdict} />}

          {rounds.map((round) => (
            <div key={round} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-[#E8E8E8]" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#868686]">Round {round}</span>
                <span className="h-px flex-1 bg-[#E8E8E8]" />
              </div>
              {turns
                .filter((t) => t.round === round)
                .map((turn, i) => (
                  <TurnBubble key={`${turn.speaker}-${round}-${i}`} turn={turn} />
                ))}
            </div>
          ))}

          {thinking && <ThinkingBubble who={thinking} />}

          {verdict && (
            <div className="space-y-4 rounded-xl border border-[#E8E8E8] bg-[#FAFAFA] p-5">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-[#282828]">
                <Gavel className="h-4 w-4" /> Judge&apos;s verdict
              </h4>
              {verdict.decisive_point && (
                <p className="text-sm font-medium text-[#282828]">{verdict.decisive_point}</p>
              )}
              {verdict.reasoning && <p className="text-sm leading-relaxed text-[#4B4B4B]">{verdict.reasoning}</p>}
              {verdict.vulnerabilities.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#E5484D]">
                    Vulnerabilities exposed
                  </p>
                  <ul className="space-y-1">
                    {verdict.vulnerabilities.map((v, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#4B4B4B]">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E5484D]" />
                        {v}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {verdict.recommended_revision && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#006A3B]">
                    Recommended revision
                  </p>
                  <p className="whitespace-pre-wrap rounded-lg border border-[#CCE1D8] bg-[#F2F8F5] p-3 text-sm leading-relaxed text-[#282828]">
                    {verdict.recommended_revision}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <Button
                      size="sm"
                      className="gap-1.5 bg-[#006A3B] text-xs hover:bg-[#005a32]"
                      disabled={applyState === "saving" || applyState === "applied"}
                      onClick={applyRevision}
                    >
                      {applyState === "saving" ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      {applyState === "applied" ? "Applied to the clause" : "Apply revision"}
                    </Button>
                    {applyState === "applied" && (
                      <span className="text-xs text-[#868686]">
                        Saved as a new version. Run a new debate to test it.
                      </span>
                    )}
                    {applyState === "failed" && (
                      <span className="text-xs text-red-600">Could not apply the revision. Try again.</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {phase === "error" && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-[#E8E8E8] px-6 py-3">
          <span className="text-xs text-[#868686]">
            {running
              ? "The debate keeps running if you close this window."
              : debatedAt
                ? `Debated ${formatDate(debatedAt)}`
                : ""}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-[#DDDDDD] text-xs"
            disabled={running || phase === "loading"}
            onClick={runDebate}
          >
            {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            {running ? "Debating…" : phase === "error" ? "Try again" : "Run a new debate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
