// ---------------------------------------------------------------------------
// Template-driven dictation renderer
//
// Takes a ProcedureTemplate + CaseLog and produces a full, procedure-
// specific operative note. Sections render in attending-dictation order
// (matches the user's reference examples: DATE → SURGEON → ASSISTANT →
// preop dx → postop dx → procedure(s) → clinical preamble → findings →
// specimen → EBL → drains → anesthesia → complications → operative
// procedure → disposition).
// ---------------------------------------------------------------------------

import type { CaseLog } from "@/lib/types";
import type { ProcedureTemplate } from "./types";
import { formatDate, article } from "../shared/format";
import { AGE_BIN_LABELS } from "../shared/labels";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Pick a section text from a template field that supports alternates. */
function pickAlternate(
  procedureName: string,
  defaultText: string,
  alternates?: Array<{ when: RegExp; text: string }>,
): string {
  if (!alternates) return defaultText;
  const lower = (procedureName || "").toLowerCase();
  for (const alt of alternates) {
    if (alt.when.test(lower)) return alt.text;
  }
  return defaultText;
}

/** Split multi-procedure case names into a numbered list. */
function splitProcedures(name: string): string[] {
  if (!name) return [""];
  const parts = name
    .split(/\s+with\s+|\s+and\s+|\s*\+\s*|\s*;\s*|\s*\/\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length <= 1) return [name.trim()];
  return parts.map((p) =>
    p.length > 0 ? p[0].toUpperCase() + p.slice(1) : p,
  );
}

function defaultComplications(c: CaseLog): string {
  if (c.complicationCategory === "NONE" && c.outcomeCategory === "UNCOMPLICATED") {
    return "None.";
  }
  return `${c.outcomeCategory.replace(/_/g, " ").toLowerCase()}: ${c.complicationCategory.replace(/_/g, " ").toLowerCase()}.${
    c.conversionOccurred ? " Conversion to open approach was required." : ""
  }`;
}

function resolveSurgeonRoles(c: CaseLog): { surgeon: string; assistant: string } {
  const attending = c.attendingLabel?.trim() || "[Attending]";
  const traineeRole = c.role || "Trainee";
  const indep =
    c.autonomyLevel === "INDEPENDENT" || c.autonomyLevel === "TEACHING";
  if (indep) {
    return { surgeon: traineeRole, assistant: attending };
  }
  return { surgeon: attending, assistant: traineeRole };
}

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------

