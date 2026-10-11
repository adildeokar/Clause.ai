import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export interface SessionUser {
  id: string;
  role: string;
}

/** The signed-in user, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return { id: session.user.id, role: session.user.role };
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export const unauthorized = () => jsonError("Unauthorized", 401);

/** Parses a JSON body, treating an empty or invalid body as `{}`. */
export async function readJson(req: Request): Promise<Record<string, any>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}
