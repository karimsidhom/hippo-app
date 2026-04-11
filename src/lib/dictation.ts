import type { CaseLog, SurgicalApproach, AutonomyLevel, AgeBin, OutcomeCategory, ComplicationCategory } from "@/lib/types";

// ---------------------------------------------------------------------------
// Readable-label maps
// ---------------------------------------------------------------------------

const AGE_BIN_LABELS: Record<AgeBin, string> = {
  UNDER_18: "pediatric (< 18 years)",
  AGE_18_30: "18–30 years",
  AGE_31_45: "31–45 years",
  AGE_46_60: "46–60 years",
  AGE_61_75: "61–75 years",
  OVER_75: "> 75 years",
  UNKNOWN: "age unknown",
};

const AUTONOMY_LABELS: Record<AutonomyLevel, string> = {
  OBSERVER: "Observer only",
  ASSISTANT: "First assistant",
  SUPERVISOR_PRESENT: "Primary surgeon with attending present",
  INDEPENDENT: "Independent operator",
  TEACHING: "Teaching / supervising trainee",
};

const APPROACH_LABELS: Record<SurgicalApproach, string> = {
  ROBOTIC: "Robotic-assisted laparoscopic",
  LAPAROSCOPIC: "Laparoscopic",
  OPEN: "Open",
  ENDOSCOPIC: "Endoscopic",
  HYBRID: "Hybrid (open/minimally invasive)",
  PERCUTANEOUS: "Percutaneous",
  OTHER: "Other",
};

const OUTCOME_LABELS: Record<OutcomeCategory, string> = {
  UNCOMPLICATED: "Uncomplicated",
  MINOR_COMPLICATION: "Minor complication",
  MAJOR_COMPLICATION: "Major complication",
  REOPERATION: "Reoperation required",
  DEATH: "Death",
  UNKNOWN: "Unknown",
};

const COMPLICATION_LABELS: Record<ComplicationCategory, string> = {
  NONE: "None",
  BLEEDING: "Bleeding",
  INFECTION: "Infection",
  ORGAN_INJURY: "Organ injury",
  ANASTOMOTIC_LEAK: "Anastomotic leak",
  DVT_PE: "DVT / Pulmonary embolism",
  ILEUS: "Ileus",
  CONVERSION: "Conversion to open",
  READMISSION: "Readmission",
  OTHER: "Other",
};

// ---------------------------------------------------------------------------
// Approach-specific "Description of Procedure" templates
// Modeled after Armenakas, Fracchia & Golan — Operative Dictations in
// Urologic Surgery (Wiley, 2019).
// ---------------------------------------------------------------------------

