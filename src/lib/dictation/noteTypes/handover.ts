import type { NoteContext, LengthLevel } from "../types";
import { getStyleProfile } from "../style/store";
import { applyStyleProfile } from "../style/apply";

// ---------------------------------------------------------------------------
// Handover / sign-out note
//
// A true handover is read in seconds. We enforce that by design: one-liner,
// active problems, pending jobs, explicit "if X then Y" contingencies. No
// narrative.
// ---------------------------------------------------------------------------

export function buildHandoverNote(ctx: NoteContext, _length: LengthLevel): string {
  const lines: string[] = [];
  lines.push("HANDOVER");
  lines.push("========");
  lines.push("");
  lines.push(`• ${ctx.patientOneLiner?.trim() || "[one-liner]"}`);
  lines.push(`• Problem: ${ctx.reason?.trim() || "[active problem]"}`);
  lines.push(`• Current status: ${ctx.assessment?.trim() || "[stable / unwell / deteriorating]"}`);
  lines.push(`• To do tonight: ${ctx.plan?.trim() || "[jobs]"}`);
  lines.push(`• If X then Y: ${ctx.disposition?.trim() || "[explicit contingency plan]"}`);
  return applyStyleProfile(lines.join("\n"), getStyleProfile());
}
