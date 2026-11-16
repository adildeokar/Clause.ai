"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  MessagesSquare,
  SendHorizontal,
  Sparkles,
  Square,
  Trash2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  error?: string;
}

export interface ChatClauseRef {
  clauseNumber: number;
  clauseTitle: string | null;
}

const SUGGESTIONS = [
  "Summarize this document in plain English",
  "What are my main obligations?",
  "How can this agreement be terminated?",
  "What are the payment terms?",
  "Are there any penalties or limits on liability?",
];

const MAX_QUESTION_CHARS = 2000;

// ─── Answer rendering ────────────────────────────────────────────────────────

const INLINE = /(\*\*[^*\n]+\*\*|\[(?:clauses?|cláusulas?|clausulas?|articles?|artigos?)\s[^\]\n]*\d[^\]\n]*\])/giu;

function Citation({
  text,
  clauses,
  onCite,
}: {
  text: string;
  clauses: Map<number, ChatClauseRef>;
  onCite: (clauseNumber: number) => void;
}) {
  const numbers = Array.from(text.matchAll(/\d+/g), (m) => Number(m[0])).filter((n) => clauses.has(n));
  if (numbers.length === 0) return <>{text}</>;
  return (
    <>
      {numbers.map((n) => {
        const clause = clauses.get(n)!;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onCite(n)}
            title={clause.clauseTitle ? `Clause ${n} — ${clause.clauseTitle}` : `Clause ${n}`}
            className="mx-0.5 inline-flex items-center rounded-md border border-[#CCE1D8] bg-[#F2F8F5] px-1.5 py-px align-baseline text-[11px] font-semibold text-[#006A3B] transition-colors hover:bg-[#E5F0EB]"
          >
            Clause {n}
          </button>
        );
      })}
    </>
  );
}

function Inline({
  text,
  clauses,
  onCite,
}: {
  text: string;
  clauses: Map<number, ChatClauseRef>;
  onCite: (clauseNumber: number) => void;
}) {
  const parts = text.split(INLINE);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
        if (part.startsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-[#282828]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <Citation key={i} text={part} clauses={clauses} onCite={onCite} />;
      })}
    </>
  );
}

/** Renders the small subset of Markdown the assistant is asked to use. */
function RichText({
  text,
  clauses,
  onCite,
}: {
  text: string;
  clauses: Map<number, ChatClauseRef>;
  onCite: (clauseNumber: number) => void;
}) {
  const blocks: { kind: "p" | "ul" | "ol"; lines: string[] }[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) {
      blocks.push({ kind: "p", lines: [] });
      continue;
    }
    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    const kind = bullet ? "ul" : numbered ? "ol" : "p";
    const content = bullet?.[1] ?? numbered?.[1] ?? line.replace(/^#+\s*/, "");
    const last = blocks[blocks.length - 1];
    if (last && last.kind === kind && (kind !== "p" || last.lines.length > 0)) last.lines.push(content);
    else blocks.push({ kind, lines: [content] });
  }

  return (
    <div className="space-y-2">
      {blocks
        .filter((b) => b.lines.length > 0)
        .map((block, i) => {
          if (block.kind === "p") {
            return (
              <p key={i}>
                {block.lines.map((line, j) => (
                  <Fragment key={j}>
                    {j > 0 && <br />}
                    <Inline text={line} clauses={clauses} onCite={onCite} />
                  </Fragment>
                ))}
              </p>
            );
          }
          const List = block.kind;
          return (
            <List key={i} className={cn("space-y-1 pl-5", List === "ul" ? "list-disc" : "list-decimal")}>
              {block.lines.map((line, j) => (
                <li key={j}>
                  <Inline text={line} clauses={clauses} onCite={onCite} />
                </li>
              ))}
            </List>
          );
        })}
    </div>
  );
}

// ─── Panel ───────────────────────────────────────────────────────────────────

