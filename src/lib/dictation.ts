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
// Specialty-aware templates
//
// General / Vascular steps modeled on the structure of Hoballah & Scott-Conner,
// "Operative Dictations in General and Vascular Surgery" (Springer, 2nd ed.):
// indications → essential steps → technical variations → complications.
// OB/GYN steps follow the standard ACOG-style operative report format
// (header → indications → findings → description → EBL/specimens/disposition).
//
// All wording is original — the references are used only for section
// structure and the clinical technique vocabulary any trainee would recognize.
// ---------------------------------------------------------------------------

function includesAny(haystack: string, needles: string[]): boolean {
  const s = haystack.toLowerCase();
  return needles.some((n) => s.includes(n));
}

// -- Shared preamble builders --------------------------------------------------

function laparotomyPreamble(c: CaseLog, incision: string): string[] {
  return [
    `Description of Procedure: The risks, benefits, and alternatives were discussed with the patient, and informed consent was obtained. The patient was brought to the operating room and placed supine on the table. After induction of general endotracheal anesthesia, a Foley catheter was placed and pre-incision antibiotics were administered within 60 minutes of incision. Sequential compression devices were applied.`,
    ``,
    `A surgical time-out was completed, confirming patient identity, procedure, site, consent, antibiotics, and availability of equipment. The abdomen was prepped with chlorhexidine and draped in the usual sterile fashion.`,
    ``,
    `A ${incision} skin incision was made and carried down through the subcutaneous tissue with electrocautery. The fascia was divided in the same orientation and the peritoneum was entered sharply, taking care to avoid injury to the underlying viscera. The abdomen was explored; findings are detailed above.`,
    ``,
  ];
}

function laparoscopicPreamble(c: CaseLog, opts: { ports: string[]; foley?: boolean }): string[] {
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
      c.surgicalApproach === "ROBOTIC" ? "Hasson technique at the umbilicus" : "Veress needle at the umbilicus (or Palmer's point if indicated)"
    } and insufflated to 15 mmHg. A ${c.surgicalApproach === "ROBOTIC" ? "12" : "10"} mm camera port was placed and the abdomen inspected under direct vision. The following working ports were then placed under direct visualization:`,
  );
  for (const p of opts.ports) lines.push(`  - ${p}`);
  if (c.surgicalApproach === "ROBOTIC") {
    lines.push(``, `The da Vinci [Xi/Si] robot was brought to the table and docked.`);
  }
  lines.push(``);
  return lines;
}

function standardOpenClosure(layered = true): string[] {
  const lines = [
    `Hemostasis was confirmed. The abdomen was irrigated with warm saline and suctioned dry. All counts were reported as correct by nursing staff prior to closure.`,
    ``,
  ];
  if (layered) {
    lines.push(
      `The fascia was closed with a running #1 looped PDS suture. The subcutaneous tissue was irrigated. The skin was approximated with 4-0 Monocryl in a subcuticular fashion and dressed with Dermabond and a sterile dressing.`,
    );
  } else {
    lines.push(
      `The wound was closed in a single layer with interrupted 0 Vicryl through the fascia, and the skin was approximated with staples or 4-0 Monocryl, followed by a sterile dressing.`,
    );
  }
  return lines;
}

function standardLapClosure(): string[] {
  return [
    `Hemostasis was confirmed throughout the operative field. All instruments and ports were removed under direct visualization and the pneumoperitoneum was released. Fascia at the 10/12 mm port sites was closed with 0 Vicryl. The skin was approximated with 4-0 Monocryl in a subcuticular fashion and dressed with Dermabond.`,
  ];
}

// -- General Surgery -----------------------------------------------------------

