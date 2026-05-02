import type { CaseLog } from "@/lib/types";
import type { TopMatter } from "./types";

// ---------------------------------------------------------------------------
// Generic fallback — used when a procedure name does not match any specialty
// keyword pattern. Even procedures we don't have explicit templates for
// should still produce a complete, professional operative note skeleton
// with all the standard sections, positioning, anesthesia, prep, time-out,
// and structured placeholder steps the user can flesh out.
// ---------------------------------------------------------------------------

export function genericFindings(c: CaseLog): string {
  return `Intraoperative findings were consistent with the preoperative diagnosis of ${
    c.diagnosisCategory?.trim() || "[clinical diagnosis]"
  }. The relevant anatomy was identified and inspected. Adjacent structures (vessels, nerves, viscera) were preserved throughout the dissection. No unanticipated pathology was encountered. Hemostasis was satisfactory at the conclusion of the case.`;
}

export function genericTopMatter(_c: CaseLog): TopMatter {
  return {
    anesthesia: "General endotracheal anesthesia (or regional, per case requirements).",
    ebl: "Approximately ________ ml.",
    drains: "[Describe drains by type, size, and location, or 'None'].",
    specimens: "[Describe specimens sent to pathology, or 'None'].",
    disposition:
      "The patient tolerated the procedure well and was awakened from anesthesia uneventfully. All instrument, sponge, and needle counts were reported as correct prior to closure. The patient was transferred to the recovery area in stable condition. Postoperative plan per standard service protocol with return precautions for fever, bleeding, severe pain, or wound concerns.",
  };
}

/**
 * Approach-based fallback body. Each variant includes the universal
 * preoperative framework (consent, positioning + rationale, anesthesia,
 * prep + drape, WHO time-out) plus an approach-appropriate access section
 * and a structured placeholder for the procedure-specific steps.
 */
