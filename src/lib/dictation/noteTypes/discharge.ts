import type { NoteContext, LengthLevel } from "../types";
import { getStyleProfile } from "../style/store";
import { applyStyleProfile } from "../style/apply";

export function buildDischargeSummary(ctx: NoteContext, length: LengthLevel): string {
  const lines: string[] = [];
  const header = "DISCHARGE SUMMARY";
  lines.push(header);
  lines.push("=".repeat(header.length));
  lines.push("");

  lines.push(`Patient: ${ctx.patientOneLiner?.trim() || "[one-liner]"}`);
  lines.push(`Admission reason: ${ctx.reason?.trim() || "[reason]"}`);
  lines.push("");

  if (length === "handover") {
    // Handover version = tight hand-off to GP / primary team
    lines.push(`Hospital course (summary): ${ctx.hpi?.trim() || "[summary]"}`);
    lines.push(`Discharge plan: ${ctx.plan?.trim() || "[meds, follow-up, red flags]"}`);
    return applyStyleProfile(lines.join("\n"), getStyleProfile());
  }

  lines.push(`Hospital course: ${ctx.hpi?.trim() || "[hospital course narrative]"}`);
  if (length === "full") {
    lines.push(`Past medical history: ${ctx.pmh?.trim() || "[PMH]"}`);
    lines.push(`Investigations: ${ctx.investigations?.trim() || "[relevant labs/imaging]"}`);
  }
  lines.push(`Discharge diagnoses: ${ctx.assessment?.trim() || "[diagnoses]"}`);
  lines.push(`Discharge medications: ${ctx.meds?.trim() || "[meds]"}`);
  lines.push(`Allergies: ${ctx.allergies?.trim() || "[allergies]"}`);
  lines.push(`Follow-up: ${ctx.disposition?.trim() || "[clinic / scans / bloods]"}`);
  if (length === "full") {
    lines.push(`Red flags for return: [list specific symptoms that should prompt ED return]`);
  }
  lines.push(`Plan: ${ctx.plan?.trim() || "[plan]"}`);

  return applyStyleProfile(lines.join("\n"), getStyleProfile());
}
