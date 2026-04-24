// ---------------------------------------------------------------------------
// Manitoba-specific billing metadata layer for operative dictations
// ---------------------------------------------------------------------------
// Source: Manitoba Physician's Manual 2026
//
// Key Manitoba surgical billing rules this module encodes:
// - Major surgical services include 3 weeks postoperative care
// - Multiple services, same incision: highest at 100%, lesser at 75%
// - Multiple services, separate incisions: same 100% / 75% structure
// - Bilateral same session: first side 100%, second side 75%
// - Additional surgical service within 3 weeks but unrelated: 100%
// - Two surgeons: fee apportionment
// - Surgical assistant: medical necessity must be justifiable
// - Adhesiolysis add-on (3500/3501): must document total case time
//   AND total adhesiolysis time in the operative report
// ---------------------------------------------------------------------------

import type {
  BillingPrompt,
  DictationContext,
  ProcedureBillingCode,
  ProcedureBillingProfile,
  RenderedBillingOverlay,
} from "./types";

// ── Global surgical rules (apply to every Manitoba case) ────────────────────

export const MB_GLOBAL_SURGICAL_RULES: BillingPrompt[] = [
  {
    id: "mb-multiple-same-incision",
    label: "Same-incision multiple procedure rule",
    text: "If multiple distinct surgical services were performed through the same incision, document each procedure clearly so Manitoba billing can apply 100% to the highest-value service and 75% to the lesser service(s).",
    severity: "conditional",
    color: "#F59E0B",
    condition: (ctx) => !!ctx.sameIncisionMultipleProcedures,
  },
  {
    id: "mb-multiple-separate-incisions",
    label: "Separate-incision multiple procedure rule",
    text: "If multiple distinct surgical services were performed through separate incisions under the same anesthetic, document each incision and each procedure clearly for Manitoba multiple-procedure billing.",
    severity: "conditional",
    color: "#F59E0B",
    condition: (ctx) => !!ctx.separateIncisionMultipleProcedures,
  },
  {
    id: "mb-bilateral",
    label: "Bilateral same-session rule",
    text: "If bilateral surgery was performed during the same operative session, explicitly document laterality and that both sides were treated in the same anesthetic session.",
    severity: "conditional",
    color: "#F59E0B",
    condition: (ctx) =>
      ctx.bilateralSameSession === true || ctx.laterality === "bilateral",
  },
  {
    id: "mb-assistant",
    label: "Surgical assistant necessity",
    text: "If a surgical assistant was used, document why assistant participation was medically necessary.",
    severity: "conditional",
    color: "#F97316",
    condition: (ctx) => !!ctx.assistantUsed,
  },
  {
    id: "mb-two-surgeons",
    label: "Two-surgeon apportionment",
    text: "If two surgeons shared the case, document each surgeon's role and responsibility clearly to support fee apportionment.",
    severity: "conditional",
    color: "#F97316",
    condition: (ctx) => !!ctx.twoSurgeons,
  },
  {
    id: "mb-additional-service",
    label: "Additional surgical service within 3 weeks",
    text: "If this was an additional surgical service within 3 weeks of a prior surgery, document why it was unrelated versus due to a complication, since Manitoba billing treats these differently.",
    severity: "conditional",
    color: "#F59E0B",
    condition: (ctx) => !!ctx.additionalProcedureWithin3Weeks,
  },
];

// ── Procedure library ───────────────────────────────────────────────────────

