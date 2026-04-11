import type { CaseLog } from "@/lib/types";
import type { TopMatter } from "./index";

export function genericFindings(_c: CaseLog): string {
  return `Intraoperative findings were consistent with the preoperative diagnosis. The relevant anatomy was identified and inspected. No unanticipated pathology was encountered. Hemostasis was satisfactory at the conclusion of the case.`;
}

export function genericTopMatter(_c: CaseLog): TopMatter {
  return {
    anesthesia: "General anesthesia.",
    ebl: "Approximately ________ ml.",
    drains: "[Describe drains or 'None'].",
    specimens: "[Describe specimens sent to pathology, or 'None'].",
  };
}

/**
 * Approach-based fallback body for specialties that don't yet have a
 * dedicated builder. Kept intentionally generic — consumers should prefer
 * a service-specific builder when available.
 */
export function genericProcedureBody(c: CaseLog): string[] {
  const proc = c.procedureName;

  switch (c.surgicalApproach) {
    case "ROBOTIC":
      return [
        `Description of Procedure: Informed consent was obtained. The patient was positioned, secured, and padded. After general anesthesia, appropriate monitoring and catheterization were performed. The patient was prepped and draped in the usual sterile fashion and a surgical time-out was completed.`,
        ``,
        `Pneumoperitoneum was established and robotic ports were placed in a configuration appropriate for the ${proc}. The da Vinci system was docked.`,
        ``,
        `[Describe step-by-step robotic technique for ${proc}: identification of anatomy, development of surgical planes, vascular control, resection/reconstruction, specimen extraction.]`,
        ``,
        `Hemostasis was confirmed. The robot was undocked, ports removed, pneumoperitoneum released, fascia at 10/12 mm sites closed, skin approximated, and sterile dressings applied.`,
      ];

    case "LAPAROSCOPIC":
      return [
        `Description of Procedure: Informed consent was obtained. The patient was positioned, secured, and padded. After general anesthesia the patient was prepped and draped and a time-out was completed.`,
        ``,
        `Pneumoperitoneum was established and laparoscopic ports were placed in a configuration appropriate for the ${proc}.`,
        ``,
        `[Describe step-by-step laparoscopic technique for ${proc}: identification of anatomy, dissection, vascular control, resection/reconstruction, specimen extraction.]`,
        ``,
        `Hemostasis was confirmed. Ports removed, pneumoperitoneum released, fascia and skin closed, sterile dressings applied.`,
      ];

    case "OPEN":
      return [
        `Description of Procedure: Informed consent was obtained. The patient was positioned, secured, and padded. After induction of anesthesia the patient was prepped and draped in the usual sterile fashion and a time-out was completed.`,
        ``,
        `A [midline / transverse / flank / inguinal / subcostal] incision was made and carried down in layers to enter the operative field. A self-retaining retractor was positioned.`,
        ``,
        `[Describe step-by-step open technique for ${proc}: exposure, dissection planes, vascular control, resection/reconstruction, drain placement.]`,
        ``,
        `Hemostasis was confirmed. All counts were correct. The wound was closed in layers with a running fascial suture, subcutaneous re-approximation, and skin closure, followed by a sterile dressing.`,
      ];

    case "ENDOSCOPIC":
      return [
        `Description of Procedure: Informed consent was obtained. The patient was positioned appropriately and prepped and draped. A time-out was completed.`,
        ``,
        `The [cystoscope / ureteroscope / nephroscope / endoscope] was assembled, white-balanced, and introduced. A systematic inspection was performed.`,
        ``,
        `[Describe endoscopic findings and intervention for ${proc}: pathology identified, tools used, stent/catheter/biopsy/resection as applicable.]`,
        ``,
        `At the end of the procedure the operative field was inspected and was hemostatic. Catheters/stents were placed as indicated.`,
      ];

    case "PERCUTANEOUS":
      return [
        `Description of Procedure: Informed consent was obtained. The patient was positioned and prepped. A time-out was completed.`,
        ``,
        `Under [fluoroscopic / ultrasound / CT] guidance, percutaneous access was obtained and a guidewire advanced. The tract was dilated as needed and an access sheath placed.`,
        ``,
        `[Describe percutaneous procedure for ${proc}.]`,
        ``,
        `Drains / tubes were placed as indicated. Hemostasis was confirmed at the access site.`,
      ];

    case "HYBRID":
      return [
        `Description of Procedure: Informed consent was obtained. A combined open and minimally invasive approach was utilized for the ${proc}. [Describe open and minimally invasive components and their rationale.]`,
        ``,
        `Hemostasis was confirmed. Wounds were closed in standard fashion.`,
      ];

    default:
      return [
        `Description of Procedure: Informed consent was obtained. The patient was positioned, prepped, and draped, and a time-out completed.`,
        ``,
        `[Describe surgical access and step-by-step operative technique for ${proc}.]`,
        ``,
        `Hemostasis was confirmed. The wound was closed in standard fashion and sterile dressings applied.`,
      ];
  }
}
