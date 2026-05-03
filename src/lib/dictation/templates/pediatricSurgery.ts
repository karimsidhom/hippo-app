// ---------------------------------------------------------------------------
// Pediatric Surgery — procedure-specific dictation templates
// ---------------------------------------------------------------------------

import type { ProcedureTemplate } from "./types";

const ps = (
  partial: Pick<
    ProcedureTemplate,
    | "key"
    | "subcategory"
    | "procedureName"
    | "synonyms"
    | "matchPatterns"
    | "topMatter"
    | "findings"
    | "operativeSteps"
    | "devices"
    | "specimens"
    | "tubesAndDrains"
    | "complicationChecks"
    | "postopPlan"
    | "requiredFields"
  > & Partial<Pick<ProcedureTemplate, "billingPrompts" | "optionalFields" | "notes">>,
): ProcedureTemplate => ({ specialty: "pediatric-surgery", ...partial });

export const PYLOROMYOTOMY = ps({
  key: "pediatric-surgery.gi.pyloromyotomy",
  subcategory: "gi",
  procedureName: "Laparoscopic pyloromyotomy",
  synonyms: ["pyloromyotomy", "ramstedt pyloromyotomy", "hps surgery"],
  matchPatterns: [/\bpyloromyotom|\bramstedt|\bhypertrophic\s+pyloric/i],
  topMatter: {
    anesthesia: "General endotracheal; preoperative correction of hypochloremic, hypokalemic metabolic alkalosis MANDATORY before OR (Cl > 100, HCO3 < 30) — never operate on an unprepared infant.",
    position: "Supine on warming blanket; arms tucked at sides; mild reverse Trendelenburg.",
    prep: "Abdomen prepped with chlorhexidine; pre-incision cefazolin per weight.",
    ebl: "Minimal — under 5 mL.",
    disposition: "Pediatric ward; LOS 24-48 h; feeding initiation per protocol.",
  },
  findings: {
    headline: "Hypertrophic pyloric stenosis confirmed: pylorus thickness ___ mm, length ___ mm on preoperative ultrasound (criteria: thickness > 4 mm + length > 14 mm). Pyloromyotomy from prepyloric vein of Mayo to gastric antrum, complete to mucosal bulge with submucosal layer intact. No mucosal perforation (confirmed by air-injection test through OG tube).",
  },
  operativeSteps: {
    steps: [
      "Pneumoperitoneum established to 8-10 mmHg via 5 mm Veress at the umbilicus (lower pressure than adult to protect pediatric venous return).",
      "5 mm umbilical port placed; two 3 mm working ports under direct vision (right epigastric for atraumatic grasper, left for pyloromyotomy knife).",
      "Pylorus delivered into the operative field with atraumatic grasper.",
      "Avascular plane on the anterosuperior surface of the pylorus identified (avoiding the left gastric vessels superiorly and the right gastric / gastroduodenal vessels inferiorly).",
      "Pyloromyotomy made along the avascular plane: starting at the prepyloric vein of Mayo (junction with gastric antrum) and extending across the pylorus toward the duodenum, stopping 1-2 mm short of the duodenum (mucosal violation at the duodenal end is the most common complication).",
      "Initial pyloromyotomy with arrowhead pyloromyotomy knife or laparoscopic blade; depth incrementally increased through serosa + circular muscle.",
      "Pyloromyotomy spreader inserted; both edges separated until the mucosal layer bulges through (Ramstedt's principle — submucosal layer intact, circular + longitudinal muscle fibres separated).",
      "Mucosal integrity confirmed: 30-60 mL of air injected through the OG tube while observing the pyloromyotomy under irrigation — no air leak. (Methylene blue + saline alternative.)",
      "Hemostasis confirmed at the pyloromyotomy edges.",
    ],
    closure: "Pneumoperitoneum released. 5 mm umbilical port fascia closed with 3-0 Vicryl figure-of-eight. 3 mm port sites closed at skin only with 5-0 Monocryl + Dermabond.",
  },
  devices: {
    instruments: ["5 mm + 3 mm × 2 pediatric laparoscopic ports", "Pediatric 5 mm 30° laparoscope", "Atraumatic grasper", "Arrowhead pyloromyotomy knife / blade", "Pyloromyotomy spreader (Benson / Tan)"],
  },
  specimens: { default: "None — muscle is split, not excised." },
  tubesAndDrains: { default: "OG tube removed at end of case." },
  complicationChecks: [
    { label: "Mucosal perforation (~1-2% — recognised intraoperatively, repaired with 5-0 Vicryl interrupted)" },
    { label: "Incomplete pyloromyotomy (persistent vomiting requiring revision)" },
    { label: "Wound infection (rare in healthy infants)" },
    { label: "Postoperative emesis (common in first 24-48 h, typically self-resolves)" },
  ],
  postopPlan: {
    disposition: "Pediatric ward.",
    analgesia: "Acetaminophen 15 mg/kg q6h scheduled.",
    antibiotics: "Single perioperative dose only.",
    activity: "Standard infant care.",
    diet: "Pedialyte / Electrolyte solution at 4 hours post-op; if tolerated, advance to formula / breast milk over 24 h per stepwise protocol.",
    followup: ["Clinic at 2-4 weeks for weight + feeding tolerance check"],
    returnPrecautions: ["Persistent / projectile vomiting > 48 h", "Fever / wound concerns", "Poor feeding / dehydration"],
  },
  requiredFields: [
    { id: "weight_kg", label: "Weight (kg)", type: "number" },
    { id: "preop_electrolytes_corrected", label: "Pre-op electrolytes corrected (Cl > 100, HCO3 < 30)", type: "boolean" },
    { id: "pylorus_thickness_mm", label: "Pylorus thickness on US (mm)", type: "number" },
    { id: "pylorus_length_mm", label: "Pylorus length on US (mm)", type: "number" },
    { id: "approach", label: "Approach", type: "enum", options: ["Laparoscopic", "Open RUQ (Ramstedt)", "Periumbilical"] },
    { id: "mucosal_perforation", label: "Mucosal perforation (and repaired)", type: "boolean" },
  ],
});