function generalSurgeryOpSteps(c: CaseLog): string[] {
  const name = c.procedureName.toLowerCase();
  const open = c.surgicalApproach === "OPEN";

  if (includesAny(name, ["cholecystectomy", "lap chole"])) {
    return [
      `The gallbladder was grasped at the fundus and retracted cephalad over the dome of the liver. The infundibulum was grasped and retracted laterally to open the hepatocystic triangle.`,
      `The peritoneum overlying the hepatocystic triangle was dissected on both the anterior and posterior aspects, clearing fibrofatty tissue off the gallbladder-cystic duct junction. A critical view of safety was obtained, with only two structures — the cystic duct and cystic artery — entering the gallbladder and the lower third of the gallbladder separated from the liver bed.`,
      `The cystic artery was doubly clipped proximally and distally and divided. The cystic duct was likewise doubly clipped proximally and singly clipped distally and divided. [Intraoperative cholangiogram was performed / was not indicated.]`,
      `The gallbladder was taken down from the liver bed using electrocautery, staying in the avascular plane. The liver bed and clip line were re-inspected and were hemostatic with no evidence of bile leak. The gallbladder was placed in an Endo Catch bag and removed through the umbilical port.`,
      ``,
    ];
  }

  if (includesAny(name, ["appendectomy", "appy"])) {
    return [
      `The cecum was identified and followed to the base of the appendix. The appendix was grasped and delivered into the operative field. The mesoappendix was inspected and the appendiceal artery identified.`,
      `The mesoappendix was divided using an energy device [LigaSure/harmonic] taking care to achieve hemostasis along the appendiceal artery. The base of the appendix was skeletonized and a window created.`,
      `An Endo GIA stapler with a [white / tan] load was fired across the base of the appendix, and the specimen was placed in an Endo Catch bag and removed through a 12 mm port. The staple line was inspected and was intact and hemostatic.`,
      ``,
    ];
  }

  if (includesAny(name, ["inguinal hernia"])) {
    return open
      ? [
          `A transverse incision was made over the inguinal canal and carried down through Scarpa's fascia to the external oblique aponeurosis. The external oblique was opened in the line of its fibers, taking care to preserve the ilioinguinal nerve. The spermatic cord was encircled with a Penrose drain.`,
          `The cord was dissected circumferentially and the hernia sac identified. The sac was a [direct / indirect] hernia. An indirect sac was dissected off the cord structures and reduced into the preperitoneal space after high ligation with 2-0 silk. A direct defect was reduced and the transversalis fascia imbricated.`,
          `A prefabricated polypropylene mesh was tailored to the floor of the inguinal canal and secured to the pubic tubercle, shelving edge of the inguinal ligament, and conjoint tendon with interrupted 2-0 Prolene, creating a new internal ring around the cord.`,
          `The external oblique was re-approximated with 2-0 Vicryl, Scarpa's with 3-0 Vicryl, and the skin with 4-0 Monocryl subcuticular and Dermabond.`,
        ]
      : [
          `The preperitoneal space was developed by balloon dissector in a TEP fashion (or transperitoneal dissection in a TAPP repair). The pubic symphysis, Cooper's ligament, epigastric vessels, and cord structures were identified bilaterally.`,
          `The hernia sac was reduced back into the peritoneal cavity. The myopectineal orifice was cleared of adhesions. A large pre-shaped polypropylene mesh was introduced and positioned to cover the direct, indirect, and femoral spaces, with wide overlap across the midline.`,
          `The mesh was secured [with tacks to Cooper's ligament, avoiding the triangle of doom and triangle of pain / with self-gripping technology]. Pneumoperitoneum was released and the peritoneal flap re-approximated if TAPP.`,
        ];
  }

  if (includesAny(name, ["ventral hernia", "umbilical hernia", "incisional hernia"])) {
    return [
      `The hernia sac was identified and dissected free of the surrounding subcutaneous tissue down to the fascial defect. The sac contents were reduced. The fascial edges were circumferentially cleared of adherent tissue to expose at least 4 cm of healthy fascia on each side.`,
      `A [retrorectus / intraperitoneal / onlay] polypropylene mesh was positioned with wide (≥ 4 cm) overlap of the defect and secured with interrupted 0 Prolene. The anterior fascia was re-approximated with running #1 looped PDS.`,
      `The subcutaneous tissue was irrigated and the skin was approximated with 4-0 Monocryl subcuticular and Dermabond.`,
    ];
  }

  if (includesAny(name, ["right hemicolectomy", "right colectomy"])) {
    return [
      `The right colon was mobilized along the white line of Toldt from the cecum to the hepatic flexure. The hepatocolic and gastrocolic ligaments were divided. The duodenum was swept posteriorly and care was taken to protect the right ureter and gonadal vessels.`,
      `The ileocolic pedicle was identified, skeletonized, and divided with an energy device or stapler at its origin off the SMA/SMV. The right colic and right branch of the middle colic were similarly divided.`,
      `The terminal ileum and transverse colon were transected with an Endo GIA stapler and the specimen was removed. A side-to-side functional end-to-end stapled ileocolic anastomosis was created and the common enterotomy closed with a second stapler firing. The anastomosis was inspected and was patent and hemostatic. The mesenteric defect was closed with 3-0 silk.`,
    ];
  }

  if (includesAny(name, ["mastectomy"])) {
    return [
      `An elliptical incision was marked to include the nipple-areolar complex (for total/simple mastectomy) or oriented appropriately for a skin-sparing / nipple-sparing approach. The skin flaps were raised in the avascular plane between the subcutaneous fat and the breast parenchyma using electrocautery, extending superiorly to the clavicle, medially to the sternum, inferiorly to the inframammary fold, and laterally to the latissimus dorsi.`,
      `The breast was dissected off the pectoralis major fascia from medial to lateral. [Axillary sentinel lymph node biopsy / level I–II axillary lymph node dissection] was performed through the same or a separate incision, identifying and preserving the long thoracic, thoracodorsal, and intercostobrachial nerves when feasible.`,
      `Hemostasis was achieved. A 15 Fr Blake drain was placed in the mastectomy bed and brought out through a separate stab incision. The skin was closed with 3-0 Vicryl in the deep dermis and 4-0 Monocryl subcuticular.`,
    ];
  }

  if (includesAny(name, ["thyroid"])) {
    return [
      `A transverse collar incision was made two finger-breadths above the sternal notch and carried down through the platysma. Subplatysmal flaps were raised superiorly to the thyroid cartilage and inferiorly to the sternal notch.`,
      `The strap muscles were separated in the midline and retracted laterally to expose the thyroid. The superior pole was mobilized, identifying and ligating the superior thyroid artery branches on the capsule to protect the external branch of the superior laryngeal nerve. The middle thyroid vein was ligated and divided.`,
      `The recurrent laryngeal nerve was identified in the tracheo-esophageal groove and traced superiorly, preserved throughout. The parathyroid glands were identified and preserved on their vascular pedicles. The inferior thyroid artery was ligated on the capsule and the ligament of Berry divided sharply.`,
      `The thyroid [lobe / gland] was removed. Hemostasis was meticulously confirmed. The strap muscles were re-approximated in the midline with 3-0 Vicryl, the platysma with 3-0 Vicryl, and the skin with 4-0 Monocryl subcuticular and Dermabond.`,
    ];
  }

  // Generic fallback — still better than the placeholder list
  return [
    `The operative field was exposed and the relevant anatomy identified. Key structures were dissected free and controlled. The ${c.procedureName} was performed in standard fashion, with attention to anatomic planes, hemostasis, and preservation of adjacent structures. [Expand with procedure-specific technical steps.]`,
    ``,
  ];
}

