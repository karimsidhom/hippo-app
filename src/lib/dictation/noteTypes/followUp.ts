import type { NoteContext, LengthLevel } from "../types";
import { getStyleProfile } from "../style/store";
import { applyStyleProfile } from "../style/apply";

// ---------------------------------------------------------------------------
// Surgical progress / follow-up note (inpatient ward round).
//
// Focus: what changed overnight, what matters today, and what the plan is
// by problem. Structured for a SOAP-style round rather than a full consult.
// ---------------------------------------------------------------------------

function line(label: string, body?: string): string {
  return `${label}: ${body?.trim() || "[—]"}`;
}

export function buildFollowUpNote(ctx: NoteContext, length: LengthLevel): string {
  const lines: string[] = [];
  const header = length === "handover" ? "SIGN-OUT" : "PROGRESS NOTE";
  lines.push(header);
  lines.push("=".repeat(header.length));
  lines.push("");

  lines.push(`ID: ${ctx.patientOneLiner?.trim() || "[one-liner]"}`);
  if (length !== "handover") {
    lines.push(line("Overnight / interval events", ctx.hpi));
  }
  if (length === "full") {
    lines.push(line("Exam", ctx.exam));
    lines.push(line("Labs / Imaging", ctx.investigations));
  }
  lines.push(line("Impression", ctx.assessment));
  lines.push(line("Plan (by problem)", ctx.plan));
  if (length === "handover") {
    lines.push(line("To do tonight", ctx.disposition));
  }

  return applyStyleProfile(lines.join("\n"), getStyleProfile());
}
