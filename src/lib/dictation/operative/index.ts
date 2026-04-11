import type { CaseLog } from "@/lib/types";
import type { LengthLevel, ServiceKey } from "../types";
import { formatDate, article } from "../shared/format";
import {
  APPROACH_LABELS,
  AUTONOMY_LABELS,
  AGE_BIN_LABELS,
  OUTCOME_LABELS,
  COMPLICATION_LABELS,
} from "../shared/labels";
import { generalSurgeryBody } from "./generalSurgery";
import { vascularBody } from "./vascular";
import { obgynBody } from "./obgyn";
import { urologyBody } from "./urology";
import { plasticsBody } from "./plastics";
import { orthopedicsBody } from "./orthopedics";
import { neurosurgeryBody } from "./neurosurgery";
import { entBody } from "./ent";
import { pediatricSurgeryBody } from "./pediatricSurgery";
import { cardiothoracicBody } from "./cardiothoracic";
import { genericProcedureBody } from "./generic";
import { getStyleProfile } from "../style/store";
import { applyStyleProfile } from "../style/apply";

// ---------------------------------------------------------------------------
// Router — pick the right specialty body for a CaseLog.
// ---------------------------------------------------------------------------

export function resolveServiceFromCase(c: CaseLog): ServiceKey {
  const s = (c.specialtyName || "").toLowerCase();
  if (s.includes("vascular")) return "vascular";
  if (
    s.includes("obgyn") ||
    s.includes("ob-gyn") ||
    s.includes("ob/gyn") ||
    s.includes("obstetric") ||
    s.includes("gynec")
  ) {
    return "obgyn";
  }
  if (s.includes("pediatric")) return "pediatric-surgery";
  if (s.includes("cardio") || s.includes("thoracic") || s.includes("ct surg")) {
    return "cardiothoracic";
  }
  if (s.includes("general surgery")) return "general-surgery";
  if (s.includes("urology") || s.includes("urologic")) return "urology";
  if (s.includes("plastic")) return "plastics";
  if (s.includes("ortho")) return "orthopedics";
  if (s.includes("neuro")) return "neurosurgery";
  if (s.includes("ent") || s.includes("otolaryng") || s.includes("head and neck")) {
    return "ent";
  }
  return "unknown";
}

function bodyForCase(c: CaseLog, service: ServiceKey): string[] {
  switch (service) {
    case "general-surgery":
      return generalSurgeryBody(c);
    case "vascular":
      return vascularBody(c);
    case "obgyn":
      return obgynBody(c);
    case "urology":
      return urologyBody(c);
    case "plastics":
      return plasticsBody(c);
    case "orthopedics":
      return orthopedicsBody(c);
    case "neurosurgery":
      return neurosurgeryBody(c);
    case "ent":
      return entBody(c);
    case "pediatric-surgery":
      return pediatricSurgeryBody(c);
    case "cardiothoracic":
      return cardiothoracicBody(c);
    default:
      return genericProcedureBody(c);
  }
}

// ---------------------------------------------------------------------------
// Full operative report — same shape as the original generateDictation(),
// now routed through the service registry.
// ---------------------------------------------------------------------------

