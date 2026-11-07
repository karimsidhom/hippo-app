import { NextRequest, NextResponse } from "next/server";
import { requireIdentityClient } from "@/lib/api-auth";
import {
  acceptSafety,
  loadSafetyStatus,
  safetyApp,
  type SafetyAcceptance,
} from "@/lib/safety";
const headers = {
  "Cache-Control": "no-store, private",
  "Referrer-Policy": "no-referrer",
};
export async function GET(req: NextRequest) {
  const auth = await requireIdentityClient();
  if (auth.error) return auth.error;
  const app = safetyApp(req.nextUrl.searchParams.get("app"));
  if (!app)
    return NextResponse.json(
      { error: "Unknown app" },
      { status: 400, headers },
    );
  try {
    return NextResponse.json(await loadSafetyStatus(auth.client, app), {
      headers,
    });
  } catch {
    return NextResponse.json(
      { error: "Safety verification unavailable", code: "SAFETY_UNAVAILABLE" },
      { status: 503, headers },
    );
  }
}
export async function POST(req: NextRequest) {
  const auth = await requireIdentityClient();
  if (auth.error) return auth.error;
  if (
    !req.headers.get("authorization") &&
    req.headers.get("origin") !== req.nextUrl.origin
  )
    return NextResponse.json(
      { error: "Invalid origin" },
      { status: 403, headers },
    );
  try {
    if (Number(req.headers.get("content-length") ?? 0) > 8192)
      throw new Error("Too large");
    const reader = req.body?.getReader();
    let total = 0;
    const chunks: Uint8Array[] = [];
    if (reader) {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        total += part.value.byteLength;
        if (total > 8192) {
          await reader.cancel();
          throw new Error("Too large");
        }
        chunks.push(part.value);
      }
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const body = JSON.parse(new TextDecoder().decode(bytes)) as Record<
      string,
      unknown
    >;
    const app = safetyApp(body.app);
    if (
      !app ||
      Object.keys(body).some((k) => !["app", "acceptances"].includes(k)) ||
      !Array.isArray(body.acceptances) ||
      body.acceptances.length > 8
    )
      return NextResponse.json(
        { error: "Invalid safety request" },
        { status: 400, headers },
      );
    return NextResponse.json(
      await acceptSafety(
        auth.client,
        app,
        body.acceptances as SafetyAcceptance[],
      ),
      { headers },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Safety acceptance could not be recorded. Retry with current requirements.",
        code: "SAFETY_UNAVAILABLE",
      },
      { status: 503, headers },
    );
  }
}
