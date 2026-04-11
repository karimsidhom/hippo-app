import type { ServiceKey } from "../types";

// ---------------------------------------------------------------------------
// Service Playbooks
//
// Each playbook describes HOW residents on that service actually think and
// write their notes — the details that matter, the red flags that must be
// captured, and wording conventions that distinguish a good note from a
// generic one. These are consumed by future smart-rendering passes.
// ---------------------------------------------------------------------------

export interface Playbook {
  service: ServiceKey;
  displayName: string;
  /** Details that MUST appear in most notes on this service. */
  required: string[];
  /** Details that are often included but not mandatory. */
  optional: string[];
  /** Red flags that should never be missed and should always be addressed. */
  redFlags: string[];
  /** Phrasing pearls the service reliably uses. */
  phrasingPearls: string[];
  /** Per-procedure wording pearls. */
  proceduralPearls?: Record<string, string[]>;
}

export const PLAYBOOKS: Partial<Record<ServiceKey, Playbook>> = {
  "general-surgery": {
    service: "general-surgery",
    displayName: "General Surgery",
    required: [
      "Acute vs chronic presentation",
      "Vitals trend and resuscitation status",
      "Abdominal exam with specific quadrants",
      "WBC, lactate, LFTs, lipase, imaging result",
      "NPO / IV fluids / antibiotic status",
      "Surgical plan with specific timing",
    ],
    optional: [
      "Home medications (especially anticoagulation)",
      "Prior abdominal surgeries",
    ],
    redFlags: [
      "Peritonitis",
      "Hemodynamic instability",
      "Lactate elevation",
      "Free air on imaging",
      "Active bleeding / dropping hemoglobin",
    ],
    phrasingPearls: [
      'Lead with: "This is a [age] [sex] presenting with [duration] of [symptom]."',
      'Prefer "peritonitic" over "tender" when appropriate.',
      'State NPO status and the IV fluid running when handing over.',
    ],
    proceduralPearls: {
      cholecystectomy: [
        "Critical view of safety obtained before clipping any structure.",
        "Intraoperative cholangiogram considered for anatomic uncertainty or choledocholithiasis.",
      ],
      appendectomy: [
        "Staple base and mesoappendix separately on lap appy.",
        "Confirm base is healthy — consider tip appendicitis if base is clean.",
      ],
      colectomy: [
        "Specify extent of resection and the vascular pedicle taken.",
        "Anastomotic technique and leak test.",
      ],
    },
  },

  vascular: {
    service: "vascular",
    displayName: "Vascular Surgery",
    required: [
      "Pulse exam (site, quality, Doppler signals)",
      "ABI and/or toe pressures where relevant",
      "Anticoagulation status and last dose",
      "Smoking status",
      "Renal function (Cr, eGFR) before contrast",
      "Imaging: CTA / duplex / angiogram findings with specific sizes",
    ],
    optional: [
      "Ambulatory / functional status",
      "Previous revascularization history and conduit availability",
    ],
    redFlags: [
      "Acute limb ischemia — 6 P's",
      "Expanding / ruptured aneurysm",
      "Cold, pulseless, insensate limb",
      "Ongoing blood loss from graft site",
    ],
    phrasingPearls: [
      'Always quote ACT before clamping and after protamine reversal.',
      'State distal signals / pulses at the end of any vascular intervention.',
      'For AAAs, quote maximum diameter in cm, not just "enlarged".',
    ],
  },

  obgyn: {
    service: "obgyn",
    displayName: "Obstetrics & Gynecology",
    required: [
      "GTPAL / gravida-para status",
      "LMP / gestational age (certain vs uncertain dating)",
      "Last Pap / HPV status for gyn presentations",
      "Fetal heart rate / fetal well-being for obstetric presentations",
      "Bleeding quantification in pads/clots when relevant",
      "Contraception / sexually active status where clinically relevant",
    ],
    optional: [
      "Home meds (especially anticoagulation and hormonal therapy)",
      "Delivery history — mode and complications",
    ],
    redFlags: [
      "Ectopic with hemodynamic instability",
      "Placental abruption",
      "Postpartum hemorrhage",
      "Severe preeclampsia / eclampsia",
      "Uterine rupture suspicion",
    ],
    phrasingPearls: [
      'Open with "G_P_ at _/_ weeks" for every obstetric case.',
      'Quote EBL in mL and specify uterotonics given in order.',
      'For C-sections, state cord gases and Apgars explicitly.',
    ],
    proceduralPearls: {
      "cesarean section": [
        "State indication, type of anesthesia, skin incision, uterine incision, and EBL.",
        "Document infant sex, weight, Apgars, cord gases.",
      ],
      hysterectomy: [
        "Specify ovarian status (BSO vs preservation) and route.",
        "Document cuff closure technique and any injury concerns.",
      ],
    },
  },

  urology: {
    service: "urology",
    displayName: "Urology",
    required: [
      "Stream / storage symptoms breakdown (IPSS-style)",
      "PSA and prior biopsy/pathology when oncologic",
      "Stone burden and location with imaging",
      "Hematuria history (gross vs microscopic, painful vs painless)",
      "Catheter / stent status",
      "Renal function",
    ],
    optional: [
      "Sexual function baseline for any prostatic / pelvic intervention",
      "Anticoagulation status before instrumentation",
    ],
    redFlags: [
      "Obstructed infected kidney (emergency drainage)",
      "Gross hematuria with clot retention",
      "Priapism > 4 hours",
      "Fournier's gangrene",
      "Testicular torsion",
    ],
    phrasingPearls: [
      'Always note the catheter size (Fr) and whether to gravity vs continuous irrigation.',
      'Specify stone dimensions in mm and Hounsfield units when discussing imaging.',
      'For prostate cancer, quote PSA, Gleason, and stage in a single line.',
    ],
    proceduralPearls: {
      prostatectomy: [
        "Specify nerve-sparing status and surgical margin assessment.",
        "Document catheter size and duration.",
      ],
      turbt: [
        "State whether detrusor muscle was included in the specimen.",
        "Document intravesical chemotherapy if given.",
      ],
      ureteroscopy: [
        "State stone burden, clearance, and stent duration.",
      ],
    },
  },
};

export function getPlaybook(service: ServiceKey): Playbook | undefined {
  return PLAYBOOKS[service];
}
