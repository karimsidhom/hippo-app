// ---------------------------------------------------------------------------
// British Columbia billing library — MSC Payment Schedule
// ---------------------------------------------------------------------------
// Source: MSC Payment Schedule, January 31, 2026 edition, Section 37 (Urology)
// and General Preamble D. 5. 3 (Multiple Surgical Procedures), transcribed
// 2026-09-04 from the schedule PDF published at
// https://www2.gov.bc.ca/gov/content/health/practitioner-professional-resources/msp/physicians/payment-schedules
//
// Fee amounts and item notes are verbatim from the schedule. Like every
// region library, this is physician-verification material only: consumers
// must show getRegionDisclaimer("BC") and nothing here replaces checking the
// current schedule before a claim is submitted.
//
// BC-specific conventions worth knowing (from the schedule itself):
//   - "operation only" items (S-prefixed listings) exclude the visit fee.
//   - Restricted-to-Urologists notes are reproduced in the code notes.
//   - The urology section preamble: where conversion to open is necessary,
//     bill the appropriate open fee plus 50% of 04001. Reproduced as notes on
//     the laparoscopic items rather than a global prompt.
// ---------------------------------------------------------------------------

import type { ProcedureBillingProfile, BillingPrompt } from "./types";

const BC = "BC";

// ── Global surgical rules (General Preamble D. 5. 3, D. 5. 4) ──────────────

export const BC_GLOBAL_SURGICAL_RULES: BillingPrompt[] = [
  {
    id: "bc-multi-same-area",
    label: "Multiple procedures, same area (D. 5. 3 i)",
    text:
      "Two or more procedures under the same anesthetic in the same general area (same incision, an extension of it, or separate incisions): claim the procedure with the greater listed fee in full; additional procedures are reduced to 50%, unless the Schedule indicates otherwise. Incidental en passant surgery is included in the planned procedure fee and may not be charged.",
    severity: "conditional",
    color: "#f59e0b",
    condition: (ctx) => !!ctx.sameIncisionMultipleProcedures,
  },
  {
    id: "bc-multi-separate-incisions",
    label: "Multiple procedures, separate fields (D. 5. 3 ii)",
    text:
      "Different procedures through separate incisions under the same anesthetic, where repositioning or redraping (or more than one separately draped field) is medically required: greater fee in full, additional procedures at 75%. Document why repositioning or a separate field was required.",
    severity: "conditional",
    color: "#f59e0b",
    condition: (ctx) => !!ctx.separateIncisionMultipleProcedures,
  },
  {
    id: "bc-extra-items",
    label: "Items designated \"extra\"",
    text:
      "Schedule items designated \"extra\" are paid at 100% for the first \"extra\" and 50% for additional \"extra\" procedures, even when performed with other surgery.",
    severity: "conditional",
    color: "#64748b",
    condition: (ctx) =>
      !!ctx.sameIncisionMultipleProcedures || !!ctx.separateIncisionMultipleProcedures,
  },
  {
    id: "bc-surgical-assist",
    label: "Surgical assistance",
    text:
      "Assistant fees are claimed under 00195, 00196, 00197, 00198 and 13197. Urology extras: 81194 First Surgical Assist of the Day, Urology ($78.20, restricted to urology surgeons, maximum one per day, payable in addition to 00195/00196/00197/13197) and P81195 certified urologic surgeon assist extra ($17.94 per 15 min after the first hour, only with 70020, maximum 8 units). Start and end times must be entered in both the claim and the patient's chart.",
    severity: "recommended",
    color: "#3b82f6",
    condition: (ctx) => !!ctx.assistantUsed,
  },
  {
    id: "bc-bilateral",
    label: "Bilateral procedure",
    text:
      "BC pays bilateral procedures per item-specific notes (e.g., S08185 at 150% when both kidneys/ureters are involved; many scrotal items are listed as unilateral). Document laterality explicitly and check the item's own bilateral wording.",
    severity: "conditional",
    color: "#64748b",
    condition: (ctx) => ctx.laterality === "bilateral",
  },
];

