import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { escapeHtml } from "@/lib/procurement";
import { ATTRIBUTION_COOKIE, decodeAttribution } from "@/lib/growth/attribution";

const leadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  role: z.string().trim().min(2).max(100),
  institution: z.string().trim().min(2).max(180),
  programName: z.string().trim().max(180).optional().nullable(),
  specialty: z.string().trim().max(120).optional().nullable(),
  residentCount: z.coerce.number().int().min(1).max(2000).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  message: z.string().trim().max(2000).optional().nullable(),
  consent: z.literal(true),
  website: z.string().max(0).optional().default(""),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = checkRateLimit(`growth:lead:${ip}`, { max: 5, windowMs: 60 * 60_000 });
  if (!limit.allowed) return limit.response;

  const parsed = leadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please complete the required fields and permission checkbox." }, { status: 400 });
  }

  const body = parsed.data;
  const attribution = decodeAttribution(request.cookies.get(ATTRIBUTION_COOKIE)?.value);
  const lead = await db.growthLead.create({
    data: {
      name: body.name,
      email: body.email.toLowerCase(),
      role: body.role,
      institution: body.institution,
      programName: body.programName || null,
      specialty: body.specialty || null,
      residentCount: body.residentCount ?? null,
      country: body.country || null,
      message: body.message || null,
      source: attribution.source || null,
      medium: attribution.medium || null,
      campaign: attribution.campaign || null,
      content: attribution.content || null,
      consentAt: new Date(),
    },
  });

  await db.growthEvent.create({
    data: {
      name: "pilot_lead",
      path: "/pilot",
      source: attribution.source || null,
      medium: attribution.medium || null,
      campaign: attribution.campaign || null,
      content: attribution.content || null,
      metadata: { leadId: lead.id, role: body.role, institution: body.institution },
    },
  });

  const ownerEmail = process.env.HIPPO_GROWTH_EMAIL || "legal@hippomedicine.com";
  const safeName = escapeHtml(body.name);
  const safeInstitution = escapeHtml(body.institution);
  const safeEmail = escapeHtml(body.email);
  const summary = [body.programName, body.specialty, body.residentCount ? `${body.residentCount} residents` : null].filter(Boolean).join(" · ");

  await Promise.all([
    sendEmail({
      to: ownerEmail,
      subject: `New Hippo pilot request — ${body.institution}`,
      text: `${body.name} (${body.role}) requested a Hippo pilot.\n\nInstitution: ${body.institution}\nEmail: ${body.email}\nProgram: ${body.programName || "Not provided"}\nSpecialty: ${body.specialty || "Not provided"}\nResidents: ${body.residentCount || "Not provided"}\nMessage: ${body.message || "None"}\nSource: ${attribution.source || "direct"}`,
      html: `<h2>New Hippo pilot request</h2><p><strong>${safeName}</strong> (${escapeHtml(body.role)}) at <strong>${safeInstitution}</strong></p><p><a href="mailto:${safeEmail}">${safeEmail}</a></p><p>${escapeHtml(summary || "Program details not provided")}</p><p>${escapeHtml(body.message || "No additional message.")}</p><p>Source: ${escapeHtml(attribution.source || "direct")}</p>`,
    }),
    sendEmail({
      to: body.email,
      subject: "Your Hippo program pilot request",
      text: `Hi ${body.name},\n\nWe received your request for a Hippo residency-program pilot at ${body.institution}. We will follow up with a short implementation call and a proposed 30-day pilot scope.\n\nYou can explore the program director demo now: https://hippomedicine.com/program-demo\n\nHippo Medicine`,
      html: `<p>Hi ${safeName},</p><p>We received your request for a Hippo residency-program pilot at <strong>${safeInstitution}</strong>. We will follow up with a short implementation call and a proposed 30-day pilot scope.</p><p><a href="https://hippomedicine.com/program-demo">Explore the program director demo</a></p><p>Hippo Medicine</p>`,
    }),
  ]);

  return NextResponse.json({ ok: true });
}
