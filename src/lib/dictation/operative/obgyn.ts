import type { CaseLog } from "@/lib/types";
import { includesAny } from "../shared/format";
import { laparotomyPreamble, laparoscopicPreamble } from "../shared/preamble";
import { standardOpenClosure, standardLapClosure } from "../shared/closure";

function obgynOpSteps(c: CaseLog): string[] {
  const name = c.procedureName.toLowerCase();

  if (includesAny(name, ["cesarean", "caesarean", "c-section", "lscs", "c/s"])) {
    return [
      `A Pfannenstiel skin incision was made two finger-breadths above the pubic symphysis and carried down through the subcutaneous tissue with electrocautery. The anterior rectus sheath was incised transversely and extended bilaterally with Mayo scissors. The rectus muscles were separated in the midline bluntly. The peritoneum was elevated and entered sharply, taking care to avoid injury to the bladder and bowel.`,
      `The bladder flap was developed by incising the vesicouterine peritoneum transversely and bluntly dissecting the bladder inferiorly. A low transverse hysterotomy was created with a scalpel and extended bilaterally with bandage scissors (or bluntly) in a curvilinear fashion to avoid extension into the uterine vessels.`,
      `The infant's [head / breech] was delivered atraumatically. The nares and mouth were suctioned. The cord was doubly clamped and divided. The infant was handed off to the neonatal team. Apgars were [9/9 or as assigned]. Cord blood was sent.`,
      `The placenta was delivered spontaneously / manually and the uterus was exteriorized. The uterine cavity was wiped clear of membranes and clot. The hysterotomy was closed in two layers with 0 Vicryl: a first running locked layer and a second imbricating layer. Hemostasis was confirmed.`,
      `The uterus was returned to the abdominal cavity. The gutters were inspected. The fascia was closed with running 0 Vicryl. The subcutaneous tissue was re-approximated with 3-0 Vicryl and the skin closed with 4-0 Monocryl subcuticular. A sterile dressing was applied.`,
    ];
  }

  if (includesAny(name, ["total abdominal hysterectomy", "tah"])) {
    return [
      `A [Pfannenstiel / midline] incision was made and carried down through the abdominal wall into the peritoneal cavity. The abdomen was explored and a self-retaining retractor was placed. The bowel was packed out of the pelvis.`,
      `The round ligaments were identified, clamped with Heaney clamps, divided, and suture-ligated with 0 Vicryl bilaterally. The anterior leaf of the broad ligament was incised to develop the bladder flap, and the bladder was dissected off the lower uterine segment and cervix.`,
      `The infundibulopelvic ligaments were isolated — [taking the ovaries with BSO / preserving the ovaries by taking the utero-ovarian ligaments instead]. They were doubly clamped, divided, and suture-ligated with 0 Vicryl.`,
      `The uterine vessels were skeletonized at the level of the internal os, doubly clamped at a right angle to the uterus, divided, and suture-ligated. The cardinal and uterosacral ligaments were sequentially clamped, divided, and ligated, descending along the cervix.`,
      `A curved clamp was placed across the vagina below the cervix and the uterus was amputated. The vaginal cuff was closed with figure-of-eight 0 Vicryl sutures incorporating the uterosacral ligaments for apical support. Hemostasis was confirmed.`,
      `The pelvis was irrigated and inspected. All counts were correct. The fascia was closed with running #1 PDS, subcutaneous tissue with 3-0 Vicryl, and skin with 4-0 Monocryl.`,
    ];
  }

  if (includesAny(name, ["vaginal hysterectomy", "vh"])) {
    return [
      `The patient was placed in dorsal lithotomy. A weighted speculum was placed in the posterior vagina and the cervix was grasped with a single-tooth tenaculum. A circumferential incision was made around the cervix. The anterior and posterior cul-de-sacs were entered sharply.`,
      `The uterosacral, cardinal, and uterine vessel pedicles were sequentially clamped with Heaney clamps, divided, and suture-ligated with 0 Vicryl. The utero-ovarian pedicles were clamped, divided, and ligated. The uterus was delivered through the vagina.`,
      `The vaginal cuff was closed with running 0 Vicryl, incorporating the uterosacral ligaments for McCall culdoplasty. Hemostasis was confirmed. The bladder and rectum were inspected for injury.`,
    ];
  }

  if (includesAny(name, ["laparoscopic hysterectomy", "tlh", "lavh"])) {
    return [
      `Pneumoperitoneum was established and ports were placed as described. A uterine manipulator was placed transvaginally.`,
      `The round ligaments were coagulated with an energy device and divided bilaterally. The anterior leaf of the broad ligament was incised and the bladder flap developed.`,
      `The utero-ovarian ligaments (or IP ligaments if BSO) were sealed and divided. The uterine vessels were skeletonized and sealed at the level of the internal os.`,
      `A colpotomy was performed circumferentially around the cervix using a monopolar hook along the colpotomy cup of the uterine manipulator. The uterus was delivered transvaginally (or morcellated within a containment bag per indications).`,
      `The vaginal cuff was closed laparoscopically with 0 V-Loc barbed suture in a running fashion, incorporating the uterosacral ligaments bilaterally for apical support. Hemostasis was confirmed.`,
    ];
  }

  if (includesAny(name, ["myomectomy"])) {
    return [
      `Dilute vasopressin was injected into the serosa overlying the dominant fibroid to reduce blood loss. A serosal incision was made and the fibroid enucleated from the pseudocapsule in the avascular plane.`,
      `Additional fibroids were removed through the same or separate incisions. The uterine defect was closed in layers with 0 Vicryl to obliterate the dead space, followed by a serosal layer with 2-0 Vicryl in a baseball stitch. Hemostasis was confirmed. An anti-adhesion barrier was applied per surgeon preference.`,
    ];
  }

  if (includesAny(name, ["d&c", "dilation and curettage", "dilatation and curettage", "d and c"])) {
    return [
      `The patient was placed in dorsal lithotomy and the perineum was prepped and draped. A weighted speculum was placed posteriorly. The cervix was grasped with a single-tooth tenaculum and the uterus was sounded to [__ cm].`,
      `The cervix was serially dilated with Hegar dilators to [__ mm]. A [sharp / suction] curette was introduced and the endometrial cavity was systematically curetted from all four quadrants until a gritty sensation was appreciated. Specimens were sent for pathology.`,
      `Hemostasis was confirmed. The tenaculum and speculum were removed.`,
    ];
  }

  if (includesAny(name, ["tubal ligation", "bilateral tubal ligation", "btl"])) {
    return [
      `The fallopian tubes were identified bilaterally and traced to the fimbriated ends to confirm correct identification. [A segment of each isthmic tube was isolated, ligated, and excised (Pomeroy / modified Pomeroy) / each tube was occluded with a Filshie clip / the tubes were fulgurated with bipolar energy in three contiguous sites].`,
      `Specimens were sent for pathology to confirm tubal tissue. Hemostasis was confirmed along each tubal segment.`,
    ];
  }

  if (includesAny(name, ["forceps"])) {
    return [
      `Informed consent for operative vaginal delivery was obtained. The bladder was empty, the cervix was completely dilated, the membranes were ruptured, the fetal head was engaged at or below [station], the position was [occiput anterior / occiput posterior / occiput transverse], and adequate anesthesia was confirmed.`,
      `The [Simpson / Elliot / Kielland] forceps were applied one at a time under the guidance of the pelvic hand, articulated, and their placement verified (sagittal suture perpendicular to and equidistant from the shanks, posterior fontanelle one finger-breadth above the plane of the shanks, lambdoidal sutures equidistant from the blades).`,
      `With a maternal contraction and maternal pushing effort, gentle downward traction was applied along the pelvic curve until crowning. The forceps were removed and the head was delivered in the usual fashion. The remainder of the delivery proceeded normally.`,
    ];
  }

  if (includesAny(name, ["vacuum", "ventouse"])) {
    return [
      `Informed consent for operative vaginal delivery was obtained. The criteria for operative vaginal delivery were met (complete cervical dilation, ruptured membranes, engaged head, known position, and adequate anesthesia).`,
      `The vacuum cup was applied over the flexion point approximately 3 cm anterior to the posterior fontanelle. Suction was increased to delivery pressure between contractions. With each contraction and maternal pushing effort, gentle traction was applied along the pelvic curve. Delivery was accomplished after [__] pulls.`,
      `The cup was released and removed. The remainder of the delivery and placental delivery proceeded normally.`,
    ];
  }

  if (includesAny(name, ["manual removal of placenta", "mrop", "retained placenta"])) {
    return [
      `Under adequate anesthesia, one hand was placed on the fundus abdominally for support. The other hand was introduced through the vagina and into the uterine cavity. The placental edge was identified and the placenta was manually separated from the uterine wall using the ulnar edge of the hand in a sweeping motion.`,
      `The placenta was removed in its entirety and inspected for completeness. The uterine cavity was re-explored to confirm no retained products. Uterotonics were administered and uterine tone was confirmed.`,
    ];
  }

  // Generic gyn fallback
  return [
    `The pelvic anatomy was identified and inspected. The ${c.procedureName} was performed in standard fashion, with attention to preservation of the bladder, ureters, and bowel. [Expand with procedure-specific technical steps.] Hemostasis was confirmed throughout.`,
    ``,
  ];
}