export function genericProcedureBody(c: CaseLog): string[] {
  const proc = c.procedureName || "[procedure]";

  switch (c.surgicalApproach) {
    case "ROBOTIC":
      return [
        `Description of Procedure: The risks, benefits, and alternatives — including conversion to open laparotomy, injury to bowel / vessels / adjacent organs, bleeding, infection, and gas-related complications — were discussed in detail with the patient and informed consent was obtained. The patient was brought to the operating room and placed in a position appropriate for the ${proc} (typically supine or modified flank), with all pressure points padded carefully and the patient secured to the table to permit steep Trendelenburg / lateral tilt during the case. SCDs + Caprini-stratified VTE prophylaxis applied. Active warming maintained perioperative normothermia.`,
        ``,
        `After preoxygenation, induction of general endotracheal anesthesia was completed without difficulty. An orogastric tube and Foley catheter were placed. Pre-incision antibiotic prophylaxis was administered within 60 minutes of incision per SCIP. A WHO Surgical Safety Checklist time-out was performed.`,
        ``,
        `The abdomen was prepped widely with 2% chlorhexidine / alcohol scrub and draped sterilely. Pneumoperitoneum was established via Hasson cut-down at the umbilicus (preferred for the wider 12 mm camera port and lower vascular injury risk in patients with prior surgery) and CO2 insufflated to 15 mmHg. Robotic ports were placed under direct vision in a configuration appropriate for the ${proc}, with each port site pre-infiltrated with 0.25% bupivacaine. The da Vinci Xi was brought to the table and the four robotic arms docked.`,
        ``,
        `[Describe step-by-step robotic technique for ${proc}: identification of anatomy, development of surgical planes in their named avascular layers, vascular control with vessel-sealing energy or clips, organ resection or reconstruction, lymph node dissection if oncologic, specimen extraction in an Endo Catch bag through the appropriate port site or extension incision.]`,
        ``,
        `Hemostasis was confirmed with insufflation pressure briefly reduced to 8 mmHg. The robot was undocked. Pneumoperitoneum was released and ports removed under direct vision. 12 mm fascial sites were closed with 0 Vicryl figure-of-eight (Carter-Thomason). Skin closed with 4-0 Monocryl subcuticular running suture. Sterile dressings applied.`,
      ];

    case "LAPAROSCOPIC":
      return [
        `Description of Procedure: The risks, benefits, and alternatives — including conversion to open laparotomy, injury to bowel / vessels / adjacent organs, bleeding, infection, and gas-related complications — were discussed in detail with the patient and informed consent was obtained. The patient was brought to the operating room and placed supine (or in the position appropriate for the ${proc}) with all pressure points padded carefully and the patient secured to the table for any anticipated steep positioning. SCDs + Caprini-stratified VTE prophylaxis applied. Active warming maintained perioperative normothermia.`,
        ``,
        `After preoxygenation, induction of general endotracheal anesthesia was completed without difficulty. An orogastric tube was placed to decompress the stomach (essential to avoid gastric injury during Veress / Hasson entry). Pre-incision antibiotic prophylaxis was administered within 60 minutes per SCIP. A WHO Surgical Safety Checklist time-out was performed.`,
        ``,
        `The abdomen was prepped widely with 2% chlorhexidine / alcohol scrub and draped sterilely. Pneumoperitoneum was established via Veress needle at the umbilicus (or Palmer's point if prior surgery) with the saline drop test confirming intraperitoneal placement and opening pressure < 8 mmHg. CO2 insufflated to 15 mmHg. A 10–12 mm camera port was placed and the abdomen inspected; no entry injury identified. Working ports were placed under direct vision in a configuration appropriate for the ${proc}, lateral to the inferior epigastric vessels.`,
        ``,
        `[Describe step-by-step laparoscopic technique for ${proc}: identification of anatomy, development of avascular planes, vascular control, dissection / resection / reconstruction, specimen extraction.]`,
        ``,
        `Hemostasis was confirmed at insufflation pressure 8 mmHg. Pneumoperitoneum released, ports removed under direct vision. 10–12 mm fascia closed with 0 Vicryl Carter-Thomason. Skin closed with 4-0 Monocryl subcuticular. Sterile dressings applied.`,
      ];

    case "OPEN":
      return [
        `Description of Procedure: The risks, benefits, and alternatives — including bleeding requiring transfusion, infection, injury to adjacent structures, hernia, prolonged ileus, and need for re-operation — were discussed in detail with the patient and informed consent was obtained. The patient was brought to the operating room and placed in the position appropriate for the ${proc} with all pressure points padded carefully and arms abducted no greater than 90° to avoid brachial plexopathy. SCDs + Caprini-stratified VTE prophylaxis applied. Active warming maintained perioperative normothermia.`,
        ``,
        `After preoxygenation, induction of general endotracheal anesthesia was completed without difficulty. A nasogastric or orogastric tube was placed for stomach decompression as indicated. A Foley catheter was placed for bladder decompression and intraoperative urine output monitoring. Pre-incision antibiotic prophylaxis was administered within 60 minutes per SCIP. A WHO Surgical Safety Checklist time-out was performed.`,
        ``,
        `The operative field was prepped with 2% chlorhexidine / alcohol scrub (or povidone-iodine where indicated) with 3-minute dry contact time and draped in the usual sterile fashion. A [midline / transverse / flank / inguinal / subcostal — chosen for optimal exposure of the operative target] incision was made with a #10 blade and carried down through the subcutaneous tissue with electrocautery. Anatomic layers were divided in sequence with care to identify and preserve any neurovascular structures crossing the incision. A self-retaining retractor was positioned for adequate exposure.`,
        ``,
        `[Describe step-by-step open technique for ${proc}: anatomic exposure, identification of named structures (vessels, nerves, lymphatics, ducts), development of surgical planes, vascular control, resection or reconstruction, hemostasis at each step, drain placement if indicated.]`,
        ``,
        `Hemostasis was meticulously confirmed throughout the operative field. All sponge, sharp, and instrument counts were reported as correct prior to wound closure. Wound closure was performed in anatomic layers: fascia with running 0–1 Vicryl or PDS (per surgeon preference and tissue quality), subcutaneous tissue with 3-0 Vicryl, skin with 4-0 Monocryl subcuticular running suture (or staples for thicker abdominal walls). A sterile dressing was applied.`,
      ];

    case "ENDOSCOPIC":
      return [
        `Description of Procedure: The risks, benefits, and alternatives — including bleeding, infection, perforation, the need for additional intervention, and procedure-specific complications — were discussed in detail with the patient and informed consent was obtained. The patient was brought to the operating room and placed in dorsal lithotomy (or the position appropriate for the ${proc}) with all pressure points padded carefully (avoiding common peroneal nerve compression at the fibular head). SCDs applied as appropriate.`,
        ``,
        `After preoxygenation, induction of general or monitored anesthesia was completed without difficulty. Pre-instrumentation antibiotic prophylaxis was administered per AUA / specialty guidelines (cefazolin or culture-directed regimen). A WHO Surgical Safety Checklist time-out was performed, with explicit confirmation of laterality where applicable.`,
        ``,
        `The operative field was prepped with chlorhexidine (or povidone-iodine for genital prep) and draped sterilely. The [cystoscope / ureteroscope / nephroscope / endoscope / bronchoscope / hysteroscope] was assembled, white-balanced, and introduced atraumatically under direct vision. A systematic inspection of the cavity was performed in a standardised sequence to avoid missed pathology.`,
        ``,
        `[Describe endoscopic findings and intervention for ${proc}: pathology identified by location and characteristics, instruments used (laser, basket, biopsy forceps, electrocautery loop, balloon), stent / catheter / biopsy / resection performed, completeness of intervention, hemostasis.]`,
        ``,
        `At the conclusion of the procedure the operative field was reinspected and confirmed hemostatic. Catheters and stents were placed as indicated and confirmed in correct position by direct visualisation (and fluoroscopy where applicable). The scope was withdrawn under direct vision.`,
      ];

    case "PERCUTANEOUS":
      return [
        `Description of Procedure: The risks, benefits, and alternatives — including bleeding requiring transfusion or angio-embolisation, infection / sepsis, injury to adjacent organs (bowel, pleura, diaphragm), and the need for additional intervention — were discussed in detail with the patient and informed consent was obtained. The patient was brought to the operating suite and placed in the position appropriate for the planned access (typically prone or modified supine for the ${proc}) with all pressure points padded carefully.`,
        ``,
        `After preoxygenation, induction of general or monitored anesthesia was completed without difficulty. Pre-procedure antibiotic prophylaxis was administered per AUA / specialty guidelines, tailored to culture results when available. A WHO Surgical Safety Checklist time-out was performed.`,
        ``,
        `The operative field was prepped widely and draped sterilely. Under combined fluoroscopic AND ultrasound guidance (modern best practice), the planned access target was identified and the trajectory verified to avoid intervening organs (colon, pleura, vessels). Local anesthesia was infiltrated along the planned tract.`,
        ``,
        `An 18-gauge access needle was advanced under image guidance into the target structure. Successful entry was confirmed by aspiration / contrast injection / direct visualisation of the lumen. A 0.038" guidewire was advanced through the needle and the position confirmed fluoroscopically.`,
        ``,
        `The tract was sequentially dilated to the working size with Amplatz dilators (or balloon dilation), with the wire maintained throughout as a safety. An access sheath was placed.`,
        ``,
        `[Describe percutaneous procedure for ${proc}: instruments used through the sheath, target intervention, completeness of procedure, hemostasis at the access tract.]`,
        ``,
        `A drainage tube / stent was placed as indicated and secured to the skin. The access site was covered with a sterile dressing. Hemostasis was confirmed at the entry point.`,
      ];

    case "HYBRID":
      return [
        `Description of Procedure: The risks, benefits, and alternatives of a hybrid approach combining open and minimally invasive techniques were discussed with the patient and informed consent was obtained. The patient was positioned and prepped as for the open component of the case, with the ability to transition to a minimally invasive approach as planned. SCDs + VTE prophylaxis applied. WHO Surgical Safety Checklist time-out completed.`,
        ``,
        `[Describe the open and minimally invasive components of the ${proc} and the rationale for the hybrid approach: access incision and exposure for the open phase, transition point to minimally invasive for the second phase, instruments and techniques used for each phase, completeness of procedure, hemostasis throughout.]`,
        ``,
        `Hemostasis was confirmed. Wounds were closed in standard layered fashion appropriate to each access site. Sterile dressings were applied.`,
      ];

    default:
      return [
        `Description of Procedure: The risks, benefits, and alternatives — including bleeding, infection, injury to adjacent structures, and procedure-specific complications — were discussed in detail with the patient and informed consent was obtained. The patient was brought to the operating room and placed in the position appropriate for the ${proc} with all pressure points padded carefully. SCDs applied. Pre-incision antibiotic prophylaxis administered per SCIP. WHO Surgical Safety Checklist time-out completed.`,
        ``,
        `The operative field was prepped with chlorhexidine and draped in the usual sterile fashion.`,
        ``,
        `[Describe surgical access and step-by-step operative technique for ${proc}: anatomic exposure, identification of key structures, dissection, intervention, hemostasis.]`,
        ``,
        `Hemostasis was confirmed. All counts were correct. The wound was closed in anatomic layers. Sterile dressings were applied.`,
      ];
  }
}
