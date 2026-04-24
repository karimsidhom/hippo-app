import type { CaseLog } from "@/lib/types";
import { includesAny } from "../shared/format";
import { laparotomyPreamble, laparoscopicPreamble } from "../shared/preamble";
import { standardOpenClosure, standardLapClosure } from "../shared/closure";
import type { TopMatter } from "./types";

// ---------------------------------------------------------------------------
// OB/GYN — forced fields:
//   - Fetal lie, presentation, position at delivery
//   - Fetal heart rate category during case
//   - Placental findings and cord issues
//   - Uterine tone response (oxytocin / methergine / hemabate)
//   - Cord gases and APGAR scores
//   - Repair layers (hysterotomy closure, vaginal repair)
//   - Adnexal findings and pelvic pathology
// ---------------------------------------------------------------------------

export function obgynTopMatter(c: CaseLog): TopMatter {
  const name = c.procedureName.toLowerCase();

  if (includesAny(name, ["cesarean", "caesarean", "c-section", "lscs", "c/s"])) {
    return {
      anesthesia: "Spinal / combined spinal-epidural anesthesia (or general endotracheal for emergent cases).",
      ebl: "Approximately 800–1000 ml.",
      drains: "None routinely.",
      specimens: "Placenta to pathology per indication.",
      disposition:
        "The patient tolerated the procedure well. Mother and baby are stable and transferred to postpartum recovery together for skin-to-skin and breastfeeding initiation. Standard post-cesarean pathway: IV oxytocin infusion, multimodal analgesia, early ambulation, voiding trial, advance diet as tolerated.",
    };
  }

  if (includesAny(name, ["hysterectomy"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Approximately 100–250 ml.",
      drains: "None.",
      specimens: "Uterus +/- cervix oriented for pathology; adnexa submitted separately when removed.",
      disposition:
        "The patient tolerated the procedure well. Admitted to the surgical floor. Clear liquids advancing as tolerated, early ambulation, multimodal analgesia, DVT prophylaxis. Foley removal on POD 1.",
    };
  }

  if (includesAny(name, ["d&c", "dilation and curettage"])) {
    return {
      anesthesia: "Monitored anesthesia care / general anesthesia.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Endometrial curettings to pathology.",
      disposition:
        "The patient tolerated the procedure well. Discharge home the same day. Return precautions for heavy bleeding, fever, or severe pain.",
    };
  }

  if (includesAny(name, ["myomectomy"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Approximately 200–400 ml.",
      drains: "None routinely.",
      specimens: "Leiomyomata submitted for pathology.",
      disposition:
        "The patient tolerated the procedure well. Admitted for standard recovery. Pain control, early ambulation, uterine contractility monitoring. Counsel regarding uterine scar implications for future pregnancy.",
    };
  }

  if (includesAny(name, ["salping", "oophorectom", "cystectomy", "tubal"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Adnexal structure / ovarian cyst to pathology.",
      disposition:
        "The patient tolerated the procedure well. Recovery as outpatient or short admission depending on indication. Hormonal counseling when oophorectomy performed on premenopausal patient.",
    };
  }

  return {
    anesthesia: "General / regional anesthesia.",
    ebl: "Approximately ________ ml.",
    drains: "None.",
    specimens: "[Specimens to pathology or 'None'].",
    disposition: "The patient tolerated the procedure well. Recovery per standard OB/GYN service protocol.",
  };
}

export function obgynFindings(c: CaseLog): string {
  const name = c.procedureName.toLowerCase();

  if (includesAny(name, ["cesarean", "caesarean", "c-section", "lscs", "c/s"])) {
    return `A live [singleton / twin] gestation was delivered in [vertex / breech / transverse] presentation. Fetal heart rate during the procedure remained [Category I / intermittently Category II with reassuring return / Category III prompting expedited delivery]. The amniotic fluid was [clear / meconium-stained / bloody]. The placenta was delivered intact with a 3-vessel umbilical cord. Cord gases were sent. APGAR scores were [__] at 1 minute and [__] at 5 minutes. Estimated weight [__] g. The uterus was delivered into the operative field and responded well to oxytocin / methergine with good tone. The fallopian tubes and ovaries were inspected and were normal. The hysterotomy was closed in two layers with running absorbable suture and was hemostatic.`;
  }

  if (includesAny(name, ["hysterectomy"])) {
    return `The uterus was [enlarged / normal in size / fibroid-studded] with [__] cm largest myoma identified. The adnexa were [normal bilaterally / contained a [__] cm simple cyst]. There were [no / dense] pelvic adhesions. The ureters were identified bilaterally and traced safely throughout the dissection. The cuff was closed with interrupted / running absorbable suture and was hemostatic. No bladder or bowel injury was encountered.`;
  }

  if (includesAny(name, ["d&c", "dilation and curettage"])) {
    return `The cervix dilated atraumatically to [__] Hegar. Uniform endometrial curettings were obtained from all four quadrants without evidence of perforation. The uterus sounded to [__] cm. Minimal blood loss was encountered.`;
  }

  if (includesAny(name, ["myomectomy"])) {
    return `The uterus contained [__] intramural / subserosal / submucosal leiomyomata, the largest measuring approximately [__] cm at the [anterior / posterior / fundal] wall. The myomata were enucleated within their capsules. The myometrial defect was closed in layers with absorbable suture. The tubes and ovaries were inspected and were normal.`;
  }

  if (includesAny(name, ["salping", "oophorectom", "cystectomy", "tubal"])) {
    return `The [left / right / bilateral] adnexa were identified. A [__] cm [simple / complex / hemorrhagic] ovarian cyst / [hydrosalpinx / ectopic pregnancy] was identified, consistent with the preoperative imaging. The ureter was identified and protected. The contralateral adnexa were normal. No evidence of peritoneal implants or carcinomatosis was encountered.`;
  }

  return `Intraoperative findings were consistent with the preoperative diagnosis. The pelvic anatomy was identified and inspected. Hemostasis was satisfactory.`;
}

function obgynOpSteps(c: CaseLog): string[] {
  const name = c.procedureName.toLowerCase();

  if (includesAny(name, ["cesarean", "caesarean", "c-section", "lscs", "c/s"])) {
    return [
      `A Pfannenstiel skin incision was made two finger-breadths above the pubic symphysis and carried down through the subcutaneous tissue with electrocautery. The anterior rectus sheath was incised transversely and extended bilaterally with Mayo scissors. The rectus muscles were separated in the midline bluntly. The peritoneum was elevated and entered sharply, taking care to avoid injury to the bladder and bowel.`,
      `The bladder flap was developed by incising the vesicouterine peritoneum transversely and bluntly dissecting the bladder inferiorly. A low transverse hysterotomy was created with a scalpel and extended bilaterally with bandage scissors (or bluntly) in a curvilinear fashion to avoid extension into the uterine vessels.`,
      `The infant's [head / breech] was delivered atraumatically. The nares and mouth were suctioned. The cord was doubly clamped and divided. The infant was handed off to the neonatal team. Apgars were [9/9 or as assigned]. Cord blood was sent.`,
      `The placenta was delivered spontaneously with gentle cord traction (or manually as indicated) and inspected for completeness. The uterine cavity was wiped clear of membranes and clot with a clean sponge. The hysterotomy edges were grasped with green Armytage clamps and the incision was closed with 0 Vicryl — [single-layer running unlocked, or two-layer with a first running locked layer and a second imbricating layer per surgeon preference]. The adnexa were inspected bilaterally and were normal. Hemostasis was confirmed.`,
      `The uterus was returned to the abdominal cavity. The gutters were inspected. The fascia was closed with running 0 Vicryl. The subcutaneous tissue was re-approximated with [plain gut chromic / 3-0 Vicryl per surgeon preference] and the skin closed with [3-0 Vicryl on a straight needle / 4-0 Monocryl subcuticular]. A sterile dressing was applied.`,
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
      `A Foley catheter was placed under sterile conditions. A weighted speculum was placed in the vagina, the cervix grasped with a single-tooth tenaculum, and the cervical os dilated up to a #6 Hegar dilator. A uterine manipulator with a ceramic cup — [Valchev / RUMI / V-Care / Hohl per surgeon preference] — was inserted and seated. The weighted speculum was then removed.`,
      `Attention was turned to the abdomen. 0.5% bupivacaine was infiltrated at all port sites. Pneumoperitoneum was established through a subumbilical Veress approach (opening pressure <8 mmHg) and the cavity insufflated to 20 mmHg. A 10 mm subumbilical trocar was placed, the laparoscope introduced, and three additional 5 mm working trocars placed (one left, two right) under direct visualization, avoiding the epigastric vessels. The patient was placed in steep Trendelenburg.`,
      `On the right side, the infundibulopelvic (IP) ligament was identified by lifting the tube anteriorly, and the ureter was visualized along the pelvic sidewall with peristalsis confirmed. An [Ligasure / Thunderbeat / Enseal per surgeon preference] vessel-sealing device was used to clamp and ligate the IP ligament in three sequential overlapping regions to secure the blood supply prior to cutting. The IP was then cut mid-distance and the pedicle inspected for hemostasis. The broad ligament was sequentially clamped, ligated, and cut working towards the round ligament, staying away from the ureter and sidewall vasculature. The round ligament was ligated and cut. The anterior leaf of the broad ligament was taken down, dissecting towards the peritoneal reflection at the bladder base adjacent to the cervix. The same sequence was repeated on the left.`,
      `Once the bladder was dissected free from the lower anterior uterine segment, the uterine arteries were clamped and ligated bilaterally. Pedicles were inspected and hemostatic. At the level of the ceramic manipulator cup, the vaginal vault was incised circumferentially with a [monopolar J-hook / L-hook / Mahnes needle]. The uterus (± tubes/ovaries) was delivered through the vagina and sent to pathology.`,
      `A sterile glove was placed into the vagina to form a pneumatic seal. All pedicles and cuff edges were examined. Hemostasis was achieved with bipolar cautery. The vaginal vault was closed laparoscopically with [0 V-Loc barbed suture / 0 Vicryl / Endo Loc per surgeon preference] in a running fashion, incorporating the uterosacral ligaments bilaterally for apical support and avoiding the bladder and lateral pedicles. Hemostasis was re-confirmed.`,
      `Cystoscopy was performed following the TLH to confirm bladder and ureter integrity: the bladder mucosa was normal and bilateral ureteric jets were visualized — no evidence of injury.`,
      `All ports were removed under direct visualization with hemostasis confirmed. The 10 mm port was opened to release the pneumoperitoneum and withdrawn under visualization with the laparoscope. The 10 mm fascial defect was closed with a deep 0 Vicryl figure-of-eight suture using Kocher clamps to elevate the fascia, being mindful to avoid bowel. All incisions were closed with 4-0 Monocryl subcuticular.`,
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
