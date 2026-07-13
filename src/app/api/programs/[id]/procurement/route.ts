import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { isProgramOwner } from "@/lib/program-auth";
import {
  agreementUrl,
  escapeHtml,
  INSTITUTIONAL_AGREEMENT_VERSION,
  stripeProgramBillingConfigured,
} from "@/lib/procurement";

const requestSchema = z.object({
  institutionLegalName: z.string().trim().min(2).max(180),
  institutionType: z.string().trim().min(2).max(80),
  jurisdiction: z.string().trim().min(2).max(100),
  addressLine1: z.string().trim().min(2).max(180),
  addressLine2: z.string().trim().max(180).optional().nullable(),
  city: z.string().trim().min(2).max(100),
  province: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().min(2).max(80).default("Canada"),
  signatoryName: z.string().trim().min(2).max(120),
  signatoryTitle: z.string().trim().min(2).max(120),
  signatoryEmail: z.string().trim().email().max(180),
  billingContactName: z.string().trim().min(2).max(120),
  billingContactEmail: z.string().trim().email().max(180),
  residentSeats: z.coerce.number().int().min(1).max(1000),
  facultySeats: z.coerce.number().int().min(1).max(1000),
  pilotStartDate: z.string().date().optional().nullable(),
  purchaseOrderRequired: z.boolean().default(false),
  purchaseOrderNumber: z.string().trim().max(80).optional().nullable(),
  securityReviewRequired: z.boolean().default(false),
  dataProcessingRequired: z.boolean().default(true),
  notes: z.string().trim().max(3000).optional().nullable(),
  submit: z.boolean().default(false),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!(await isProgramOwner(auth.user.id, id))) {
    return NextResponse.json({ error: "Program owner access required" }, { status: 403 });
  }

  const [program, procurement, subscription] = await Promise.all([
    db.program.findUnique({ where: { id }, select: { id: true, name: true, institution: true, specialty: true } }),
    db.institutionalProcurement.findUnique({ where: { programId: id } }),
    db.programSubscription.findUnique({ where: { programId: id }, select: { status: true } }),
  ]);
  if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 });

  return NextResponse.json({
    program,
    procurement,
    subscriptionStatus: subscription?.status ?? "none",
    stripeConfigured: stripeProgramBillingConfigured(),
    agreementVersion: INSTITUTIONAL_AGREEMENT_VERSION,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!(await isProgramOwner(auth.user.id, id))) {
    return NextResponse.json({ error: "Program owner access required" }, { status: 403 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Complete all required procurement fields.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const body = parsed.data;
  const existing = await db.institutionalProcurement.findUnique({ where: { programId: id } });
  if (existing?.agreementAcceptedAt) {
    return NextResponse.json({ error: "The executed agreement is locked. Contact legal@hippomedicine.com for an amendment." }, { status: 409 });
  }

  const start = body.pilotStartDate ? new Date(`${body.pilotStartDate}T12:00:00.000Z`) : null;
  const end = start ? new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000) : null;
  const token = body.submit ? existing?.agreementToken ?? randomBytes(32).toString("hex") : existing?.agreementToken;
  const tokenExpiry = body.submit ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : existing?.agreementTokenExpiresAt;
  const now = new Date();
  const shared = {
    institutionLegalName: body.institutionLegalName,
    institutionType: body.institutionType,
    jurisdiction: body.jurisdiction,
    addressLine1: body.addressLine1,
    addressLine2: body.addressLine2 || null,
    city: body.city,
    province: body.province,
    postalCode: body.postalCode,
    country: body.country,
    signatoryName: body.signatoryName,
    signatoryTitle: body.signatoryTitle,
    signatoryEmail: body.signatoryEmail.toLowerCase(),
    billingContactName: body.billingContactName,
    billingContactEmail: body.billingContactEmail.toLowerCase(),
    residentSeats: body.residentSeats,
    facultySeats: body.facultySeats,
    pilotStartDate: start,
    pilotEndDate: end,
    purchaseOrderRequired: body.purchaseOrderRequired,
    purchaseOrderNumber: body.purchaseOrderNumber || null,
    securityReviewRequired: body.securityReviewRequired,
    dataProcessingRequired: body.dataProcessingRequired,
    notes: body.notes || null,
    status: body.submit ? "SUBMITTED" : "DRAFT",
    submittedAt: body.submit ? existing?.submittedAt ?? now : existing?.submittedAt,
    agreementVersion: body.submit ? INSTITUTIONAL_AGREEMENT_VERSION : existing?.agreementVersion,
    agreementToken: token,
    agreementTokenExpiresAt: tokenExpiry,
  };

  const procurement = await db.institutionalProcurement.upsert({
    where: { programId: id },
    create: { programId: id, requestedById: auth.user.id, ...shared },
    update: shared,
  });

  if (body.submit && token) {
    const url = agreementUrl(token);
    const institution = escapeHtml(body.institutionLegalName);
    const signatory = escapeHtml(body.signatoryName);
    const subject = `Hippo institutional agreement for ${body.institutionLegalName}`;
    const requester = auth.user.email ?? "The program owner";
    const text = `Hello ${body.signatoryName},\n\n${requester} prepared a Hippo 30-day program pilot agreement for ${body.institutionLegalName}. Review and execute it here: ${url}\n\nThe secure link expires in 30 days.\n\nHippo Medicine`;
    const html = `<p>Hello ${signatory},</p><p>${escapeHtml(requester)} prepared a Hippo 30-day program pilot agreement for <strong>${institution}</strong>.</p><p><a href="${url}">Review and execute the agreement</a></p><p>This secure link expires in 30 days.</p><p>Hippo Medicine</p>`;
    await Promise.all([
      sendEmail({ to: body.signatoryEmail, subject, html, text }),
      sendEmail({ to: "legal@hippomedicine.com", subject: `Procurement submitted: ${body.institutionLegalName}`, html, text }),
    ]);
  }

  return NextResponse.json({ procurement, agreementSent: body.submit });
}
