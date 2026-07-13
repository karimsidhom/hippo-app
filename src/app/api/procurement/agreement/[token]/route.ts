import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { escapeHtml, stripeProgramBillingConfigured } from "@/lib/procurement";

const acceptanceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  title: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  authorityConfirmed: z.literal(true),
  termsConfirmed: z.literal(true),
});

async function loadAgreement(token: string) {
  return db.institutionalProcurement.findUnique({
    where: { agreementToken: token },
    include: { program: { select: { id: true, name: true, specialty: true } } },
  });
}

function publicAgreement(procurement: NonNullable<Awaited<ReturnType<typeof loadAgreement>>>) {
  return {
    institutionLegalName: procurement.institutionLegalName,
    institutionType: procurement.institutionType,
    jurisdiction: procurement.jurisdiction,
    address: [procurement.addressLine1, procurement.addressLine2, `${procurement.city}, ${procurement.province} ${procurement.postalCode}`, procurement.country].filter(Boolean),
    programName: procurement.program.name,
    specialty: procurement.program.specialty,
    residentSeats: procurement.residentSeats,
    facultySeats: procurement.facultySeats,
    pilotStartDate: procurement.pilotStartDate,
    pilotEndDate: procurement.pilotEndDate,
    purchaseOrderRequired: procurement.purchaseOrderRequired,
    purchaseOrderNumber: procurement.purchaseOrderNumber,
    dataProcessingRequired: procurement.dataProcessingRequired,
    securityReviewRequired: procurement.securityReviewRequired,
    agreementVersion: procurement.agreementVersion,
    signatoryName: procurement.signatoryName,
    signatoryTitle: procurement.signatoryTitle,
    signatoryEmail: procurement.signatoryEmail,
    status: procurement.status,
    acceptedAt: procurement.agreementAcceptedAt,
    stripeConfigured: stripeProgramBillingConfigured(),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const procurement = await loadAgreement(token);
  if (!procurement || !procurement.agreementTokenExpiresAt || procurement.agreementTokenExpiresAt < new Date()) {
    return NextResponse.json({ error: "This agreement link is invalid or expired." }, { status: 404 });
  }
  return NextResponse.json({ agreement: publicAgreement(procurement) });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const procurement = await loadAgreement(token);
  if (!procurement || !procurement.agreementTokenExpiresAt || procurement.agreementTokenExpiresAt < new Date()) {
    return NextResponse.json({ error: "This agreement link is invalid or expired." }, { status: 404 });
  }
  if (procurement.agreementAcceptedAt) {
    return NextResponse.json({ agreement: publicAgreement(procurement), alreadyAccepted: true });
  }

  const parsed = acceptanceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Complete the signatory certification." }, { status: 400 });
  if (parsed.data.email.toLowerCase() !== procurement.signatoryEmail.toLowerCase()) {
    return NextResponse.json({ error: "Use the authorized signatory email listed on the order form." }, { status: 400 });
  }

  const acceptedAt = new Date();
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
  const updated = await db.institutionalProcurement.update({
    where: { id: procurement.id },
    data: {
      signatoryName: parsed.data.name,
      signatoryTitle: parsed.data.title,
      status: "AGREEMENT_ACCEPTED",
      agreementAcceptedAt: acceptedAt,
      authorityConfirmed: true,
      acceptanceIpAddress: ipAddress,
      acceptanceUserAgent: request.headers.get("user-agent"),
    },
    include: { program: { select: { id: true, name: true, specialty: true } } },
  });

  const subject = `Executed: Hippo agreement with ${procurement.institutionLegalName}`;
  const text = `${parsed.data.name} executed the Hippo institutional agreement for ${procurement.institutionLegalName} on ${acceptedAt.toISOString()}.`;
  const html = `<p><strong>${escapeHtml(parsed.data.name)}</strong> executed the Hippo institutional agreement for <strong>${escapeHtml(procurement.institutionLegalName)}</strong>.</p><p>${acceptedAt.toISOString()}</p>`;
  await Promise.all([
    sendEmail({ to: procurement.signatoryEmail, subject, html, text }),
    sendEmail({ to: procurement.billingContactEmail, subject, html, text }),
    sendEmail({ to: "legal@hippomedicine.com", subject, html, text }),
  ]);

  return NextResponse.json({ agreement: publicAgreement(updated), accepted: true });
}