export const UMBILICAL_HERNIA_REPAIR = ps({
  key: "pediatric-surgery.hernia.pediatric_umbilical_hernia",
  subcategory: "hernia",
  procedureName: "Pediatric umbilical hernia repair",
  synonyms: ["umbilical hernia repair", "pediatric umbilical hernia"],
  matchPatterns: [/\bumbilical\s+hernia(\s+repair)?/i],
  topMatter: {
    anesthesia: "General endotracheal (or LMA) + local 0.25% bupivacaine wound infiltration for postoperative analgesia.",
    position: "Supine.",
    prep: "Periumbilical region prepped with chlorhexidine; cefazolin per weight.",
    ebl: "Minimal.",
    disposition: "Same-day discharge after meeting recovery criteria.",
  },
  findings: {
    headline: "Periumbilical fascial defect measuring approximately ___ cm × ___ cm with [reducible / partially-reduced] hernia sac containing [omentum / preperitoneal fat]. No incarceration. Defect closed primarily with interrupted 0 / 2-0 Vicryl figure-of-eight sutures.",
  },
  operativeSteps: {
    steps: [
      "Curvilinear infraumbilical (or supraumbilical) skin incision in the natural skin crease.",
      "Subcutaneous tissue dissected with monopolar electrocautery to expose the hernia sac and surrounding fascia.",
      "Hernia sac dissected free of subcutaneous tissue circumferentially; contents reduced into the abdominal cavity.",
      "Sac excised at its base (or inverted into the abdomen for very small defects).",
      "Fascial defect identified; edges cleared of fat for 5 mm circumferentially to permit clean fascial-to-fascial approximation.",
      "Defect closed primarily with interrupted 0 / 2-0 Vicryl figure-of-eight sutures (typically 3-5 sutures depending on defect size).",
      "Closure tested for tension; reinforced with second layer of 3-0 Vicryl interrupted if needed.",
      "Umbilicus tacked to the underlying fascia with 4-0 Vicryl to recreate normal umbilical contour.",
      "Wound irrigated; hemostasis confirmed.",
    ],
    closure: "Subcutaneous tissue closed with 4-0 Vicryl interrupted. Skin closed with 5-0 Monocryl subcuticular + Steri-Strips. Pressure dressing.",
  },
  devices: {
    instruments: ["Standard pediatric tray", "Bipolar + monopolar electrocautery"],
    consumables: ["0 / 2-0 Vicryl × 3-5 for defect closure", "4-0 / 5-0 Monocryl for skin"],
  },
  specimens: { default: "Hernia sac to pathology if unusual gross appearance." },
  tubesAndDrains: { default: "Pressure dressing × 24 h." },
  complicationChecks: [
    { label: "Hematoma / seroma" },
    { label: "Wound infection" },
    { label: "Recurrence (< 1% in pediatric umbilical hernia repair)" },
    { label: "Suture extrusion" },
  ],
  postopPlan: {
    disposition: "Discharge home same-day.",
    analgesia: "Acetaminophen + ibuprofen scheduled (no codeine in pediatric per FDA).",
    antibiotics: "Single perioperative dose only.",
    activity: "No straddling toys / heavy play × 2 weeks; tub baths after 1 week.",
    followup: ["Clinic at 2-4 weeks for wound check"],
    returnPrecautions: ["Wound drainage / fever", "Recurrent bulge"],
  },
  requiredFields: [
    { id: "age_years", label: "Patient age (years)", type: "number" },
    { id: "defect_size_cm", label: "Defect size (cm × cm)", type: "text" },
    { id: "approach", label: "Approach", type: "enum", options: ["Open primary repair", "Mesh repair (rare in pediatric)", "Laparoscopic"] },
    { id: "incarceration", label: "Incarceration / strangulation present", type: "boolean" },
  ],
});