export function renderTemplate(
  template: ProcedureTemplate,
  c: CaseLog,
): string {
  const { surgeon, assistant } = resolveSurgeonRoles(c);
  const procedureName = c.procedureName || template.procedureName;
  const procedureList = splitProcedures(procedureName);
  const isMulti = procedureList.length > 1;
  const procArticle = article(procedureName);
  const lines: string[] = [];

  // ── Header trio ──
  lines.push(`DATE OF PROCEDURE: ${formatDate(c.caseDate)}.`);
  lines.push("");
  lines.push(`SURGEON: ${surgeon}`);
  lines.push("");
  lines.push(`ASSISTANT: ${assistant}`);
  lines.push("");

  // ── Diagnoses ──
  const preopDx = c.diagnosisCategory?.trim() || "[Preoperative diagnosis]";
  lines.push(`PREOPERATIVE DIAGNOSIS: ${preopDx}.`);
  lines.push("");
  lines.push(`POSTOPERATIVE DIAGNOSIS: Same as above.`);
  lines.push("");

  // ── Procedure(s) Performed ──
  if (isMulti) {
    lines.push("PROCEDURES PERFORMED:");
    for (let i = 0; i < procedureList.length; i++) {
      lines.push(`${i + 1}. ${procedureList[i]}.`);
    }
  } else {
    lines.push(`PROCEDURE PERFORMED: ${procedureList[0]}.`);
  }
  lines.push("");

  // ── Clinical Preamble ──
  lines.push("CLINICAL PREAMBLE:");
  lines.push(
    `The patient is a [age]-year-old [male/female] (age group: ${AGE_BIN_LABELS[c.patientAgeBin]}) with ${
      c.diagnosisCategory?.trim() || "[clinical diagnosis]"
    }. [Add relevant history: past medical / surgical history, prior imaging, recent labs, presentation evolution that led to this OR.] The decision was made to proceed with ${procArticle} ${procedureName.toLowerCase()}. The risks, benefits, and alternatives of the procedure were discussed with the patient and informed consent was obtained.`,
  );
  lines.push("");

  // ── Findings ──
  lines.push("FINDINGS:");
  lines.push(template.findings.headline);
  for (const supp of template.findings.supporting ?? []) {
    lines.push(supp);
  }
  lines.push("");

  // ── Specimen ──
  const specimens = pickAlternate(
    procedureName,
    template.specimens.default,
    template.specimens.alternates,
  );
  const specimensIsList = /;|\band\b/i.test(specimens) && !/none/i.test(specimens);
  lines.push(`${specimensIsList ? "SPECIMENS" : "SPECIMEN"}: ${specimens}`);
  lines.push("");

  // ── EBL / Drains / Anesthesia / Complications ──
  lines.push(`ESTIMATED BLOOD LOSS: ${template.topMatter.ebl ?? "Minimal."}`);
  lines.push("");
  const drains = pickAlternate(
    procedureName,
    template.tubesAndDrains.default,
    template.tubesAndDrains.alternates,
  );
  lines.push(`DRAINS: ${drains}`);
  lines.push("");
  lines.push(`ANESTHESIA: ${template.topMatter.anesthesia}`);
  lines.push("");
  lines.push(`COMPLICATIONS: ${defaultComplications(c)}`);
  if (template.complicationChecks.length > 0) {
    const checks = template.complicationChecks
      .map((cc) => `${cc.label}: ${cc.defaultStatus ?? "None observed."}`)
      .join(" ");
    lines.push(checks);
  }
  lines.push("");

  // ── Operative Procedure ──
  lines.push("OPERATIVE PROCEDURE:");
  if (template.operativeSteps.setup) {
    lines.push(template.operativeSteps.setup);
  } else {
    // Universal setup paragraph when the template doesn't supply one.
    lines.push(
      `The patient was brought to the operating room and identified using a WHO Surgical Safety Checklist time-out confirming patient identity, procedure, site, side, allergies, and antibiotic timing. ${
        template.topMatter.position
          ? template.topMatter.position
          : "Positioning was confirmed appropriate for the planned procedure with all pressure points padded."
      } ${
        template.topMatter.prep ??
        "The operative field was prepped with chlorhexidine and draped in the usual sterile fashion."
      } Pre-incision antibiotic prophylaxis was administered within 60 minutes per SCIP guidelines.`,
    );
  }
  for (let i = 0; i < template.operativeSteps.steps.length; i++) {
    lines.push(`${i + 1}. ${template.operativeSteps.steps[i]}`);
  }
  if (template.operativeSteps.closure) {
    lines.push(template.operativeSteps.closure);
  }
  lines.push("");

  // ── Devices / Implants ──
  // Render only if the template declared something — otherwise this section
  // would just be a clutter line.
  const devicesLines: string[] = [];
  if (template.devices.instruments.length > 0) {
    devicesLines.push(
      `Instruments: ${template.devices.instruments.join("; ")}.`,
    );
  }
  if (template.devices.implants && template.devices.implants.length > 0) {
    devicesLines.push(
      `Implants left in patient: ${template.devices.implants.join("; ")}.`,
    );
  }
  if (template.devices.consumables && template.devices.consumables.length > 0) {
    devicesLines.push(
      `Consumables: ${template.devices.consumables.join("; ")}.`,
    );
  }
  if (devicesLines.length > 0) {
    lines.push("DEVICES / IMPLANTS:");
    for (const dl of devicesLines) lines.push(dl);
    lines.push("");
  }

  // ── Disposition + Postoperative Plan ──
  lines.push("DISPOSITION:");
  lines.push(template.topMatter.disposition);
  lines.push("");

  lines.push("POSTOPERATIVE PLAN:");
  lines.push(`- Disposition: ${template.postopPlan.disposition}`);
  if (template.postopPlan.catheter) {
    lines.push(`- Catheter / drain: ${template.postopPlan.catheter}`);
  }
  if (template.postopPlan.analgesia) {
    lines.push(`- Analgesia: ${template.postopPlan.analgesia}`);
  }
  if (template.postopPlan.antibiotics) {
    lines.push(`- Antibiotics: ${template.postopPlan.antibiotics}`);
  }
  if (template.postopPlan.activity) {
    lines.push(`- Activity: ${template.postopPlan.activity}`);
  }
  if (template.postopPlan.diet) {
    lines.push(`- Diet: ${template.postopPlan.diet}`);
  }
  if (template.postopPlan.followup.length > 0) {
    lines.push(`- Follow-up: ${template.postopPlan.followup.join("; ")}.`);
  }
  if (
    template.postopPlan.returnPrecautions &&
    template.postopPlan.returnPrecautions.length > 0
  ) {
    lines.push(
      `- Return precautions: ${template.postopPlan.returnPrecautions.join("; ")}.`,
    );
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Genericness scorer
//
// Scans a rendered note for hallmarks of a too-generic dictation. Higher
// score = more generic. Anything > 0.5 should trigger a regeneration.
// ---------------------------------------------------------------------------

const GENERIC_PHRASES = [
  /the procedure was performed in the usual fashion/i,
  /hemostasis was achieved/i,
  /the patient tolerated the procedure well/i,
  /the case was completed without complication/i,
  /standard fashion/i,
  /as per standard/i,
];

const PROCEDURE_SPECIFIC_MARKERS = [
  /\d+\s?Fr\b/i,
  /\d+\s?cm\b/i,
  /\d+\s?mm\b/i,
  /\d+\s?G\b/,
  /\d+-?\d+\s?Vicryl|Monocryl|PDS|Prolene|silk|nylon|chromic/i,
  /Sensor wire|Glidewire|Polaris|UroJet|Omnipaque/i,
  /endo[ -]?gia|stapler|enucleation|anastomosis/i,
];

export interface GenericnessReport {
  score: number;
  reason: string[];
  procedureSpecificHits: number;
  genericHits: number;
  wordCount: number;
}

export function scoreGenericness(text: string): GenericnessReport {
  const reasons: string[] = [];
  let genericHits = 0;
  for (const re of GENERIC_PHRASES) {
    if (re.test(text)) genericHits++;
  }
  let procHits = 0;
  for (const re of PROCEDURE_SPECIFIC_MARKERS) {
    if (re.test(text)) procHits++;
  }
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < 350) reasons.push(`Short note (${wordCount} words)`);
  if (genericHits > 2) reasons.push(`${genericHits} generic phrases`);
  if (procHits < 3) reasons.push(`Only ${procHits} procedure-specific markers`);

  // Score: weight wordCount, generic phrases, marker count.
  const lengthScore = wordCount < 250 ? 1 : wordCount < 400 ? 0.6 : 0.2;
  const phraseScore = Math.min(1, genericHits / 4);
  const markerScore = procHits >= 5 ? 0 : procHits >= 3 ? 0.3 : 0.7;
  const score = Math.min(
    1,
    lengthScore * 0.4 + phraseScore * 0.3 + markerScore * 0.3,
  );
  return {
    score,
    reason: reasons,
    procedureSpecificHits: procHits,
    genericHits,
    wordCount,
  };
}