export function DocumentChat({
  contractId,
  clauses,
  open,
  onClose,
  onCiteClause,
}: {
  contractId: string;
  clauses: ChatClauseRef[];
  open: boolean;
  onClose: () => void;
  onCiteClause: (clauseNumber: number) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyState, setHistoryState] = useState<"idle" | "loading" | "loaded" | "failed">("idle");
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const clauseMap = useMemo(() => new Map(clauses.map((c) => [c.clauseNumber, c])), [clauses]);

  const loadHistory = useCallback(async () => {
    setHistoryState("loading");
    try {
      const res = await fetch(`/api/contracts/${contractId}/chat`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(
        (data.messages as { id: string; role: Message["role"]; content: string }[]).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }))
      );
      setHistoryState("loaded");
    } catch {
      setHistoryState("failed");
    }
  }, [contractId]);

  useEffect(() => {
    if (open && historyState === "idle") loadHistory();
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open, historyState, loadHistory]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Stop an answer in flight when the page goes away.
  useEffect(() => () => abortRef.current?.abort(), []);

  function resizeInput() {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  async function send(text: string) {
    const question = text.trim().slice(0, MAX_QUESTION_CHARS);
    if (!question || streaming) return;

    const assistantId = `a-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: question },
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);
    setInput("");
    requestAnimationFrame(resizeInput);
    setStreaming(true);

    const update = (patch: Partial<Message>) =>
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)));

    const controller = new AbortController();
    abortRef.current = controller;
    let answer = "";
    try {
      const res = await fetch(`/api/contracts/${contractId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "The assistant is unavailable right now. Please try again.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        update({ content: answer });
      }
      answer += decoder.decode();
      if (!answer.trim()) throw new Error("No answer was returned. Please try again.");
      update({ content: answer, streaming: false });
    } catch (err) {
      if (controller.signal.aborted) {
        update({ content: answer || "Stopped.", streaming: false });
      } else {
        update({
          streaming: false,
          error: answer
            ? "The answer was cut off. Please try again."
            : err instanceof Error
              ? err.message
              : "Something went wrong. Please try again.",
        });
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
    }
  }

  async function clearConversation() {
    if (streaming || messages.length === 0) return;
    if (!window.confirm("Clear this conversation?")) return;
    const previous = messages;
    setMessages([]);
    const res = await fetch(`/api/contracts/${contractId}/chat`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) setMessages(previous);
  }

  const empty = historyState === "loaded" && messages.length === 0;

  return (
    <aside
      aria-label="Chat with document"
      aria-hidden={!open}
      className={cn(
        "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-[#E8E8E8] bg-white shadow-2xl transition-[transform,visibility] duration-300 sm:w-[420px] lg:top-20 lg:z-30 lg:shadow-[-4px_0_12px_rgba(0,0,0,0.04)]",
        open ? "visible translate-x-0" : "invisible translate-x-full"
      )}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[#E8E8E8] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E5F0EB] text-[#006A3B]">
            <MessagesSquare className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#282828]">Chat with document</p>
            <p className="truncate text-xs text-[#868686]">Answers come from this contract, with clause citations</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={clearConversation}
            disabled={streaming || messages.length === 0}
            title="Clear conversation"
            className="rounded-md p-2 text-[#868686] transition-colors hover:bg-[#F4F7F6] hover:text-[#282828] disabled:pointer-events-none disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Clear conversation</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="rounded-md p-2 text-[#868686] transition-colors hover:bg-[#F4F7F6] hover:text-[#282828]"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close chat</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {historyState === "loading" && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#868686]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading conversation…
          </div>
        )}
        {historyState === "failed" && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-[#868686]">
            Could not load the conversation.
            <button type="button" onClick={loadHistory} className="font-medium text-[#006A3B] hover:underline">
              Try again
            </button>
          </div>
        )}

        {empty && (
          <div className="flex flex-col items-center px-2 pt-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E5F0EB] text-[#006A3B]">
              <Sparkles className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-[#282828]">Ask anything about this contract</p>
            <p className="mt-1 text-xs leading-relaxed text-[#868686]">
              Answers are based on the document&apos;s text and cite the clauses they rely on. Ask in any language.
            </p>
            <div className="mt-5 flex w-full flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-lg border border-[#E8E8E8] px-3 py-2 text-left text-sm text-[#4B4B4B] transition-colors hover:border-[#CCE1D8] hover:bg-[#F2F8F5] hover:text-[#006A3B]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[#006A3B] px-3.5 py-2 text-sm text-white">
                {m.content}
              </p>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E5F0EB] text-[#006A3B]">
                <Sparkles className="h-3 w-3" />
              </span>
              <div className="min-w-0 flex-1 text-sm leading-relaxed text-[#4B4B4B]">
                {m.content ? (
                  <RichText text={m.content} clauses={clauseMap} onCite={onCiteClause} />
                ) : m.streaming ? (
                  <span className="inline-flex items-center gap-2 text-[#868686]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading the document…
                  </span>
                ) : null}
                {m.streaming && m.content && (
                  <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-[#006A3B] align-middle" />
                )}
                {m.error && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-red-600">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {m.error}
                  </p>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* Composer */}
      <form
        className="border-t border-[#E8E8E8] p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <div className="flex items-end gap-2 rounded-xl border border-[#DDDDDD] bg-white p-1.5 pl-3 focus-within:border-[#66A689] focus-within:ring-2 focus-within:ring-[#006A3B]/20">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            maxLength={MAX_QUESTION_CHARS}
            placeholder="Ask a question about this document…"
            onChange={(e) => {
              setInput(e.target.value);
              resizeInput();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
            className="max-h-40 min-h-[36px] flex-1 resize-none bg-transparent py-2 text-sm text-[#282828] placeholder:text-[#868686] focus:outline-none"
          />
          {streaming ? (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              title="Stop"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#282828] text-white transition-colors hover:bg-black"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span className="sr-only">Stop answering</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              title="Send"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#006A3B] text-white transition-colors hover:bg-[#005a32] disabled:opacity-40"
            >
              <SendHorizontal className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </button>
          )}
        </div>
        <p className="mt-1.5 px-1 text-[11px] text-[#868686]">
          AI answers can be wrong. Check the cited clauses before relying on them.
        </p>
      </form>
    </aside>
  );
}