export function obgynBody(c: CaseLog): string[] {
  const name = c.procedureName.toLowerCase();
  const isObstetric = includesAny(name, [
    "cesarean",
    "caesarean",
    "c-section",
    "c/s",
    "lscs",
    "forceps",
    "vacuum",
    "ventouse",
    "manual removal",
    "mrop",
  ]);
  const isVaginal = includesAny(name, [
    "vaginal hysterectomy",
    "d&c",
    "d and c",
    "dilation",
    "dilatation",
    "tubal",
  ]);
  const isLap =
    c.surgicalApproach === "LAPAROSCOPIC" ||
    c.surgicalApproach === "ROBOTIC" ||
    includesAny(name, ["laparoscopic", "tlh", "lavh"]);

  let preamble: string[];

  if (isObstetric && includesAny(name, ["cesarean", "caesarean", "c-section", "c/s", "lscs"])) {
    preamble = [
      `Description of Procedure: The risks, benefits, and alternatives of cesarean delivery were discussed with the patient and informed consent was obtained. The patient was brought to the operating room. [Spinal / epidural / general] anesthesia was administered. A Foley catheter was placed. The patient was placed supine with a left lateral tilt. Pre-incision antibiotics were administered. The abdomen was prepped with chlorhexidine and draped in the usual sterile fashion.`,
      ``,
      `A surgical time-out was completed, confirming patient, gestational age, indication, consent, antibiotics, and neonatal team presence.`,
      ``,
    ];
  } else if (isObstetric) {
    preamble = [
      `Description of Procedure: The risks, benefits, and alternatives of the operative vaginal delivery were discussed with the patient and informed consent was obtained. The patient was placed in dorsal lithotomy with adequate analgesia. The bladder was emptied. A time-out was performed.`,
      ``,
    ];
  } else if (isVaginal) {
    preamble = [
      `Description of Procedure: The risks, benefits, and alternatives were discussed with the patient and informed consent was obtained. The patient was brought to the operating room and placed in dorsal lithotomy. After adequate anesthesia, the vagina and perineum were prepped and draped in the usual sterile fashion. Pre-incision antibiotics were administered where indicated. A time-out was completed.`,
      ``,
    ];
  } else if (isLap) {
    preamble = laparoscopicPreamble(c, {
      foley: true,
      ports: [
        "5 mm left lower quadrant working port",
        "5 mm right lower quadrant working port",
        "5 mm suprapubic midline port (optional)",
      ],
    });
  } else {
    preamble = laparotomyPreamble(c, "Pfannenstiel");
  }

  const steps = obgynOpSteps(c);

  let closure: string[];
  if (isObstetric && includesAny(name, ["cesarean", "caesarean", "c-section", "c/s", "lscs"])) {
    closure = [
      `All counts were reported as correct. The patient was transferred to the recovery room with the infant in stable condition.`,
    ];
  } else if (isObstetric || isVaginal) {
    closure = [`Hemostasis was confirmed. The patient tolerated the procedure well.`];
  } else if (isLap) {
    closure = standardLapClosure();
  } else {
    closure = standardOpenClosure();
  }

  return [...preamble, ...steps, ...closure];
}
