// Hippo Clinic — EMR-friendly clipboard formatter.
//
// Goal: produce a plain-text representation of the finalised note that
// pastes cleanly into Accuro / OSCAR / Med Access / TELUS PS Suite / Epic
// note fields. EMR rich-text editors are unreliable across browsers; the
// safest target is ASCII-friendly plain text with simple paragraph breaks.
//
// What we do:
//   - Build a small header block (date, visit type, patient label)
//   - Concatenate paragraphs with blank lines between
//   - Append the signature
//   - Sanitise: smart quotes → straight, em/en dashes → " - ", non-
//     breaking spaces → spaces, strip any [[UNCERTAIN: ...]] markers
//     that slipped through (those should never appear in a finalised
//     note, but we belt-and-suspender it)
//
// We intentionally don't include Hippo branding in the output. The
// clinician owns the note; nothing in their EMR should advertise us.

interface Paragraphs { p1: string; p2: string; p3: string; p4: string }

interface FormatInput {
  paragraphs: Paragraphs;
  signatureText?: string | null;
  encounterDate: Date;
  noteType?: string;
  visitReason?: string | null;
  patient?: { givenName: string; familyName: string; preferredName?: string | null; dateOfBirth?: string | null } | null;
  /** Letter or instructions can be appended if the clinician wants the full bundle. */
  appendLetter?: string | null;
  appendPatientInstructions?: string | null;
}

export function formatNoteForEmr(input: FormatInput): string {
  const lines: string[] = [];

  // ── Header ─────────────────────────────────────────────────────────────
  const dateStr = input.encounterDate.toLocaleDateString("en-CA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  lines.push(dateStr);
  if (input.visitReason || input.noteType) {
    const visitLabel = input.noteType ? humanNoteType(input.noteType) : "";
    const parts = [visitLabel, input.visitReason].filter(Boolean);
    if (parts.length > 0) lines.push(parts.join(" - "));
  }
  if (input.patient) {
    const name = input.patient.preferredName ?? input.patient.givenName;
    const patientLine = `Patient: ${name} ${input.patient.familyName}`;
    const dob = input.patient.dateOfBirth ? ` (DOB ${new Date(input.patient.dateOfBirth).toLocaleDateString("en-CA")})` : "";
    lines.push(patientLine + dob);
  }
  lines.push(""); // blank line before body

  // ── Body ───────────────────────────────────────────────────────────────
  for (const k of ["p1", "p2", "p3", "p4"] as const) {
    const para = input.paragraphs[k]?.trim();
    if (!para) continue;
    lines.push(para);
    lines.push("");
  }

  // ── Optional appendices ────────────────────────────────────────────────
  if (input.appendPatientInstructions?.trim()) {
    lines.push("--- PATIENT INSTRUCTIONS ---");
    lines.push(input.appendPatientInstructions.trim());
    lines.push("");
  }
  if (input.appendLetter?.trim()) {
    lines.push("--- LETTER TO REFERRING PHYSICIAN ---");
    lines.push(input.appendLetter.trim());
    lines.push("");
  }

  // ── Signature ──────────────────────────────────────────────────────────
  if (input.signatureText && !/sincerely,?/i.test(input.paragraphs.p4)) {
    lines.push(`Sincerely,`);
    lines.push("");
    lines.push(input.signatureText);
  }

  // Join + sanitise.
  return sanitise(lines.join("\n").replace(/\n{3,}/g, "\n\n").trim());
}

function humanNoteType(s: string): string {
  return s
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Strip characters that EMR text fields choke on. We could be aggressive
 * (ASCII-only) but most modern EMRs handle UTF-8; the real culprits are
 * smart quotes (which look bad pasted into older fields) and weird unicode
 * spaces from copy-pasted source text.
 */
function sanitise(s: string): string {
  return s
    // Smart quotes → straight
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    // Em / en dashes → " - "
    .replace(/—/g, " - ")
    .replace(/–/g, " - ")
    // Non-breaking + zero-width spaces → regular space / nothing
    .replace(/ /g, " ")
    .replace(/[​‌‍﻿]/g, "")
    // Ellipsis → three dots
    .replace(/…/g, "...")
    // Strip C0/C1 control characters EXCEPT TAB (\x09), LF (\x0A),
    // and CR (\x0D). Some EMRs (older OSCAR PHP stack in particular)
    // store control chars verbatim and display them as literal boxes
    // or break parsing. Audit finding L2.
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
    // Hippo's own [[UNCERTAIN: ...]] tag — strip both wrapper and content
    // wrapper. We don't drop the content because that would silently delete
    // information; we just remove the markers so it pastes as plain text.
    .replace(/\[\[UNCERTAIN:\s*([^\]]+)\]\]/g, "$1")
    .replace(/\[\[INFERRED\]\]/gi, "")
    // Trim trailing whitespace per line (plays nicer with EMR diff tools)
    .split("\n").map((l) => l.replace(/[ \t]+$/g, "")).join("\n");
}
