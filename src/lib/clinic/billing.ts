// Hippo Clinic — Billing module.
//
// LIABILITY NOTE
// ─────────────────────────────────────────────────────────────────────────
// We do NOT ship validated provincial fee schedules in this repo. Shipping
// stale or wrong codes is a real liability risk — clinicians can mis-bill
// and lose money or face audits. The intentional design is:
//
//   1. The schema (clinic_billing_codes) accepts whatever fee schedule
//      the institution chooses to load.
//   2. Until a province's table has ≥1 row, the billing UI shows
//      "Billing module not configured for [PROVINCE]" and emits no
//      suggestions.
//   3. When a table is loaded, every code carries a `source` citation
//      identifying the manual + version, so the audit trail proves what
//      we matched against.
//
// To populate codes, an admin user runs the seed script with a CSV that
// references the official fee manual for that province. See
// scripts/clinic/seed-billing.ts for the format.

import { db } from "@/lib/db";

export interface BillingSuggestionInput {
  encounterId: string;
  ownerUserId: string;
  province: string;
  noteType: string;
  specialty?: string;
  noteText: string;
}

export interface BillingSuggestion {
  code: string;
  shortLabel: string;
  feeCents: number | null;
  rationale: string;
  source: string;
}

/**
 * Suggest billing codes for an encounter. Returns an empty array if the
 * province has no codes loaded — the UI surface should treat that as
 * "billing module not configured".
 */
export async function suggestBillingCodes(input: BillingSuggestionInput): Promise<BillingSuggestion[]> {
  if (!input.province) return [];

  // Pull every active code for the user's province, filtered by note type
  // / specialty applicability if specified. We accept either user-owned
  // rows (custom additions) OR global rows (ownerUserId is null).
  const codes = await db.clinicBillingCode.findMany({
    where: {
      province: input.province,
      isActive: true,
      OR: [
        { ownerUserId: null },
        { ownerUserId: input.ownerUserId },
      ],
    },
    take: 200,
  });
  if (codes.length === 0) return [];

  const noteLower = input.noteText.toLowerCase();
  const out: BillingSuggestion[] = [];

  for (const c of codes) {
    // Applicability filters — optional, but if set they must match.
    if (c.noteTypes.length > 0 && !c.noteTypes.includes(input.noteType)) continue;
    if (c.specialties.length > 0 && input.specialty && !c.specialties.includes(input.specialty)) continue;

    // Lightweight matching: if the code's short label OR description
    // contains a phrase that appears in the note, suggest it. We keep this
    // dumb on purpose — the LLM might fabricate matches if we ask it to
    // "pick codes". A grep is auditable; an LLM is not.
    const phrases = [c.shortLabel, c.description].filter(Boolean) as string[];
    let rationale = "Default for this note type.";
    let matched = c.noteTypes.includes(input.noteType);
    for (const phrase of phrases) {
      const tokens = phrase.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 4);
      const hits = tokens.filter((t) => noteLower.includes(t));
      if (hits.length >= 2) {
        matched = true;
        rationale = `Matched on phrases: ${hits.slice(0, 3).join(", ")}`;
        break;
      }
    }
    if (!matched) continue;

    out.push({
      code: c.code,
      shortLabel: c.shortLabel,
      feeCents: c.feeCents,
      rationale,
      source: c.source,
    });
  }

  return out;
}

export function billingConfiguredFor(province: string | null | undefined): Promise<boolean> {
  if (!province) return Promise.resolve(false);
  return db.clinicBillingCode.count({
    where: { province, isActive: true },
  }).then((n) => n > 0);
}
