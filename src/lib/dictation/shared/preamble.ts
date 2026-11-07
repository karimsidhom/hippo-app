import type { CaseLog } from "@/lib/types";

// ---------------------------------------------------------------------------
// Shared operative preambles
//
// These ripple across every dictation in every specialty. Upgrading them
// upgrades thousands of generated reports at once, which is why each one is
// written to read like a textbook setup paragraph: anesthesia + monitoring
// + DVT prophylaxis + antibiotic timing + WHO surgical safety checklist
// time-out + prep with rationale + drape + entry technique.
// ---------------------------------------------------------------------------

/**
 * Standard open laparotomy preamble — consent, positioning, anesthesia,
 * Foley, antibiotics, time-out, incision & entry into the peritoneum.
 */
export function laparotomyPreamble(_c: CaseLog, incision: string): string[] {
  return [
    `Description of Procedure: The risks, benefits, and alternatives — including infection, bleeding, conversion to open if minimally invasive was attempted, injury to adjacent structures, and need for re-operation — were discussed in detail with the patient (or surrogate). All questions were answered, and informed consent was obtained. The patient was brought to the operating room and placed supine on the operating table with arms abducted at no greater than 90° to avoid brachial plexopathy. All pressure points (heels, sacrum, occiput, elbows) were padded. Sequential compression devices were applied to both lower extremities for VTE prophylaxis (Caprini risk-stratified protocol — pharmacologic prophylaxis with enoxaparin or heparin started preoperatively for higher-risk patients per ACS guidelines).`,
    ``,
    `After preoxygenation, induction of general endotracheal anesthesia was completed without difficulty. A nasogastric or orogastric tube was placed for stomach decompression as indicated. A Foley catheter was placed sterilely for bladder decompression and intraoperative urine output monitoring. Pre-incision antibiotic prophylaxis was administered within 60 minutes of incision (cefazolin 2 g IV — or 3 g for BMI > 80 kg, redosed every 4 hours of operative time per SCIP guidelines; alternative for penicillin-allergic patients per institutional pathway). Active warming (Bair Hugger) was instituted to maintain perioperative normothermia.`,
    ``,
    `A surgical time-out was performed using the WHO Surgical Safety Checklist with all team members participating, confirming patient identity, procedure, site and side, consent, antibiotic administration and timing, blood products availability, allergies, anticipated equipment needs, and critical airway/anaphylaxis concerns. The abdomen was prepped with 2% chlorhexidine gluconate / 70% isopropyl alcohol scrub from nipples to mid-thighs (or per institutional protocol for the planned incision), allowing 3 minutes of dry contact time. The patient was draped in the usual sterile fashion to expose the planned operative field.`,
    ``,
    `A ${incision} skin incision was made with a #10 blade and carried down through the subcutaneous tissue with electrocautery. The fascia was identified and divided in the same orientation as the skin incision, with care to identify and preserve any neurovascular structures crossing the incision. The peritoneum was elevated between two clamps and entered sharply with a #15 blade — taking care to avoid injury to the underlying viscera (especially when prior surgery has predisposed to adhesions). The abdomen was systematically explored from the right upper quadrant clockwise through left upper quadrant, left lower quadrant, pelvis, right lower quadrant, and back; findings are detailed above.`,
    ``,
  ];
}

/**
 * Standard laparoscopic / robotic preamble. Caller supplies the port list.
 */
