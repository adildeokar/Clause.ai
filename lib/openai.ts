import OpenAI from "openai";

const globalForOpenAI = globalThis as unknown as {
  openai: OpenAI | undefined;
};

export const openai =
  globalForOpenAI.openai ??
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

if (process.env.NODE_ENV !== "production") globalForOpenAI.openai = openai;

/**
 * gpt-4o-mini is the cheapest "mini" chat model ($0.15 / $0.60 per 1M tokens)
 * and supports JSON mode, vision and PDF input, which every feature relies on.
 */
export const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";

/** Cheapest embedding model ($0.02 per 1M tokens), used for chat retrieval. */
export const EMBEDDING_MODEL = "text-embedding-3-small";