export function buildOperativeNote(
  c: CaseLog,
  opts: { length?: LengthLevel } = {},
): string {
  const length = opts.length ?? "full";
  const service = resolveServiceFromCase(c);
  const lines: string[] = [];

  // ── Header ──
  lines.push("OPERATIVE REPORT");
  lines.push("=".repeat(60));
  lines.push("");

  lines.push(`Preoperative Diagnosis: ${c.diagnosisCategory || "[____]"}`);
  lines.push(`Postoperative Diagnosis: [Same / ____]`);
  lines.push(`Procedure: ${APPROACH_LABELS[c.surgicalApproach]} ${c.procedureName}`);
  lines.push(`Date of Procedure: ${formatDate(c.caseDate)}`);

  if (c.attendingLabel) {
    lines.push(`Attending Surgeon: ${c.attendingLabel}`);
  }
  lines.push(`Trainee Role: ${c.role} — ${AUTONOMY_LABELS[c.autonomyLevel]}`);

  if (c.institutionSite) {
    lines.push(`Institution: ${c.institutionSite}`);
  }
  if (c.specialtyName) {
    lines.push(`Service: ${c.specialtyName}`);
  }

  lines.push("");

  // ── Indications ──
  const procArticle = article(c.procedureName);
  lines.push(
    `Indications: The patient is a ____-year-old [male/female] (age group: ${AGE_BIN_LABELS[c.patientAgeBin]}) with ${
      c.diagnosisCategory || "[diagnosis]"
    } presenting for ${procArticle} ${c.procedureName.toLowerCase()}. [Describe clinical indication, relevant workup, imaging, and rationale for operative management.]`,
  );
  lines.push("");

  // ── Body ──
  if (length === "handover") {
    // Handover version: one-screen summary, no operative detail.
    lines.push(
      `Summary: ${APPROACH_LABELS[c.surgicalApproach]} ${c.procedureName}. Attending ${c.attendingLabel ?? "[attending]"}. Trainee role: ${AUTONOMY_LABELS[c.autonomyLevel]}. EBL [___]. Specimens [___]. Drains [___]. Complications: ${OUTCOME_LABELS[c.outcomeCategory]} / ${COMPLICATION_LABELS[c.complicationCategory]}. Disposition: recovery in stable condition.`,
    );
  } else {
    const body = bodyForCase(c, service);
    for (const line of body) lines.push(line);
  }

  lines.push("");

  // ── Complications ──
  if (c.complicationCategory === "NONE" && c.outcomeCategory === "UNCOMPLICATED") {
    lines.push("Complications: None.");
  } else {
    lines.push(
      `Complications: ${OUTCOME_LABELS[c.outcomeCategory]}. ${COMPLICATION_LABELS[c.complicationCategory]}.`,
    );
    if (c.conversionOccurred) {
      lines.push("Note: Conversion to open approach was required during this case.");
    }
    lines.push("[Describe complication details and intraoperative management.]");
  }

  lines.push("");

  // ── Closing ──
  if (length !== "concise") {
    lines.push("At the end of the procedure, all counts were correct.");
    lines.push(
      "The patient tolerated the procedure well and was taken to the recovery room in satisfactory condition.",
    );
    lines.push("");
  }

  lines.push("Estimated Blood Loss: Approximately ________ ml");
  lines.push("Specimens: [Describe specimens sent to pathology, or 'None']");
  lines.push("Drains: [Describe type and location of drains, or 'None']");
  if (length === "full") {
    lines.push("Implants/Devices: [Describe any implants, stents, mesh, or prostheses, or 'None']");
  }

  // ── Notes / reflection ──
  if (c.notes) {
    lines.push("");
    lines.push("--- OPERATIVE NOTES ---");
    lines.push(c.notes);
  }

  if (length === "full" && c.reflection) {
    lines.push("");
    lines.push("--- TRAINEE REFLECTION ---");
    lines.push(c.reflection);
  }

  if (length === "full") {
    lines.push("");
    lines.push("--- CASE METRICS ---");
    lines.push(`Difficulty: ${c.difficultyScore} / 5`);
    lines.push(`Autonomy: ${AUTONOMY_LABELS[c.autonomyLevel]}`);
  }

  lines.push("");
  lines.push("=".repeat(60));
  lines.push("END OF OPERATIVE REPORT");

  // Apply the learned style profile (if any) as the last step.
  const profile = getStyleProfile();
  return applyStyleProfile(lines.join("\n"), profile);
}

/**
 * Legacy entry point — preserved so existing consumers keep working.
 * Produces the full-length operative report.
 */
export function generateDictation(c: CaseLog): string {
  return buildOperativeNote(c, { length: "full" });
}