export function laparoscopicPreamble(
  c: CaseLog,
  opts: { ports: string[]; foley?: boolean },
): string[] {
  const lines = [
    `Description of Procedure: The risks, benefits, and alternatives — including conversion to open laparotomy, injury to bowel/vessels/adjacent organs, bleeding, infection, and gas-related complications — were discussed in detail with the patient and informed consent was obtained. The patient was brought to the operating room and placed supine on the operating table with arms tucked at the sides (or one arm out for vascular access as indicated). All pressure points were padded carefully. Sequential compression devices were applied bilaterally for VTE prophylaxis (Caprini-stratified pharmacologic prophylaxis added preoperatively for higher-risk patients per ACS NSQIP guidelines). Active warming with a forced-air blanket maintained perioperative normothermia.`,
    ``,
    `After preoxygenation, induction of general endotracheal anesthesia was completed without difficulty. An orogastric tube was placed to decompress the stomach (essential to avoid gastric injury during Veress / Hasson entry). Pre-incision antibiotic prophylaxis was administered within 60 minutes of incision per SCIP guidelines. The patient was secured to the table with a beanbag or table straps to permit steep Trendelenburg or reverse Trendelenburg positioning during the case without slippage.`,
  ];
  if (opts.foley) {
    lines.push(``, `A Foley catheter was placed sterilely to decompress the bladder for intraoperative monitoring of urine output and to keep the bladder out of the operative field.`);
  }
  lines.push(
    ``,
    `A surgical time-out was performed using the WHO Surgical Safety Checklist, confirming patient identity, procedure, site and side, consent, antibiotic timing, blood products, allergies, equipment availability, and anticipated critical events. The abdomen was prepped from xiphoid to mid-thigh with 2% chlorhexidine gluconate / 70% isopropyl alcohol scrub (3 minutes dry contact time) and draped in the usual sterile fashion.`,
    ``,
    `Pneumoperitoneum was established via a ${
      c.surgicalApproach === "ROBOTIC"
        ? "Hasson cut-down technique at the umbilicus (preferred for robotic cases due to wider initial access for the 12 mm camera port and lower vascular injury risk in patients with prior abdominal surgery)"
        : "Veress needle technique at the umbilicus (or Palmer's point in the left upper quadrant if prior pelvic surgery, large pelvic mass, or pregnancy raises Veress vascular injury risk at the umbilicus)"
    } and insufflated to 15 mmHg with CO2 (gradually ramped to avoid vagal-mediated bradycardia in younger patients). Veress entry was confirmed with the saline drop test, low opening pressure < 8 mmHg, and absence of aspiration of blood or enteric content. A ${
      c.surgicalApproach === "ROBOTIC" ? "12" : "10"
    } mm camera port was placed and the abdomen inspected under direct vision; no Veress / trocar entry injury was identified. The following working ports were then placed under direct laparoscopic visualisation, with each port site pre-infiltrated with 0.25% bupivacaine for postoperative analgesia and trocars passed through the abdominal wall lateral to the inferior epigastric vessels (transilluminated in slim patients, or palpated above the inguinal ligament):`,
  );
  for (const p of opts.ports) lines.push(`  - ${p}`);
  if (c.surgicalApproach === "ROBOTIC") {
    lines.push(``, `The da Vinci Xi (or Si, per platform availability) robotic system was brought to the table from the appropriate side, the boom rotated to align with the operative target, and the four robotic arms docked to the patient ports. Instruments were introduced under direct vision and the robot positioned for optimal triangulation. The console surgeon assumed control after confirming hemodynamic stability and adequate visualisation.`);
  }
  lines.push(``);
  return lines;
}

/**
 * Endoscopic preamble for transurethral and flexible endoscopic cases.
 */
export function endoscopicPreamble(): string[] {
  return [
    `Description of Procedure: The risks, benefits, and alternatives — including bleeding, infection, urinary retention, urethral stricture, and the need for repeat intervention — were discussed in detail with the patient, and informed consent was obtained. The patient was brought to the operating room and placed in dorsal lithotomy with the legs in well-padded candy-cane stirrups. Critical positioning points were verified: knees flexed to 90°, hips flexed without excessive abduction, calves not pressing against the stirrups (avoids common peroneal nerve compression at the fibular head — the most common positioning injury in lithotomy and a litigation source), arms tucked or abducted < 90° on padded armboards, sacral pressure off-loaded.`,
    ``,
    `After preoxygenation, induction of general or monitored anesthesia was completed without difficulty (spinal anesthesia is also commonly used for TURP/TURBT cases — permits intraoperative neurological exam to detect TUR syndrome, reduces blood loss, and avoids the systemic effects of general anesthesia in elderly patients). Pre-incision antibiotic prophylaxis was administered within 60 minutes of instrumentation per AUA pre-instrumentation guidelines (cefazolin 2 g IV, fluoroquinolone, or culture-directed regimen if known UTI). The genitalia and perineum were prepped with 10% povidone-iodine solution (or chlorhexidine if no contraindication) and draped to expose the operative field with a perineal U-drape and impervious leg drapes.`,
    ``,
    `A surgical time-out was performed using the WHO Surgical Safety Checklist, confirming patient identity, procedure, site and side (laterality is mandatory for any unilateral upper-tract intervention), consent, antibiotic administration and timing, allergies, equipment availability (scope sizes, laser settings, stent inventory, fluoroscopy in-room when needed), and anticipated critical events.`,
    ``,
  ];
}