function generalSurgeryBody(c: CaseLog): string[] {
  const open = c.surgicalApproach === "OPEN";
  const preamble = open
    ? laparotomyPreamble(c, "midline")
    : laparoscopicPreamble(c, {
        ports: [
          "5 mm subxiphoid",
          "5 mm right mid-clavicular",
          "5 mm right anterior axillary (for lap chole)",
          "[additional ports as dictated by the procedure]",
        ],
      });
  const steps = generalSurgeryOpSteps(c);
  const closure = open ? standardOpenClosure() : standardLapClosure();
  return [...preamble, ...steps, ...closure];
}

// -- Vascular Surgery ----------------------------------------------------------

function vascularOpSteps(c: CaseLog): string[] {
  const name = c.procedureName.toLowerCase();

  if (includesAny(name, ["carotid endarterectomy", "cea"])) {
    return [
      `An oblique incision was made along the anterior border of the sternocleidomastoid, extending from the angle of the mandible to just above the clavicle, and carried down through the platysma. The SCM was retracted laterally and the carotid sheath entered. The common, internal, and external carotid arteries were dissected free with vessel loops placed around each. The hypoglossal, vagus, and marginal mandibular nerves were identified and preserved.`,
      `The patient was systemically heparinized with 5,000 units of IV heparin and an ACT was drawn and verified above 250 seconds. The internal, common, and external carotid arteries were cross-clamped in that order. [A Pruitt-Inahara shunt was placed after the arteriotomy was started / shunting was not required based on stump pressure and intraoperative monitoring.]`,
      `A longitudinal arteriotomy was made on the CCA and extended onto the ICA beyond the plaque. The atherosclerotic plaque was carefully dissected from the arterial wall in the subadventitial plane, with a feathered distal endpoint achieved on the ICA. All residual debris and loose intimal flaps were removed and the lumen was irrigated.`,
      `A bovine pericardial patch was fashioned and sewn onto the arteriotomy with running 6-0 Prolene. Prior to final tying, flow was flushed through the ECA, CCA, and finally the ICA to evacuate air and debris. Clamps were released in the order ECA → CCA → ICA.`,
      `Hemostasis was confirmed. Protamine was administered to reverse heparinization. Doppler signals were confirmed in the superficial temporal artery and across the endarterectomy site. The platysma was closed with 3-0 Vicryl and the skin with 4-0 Monocryl subcuticular.`,
    ];
  }

  if (includesAny(name, ["open aaa", "aaa repair", "open abdominal aortic"])) {
    return [
      `A midline laparotomy was performed and the abdomen explored. The small bowel was retracted to the right and the ligament of Treitz was taken down to expose the retroperitoneum overlying the infrarenal aorta. The retroperitoneum was incised and the infrarenal neck, both iliac arteries, and the left renal vein were exposed. Care was taken to protect the IMV, duodenum, and ureters.`,
      `The patient was systemically heparinized with 100 units/kg of IV heparin and an ACT verified above 250. The iliac arteries were cross-clamped, followed by the infrarenal aortic clamp. The aneurysm sac was opened longitudinally.`,
      `Mural thrombus was evacuated. Back-bleeding lumbar arteries were suture-ligated from within the sac with 2-0 Prolene. A [tube / aorto-bi-iliac] Dacron graft was sized and sewn proximally to the infrarenal aortic cuff with running 3-0 Prolene in a parachute technique, then flushed and the anastomosis tested. The distal anastomosis(es) were completed to the iliac arteries with 4-0 Prolene.`,
      `Prior to final unclamping, the graft was flushed and clamps were released sequentially to avoid declamping hypotension. Anastomoses were inspected and hemostatic. Distal perfusion was confirmed by Doppler of the femoral vessels.`,
      `Protamine was administered. The aneurysm sac was closed over the graft with running 2-0 Vicryl to exclude the bowel from the graft. The retroperitoneum was re-approximated. The abdomen was closed in standard fashion.`,
    ];
  }

  if (includesAny(name, ["evar", "endovascular aortic"])) {
    return [
      `Bilateral common femoral arteries were accessed percutaneously under ultrasound guidance with pre-closure using two Perclose ProGlide devices on each side. 5 Fr sheaths were placed and guidewires advanced under fluoroscopy into the descending thoracic aorta.`,
      `A calibrated pigtail catheter was advanced and an aortogram performed to identify the renal arteries and iliac bifurcation. The sheaths were upsized to accommodate the main body and contralateral limb of the [Gore Excluder / Medtronic Endurant / Cook Zenith] endograft.`,
      `Systemic heparinization was achieved (100 units/kg) with ACT > 250. The main body was deployed with the lowest renal artery as the proximal landing zone. The contralateral gate was cannulated and the contralateral limb deployed. Molding balloon angioplasty was performed at the proximal neck, flow divider, and distal landing zones.`,
      `Completion angiography demonstrated exclusion of the aneurysm sac without evidence of type I or III endoleak, and patent renal and hypogastric arteries. Sheaths were removed and the pre-placed ProGlide sutures were cinched down, achieving hemostasis of both groins. Protamine was administered.`,
    ];
  }

  if (includesAny(name, ["fem-pop", "femoral-popliteal", "femoropopliteal", "fem pop bypass"])) {
    return [
      `A longitudinal incision was made over the common femoral artery and the CFA, SFA, and profunda were exposed and encircled with vessel loops. A second incision was made over the [above-knee / below-knee] popliteal artery and the target segment exposed.`,
      `The ipsilateral greater saphenous vein was harvested and prepared as a reversed conduit (or in situ with valvulotomy). [Alternatively, a PTFE graft was selected based on conduit availability.] The patient was systemically heparinized (100 units/kg) with ACT > 250.`,
      `A subcutaneous tunnel was created between the two incisions. The proximal anastomosis was created end-to-side to the CFA with running 5-0 Prolene after a longitudinal arteriotomy, flushing prior to final tying. The distal anastomosis was performed end-to-side to the popliteal artery with 6-0 Prolene.`,
      `Flow was restored and the graft and anastomoses inspected for hemostasis. Distal Doppler signals were confirmed in the DP and PT arteries. Protamine was administered. Wounds were closed in layers with 3-0 Vicryl and 4-0 Monocryl.`,
    ];
  }

  if (includesAny(name, ["av fistula", "arteriovenous fistula", "avf", "dialysis access"])) {
    return [
      `Under local anesthesia with sedation, a longitudinal incision was made over the [radiocephalic / brachiocephalic] region. The cephalic vein was identified, dissected free, and controlled with vessel loops. The [radial / brachial] artery was similarly exposed.`,
      `The patient was heparinized (50 units/kg IV). The vein was mobilized adequately to allow a tension-free anastomosis and divided distally. A longitudinal arteriotomy was created and an end-to-side anastomosis between the vein and artery was performed with running 7-0 Prolene.`,
      `Flow was restored and an audible thrill and palpable pulse confirmed through the fistula. The wound was closed in layers with 4-0 Vicryl and 5-0 Monocryl subcuticular.`,
    ];
  }

  // Generic fallback for other vascular cases
  return [
    `Proximal and distal vascular control were obtained with vessel loops and atraumatic clamps. The patient was systemically heparinized with an ACT verified above 250 seconds. [Describe the specific reconstruction, endarterectomy, bypass, or endovascular intervention.] Flow was restored in a controlled fashion. Distal pulses/Doppler signals were confirmed. Protamine was administered and hemostasis confirmed.`,
    ``,
  ];
}

