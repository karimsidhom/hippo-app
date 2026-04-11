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

  plastics: {
    service: "plastics",
    displayName: "Plastic & Reconstructive Surgery",
    required: [
      "Defect size and depth with specific cm measurements",
      "Reconstructive ladder level chosen and why",
      "Flap/graft type, size, donor site, and perforator anatomy",
      "Tension assessment at closure",
      "Implant specifications (size, shape, projection, manufacturer)",
      "Smoking status and wound-healing risk factors",
    ],
    optional: [
      "Prior radiation to the operative field",
      "Anticoagulation status",
      "Scar quality and prior surgeries at the site",
    ],
    redFlags: [
      "Flap compromise (venous congestion, arterial insufficiency)",
      "Expanding hematoma under a flap",
      "Cellulitis near implant or flap",
      "Exposed hardware / prosthesis",
    ],
    phrasingPearls: [
      'Always quote flap perfusion at the end of the case: "brisk capillary refill, audible Doppler signal, viable flap".',
      'State total ischemia time for any free flap.',
      'Name the perforator and the source vessel, not just "a perforator flap".',
    ],
    proceduralPearls: {
      "breast reduction": [
        "State pedicle type (inferior, superomedial), resection weights, and nipple viability.",
      ],
      "breast augmentation": [
        "State pocket plane, implant specs, and IMF symmetry on upright assessment.",
      ],
      "diep flap": [
        "Name perforator, pedicle length, ischemia time, and recipient vessels.",
      ],
    },
  },

  orthopedics: {
    service: "orthopedics",
    displayName: "Orthopedic Surgery",
    required: [
      "Mechanism of injury and time since injury",
      "Neurovascular exam pre and post",
      "Tourniquet time and pressure",
      "Implant specifications (plate, screw, nail, arthroplasty components)",
      "Fluoroscopic confirmation of reduction and hardware position",
      "Weight-bearing status and postoperative immobilization",
    ],
    optional: [
      "Prior hardware and removal plans",
      "Bone density / osteoporosis status",
      "Anticoagulation bridging plan",
    ],
    redFlags: [
      "Compartment syndrome",
      "Open fracture with gross contamination",
      "Neurovascular injury / pulseless extremity",
      "Cauda equina syndrome for spinal cases",
    ],
    phrasingPearls: [
      'Always quote tourniquet time at the end.',
      'State fluoroscopic confirmation of reduction and hardware position explicitly.',
      'Document neurovascular exam distal to the operative site at the end of the case.',
    ],
    proceduralPearls: {
      "total hip arthroplasty": [
        "Document approach, cup and stem sizes/types, head size, offset, leg lengths, and stability testing.",
      ],
      "total knee arthroplasty": [
        "Document component sizes, cement vs cementless, balance/tracking, and tourniquet time.",
      ],
      orif: [
        "State reduction method, implant specs, and fluoro confirmation in both AP and lateral.",
      ],
    },
  },

  neurosurgery: {
    service: "neurosurgery",
    displayName: "Neurosurgery",
    required: [
      "Neurological exam preoperatively (baseline GCS, focal deficits)",
      "Imaging findings and lesion location/size",
      "Anticoagulation status and reversal if applicable",
      "Navigation / neuromonitoring baselines",
      "Head positioning and pin placement",
      "Intraoperative blood pressure goal",
    ],
    optional: [
      "Seizure history and AEDs",
      "Prior cranial / spinal surgery",
      "Steroid use preoperatively",
    ],
    redFlags: [
      "Pupillary asymmetry / herniation",
      "Midline shift > 5 mm",
      "Cauda equina syndrome",
      "New focal deficit",
      "Uncontrolled intracranial hypertension",
    ],
    phrasingPearls: [
      'State pre- and post-op GCS and any focal deficits explicitly.',
      'For craniotomies, quote navigation accuracy and extent of resection on post-op exam.',
      'Document dural closure as watertight, with or without patch.',
    ],
    proceduralPearls: {
      "craniotomy for tumor": [
        "Quote extent of resection, frozen section diagnosis, and EBL.",
      ],
      "decompressive craniectomy": [
        "State size of bone flap, duraplasty details, and where the flap was stored.",
      ],
      "vp shunt": [
        "State valve type/setting, CSF appearance, and catheter depth.",
      ],
    },
  },

  ent: {
    service: "ent",
    displayName: "Otolaryngology — Head & Neck",
    required: [
      "Airway assessment and intubation plan",
      "Tumor site, size, staging for H&N oncology",
      "Nerve monitoring status (RLN, facial, spinal accessory)",
      "Smoking / alcohol history for H&N cases",
      "Hearing status for otologic cases",
      "Prior radiation and surgery to the field",
    ],
    optional: [
      "Voice profession / occupation",
      "Sleep apnea severity for airway cases",
      "Allergies (especially to antibiotics used perioperatively)",
    ],
    redFlags: [
      "Stridor or impending airway loss",
      "Post-tonsillectomy hemorrhage",
      "Expanding neck hematoma",
      "Facial nerve injury",
      "Unilateral hearing loss with vestibular symptoms",
    ],
    phrasingPearls: [
      'For thyroid/parotid cases, name the nerves identified and preserved explicitly.',
      'For FESS, state navigation use, CT correlation, and ostial patency at end of case.',
      'For tracheostomy, document tube size, cuff status, and secure placement confirmation.',
    ],
    proceduralPearls: {
      tonsillectomy: [
        "State technique (cold, coblation, cautery), hemostasis method, and pain protocol.",
      ],
      thyroidectomy: [
        "Name RLN and parathyroid preservation; document nerve monitoring signals.",
      ],
      tracheostomy: [
        "State tube size, tracheal ring level, and confirmed ventilation after tube placement.",
      ],
    },
  },

  "pediatric-surgery": {
    service: "pediatric-surgery",
    displayName: "Pediatric Surgery",
    required: [
      "Weight in kg and age",
      "Gestational age at birth / prematurity",
      "Feeding status and growth trajectory",
      "Vitals appropriate for age",
      "Fluid resuscitation status and urine output",
      "Parental consent and discussion",
    ],
    optional: [
      "Family history of anesthesia complications",
      "Immunization status",
      "Developmental milestones",
    ],
    redFlags: [
      "Bilious emesis in an infant (malrotation until proven otherwise)",
      "Incarcerated hernia",
      "Pneumatosis / NEC",
      "Hemodynamic instability from relative hypovolemia (small volumes matter)",
    ],
    phrasingPearls: [
      'Always quote weight in kg and age; dose every medication per kg.',
      'State thermoregulation measures (warmed OR, Bair Hugger) at the start of every neonatal case.',
      'For pyloromyotomy, explicitly document the negative air-leak test.',
    ],
    proceduralPearls: {
      pyloromyotomy: [
        "Document thickness split to submucosa and negative air-leak test.",
      ],
      "inguinal hernia repair": [
        "State high ligation at the internal ring and contralateral evaluation approach.",
      ],
      orchidopexy: [
        "Document cord length achieved and scrotal sub-dartos pouch placement.",
      ],
    },
  },

  cardiothoracic: {
    service: "cardiothoracic",
    displayName: "Cardiothoracic Surgery",
    required: [
      "Bypass time and cross-clamp time",
      "Cardioplegia type, volume, and delivery route",
      "Cannulation strategy (arterial and venous)",
      "EF preoperatively and any regional wall motion abnormalities",
      "Valve sizes, implant types, and manufacturer where applicable",
      "Pre-bypass and post-bypass TEE findings",
    ],
    optional: [
      "Prior cardiac surgery and reoperation plan",
      "Pulmonary function baseline for thoracic cases",
      "Anticoagulation strategy and heparin resistance",
    ],
    redFlags: [
      "Difficult weaning from bypass",
      "Low cardiac output state",
      "Major bleeding at cannulation sites",
      "New wall motion abnormality on post-bypass TEE",
      "Bronchial stump disruption after lobectomy",
    ],
    phrasingPearls: [
      'Always quote total bypass time and cross-clamp time at the end of the case.',
      'For coronary grafts, list each target and the conduit used (LIMA-LAD, SVG-OM1, etc.).',
      'For thoracic cases, document single-lung ventilation, chest tube sizes/positions, and air-leak status.',
    ],
    proceduralPearls: {
      cabg: [
        "List grafts in order with targets and conduits, plus total bypass and cross-clamp times.",
      ],
      "aortic valve replacement": [
        "State valve size, type, sewing technique, and competent valve on TEE.",
      ],
      "vats lobectomy": [
        "State lobe, vessels and bronchus stapled in order, and N2 nodal harvest.",
      ],
    },
  },
};

export function getPlaybook(service: ServiceKey): Playbook | undefined {
  return PLAYBOOKS[service];
}