export const INTUSSUSCEPTION_REDUCTION = ps({
  key: "pediatric-surgery.acute_care.intussusception",
  subcategory: "acute-care",
  procedureName: "Operative reduction of intussusception",
  synonyms: ["intussusception reduction", "intussusception", "ileocolic intussusception"],
  matchPatterns: [/\bintussusception/i],
  topMatter: {
    anesthesia: "General endotracheal anesthesia.",
    position: "Supine.",
    prep: "Abdomen prepped widely; cefazolin + metronidazole if bowel resection anticipated.",
    ebl: "100-300 mL.",
    disposition: "Pediatric ward; LOS 2-4 days; feeding initiation per protocol.",
  },
  findings: {
    headline: "[Ileocolic / ileo-ileocolic / ileo-ileal] intussusception with ___ cm of bowel telescoped into distal segment. After [hydrostatic reduction failed / pneumatic enema failed / immediate operative indication]: [bowel viable after manual reduction with no resection / non-viable bowel requiring resection of ___ cm]. Pathologic lead point [identified — Meckel's diverticulum / lymphoma / polyp / not identified, idiopathic].",
  },
  operativeSteps: {
    steps: [
      "[Laparoscopic variant:] Pneumoperitoneum to 8-12 mmHg via 5 mm umbilical port; two 5 mm working ports.",
      "[Open variant:] Right lower quadrant transverse incision (Lanz / muscle-splitting); peritoneum entered.",
      "Intussusception identified; gentle 'milking' / squeezing technique used to push the intussusceptum back through the intussuscipiens (NEVER pulled — risks serosal tearing). Reduction performed retrograde from the apex of the intussusception backwards.",
      "Reduction success confirmed: bowel returns to normal anatomic configuration.",
      "Reduced bowel inspected: serosal blanching, viability assessed for 5-10 minutes.",
      "[If viable: no resection needed.] [If non-viable / lead point identified: ileocecectomy / segmental small bowel resection performed with stapled side-to-side functional end-to-end anastomosis.]",
      "Search for pathologic lead point (Meckel's diverticulum 2-4% of children, lymphoma in older children, polyp). If Meckel's identified, resection of Meckel's with adjacent ileum.",
      "Appendix typically removed at the same setting (incidental appendectomy reduces future diagnostic confusion in RLQ pain workup).",
      "Hemostasis confirmed.",
    ],
    closure: "Layered closure: muscle + fascia with 0 Vicryl; subcutaneous with 3-0 Vicryl; skin with 4-0 Monocryl subcuticular.",
  },
  devices: {
    instruments: ["Pediatric laparotomy / laparoscopy tray", "GIA stapler (for resection / anastomosis if needed)"],
  },
  specimens: { default: "Resected bowel + Meckel's diverticulum (if found) to permanent pathology." },
  tubesAndDrains: { default: "OG tube intraoperatively, removed at end of case if no resection; remains × 24 h if resection performed." },
  complicationChecks: [
    { label: "Recurrent intussusception (5-10%; usually within 24-48 h)" },
    { label: "Anastomotic leak (if resection performed)" },
    { label: "Ileus / SBO" },
    { label: "Wound infection (especially after bowel resection)" },
    { label: "Missed pathologic lead point" },
  ],
  postopPlan: {
    disposition: "Pediatric ward; LOS 2-4 days.",
    analgesia: "Multimodal: scheduled acetaminophen + ibuprofen.",
    antibiotics: "Single perioperative dose for reduction without resection; 24-48 h IV course for resection cases.",
    activity: "Up + ambulating POD 0-1.",
    diet: "NPO until return of bowel function (typically POD 1-2); advance per protocol.",
    followup: ["Clinic at 2 weeks", "Pathology review at 7-10 days"],
    returnPrecautions: ["Recurrent abdominal pain (recurrence)", "Bilious emesis (anastomotic complication)", "Currant-jelly stool (recurrence)", "Fever / wound concerns"],
  },
  requiredFields: [
    { id: "age_months", label: "Patient age (months)", type: "number" },
    { id: "type", label: "Type", type: "enum", options: ["Ileocolic", "Ileo-ileocolic", "Ileo-ileal", "Colocolic"] },
    { id: "preop_reduction_attempted", label: "Pre-op enema reduction attempted (success / fail)", type: "enum", options: ["Hydrostatic — successful (no surgery needed)", "Hydrostatic — failed", "Pneumatic — failed", "Not attempted (immediate surgical indication)"] },
    { id: "bowel_resection", label: "Bowel resection performed", type: "boolean" },
    { id: "lead_point_identified", label: "Pathologic lead point identified", type: "boolean" },
    { id: "lead_point_type", label: "Lead point type", type: "enum", options: ["Meckel's diverticulum", "Lymphoma", "Polyp", "HSP / hematoma", "Idiopathic (no lead point)", "Other"] },
  ],
});

