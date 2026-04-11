import type { NoteContext, LengthLevel } from "../types";
import { getStyleProfile } from "../style/store";
import { applyStyleProfile } from "../style/apply";

// ---------------------------------------------------------------------------
// Bedside procedure note — central line, chest tube, paracentesis, LP, etc.
// Not a full operative report; just the essentials for the medicolegal record.
// ---------------------------------------------------------------------------

export function buildBedsideProcedureNote(
  ctx: NoteContext,
  length: LengthLevel,
): string {
  const lines: string[] = [];
  lines.push("BEDSIDE PROCEDURE NOTE");
  lines.push("======================");
  lines.push("");
  lines.push(`Patient: ${ctx.patientOneLiner?.trim() || "[one-liner]"}`);
  lines.push(`Procedure: ${ctx.reason?.trim() || "[procedure name]"}`);
  lines.push(`Indication: ${ctx.assessment?.trim() || "[indication]"}`);
  lines.push(`Consent: [Obtained / urgent — see notes]`);
  lines.push(`Operator: [name] (supervised by [attending])`);
  lines.push(`Antiseptic / sterile field: chlorhexidine prep, full barrier`);
  lines.push(`Local anesthetic: [lidocaine 1% / 2% — mL]`);
  lines.push("");

  if (length === "handover") {
    lines.push(`Outcome: ${ctx.plan?.trim() || "[successful / complicated by — ]"}`);
    return applyStyleProfile(lines.join("\n"), getStyleProfile());
  }

  lines.push(`Technique: ${ctx.hpi?.trim() || "[describe landmarks, ultrasound guidance, needle/catheter, verification]"}`);
  lines.push(`Verification: [ultrasound / aspirate / imaging confirmation]`);
  lines.push(`Complications: ${ctx.disposition?.trim() || "None."}`);
  lines.push(`Post-procedure plan: ${ctx.plan?.trim() || "[monitoring, imaging, follow-up]"}`);
  if (length === "full") {
    lines.push(`Specimens sent: [if any]`);
  }

  return applyStyleProfile(lines.join("\n"), getStyleProfile());
}
