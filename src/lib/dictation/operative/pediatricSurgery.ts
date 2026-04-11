import type { CaseLog } from "@/lib/types";
import { includesAny } from "../shared/format";
import type { TopMatter } from "./index";
import {
  laparotomyPreamble,
  laparoscopicPreamble,
} from "../shared/preamble";
import {
  standardOpenClosure,
  standardLapClosure,
} from "../shared/closure";

// ---------------------------------------------------------------------------
// Pediatric Surgery — forced fields:
//   - Age and weight (weight-based dosing)
//   - Thermoregulation during case
//   - Pylorus dimensions for pyloromyotomy
//   - Sac integrity for hernia repairs
//   - Air-leak test when applicable
//   - Specific anatomic findings
//   - Feeding / activity plan
// ---------------------------------------------------------------------------

export function pediatricSurgeryTopMatter(c: CaseLog): TopMatter {
  const name = c.procedureName.toLowerCase();

  if (includesAny(name, ["pyloromyotomy"])) {
    return {
      anesthesia: "General endotracheal anesthesia; stomach decompressed preoperatively.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None.",
      disposition: "The patient tolerated the procedure well. Extubated in the OR. Ad lib feeds started 4 hours postoperatively per pediatric surgery protocol. Discharge home when tolerating goal feeds without emesis.",
    };
  }

  if (includesAny(name, ["inguinal hernia", "high ligation"])) {
    return {
      anesthesia: "General anesthesia with caudal block for postoperative analgesia.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Hernia sac to pathology.",
      disposition: "The patient tolerated the procedure well. Discharge home the same day. Regular diet and activity per age. Return precautions for bulge, redness, or fever.",
    };
  }

  if (includesAny(name, ["orchidopexy"])) {
    return {
      anesthesia: "General anesthesia with caudal block.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None.",
      disposition: "The patient tolerated the procedure well. Discharge home the same day. Scrotal exam at 1 week and 3 months to confirm testicular position and viability.",
    };
  }

  if (includesAny(name, ["umbilical hernia"])) {
    return {
      anesthesia: "General anesthesia.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Hernia sac to pathology.",
      disposition: "The patient tolerated the procedure well. Discharge home the same day. Return precautions for fever or wound concerns.",
    };
  }

  if (includesAny(name, ["ladd", "malrotation"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None (or ischemic bowel if resected).",
      disposition: "The patient tolerated the procedure well. Admitted for bowel rest and gradual advancement of feeds per pediatric surgery protocol.",
    };
  }

  if (includesAny(name, ["peg tube"])) {
    return {
      anesthesia: "General anesthesia.",
      ebl: "Minimal.",
      drains: "PEG tube in place to gravity drainage.",
      specimens: "None.",
      disposition: "The patient tolerated the procedure well. PEG feeds can be initiated 6 hours postoperatively. Site care teaching and follow-up scheduled.",
    };
  }

  return {
    anesthesia: "General anesthesia.",
    ebl: "Minimal.",
    drains: "None.",
    specimens: "[Specimens or 'None'].",
    disposition: "The patient tolerated the procedure well. Postoperative plan per pediatric surgery protocol.",
  };
}

export function pediatricSurgeryFindings(c: CaseLog): string {
  const name = c.procedureName.toLowerCase();

  if (includesAny(name, ["pyloromyotomy"])) {
    return `Preoperative ultrasound demonstrated pyloric stenosis with a pyloric channel length of [__] mm and muscle thickness of [__] mm, consistent with the clinical presentation of projectile non-bilious emesis. Intraoperatively the pylorus was thickened, olive-shaped, and clearly demarcated from the antrum and duodenum. The seromuscular incision was carried through to the submucosal plane without mucosal breach. An air-leak test with instilled air via the OG tube confirmed intact mucosa. Infant thermoregulation was maintained throughout the case with forced-air warming.`;
  }

  if (includesAny(name, ["inguinal hernia", "high ligation"])) {
    return `A [left / right / bilateral] indirect inguinal hernia was identified with a thin-walled sac extending through the internal ring. The sac was dissected free of the cord structures without injury to the vas deferens or testicular vessels. High ligation was performed at the level of the internal ring. The cord structures were returned to the scrotum and the testis palpated to confirm normal position.`;
  }

  if (includesAny(name, ["orchidopexy"])) {
    return `A [left / right / bilateral] undescended testis was identified in the [inguinal canal / superficial ring / abdominal]. The testis was of [normal / atrophic] size and had [normal / short] gubernaculum. The vas deferens and spermatic vessels were mobilized to achieve tension-free descent into the dependent scrotum. The testis was fixed in a sub-dartos pouch without tension on the cord.`;
  }

  if (includesAny(name, ["umbilical hernia"])) {
    return `An umbilical fascial defect measuring approximately [__] cm was identified. The hernia sac contained [omentum / preperitoneal fat]. The contents were reduced and the fascial edges were healthy. Primary closure was achieved without tension.`;
  }

  if (includesAny(name, ["ladd", "malrotation"])) {
    return `Malrotation was confirmed with a narrow-based mesentery and duodenal obstruction by Ladd's bands. [No / Segmental] volvulus was present. The bowel was viable throughout. The Ladd's bands were divided, the mesentery was widened, and an incidental appendectomy was performed. The bowel was returned to the abdomen in non-rotation position.`;
  }

  return `Intraoperative findings were consistent with the preoperative diagnosis. The patient tolerated the procedure well with stable vital signs and maintained thermoregulation throughout.`;
}

// ---------------------------------------------------------------------------
// Pediatric Surgery — procedure-specific operative steps.
// ---------------------------------------------------------------------------

function pedsOpSteps(c: CaseLog): string[] {
  const name = c.procedureName.toLowerCase();

  // -- Pyloromyotomy ---------------------------------------------------------
  if (includesAny(name, ["pyloromyotomy", "ramstedt", "hypertrophic pyloric"])) {
    const isLap = c.surgicalApproach === "LAPAROSCOPIC";
    if (isLap) {
      return [
        `An umbilical 5 mm incision was made and pneumoperitoneum established to 8 mmHg with a blunt port. The camera was introduced. Two additional 3 mm stab incisions were made in the [right upper quadrant] for a grasper and in the epigastrium for the pyloromyotomy knife.`,
        `The hypertrophied pylorus was identified and stabilized with an atraumatic grasper at the duodenal end. A seromuscular incision was made along the avascular plane from just proximal to the pyloroduodenal junction to the gastric antrum.`,
        `A pyloromyotomy spreader was used to split the hypertrophic muscle down to the submucosa, taking care to avoid duodenal perforation. A leak test was performed by insufflating air through an orogastric tube; no leak was identified. Hemostasis was confirmed.`,
      ];
    }
    return [
      `A right upper quadrant transverse incision was made and carried down to the peritoneum. The pylorus was delivered into the wound and stabilized between the surgeon's fingers.`,
      `A seromuscular incision was made along the avascular plane from just proximal to the pyloroduodenal junction to the gastric antrum. A Benson spreader was used to split the hypertrophic muscle down to the submucosa with care taken to avoid duodenal perforation.`,
      `A leak test was performed by insufflating air through an orogastric tube; no leak was identified. The pylorus was returned to the abdomen. The wound was closed in layers with absorbable suture and skin glue.`,
    ];
  }

  // -- Inguinal hernia (pediatric) -------------------------------------------
  if (includesAny(name, ["pediatric inguinal", "high ligation", "indirect inguinal"])) {
    return [
      `A transverse inguinal crease incision was made and carried through Scarpa's fascia. The external oblique aponeurosis was exposed and opened in the line of its fibers, preserving the ilioinguinal nerve.`,
      `The cord structures were identified. The hernia sac was found anteromedial to the cord, isolated, and carefully separated from the vas deferens and gonadal vessels with microscopic attention in small children. The sac was traced to the internal ring.`,
      `The sac was opened to confirm its contents, twisted, and high-ligated at the internal ring with 3-0 Vicryl suture-ligature. The distal sac was left in situ. The contralateral side was examined laparoscopically through the sac as indicated.`,
      `The external oblique was closed with 4-0 Vicryl, Scarpa's with 5-0 Vicryl, and skin with 5-0 Monocryl subcuticular. Skin glue was applied.`,
    ];
  }

  // -- Orchidopexy / undescended testis --------------------------------------
  if (includesAny(name, ["orchidopexy", "undescended testis", "cryptorchidism"])) {
    return [
      `An inguinal incision was made over the inguinal canal. The external oblique was opened and the cord structures identified. The undescended testis was found in the [inguinal canal / high scrotum].`,
      `The testis was mobilized by dividing the gubernaculum and dissecting the processus vaginalis off the cord, then high-ligating it at the internal ring. The cord was further mobilized proximally to achieve adequate length for a tension-free scrotal placement.`,
      `A separate scrotal incision was made and a subdartos pouch developed. The testis was delivered into the pouch and secured with a 5-0 absorbable suture between the tunica albuginea and the dartos. The inguinal wound was closed in layers.`,
    ];
  }

  // -- Umbilical hernia ------------------------------------------------------
  if (includesAny(name, ["umbilical hernia"])) {
    return [
      `An infra-umbilical curvilinear incision was made and carried down to the fascia. The hernia sac was identified, dissected free circumferentially, and separated from the undersurface of the umbilical skin.`,
      `The sac was reduced into the abdomen. The fascial defect was closed transversely with interrupted 2-0 or 3-0 Vicryl sutures. The umbilical skin was tacked down to the fascia to prevent an umbilical depression, and the skin was closed with absorbable subcuticular sutures.`,
    ];
  }

  // -- Pediatric appendectomy ------------------------------------------------
  if (includesAny(name, ["pediatric appendectomy", "lap appy"]) && c.surgicalApproach === "LAPAROSCOPIC") {
    return [
      `A 5 mm umbilical port was placed via open Hasson technique. Pneumoperitoneum was established to [10-12] mmHg. Two additional 5 mm ports were placed in the [suprapubic / left lower quadrant] under direct visualization.`,
      `The abdomen was inspected. The cecum was identified and the appendix was found to be [inflamed / perforated with localized peritonitis]. The mesoappendix was divided with an energy device, and the base of the appendix was controlled with [Endoloop ligatures / endoscopic stapler] and transected.`,
      `The specimen was removed in an Endocatch bag. The right lower quadrant was irrigated and suctioned dry. Ports were removed under direct vision and closed in standard fashion.`,
    ];
  }

  // -- Malrotation / Ladd's procedure ----------------------------------------
  if (includesAny(name, ["ladd", "malrotation", "intestinal malrotation"])) {
    return [
      `A transverse supraumbilical incision was made and the abdomen entered. The bowel was eviscerated into the wound. Malrotation was confirmed with an abnormally placed cecum and short narrow mesenteric base.`,
      `If volvulus was present, the bowel was de-rotated in a counter-clockwise direction until the base of the mesentery was straightened. Ladd's bands were identified overlying the duodenum and were sharply divided, freeing the duodenum from the colon.`,
      `The mesenteric base was widened by spreading the peritoneum between the duodenum and cecum. An appendectomy was performed given the abnormal cecal position. The small bowel was placed on the right side of the abdomen and the colon on the left in a non-rotation configuration.`,
      `The bowel was returned to the abdomen and the wound was closed in layers.`,
    ];
  }

  // -- Intussusception reduction ---------------------------------------------
  if (includesAny(name, ["intussusception"])) {
    return [
      `After a failed / contraindicated air or contrast enema, a right lower quadrant transverse incision was made and the abdomen entered. The ileocolic intussusception was identified and delivered into the wound.`,
      `Gentle milking pressure was applied to the distal lead point in a retrograde fashion, reducing the intussusception progressively through the ileocecal valve. The bowel was carefully inspected for viability; no evidence of ischemia or perforation was identified, and an incidental appendectomy was performed.`,
      `The bowel was returned to the abdomen and the wound closed in layers.`,
    ];
  }

  // -- Circumcision (pediatric) ----------------------------------------------
  if (includesAny(name, ["circumcision"])) {
    return [
      `A dorsal penile nerve block was performed. The foreskin was retracted and any preputial adhesions bluntly divided. The coronal margin was marked.`,
      `A [Gomco / Plastibell / Mogen] clamp was applied to the foreskin over the glans, ensuring no glans tissue was entrapped. The clamp was tightened and the excess foreskin was excised. The clamp was removed and hemostasis confirmed.`,
      `Petroleum gauze was applied. Parents were educated on diaper and wound care.`,
    ];
  }

  // -- G-tube insertion ------------------------------------------------------
  if (includesAny(name, ["gastrostomy", "g-tube", "peg tube"])) {
    return [
      `Gastroscopy was performed via the orogastric route and the stomach insufflated. The anterior abdominal wall was trans-illuminated and an appropriate site was selected in the left upper quadrant, confirmed by one-to-one finger indentation visible endoscopically.`,
      `The skin was prepped and a small stab incision was made at the selected site. A trocar and sheath were inserted into the stomach under endoscopic visualization. A guidewire was passed through the sheath into the stomach and grasped with an endoscopic snare.`,
      `The wire was pulled out through the mouth. A PEG tube was attached and pulled back antegrade through the esophagus and stomach until its internal bolster seated gently against the gastric mucosa. The external bolster was secured without excessive tension.`,
      `Endoscopy confirmed correct position of the internal bolster without tension. The tube was flushed with saline to confirm patency.`,
    ];
  }

  // Generic pediatric surgery fallback
  return [
    `Due attention was paid to the pediatric patient's thermoregulation, fluid balance, and small operative corridor. The ${c.procedureName} was performed with age-appropriate instrumentation and suture selection. [Expand with procedure-specific technical steps.]`,
    ``,
    `Hemostasis was confirmed and the wound was closed with fine absorbable sutures and skin glue.`,
  ];
}

export function pediatricSurgeryBody(c: CaseLog): string[] {
  const name = c.procedureName.toLowerCase();
  const isLap = c.surgicalApproach === "LAPAROSCOPIC" || c.surgicalApproach === "ROBOTIC";
  const isOpen = c.surgicalApproach === "OPEN";

  let preamble: string[];
  let closure: string[];

  if (isLap && includesAny(name, ["appendectomy", "pyloromyotomy", "ladd"])) {
    preamble = laparoscopicPreamble(c, {
      ports: [
        "5 mm umbilical camera port",
        "3-5 mm working port in the right/left lower quadrant",
        "3-5 mm working port in the epigastrium",
      ],
    });
    closure = standardLapClosure();
  } else if (isOpen && includesAny(name, ["ladd", "intussusception", "malrotation"])) {
    preamble = laparotomyPreamble(c, "transverse supraumbilical");
    closure = standardOpenClosure(true);
  } else {
    // Focal cases (hernia, orchidopexy, pyloromyotomy open, G-tube) get a
    // lightweight peds-appropriate preamble.
    preamble = [
      `Description of Procedure: The risks, benefits, and alternatives were discussed with the parents/guardians and informed consent was obtained. The patient was brought to the operating room and placed supine with careful attention to thermoregulation, padded positioning, and age-appropriate IV access and monitoring. After induction of general anesthesia, pre-incision antibiotics were administered.`,
      ``,
      `A surgical time-out was completed. The operative site was prepped and draped in the usual sterile fashion.`,
      ``,
    ];
    closure = [
      ``,
      `Hemostasis was confirmed. The wound was closed in layers with fine absorbable sutures and skin adhesive. The patient tolerated the procedure well and was transferred to recovery in stable condition.`,
    ];
  }

  return [...preamble, ...pedsOpSteps(c), ...closure];
}
