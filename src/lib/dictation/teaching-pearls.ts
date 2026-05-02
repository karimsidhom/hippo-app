// ---------------------------------------------------------------------------
// Teaching Pearls module
//
// Optional textbook-grade pearls block appended to operative notes when
// `preferences.teachingPearlsEnabled` is true. Reads like the "Pitfalls,
// Tricks, and Pearls" sidebar from Campbell-Walsh-Wein, Schwartz, etc.
//
// Each pearl set is tied to a procedure keyword (case-insensitive substring).
// First match wins. Falls back to a generic surgical pearls block.
//
// IMPORTANT: do NOT embed numerical claims, fee codes, or specific drug doses
// here — pearls are conceptual + technique-oriented, not billing or safety
// guidance. Consumers must still verify clinical decisions against current
// guidelines.
// ---------------------------------------------------------------------------

import type { CaseLog } from "@/lib/types";

export interface TeachingPearl {
  category: "pearl" | "pitfall" | "decision";
  text: string;
}

export interface TeachingPearlSet {
  procedure: string;
  pearls: TeachingPearl[];
}

const PEARL_LIBRARY: Array<{
  patterns: RegExp[];
  set: TeachingPearlSet;
}> = [
  // ────────────────────────────────────────────────────────────────────
  // UROLOGY
  // ────────────────────────────────────────────────────────────────────
  {
    patterns: [/\bureteroscop|urs\b|laser lithotrips/i],
    set: {
      procedure: "Ureteroscopy + laser lithotripsy",
      pearls: [
        { category: "pearl", text: "Always confirm a safety wire in the renal pelvis before passing the scope or basket — wire access is the difference between a controlled rescue and emergent percutaneous access if the ureter perforates." },
        { category: "pearl", text: "Dusting (low energy, high frequency) versus fragmenting (higher energy, lower frequency) is a stone-burden + access-sheath decision: dust large soft stones for spontaneous passage, fragment hard or impacted stones for basket extraction." },
        { category: "pitfall", text: "Tight ureteric access sheaths (12 Fr+) cause Hayes 3–4 ureteric injury in 5–10% — abort UAS placement if it does not pass with gentle pressure and stent for staged treatment." },
        { category: "pitfall", text: "Stone retropulsion into the upper pole is the most common cause of incomplete clearance — Moses-pulse or thulium fibre lasers reduce this; basket the stone or push into a calyx before laser activation." },
        { category: "decision", text: "If ureteric edema or perforation is identified at the end of the case, leave a stent for 1–2 weeks beyond the usual interval and follow up with KUB at 4 weeks before stent removal." },
      ],
    },
  },
  {
    patterns: [/\bturbt|transurethral resection of bladder/i],
    set: {
      procedure: "TURBT",
      pearls: [
        { category: "pearl", text: "A separate, deliberate deep-muscle specimen from the tumor base is mandatory for accurate pT staging — its absence on pathology is the most common reason for re-TURBT in 4–6 weeks." },
        { category: "pearl", text: "Single-dose intravesical mitomycin or gemcitabine within 6 hours of low- and intermediate-risk NMIBC reduces 1-year recurrence by 35–40% (level A). Contraindicated for confirmed perforation, extensive resection, or gross hematuria." },
        { category: "pitfall", text: "Lateral-wall tumors trigger the obturator reflex with monopolar cautery — non-depolarising paralysis OR bipolar TURis is required; the violent leg jerk can perforate the bladder in milliseconds." },
        { category: "pitfall", text: "Fulgurating perpendicular to a ureteric orifice causes stricture and obstructive uropathy — fulgurate parallel to the orifice or stent prophylactically if the tumor was on the trigone." },
        { category: "decision", text: "High-grade T1 disease or absent muscle on the initial pathology mandates re-TURBT in 4–6 weeks — finds residual disease in 30–50%." },
      ],
    },
  },
  {
    patterns: [/\bturp|transurethral resection of prostate|holep|greenlight|pvp/i],
    set: {
      procedure: "TURP / GreenLight / HoLEP",
      pearls: [
        { category: "pearl", text: "The verumontanum is the absolute distal landmark — resecting beyond it risks the external urethral sphincter and stress incontinence. Visual orientation to the verumontanum should be re-confirmed every few minutes." },
        { category: "pearl", text: "Bipolar saline TURP eliminates TUR syndrome (hyponatremic hyperammonemia) and is the modern standard. Reserve monopolar glycine for centers without bipolar capability and limit operative time to < 60 minutes." },
        { category: "pitfall", text: "Capsular perforation causes extravasation and the most catastrophic intraoperative bleeding from veins on the capsular surface — recognised by sudden loss of distention and darker irrigant return." },
        { category: "pitfall", text: "Failure to identify the bladder neck distinct from the prostate causes incomplete adenoma clearance. Treat the bladder neck as the proximal landmark and resect to the surgical capsule there." },
        { category: "decision", text: "Counsel preoperatively on retrograde ejaculation (15–30%) — the most common 'unexpected' postop complaint that is actually fully expected." },
      ],
    },
  },
  {
    patterns: [/\bvasectom/i],
    set: {
      procedure: "Vasectomy",
      pearls: [
        { category: "pearl", text: "No-scalpel + luminal cautery + fascial interposition together drive the failure rate to 0.5%, the lowest of any technique combination. Permission to skip fascial interposition has not been earned by the data." },
        { category: "pearl", text: "Mandatory pathology confirmation of vasal tissue prevents the 'wrong-structure' lawsuit — never end the case without seeing 'spermatic cord/vas deferens' on the specimen requisition." },
        { category: "pitfall", text: "Patients hear 'permanent sterilization' and assume immediate effect — emphasize backup contraception until post-vasectomy semen analysis at 8–16 weeks shows azoospermia (or rare nonmotile sperm < 100,000/mL per AUA)." },
        { category: "decision", text: "Counsel on chronic post-vasectomy pain syndrome (1–3%) preoperatively — it is the highest-impact regret driver in the literature." },
      ],
    },
  },
  {
    patterns: [/\bradical orchiectom|inguinal orchiectom/i],
    set: {
      procedure: "Radical orchiectomy",
      pearls: [
        { category: "pearl", text: "High cord ligation at the internal ring before testis manipulation is the dominant oncologic principle — it minimises venous embolisation of tumor cells. A scrotal approach for a malignant testis is a never event." },
        { category: "pearl", text: "Tag the cord stump with a permanent non-absorbable suture — this provides a radio-opaque marker for surveillance imaging and a landmark for any future RPLND." },
        { category: "pitfall", text: "Pre-orchiectomy tumor markers (AFP, hCG, LDH) are stage- and prognosis-defining — drawing them postoperatively destroys baseline interpretation." },
        { category: "decision", text: "Discuss sperm cryopreservation BEFORE surgery in any patient who may want future fertility — orchiectomy alone is rarely the issue, but adjuvant chemotherapy or radiation often is." },
      ],
    },
  },
  {
    patterns: [/\bpyeloplast/i],
    set: {
      procedure: "Pyeloplasty",
      pearls: [
        { category: "pearl", text: "Anderson-Hynes dismembered is the workhorse for crossing-vessel UPJ obstruction — transposing the lower-pole vessel posterior to the anastomosis (Hellström) prevents recurrence." },
        { category: "pearl", text: "Spatulate the ureter laterally for at least 1.5 cm — a wide ureteric mouth is the difference between a tension-free anastomosis and a stricture at 6 months." },
        { category: "pitfall", text: "Twisting the ureter during anastomosis is the most common technical failure mode — orient the ureter with a marker stitch before tying." },
        { category: "decision", text: "Functional success is defined by MAG3 T1/2 < 10 minutes at 3 months, NOT just resolution of hydronephrosis on ultrasound." },
      ],
    },
  },

  // ────────────────────────────────────────────────────────────────────
  // GENERAL SURGERY
  // ────────────────────────────────────────────────────────────────────
  {
    patterns: [/\bcholecystectom|lap chole/i],
    set: {
      procedure: "Cholecystectomy",
      pearls: [
        { category: "pearl", text: "The Critical View of Safety (Strasberg): only two structures entering the gallbladder, lower third of gallbladder separated from the liver bed, and hepatocystic triangle cleared of all fat and fibrous tissue. No CVS = no clip + cut, full stop." },
        { category: "pearl", text: "When in doubt, fundus-down dissection or subtotal cholecystectomy is far better than a misidentified CBD injury — the Strasberg E injury is the litigation case that ends careers." },
        { category: "pitfall", text: "The 'tenting' of the CBD looks like a cystic duct after over-traction — always confirm by fully dissecting the lower third of the gallbladder off the liver before clipping." },
        { category: "decision", text: "Intraoperative cholangiography for unclear anatomy, suspected stones, or any concerning dissection — never as a salvage after injury, only proactively." },
      ],
    },
  },
  {
    patterns: [/\bappendectom|appendicit/i],
    set: {
      procedure: "Appendectomy",
      pearls: [
        { category: "pearl", text: "If the appendix appears normal at the time of diagnostic laparoscopy for RLQ pain, removal is still appropriate (incidental endometriosis, neuroendocrine tumors, occult appendicitis on histology in 15–20%)." },
        { category: "pitfall", text: "Stapling across an inflamed cecal base risks staple line breakdown — purse-string + drop technique or wider cecal resection if the base is friable." },
        { category: "decision", text: "Perforation with localised abscess in a stable patient: percutaneous drain + interval appendectomy after 6–8 weeks, not heroic immediate operation." },
      ],
    },
  },
  {
    patterns: [/\binguinal hernia/i],
    set: {
      procedure: "Inguinal hernia repair",
      pearls: [
        { category: "pearl", text: "TEP and TAPP have lower chronic pain rates than Lichtenstein in young athletic males per multiple RCTs — recommend laparoscopic repair when expertise is available." },
        { category: "pearl", text: "Identify and preserve the ilioinguinal, iliohypogastric, and genital branch of the genitofemoral nerves in the open approach — sacrifice = chronic neuralgic groin pain." },
        { category: "pitfall", text: "Tacking mesh into the triangle of doom (medial to the cord, contains external iliac vessels) or the triangle of pain (lateral to the cord, contains lateral femoral cutaneous nerve) is the most common cause of laparoscopic hernia complications." },
        { category: "decision", text: "Counsel on chronic post-herniorrhaphy pain (5–15%) — the highest-impact long-term outcome the literature does not advertise enough." },
      ],
    },
  },
  {
    patterns: [/\bcolectomy|hemicolect|sigmoid resect|low anterior resect|lar/i],
    set: {
      procedure: "Colectomy / LAR",
      pearls: [
        { category: "pearl", text: "Adequate lymph node yield (≥ 12 nodes per AJCC) requires a true high-tie of the named vessel at its origin, not a low division at the bowel wall — staging accuracy depends on this." },
        { category: "pearl", text: "Air-leak test on every low pelvic anastomosis below the peritoneal reflection — the cost of catching a leak is one stitch; the cost of missing one is sepsis and reoperation." },
        { category: "pitfall", text: "The left ureter is the most commonly injured structure in sigmoid colectomy and LAR — identify it crossing the iliac bifurcation BEFORE dividing the IMA pedicle." },
        { category: "decision", text: "Diverting loop ileostomy for any anastomosis below the peritoneal reflection or after neoadjuvant radiation — anastomotic leak with stoma is recoverable, anastomotic leak without stoma is septic." },
      ],
    },
  },

  // ────────────────────────────────────────────────────────────────────
  // OB/GYN
  // ────────────────────────────────────────────────────────────────────
  {
    patterns: [/\bcesarean|c-section|c\/s|lscs/i],
    set: {
      procedure: "Cesarean delivery",
      pearls: [
        { category: "pearl", text: "Pre-incision antibiotics within 60 minutes (cefazolin 2 g, or 3 g for BMI > 80) reduce surgical site infection by 30–50% — this changed practice from cord-clamp dosing about a decade ago and remains underused." },
        { category: "pearl", text: "Active management of the third stage with oxytocin infusion + early cord clamping + controlled cord traction reduces postpartum hemorrhage by 60% (level A)." },
        { category: "pitfall", text: "Extending the hysterotomy with bandage scissors rather than blunt expansion is associated with broad-ligament hematoma and uterine artery injury — blunt cephalad-caudad expansion is safer in the modern data." },
        { category: "decision", text: "Single-layer hysterotomy closure has higher uterine rupture risk in subsequent TOLAC than two-layer closure (number-needed-to-harm ~70) — counsel patients planning future TOLAC explicitly." },
      ],
    },
  },
  {
    patterns: [/\bhysterectom/i],
    set: {
      procedure: "Hysterectomy",
      pearls: [
        { category: "pearl", text: "The ureter crosses the uterine artery 1–2 cm lateral to the cervix at the level of the internal os — every clamp on the uterine vessels must be at right angles to the uterus and inspected for an out-of-plane ureter beforehand." },
        { category: "pearl", text: "McCall culdoplasty incorporating the uterosacral ligaments into the vaginal cuff at TAH/TLH provides apical support and reduces post-hysterectomy vault prolapse." },
        { category: "pitfall", text: "Cystoscopy after every TLH (and any TAH involving extensive lateral dissection) — bladder mucosal injury and ureteric jet absence detect injuries that present as ureterovaginal fistula at week 2." },
      ],
    },
  },

  // ────────────────────────────────────────────────────────────────────
  // ORTHOPEDICS
  // ────────────────────────────────────────────────────────────────────
  {
    patterns: [/\btka|total knee arthroplast/i],
    set: {
      procedure: "Total knee arthroplasty",
      pearls: [
        { category: "pearl", text: "Mechanical alignment within 3° of neutral remains the gold-standard target — outliers above 5° have measurable polyethylene wear and revision risk acceleration in the registry data." },
        { category: "pearl", text: "Tranexamic acid (1 g IV pre-incision + 1 g topical at closure) reduces transfusion requirement by 50–70% in joint replacement (level A)." },
        { category: "pitfall", text: "Posterior cruciate ligament release without proper soft-tissue balancing causes flexion instability — gap balancing with spacer blocks before final cuts prevents this." },
      ],
    },
  },
  {
    patterns: [/\btha|total hip arthroplast|hip replacement/i],
    set: {
      procedure: "Total hip arthroplasty",
      pearls: [
        { category: "pearl", text: "Cup anteversion 15–25° + abduction 30–45° (Lewinnek safe zone) minimizes dislocation, although the modern data suggest these targets need patient-specific adjustment using femoral version + spinopelvic mobility." },
        { category: "pearl", text: "Restoring leg length and offset within 5 mm of the contralateral side is the single biggest patient-reported outcome driver — measure with a tibial pin or computer navigation when available." },
        { category: "pitfall", text: "Sciatic nerve traction injury during posterior approach acetabular retractor placement — keep the knee flexed and avoid prolonged retraction in the posterior wall." },
      ],
    },
  },

  // ────────────────────────────────────────────────────────────────────
  // VASCULAR
  // ────────────────────────────────────────────────────────────────────
  {
    patterns: [/\bcarotid endarterect|cea/i],
    set: {
      procedure: "Carotid endarterectomy",
      pearls: [
        { category: "pearl", text: "Eversion vs conventional patch CEA have equivalent outcomes in most series — patient anatomy + surgeon expertise drive the choice." },
        { category: "pearl", text: "Stump pressure < 50 mmHg or EEG slowing predicts cross-clamp ischemia → shunt placement. Routine vs selective shunting remains debated; selective shunting per stump pressure or EEG is pragmatic." },
        { category: "pitfall", text: "Intimal flap at the distal endpoint causes early restenosis and stroke — feathering the endpoint and tacking sutures distally are the standard salvage." },
      ],
    },
  },
  {
    patterns: [/\bbypass|fem-pop|fem pop/i],
    set: {
      procedure: "Lower-extremity bypass",
      pearls: [
        { category: "pearl", text: "Autogenous vein (reversed GSV or in-situ with valvulotomy) is gold standard with 5-year primary patency 60–80% — prosthetic conduit drops to 25–45% at the same target." },
        { category: "pearl", text: "Completion angiography or duplex confirms anastomotic patency + outflow + technical adequacy — it is the difference between catching a fixable defect now vs returning to the OR for thrombectomy in 24 hours." },
      ],
    },
  },

  // ────────────────────────────────────────────────────────────────────
  // ENT
  // ────────────────────────────────────────────────────────────────────
  {
    patterns: [/\btonsillectom|adenoid/i],
    set: {
      procedure: "Tonsillectomy",
      pearls: [
        { category: "pearl", text: "Coblation has marginally lower postoperative pain than monopolar electrocautery in pediatric tonsillectomy per RCT meta-analyses, with similar bleeding rates." },
        { category: "pitfall", text: "Postoperative tonsillar hemorrhage at POD 7–10 (sloughing of the eschar) is the classic delayed bleed — counsel families on this timing explicitly." },
      ],
    },
  },
  {
    patterns: [/\bthyroidectom/i],
    set: {
      procedure: "Thyroidectomy",
      pearls: [
        { category: "pearl", text: "Continuous intraoperative recurrent laryngeal nerve monitoring (NIM-3) reduces permanent RLN palsy in high-volume centers and is the standard of care in many guidelines." },
        { category: "pearl", text: "Identify and preserve all four parathyroid glands on their vascular pedicles — the inferior parathyroids are at greatest risk during inferior thyroid artery ligation. Reimplant any devitalised gland into the SCM." },
        { category: "pitfall", text: "Bilateral RLN injury causes acute upper airway obstruction at extubation — never extubate without confirming vocal cord function (laryngoscopy or NIM signal)." },
      ],
    },
  },

  // ────────────────────────────────────────────────────────────────────
  // NEUROSURGERY
  // ────────────────────────────────────────────────────────────────────
  {
    patterns: [/\bcraniotomy|tumor resection|glioma|meningioma/i],
    set: {
      procedure: "Craniotomy for tumor",
      pearls: [
        { category: "pearl", text: "Awake craniotomy with intraoperative cortical mapping is the standard for tumors near eloquent cortex (motor strip, Broca's, Wernicke's) — extent of resection without new deficit is the dual-goal Bookwalter outcome." },
        { category: "pearl", text: "Postoperative MRI within 24–48 hours captures extent of resection accurately — beyond 72 hours, postsurgical enhancement masks residual tumor on contrast imaging." },
        { category: "pitfall", text: "Air embolism risk in sitting-position posterior fossa surgery — precordial Doppler + central line for aspiration of right-heart air is mandatory." },
      ],
    },
  },
];