function vascularBody(c: CaseLog): string[] {
  const isEndo =
    c.surgicalApproach === "ENDOSCOPIC" ||
    c.surgicalApproach === "PERCUTANEOUS" ||
    includesAny(c.procedureName.toLowerCase(), ["evar", "tevar", "endovascular", "angioplasty", "stent"]);
  const preamble = isEndo
    ? [
        `Description of Procedure: The risks, benefits, and alternatives were discussed with the patient and informed consent was obtained. The patient was brought to the hybrid OR / angio suite and placed supine on a fluoroscopy-capable table. [General / local with sedation] anesthesia was induced. Pre-procedure antibiotics were administered and both groins were prepped and draped in the usual sterile fashion.`,
        ``,
        `A surgical time-out was completed.`,
        ``,
      ]
    : [
        `Description of Procedure: The risks, benefits, and alternatives were discussed with the patient and informed consent was obtained. The patient was brought to the operating room and placed supine. After induction of general endotracheal anesthesia, an arterial line was placed and pre-incision antibiotics were administered. The operative field was prepped and draped in the usual sterile fashion.`,
        ``,
        `A surgical time-out was completed, confirming patient identity, procedure, site, consent, antibiotics, and availability of blood products and graft material.`,
        ``,
      ];
  const steps = vascularOpSteps(c);
  const closure = isEndo
    ? [
        `Hemostasis at both groin access sites was confirmed. Sterile dressings were applied. Distal pulses were confirmed bilaterally at the end of the procedure.`,
      ]
    : [
        `Hemostasis was meticulously confirmed. Distal pulses/Doppler signals were confirmed. The wound(s) were closed in layers with 3-0 Vicryl for the fascia, 3-0 Vicryl for the subcutaneous tissue, and 4-0 Monocryl subcuticular for the skin, followed by sterile dressings.`,
      ];
  return [...preamble, ...steps, ...closure];
}

// -- OB / GYN ------------------------------------------------------------------

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

function obgynBody(c: CaseLog): string[] {
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
  const isVaginal = includesAny(name, ["vaginal hysterectomy", "d&c", "d and c", "dilation", "dilatation", "tubal"]);
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

// -- Router --------------------------------------------------------------------

function bodyForCase(c: CaseLog): string[] {
  const specialty = (c.specialtyName || "").toLowerCase();
  if (specialty.includes("vascular")) return vascularBody(c);
  if (
    specialty.includes("obgyn") ||
    specialty.includes("ob-gyn") ||
    specialty.includes("ob/gyn") ||
    specialty.includes("obstetric") ||
    specialty.includes("gynec")
  ) {
    return obgynBody(c);
  }
  if (specialty.includes("general surgery")) return generalSurgeryBody(c);
  return procedureBody(c);
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
  // Route through specialty-aware builders (general surgery, vascular, OB/GYN);
  // falls back to the generic approach-based template for other specialties.
  const body = bodyForCase(c);
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
