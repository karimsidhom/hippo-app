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

  if (includesAny(name, ["ectopic", "salpingostomy for ectopic"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Approximately 100–500 ml (variable; can be brisk if rupture).",
      drains: "None.",
      specimens: "Products of conception ± fallopian tube to pathology.",
      disposition:
        "The patient tolerated the procedure well. Admitted for observation if hemodynamically affected. Plan: serial βhCG to negativity, anti-D immunoglobulin if Rh-negative.",
    };
  }

  if (includesAny(name, ["endometriosis", "lap endo"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Approximately 50–200 ml.",
      drains: "None.",
      specimens: "Endometriotic implants ± deep nodules to pathology, labelled by location.",
      disposition:
        "The patient tolerated the procedure well. Recovery as outpatient or short admission. Plan: post-op pelvic pain management, hormonal suppression discussion at 2-week follow-up.",
    };
  }

  if (includesAny(name, ["hysteroscopy", "hysteroscopic", "essure removal", "endometrial ablation", "novasure", "thermachoice"])) {
    return {
      anesthesia: "Monitored anesthesia care or general anesthesia.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Endometrial polypectomy / fibroid resection specimens / ablation tissue to pathology where applicable.",
      disposition:
        "The patient tolerated the procedure well. Discharge home the same day with return precautions for fevers, severe cramping, or heavy bleeding.",
    };
  }

  if (includesAny(name, ["leep", "cervical conisation", "cone biopsy", "cold knife cone"])) {
    return {
      anesthesia: "Local anesthesia with sedation (LEEP) or general anesthesia (cold knife cone).",
      ebl: "Minimal to approximately 100 ml.",
      drains: "None.",
      specimens: "Cervical cone specimen oriented (12 o'clock stitch) to pathology.",
      disposition:
        "The patient tolerated the procedure well. Discharge home the same day. Plan: pelvic rest × 4 weeks, follow-up Pap and colposcopy at 6 months per ASCCP guidelines.",
    };
  }

  if (includesAny(name, ["perineal laceration", "perineal repair", "episiotomy"])) {
    return {
      anesthesia: "Local anesthesia (lidocaine) ± epidural top-up; general for 4th-degree.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well. Standard postpartum care. Plan: stool softeners, sitz baths, pelvic-floor physiotherapy referral for 3rd/4th-degree tears.",
    };
  }

  if (includesAny(name, ["ovarian cystectomy", "ovarian cyst"]) && !includesAny(name, ["oophorectomy"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Minimal to approximately 100 ml.",
      drains: "None.",
      specimens: "Cyst wall to pathology.",
      disposition:
        "The patient tolerated the procedure well. Recovery as outpatient or short admission. Plan: hormonal contraception consideration for cyst recurrence prevention.",
    };
  }

  if (includesAny(name, ["bilateral salpingectomy", "bilateral salpingo-oophorectomy", "bso", "salpingectomy", "salpingo-oophorectomy"]) && !includesAny(name, ["hysterectomy"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Tubes ± ovaries to pathology, labelled by side.",
      disposition:
        "The patient tolerated the procedure well. Recovery as outpatient. Plan: counseling regarding surgical menopause when bilateral oophorectomy performed on premenopausal patient (HRT discussion).",
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

  if (includesAny(name, ["ectopic"])) {
    return `A [left / right] tubal ectopic pregnancy was identified at the [ampullary / isthmic / fimbrial] portion, measuring approximately [__] cm with [no / active] hemoperitoneum (estimated [__] mL). The contralateral tube and bilateral ovaries were normal. There was no other intra-abdominal pathology.`;
  }

  if (includesAny(name, ["endometriosis"])) {
    return `Stage [I / II / III / IV] endometriosis was confirmed: [superficial peritoneal implants / deep infiltrating endometriosis / endometrioma]. Implants were noted in the [pouch of Douglas / bladder peritoneum / uterosacral ligaments / ovarian fossae]. There was [no / partial / complete] obliteration of the cul-de-sac. The ureters were identified and protected throughout dissection.`;
  }

  if (includesAny(name, ["hysteroscopy", "hysteroscopic", "endometrial ablation"])) {
    return `Hysteroscopy demonstrated [a normal endometrial cavity / endometrial polyp(s) / submucosal fibroid(s) / synechiae]. The cervical canal was patent. Both tubal ostia were identified bilaterally. The endometrium was [proliferative / secretory / atrophic in appearance]. [Description of pathology and treatment performed.]`;
  }

  if (includesAny(name, ["leep", "cervical conisation", "cone biopsy"])) {
    return `Colposcopy prior to excision demonstrated [acetowhite changes / mosaicism / punctation] in the [transformation zone / endocervix]. The lesion was visualised in its entirety with the SCJ visible. The cone specimen was oriented at 12 o'clock with a stitch and submitted to pathology. Hemostasis was achieved at the cone bed.`;
  }

  if (includesAny(name, ["perineal laceration", "perineal repair", "episiotomy"])) {
    return `Examination demonstrated a [first / second / third / fourth-degree] perineal laceration extending from [the introitus / through the anal sphincter complex / into the rectal mucosa]. The vaginal mucosa, perineal body, [external anal sphincter, internal anal sphincter, and rectal mucosa] were identified. There was no extension into surrounding structures.`;
  }

  if (includesAny(name, ["ovarian cystectomy"]) && !includesAny(name, ["oophorectomy"])) {
    return `A [__] cm [simple / hemorrhagic / dermoid / endometriotic] ovarian cyst was identified on the [left / right / bilateral] ovary. The contralateral ovary and bilateral tubes were normal. The cyst wall was completely excised with preservation of normal ovarian cortex. There was no spillage [or minimal controlled spillage with copious irrigation].`;
  }

  if (includesAny(name, ["bilateral salpingectomy", "bilateral salpingo-oophorectomy", "bso", "salpingectomy", "salpingo-oophorectomy"]) && !includesAny(name, ["hysterectomy"])) {
    return `The [bilateral / left / right] fallopian tubes ± ovaries were identified. The pelvic anatomy was otherwise normal. The ureters were identified bilaterally and protected. There was no evidence of carcinomatosis or peritoneal implants. The specimen(s) were removed without spillage and submitted to pathology by side.`;
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
      `The patient was positioned ${c.surgicalApproach === "OPEN" ? "supine for laparotomy" : "in dorsal lithotomy with adjustable Allen stirrups, buttocks at the table edge for laparoscopic/robotic approach with uterine manipulator (RUMI II) inserted"}. Antibiotic prophylaxis (cefazolin 2 g IV) was given. The abdomen was prepped and draped. Preoperative imaging (TVUS or MRI) was reviewed to confirm number, size, location, and FIGO classification of fibroids: Type 0-1-2 (submucosal — better treated hysteroscopically), Type 3-4 (intramural — primary myomectomy candidates), Type 5-7 (subserosal — best myomectomy candidates), Type 8 (parasitic). Hemoglobin was optimised preoperatively (Hb > 10 g/dL recommended; tranexamic acid + iron + GnRH agonist for 3 months preop reduces fibroid volume by 30-50% and intraoperative bleeding).`,
      `${c.surgicalApproach === "OPEN" ? "A Pfannenstiel incision (or vertical midline for very large uteri > 16-week size) was made and the abdomen entered. The uterus was delivered into the wound and packed with moist laparotomy pads to keep bowel out of the field." : "Pneumoperitoneum was established to 15 mmHg via Veress at Palmer's point (left upper quadrant, preferred for large uteri to avoid Veress injury) or supraumbilical Hasson if uterus extended above the umbilicus. Five ports were placed: 12 mm camera port (supraumbilical for large uteri, umbilical for smaller), two 5 mm working ports in the lower quadrants, 5 mm suprapubic, and a 12 mm port for morcellator/extraction. Steep Trendelenburg was established."} The uterus was inspected and palpated to confirm fibroid number and location.`,
      `Dilute vasopressin (20 units in 100 mL warmed saline) was injected into the serosa and myometrium overlying the dominant fibroid using a 22-gauge spinal needle, with care to aspirate before injection to avoid intravascular injection (vasopressin causes profound vasoconstriction, hypertension, and bradycardia; intravascular injection can cause severe systemic effects). Tourniquet (Penrose drain or Foley) was placed at the lower uterine segment around the broad ligament base for very large myomectomies (Bonney's clamp or Rubin tourniquet) to occlude uterine arteries — released every 20 minutes to prevent ischemic injury. Cell-saver was set up for cases anticipating > 500 mL blood loss.`,
      `A serosal incision was planned to minimise the number of incisions (multiple fibroids enucleated through a single incision when feasible — better for fertility outcome and uterine integrity in subsequent pregnancy). Vertical midline anterior or posterior incisions were preferred over transverse (less interference with uterine vasculature). The serosal incision was made with monopolar hook or Bovie down to the fibroid pseudocapsule (recognised as a glistening white plane between fibroid and surrounding myometrium). The fibroid was grasped with a corkscrew (open) or tenaculum/myoma screw (laparoscopic), and gentle traction-counter-traction was applied with sharp dissection in the pseudocapsule plane to enucleate the fibroid without breaching myometrium.`,
      `Vascular pedicle at the deepest point of the fibroid was identified, sealed with vessel-sealing device or suture-ligated, and divided. Additional fibroids in proximity were removed through the same incision when possible, by tunneling within the myometrium to adjacent fibroids ('beach diving' technique) — important to limit serosal incisions for adhesion prevention. The myometrial defect was assessed for depth and integrity.`,
      `The uterine defect was closed in 2-3 layers depending on depth: deep myometrial layer with 0 Vicryl interrupted figure-of-eight or 0 V-Loc barbed suture running, obliterating dead space (hematoma in the defect predisposes to dehiscence and uterine rupture in pregnancy); superficial myometrial layer with 2-0 Vicryl running; serosal layer with 3-0 Vicryl in a baseball/imbricating stitch to bury raw surface and minimise adhesion formation. Hemostasis was confirmed at each layer.`,
      `${c.surgicalApproach === "OPEN" ? "" : "For laparoscopic/robotic myomectomy: tissue extraction was performed by contained morcellation in an Endo Catch bag (FDA black-box warning regarding open power morcellation due to risk of disseminating occult leiomyosarcoma, ~1/350 risk in surgically removed fibroids per FDA estimate; current standard is in-bag morcellation using PneumoLiner or similar containment system, or vaginal extraction via colpotomy, or mini-laparotomy extraction). The contained specimen was morcellated in the bag and removed."} The pelvis was irrigated and inspected. An anti-adhesion barrier (Interceed, SprayShield) was applied to all serosal incisions.`,
      `${c.surgicalApproach === "OPEN" ? "Closure was performed in standard fashion: rectus fascia with running 1 PDS, subcutaneous with 3-0 Vicryl, skin with 4-0 Monocryl subcuticular." : "Pneumoperitoneum was released. 12 mm fascia closed with 0 Vicryl Carter-Thomason. Skin closed with 4-0 Monocryl."} The patient was counseled regarding the uterine scar implications for future pregnancy: deep myomectomy with cavity entry mandates elective C/S at 36-37 weeks for subsequent pregnancy (uterine rupture risk 1-4% in labor); superficial subserosal myomectomy without cavity entry permits TOLAC. Follow-up MRI at 6 months was offered for fibroid recurrence assessment in fertility-seeking patients (recurrence rate ~25% at 5 years).`,
    ];
  }

  if (includesAny(name, ["d&c", "dilation and curettage", "dilatation and curettage", "d and c"])) {
    return [
      `The patient was positioned in dorsal lithotomy with the buttocks at the table edge. The indication was reviewed: incomplete miscarriage (most common indication), AUB workup (perimenopausal/postmenopausal endometrial sampling), retained products of conception, gestational trophoblastic disease, missed abortion, septic abortion (broad-spectrum antibiotics started preoperatively for septic abortion). Ultrasound was reviewed to assess uterine size, retained tissue location, and rule out ectopic. Antibiotic prophylaxis (cefazolin 2 g IV) was given for retained products or symptomatic miscarriage. Hemoglobin and Rh status were checked.`,
      `Adequate anesthesia (MAC for routine D&C, general for septic/large uterus, paracervical block for office D&C) was confirmed. The vagina and perineum were prepped with chlorhexidine. A weighted speculum was placed posteriorly. The cervix was identified and grasped with a single-tooth tenaculum at the 12 o'clock position. A paracervical block was placed (10 mL of 1% lidocaine with epinephrine at 4 and 8 o'clock at the cervico-vaginal junction, just lateral to the cervix at the level of the uterosacral ligament insertion) for additional analgesia.`,
      `The uterus was sounded with a Sims uterine sound to identify cavity length (typically 6-9 cm) and direction, with the sound passed gently to avoid perforation. Resistance was felt at the internal os; sounding past the internal os was performed gently. The cervix was serially dilated with Hegar dilators (or Pratt dilators for postmenopausal/scarred cervix) progressively from 4 to ${name.includes("missed") || name.includes("incomplete") || name.includes("rpoc") ? "12-14 mm (sufficient for suction curette and any retained tissue)" : "8-10 mm (sufficient for sharp curette)"}. Misoprostol 400 mcg vaginal pretreatment 3-4 hours preoperatively was used in nulliparous or postmenopausal patients to soften the cervix and reduce dilation injury.`,
      `${name.includes("suction") || name.includes("missed") || name.includes("incomplete") || name.includes("rpoc") ? "A suction curette of appropriate size (10-12 mm Karman cannula or rigid suction curette) was introduced and gentle suction applied (≤ 60 mmHg vacuum) while rotating the cannula and moving it from fundus to cervix in a systematic pattern covering all 4 quadrants. The procedure was complete when no further tissue was aspirated and a 'gritty' uterine wall sensation was appreciated by the curette." : "A sharp curette (Sims or Heaney curette of appropriate size — typically size 3-4) was introduced and the endometrial cavity was systematically curetted from all four quadrants until a uniform 'gritty' uterine wall sensation was appreciated. Tissue was collected on gauze placed in the posterior cul-de-sac during curettage."} ${name.includes("septic") ? "Antibiotic-soaked sponges were placed in the cavity briefly for septic abortion. Curettage was deliberate but gentle — septic uterus is friable and at high risk of perforation." : ""}`,
      `${name.includes("hysteroscopy") || name.includes("see and treat") ? "Diagnostic hysteroscopy was performed after curettage with a 5 mm flexible hysteroscope and saline distension to confirm complete cavity evacuation. Any residual tissue or unsuspected pathology (polyp, fibroid, synechiae) was identified and managed accordingly." : ""}Specimens were collected and sent for pathology — for retained products: confirmation of villi rules out ectopic; for AUB workup: routine pathology; for trophoblastic disease: pathology + serial βhCG; for septic abortion: tissue + cervical/endometrial cultures.`,
      `Hemostasis was confirmed by direct visualisation through the dilated cervix — minimal bleeding from the cavity is expected. Heavy persistent bleeding suggests retained tissue (re-curette), uterine atony (uterotonics — methylergonovine 0.2 mg IM, carboprost 250 mcg IM, misoprostol 800 mcg PR), or perforation (consider diagnostic laparoscopy if perforation suspected, especially through fundal site or with bowel/omental tissue on curette). The tenaculum was removed and tenaculum site hemostasis was confirmed (silver nitrate or Monsel's if bleeding). The speculum was removed.`,
      `The patient was transferred to recovery. Anti-D immunoglobulin (300 mcg IM) was administered for Rh-negative patients with confirmed pregnancy tissue. Discharge same-day with instructions: expect bleeding/spotting × 1-2 weeks, mild cramping (NSAIDs), pelvic rest × 2 weeks, return precautions for fever > 38.5°C, heavy bleeding > 1 pad/hour, severe pain, foul discharge. Follow-up: serial βhCG to negativity for trophoblastic disease (weekly to 0, then monthly × 6 months); pathology review at 7-10 days; pelvic exam at 2-4 weeks.`,
    ];
  }

  if (includesAny(name, ["tubal ligation", "bilateral tubal ligation", "btl"])) {
    const isPostpartum = name.includes("postpartum") || name.includes("ppbtl");
    return [
      `The patient was positioned ${isPostpartum ? "supine immediately postpartum (typically within 24-48 hours of vaginal delivery, or at the time of cesarean) — the puerperal uterus has the fundus at or near the umbilicus and tubes are easily accessible through a small subumbilical incision" : "in dorsal lithotomy for laparoscopic interval sterilisation"}. The patient had been thoroughly counseled regarding permanence (regret rate ~20% in patients < 30, < 5% in patients > 35; reversal microsurgery achieves 50-80% pregnancy rates with significant ectopic risk; alternative — long-acting reversible contraception with similar efficacy and reversibility); failure rate (US Collaborative Review of Sterilization: cumulative 10-year pregnancy rate ~18.5/1000 women, varying by method — 24.8 for spring clip, 16.5 for bipolar coag, 7.5 for Pomeroy, 20 for ring, 7.5 for postpartum partial salpingectomy); ectopic risk if pregnancy occurs (33% post-sterilization pregnancies are ectopic); and irreversibility/regret implications. Antibiotic prophylaxis (cefazolin 2 g IV) was given. ${isPostpartum ? "" : "A 16 Fr Foley was placed and a uterine manipulator inserted."}`,
      `${isPostpartum ? "A 2-3 cm subumbilical incision was made through the skin and subcutaneous tissue, then the rectus sheath was incised and the peritoneum entered sharply. The fundus of the puerperal uterus was identified just below the umbilicus." : "Pneumoperitoneum was established to 15 mmHg via Veress at the umbilicus or Hasson if prior surgery. A 5 mm umbilical port and one or two 5 mm suprapubic ports were placed (single-port techniques are common for sterilization). Steep Trendelenburg was established. The pelvis was inspected and the uterus, tubes, and ovaries identified."}`,
      `The fallopian tubes were systematically identified bilaterally by tracing each from the cornual end to the fimbriated end. Identification of the fimbria is mandatory before transection — the round ligament is the most common structure mistaken for tube. Both ovaries were inspected and confirmed normal. Pelvic anatomy was documented to be otherwise normal.`,
      `${name.includes("opportunistic") || name.includes("salpingectomy") ? "Opportunistic complete bilateral salpingectomy was performed (preferred over partial salpingectomy or clip per current ACOG/SGO guidance, given 15-20% reduction in subsequent ovarian/tubal/peritoneal cancer): " : ""}${name.includes("pomeroy") ? "Modified Pomeroy technique: the tube was grasped at the mid-isthmic portion, a 2-3 cm loop was formed and ligated at the base with a single absorbable suture (0 plain catgut or chromic), and the loop excised between two clamps. The technique relies on differential absorption — the catgut absorbs and the cut tubal ends retract apart, leaving a gap that prevents re-anastomosis." : name.includes("filshie") || name.includes("clip") ? "Filshie clip technique: the clip applicator was placed across the isthmic portion of the tube approximately 2-3 cm from the cornua, and the clip was deployed across the full tubal width, occluding the lumen. Each clip was confirmed to be perpendicular to the tube and at the correct level — too cornual or too distal placement increases failure rate." : name.includes("ring") || name.includes("falope") ? "Falope ring (Yoon ring) technique: the tube was drawn into the applicator using the inner trough and a Silastic ring was deployed around the base of the loop, occluding the tube. The ring sat on the isthmic portion approximately 3 cm from the cornua." : name.includes("bipolar") || name.includes("electrocautery") ? "Bipolar electrocoagulation: a 2-3 cm segment of the isthmic tube was grasped with bipolar Kleppinger forceps and energy was applied at 25-35 W until impedance increased and the tissue blanched white. The procedure was repeated at three contiguous sites along the isthmic tube to ensure adequate destruction." : "Complete salpingectomy: a vessel-sealing device was used to serially seal and divide the mesosalpinx working from the fimbriated end toward the cornua, taking the entire tube including fimbria. The cornual portion was sealed and divided flush with the uterine wall. Care was taken to preserve the utero-ovarian ligament and ovarian blood supply."} The contralateral tube was treated identically.`,
      `Specimens (excised tubal segments or complete tubes) were sent for pathology to confirm tubal tissue — confirmation is mandatory both for medico-legal documentation of the procedure and to identify any unexpected pathology. Hemostasis was confirmed bilaterally — the mesosalpinx is rich in vascular collaterals and small bleeders are common. ${name.includes("opportunistic") || name.includes("salpingectomy") ? "For opportunistic salpingectomy: SEE-FIM-style pathology examination was requested for BRCA carriers; standard pathology for non-carriers." : ""}`,
      `${isPostpartum ? "Closure was in layers: peritoneum and posterior rectus sheath with running 0 Vicryl, anterior rectus sheath with running 0 Vicryl, subcutaneous tissue with 3-0 Vicryl, skin with 4-0 Monocryl subcuticular." : "Pneumoperitoneum was released and ports removed. 5 mm port sites were closed at skin only with 4-0 Monocryl subcuticular."} ${isPostpartum ? "The patient was returned to the postpartum floor for routine recovery." : "The Foley was removed at end of case. Discharge home same-day."} The patient was reminded that the tubal sterilization is effective immediately upon completion of the procedure (no waiting period for backup contraception). Long-term follow-up: no specific surveillance required; pregnancy in the setting of tubal sterilization should prompt urgent evaluation for ectopic pregnancy.`,
    ];
  }

  if (includesAny(name, ["forceps"])) {
    return [
      `Indications and prerequisites for operative vaginal delivery (ACOG Practice Bulletin 219 / RCOG Greentop 26) were reviewed and confirmed: prolonged second stage (≥ 3 h primigravida with regional, ≥ 2 h without; ≥ 2 h multigravida with regional, ≥ 1 h without), maternal exhaustion, non-reassuring fetal status (Category III tracing, prolonged decelerations), or maternal indication to avoid Valsalva (cardiac disease, severe pulmonary disease). Prerequisites met: complete cervical dilation, ruptured membranes, engaged head (station 0 or below — outlet/low-forceps preferred over mid-forceps which has been largely abandoned in modern practice due to higher complication rates), known position confirmed by transabdominal/transperineal ultrasound (clinical assessment is wrong in 30-40% of cases), adequate maternal anesthesia (regional preferred), adequate maternal pelvis size (clinical pelvimetry), empty bladder, experienced operator and immediate access to operative delivery and neonatal resuscitation. Informed consent for operative vaginal delivery with explanation of risks (3rd/4th-degree perineal trauma 4-5x baseline, postpartum hemorrhage, neonatal facial nerve palsy, scalp lacerations, intracranial hemorrhage 1-2/1000 — higher than vacuum) and alternatives (continued pushing, vacuum, cesarean) was obtained.`,
      `The patient was positioned in dorsal lithotomy with the buttocks at the table edge in candy-cane stirrups. The bladder was emptied with a straight catheter. The perineum was prepped with antiseptic. Adequate anesthesia was confirmed (working epidural with sensory level T10, dense pudendal block, or rarely general). Episiotomy was deferred until forceps placement complete (restrictive episiotomy policy preferred — episiotomy increases 3rd/4th-degree extension when performed prophylactically per RCT data). The fetal position was confirmed by digital examination of the sagittal suture and fontanelles; if uncertain, intrapartum transperineal ultrasound was used to verify position before forceps application.`,
      `Forceps type was selected: ${name.includes("simpson") ? "Simpson forceps (long, parallel shanks; English-style; preferred for OA delivery and molded heads)" : name.includes("elliot") ? "Elliot forceps (short overlapping shanks; preferred for non-molded primigravid head)" : name.includes("kielland") ? "Kielland forceps (minimal pelvic curve, sliding lock; reserved for OT or asynclitic head requiring rotation — high-skill instrument with greatest morbidity, used only by experienced operators)" : "Simpson forceps for OA delivery"}. The forceps were inspected for proper articulation outside the mother before application.`,
      `The left blade was applied first using the operator's left hand to introduce the blade and the right hand as the pelvic hand inside the vagina to guide the blade along the right side of the maternal pelvis (left side of the fetal head when in OA position). The blade was guided along the parietal eminence in a 'wandering' or 'rotating' fashion to lie alongside the fetal head with the cephalic curve following the contour. The right blade was applied next using the operator's right hand, with the left hand as the pelvic hand to guide the blade along the left side of the maternal pelvis (right side of the fetal head). The blades were articulated easily — difficulty articulating suggests incorrect blade position requiring removal and reapplication.`,
      `Placement was systematically verified using the ACOG/RCOG criteria: (1) sagittal suture was perpendicular to and equidistant from the shanks/blades; (2) posterior fontanelle was one fingerbreadth above the plane of the shanks (verifying flexion of the head — flexed head presents the smallest diameter through the pelvis); (3) lambdoidal sutures were equidistant from the upper edges of the blades (verifying symmetric application). All three criteria were confirmed before traction.`,
      `${name.includes("kielland") || name.includes("rotation") ? "For Kielland rotation: gentle rotation was performed during a uterine relaxation between contractions, NOT during a contraction (rotation against contraction increases head trauma risk). The head was rotated to OA over 90-180° depending on starting position. After rotation, the Kielland forceps were either left in place for traction-delivery or removed and replaced with traction forceps (Simpson) for the actual delivery." : ""}With a maternal contraction and active maternal pushing effort, gentle downward and outward traction was applied along the pelvic curve (Pajot's maneuver — the operator's hand on the shanks pulls inferiorly while the pulling hand provides traction in the direction of the pelvic outlet). Traction was applied only during contractions and only with maternal pushing — between contractions, the forceps were held without traction. Episiotomy (mediolateral preferred over midline to reduce 4th-degree extension) was performed at crowning if needed.`,
      `The head was delivered with the forceps in place; the forceps were then removed (right blade first, then left, in reverse of application order) and the remainder of the delivery proceeded with manual maneuvers (delivery of anterior shoulder by gentle downward traction, then posterior shoulder by gentle upward traction, then body). The cord was clamped and divided (delayed cord clamping 30-60 seconds for term/preterm if indicated). Apgars were [9/9 or as assigned at 1 and 5 minutes]. Cord blood was sent for gases and standard analysis.`,
      `The placenta was delivered spontaneously with controlled cord traction and uterine massage. Uterine tone was confirmed and oxytocin infusion (40 units/L) was running. Inspection of the perineum, vagina, cervix, and lower uterine segment was performed for trauma — operative vaginal delivery has a 4-5x increased rate of 3rd/4th-degree perineal lacerations and may have cervical lacerations requiring repair. Any episiotomy or laceration was repaired in standard fashion (vaginal mucosa with running 2-0 Vicryl; perineal body with interrupted 2-0 Vicryl; perineal skin with subcuticular 3-0 Vicryl Rapide). Estimated blood loss [400-600 mL]. Counts confirmed correct. Mother and infant were transferred to the postpartum floor for routine recovery with close monitoring for postpartum hemorrhage (3-5x baseline risk after operative vaginal delivery) and neonatal observation (facial bruising, retinal hemorrhage, scalp injury).`,
    ];
  }

  if (includesAny(name, ["vacuum", "ventouse"])) {
    return [
      `Indications and prerequisites for operative vaginal delivery (ACOG Practice Bulletin 219) were reviewed and met: prolonged second stage, maternal exhaustion, non-reassuring fetal status, or maternal medical indication to avoid Valsalva. Vacuum was selected as the operative vaginal delivery instrument (vs forceps): preferred when the fetal position is occiput posterior (less rotation needed; vacuum allows autorotation), maternal pelvis is unsuitable for forceps blade insertion, the operator is more experienced with vacuum, or there is a relative contraindication to forceps. Vacuum is contraindicated for prematurity < 34 weeks (cephalohematoma + intracranial hemorrhage risk), known fetal coagulopathy, fetal scalp scaling/sampling, breech, face presentation, and macrosomic fetus > 4500 g (relative). Prerequisites confirmed: complete cervical dilation, ruptured membranes, engaged head at station 0 or below (operative vaginal delivery should not be performed at station > 0 — high-station vacuum has unacceptable morbidity), known position, adequate anesthesia, empty bladder, experienced operator with immediate access to cesarean and neonatal resuscitation.`,
      `The patient was positioned in dorsal lithotomy with the buttocks at the table edge. The bladder was emptied with a straight catheter. The perineum was prepped with antiseptic. Anesthesia was confirmed adequate. Vacuum cup type was selected: ${name.includes("metal") || name.includes("malmstrom") ? "metal Malmström cup (rigid 60 mm cup; classical instrument; higher pop-off threshold but more scalp trauma)" : name.includes("kiwi") ? "Kiwi OmniCup (single-use semi-rigid plastic; integrated handheld pump with negative pressure indicator; suitable for any position; preferred for OP/OT positions)" : "Mityvac soft silicone cup (60 mm; preferred for OA delivery; less scalp trauma than rigid; higher pop-off rate)"}. The vacuum apparatus was tested before application by occluding the cup with a finger and confirming pressure increase to 200 mmHg.`,
      `The fetal position was reconfirmed by digital examination of the sagittal suture, posterior fontanelle, and any caput. The cup was applied over the flexion point — defined as the median sagittal suture, 3 cm anterior to the posterior fontanelle, with the cup centered over this point. Correct placement at the flexion point is critical: the flexion point is the only location where vacuum traction promotes fetal head flexion (which presents the smallest diameter for delivery — 9.5 cm suboccipitobregmatic) rather than deflexion (which presents the largest diameter — 13.5 cm occipitofrontal). Posterior cup placement (over the parietal bone or near the anterior fontanelle) is the most common cause of vacuum failure and fetal injury.`,
      `After cup placement, the entire circumference of the cup was inspected with a finger to confirm no maternal vaginal or cervical tissue was entrapped beneath the cup edge — entrapment causes immediate maternal trauma upon vacuum activation. Vacuum was activated with stepwise pressure increases: initial low pressure 100 mmHg between contractions to verify correct placement, then increased to delivery pressure 500-600 mmHg with each contraction. Total time of vacuum application was tracked (begin from the moment of cup placement) — total application > 20-30 minutes mandates abandoning the procedure per most institutional protocols.`,
      `With each maternal contraction and active maternal pushing effort, gentle traction was applied along the pelvic curve in the same axis as the fetal occiput would naturally descend through the pelvis. Traction was applied only during contractions and with maternal pushing — between contractions vacuum was decreased to 100 mmHg and no traction applied. The number of pulls was tracked; ACOG recommends abandoning the procedure after 3 ineffective pulls (no progress on station), 3 cup detachments (pop-offs — each suggests incorrect placement, scalp inadequacy, or excessive force), or 30 minutes total vacuum time. Each pop-off was treated as a serious safety event with cup re-application after re-inspection of position.`,
      `Delivery was accomplished after [__] pulls during [__] contractions (average successful vacuum 2-4 pulls). At crowning, vacuum was released and the cup was removed. Episiotomy (mediolateral preferred) was performed only if necessary at crowning. The remainder of the delivery proceeded with manual maneuvers (anterior then posterior shoulder, then body). The cord was clamped and divided. Apgars were [__/__]. Cord blood was sent.`,
      `The placenta was delivered with controlled cord traction and uterine massage. Uterotonics confirmed good uterine tone. Inspection of the maternal perineum, vagina, and cervix was performed: vacuum has lower 3rd/4th-degree laceration rate than forceps (~2-3% vs 5-8%) but higher cephalohematoma (~10-25%) and subgaleal hemorrhage (rare but life-threatening — 1/2000-3000) risks for the neonate. Any lacerations were repaired in standard fashion. Estimated blood loss [400-500 mL]. Counts correct. The neonate was examined for vacuum-related complications: scalp ecchymosis (universal — chignon), cephalohematoma (limited to single bone, no scalp swelling crossing suture lines), subgaleal hemorrhage (boggy fluctuant scalp swelling crossing suture lines, with possible hemodynamic compromise — requires NICU observation with serial Hb), retinal hemorrhage (common, self-limited), facial nerve palsy. Neonatology was alerted to the operative vaginal delivery for the neonatal exam.`,
    ];
  }

  if (includesAny(name, ["manual removal of placenta", "mrop", "retained placenta"])) {
    return [
      `Retained placenta was diagnosed: failure to deliver placenta within 30 minutes of birth despite active management (controlled cord traction with uterotonic), with or without postpartum hemorrhage. The patient was assessed for hemodynamic stability — heavy ongoing PPH from retained placenta required immediate transfer to OR and prompt manual removal under anesthesia (delay of 30+ minutes worsens outcomes). Two large-bore IVs were placed and crossmatched blood was readied. The patient was transferred to the OR (or remained in the labor room if regional anesthesia was already in place and bleeding was controlled). Antibiotic prophylaxis (ampicillin 2 g + clindamycin 900 mg IV, or cefoxitin 2 g) was given.`,
      `The patient was positioned in dorsal lithotomy with the buttocks at the table edge. Adequate anesthesia was confirmed: regional anesthesia (epidural top-up with 10 mL of 2% lidocaine + 100 mcg fentanyl, or spinal) was preferred for hemodynamically stable patients; general anesthesia was used for unstable patients with massive hemorrhage or for patients requiring deep uterine relaxation (volatile anesthetic provides uterine smooth muscle relaxation needed for placental separation). The perineum was prepped with antiseptic and the bladder was emptied via Foley catheter.`,
      `One hand was placed on the maternal abdomen at the uterine fundus to provide stabilising counter-pressure (the 'abdominal hand'). The other hand was inserted through the vagina into the uterine cavity following the umbilical cord, with the fingers held in a cone shape to facilitate passage through the cervix (which often has not significantly contracted in retained placenta cases — cervical clamping/spasm requires nitroglycerin 50-100 mcg IV for relaxation).`,
      `The placental edge was identified by palpation — typically a fibrous separation plane between the placenta and the uterine wall is palpable. The fingers were inserted between the placenta and the uterine wall at the placental edge. The placenta was systematically separated from the uterine wall using the ulnar (little-finger) edge of the hand in a sweeping, side-to-side ('sawing') motion, working circumferentially around the placental margin. Care was taken to develop the correct cleavage plane — too superficial separation leaves placental fragments attached (risk of subsequent PPH and infection); too deep separation breaches the myometrium (risk of perforation).`,
      `Placenta accreta (absent decidualis basalis with placental villi adherent to myometrium) was suspected if no cleavage plane was identifiable, or if separation produced excessive bleeding. Accreta was managed depending on stability and prior counseling: stable + prior counseling for fertility-preservation — leave placenta in situ + methotrexate + uterine artery embolization; unstable or no fertility-preservation desired — proceed to hysterectomy. Risk factors for accreta were noted: prior C/S, placenta previa, advanced maternal age, multiparity. The case was identified prospectively if MRI showed signs of accreta (absent retroplacental clear zone, abnormal placental lacunae, bladder wall interruption).`,
      `Once the placenta was completely separated, it was removed in its entirety and inspected for completeness on a sterile surface — fetal surface (with cord vessels), maternal surface (cotyledons should be complete with no missing fragments), membranes (should be complete with no torn edges suggesting retained membranes). Any missing fragments mandated re-exploration of the cavity. The umbilical cord vessels were inspected (3-vessel cord = 2 arteries + 1 vein; 2-vessel cord is associated with congenital anomalies in 30%).`,
      `The uterine cavity was re-explored with a final sweep using the gauze-wrapped hand or a ring forceps with sponge to confirm absence of retained tissue. Some operators perform routine ultrasound or hysteroscopy after manual removal to confirm complete evacuation. Uterotonics were administered: oxytocin 40 units/L IV infusion at 250 mL/h, methylergonovine 0.2 mg IM (avoid in hypertensive disorders — risk of hypertensive crisis), carboprost 250 mcg IM (avoid in asthmatic patients — bronchospasm), misoprostol 600-1000 mcg PR. Uterine tone was confirmed firm by abdominal palpation.`,
      `Hemostasis was confirmed. Estimated blood loss was [500-1500 mL — typical PPH from retained placenta] and was tracked carefully (visual estimation underestimates by 30-50%; weighed sponges and graduated containers improve accuracy). Anti-D immunoglobulin was administered if Rh-negative (300 mcg covers 30 mL fetal blood loss; calculate larger doses if Kleihauer-Betke shows greater fetomaternal hemorrhage). The patient was transferred to recovery and monitored for delayed PPH (1-3% recurrence after manual removal). Follow-up: pathology of placenta to confirm completeness; postpartum endometritis surveillance × 7-10 days; pelvic exam at 2-4 weeks. Discharge counseling regarding return precautions for fevers, foul lochia, heavy bleeding, or persistent abdominal pain (suggesting endometritis or retained tissue requiring D&C).`,
    ];
  }

  if (includesAny(name, ["ectopic"])) {
    return [
      `The patient was positioned supine with the legs in candy-cane stirrups (low lithotomy) to permit a uterine manipulator. Hair was clipped (not shaved) immediately preoperatively. The abdomen, perineum, and vagina were prepped with chlorhexidine and draped in the usual sterile fashion. Antibiotic prophylaxis (cefazolin 2 g IV) was administered. A 16 Fr Foley was placed and a uterine manipulator (RUMI II or Valchev) was inserted to elevate the uterus and permit pelvic exposure. Hemodynamic stability was confirmed (severely unstable patients with massive hemoperitoneum may require open laparotomy and rapid hemostasis instead of laparoscopy).`,
      `Pneumoperitoneum was established via Veress needle (subumbilical, opening pressure < 8 mmHg) or Hasson technique to 15 mmHg. A 10-12 mm umbilical optical trocar was placed and the laparoscope (10 mm 0° or 30°) introduced. The patient was placed in steep Trendelenburg (~25-30°) to displace bowel out of the pelvis. Two 5 mm working ports were placed in the right and left lower quadrants under direct vision, lateral to the inferior epigastric vessels (which were transilluminated and visualised before puncture). A third 5 mm suprapubic port was added for assistance.`,
      `The pelvis was systematically inspected: hemoperitoneum was suctioned and quantified (estimated at [___] mL — important for postoperative fluid management and transfusion consideration). The ectopic pregnancy was localised: [left / right] fallopian tube at the [ampullary (most common, 70%) / isthmic / fimbrial / interstitial / cornual] portion, measuring approximately [__] cm. The contralateral tube and bilateral ovaries were inspected and the appearance documented (important for fertility-preservation discussion). The uterus was examined for any concurrent intrauterine pregnancy (heterotopic — rare but increasing with ART, 1/4000 spontaneous, 1/100 with IVF).`,
      `${name.includes("salpingostomy") ? "Salpingostomy was performed for fertility preservation in patients with damaged contralateral tube and small unruptured ampullary ectopic: dilute vasopressin (20 units in 100 mL saline) was injected into the mesosalpinx beneath the ectopic to reduce bleeding. A 1.5-2 cm linear incision was made along the antimesenteric border of the tube directly over the ectopic with monopolar scissors or a hook electrode. The products of conception (POC) typically extruded spontaneously; gentle hydrodissection with irrigation was used to expel residual tissue without traumatising the tubal endothelium. The tubal serosa was left to heal by secondary intention (suturing increases stricture risk). Beta-hCG must be followed weekly to negativity to confirm no residual trophoblast — persistent trophoblast occurs in 5-15% of salpingostomies and may require methotrexate." : "Salpingectomy was performed (preferred for ruptured ectopic, contralateral tube intact, completed family, or recurrent ectopic in the same tube): the affected tube was elevated by grasping the fimbriated end. A vessel-sealing device (LigaSure, Harmonic, or Thunderbeat) was used to serially seal and divide the mesosalpinx working from the fimbriated end toward the cornual end, taking the mesosalpinx in 1-2 cm bites with overlapping seals. Care was taken to stay close to the tube to avoid devascularising the ovary (which shares the mesovarian blood supply via the utero-ovarian ligament). The cornual portion of the tube was sealed and divided flush with the uterine wall. The specimen was placed in a 10 mm Endo Catch bag and removed through the umbilical port site (or extended trocar)."}`,
      `The pelvis was thoroughly irrigated with warmed saline and suctioned to remove all blood and clot — incomplete evacuation increases postoperative pain, ileus, and adhesion formation. The right upper quadrant was inspected for liver/diaphragmatic adhesions (Fitz-Hugh-Curtis syndrome from prior PID, present in 5-10% of ectopic patients) and any blood was suctioned from the subdiaphragmatic spaces. Hemostasis was confirmed at the surgical bed with insufflation pressure briefly reduced to 8 mmHg to identify low-pressure venous bleeding. The contralateral tube and ovary were re-inspected and confirmed grossly normal.`,
      `The umbilical port was opened to release pneumoperitoneum and removed under direct vision. The 10 mm fascial defect was closed with 0 Vicryl figure-of-eight on a Carter-Thomason device. 5 mm port sites were closed at skin only with 4-0 Monocryl subcuticular. Foley was removed in PACU. Anti-D immunoglobulin (300 mcg IM) was administered if the patient was Rh-negative (regardless of gestational age, due to risk of fetomaternal hemorrhage from the ectopic). The patient was discharged home the same day or after overnight observation if hemodynamic instability had been an issue. Beta-hCG was scheduled for weekly follow-up to confirm trend to negativity (especially critical if salpingostomy was performed).`,
    ];
  }

  if (includesAny(name, ["endometriosis"])) {
    return [
      `The patient was positioned in dorsal lithotomy with adjustable Allen stirrups, with the buttocks at the table edge to permit a vaginal-cervical manipulator. Hair was clipped, the abdomen + perineum + vagina were prepped with chlorhexidine, and the patient was draped to expose the abdomen and perineum. Antibiotic prophylaxis was given. A Foley was placed. The disease severity was reviewed: revised ASRM Stage I-IV based on point system (peritoneal disease, ovarian disease, posterior cul-de-sac obliteration, adhesions, deep infiltrating disease — Stage III-IV typically have endometriomas, deep nodules, adhesions, and adenomyosis). Preoperative imaging (transvaginal ultrasound for endometriomas, MRI for deep infiltrating endometriosis) was reviewed in the OR.`,
      `Pneumoperitoneum was established to 15 mmHg via Veress at the umbilicus or Hasson if prior abdominal surgery. Five ports were placed: 10 mm umbilical for camera (or supraumbilical if large pelvic mass), 5 mm right lower quadrant, 5 mm left lower quadrant, 5 mm suprapubic, and a 12 mm port if morcellation/Endo Catch was needed. Steep Trendelenburg was maintained throughout. A systematic survey of the pelvis was performed in a defined sequence: anterior cul-de-sac (bladder peritoneum), uterus and adnexa, posterior cul-de-sac, uterosacral ligaments, ovarian fossae, sigmoid colon, appendix, and upper abdomen (including diaphragm).`,
      `Superficial peritoneal implants (powder-burn lesions, vesicular implants, red flame lesions) were systematically identified and treated by excision (preferred over ablation for tissue diagnosis and complete removal of subperitoneal disease) using cold scissors or low-thermal CO2 laser. Specimens were placed in separately labelled formalin containers by anatomic site (right pelvic sidewall, left pelvic sidewall, posterior cul-de-sac, etc.) for pathology — histologic confirmation requires endometrial glands AND stroma; pigment alone is non-specific.`,
      `For deep infiltrating endometriosis (DIE) nodules — typically located in the rectovaginal septum, uterosacral ligaments, posterior vaginal fornix, bladder peritoneum, or rarely bowel: the ureters were systematically identified and traced from the pelvic brim into the ureteric tunnel under the uterine artery, with peristalsis confirmed throughout. The disease was approached by developing the avascular plane between the rectum and posterior uterus, with rectal mobilisation and shaving or discoid excision (for full-thickness rectal involvement, segmental bowel resection with anastomosis would be required, typically with general surgery co-team). Bladder nodules required partial cystectomy with closure in two layers (3-0 Vicryl mucosa, 2-0 Vicryl detrusor) and Foley drainage for 7 days, followed by cystogram before removal.`,
      `Ovarian endometriomas were treated by ovarian-preserving cystectomy (preferred over fenestration/ablation per Cochrane review — lower recurrence and pregnancy rates favor stripping): the ovarian cortex was incised over the cyst with a monopolar hook. The cyst was opened and the chocolate fluid contents drained and suctioned. The plane between the cyst wall and the surrounding ovarian cortex was identified and developed with traction-counter-traction using two atraumatic bowel graspers ("plate technique"). The cyst wall was completely stripped, with attention to preserve as much normal ovarian cortex as possible. Hemostasis at the cyst bed was achieved with low-energy bipolar (15-25 W max, short bursts) — excessive cautery damages primordial follicles and reduces ovarian reserve (~20% AMH decline post-cystectomy). Suturing the ovarian defect with 4-0 Vicryl was avoided unless large defect, as suturing also reduces ovarian reserve.`,
      `Adhesiolysis was performed: dense adhesions involving the rectum and posterior cul-de-sac were taken down sharply with cold scissors (preserving rectal serosa); ureteric adhesions were dissected free with the ureter on stretch; tubo-ovarian adhesions from prior endometriosis-related inflammation were lysed to restore tubal patency. The pouch of Douglas obliteration grade was documented (partial vs complete) — this correlates with infertility severity and surgical complexity.`,
      `The pelvis was copiously irrigated with warmed saline (1-2 L). All specimens were placed in Endo Catch bags labelled by anatomic location. Hemostasis was reconfirmed at insufflation pressure 8 mmHg. An anti-adhesion barrier (Interceed, SprayShield, or hyaluronate-based gel) was applied at high-risk sites — pelvic sidewalls, ovarian beds, raw cul-de-sac surfaces — per surgeon preference; evidence supports modest reduction in adhesion formation. Operative time totalled [__] minutes (relevant for tariff 4605 first 30 min + 4606 each additional 15 min in Manitoba billing).`,
      `Pneumoperitoneum was released and ports removed under direct vision. The 10 mm umbilical fascia was closed with 0 Vicryl figure-of-eight (Carter-Thomason). 5 mm port sites were closed at skin with 4-0 Monocryl subcuticular. Foley was removed at end of case unless bladder repair was performed. The patient was instructed regarding postoperative hormonal suppression (continuous combined OCP, GnRH agonist, or dienogest 2 mg daily) for symptom recurrence prevention — recurrence rate at 5 years is 30-50% without hormonal suppression and ~10% with suppression. Long-term follow-up included pelvic exam at 6 weeks, AMH monitoring annually if endometrioma cystectomy was performed, and fertility counseling for patients seeking pregnancy.`,
    ];
  }

  if (includesAny(name, ["hysteroscopy", "hysteroscopic", "endometrial ablation"])) {
    const isAblation = includesAny(name, ["ablation", "novasure", "thermachoice"]);
    return [
      `The patient was positioned in dorsal lithotomy with the buttocks at the table edge to permit unrestricted vaginal access. Antibiotic prophylaxis was given (cefazolin 2 g IV per AAGL guidelines). The vagina and perineum were prepped with chlorhexidine and draped. The bladder was emptied via a straight catheter. The indication was reviewed: abnormal uterine bleeding workup, lost IUD retrieval, polypectomy, submucosal myoma resection, septum resection, retained products of conception, asherman synechiae lysis, or endometrial ablation for AUB-O/E refractory to medical management. Chronic anticoagulation was held per institutional protocol.`,
      `A weighted speculum was placed in the posterior vagina and the cervix was identified. The cervix was grasped with a single-tooth tenaculum at the 12 o'clock position. The cervical canal was sounded to identify uterine length and direction (typical 6-9 cm; > 12 cm suggests Mullerian anomaly or large fibroid). The cervix was serially dilated with Hegar dilators (or Pratt dilators for tight cervix) up to ${isAblation ? "8 mm (NovaSure requires 8.5 mm minimum, ThermaChoice requires 5 mm)" : "the size of the working hysteroscope (typically 8-10 mm for operative)"}. Cervical pretreatment with vaginal misoprostol 400 mcg the night before was used in nulliparous or postmenopausal patients to reduce dilation difficulty and cervical injury.`,
      `${isAblation ? "Pretreatment with GnRH agonist or progestin had been given for 1-3 months preoperatively to thin the endometrium (improves NovaSure efficacy by ~10%). " : ""}A ${name.includes("rigid") || name.includes("operative") ? "rigid operative hysteroscope (Storz 26 Fr with 30° lens and 5 Fr working channel)" : "diagnostic hysteroscope (Olympus 5 mm flexible or Storz 4 mm rigid 30°)"} was introduced under continuous fluid distension with ${name.includes("monopolar") || name.includes("loop") ? "1.5% glycine (monopolar) or 5% mannitol (bipolar/non-conducting media)" : "normal saline (preferred for bipolar resectoscopy and most operative procedures — isotonic, eliminates hyponatremic hyperammonemia risk seen with hypotonic glycine)"}. The fluid management system (Hysteromat or OPTomatic) was set to maintain intrauterine pressure 60-90 mmHg (lower than mean arterial pressure to prevent intravasation).`,
      `Fluid deficit was monitored continuously by the OR nurse — total fluid balance was [__] mL. Critical safety thresholds: 1000 mL deficit with hypotonic media (glycine) or 2500 mL with isotonic saline mandates termination per AAGL guidelines (intravascular volume overload + hyponatremic hyperammonemia is the most catastrophic hysteroscopic complication, leading to cerebral edema, seizures, death). Sodium was monitored intraoperatively at 1500 mL deficit. The cavity was systematically inspected: cervical canal, lower uterine segment, anterior wall, fundus, posterior wall, both lateral walls, both tubal ostia (visualised bilaterally), cornual region.`,
      `${name.includes("polyp") ? "For polypectomy: the polyp was identified by location (typically fundal or cornual). A bipolar loop electrode (Versapoint or Olympus 26 Fr resectoscope with 5 Fr loop) was used in cutting current to transect the polyp at its base. The specimen was retrieved using a polyp grasper or by allowing it to float free and grasping with the resectoscope; alternatively, hysteroscopic morcellator (TruClear, MyoSure) was used for tissue retrieval and continuous histologic specimen capture without disrupting visualisation." : ""}${name.includes("myoma") || name.includes("fibroid") ? "For submucosal myoma resection: ESGE classification was confirmed (Type 0 entirely intracavitary; Type 1 < 50% intramural; Type 2 ≥ 50% intramural — Type 2 is technically challenging and may require staged resection). Bipolar loop electrode was used to systematically resect the fibroid from its inner pole outward, with resection chips collected with a polyp grasper or evacuated by suction. Cavity was reinspected after each chip to confirm absence of perforation. Specimens were submitted en bloc for pathology." : ""}${isAblation ? "For NovaSure radiofrequency endometrial ablation: cavity integrity was confirmed by gentle filling with CO2 (cavity integrity assessment, CIA, by the device — fail = cavity perforation, must abort). The NovaSure ablation array was deployed within the uterine cavity (the bipolar mesh self-conforms to cavity contours), and energy delivery was initiated. The system delivered up to 90-120 seconds of bipolar RF energy at controlled impedance, terminating automatically when the endometrium reached complete dehydration. Cavity was re-inspected post-treatment to confirm uniform white-tissue effect." : ""}${name.includes("septum") ? "For septum resection: the septum was identified by paired tubal ostia separated by central septum extending from fundus to mid-uterus or further. A 5 Fr scissor or hysteroscopic scissors were used to incise the septum centrally (avascular plane), maintaining symmetric incisions on each side until both ostia were visualised in a unified single cavity. Septum should be incised only — not excised — and depth limited to avoid perforation through the myometrium." : ""}${name.includes("synechi") || name.includes("asherman") ? "For Asherman lysis: dense intrauterine adhesions were carefully divided with hysteroscopic scissors or 5 Fr cold electrode, restoring cavity volume. Postoperative IUD or balloon (Cook) was placed for 1-2 weeks with hormonal therapy to prevent re-formation." : ""}`,
      `Cavity reinspection at the end of the procedure confirmed hemostasis and absence of perforation. The hysteroscope was withdrawn. The tenaculum was removed. Hemostasis at the tenaculum site was confirmed by direct visualisation. Final fluid deficit was documented. The patient was transferred to recovery. Discharge was the same day with instructions: expect mild cramping (NSAIDs), light bleeding/spotting up to 4-6 weeks (especially after ablation — amenorrhea or hypomenorrhea is the goal), pelvic rest × 2 weeks, return precautions for fevers > 38.5°C, severe pain, heavy bleeding, or foul discharge. ${isAblation ? "Long-term follow-up: 70-80% reduction in bleeding at 1 year, amenorrhea in 30-50% (NovaSure), highest patient satisfaction of any hysteroscopic procedure. Counseling regarding the absolute contraindication to subsequent pregnancy was reinforced (high rate of placenta accreta and uterine rupture)." : ""}`,
    ];
  }

  if (includesAny(name, ["leep", "cervical conisation", "cone biopsy", "cold knife cone"])) {
    const isCKC = includesAny(name, ["cold knife", "ckc", "cold-knife"]);
    return [
      `The patient was positioned in dorsal lithotomy with the buttocks at the table edge. ${isCKC ? "General or spinal anesthesia was administered (cold-knife cone requires deep anesthesia for cervical handling and sutured hemostasis)." : "Local anesthesia with 1% lidocaine + epinephrine 1:200,000 was infiltrated into the cervix at 4 anatomic locations (3, 6, 9, 12 o'clock at the cervical-vaginal junction) using a 27-gauge dental needle (LEEP can be performed under local in office or with mild sedation in OR)."} The vagina and perineum were prepped with chlorhexidine. A non-conductive plastic vaginal speculum (insulated for LEEP to prevent thermal injury to the vagina) or weighted speculum (for CKC) was placed.`,
      `The cervix was visualised and grasped with a single-tooth tenaculum at the 12 o'clock position above the lesion. Colposcopy with 3-5% acetic acid was repeated to delineate the lesion (acetowhite changes), confirm the entire transformation zone (including the SCJ — squamocolumnar junction) was visible (Type 1 transformation zone is fully ectocervical and most amenable to LEEP; Type 3 has SCJ retracted into the canal and may require deeper conization), and identify any extension to the ectocervical or vaginal margins. Lugol's iodine was applied to further define the abnormal area (iodine-negative = high-risk).`,
      `${isCKC ? "Cold-knife cone: a #11 or #15 blade was used to make a circumferential incision around the cervix at 3-5 mm beyond the visible lesion margin (typically 5-10 mm peripheral to acetowhite area). The cone was deepened toward the cervical canal using sharp dissection with a #15 blade or curved Mayo scissors, angling the incision toward the canal in a conical shape to capture both the ectocervix and a generous endocervical margin. The depth of the cone was tailored to the lesion: shallow cone (5-10 mm) for low-grade, deep cone (15-25 mm) for adenocarcinoma in situ or high-grade with positive endocervical margins. The cone specimen was delivered with the apex at the endocervical canal and oriented with a 12 o'clock orientation stitch (4-0 Vicryl on the ectocervical surface at 12 o'clock) for the pathologist." : "Loop electrosurgical excision procedure (LEEP) was performed: a wire loop electrode (typically 2.0 cm wide × 1.0 cm deep for ectocervical disease, larger 2.0 × 1.5 cm for endocervical extension) was selected based on the lesion size. Cutting current was set to 35-50 W blended (or pure cut + low coagulation) with the electrosurgical generator (Valley Lab ForceFX or similar). The loop was activated, then advanced into the tissue at 5-10 mm peripheral to the lesion, drawn smoothly across the cervix in a single continuous motion (avoiding pause, which causes thermal artifact and poor margins) to excise the transformation zone in a single specimen ('disc' for shallow lesions; 'top hat' or 'cylinder' for endocervical extension)."}`,
      `${name.includes("ecc") || name.includes("endocervical curettage") || isCKC ? "Endocervical curettage (ECC) was performed using a Kevorkian curette to sample the residual endocervical canal above the cone bed, with specimens submitted to a separately labelled formalin container. ECC is mandatory if the SCJ was not fully visualised, if the lesion extends into the canal, or if AGC/AIS pathology was the indication." : "Endocervical curettage was deferred — Type 1 transformation zone was fully visualised and the LEEP captured the entire SCJ."} The cone specimen was placed into a formalin container with 12 o'clock orientation marked on the requisition for pathology.`,
      `The cone bed was inspected and characterised: typically a 1-2 cm raw circular bed with the cervical canal at the apex. Hemostasis was achieved with ${isCKC ? "running figure-of-eight 2-0 chromic or Vicryl sutures at the cone bed (Sturmdorf-style apical-to-base stitches reapproximating the cone bed), with care to avoid stenosing the cervical canal. Monsel's solution (ferric subsulfate) was applied to oozing areas after suturing." : "ball electrode (Bovie) at low coagulation setting (40-60 W coag), applied to the entire cone bed in spiral fashion. Monsel's solution (ferric subsulfate paste) was applied to the cone bed for additional hemostasis — produces characteristic black eschar."} Bleeding was confirmed stopped by direct visualisation for 60-90 seconds.`,
      `The tenaculum and speculum were removed atraumatically. The patient was transferred to the recovery area${isCKC ? " and admitted overnight if significant bleeding risk; most discharged same day" : " and discharged from the office or PACU"}. Discharge instructions: expect mild cramping (NSAIDs), serosanguinous discharge (with characteristic black eschar from Monsel's) for 2-4 weeks, pelvic rest × 4-6 weeks (no intercourse, tampons, douching, swimming), return precautions for heavy bleeding (> 1 pad/hour for 2 hours), severe pain, fever > 38.5°C, foul discharge.`,
      `Long-term follow-up per ASCCP 2019 guidelines: repeat HPV co-test or HPV-only test at 6 months. If negative, repeat every 12 months × 3, then return to routine screening. If positive, colposcopy with cervical biopsy. Margin status guides intervention: positive margins on ectocervical cone — repeat colposcopy in 6 months; positive on endocervical margin or ECC — strongly consider repeat excision (CKC or repeat LEEP). Pregnancy implications: cervical insufficiency risk increases with cone depth (each additional 1 mm depth adds 0.05 weeks of preterm delivery risk); cerclage is considered for subsequent pregnancies in patients with cone depth > 15 mm or > 1 prior conization.`,
    ];
  }

  if (includesAny(name, ["perineal laceration", "perineal repair", "episiotomy"])) {
    return [
      `The patient was positioned in dorsal lithotomy after vaginal delivery (or McRoberts position for episiotomy during delivery). Adequate analgesia was confirmed: epidural/spinal for 3rd/4th-degree laceration (preferred for sphincter repair), local infiltration of 1% lidocaine for 1st/2nd-degree, or general anesthesia for complex repairs requiring relaxation. The perineum was prepped with antiseptic. Antibiotic prophylaxis (cefazolin 2 g IV for 3rd/4th-degree, no prophylaxis for 1st/2nd-degree per Cochrane).`,
      `Systematic examination identified the laceration extent using the standardised classification: 1st-degree (vaginal mucosa or perineal skin only); 2nd-degree (involves perineal body / bulbocavernosus / superficial transverse perineal muscles); 3rd-degree (involves anal sphincter complex — 3a < 50% external anal sphincter (EAS) thickness, 3b > 50% EAS thickness, 3c full EAS + internal anal sphincter (IAS)); 4th-degree (extends through rectal mucosa). The injury was characterised: [degree], length, depth, extension. A digital rectal examination was performed before repair to assess sphincter integrity (palpate continuous IAS as a thickened ring; palpate EAS contraction asking patient to squeeze if awake) and rule out occult sphincter injury (12-35% of 'second-degree' tears have occult OASIS on endoanal ultrasound — important for risk stratification but does not change immediate repair).`,
      `For 4th-degree (rectal mucosa breach): the rectal mucosa was first identified at its margins. Rectal mucosa was approximated with running 4-0 Vicryl in a submucosal-only fashion (extending submucosa to submucosa, not full thickness — full-thickness sutures predispose to fistula formation). Knots were placed within the lumen (or buried submucosally). The repair was extended from the apex of the tear toward the anal verge with continuous interlocking stitches. After completion, a digital rectal exam confirmed no transmural sutures.`,
      `For 3rd-degree and 4th-degree (sphincter involvement): the internal anal sphincter (IAS) was identified as a pale, thickened muscle layer (often retracted laterally) and grasped with Allis clamps. The IAS was re-approximated with interrupted 3-0 PDS or Vicryl sutures (4-6 sutures, end-to-end). The external anal sphincter (EAS) was identified by its grossly visible muscle bulk (often retracted laterally — must be retrieved with Allis clamps). For 3a/3b: end-to-end repair was performed with 4-6 interrupted 2-0 PDS sutures (preferred over Vicryl for its prolonged tensile strength — PDS lasts 6 months vs Vicryl 60-90 days). For 3c/4th-degree with > 50% EAS disruption: overlapping repair was considered (Sultan technique) — overlap 1-1.5 cm of EAS muscle with mattress sutures. Cochrane meta-analysis (Fernando 2013) showed no significant difference in long-term continence between end-to-end and overlapping repair, but overlapping is preferred for complete tears with significant retraction. The repair was tested by gentle traction — secure with no gap.`,
      `The perineal body was reconstructed: the bulbocavernosus and superficial transverse perineal muscles were re-approximated with interrupted 2-0 Vicryl, recreating the perineal body shape and obliterating dead space (dead space predisposes to hematoma and infection). The vaginal mucosa was approximated with running 2-0 Vicryl from the apex of the tear (located by inspection — must include all retracted vaginal apex) progressing distally to the hymen, with locked stitches in the proximal half for hemostasis. Care was taken to re-approximate the hymeneal ring symmetrically.`,
      `The perineal skin was closed with subcuticular 3-0 Vicryl Rapide running stitch (avoiding interrupted skin sutures, which cause more dyspareunia per Cochrane). A digital rectal examination was performed at the conclusion of the repair to confirm absence of inadvertent rectal/anal sutures and to assess sphincter integrity. The repair was inspected for hemostasis. Estimated blood loss [50-200 mL]. Counts confirmed correct.`,
      `For 3rd/4th-degree repairs: the patient was prescribed stool softeners (docusate sodium 100 mg PO BID) and bulking agents (psyllium) × 6 weeks to avoid constipation/straining; sitz baths 3-4 times daily; topical analgesia (lidocaine spray, witch hazel pads); high-fiber diet; pelvic-floor physiotherapy referral at 6 weeks (level A evidence for early initiation per RCOG guideline). Antibiotics (single dose IV during repair, plus 7-day oral course of metronidazole + amoxicillin/clavulanate per RCOG Greentop 29) were prescribed for OASIS to reduce wound infection (~20% incidence without). Follow-up was scheduled at 6 weeks for perineal exam, sphincter function assessment, anal manometry/endoanal ultrasound at 12 weeks for OASIS, and discussion of subsequent delivery options (most recommend offering elective C/S after 4th-degree with continued symptoms; vaginal delivery acceptable for asymptomatic 3a/3b).`,
    ];
  }

  if (includesAny(name, ["ovarian cystectomy"]) && !includesAny(name, ["oophorectomy"])) {
    return [
      `The patient was positioned in dorsal lithotomy with adjustable Allen stirrups, the buttocks at the table edge. The abdomen, perineum, and vagina were prepped with chlorhexidine. A 16 Fr Foley was placed and a uterine manipulator inserted (RUMI II) to elevate the uterus and improve adnexal exposure. Antibiotic prophylaxis (cefazolin 2 g IV) was administered. Preoperative imaging (TVUS ± MRI) was reviewed: cyst type was characterised — simple (anechoic, thin-walled — likely functional or simple serous cystadenoma), hemorrhagic (heterogeneous internal echoes — corpus hemorrhagicum or hemorrhagic cyst), dermoid (mixed echogenicity with hyperechoic Rokitansky protuberance — mature cystic teratoma), endometrioma (homogeneous low-level internal echoes 'ground-glass' appearance — chocolate cyst), or complex/concerning for malignancy (papillary projections, septations, solid components, ascites — IOTA simple-rules or risk of malignancy index informed approach).`,
      `Pneumoperitoneum was established to 15 mmHg via Veress at the umbilicus or Hasson if prior surgery. Four ports were placed: 10-12 mm umbilical for camera, 5 mm right lower quadrant, 5 mm left lower quadrant, 5 mm suprapubic. Steep Trendelenburg was achieved. The pelvis was systematically inspected. The affected adnexa was identified, the cyst characterised, and the contralateral adnexa re-inspected. Peritoneal washings were collected (50 mL warmed saline, agitated, aspirated) for cytology in suspicious cases. The upper abdomen was inspected for any peritoneal implants suggesting malignancy.`,
      `The ovary was elevated with atraumatic graspers. An incision was made in the antimesenteric ovarian cortex over the cyst with a monopolar hook electrode at low cutting current (15 W) — using cold scissors when feasible to minimise thermal damage to ovarian reserve. The incision was extended to expose the cleavage plane between the cyst wall and ovarian cortex. The plane was developed using gentle traction-counter-traction with two atraumatic bowel graspers (the cortex grasped with one, the cyst wall with the other), gradually peeling them apart in their natural cleavage plane. This 'plate technique' minimises trauma to ovarian cortex and primordial follicles compared to fenestration/coagulation alternatives.`,
      `The cyst was completely shelled out without spillage where possible. ${name.includes("dermoid") ? "For dermoid (mature cystic teratoma): special care was taken to avoid spillage of sebaceous contents, which can cause chemical peritonitis. The cyst was placed immediately into an Endo Catch bag in situ before any rupture occurred, and the cyst wall was stripped within the bag. Copious irrigation was performed if any spillage occurred." : name.includes("endometr") ? "For endometrioma: the cyst was opened and chocolate fluid was suctioned. The cyst wall was stripped from the cortex with traction-counter-traction. Hemostasis at the cyst bed was achieved with low-energy bipolar (15-25 W max, short bursts) — excessive cautery damages primordial follicles and reduces ovarian reserve (~20% AMH decline post-cystectomy)." : "The cyst was contained and stripped. If rupture occurred during dissection, copious irrigation with warmed saline removed any spilled contents."}`,
      `The cyst wall specimen was placed in a 10 mm Endo Catch bag and removed through the umbilical port. Frozen section was obtained if any concerning features were identified intraoperatively (papillary excrescences, mural nodules, solid components, ascites) — frozen-section accuracy ~85-90% for ovarian malignancy and guides decision to proceed to staging surgery. The ovarian bed was inspected: residual healthy ovarian cortex was confirmed and characterised (ovarian volume preservation > 50% is the goal for fertility preservation). Hemostasis at the ovarian bed was achieved with focal low-energy bipolar coagulation (15-25 W, short bursts), avoiding diffuse cautery which damages cortical primordial follicles.`,
      `The ovarian cortex was re-approximated only for large defects (> 3 cm or full-thickness defect predisposing to torsion or adhesion); typically using interrupted 4-0 Vicryl sutures placed through the cortex (avoiding inverting sutures into the medulla, which can compromise blood supply). For most small cystectomies, the defect heals spontaneously without suturing and suturing has been associated with reduced AMH per some studies. The pelvis was irrigated with warmed saline and re-inspected for hemostasis at insufflation pressure 8 mmHg. Anti-adhesion barrier (Interceed or hyaluronate gel) was applied to the ovarian surface per surgeon preference.`,
      `Pneumoperitoneum was released and ports removed under direct vision. The 10 mm umbilical fascia was closed with 0 Vicryl figure-of-eight (Carter-Thomason). 5 mm port sites were closed at skin only with 4-0 Monocryl subcuticular. The Foley was removed at end of case. Postoperative discharge same-day or after observation. Pathology was scheduled for follow-up at 7-10 days. Hormonal contraception (combined OCP) was discussed for functional cyst recurrence prevention. AMH testing at 3-6 months postoperatively was offered for fertility-concerned patients to assess ovarian reserve impact (typical 10-20% decline post-cystectomy, more for endometrioma).`,
    ];
  }

  if (includesAny(name, ["bilateral salpingectomy", "bilateral salpingo-oophorectomy", "bso", "salpingectomy", "salpingo-oophorectomy"]) && !includesAny(name, ["hysterectomy"])) {
    const isBSO = includesAny(name, ["salpingo-oophorectomy", "bso"]);
    const isBilateral = includesAny(name, ["bilateral", "bso"]);
    return [
      `The patient was positioned in dorsal lithotomy with adjustable Allen stirrups, buttocks at the table edge. The abdomen + perineum + vagina were prepped with chlorhexidine and draped. A 16 Fr Foley was placed and a uterine manipulator inserted (RUMI II) to elevate the uterus and expose the adnexa. Antibiotic prophylaxis (cefazolin 2 g IV) was administered. The indication was reviewed: ${name.includes("opportunistic") || name.includes("risk reducing") ? "opportunistic salpingectomy for sterilisation or ovarian cancer prevention (15-20% reduction in subsequent epithelial ovarian/tubal/peritoneal cancer per population-based cohort studies — endorsed by SGO and ACOG when concurrent gynecologic surgery is performed)" : isBSO ? "BRCA1/BRCA2 risk-reducing salpingo-oophorectomy (recommended at age 35-40 for BRCA1, 40-45 for BRCA2 after childbearing complete; reduces ovarian/tubal/peritoneal cancer risk by 80-95% and breast cancer risk by 50% in premenopausal patients), benign ovarian/tubal pathology, or treatment of recurrent salpingitis/hydrosalpinx" : "ectopic pregnancy salpingectomy, hydrosalpinx with infertility, or sterilisation"}.`,
      `Pneumoperitoneum was established to 15 mmHg via Veress at the umbilicus or Hasson if prior surgery. Four ports were placed: 10-12 mm umbilical for camera, 5 mm right lower quadrant, 5 mm left lower quadrant, 5 mm suprapubic. Steep Trendelenburg was achieved (~25-30°). The pelvis was systematically inspected: uterus, adnexa bilaterally, peritoneal surfaces, sigmoid colon, appendix. ${name.includes("brca") || name.includes("risk reducing") ? "For risk-reducing surgery: peritoneal washings (50 mL warmed saline, agitated, aspirated) were collected for cytology; the upper abdomen including diaphragm was systematically inspected for any occult disease; the omentum was inspected." : ""}`,
      `${isBilateral ? "Starting on the right side: " : "On the affected side: "}the round ligament was identified and the broad ligament inspected. The fallopian tube was lifted anteriorly with atraumatic graspers, exposing the mesosalpinx. ${isBSO ? "The infundibulopelvic (IP) ligament containing the ovarian artery and vein was identified at the pelvic brim. The ureter was systematically identified at the pelvic brim crossing the iliac vessels and traced caudally into the ureteric tunnel under the uterine artery, with peristalsis confirmed throughout — ureteric injury at IP ligament ligation is the most common cause of iatrogenic ureteric injury in gynecologic surgery (90% occur during clamping/sealing of the IP). The peritoneum lateral to the IP was incised and a window developed medial to the ureter, isolating the IP." : "The mesosalpinx was inspected from fimbriated end to cornual end."}`,
      `${isBSO ? "The IP ligament was sealed and divided in three sequential overlapping bites with a vessel-sealing device (LigaSure, Harmonic, or Thunderbeat) — the overlap technique ensures complete hemostasis even if one seal is incomplete. The ovary was now mobile and dependent only on the utero-ovarian ligament. " : ""}A vessel-sealing device was used to serially seal and divide the mesosalpinx (or mesosalpinx + utero-ovarian for BSO) working ${isBSO ? "from the ovary medially toward the cornua" : "from the fimbriated end toward the cornual end"}. The mesosalpinx was taken in 1-2 cm bites with overlapping seals to ensure hemostasis. Care was taken to stay close to the tube/ovary to avoid devascularising surrounding structures: ${!isBSO ? "the utero-ovarian ligament containing the ovarian collateral blood supply was preserved during salpingectomy alone — taking the entire mesosalpinx down to the cornua removes the entire fimbria but preserves the ovarian function. " : ""}The cornual portion of the tube was sealed and divided flush with the uterine wall. ${isBilateral ? "The contralateral side was completed in identical fashion." : ""}`,
      `The specimen(s) were placed in 10 mm Endo Catch bags individually labelled by side and removed through the umbilical port (or extended trocar for larger specimens). ${name.includes("brca") || name.includes("risk reducing") ? "The entire fallopian tube including fimbria was submitted for SEE-FIM protocol pathology (Sectioning and Extensively Examining the FIMbria — the fimbriated end is the origin of most BRCA-associated high-grade serous carcinomas) with serial 2-3 mm sectioning of the entire tube and complete embedding of the fimbria — required for risk-reducing surgery." : "Specimens were submitted to standard formalin pathology."} The pelvis was irrigated with warmed saline and re-inspected for hemostasis at reduced insufflation pressure (8 mmHg) to identify any low-pressure venous bleeding masked at higher pressure.`,
      `Pneumoperitoneum was released and ports removed under direct vision. The 10 mm umbilical fascia was closed with 0 Vicryl figure-of-eight (Carter-Thomason) — failure to close 10 mm fascia is a common cause of port-site hernia. 5 mm port sites were closed at skin with 4-0 Monocryl subcuticular. The Foley was removed at end of case. ${isBSO ? "For premenopausal BSO: counseling regarding surgical menopause was reinforced — vasomotor symptoms (hot flashes, night sweats), vaginal atrophy, decreased libido, accelerated bone loss (~2-3% BMD per year first 5 years), and increased cardiovascular risk. Hormone replacement therapy was discussed (combined estrogen + progesterone for patients with intact uterus; estrogen alone post-hysterectomy) — recommended for symptom control and CV/bone protection until natural age of menopause (~51 years), per NAMS position statement and the ENGAGE/IMS guidelines. For BRCA mutation carriers: HRT does not significantly increase breast cancer risk and is recommended through age 51." : ""}`,
      `Postoperative follow-up: 6 weeks for surgical evaluation. ${name.includes("brca") || name.includes("risk reducing") ? "Long-term: residual peritoneal cancer risk ~3-4% lifetime persists; serum CA-125 surveillance is not routinely recommended. Mammography + breast MRI surveillance continues for breast cancer risk." : "Long-term: no specific surveillance required for benign indications."} Pathology was reviewed at 7-10 days; any unexpected pathology (occult malignancy, serous tubal intraepithelial carcinoma — STIC) prompted gynecologic oncology referral and staging discussion.`,
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
