import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { ATTRIBUTION_COOKIE, encodeAttribution } from "@/lib/growth/attribution";

const eventSchema = z.object({
  name: z.enum(["page_view", "cta_click"]),
  path: z.string().startsWith("/").max(240),
  sessionId: z.string().max(80).optional().nullable(),
  source: z.string().max(120).optional().nullable(),
  medium: z.string().max(120).optional().nullable(),
  campaign: z.string().max(160).optional().nullable(),
  content: z.string().max(160).optional().nullable(),
  referrer: z.string().url().max(500).optional().nullable(),
  metadata: z.record(z.union([z.string().max(300), z.number(), z.boolean(), z.null()])).optional(),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = checkRateLimit(`growth:event:${ip}`, { max: 120, windowMs: 60_000 });
  if (!limit.allowed) return limit.response;

  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });

  const body = parsed.data;
  let referrerHost: string | null = null;
  if (body.referrer) {
    try { referrerHost = new URL(body.referrer).hostname.slice(0, 180); } catch { referrerHost = null; }
  }

  await db.growthEvent.create({
    data: {
      name: body.name,
      path: body.path,
      sessionId: body.sessionId || null,
      source: body.source || null,
      medium: body.medium || null,
      campaign: body.campaign || null,
      content: body.content || null,
      referrerHost,
      metadata: body.metadata ?? undefined,
    },
  });

  const response = NextResponse.json({ ok: true });
  if (!request.cookies.get(ATTRIBUTION_COOKIE)?.value) {
    response.cookies.set(ATTRIBUTION_COOKIE, encodeAttribution({
      source: body.source || (referrerHost ? referrerHost : "direct"),
      medium: body.medium || (referrerHost ? "referral" : "none"),
      campaign: body.campaign,
      content: body.content,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 90,
      path: "/",
    });
  }
  return response;
}
