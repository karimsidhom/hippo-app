import type { NoteContext, LengthLevel } from "../types";
import { getStyleProfile } from "../style/store";
import { applyStyleProfile } from "../style/apply";

// ---------------------------------------------------------------------------
// Surgical consult note — full / concise / handover.
//
// Structure mirrors how surgical residents actually dictate consults: a tight
// one-liner, focused HPI, active problems, exam restricted to systems that
// matter for the surgical question, imaging / labs, a clinically specific
// assessment, and a bulleted plan that answers the consult question first.
// ---------------------------------------------------------------------------

function section(label: string, body?: string): string[] {
  if (!body || !body.trim()) return [`${label}: [not provided]`];
  return [`${label}: ${body.trim()}`];
}

export function buildConsultNote(ctx: NoteContext, length: LengthLevel): string {
  const lines: string[] = [];
  const header = length === "handover" ? "CONSULT (sign-out)" : "SURGICAL CONSULT NOTE";
  lines.push(header);
  lines.push("=".repeat(header.length));
  lines.push("");

  // One-liner is required — always lead with it
  lines.push(`ID / One-liner: ${ctx.patientOneLiner?.trim() || "[age, sex, pertinent PMH]"}`);
  lines.push(`Reason for consult: ${ctx.reason?.trim() || "[specific question being asked]"}`);
  lines.push("");

  if (length === "handover") {
    // One-screen sign-out version
    lines.push(...section("Impression", ctx.assessment));
    lines.push(...section("Plan", ctx.plan));
    lines.push(...section("Disposition", ctx.disposition));
    return applyStyleProfile(lines.join("\n"), getStyleProfile());
  }

  // Full + concise share most sections; full adds more detail.
  lines.push(...section("HPI", ctx.hpi));
  if (length === "full") {
    lines.push(...section("PMH", ctx.pmh));
    lines.push(...section("Medications", ctx.meds));
    lines.push(...section("Allergies", ctx.allergies));
  }
  lines.push(...section("Exam", ctx.exam));
  lines.push(...section("Labs / Imaging", ctx.investigations));
  lines.push("");
  lines.push(...section("Impression", ctx.assessment));
  lines.push(...section("Plan", ctx.plan));
  if (length === "full") {
    lines.push(...section("Disposition", ctx.disposition));
  }

  return applyStyleProfile(lines.join("\n"), getStyleProfile());
}