export const PEG_TUBE = ps({
  key: "pediatric-surgery.gi.peg_tube",
  subcategory: "gi",
  procedureName: "Percutaneous endoscopic gastrostomy (PEG) tube placement",
  synonyms: ["peg tube", "g-tube", "gastrostomy tube"],
  matchPatterns: [/\bpeg\s+tube|\bg[-\s]?tube|\bgastrostomy\s+tube/i],
  topMatter: {
    anesthesia: "General endotracheal (pediatric); IV sedation acceptable for adults.",
    position: "Supine.",
    prep: "Abdomen + oral cavity prepped; cefazolin per weight.",
    ebl: "Minimal.",
    disposition: "Pediatric ward; LOS 24 h for first feed initiation.",
  },
  findings: {
    headline: "Pull-technique PEG placement: gastroscope advanced; transillumination through abdominal wall confirmed safe gastrostomy site (NO transverse colon between stomach + abdominal wall). [___ Fr] PEG tube placed; bumper position internal at gastric mucosa, external skin disc 1-2 cm from skin to allow for slight movement (avoid tissue compression / pressure necrosis).",
  },
  operativeSteps: {
    steps: [
      "Patient positioned supine; oral RAE ETT taped to lower lip; bite block placed.",
      "Pediatric / standard gastroscope (depending on patient size) advanced into the stomach. Stomach insufflated.",
      "Transillumination of the abdominal wall through the stomach + finger-pressure 'one-finger push' technique confirms a safe PEG site (gastric body lateral to spine, away from rib cage). MANDATORY: no transverse colon between stomach and abdominal wall (transcolonic placement is the most catastrophic complication, presenting as fistula).",
      "Skin marked at the planned PEG site; chlorhexidine prep + sterile drape.",
      "Local 1% lidocaine + epinephrine infiltrated; small skin incision (~5 mm) made with #11 blade.",
      "Trocar needle advanced through the abdominal wall under endoscopic visualisation into the stomach.",
      "Pull-string / J-shaped guide passed through the trocar into the stomach; grasped with endoscopic snare; pulled retrograde out through the mouth with the gastroscope.",
      "PEG tube ([___ Fr]) attached to the pull-string at the patient's mouth; pulled antegrade through the esophagus + stomach + abdominal wall, with the internal bumper coming to rest snugly against the gastric mucosa.",
      "External skin disc positioned 1-2 cm from the skin (allowing slight tube mobility — too tight causes pressure necrosis; too loose causes leakage).",
      "Endoscope re-advanced to confirm internal bumper position and absence of mucosal injury / bleeding.",
    ],
  },
  devices: {
    instruments: ["Pediatric / standard gastroscope (Olympus / Pentax)", "PEG kit (Bard Ponsky / Avanos / Gauss) with pull-string + trocar + tube + bumpers"],
    implants: ["[___ Fr] PEG tube (typical pediatric: 12-14 Fr; adult: 20-24 Fr)"],
  },
  specimens: { default: "None." },
  tubesAndDrains: { default: "PEG tube external skin disc 1-2 cm from skin." },
  complicationChecks: [
    { label: "Buried bumper syndrome (excessive tension on external disc — internal bumper migrates into gastric wall)" },
    { label: "Transcolonic / inadvertent organ placement (catastrophic; fistula)" },
    { label: "Leakage / wound infection" },
    { label: "Tube displacement (especially in first 4 weeks before tract maturation)" },
    { label: "Stomal granulation tissue (long-term)" },
  ],
  postopPlan: {
    disposition: "Pediatric ward; LOS 24 h.",
    analgesia: "Acetaminophen 15 mg/kg q6h scheduled.",
    antibiotics: "Single perioperative dose only.",
    activity: "Wound care: clean + dry × 1 week, then daily soap + water. No tub baths until tract matures (4-6 weeks).",
    diet: "NPO × 4 h, then water flush; if tolerated, formula at 24 h via PEG starting at slow rate, advanced over 24-48 h to goal feeds.",
    followup: ["Clinic at 4-6 weeks once tract has matured (ready for first tube exchange to a low-profile button)", "Family teaching: feeding regimen, flushing, granulation tissue management"],
    returnPrecautions: [
      "Tube dislodgement (especially in first 4 weeks — must replace within 2-4 h to prevent tract closure)",
      "Persistent leakage / infection",
      "Buried bumper symptoms (pain at site, refractory leakage)",
    ],
  },
  requiredFields: [
    { id: "weight_kg", label: "Patient weight (kg)", type: "number" },
    { id: "indication", label: "Indication", type: "enum", options: ["Failure to thrive / inability to feed orally", "Neurologic impairment + dysphagia", "Pre-radiation for head/neck malignancy", "Decompression (small bowel obstruction)"] },
    { id: "tube_size_fr", label: "PEG tube size (Fr)", type: "enum", options: ["12", "14", "18", "20", "24"] },
    { id: "technique", label: "Technique", type: "enum", options: ["Pull (Ponsky)", "Push (Sacks-Vine)", "Introducer (Russell)"] },
    { id: "transillumination_confirmed", label: "Transillumination + finger push confirmed", type: "boolean" },
  ],
});

export const PEDIATRIC_TEMPLATES: ProcedureTemplate[] = [
  PYLOROMYOTOMY,
  UMBILICAL_HERNIA_REPAIR,
  INTUSSUSCEPTION_REDUCTION,
  PEG_TUBE,
];
