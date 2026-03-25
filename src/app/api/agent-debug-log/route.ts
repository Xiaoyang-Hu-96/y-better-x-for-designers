import { NextRequest, NextResponse } from "next/server";
import { appendFile, mkdir } from "fs/promises";
import { join } from "path";
import { REPOSITORY_ROOT } from "@/lib/repository-root";

/** Dev-only: append one NDJSON line for Cursor debug session f383a1 (font probe). */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const line = `${JSON.stringify({ ...body, timestamp: body.timestamp ?? Date.now() })}\n`;
    const dir = join(REPOSITORY_ROOT, ".cursor");
    await mkdir(dir, { recursive: true });
    await appendFile(join(dir, "debug-f383a1.log"), line, "utf8");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