function procedureBody(c: CaseLog): string[] {
  const proc = c.procedureName;
  const procLower = proc.toLowerCase();

  switch (c.surgicalApproach) {
    case "ROBOTIC":
      return [
        `Description of Procedure: The indications, alternatives, benefits, and risks were discussed with the patient and informed consent was obtained.`,
        ``,
        `The patient was brought onto the operating room table, positioned [supine/dorsal lithotomy/lateral decubitus], and secured with a safety strap. All pressure points were carefully padded and pneumatic compression devices were placed on the lower extremities.`,
        ``,
        `After the administration of intravenous antibiotics and general endotracheal anesthesia, a ____ Fr urethral catheter was inserted into the bladder and connected to a drainage bag. [An orogastric/nasogastric tube was placed.]`,
        ``,
        `The patient was placed in [steep Trendelenburg/modified lithotomy/lateral decubitus] position. The abdomen [and genitalia] were prepped and draped in the standard sterile manner.`,
        ``,
        `A time-out was completed, verifying the correct patient, surgical procedure, site, and positioning, prior to beginning the procedure.`,
        ``,
        `Pneumoperitoneum was established using a [Veress needle inserted at the umbilicus/Hasson technique]. The intra-abdominal pressure was set at 15 mmHg. A 12 mm camera port was placed at [the umbilicus/____]. Under direct visualization, the following ports were placed:`,
        `  - 8 mm robotic port at [____]`,
        `  - 8 mm robotic port at [____]`,
        `  - 8 mm robotic port at [____]`,
        `  - 12 mm assistant port at [____]`,
        `  - [Additional ports as needed]`,
        ``,
        `The da Vinci [Xi/Si/SP] surgical system was docked.`,
        ``,
        `[Describe step-by-step operative technique for ${proc}:`,
        `  - Identification and mobilization of key anatomic structures`,
        `  - Development of surgical planes`,
        `  - Vascular control — ligation/division of vessels`,
        `  - Resection / reconstruction / repair`,
        `  - Specimen extraction (if applicable)`,
        `  - Drain placement (if applicable)]`,
        ``,
        `Hemostasis was confirmed and the operative field was irrigated with warm sterile saline.`,
        ``,
        `The robot was undocked. All ports were removed under direct visualization. Pneumoperitoneum was released. Fascial closure was performed at the [12 mm port sites] using [0 polyglactin (Vicryl)/polydioxanone (PDS)] sutures. The skin was approximated with [subcuticular 4-0 poliglecaprone (Monocryl) sutures/skin adhesive]. Sterile dressings were applied and the patient repositioned supine.`,
      ];

    case "LAPAROSCOPIC":
      return [
        `Description of Procedure: The indications, alternatives, benefits, and risks were discussed with the patient and informed consent was obtained.`,
        ``,
        `The patient was brought onto the operating room table, positioned [supine/lateral decubitus/lithotomy], and secured with a safety strap. All pressure points were carefully padded and pneumatic compression devices were placed on the lower extremities.`,
        ``,
        `After the administration of intravenous antibiotics and general endotracheal anesthesia, a ____ Fr urethral catheter was inserted into the bladder and connected to a drainage bag.`,
        ``,
        `The patient was placed in [Trendelenburg/modified lateral] position. The abdomen was prepped and draped in the standard sterile manner.`,
        ``,
        `A time-out was completed, verifying the correct patient, surgical procedure, site, and positioning, prior to beginning the procedure.`,
        ``,
        `Pneumoperitoneum was established using a [Veress needle/Hasson technique] at [the umbilicus/Palmer's point]. The intra-abdominal pressure was set at 15 mmHg. A [5/10/12] mm camera port was placed. Under direct visualization, additional working ports were placed:`,
        `  - ____ mm port at [____]`,
        `  - ____ mm port at [____]`,
        `  - ____ mm port at [____]`,
        ``,
        `[Describe step-by-step operative technique for ${proc}:`,
        `  - Identification and mobilization of key anatomic structures`,
        `  - Development of surgical planes`,
        `  - Vascular control — ligation/division of vessels`,
        `  - Resection / reconstruction / repair`,
        `  - Specimen extraction (if applicable)]`,
        ``,
        `Hemostasis was confirmed and the operative field was irrigated with warm sterile saline.`,
        ``,
        `All ports were removed under direct visualization. Pneumoperitoneum was released. Fascial closure was performed at port sites ≥ 10 mm. The skin was approximated with [subcuticular 4-0 Monocryl/skin adhesive]. Sterile dressings were applied.`,
      ];

    case "OPEN":
      return [
        `Description of Procedure: The indications, alternatives, benefits, and risks were discussed with the patient and informed consent was obtained.`,
        ``,
        `The patient was brought onto the operating room table, positioned [supine/lithotomy/lateral decubitus/prone], and secured with a safety strap. All pressure points were carefully padded and pneumatic compression devices were placed on the lower extremities.`,
        ``,
        `After the administration of intravenous antibiotics and [general endotracheal/spinal/regional] anesthesia, a ____ Fr urethral catheter was inserted into the bladder and connected to a drainage bag.`,
        ``,
        `The [abdomen/abdomen and genitalia/flank] were prepped and draped in the standard sterile manner.`,
        ``,
        `The radiographic images were in the room.`,
        ``,
        `A time-out was completed, verifying the correct patient, surgical procedure, site, and positioning, prior to beginning the procedure.`,
        ``,
        `A [midline/Pfannenstiel/lower midline/subcostal/flank/Gibson/inguinal] incision was made and carried down through the subcutaneous tissue using electrocautery. [The underlying fascia/rectus abdominis aponeurosis was identified and incised.] [The muscles were separated/divided and retracted laterally.] [The peritoneal cavity was entered / The retroperitoneal space was developed by sweeping the peritoneum medially.]`,
        ``,
        `A self-retaining retractor (e.g. Bookwalter, Balfour, Omni-Tract) was appropriately positioned to optimize exposure, using padding on each retractor blade.`,
        ``,
        `[Describe step-by-step operative technique for ${proc}:`,
        `  - Identification and mobilization of key anatomic structures`,
        `  - Exposure and dissection planes`,
        `  - Vascular control — ligation/division of vessels`,
        `  - Resection / reconstruction / repair`,
        `  - Drain placement (if applicable)]`,
        ``,
        `Hemostasis was confirmed and the operative field was irrigated with warm sterile saline. [Prior to closure, all visceral organs and vascular structures were inspected and found to be intact.]`,
        ``,
        `The self-retaining retractor was removed. The incision was closed using [running 1-0 polydioxanone (PDS)/polyglactin (Vicryl)] to approximate [the fascial layers/muscle layers individually]. 3-0 chromic sutures were used on Scarpa's fascia and the skin was approximated with a [subcuticular 4-0 poliglecaprone (Monocryl) suture/staples]. A sterile dressing was applied.`,
      ];

    case "ENDOSCOPIC":
      return [
        `Description of Procedure: The indications, alternatives, benefits, and risks were discussed with the patient and informed consent was obtained.`,
        ``,
        `The patient was brought onto the operating room table, positioned in [dorsal lithotomy/supine/left lateral decubitus], and secured with a safety strap. All pressure points were carefully padded and pneumatic compression devices were placed on the lower extremities.`,
        ``,
        `After the administration of intravenous antibiotics and [general/spinal/monitored anesthesia care], the [genitalia and perineum/abdomen] were prepped and draped in the standard sterile manner.`,
        ``,
        `A time-out was completed, verifying the correct patient, surgical procedure, site, and positioning, prior to beginning the procedure.`,
        ``,
        `A [rigid/flexible] [cystoscope/ureteroscope/resectoscope/nephroscope] was assembled, white-balanced, and connected to the [camera/light source/irrigation].`,
        ``,
        `The [cystoscope/ureteroscope] was introduced per urethra under direct vision. [The urethra was normal in caliber and appearance.] A systematic inspection of the [bladder/ureteral orifices/prostatic urethra] was performed.`,
        ``,
        `[Describe step-by-step endoscopic procedure for ${proc}:`,
        `  - Findings on inspection`,
        `  - Identification of pathology/anatomy`,
        `  - Intervention performed (resection, biopsy, laser, stent, extraction, etc.)`,
        `  - Use of guidewires, access sheaths, baskets, or energy devices`,
        `  - Fluoroscopic confirmation (if applicable)]`,
        ``,
        `At the conclusion of the procedure, the [bladder/ureter/renal pelvis] was inspected and found to be [intact/hemostatic].`,
        ``,
        `[A ____ Fr × ____ cm ureteral stent was placed with the proximal coil in the renal pelvis and the distal coil in the bladder. Correct positioning was confirmed fluoroscopically.]`,
        ``,
        `[A ____ Fr urethral catheter was/was not placed and connected to a drainage bag.]`,
      ];

    case "PERCUTANEOUS":
      return [
        `Description of Procedure: The indications, alternatives, benefits, and risks were discussed with the patient and informed consent was obtained.`,
        ``,
        `The patient was brought onto the operating room table, positioned [prone/supine/lateral decubitus], and secured with a safety strap. All pressure points were carefully padded and pneumatic compression devices were placed on the lower extremities.`,
        ``,
        `After the administration of intravenous antibiotics and [general endotracheal/local with monitored anesthesia care], the [flank/back/abdomen] was prepped and draped in the standard sterile manner.`,
        ``,
        `A time-out was completed, verifying the correct patient, surgical procedure, site, and positioning, prior to beginning the procedure.`,
        ``,
        `Under [fluoroscopic/ultrasound/CT] guidance, percutaneous access was obtained at [the posterior calyx/lower pole/____] using an 18-gauge [diamond-tipped/Chiba] needle. [Opacified urine was aspirated, confirming entry into the collecting system.] A [0.035-inch/0.038-inch] guidewire was advanced [down the ureter into the bladder/into the renal pelvis].`,
        ``,
        `The tract was serially dilated to [24/26/30] Fr using [Amplatz/balloon] dilators and an [Amplatz/access] sheath was placed.`,
        ``,
        `[Describe step-by-step percutaneous procedure for ${proc}:`,
        `  - Nephroscopy findings`,
        `  - Stone fragmentation (ultrasonic/laser/pneumatic lithotripsy)`,
        `  - Fragment extraction and irrigation`,
        `  - Fluoroscopic confirmation of clearance`,
        `  - OR: Drainage/biopsy/ablation technique]`,
        ``,
        `[A ____ Fr nephrostomy tube/re-entry catheter was placed and secured to the skin with a 2-0 silk suture. It was connected to a drainage bag.]`,
        ``,
        `[A ____ Fr urethral catheter was placed and connected to a drainage bag.]`,
      ];

    case "HYBRID":
      return [
        `Description of Procedure: The indications, alternatives, benefits, and risks were discussed with the patient and informed consent was obtained.`,
        ``,
        `The patient was brought onto the operating room table, positioned [____], and secured with a safety strap. All pressure points were carefully padded and pneumatic compression devices were placed on the lower extremities.`,
        ``,
        `After the administration of intravenous antibiotics and general endotracheal anesthesia, a ____ Fr urethral catheter was inserted into the bladder and connected to a drainage bag.`,
        ``,
        `The [abdomen/operative field] was prepped and draped in the standard sterile manner.`,
        ``,
        `A time-out was completed, verifying the correct patient, surgical procedure, site, and positioning, prior to beginning the procedure.`,
        ``,
        `A combined open and minimally invasive approach was utilized.`,
        ``,
        `[Describe which portions were performed open vs laparoscopic/robotic for ${proc}:`,
        `  - Rationale for hybrid approach`,
        `  - Open component: incision, exposure, technique`,
        `  - Minimally invasive component: port placement, pneumoperitoneum, technique`,
        `  - Coordination between phases]`,
        ``,
        `Hemostasis was confirmed. The wounds were closed in standard fashion. Sterile dressings were applied.`,
      ];

    default: // OTHER
      return [
        `Description of Procedure: The indications, alternatives, benefits, and risks were discussed with the patient and informed consent was obtained.`,
        ``,
        `The patient was brought onto the operating room table, positioned [____], and secured with a safety strap. All pressure points were carefully padded and pneumatic compression devices were placed on the lower extremities.`,
        ``,
        `After the administration of intravenous antibiotics and [general/spinal/regional/local] anesthesia, the operative field was prepped and draped in the standard sterile manner.`,
        ``,
        `A time-out was completed, verifying the correct patient, surgical procedure, site, and positioning, prior to beginning the procedure.`,
        ``,
        `[Describe surgical access and step-by-step operative technique for ${proc}.]`,
        ``,
        `Hemostasis was confirmed. The wound was closed in standard fashion. Sterile dressings were applied.`,
      ];
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateDictation(c: CaseLog): string {
  const lines: string[] = [];

  // ── Header ──
  lines.push("OPERATIVE REPORT");
  lines.push("=".repeat(60));
  lines.push("");

  // ── Standard header fields (Armenakas format) ──
  lines.push(`Preoperative Diagnosis: ${c.diagnosisCategory || "[____]"}`);
  lines.push(`Postoperative Diagnosis: [Same / ____]`);
  lines.push(`Procedure: ${APPROACH_LABELS[c.surgicalApproach]} ${c.procedureName}`);
  lines.push(`Date of Procedure: ${formatDate(c.caseDate)}`);

  // Surgeon info
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
  lines.push(`Indications: The patient is a ____-year-old [male/female] (age group: ${AGE_BIN_LABELS[c.patientAgeBin]}) with ${c.diagnosisCategory || "[diagnosis]"} presenting for ${c.procedureName.toLowerCase().startsWith("a") || c.procedureName.toLowerCase().startsWith("e") || c.procedureName.toLowerCase().startsWith("i") || c.procedureName.toLowerCase().startsWith("o") || c.procedureName.toLowerCase().startsWith("u") ? "an" : "a"} ${c.procedureName.toLowerCase()}. [Describe clinical indication, relevant workup, imaging, and rationale for operative management.]`);

  lines.push("");

  // ── Description of Procedure ──
  const body = procedureBody(c);
  for (const line of body) {
    lines.push(line);
  }

  lines.push("");

  // ── Complications ──
  if (c.complicationCategory === "NONE" && c.outcomeCategory === "UNCOMPLICATED") {
    lines.push("Complications: None.");
  } else {
    lines.push(`Complications: ${OUTCOME_LABELS[c.outcomeCategory]}. ${COMPLICATION_LABELS[c.complicationCategory]}.`);
    if (c.conversionOccurred) {
      lines.push("Note: Conversion to open approach was required during this case.");
    }
    lines.push("[Describe complication details and intraoperative management.]");
  }

  lines.push("");

  // ── Closing ──
  lines.push("At the end of the procedure, all counts were correct.");
  lines.push("The patient tolerated the procedure well and was taken to the recovery room in satisfactory condition.");
  lines.push("");
  lines.push("Estimated Blood Loss: Approximately ________ ml");
  lines.push("Specimens: [Describe specimens sent to pathology, or 'None']");
  lines.push("Drains: [Describe type and location of drains, or 'None']");
  lines.push("Implants/Devices: [Describe any implants, stents, mesh, or prostheses, or 'None']");

  // ── Surgeon's Notes (from app) ──
  if (c.notes) {
    lines.push("");
    lines.push("--- OPERATIVE NOTES ---");
    lines.push(c.notes);
  }

  // ── Reflection (trainee-specific) ──
  if (c.reflection) {
    lines.push("");
    lines.push("--- TRAINEE REFLECTION ---");
    lines.push(c.reflection);
  }

  // ── Case Metrics (trainee-specific) ──
  lines.push("");
  lines.push("--- CASE METRICS ---");
  lines.push(`Difficulty: ${c.difficultyScore} / 5`);
  lines.push(`Autonomy: ${AUTONOMY_LABELS[c.autonomyLevel]}`);

  // ── Footer ──
  lines.push("");
  lines.push("=".repeat(60));
  lines.push("END OF OPERATIVE REPORT");

  return lines.join("\n");
}