const GENERIC_PEARLS: TeachingPearl[] = [
  { category: "pearl", text: "The WHO Surgical Safety Checklist time-out is more than a procedural tax — pre-incision pause checking site, side, and team awareness is the single highest-yield safety intervention in the OR per multiple registry studies." },
  { category: "pearl", text: "Active warming + normothermia + judicious fluid management + early multimodal analgesia drive enhanced recovery — these are the three ERAS levers that matter most across specialties." },
  { category: "pitfall", text: "Closing without explicitly counting sponges, sharps, and instruments + without inspecting all four quadrants is the most common preventable retained foreign body — every count must be reconciled before any wound closure." },
  { category: "decision", text: "Postoperative debrief — what went well, what to do differently next time — is the underused tool of surgical mastery. Document one technical insight per case." },
];

export function getTeachingPearls(c: CaseLog): TeachingPearlSet {
  const name = c.procedureName?.toLowerCase() ?? "";
  for (const entry of PEARL_LIBRARY) {
    if (entry.patterns.some((re) => re.test(name))) {
      return entry.set;
    }
  }
  return { procedure: c.procedureName || "this case", pearls: GENERIC_PEARLS };
}

export function buildTeachingPearlsBlock(c: CaseLog): string {
  const set = getTeachingPearls(c);
  if (!set.pearls.length) return "";
  const lines: string[] = [];
  lines.push("");
  lines.push("--- TEACHING PEARLS ---");
  lines.push(`Procedure: ${set.procedure}`);
  lines.push("");
  for (const p of set.pearls) {
    const tag =
      p.category === "pearl" ? "PEARL" : p.category === "pitfall" ? "PITFALL" : "DECISION";
    lines.push(`${tag}: ${p.text}`);
  }
  return lines.join("\n");
}
