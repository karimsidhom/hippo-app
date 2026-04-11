import type { CaseLog } from "@/lib/types";

/**
 * Standard open laparotomy preamble — consent, positioning, anesthesia,
 * Foley, antibiotics, time-out, incision & entry into the peritoneum.
 */
export function laparotomyPreamble(_c: CaseLog, incision: string): string[] {
  return [
    `Description of Procedure: The risks, benefits, and alternatives were discussed with the patient, and informed consent was obtained. The patient was brought to the operating room and placed supine on the table. After induction of general endotracheal anesthesia, a Foley catheter was placed and pre-incision antibiotics were administered within 60 minutes of incision. Sequential compression devices were applied.`,
    ``,
    `A surgical time-out was completed, confirming patient identity, procedure, site, consent, antibiotics, and availability of equipment. The abdomen was prepped with chlorhexidine and draped in the usual sterile fashion.`,
    ``,
    `A ${incision} skin incision was made and carried down through the subcutaneous tissue with electrocautery. The fascia was divided in the same orientation and the peritoneum was entered sharply, taking care to avoid injury to the underlying viscera. The abdomen was explored; findings are detailed above.`,
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
    `Description of Procedure: The risks, benefits, and alternatives were discussed with the patient, and informed consent was obtained. The patient was brought to the operating room and placed supine on the table. After induction of general endotracheal anesthesia, pre-incision antibiotics were administered and sequential compression devices were applied.`,
  ];
  if (opts.foley) {
    lines.push(``, `A Foley catheter was placed to decompress the bladder.`);
  }
  lines.push(
    ``,
    `A surgical time-out was completed, confirming patient identity, procedure, site, consent, antibiotics, and availability of equipment. The abdomen was prepped with chlorhexidine and draped in the usual sterile fashion.`,
    ``,
    `Pneumoperitoneum was established via a ${
      c.surgicalApproach === "ROBOTIC"
        ? "Hasson technique at the umbilicus"
        : "Veress needle at the umbilicus (or Palmer's point if indicated)"
    } and insufflated to 15 mmHg. A ${
      c.surgicalApproach === "ROBOTIC" ? "12" : "10"
    } mm camera port was placed and the abdomen inspected under direct vision. The following working ports were then placed under direct visualization:`,
  );
  for (const p of opts.ports) lines.push(`  - ${p}`);
  if (c.surgicalApproach === "ROBOTIC") {
    lines.push(``, `The da Vinci [Xi/Si] robot was brought to the table and docked.`);
  }
  lines.push(``);
  return lines;
}

/**
 * Endoscopic preamble for transurethral and flexible endoscopic cases.
 */
export function endoscopicPreamble(): string[] {
  return [
    `Description of Procedure: The risks, benefits, and alternatives were discussed with the patient, and informed consent was obtained. The patient was brought to the operating room and placed in dorsal lithotomy, with all pressure points carefully padded. After induction of [general / monitored] anesthesia, the perineum and genitalia were prepped and draped in the usual sterile fashion.`,
    ``,
    `A surgical time-out was completed, confirming patient identity, procedure, site, consent, antibiotics, and availability of equipment.`,
    ``,
  ];
}
