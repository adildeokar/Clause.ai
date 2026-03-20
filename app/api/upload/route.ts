import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseDocument } from "@/lib/parsing";

// TODO: Add rate limiting middleware

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    const fileExtension = file.name.split(".").pop() || "";
    const supportedTypes = ["pdf", "docx", "txt", "rtf", "md"];

    if (!supportedTypes.includes(fileExtension.toLowerCase())) {
      return NextResponse.json(
        {
          error: `Unsupported file type. Supported: ${supportedTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseDocument(buffer, fileExtension);

    const previewLength = 2000;
    const preview =
      parsed.cleanedText.length > previewLength
        ? parsed.cleanedText.slice(0, previewLength) + "..."
        : parsed.cleanedText;

    return NextResponse.json({
      rawText: parsed.rawText,
      cleanedText: parsed.cleanedText,
      clauseCount: parsed.clauses.length,
      preview,
    });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json(
      { error: "Failed to parse uploaded file" },
      { status: 500 }
    );
  }
}