// ── Per-procedure profiles (Section 37, Urology) ────────────────────────────

export const BC_PROCEDURE_LIBRARY: Record<string, ProcedureBillingProfile> = {
  // ── Endourology / stones ──
  turbt: {
    procedureKey: "turbt",
    displayName: "Transurethral resection of bladder tumour",
    province: BC,
    codes: [
      {
        code: "S08250",
        label: "Transurethral resection of bladder or urethral tumour and adjacent muscle and electrocoagulation, as necessary",
        fee: "355.54",
      },
    ],
    prompts: [],
  },
  cystoscopy: {
    procedureKey: "cystoscopy",
    displayName: "Cystoscopy",
    province: BC,
    codes: [
      {
        code: "00704",
        label: "Cystoscopy / panendoscopy (fee per current Schedule common listings)",
        notes: ["Fee not transcribed here; see the Schedule's common listings for 00704/00705."],
      },
    ],
    prompts: [],
  },
  bladder_biopsy: {
    procedureKey: "bladder_biopsy",
    displayName: "Bladder fulguration / biopsy with cystoscopy",
    province: BC,
    codes: [
      { code: "S08200", label: "Bladder fulguration with cystoscopy", fee: "237.46" },
    ],
    prompts: [],
  },
  ureteroscopy: {
    procedureKey: "ureteroscopy",
    displayName: "Ureteroscopy and stone extraction",
    province: BC,
    codes: [
      {
        code: "S08146",
        label: "Ureteroscopy and basket manipulation of ureteral calculus with or without lithopaxy (operation only)",
        fee: "562.38",
      },
    ],
    prompts: [],
  },
  stent_placement: {
    procedureKey: "stent_placement",
    displayName: "Ureteral stent insertion",
    province: BC,
    codes: [
      {
        code: "S08155",
        label: "Insertion of internal ureteral stent to include C & P and ureteroscopy (operation only)",
        fee: "153.20",
        notes: ["Additional stents to be paid at 50%."],
      },
    ],
    prompts: [],
  },
  stent_removal: {
    procedureKey: "stent_removal",
    displayName: "Ureteral stent removal",
    province: BC,
    codes: [
      {
        code: "00704",
        label: "Removal of ureteric stents is paid under 00704 (cystoscopy)",
        notes: ["Per the note on S08257: removal of ureteric stents is paid under 00704."],
      },
    ],
    prompts: [],
  },
  eswl: {
    procedureKey: "eswl",
    displayName: "Extracorporeal shock wave lithotripsy",
    province: BC,
    codes: [
      {
        code: "S08123",
        label: "Extra-corporeal shock wave lithotripsy (ESWL), operation only",
        fee: "227.58",
      },
    ],
    prompts: [],
  },
  pcnl: {
    procedureKey: "pcnl",
    displayName: "Percutaneous nephrolithotomy",
    province: BC,
    codes: [
      {
        code: "08168",
        label: "Nephroscopy and stone removal, to include lithopaxy (operation only)",
        fee: "632.93",
        notes: ["00800 not payable in addition to 08168."],
      },
    ],
    prompts: [
      {
        id: "bc-pcnl-access",
        label: "Percutaneous access",
        text: "Antegrade percutaneous access is claimed under 00978/00979 where applicable (see S08185 note v for the upper-tract TCC context).",
        severity: "conditional",
        color: "#64748b",
      },
    ],
  },

  // ── Kidney ──
  nephrectomy: {
    procedureKey: "nephrectomy",
    displayName: "Nephrectomy",
    province: BC,
    codes: [
      { code: "08104", label: "Partial nephrectomy", fee: "1,381.48" },
      { code: "08105", label: "Nephrectomy", fee: "1,277.21" },
      { code: "08109", label: "Nephrectomy, radical, with gland dissection", fee: "1,303.26" },
      {
        code: "C81104",
        label: "Laparoscopic partial nephrectomy for suspected renal malignancy, with or without ipsilateral adrenalectomy, includes excision of perinephric fat",
        fee: "1,994.18",
        notes: ["Restricted to Urologists."],
      },
      {
        code: "C81105",
        label: "Laparoscopic radical nephrectomy for suspected renal malignancy, with or without ipsilateral adrenalectomy, includes excision of perinephric fat",
        fee: "1,564.07",
        notes: [
          "Restricted to Urologists.",
          "Not paid with open nephrectomy fee items (08105, 08106, 08108, 08109).",
        ],
      },
      {
        code: "TC81115",
        label: "Complex radical nephrectomy for renal tumours stage IIB or higher, with or without ipsilateral adrenalectomy, includes excision of perinephric fat and thrombectomy if required",
        fee: "2,150.00",
        notes: [
          "Restricted to Urologists.",
          "Not paid with 08105, 08106, 08108, 08109, 08110, 81104 and 81105.",
        ],
      },
    ],
    prompts: [
      {
        id: "bc-lap-conversion",
        label: "Conversion to open",
        text: "Urology section preamble: where conversion to open is necessary, bill the appropriate open fee plus 50% of 04001.",
        severity: "conditional",
        color: "#64748b",
      },
    ],
  },
  nephroureterectomy: {
    procedureKey: "nephroureterectomy",
    displayName: "Nephroureterectomy",
    province: BC,
    codes: [
      { code: "08110", label: "Nephro-ureterectomy to include bladder cuff", fee: "1,538.01" },
      {
        code: "C81110",
        label: "Laparoscopic nephroureterectomy (including excision of bladder cuff)",
        fee: "1,922.48",
        notes: ["Not paid with 08105, 08106, 08109, 08110, C81104, C81105."],
      },
    ],
    prompts: [],
  },
  pyeloplasty: {
    procedureKey: "pyeloplasty",
    displayName: "Pyeloplasty",
    province: BC,
    codes: [
      {
        code: "08114",
        label: "Pyeloplasty, including management of aberrant vessels and nephropexy",
        fee: "1,024.11",
      },
      {
        code: "C81114",
        label: "Laparoscopic pyeloplasty, with or without insertion of ureteral stent, includes management of aberrant vessels and nephropexy, cystoscopy or retrograde pyelogram",
        fee: "1,382.63",
        notes: [
          "Includes nephrolithotomy (08117) if done at same time.",
          "Fee item 08155 paid at 75% when retrograde approach is required.",
          "Not paid with open pyeloplasty (08114).",
          "Repeat pyeloplasty within three months is included in the original fee.",
        ],
      },
    ],
    prompts: [],
  },

  // ── Bladder / diversion ──
  radical_cystectomy: {
    procedureKey: "radical_cystectomy",
    displayName: "Radical cystectomy and urinary diversion",
    province: BC,
    codes: [
      {
        code: "08173",
        label: "Radical cystectomy with pelvic lymphadenectomy (isolated procedure)",
        fee: "1,981.91",
      },
      {
        code: "08178",
        label: "Radical cystectomy and ileal loop urinary diversion (to include preparation of intestinal segment and ureteral transplantation, same surgeon)",
        fee: "2,916.73",
      },
      {
        code: "08183",
        label: "Radical cystectomy and continent urinary diversion (includes preparation of intestinal segment and ureteral transplantation, same surgeon)",
        fee: "3,221.27",
      },
      {
        code: "08182",
        label: "Continent urinary diversion",
        fee: "1,239.36",
        notes: [
          "When a second urologist with expertise in continent diversion performs the continent urinary diversion, both surgeons shall be paid in full.",
        ],
      },
    ],
    prompts: [],
  },
  intravesical_botox: {
    procedureKey: "intravesical_botox",
    displayName: "Intravesical botulinum toxin injection",
    province: BC,
    codes: [
      {
        code: "S08205",
        label: "Intravesical botulinum toxin injection(s)",
        fee: "291.45",
        notes: [
          "Restricted to Urologists and approved Urogynecologists.",
          "To a maximum of 3 services per patient per year.",
          "Includes fee items 00704, 00705, 08232 and 08200.",
        ],
      },
    ],
    prompts: [],
  },
  clot_evacuation: {
    procedureKey: "clot_evacuation",
    displayName: "Manual bladder irrigation and clot evacuation",
    province: BC,
    codes: [
      {
        code: "T08356",
        label: "Manual bladder irrigation and clot evacuation (operation only)",
        fee: "275.00",
        notes: [
          "Restricted to Urologists.",
          "To be utilized when 3-way irrigation catheters have failed to clear clot or otherwise contraindicated.",
          "Maximum of 2 per patient per day.",
        ],
      },
    ],
    prompts: [],
  },
  spc_placement: {
    procedureKey: "spc_placement",
    displayName: "Suprapubic cystostomy",
    province: BC,
    codes: [
      { code: "08201", label: "Cystostomy, isolated procedure", fee: "225.22" },
      {
        code: "S08202",
        label: "Cystostomy by trochar, isolated procedure (operation only)",
        fee: "207.28",
      },
    ],
    prompts: [],
  },
  vvf_repair: {
    procedureKey: "vvf_repair",
    displayName: "Vesicovaginal fistula repair",
    province: BC,
    codes: [
      {
        code: "08255",
        label: "Closure of fistula: suprapubic, vesico-vaginal, vesico-rectal, or vesico-sigmoid",
        fee: "729.89",
      },
    ],
    prompts: [],
  },

  // ── Prostate ──
  turp: {
    procedureKey: "turp",
    displayName: "Transurethral resection of prostate (and PVP)",
    province: BC,
    codes: [
      {
        code: "08311",
        label: "Prostatectomy: perineal, suprapubic, retropubic and transurethral approaches",
        fee: "511.00",
        notes: [
          "Only one prostatectomy fee item is payable per date of service.",
          "Includes meatoplasty, dorsal slit, urethral dilation, panendoscopy, retrograde pyelography, vasectomy or bladder neck surgery done under the same anesthetic.",
          "No charge for repeat prostatectomies within three months by the same operator, except where radical prostatectomy is subsequently required for cancer.",
        ],
      },
      {
        code: "T81313",
        label: "GreenLight laser photo vaporization of the prostate (PVP)",
        fee: "625.00",
        notes: ["Restricted to Urologists.", "Not paid with 08311 or cystoscopy (00704 or 00705)."],
      },
    ],
    prompts: [],
  },
  holep: {
    procedureKey: "holep",
    displayName: "Holmium laser enucleation of prostate",
    province: BC,
    codes: [
      {
        code: "S81311",
        label: "Holmium laser enucleation of prostate (HoLEP)",
        fee: "970.14",
        notes: [
          "For bladder outlet obstruction secondary to benign prostatic hypertrophy; for prostates larger than 60 grams.",
          "Holmium laser only (not intended for KTP, a.k.a. GreenLight).",
          "Under the same anesthetic, includes meatotomy (S08262), dorsal slit (S08301), urethral dilation (08264, 08265), cystoscopy and panendoscopy (00704), retrograde pyelogram (08593), vasectomy (08345), and TURBT (08250).",
          "Fee item 08254 paid at 50% when done with HoLEP.",
        ],
      },
    ],
    prompts: [
      {
        id: "bc-holep-size",
        label: "Prostate size",
        text: "S81311 requires a prostate larger than 60 grams; document the gland size estimate.",
        severity: "recommended",
        color: "#3b82f6",
      },
    ],
  },
  simple_prostatectomy: {
    procedureKey: "simple_prostatectomy",
    displayName: "Open simple prostatectomy",
    province: BC,
    codes: [
      {
        code: "TC81312",
        label: "Open simple retropubic prostatectomy (operation only)",
        fee: "1000.00",
        notes: [
          "Restricted to Urologists.",
          "Not billable with 08311 or 81311.",
          "Visits billable in addition for post operative care under 08008.",
        ],
      },
    ],
    prompts: [],
  },
  radical_prostatectomy: {
    procedureKey: "radical_prostatectomy",
    displayName: "Radical prostatectomy",
    province: BC,
    codes: [
      {
        code: "08318",
        label: "Prostatectomy, radical, to include lymphadenectomy",
        fee: "1,442.14",
      },
      {
        code: "C81305",
        label: "Laparoscopic radical prostatectomy",
        fee: "2,127.12",
        notes: [
          "Restricted to Urologists.",
          "Not paid for repeat prostatectomies within three months by the same operator, except where radical prostatectomy is subsequently required for cancer.",
        ],
      },
      {
        code: "C81310",
        label: "Laparoscopic radical prostatectomy with pelvic lymph node dissection (PLND)",
        fee: "2,450.37",
        notes: ["Restricted to Urologists."],
      },
    ],
    prompts: [
      {
        id: "bc-ralp-robotic",
        label: "Robotic approach",
        text: "Robot-assisted radical prostatectomy is claimed under the laparoscopic items (C81305 / C81310); the Schedule has no separate robotic listing.",
        severity: "conditional",
        color: "#64748b",
      },
    ],
  },

  // ── Urethra / male incontinence ──
  urethroplasty: {
    procedureKey: "urethroplasty",
    displayName: "Urethroplasty",
    province: BC,
    codes: [
      {
        code: "08266",
        label: "Stricture of urethra: first-stage plastic repair (excluding urethrostomy)",
        fee: "1,094.84",
      },
      {
        code: "08259",
        label: "Stricture of urethra: first-stage plastic repair requiring pedicle graft",
        fee: "1,042.71",
      },
      {
        code: "81159",
        label: "Buccal mucosa graft harvest, extra",
        fee: "234.61",
        notes: ["Restricted to Urologists.", "Paid only with fee item 08259."],
      },
      {
        code: "08267",
        label: "Stricture of urethra: second-stage plastic repair (excluding urethrostomy)",
        fee: "1,042.71",
      },
    ],
    prompts: [],
  },
  urethral_dilation: {
    procedureKey: "urethral_dilation",
    displayName: "Urethral dilation / urethrotomy",
    province: BC,
    codes: [
      { code: "S08260", label: "Urethrotomy, external or internal (DVIU)", fee: "255.22" },
      { code: "S08264", label: "Stricture of urethra: office dilation (operation only)", fee: "20.22" },
      {
        code: "S08265",
        label: "Stricture of urethra: dilation in hospital, isolated procedure, with or without anesthesiology (operation only)",
        fee: "50.50",
      },
    ],
    prompts: [],
  },
  meatotomy: {
    procedureKey: "meatotomy",
    displayName: "Meatotomy",
    province: BC,
    codes: [
      { code: "S08262", label: "Meatotomy and plastic repair (operation only)", fee: "235.67" },
    ],
    prompts: [],
  },
  male_sling: {
    procedureKey: "male_sling",
    displayName: "Male suburethral sling",
    province: BC,
    codes: [
      {
        code: "C81153",
        label: "Male suburethral sling, including cystoscopy",
        fee: "729.89",
        notes: [
          "Daily maximum is one per patient.",
          "Repeats within 30 days are paid at 50%; a note record is required.",
        ],
      },
      {
        code: "81154",
        label: "Transection or removal of sub-urethral mesh sling",
        fee: "573.15",
        notes: [
          "Restricted to Urology specialists.",
          "Fee items 00704, 00705 or 08232 not paid in addition.",
        ],
      },
    ],
    prompts: [],
  },
  artificial_urinary_sphincter: {
    procedureKey: "artificial_urinary_sphincter",
    displayName: "Artificial urinary sphincter",
    province: BC,
    codes: [
      {
        code: "08317",
        label: "Anti-incontinence procedure (artificial urinary sphincter)",
        fee: "788.73",
      },
    ],
    prompts: [],
  },
  mid_urethral_sling: {
    procedureKey: "mid_urethral_sling",
    displayName: "Mid-urethral sling (TVT / TOT)",
    province: BC,
    codes: [
      {
        code: "08283",
        label: "Retropubic or transvaginal tape (TVT) or transobturator tape (TOT) operation for urinary incontinence",
        fee: "339.54",
      },
    ],
    prompts: [],
  },
  complex_catheterization: {
    procedureKey: "complex_catheterization",
    displayName: "Complex male catheterization",
    province: BC,
    codes: [
      {
        code: "S08271",
        label: "Catheterization, complex, male patient (operation only)",
        fee: "208.54",
        notes: [
          "Restricted to Urologists and General Surgeons.",
          "Procedure must involve the use of filiforms and followers, or introducers (skylet or catheter guide).",
          "Not paid in addition to critical care fees or diagnostic urological procedures.",
        ],
      },
    ],
    prompts: [],
  },

  // ── Penis / andrology ──
  penile_prosthesis: {
    procedureKey: "penile_prosthesis",
    displayName: "Penile prosthesis",
    province: BC,
    codes: [
      {
        code: "08296",
        label: "Insertion of semi rigid or self-contained inflatable prosthesis",
        fee: "625.62",
      },
      {
        code: "08363",
        label: "Revision of penile prosthesis (includes removal, correction of any mechanical failure, and replacement)",
        fee: "882.15",
      },
    ],
    prompts: [],
  },
  penile_plication: {
    procedureKey: "penile_plication",
    displayName: "Penile plication (Nesbit)",
    province: BC,
    codes: [
      {
        code: "08365",
        label: "Penile plication for correction of penile curvature for Peyronie's disease",
        fee: "814.63",
        notes: [
          "Restricted to Urologists.",
          "Circumcision if required is payable in addition at 50%.",
        ],
      },
    ],
    prompts: [],
  },
  peyronie_graft: {
    procedureKey: "peyronie_graft",
    displayName: "Peyronie's plaque incision/excision and grafting",
    province: BC,
    codes: [
      {
        code: "08307",
        label: "Excision of Peyronies' plaque, with replacement graft (tissue or synthetic)",
        fee: "814.63",
      },
    ],
    prompts: [],
  },
  penile_venous_ligation: {
    procedureKey: "penile_venous_ligation",
    displayName: "Penile venous ligation",
    province: BC,
    codes: [
      {
        code: "08297",
        label: "Deep dissection of intercrural region, with ligation of deep dorsal and cavernosal veins with or without ligation of crural veins (venous ligation for impotence)",
        fee: "413.73",
      },
    ],
    prompts: [
      {
        id: "bc-08297-doppler",
        label: "Prerequisite imaging",
        text: "08297 must be preceded by colour flow Doppler or duplex sonogram; document it.",
        severity: "required",
        color: "#ef4444",
        requiredForCodes: ["08297"],
      },
    ],
  },
  priapism: {
    procedureKey: "priapism",
    displayName: "Priapism management / shunting",
    province: BC,
    codes: [
      {
        code: "08366",
        label: "Emergency management of priapism, includes aspiration and irrigation of the corporal bodies and injections into the corporal body (includes distal shunt if necessary)",
        fee: "508.24",
        notes: [
          "Restricted to Urologists.",
          "Cystoscopy to rule out urethral injury may be paid in addition at 100%.",
          "May be paid at 100% if the entire procedure is repeated on the same day.",
        ],
      },
      { code: "08300", label: "Priapism: saphena-cavernous shunt", fee: "582.03" },
    ],
    prompts: [],
  },
  penile_fracture: {
    procedureKey: "penile_fracture",
    displayName: "Penile fracture repair",
    province: BC,
    codes: [
      {
        code: "08364",
        label: "Repair of penile fracture or traumatic laceration of cavernous tissue",
        fee: "814.63",
        notes: [
          "Restricted to Urologists.",
          "Diagnostic cystoscopy prior to surgery is payable at 100%.",
        ],
      },
    ],
    prompts: [],
  },
  circumcision: {
    procedureKey: "circumcision",
    displayName: "Circumcision",
    province: BC,
    codes: [
      {
        code: "S08312",
        label: "Circumcision, excluding clamp or bell technique (operation only)",
        fee: "302.02",
        notes: [
          "Routine circumcision of the newborn for non medical reasons is not a benefit of the Medical Services Plan.",
        ],
      },
    ],
    prompts: [],
  },
  dorsal_slit: {
    procedureKey: "dorsal_slit",
    displayName: "Dorsal slit",
    province: BC,
    codes: [
      { code: "S08301", label: "Dorsal slit, isolated procedure (operation only)", fee: "167.09" },
    ],
    prompts: [],
  },
  penile_doppler: {
    procedureKey: "penile_doppler",
    displayName: "Penile duplex Doppler ultrasound",
    province: BC,
    codes: [
      {
        code: "08399",
        label: "Doppler evaluation of penile blood flow from evaluation of dorsal and cavernosal arteries, blood pressure recordings and calculation of penile brachial index",
        fee: "48.50",
        notes: [
          "Applicable to hospital-based, accredited and approved ultrasound vascular studies laboratories only.",
        ],
      },
    ],
    prompts: [],
  },
  cavernosometry: {
    procedureKey: "cavernosometry",
    displayName: "Cavernosometry / cavernosography",
    province: BC,
    codes: [
      {
        code: "S00866",
        label: "Dynamic cavernosometry and cavernosography",
        fee: "80.84",
        notes: [
          "Interpretation of x-ray is included in the technical portion and is not billable in addition.",
        ],
      },
    ],
    prompts: [],
  },
  ici_test: {
    procedureKey: "ici_test",
    displayName: "Intracavernosal injection test dosing",
    province: BC,
    codes: [
      {
        code: "TY08339",
        label: "Intracavernosal penile injection for test dosing",
        fee: "67.50",
        notes: [
          "Restricted to Urologists.",
          "Maximum one per day, per patient.",
          "Not payable in addition to penile duplex ultrasound or peripheral nerve block.",
          "Only for evaluation/testing of erectile dysfunction response or assessment of Peyronie's disease severity for potential surgical treatment.",
        ],
      },
    ],
    prompts: [],
  },

  // ── Scrotum / testis / fertility ──
  orchiectomy: {
    procedureKey: "orchiectomy",
    displayName: "Orchiectomy",
    province: BC,
    codes: [
      { code: "S08329", label: "Simple orchidectomy (operation only)", fee: "306.06" },
      {
        code: "08330",
        label: "Orchidectomy via inguinal approach",
        fee: "349.31",
        notes: ["Includes excision of spermatic cord to level of internal inguinal ring."],
      },
      {
        code: "T08331",
        label: "Bilateral orchidectomy in the context of gender-affirming surgery via transcrotal, bilateral inguinal/subinguinal approach",
        fee: "597.47",
        notes: [
          "For MSP approved gender-affirming surgery under Preamble D. 9. 4.",
          "Scrotal surgeries (scrotal skin removal, implants, structures adjacent to the spermatic cord, hydroceles) payable in addition only with a note record explaining medical rationale.",
          "Not billable in addition to 08329, 08330, 08345, 08346, 08323, 08324.",
        ],
      },
    ],
    prompts: [],
  },
  scrotal_exploration: {
    procedureKey: "scrotal_exploration",
    displayName: "Scrotal exploration / torsion",
    province: BC,
    codes: [
      {
        code: "S08323",
        label: "Exploration of scrotal contents, unilateral (operation only)",
        fee: "273.50",
      },
      {
        code: "S08325",
        label: "Reduction of torsion of testis and spermatic cord repair, bilateral",
        fee: "475.23",
      },
      { code: "08326", label: "Ruptured testicle repair", fee: "511.40" },
    ],
    prompts: [],
  },
  orchiopexy: {
    procedureKey: "orchiopexy",
    displayName: "Orchiopexy",
    province: BC,
    codes: [
      { code: "08322", label: "Orchidopexy, one or two stages", fee: "398.31" },
      {
        code: "08324",
        label: "Exploration of undescended testicle, without orchidopexy",
        fee: "307.00",
      },
      { code: "08328", label: "Recurrent undescended testis", fee: "520.76" },
    ],
    prompts: [],
  },
  hydrocelectomy: {
    procedureKey: "hydrocelectomy",
    displayName: "Hydrocele / spermatocele excision",
    province: BC,
    codes: [
      { code: "S08341", label: "Spermatocoele or hydrocele excision", fee: "351.89" },
    ],
    prompts: [],
  },
  epididymectomy: {
    procedureKey: "epididymectomy",
    displayName: "Epididymectomy",
    province: BC,
    codes: [
      { code: "08342", label: "Epididymectomy, unilateral", fee: "285.39" },
    ],
    prompts: [],
  },
  vasectomy: {
    procedureKey: "vasectomy",
    displayName: "Vasectomy",
    province: BC,
    codes: [
      { code: "S08345", label: "Vasectomy, bilateral (operation only)", fee: "103.81" },
    ],
    prompts: [],
  },
  vasal_reconstruction: {
    procedureKey: "vasal_reconstruction",
    displayName: "Vasovasostomy / vasoepididymostomy",
    province: BC,
    codes: [
      {
        code: "S08343",
        label: "Epididymovasostomy or re-anastomosis of vas, unilateral",
        fee: "795.64",
      },
      { code: "S08344", label: "Vas cannulation, unilateral or bilateral", fee: "129.27" },
    ],
    prompts: [
      {
        id: "bc-vasal-insurability",
        label: "Insurability",
        text: "Schedule note on S08343: this item is an insured benefit only when a previous vasectomy has NOT been performed. Vasectomy-reversal reconstruction is not an MSP benefit; confirm payment arrangements before booking.",
        severity: "required",
        color: "#ef4444",
        requiredForCodes: ["S08343"],
      },
    ],
  },
  varicocelectomy: {
    procedureKey: "varicocelectomy",
    displayName: "Varicocelectomy",
    province: BC,
    codes: [
      { code: "08346", label: "Varicocoele resection", fee: "400.93" },
      {
        code: "08370",
        label: "Sub-inguinal microsurgical varicocelectomy",
        fee: "1,066.60",
        notes: ["Restricted to Urologists."],
      },
    ],
    prompts: [
      {
        id: "bc-varico-technique",
        label: "Technique",
        text: "Document the approach: the microsurgical sub-inguinal item (08370, $1,066.60) pays substantially more than plain resection (08346, $400.93) and is restricted to Urologists.",
        severity: "recommended",
        color: "#3b82f6",
      },
    ],
  },
  testis_biopsy: {
    procedureKey: "testis_biopsy",
    displayName: "Testis biopsy / sperm retrieval",
    province: BC,
    codes: [
      { code: "S08327", label: "Biopsy of testis", fee: "154.92" },
    ],
    prompts: [
      {
        id: "bc-tese-insurability",
        label: "Insurability",
        text: "The January 2026 Schedule lists no dedicated micro-TESE item; assisted-reproduction sperm retrieval is commonly not an MSP benefit. Verify insurability and payment arrangements before claiming.",
        severity: "recommended",
        color: "#f59e0b",
      },
    ],
  },
  hypospadias_repair: {
    procedureKey: "hypospadias_repair",
    displayName: "Hypospadias repair",
    province: BC,
    codes: [
      {
        code: "08274",
        label: "Hypospadias, excluding urethrostomy: first stage, chordee",
        fee: "561.56",
      },
      { code: "08275", label: "Hypospadias: second stage (penile)", fee: "562.80" },
      { code: "08276", label: "Hypospadias: penoscrotal", fee: "1,034.34" },
    ],
    prompts: [],
  },
};
