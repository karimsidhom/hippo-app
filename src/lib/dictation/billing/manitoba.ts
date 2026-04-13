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
    codes: [
      {
        code: "5797",
        label: "Resection of bladder tumour, transurethral",
        fee: "403.30",
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
    codes: [
      {
        code: "5770",
        label: "Cystoscopy, diagnostic",
        fee: "101.55",
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
    codes: [
      {
        code: "5764",
        label: "Radical prostatectomy",
        fee: "1150.95",
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
    codes: [
      {
        code: "5730",
        label: "Nephrectomy, radical",
        fee: "866.25",
      },
      {
        code: "5731",
        label: "Nephrectomy, partial",
        fee: "1039.50",
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
    codes: [
      {
        code: "5785",
        label: "Ureteroscopy",
        fee: "262.40",
      },
      {
        code: "5786",
        label: "Ureteroscopy with lithotripsy/extraction",
        fee: "392.10",
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
    codes: [
      {
        code: "5800",
        label: "Circumcision, adult",
        fee: "195.80",
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
    codes: [
      {
        code: "4353",
        label: "Cholecystectomy, laparoscopic",
        fee: "510.20",
      },
      {
        code: "4350",
        label: "Cholecystectomy, open",
        fee: "510.20",
      },
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
    codes: [
      {
        code: "4312",
        label: "Appendectomy, laparoscopic",
        fee: "347.75",
      },
      {
        code: "4310",
        label: "Appendectomy, open",
        fee: "347.75",
      },
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
    codes: [
      {
        code: "4220",
        label: "Inguinal hernia repair, unilateral",
        fee: "347.50",
      },
      {
        code: "4224",
        label: "Inguinal hernia repair, laparoscopic, unilateral",
        fee: "451.75",
      },
      {
        code: "4240",
        label: "Umbilical/ventral hernia repair",
        fee: "347.50",
      },
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
    codes: [
      {
        code: "4320",
        label: "Colectomy, partial (hemicolectomy)",
        fee: "749.25",
      },
      {
        code: "4325",
        label: "Colectomy, total",
        fee: "1039.50",
      },
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
    codes: [
      { code: "5761", label: "Transurethral resection of prostate", fee: "497.60" },
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
    codes: [
      { code: "5761", label: "Transurethral prostate surgery (laser)", fee: "497.60" },
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
    codes: [
      { code: "5730", label: "Nephrectomy, radical", fee: "866.25" },
      { code: "5734", label: "Ureterectomy (with bladder cuff)", fee: "433.10" },
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
    codes: [
      { code: "5775", label: "Radical cystectomy", fee: "1385.60" },
      { code: "5776", label: "Urinary diversion (ileal conduit/neobladder)", fee: "692.80" },
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
    codes: [
      { code: "5740", label: "Percutaneous nephrolithotomy", fee: "693.50" },
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
    codes: [
      { code: "5788", label: "Ureteral stent insertion", fee: "131.20" },
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
    codes: [
      { code: "5789", label: "Ureteral stent removal", fee: "65.60" },
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
    codes: [
      { code: "5820", label: "Orchiectomy, radical (inguinal)", fee: "347.50" },
      { code: "5821", label: "Orchiectomy, simple (scrotal)", fee: "195.80" },
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
    codes: [
      { code: "5822", label: "Hydrocelectomy", fee: "195.80" },
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
    codes: [
      { code: "5840", label: "Vasectomy, bilateral", fee: "173.25" },
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
    codes: [
      { code: "5832", label: "Varicocelectomy", fee: "347.50" },
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
    codes: [
      { code: "5824", label: "Orchiopexy, inguinal", fee: "347.50" },
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
    codes: [
      { code: "5766", label: "Prostate biopsy, transrectal ultrasound-guided", fee: "130.90" },
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
    codes: [
      { code: "5735", label: "Pyeloplasty", fee: "693.50" },
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
    codes: [
      { code: "5808", label: "Urethroplasty", fee: "520.50" },
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
    codes: [
      { code: "5710", label: "Adrenalectomy", fee: "693.50" },
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
    codes: [
      { code: "5850", label: "Penile prosthesis implantation", fee: "520.50" },
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
    codes: [
      { code: "5860", label: "Sacral nerve stimulator implantation", fee: "433.10" },
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
    codes: [
      { code: "5810", label: "Female urethral sling procedure", fee: "347.50" },
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
    codes: [
      { code: "5812", label: "Artificial urinary sphincter implantation", fee: "520.50" },
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
    codes: [
      { code: "5790", label: "Extracorporeal shock wave lithotripsy", fee: "347.50" },
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
    codes: [
      { code: "5771", label: "Cystoscopy with biopsy", fee: "151.65" },
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
    codes: [
      { code: "5778", label: "Suprapubic cystostomy", fee: "173.25" },
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
    codes: [
      { code: "5802", label: "Hypospadias repair, single-stage", fee: "520.50" },
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
    codes: [
      { code: "4380", label: "Fundoplication, laparoscopic", fee: "623.25" },
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
    codes: [
      { code: "4330", label: "Gastrectomy, partial", fee: "749.25" },
      { code: "4335", label: "Gastrectomy, total", fee: "1039.50" },
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
    codes: [
      { code: "4336", label: "Sleeve gastrectomy, laparoscopic", fee: "623.25" },
      { code: "4337", label: "Roux-en-Y gastric bypass, laparoscopic", fee: "866.25" },
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
    codes: [
      { code: "4370", label: "Splenectomy", fee: "623.25" },
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
    codes: [
      { code: "4390", label: "Pancreaticoduodenectomy", fee: "1732.50" },
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
    codes: [
      { code: "4100", label: "Mastectomy, simple/total", fee: "520.50" },
      { code: "4101", label: "Mastectomy, modified radical", fee: "623.25" },
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
    codes: [
      { code: "4050", label: "Thyroidectomy, total", fee: "623.25" },
      { code: "4051", label: "Thyroid lobectomy", fee: "433.10" },
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
