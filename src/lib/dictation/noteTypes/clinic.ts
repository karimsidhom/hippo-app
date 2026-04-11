import type { NoteContext, LengthLevel } from "../types";
import { getStyleProfile } from "../style/store";
import { applyStyleProfile } from "../style/apply";

export function buildClinicNote(ctx: NoteContext, length: LengthLevel): string {
  const lines: string[] = [];
  lines.push("CLINIC NOTE");
  lines.push("===========");
  lines.push("");
  lines.push(`Patient: ${ctx.patientOneLiner?.trim() || "[one-liner]"}`);
  lines.push(`Visit: ${ctx.reason?.trim() || "[reason / interval since last review]"}`);
  lines.push("");

  if (length === "handover") {
    lines.push(`Impression: ${ctx.assessment?.trim() || "[impression]"}`);
    lines.push(`Plan: ${ctx.plan?.trim() || "[plan]"}`);
    return applyStyleProfile(lines.join("\n"), getStyleProfile());
  }

  lines.push(`Interval history: ${ctx.hpi?.trim() || "[interval symptoms, progress]"}`);
  if (length === "full") {
    lines.push(`Medications: ${ctx.meds?.trim() || "[meds]"}`);
  }
  lines.push(`Exam: ${ctx.exam?.trim() || "[focused exam]"}`);
  lines.push(`Investigations reviewed: ${ctx.investigations?.trim() || "[imaging / labs]"}`);
  lines.push("");
  lines.push(`Impression: ${ctx.assessment?.trim() || "[impression]"}`);
  lines.push(`Plan: ${ctx.plan?.trim() || "[plan, next appointment, tests ordered]"}`);

  return applyStyleProfile(lines.join("\n"), getStyleProfile());
}