export const MB_PROCEDURE_LIBRARY: Record<string, ProcedureBillingProfile> = {
  // ── Adhesiolysis add-on ──────────────────────────────────────────────────
  adhesiolysis_add_on: {
    procedureKey: "adhesiolysis_add_on",
    displayName: "Intra-operative Lysis of Adhesions",
    province: "MB",
    codes: [
      {
        code: "3500",
        label: "Lysis of Adhesions, first full 30 minutes",
        fee: "227.63",
        notes: [
          "Claimable with surgical services in sections I, J, K, M, N, and O.",
          "Operative report must clearly state total surgical case time and total lysis-of-adhesions time.",
        ],
      },
      {
        code: "3501",
        label:
          "Lysis of Adhesions, each additional 15 minutes or major portion thereof",
        fee: "113.82",
        notes: [
          "Use only when time thresholds are met and documented clearly in the operative report.",
        ],
      },
    ],
    prompts: [
      {
        id: "mb-adhesiolysis-case-time",
        label: "Billing-critical case time",
        text: "Billing-critical: state the TOTAL surgical case time explicitly.",
        severity: "required",
        color: "#DC2626",
        requiredForCodes: ["3500", "3501"],
        condition: (ctx) => !!ctx.performedLysisOfAdhesions,
      },
      {
        id: "mb-adhesiolysis-lysis-time",
        label: "Billing-critical adhesiolysis time",
        text: "Billing-critical: state the TOTAL time spent performing lysis of adhesions explicitly.",
        severity: "required",
        color: "#DC2626",
        requiredForCodes: ["3500", "3501"],
        condition: (ctx) => !!ctx.performedLysisOfAdhesions,
      },
      {
        id: "mb-adhesiolysis-extent",
        label: "Recommended operative detail",
        text: "Recommended: describe density/extent/location of adhesions and why adhesiolysis was required to safely complete the primary operation.",
        severity: "recommended",
        color: "#F59E0B",
        requiredForCodes: ["3500", "3501"],
        condition: (ctx) => !!ctx.performedLysisOfAdhesions,
      },
    ],
    footerRules: [
      "Append Manitoba tariff codes at end of draft dictation.",
      "If lysis time is missing, do not suggest 3500/3501 as billable-ready.",
    ],
  },

  // ── Urology procedures ───────────────────────────────────────────────────
  turbt: {
    procedureKey: "turbt",
    displayName: "Transurethral Resection of Bladder Tumour (TURBT)",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, lines 21134/21150.
    // Two codes depending on tumor size; attending picks at billing time.
    codes: [
      {
        code: "3922",
        label: "Tumor bladder, excision (small TURBT)",
        fee: "459.54",
      },
      {
        code: "3924",
        label: "Large bladder tumor, transurethral resection",
        fee: "543.73",
      },
    ],
    prompts: [
      {
        id: "mb-turbt-tumour-details",
        label: "Tumour documentation",
        text: "Document number, size, location, and appearance of tumour(s). Note whether muscle was visible in resection base.",
        severity: "recommended",
        color: "#F59E0B",
      },
      {
        id: "mb-turbt-bimanual",
        label: "Bimanual exam",
        text: "Document bimanual examination findings before and after resection (mobile vs. fixed).",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [
      "If multiple tumours at different sites, document each site for potential add-on codes.",
    ],
  },

  cystoscopy: {
    procedureKey: "cystoscopy",
    displayName: "Cystoscopy",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, lines 20934-20942.
    // Diagnostic vs. with-biopsy vs. with-ureteral-catheterization are
    // distinct codes; pick per what was actually done.
    codes: [
      {
        code: "3931",
        label: "Cystoscopy, diagnostic, initial",
        fee: "97.85",
      },
      {
        code: "3933",
        label: "Cystoscopy with biopsy",
        fee: "130.98",
      },
      {
        code: "3928",
        label: "Cystoscopy with ureteral catheterization ± retrograde pyelogram",
        fee: "133.34",
      },
    ],
    prompts: [
      {
        id: "mb-cysto-findings",
        label: "Cystoscopy findings",
        text: "Document urethra, prostate (if male), bladder mucosa, ureteral orifices, and any pathology seen.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [],
  },

  radical_prostatectomy: {
    procedureKey: "radical_prostatectomy",
    displayName: "Radical Prostatectomy",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, lines 21511-21514.
    // Three distinct codes: perineal, retropubic, combined with staging LND.
    // Bill whichever matches the actual approach + whether pelvic LND done.
    codes: [
      {
        code: "4319",
        label: "Radical prostatectomy, retropubic",
        fee: "1521.45",
      },
      {
        code: "4313",
        label: "Radical prostatectomy, perineal",
        fee: "1507.13",
      },
      {
        code: "4320",
        label: "Combined radical prostatectomy + staging lymphadenectomy",
        fee: "1923.50",
      },
    ],
    prompts: [
      {
        id: "mb-rp-nerve-sparing",
        label: "Nerve-sparing documentation",
        text: "Document whether nerve-sparing was performed, laterality, and technique used.",
        severity: "recommended",
        color: "#F59E0B",
      },
      {
        id: "mb-rp-lymph-nodes",
        label: "Lymph node dissection",
        text: "If pelvic lymph node dissection performed, document extent (standard vs. extended) and laterality for separate billing.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [
      "Pelvic lymph node dissection may be billed separately if documented as distinct procedure.",
    ],
  },

  nephrectomy: {
    procedureKey: "nephrectomy",
    displayName: "Nephrectomy (Partial or Radical)",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, lines 20963-20990.
    // Real 5730 in the manual is "entropion repair" (ophthalmology) — the
    // prior code in Hippo was an entirely different specialty's procedure.
    // Correct nephrectomy codes are in the 3800s.
    codes: [
      {
        code: "3821",
        label: "Nephrectomy, including partial ureterectomy same incision",
        fee: "1208.00",
      },
      {
        code: "3823",
        label: "Radical nephrectomy, thoracic approach + perinephric fat excision",
        fee: "See manual line 20968",
      },
      {
        code: "3809",
        label: "Laparoscopic radical nephrectomy",
        fee: "See manual line 20988",
      },
      {
        code: "3815",
        label: "Partial nephrectomy, complete vascular dissection",
        fee: "See manual line 20986",
      },
      {
        code: "3816",
        label: "Laparoscopic partial nephrectomy",
        fee: "See manual line 20990",
      },
      {
        code: "3824",
        label: "Heminephrectomy",
        fee: "1585.76",
      },
    ],
    prompts: [
      {
        id: "mb-neph-laterality",
        label: "Laterality",
        text: "Document laterality (left/right) explicitly.",
        severity: "required",
        color: "#DC2626",
      },
      {
        id: "mb-neph-approach",
        label: "Surgical approach",
        text: "Document approach clearly (open, laparoscopic, robotic-assisted). If conversion occurred, document reason.",
        severity: "recommended",
        color: "#F59E0B",
      },
      {
        id: "mb-neph-ischemia",
        label: "Ischemia time (partial)",
        text: "For partial nephrectomy: document warm ischemia time, clamping technique, and method of renorrhaphy.",
        severity: "required",
        color: "#DC2626",
        condition: (ctx) =>
          ctx.procedureKey === "nephrectomy" ||
          ctx.procedureKey.includes("partial"),
      },
    ],
    footerRules: [],
  },

  ureteroscopy: {
    procedureKey: "ureteroscopy",
    displayName: "Ureteroscopy with Laser Lithotripsy",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, lines 21010-21015.
    // Three distinct codes: diagnostic, with manipulation + removal, with
    // EH/US lithotripsy. Add 3956 for post-procedure stenting.
    codes: [
      {
        code: "3958",
        label: "Cystoscopy + diagnostic ureteroscopy (rigid or flexible)",
        fee: "329.75",
      },
      {
        code: "3959",
        label: "URS with calculus manipulation and removal",
        fee: "566.83",
      },
      {
        code: "3957",
        label: "URS with electrohydraulic or ultrasound lithotripsy",
        fee: "551.13",
      },
      {
        code: "3956",
        label: "Add-on: post-procedure ureteric stenting (to 3958)",
        fee: "477.88",
      },
    ],
    prompts: [
      {
        id: "mb-urs-stone-details",
        label: "Stone documentation",
        text: "Document stone size, location, composition if known, and number of fragments. State whether stone-free or residual fragments remain.",
        severity: "recommended",
        color: "#F59E0B",
      },
      {
        id: "mb-urs-stent",
        label: "Stent placement",
        text: "If ureteral stent placed, document size, length, and planned removal date. Stent insertion may be billed separately.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [
      "Stent insertion/removal may be billed as separate tariff if documented.",
    ],
  },

  circumcision: {
    procedureKey: "circumcision",
    displayName: "Circumcision",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, lines 21374-21375.
    codes: [
      {
        code: "4123",
        label: "Circumcision, surgical excision (any age except newborn)",
        fee: "267.95",
      },
      {
        code: "4122",
        label: "Circumcision, newborn",
        fee: "258.32",
      },
    ],
    prompts: [
      {
        id: "mb-circ-indication",
        label: "Medical indication",
        text: "Document the medical indication for circumcision (phimosis, paraphimosis, recurrent balanitis, etc.).",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [],
  },

  // ── General surgery procedures ────────────────────────────────────────────
  cholecystectomy: {
    procedureKey: "cholecystectomy",
    displayName: "Cholecystectomy",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, line 20787.
    // Manitoba uses a single tariff regardless of laparoscopic vs. open.
    // If converted, no separate "conversion" tariff — document the reason
    // for conversion in the operative note.
    codes: [
      { code: "3515", label: "Gallbladder, cholecystectomy (open or laparoscopic)", fee: "636.92" },
    ],
    prompts: [
      {
        id: "mb-chole-critical-view",
        label: "Critical View of Safety",
        text: "Document achievement of Critical View of Safety (CVS) with two structures entering the gallbladder and hepatocystic triangle cleared.",
        severity: "required",
        color: "#DC2626",
      },
      {
        id: "mb-chole-cholangiogram",
        label: "Intraoperative cholangiogram",
        text: "If intraoperative cholangiogram performed, document findings. This may support a separate billing code.",
        severity: "conditional",
        color: "#F59E0B",
        condition: () => true, // always show as reminder
      },
    ],
    footerRules: [
      "If converted from laparoscopic to open, document reason for conversion clearly.",
    ],
  },

  appendectomy: {
    procedureKey: "appendectomy",
    displayName: "Appendectomy",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, lines 20607-20609.
    // Three distinct codes — simple, perforated, perforated with abscess
    // drainage — bill what actually happened.
    codes: [
      { code: "3261", label: "Appendectomy", fee: "497.06" },
      { code: "3262", label: "Appendectomy, perforated appendix", fee: "497.06" },
      { code: "3263", label: "Appendectomy with drainage of abscess", fee: "518.81" },
    ],
    prompts: [
      {
        id: "mb-appy-findings",
        label: "Appendix findings",
        text: "Document gross appearance of appendix (inflamed, perforated, gangrenous, normal). Document state of peritoneal cavity.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [],
  },

  hernia_repair: {
    procedureKey: "hernia_repair",
    displayName: "Hernia Repair (Inguinal/Umbilical/Ventral)",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, lines 20045-20068.
    // Different codes by hernia type + whether incarcerated/recurrent.
    // Manitoba does NOT have a separate tariff for laparoscopic vs. open —
    // the hernia type is what determines the code.
    codes: [
      { code: "3631", label: "Inguinal hernia, initial", fee: "448.07" },
      { code: "3646", label: "Femoral hernia, initial", fee: "448.07" },
      { code: "3663", label: "Epigastric hernia, initial", fee: "350.59" },
      { code: "3666", label: "Umbilical hernia", fee: "404.19" },
      { code: "3661", label: "Ventral (incisional) hernia repair ± prosthesis, with enterolysis", fee: "See manual line 20058" },
      { code: "3660", label: "Ventral hernia, massive incisional, with enterolysis", fee: "See manual line 20060" },
      { code: "3633", label: "Incarcerated hernia without bowel resection", fee: "556.83" },
    ],
    prompts: [
      {
        id: "mb-hernia-laterality",
        label: "Laterality (inguinal)",
        text: "For inguinal hernia: document laterality explicitly (left/right/bilateral). Bilateral = separate billing at reduced rate for second side.",
        severity: "required",
        color: "#DC2626",
      },
      {
        id: "mb-hernia-mesh",
        label: "Mesh documentation",
        text: "If mesh used, document type, size, and fixation method. Mesh placement may affect billing.",
        severity: "recommended",
        color: "#F59E0B",
      },
      {
        id: "mb-hernia-recurrent",
        label: "Recurrent hernia",
        text: "If recurrent hernia repair, document clearly as recurrent — Manitoba may allow a higher tariff.",
        severity: "conditional",
        color: "#F59E0B",
        condition: () => true,
      },
    ],
    footerRules: [
      "Bilateral inguinal hernia: first side 100%, second side 75%.",
    ],
  },

  colectomy: {
    procedureKey: "colectomy",
    displayName: "Colectomy (Partial or Total)",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, lines 20613-20618.
    // Note: the old Hippo code 4320 is actually the OBGYN combined radical
    // prostatectomy + staging lymphadenectomy code — entirely different
    // procedure, different specialty. Real colectomy codes are 3179/3180/3181.
    codes: [
      { code: "3179", label: "Colectomy, partial ± anastomosis or colostomy", fee: "1060.19" },
      { code: "3180", label: "Colectomy, total ± anastomosis or ileostomy", fee: "1467.27" },
      { code: "3181", label: "Total colectomy + proctectomy, one surgeon", fee: "2017.41" },
      { code: "3184", label: "Mucosal proctectomy + ileal-anal J-pouch + ileostomy", fee: "2599.87" },
    ],
    prompts: [
      {
        id: "mb-colectomy-extent",
        label: "Resection extent",
        text: "Document extent of resection (right hemicolectomy, left hemicolectomy, sigmoid, total). Include proximal and distal margins.",
        severity: "required",
        color: "#DC2626",
      },
      {
        id: "mb-colectomy-anastomosis",
        label: "Anastomosis details",
        text: "Document anastomosis type (stapled vs. hand-sewn, end-to-end vs. side-to-side) and leak test if performed.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [
      "If combined with adhesiolysis >= 30 minutes, add tariff 3500.",
    ],
  },

  // ── Additional Urology procedures ───────────────────────────────────────
  turp: {
    procedureKey: "turp",
    displayName: "Transurethral Resection of Prostate (TURP)",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, line 21518. This
    // single tariff covers TURP, HoLEP, and any transurethral prostate
    // energy technique including control of postoperative bleeding.
    codes: [
      { code: "4321", label: "Transurethral prostatectomy (incl. postop bleeding control)", fee: "609.60" },
    ],
    prompts: [
      {
        id: "mb-turp-weight",
        label: "Resected tissue weight",
        text: "Document estimated weight of resected tissue and whether it was sent to pathology.",
        severity: "recommended",
        color: "#F59E0B",
      },
      {
        id: "mb-turp-hemostasis",
        label: "Hemostasis documentation",
        text: "Document adequacy of hemostasis and irrigation fluid used (glycine, saline). Note catheter type and irrigation.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [],
  },

  holep: {
    procedureKey: "holep",
    displayName: "Holmium Laser Enucleation of Prostate (HoLEP)",
    province: "MB",
    // Verified: Manitoba does NOT have a distinct HoLEP tariff. HoLEP, TURP,
    // GreenLight, Thulium and any energy-mediated transurethral prostate
    // procedure all bill under 4321 (line 21518 of the April 2026 manual).
    codes: [
      { code: "4321", label: "Transurethral prostatectomy (covers HoLEP and all laser techniques)", fee: "609.60" },
    ],
    prompts: [
      {
        id: "mb-holep-technique",
        label: "Laser technique",
        text: "Document laser settings, enucleation technique, and morcellation details. State tissue weight.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [],
  },

  nephroureterectomy: {
    procedureKey: "nephroureterectomy",
    displayName: "Nephroureterectomy",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, lines 20966/20967.
    // Single tariff that includes nephrectomy + total ureterectomy + UVJ
    // resection (3822) — don't stack nephrectomy + ureterectomy separately.
    codes: [
      { code: "3822", label: "Nephrectomy + total ureterectomy with UVJ resection", fee: "1514.27" },
      { code: "3825", label: "Nephrectomy + total ureterectomy WITHOUT UVJ resection", fee: "1199.42" },
    ],
    prompts: [
      {
        id: "mb-nux-laterality",
        label: "Laterality",
        text: "Document laterality (left/right) explicitly.",
        severity: "required",
        color: "#DC2626",
      },
      {
        id: "mb-nux-cuff",
        label: "Bladder cuff excision",
        text: "Document bladder cuff excision technique (open, endoscopic, laparoscopic). State how the distal ureter and cuff were managed.",
        severity: "required",
        color: "#DC2626",
      },
      {
        id: "mb-nux-approach",
        label: "Approach",
        text: "Document approach for each portion (laparoscopic nephrectomy + open cuff vs. fully laparoscopic/robotic).",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [
      "Nephrectomy and ureterectomy may be billed as separate tariffs if documented as distinct procedures.",
    ],
  },

  radical_cystectomy: {
    procedureKey: "radical_cystectomy",
    displayName: "Radical Cystectomy with Urinary Diversion",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, lines 21163/21164.
    codes: [
      { code: "3995", label: "Radical cystectomy (incl. seminal vesicles, or uterus/ovaries)", fee: "2064.05" },
      { code: "3996", label: "Add: ileal conduit creation + ureteric transplant to ileal conduit", fee: "535.91" },
    ],
    prompts: [
      {
        id: "mb-rc-diversion",
        label: "Diversion type",
        text: "Document type of urinary diversion (ileal conduit, neobladder, continent cutaneous). Include bowel segment used and anastomosis details.",
        severity: "required",
        color: "#DC2626",
      },
      {
        id: "mb-rc-lymph",
        label: "Lymph node dissection",
        text: "Document extent of pelvic lymph node dissection (standard vs. extended) and laterality.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [
      "Cystectomy and diversion are separate tariffs — document each as distinct procedure.",
    ],
  },

  pcnl: {
    procedureKey: "pcnl",
    displayName: "Percutaneous Nephrolithotomy (PCNL)",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, lines 21065-21070.
    // Six distinct codes based on single vs. multiple stone, with or
    // without lithotripsy, and whether nephrostomy is left at same sitting.
    codes: [
      { code: "3878", label: "Single stone removal + EH/US lithotripsy (± antegrade stent, tract dilation)", fee: "815.70" },
      { code: "3879", label: "Above + nephrostomy at same sitting", fee: "835.42" },
      { code: "3887", label: "Multiple stone removal + lithotripsy", fee: "936.18" },
      { code: "3888", label: "Above + nephrostomy at same sitting", fee: "1134.46" },
      { code: "3872", label: "Percutaneous nephrostomy for stone removal (no litho)", fee: "308.90" },
    ],
    prompts: [
      {
        id: "mb-pcnl-access",
        label: "Access documentation",
        text: "Document puncture site, number of access tracts, and fluoroscopy/ultrasound guidance used.",
        severity: "recommended",
        color: "#F59E0B",
      },
      {
        id: "mb-pcnl-stone",
        label: "Stone details",
        text: "Document stone size, location, burden, and stone-free status post-procedure. Note lithotripsy modality (ultrasonic, laser, pneumatic).",
        severity: "recommended",
        color: "#F59E0B",
      },
      {
        id: "mb-pcnl-laterality",
        label: "Laterality",
        text: "Document laterality (left/right).",
        severity: "required",
        color: "#DC2626",
      },
    ],
    footerRules: [],
  },

  stent_placement: {
    procedureKey: "stent_placement",
    displayName: "Ureteral Stent Placement",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, lines 21033-21034.
    // Bilateral at one sitting gets its own higher tariff (3866), not
    // 2× the unilateral fee.
    codes: [
      { code: "3865", label: "Endoscopic ureteral stent insertion (incl. meatotomy if needed)", fee: "243.62" },
      { code: "3866", label: "Bilateral stent insertion at one sitting", fee: "355.32" },
    ],
    prompts: [
      {
        id: "mb-stent-laterality",
        label: "Laterality",
        text: "Document laterality (left/right/bilateral).",
        severity: "required",
        color: "#DC2626",
      },
      {
        id: "mb-stent-details",
        label: "Stent details",
        text: "Document stent size (French), length, and type. Note planned removal date.",
        severity: "recommended",
        color: "#F59E0B",
      },
      {
        id: "mb-stent-indication",
        label: "Indication",
        text: "Document indication for stent placement (obstruction, post-URS, post-lithotripsy, etc.).",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [
      "If placed as add-on to ureteroscopy, document as separate procedure.",
    ],
  },

  stent_removal: {
    procedureKey: "stent_removal",
    displayName: "Ureteral Stent Removal",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, line 21037.
    codes: [
      { code: "3867", label: "Endoscopic removal of ureteral stent(s)", fee: "102.08" },
    ],
    prompts: [
      {
        id: "mb-stentrem-laterality",
        label: "Laterality",
        text: "Document laterality and confirm stent removed in its entirety.",
        severity: "required",
        color: "#DC2626",
      },
    ],
    footerRules: [],
  },

  orchiectomy: {
    procedureKey: "orchiectomy",
    displayName: "Orchiectomy (Radical or Simple)",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, lines 21420/21425.
    codes: [
      { code: "4148", label: "Inguinal approach for testicular mass ± orchiectomy (radical)", fee: "324.35" },
      { code: "4144", label: "Orchiectomy, simple, unilateral (scrotal)", fee: "203.00" },
    ],
    prompts: [
      {
        id: "mb-orch-approach",
        label: "Approach",
        text: "Document approach: inguinal (radical) vs. scrotal (simple). For testicular cancer, inguinal approach is standard.",
        severity: "required",
        color: "#DC2626",
      },
      {
        id: "mb-orch-laterality",
        label: "Laterality",
        text: "Document laterality (left/right).",
        severity: "required",
        color: "#DC2626",
      },
      {
        id: "mb-orch-cord",
        label: "Cord management",
        text: "Document level of cord ligation (high inguinal for radical). Note if prosthesis placed.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [],
  },

  hydrocelectomy: {
    procedureKey: "hydrocelectomy",
    displayName: "Hydrocelectomy",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, line 21480.
    codes: [
      { code: "4271", label: "Hydrocele of spermatic cord, excision, unilateral", fee: "277.29" },
    ],
    prompts: [
      {
        id: "mb-hydro-laterality",
        label: "Laterality",
        text: "Document laterality (left/right).",
        severity: "required",
        color: "#DC2626",
      },
      {
        id: "mb-hydro-technique",
        label: "Technique",
        text: "Document technique (Lord's plication, Jaboulay, excision and eversion).",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [],
  },

  vasectomy: {
    procedureKey: "vasectomy",
    displayName: "Vasectomy",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, line 21472.
    // Single tariff covers unilateral or bilateral vasectomy.
    codes: [
      { code: "4241", label: "Vasectomy, partial or complete, unilateral or bilateral", fee: "212.97" },
    ],
    prompts: [
      {
        id: "mb-vas-bilateral",
        label: "Bilateral confirmation",
        text: "Confirm bilateral procedure. Document technique (no-scalpel, conventional) and fascial interposition/mucosal fulguration if used.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [],
  },

  varicocelectomy: {
    procedureKey: "varicocelectomy",
    displayName: "Varicocelectomy",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, line 21481.
    codes: [
      { code: "4275", label: "Varicocele, excision, unilateral (independent procedure)", fee: "296.14" },
      { code: "4278", label: "Add: with hernia repair and/or hydrocele and/or varicocele excision", fee: "310.51" },
    ],
    prompts: [
      {
        id: "mb-varico-laterality",
        label: "Laterality",
        text: "Document laterality (left/right). State approach (subinguinal microsurgical, inguinal, laparoscopic).",
        severity: "required",
        color: "#DC2626",
      },
    ],
    footerRules: [],
  },

  orchiopexy: {
    procedureKey: "orchiopexy",
    displayName: "Orchiopexy",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, line 21426.
    // Single tariff covers any technique ± concurrent hernia repair.
    codes: [
      { code: "4156", label: "Orchiopexy, any type, with or without hernia repair", fee: "562.44" },
    ],
    prompts: [
      {
        id: "mb-orchiopexy-laterality",
        label: "Laterality",
        text: "Document laterality (left/right). Describe location of testis preoperatively (inguinal canal, abdominal, etc.).",
        severity: "required",
        color: "#DC2626",
      },
      {
        id: "mb-orchiopexy-fixation",
        label: "Fixation",
        text: "Document dartos pouch creation and testicular fixation technique.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [],
  },

  prostate_biopsy: {
    procedureKey: "prostate_biopsy",
    displayName: "Prostate Biopsy (TRUS/Transperineal)",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, line 20938.
    codes: [
      { code: "3927", label: "Cystoscopy with needle biopsy of prostate", fee: "142.61" },
    ],
    prompts: [
      {
        id: "mb-prosbx-cores",
        label: "Core documentation",
        text: "Document number of cores obtained and sites sampled. If MRI-fusion, document targeted sites.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [],
  },

  pyeloplasty: {
    procedureKey: "pyeloplasty",
    displayName: "Pyeloplasty",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, lines 20998/21000.
    // Distinct codes for open vs. laparoscopic.
    codes: [
      { code: "3831", label: "Pyeloplasty, open (plastic op on renal pelvis)", fee: "See manual line 20998" },
      { code: "3833", label: "Laparoscopic pyeloplasty ± ureteral stent/cystoscopy", fee: "See manual line 21000" },
    ],
    prompts: [
      {
        id: "mb-pyelo-laterality",
        label: "Laterality",
        text: "Document laterality (left/right).",
        severity: "required",
        color: "#DC2626",
      },
      {
        id: "mb-pyelo-technique",
        label: "Technique",
        text: "Document technique (Anderson-Hynes dismembered, Fenger, Y-V plasty). Note approach (open, laparoscopic, robotic). Document stent placement if applicable.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [],
  },

  urethroplasty: {
    procedureKey: "urethroplasty",
    displayName: "Urethroplasty",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, line 21209.
    // Manitoba lists urethroplasty as "By Report" — fee set per case by
    // the billing department after submission. Document technique,
    // stricture length, and graft/flap carefully to justify the claim.
    codes: [
      { code: "4011", label: "Urethroplasty, plastic operation on urethra", fee: "By Report" },
    ],
    prompts: [
      {
        id: "mb-urethro-technique",
        label: "Technique",
        text: "Document type of repair (excision and primary anastomosis, buccal mucosal graft, penile flap). State stricture length and location.",
        severity: "required",
        color: "#DC2626",
      },
    ],
    footerRules: [],
  },

  adrenalectomy: {
    procedureKey: "adrenalectomy",
    displayName: "Adrenalectomy",
    province: "MB",
    // FLAGGED: the urology/general-surgery audit did not surface a dedicated
    // adrenalectomy tariff in Manitoba. Most provinces bill it under the
    // endocrine section; until confirmed, marked By Report so the claim
    // goes through a manual billing review rather than shipping a wrong
    // code number. Confirm against the Manitoba manual before using.
    codes: [
      { code: "—", label: "Adrenalectomy (no distinct Manitoba tariff found — confirm with billing)", fee: "By Report" },
    ],
    prompts: [
      {
        id: "mb-adrenal-laterality",
        label: "Laterality",
        text: "Document laterality (left/right). State approach (laparoscopic transperitoneal, retroperitoneal, open).",
        severity: "required",
        color: "#DC2626",
      },
      {
        id: "mb-adrenal-indication",
        label: "Indication",
        text: "Document indication (pheochromocytoma, Conn's, Cushing's, incidentaloma, metastasis). Note tumor size.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [],
  },

  penile_prosthesis: {
    procedureKey: "penile_prosthesis",
    displayName: "Penile Prosthesis Implantation",
    province: "MB",
    // FLAGGED: Manitoba Physician's Manual April 2026 does not list an
    // explicit penile prosthesis tariff. Likely billed under plastic
    // operation on penis variants (4125-4138 range) or By Report — check
    // with your billing contact before submitting.
    codes: [
      { code: "—", label: "Penile prosthesis (no distinct Manitoba tariff found — confirm with billing)", fee: "By Report" },
    ],
    prompts: [
      {
        id: "mb-ipp-type",
        label: "Prosthesis type",
        text: "Document prosthesis type (inflatable 3-piece, malleable) and model. State cylinder sizing.",
        severity: "required",
        color: "#DC2626",
      },
    ],
    footerRules: [],
  },

  sacral_neuromodulation: {
    procedureKey: "sacral_neuromodulation",
    displayName: "Sacral Neuromodulation (InterStim)",
    province: "MB",
    // FLAGGED: Manitoba Physician's Manual April 2026 does not list a
    // dedicated InterStim/SNM tariff. Likely billed By Report — confirm
    // with billing. Both Stage 1 lead placement and Stage 2 IPG are
    // separately claimable.
    codes: [
      { code: "—", label: "Sacral neuromodulation (no distinct Manitoba tariff — Stage 1 & 2 by report)", fee: "By Report" },
    ],
    prompts: [
      {
        id: "mb-snm-stage",
        label: "Stage documentation",
        text: "Document if this is Stage 1 (lead placement/trial) or Stage 2 (IPG implantation). State lead placement site (S3 foramen).",
        severity: "required",
        color: "#DC2626",
      },
    ],
    footerRules: [
      "Stage 1 and Stage 2 are billed separately.",
    ],
  },

  mid_urethral_sling: {
    procedureKey: "mid_urethral_sling",
    displayName: "Mid-Urethral Sling (TVT/TOT)",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, line 21737.
    codes: [
      { code: "4485", label: "Urethral sling for incontinence (TVT or TOT) ± cystocele repair", fee: "587.09" },
    ],
    prompts: [
      {
        id: "mb-sling-type",
        label: "Sling type",
        text: "Document type of sling (retropubic/TVT vs. transobturator/TOT). State cystoscopy performed to confirm no perforation.",
        severity: "required",
        color: "#DC2626",
      },
    ],
    footerRules: [],
  },

  artificial_urinary_sphincter: {
    procedureKey: "artificial_urinary_sphincter",
    displayName: "Artificial Urinary Sphincter (AUS)",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, line 21112.
    codes: [
      { code: "3969", label: "Hydraulic urinary sphincter for incontinence, insertion, male or female", fee: "1003.92" },
    ],
    prompts: [
      {
        id: "mb-aus-components",
        label: "Component documentation",
        text: "Document cuff size and location, pump placement, and reservoir placement. State device model.",
        severity: "required",
        color: "#DC2626",
      },
    ],
    footerRules: [],
  },

  eswl: {
    procedureKey: "eswl",
    displayName: "Extracorporeal Shock Wave Lithotripsy (ESWL)",
    province: "MB",
    // FLAGGED: Manitoba Physician's Manual April 2026 text search did not
    // surface a dedicated ESWL/SWL tariff. Likely By Report or billed as
    // a facility service rather than physician tariff. Confirm with your
    // billing contact before submitting.
    codes: [
      { code: "—", label: "ESWL (no distinct Manitoba tariff found — confirm with billing)", fee: "By Report" },
    ],
    prompts: [
      {
        id: "mb-eswl-stone",
        label: "Stone details",
        text: "Document stone size, location, and number of shocks delivered. State imaging modality used for targeting (fluoroscopy/ultrasound).",
        severity: "recommended",
        color: "#F59E0B",
      },
      {
        id: "mb-eswl-laterality",
        label: "Laterality",
        text: "Document laterality (left/right).",
        severity: "required",
        color: "#DC2626",
      },
    ],
    footerRules: [],
  },

  bladder_biopsy: {
    procedureKey: "bladder_biopsy",
    displayName: "Bladder Biopsy (Cystoscopic)",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, line 20936.
    codes: [
      { code: "3933", label: "Cystoscopy with biopsy", fee: "130.98" },
    ],
    prompts: [
      {
        id: "mb-bxbladder-sites",
        label: "Biopsy documentation",
        text: "Document number and location of biopsies. Note whether cold cup or electrocautery biopsy.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [],
  },

  spc_placement: {
    procedureKey: "spc_placement",
    displayName: "Suprapubic Catheter Placement",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, line 21066.
    codes: [
      { code: "3902", label: "Bladder, suprapubic catheter insertion by trocar", fee: "124.33" },
    ],
    prompts: [
      {
        id: "mb-spc-technique",
        label: "Technique",
        text: "Document technique (percutaneous vs. open) and imaging guidance used. State catheter type and size.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [],
  },

  hypospadias_repair: {
    procedureKey: "hypospadias_repair",
    displayName: "Hypospadias Repair",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, lines 21393-21396.
    // Multiple codes depending on stage + location.
    codes: [
      { code: "4125", label: "One-stage repair — chordee release + urethra construction", fee: "805.26" },
      { code: "4126", label: "Release of chordee only", fee: "330.66" },
      { code: "4127", label: "Second stage procedure, penile", fee: "640.52" },
      { code: "4128", label: "Scrotal hypospadias repair", fee: "543.52" },
      { code: "4129", label: "Perineal hypospadias repair", fee: "604.50" },
      { code: "4130", label: "Urethrocutaneous fistula closure", fee: "472.45" },
    ],
    prompts: [
      {
        id: "mb-hypospadias-type",
        label: "Repair type",
        text: "Document type of hypospadias (distal, mid-shaft, proximal, penoscrotal) and repair technique (TIP/Snodgrass, Mathieu, two-stage).",
        severity: "required",
        color: "#DC2626",
      },
    ],
    footerRules: [],
  },

  // ── Additional General Surgery ──────────────────────────────────────────
  fundoplication: {
    procedureKey: "fundoplication",
    displayName: "Fundoplication (Nissen/Toupet)",
    province: "MB",
    // FLAGGED: no dedicated fundoplication tariff found in the April 2026
    // manual's text. Likely billed under an anti-reflux / paraesophageal
    // hernia code — confirm with billing contact.
    codes: [
      { code: "—", label: "Fundoplication (confirm Manitoba tariff with billing)", fee: "By Report" },
    ],
    prompts: [
      {
        id: "mb-fundo-type",
        label: "Wrap type",
        text: "Document type of fundoplication (Nissen 360 vs. Toupet 270 vs. Dor). State degree of hiatal repair and crural closure.",
        severity: "required",
        color: "#DC2626",
      },
    ],
    footerRules: [],
  },

  gastrectomy: {
    procedureKey: "gastrectomy",
    displayName: "Gastrectomy",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, line 20505.
    codes: [
      { code: "3115", label: "Gastrectomy, subtotal (less than 2/3)", fee: "1249.53" },
    ],
    prompts: [
      {
        id: "mb-gastrect-extent",
        label: "Resection extent",
        text: "Document extent (subtotal, total, sleeve) and reconstruction type (Billroth I/II, Roux-en-Y).",
        severity: "required",
        color: "#DC2626",
      },
    ],
    footerRules: [],
  },

  bariatric: {
    procedureKey: "bariatric",
    displayName: "Bariatric Surgery (Sleeve/Bypass)",
    province: "MB",
    // FLAGGED: no dedicated sleeve gastrectomy or gastric bypass tariff
    // surfaced in the audit text search. Bariatric procedures may be
    // covered under partial gastrectomy (3115) or By Report depending
    // on institution + approval. Confirm with billing.
    codes: [
      { code: "—", label: "Bariatric surgery (confirm Manitoba tariff + approval status)", fee: "By Report" },
    ],
    prompts: [
      {
        id: "mb-bariatric-bmi",
        label: "BMI documentation",
        text: "Document preoperative BMI, comorbidities, and multidisciplinary team assessment.",
        severity: "recommended",
        color: "#F59E0B",
      },
      {
        id: "mb-bariatric-technique",
        label: "Technical details",
        text: "Document bougie size (sleeve), limb lengths (bypass), staple line reinforcement, and leak test.",
        severity: "required",
        color: "#DC2626",
      },
    ],
    footerRules: [],
  },

  splenectomy: {
    procedureKey: "splenectomy",
    displayName: "Splenectomy",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, line 19691.
    // Manitoba lists splenectomy as an "add" — billable on top of a
    // related procedure (e.g. distal pancreatectomy). If splenectomy
    // is the independent primary procedure, check Manitoba's listing
    // under digestive/hematologic sections — may be By Report.
    codes: [
      { code: "3584", label: "Splenectomy (add-on)", fee: "852.64" },
    ],
    prompts: [
      {
        id: "mb-spleen-indication",
        label: "Indication",
        text: "Document indication (ITP, trauma, malignancy, etc.) and approach (open vs. laparoscopic). Note specimen weight.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [],
  },

  whipple: {
    procedureKey: "whipple",
    displayName: "Pancreaticoduodenectomy (Whipple)",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, line 20875.
    codes: [
      { code: "3551", label: "Pancreaticoduodenectomy", fee: "3423.60" },
      { code: "3552", label: "Total pancreatectomy ± splenectomy", fee: "2302.78" },
      { code: "3550", label: "Distal pancreatectomy ± splenectomy", fee: "1769.25" },
    ],
    prompts: [
      {
        id: "mb-whipple-margins",
        label: "Margin documentation",
        text: "Document margin status (uncinate, SMA margin, bile duct margin). State vascular involvement/resection if applicable.",
        severity: "required",
        color: "#DC2626",
      },
      {
        id: "mb-whipple-reconstruction",
        label: "Reconstruction",
        text: "Document pancreatic anastomosis type (pancreaticojejunostomy vs. pancreaticogastrostomy), hepaticojejunostomy, and gastrojejunostomy.",
        severity: "required",
        color: "#DC2626",
      },
    ],
    footerRules: [],
  },

  mastectomy: {
    procedureKey: "mastectomy",
    displayName: "Mastectomy",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, lines 16410-16418.
    // Full spectrum of breast procedures — lumpectomy through radical.
    codes: [
      { code: "0442", label: "Partial mastectomy (lumpectomy), malignancy", fee: "315.86" },
      { code: "0443", label: "Partial mastectomy + axillary node dissection", fee: "870.11" },
      { code: "0449", label: "Subcutaneous mastectomy, male or female", fee: "442.07" },
      { code: "0457", label: "Simple complete mastectomy", fee: "478.78" },
      { code: "0471", label: "Modified radical mastectomy (MRM)", fee: "919.36" },
      { code: "0470", label: "Radical mastectomy", fee: "943.26" },
    ],
    prompts: [
      {
        id: "mb-mast-laterality",
        label: "Laterality",
        text: "Document laterality (left/right). If bilateral, document each side separately.",
        severity: "required",
        color: "#DC2626",
      },
      {
        id: "mb-mast-sentinel",
        label: "Sentinel lymph node biopsy",
        text: "If SLNB performed, document technique (blue dye, radiocolloid), number of nodes, and frozen section result.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [
      "Sentinel lymph node biopsy may be billed separately.",
    ],
  },

  thyroidectomy: {
    procedureKey: "thyroidectomy",
    displayName: "Thyroidectomy",
    province: "MB",
    // Verified: Manitoba Physician's Manual April 2026, line 22107.
    // Manual only lists one thyroidectomy tariff for adenoma/cyst
    // excision — total vs. lobectomy distinction may need separate
    // confirmation against the full endocrine section.
    codes: [
      { code: "4911", label: "Thyroidectomy, adenoma or cyst excision", fee: "696.36" },
    ],
    prompts: [
      {
        id: "mb-thyroid-nerves",
        label: "Nerve identification",
        text: "Document identification and preservation of recurrent laryngeal nerve(s) and external branch of superior laryngeal nerve.",
        severity: "required",
        color: "#DC2626",
      },
      {
        id: "mb-thyroid-parathyroid",
        label: "Parathyroid preservation",
        text: "Document identification and preservation of parathyroid glands. Note if any autotransplanted.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [],
  },

  // ── Scaffold for future procedures ────────────────────────────────────────
  open_lysis_example_primary: {
    procedureKey: "open_lysis_example_primary",
    displayName:
      "Open abdominal procedure with possible adhesiolysis add-on",
    province: "MB",
    codes: [],
    prompts: [],
    footerRules: [
      "This primary procedure should have its own Manitoba tariff(s) mapped separately.",
      "Add tariff 3500/3501 only when documented criteria are met.",
    ],
  },
};

// ── Procedure name → billing key resolver ───────────────────────────────────

const PROCEDURE_NAME_PATTERNS: [RegExp, string][] = [
  // ── Urology ──
  [/\bturbt\b/i, "turbt"],
  [/\btransurethral.+bladder\b/i, "turbt"],
  [/\bbladder\s+tum(ou)?r\s+resect/i, "turbt"],
  [/\bturp\b/i, "turp"],
  [/\btransurethral.+prostate\b/i, "turp"],
  [/\bholep\b/i, "holep"],
  [/\bholmium.+enucleation/i, "holep"],
  [/\bpvp\b/i, "turp"],
  [/\bgreenlight/i, "turp"],
  [/\bcystoscop/i, "cystoscopy"],
  [/\bbladder\s+scope/i, "cystoscopy"],
  [/\bbladder\s+biops/i, "bladder_biopsy"],
  [/\bradical\s+prostatectom/i, "radical_prostatectomy"],
  [/\bralp\b/i, "radical_prostatectomy"],
  [/\brarp\b/i, "radical_prostatectomy"],
  [/\bnephroureterectom/i, "nephroureterectomy"],
  [/\bnux\b/i, "nephroureterectomy"],
  [/\bupper\s+tract\s+tcc/i, "nephroureterectomy"],
  [/\bnephrectom/i, "nephrectomy"],
  [/\bradical\s+cystectom/i, "radical_cystectomy"],
  [/\brarc\b/i, "radical_cystectomy"],
  [/\bileal\s+conduit/i, "radical_cystectomy"],
  [/\bneobladder/i, "radical_cystectomy"],
  [/\bpcnl\b/i, "pcnl"],
  [/\bpercutaneous\s+nephro/i, "pcnl"],
  [/\bureteroscop/i, "ureteroscopy"],
  [/\burs\b/i, "ureteroscopy"],
  [/\blaser\s+lithotrips/i, "ureteroscopy"],
  [/\beswl\b/i, "eswl"],
  [/\bshock\s+wave\s+lithotrips/i, "eswl"],
  [/\bstent\s+place/i, "stent_placement"],
  [/\bstent\s+insert/i, "stent_placement"],
  [/\bjj\s+stent/i, "stent_placement"],
  [/\bdouble\s+j\s+stent/i, "stent_placement"],
  [/\bureteral\s+stent\b(?!\s*remov)/i, "stent_placement"],
  [/\bstent\s+remov/i, "stent_removal"],
  [/\bcircumcis/i, "circumcision"],
  [/\borchiectom/i, "orchiectomy"],
  [/\btestis\s+removal/i, "orchiectomy"],
  [/\bhydrocelectom/i, "hydrocelectomy"],
  [/\bhydrocele\s+repair/i, "hydrocelectomy"],
  [/\bvasectom/i, "vasectomy"],
  [/\bvaricocelectom/i, "varicocelectomy"],
  [/\bvaricocele\s+repair/i, "varicocelectomy"],
  [/\borchiopexy/i, "orchiopexy"],
  [/\borchidopexy/i, "orchiopexy"],
  [/\bundescended\s+test/i, "orchiopexy"],
  [/\bprostate\s+biops/i, "prostate_biopsy"],
  [/\btrus\s+biops/i, "prostate_biopsy"],
  [/\bfusion\s+biops/i, "prostate_biopsy"],
  [/\btransperineal.*biops/i, "prostate_biopsy"],
  [/\bpyeloplast/i, "pyeloplasty"],
  [/\burethroplast/i, "urethroplasty"],
  [/\bstricture\s+repair/i, "urethroplasty"],
  [/\badrenalectom/i, "adrenalectomy"],
  [/\bpenile\s+prosthes/i, "penile_prosthesis"],
  [/\bipp\b/i, "penile_prosthesis"],
  [/\bsacral\s+neuromod/i, "sacral_neuromodulation"],
  [/\binterstim/i, "sacral_neuromodulation"],
  [/\bsnm\b/i, "sacral_neuromodulation"],
  [/\bmid.?urethral\s+sling/i, "mid_urethral_sling"],
  [/\btvt\b/i, "mid_urethral_sling"],
  [/\btot\b/i, "mid_urethral_sling"],
  [/\bartificial.+sphincter/i, "artificial_urinary_sphincter"],
  [/\baus\b/i, "artificial_urinary_sphincter"],
  [/\bams\s+800/i, "artificial_urinary_sphincter"],
  [/\bsuprapubic\s+catheter/i, "spc_placement"],
  [/\bspc\b/i, "spc_placement"],
  [/\bhypospadias/i, "hypospadias_repair"],
  // ── General Surgery ──
  [/\bcholecystectom/i, "cholecystectomy"],
  [/\bappendectom/i, "appendectomy"],
  [/\bhernia\s+repair/i, "hernia_repair"],
  [/\binguinal\s+hernia/i, "hernia_repair"],
  [/\bumbilical\s+hernia/i, "hernia_repair"],
  [/\bventral\s+hernia/i, "hernia_repair"],
  [/\btep\b/i, "hernia_repair"],
  [/\btapp\b/i, "hernia_repair"],
  [/\blichtenstein/i, "hernia_repair"],
  [/\bcolectom/i, "colectomy"],
  [/\bhemicolectom/i, "colectomy"],
  [/\bfundoplicat/i, "fundoplication"],
  [/\bnissen/i, "fundoplication"],
  [/\btoupet/i, "fundoplication"],
  [/\bgastrectom/i, "gastrectomy"],
  [/\bsleeve\s+gastrectom/i, "bariatric"],
  [/\broux.en.y/i, "bariatric"],
  [/\bgastric\s+bypass/i, "bariatric"],
  [/\bbariatric/i, "bariatric"],
  [/\bsplenectom/i, "splenectomy"],
  [/\bwhipple/i, "whipple"],
  [/\bpancreaticoduodenectom/i, "whipple"],
  [/\bmastectom/i, "mastectomy"],
  [/\bthyroidectom/i, "thyroidectomy"],
  [/\bthyroid\s+lobectom/i, "thyroidectomy"],
  // ── Add-ons ──
  [/\badhesiolysis\b/i, "adhesiolysis_add_on"],
  [/\blysis\s+of\s+adhesion/i, "adhesiolysis_add_on"],
];

/**
 * Resolve a free-text procedure name to zero or more billing profile keys.
 * Returns the primary procedure key plus any detected add-ons.
 */
export function resolveBillingKeys(procedureName: string): string[] {
  if (!procedureName) return [];
  const keys: string[] = [];
  for (const [pattern, key] of PROCEDURE_NAME_PATTERNS) {
    if (pattern.test(procedureName) && !keys.includes(key)) {
      keys.push(key);
    }
  }
  return keys;
}

// ── Billing overlay builder ─────────────────────────────────────────────────

/**
 * Evaluate all applicable billing rules for a set of procedures and context.
 * Returns the prompts, codes, warnings, and footer text for the dictation UI.
 */
export function getBillingOverlay(
  procedureKeys: string[],
  ctx: DictationContext,
): RenderedBillingOverlay {
  const visiblePrompts: BillingPrompt[] = [];
  const billableCodes: ProcedureBillingCode[] = [];
  const warnings: string[] = [];

  // 1. Evaluate global Manitoba surgical rules
  for (const globalPrompt of MB_GLOBAL_SURGICAL_RULES) {
    if (!globalPrompt.condition || globalPrompt.condition(ctx)) {
      visiblePrompts.push(globalPrompt);
    }
  }

  // 2. Evaluate per-procedure rules and codes
  for (const key of procedureKeys) {
    const profile = MB_PROCEDURE_LIBRARY[key];
    if (!profile) continue;

    for (const prompt of profile.prompts) {
      if (!prompt.condition || prompt.condition(ctx)) {
        visiblePrompts.push(prompt);
      }
    }

    for (const code of profile.codes) {
      // ── Adhesiolysis-specific gating ──
      if (code.code === "3500") {
        if (
          ctx.performedLysisOfAdhesions &&
          (ctx.lysisMinutes ?? 0) >= 30
        ) {
          billableCodes.push(code);
        }
        continue;
      }

      if (code.code === "3501") {
        if (
          ctx.performedLysisOfAdhesions &&
          (ctx.lysisMinutes ?? 0) > 30
        ) {
          billableCodes.push(code);
        }
        continue;
      }

      // ── Default: include all non-gated codes for the procedure ──
      billableCodes.push(code);
    }
  }

  // 3. Emit warnings for missing adhesiolysis documentation
  if (ctx.performedLysisOfAdhesions) {
    if (!ctx.totalCaseMinutes) {
      warnings.push(
        "Missing total surgical case time for adhesiolysis billing support.",
      );
    }
    if (!ctx.lysisMinutes) {
      warnings.push(
        "Missing total time spent performing lysis of adhesions.",
      );
    }
  }

  const footerText = buildBillingFooter(billableCodes, warnings);
  return { visiblePrompts, footerText, billableCodes, warnings };
}

// ── Footer builder ──────────────────────────────────────────────────────────

function buildBillingFooter(
  codes: ProcedureBillingCode[],
  warnings: string[],
): string {
  const codeLines = codes.length
    ? codes
        .map(
          (c) =>
            `- ${c.code}: ${c.label}${c.fee ? ` ($${c.fee})` : ""}`,
        )
        .join("\n")
    : "- No Manitoba tariff codes auto-attached yet.";

  const warningLines = warnings.length
    ? "\n\nBilling review warnings:\n" +
      warnings.map((w) => `- ${w}`).join("\n")
    : "";

  return `Manitoba Billing Codes\n${codeLines}${warningLines}`;
}

/**
 * Build the billing footer text that gets appended to the operative report.
 * Only includes codes that passed gating. Designed for copy/paste into
 * the hospital dictation system.
 */
export function buildDictationBillingSection(
  procedureKeys: string[],
  ctx: DictationContext,
): string {
  const overlay = getBillingOverlay(procedureKeys, ctx);

  if (overlay.billableCodes.length === 0 && overlay.warnings.length === 0) {
    return "";
  }

  const lines: string[] = [];
  lines.push("");
  lines.push("--- MANITOBA BILLING CODES ---");

  for (const code of overlay.billableCodes) {
    lines.push(`Tariff ${code.code}: ${code.label}${code.fee ? ` ($${code.fee})` : ""}`);
    if (code.notes) {
      for (const note of code.notes) {
        lines.push(`  Note: ${note}`);
      }
    }
  }

  if (overlay.warnings.length > 0) {
    lines.push("");
    lines.push("BILLING REVIEW WARNINGS:");
    for (const w of overlay.warnings) {
      lines.push(`* ${w}`);
    }
  }

  return lines.join("\n");
}
