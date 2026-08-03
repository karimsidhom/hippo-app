// SMSNA fellowship case taxonomy — six sexual medicine / andrology case
// categories, transcribed from the SMSNA Fellowship Surgical Case Log Form
// (smsna.org, Mayo Clinic Q2-2026 edition). Procedure names are verbatim from
// the form apart from typo fixes (Implant, Enhancement, Metoidioplasty,
// bipolar) and "(Gender Affirmation)" suffixes on the three implant rows that
// would otherwise collide with identical names under Penile Surgery and
// Prosthetics (category lookup is by procedure name). The form's four female
// office diagnostics (Vulvoscopy through Clitoral Anesthesia Testing) carry
// the "General Urology and Office Procedures" category on the form and are
// kept there. The form's free-text "Other Procedures" row is served by
// ProcedurePicker's built-in Other escape hatch.

import type { Procedure } from "@/lib/procedureLibrary";

export type SmsnaCategoryKey =
  | "penile-prosthetics"
  | "male-infertility"
  | "male-reconstruction"
  | "female-reconstruction"
  | "gender-affirmation"
  | "general-office";

export interface SmsnaCategory {
  key: SmsnaCategoryKey;
  name: string;
  icon: string;
  procedures: string[];
}

export const SMSNA_CATEGORIES: SmsnaCategory[] = [
  {
    key: "penile-prosthetics",
    name: "Penile Surgery and Prosthetics",
    icon: "🔧",
    procedures: [
      "Penile Implant Placement",
      "Penile Implant Revision",
      "Penile Implant Removal",
      "Testicular Implant Placement",
      "Testicular Implant Revision",
      "Testicular Implant Removal",
      "Penile Modeling",
      "Penile Plication/Nesbit",
      "Plaque Incision/Excision and Grafting",
      "Extra Tunical Grafting",
      "Penile Revascularization",
      "Crural Ligation",
      "Priapism Shunting",
      "Penile Fracture Repair",
      "Glans Fixation for SST Deformity",
      "Penile Lengthening, Girth Enhancement",
      "Penile/Scrotal Reconstruction/Web Repair (Scrotoplasty)",
    ],
  },
  {
    key: "male-infertility",
    name: "Male Infertility",
    icon: "🔬",
    procedures: [
      "Microscopic Spermatic Cord Denervation",
      "Varicocele Ligation (Microscopic or Others)",
      "Microscopic Vasovasostomy",
      "Microscopic Vasoepididymostomy",
      "Vasectomy",
      "Microscopic Testis Sperm Extraction (Micro TESE)",
      "Testis Sperm Extraction/Aspiration (TESE/TESA)",
      "Percutaneous Epididymal Sperm Aspiration (PESA)",
      "Microsurgical Epididymal Sperm Aspiration (MESA)",
      "Transurethral Resection of Ejaculatory Duct (TURED)",
      "Transurethral Aspiration of Seminal Vesicles",
      "Testis Biopsy (Incisional/Excisional)",
      "Testis FNA Mapping",
      "Vasogram",
      "Electroejaculation",
      "Penile Vibratory Stimulation",
    ],
  },
  {
    key: "male-reconstruction",
    name: "Male Urethra and Reconstructive Surgery",
    icon: "🩹",
    procedures: [
      "Artificial Urinary Sphincter Placement",
      "Artificial Urinary Sphincter Revision",
      "Artificial Urinary Sphincter Removal",
      "Male Sling Placement",
      "Male Sling Revision",
      "Male Sling Removal",
      "Adjustable Continence Balloon (ProACT)",
      "Optilume Balloon",
      "Mini-Jupette Sling",
      "Meatotomy",
      "Phalloplasty",
      "Scrotoplasty",
      "Urethroplasty (Anastomotic/Augmented)",
      "Continent Urinary Diversion",
      "Buried Penis Repair",
    ],
  },
  {
    key: "female-reconstruction",
    name: "Female Reconstructive Surgery",
    icon: "🌸",
    procedures: [
      "Complete Vestibulectomy with Vaginal Advancement Flap",
      "Marsupialization of Bartholin Cyst",
      "Mid-Urethral Sling Placement",
      "Mid-Urethral Sling Revision",
      "Mid-Urethral Sling Removal",
      "Vesicovaginal Fistula Repair",
    ],
  },
  {
    key: "gender-affirmation",
    name: "Gender Affirmation Surgery",
    icon: "🏳️‍⚧️",
    procedures: [
      "Vaginoplasty/Neovaginoplasty",
      "Metoidioplasty",
      "Urethral Lengthening/Reconstruction and Neo-Scrotal Formation/Reconstruction",
      "Penile Implant Placement (Gender Affirmation)",
      "Penile Implant Revision (Gender Affirmation)",
      "Penile Implant Removal (Gender Affirmation)",
      "Simple Orchiectomy",
      "Fistula Repair",
    ],
  },
  {
    key: "general-office",
    name: "General Urology and Office Procedures",
    icon: "🩺",
    procedures: [
      "BPH Surgery - MIST (Rezum, UroLift, iTind)",
      "BPH Surgery - Endoscopic Resection (TURP, PVP, Aquablation)",
      "BPH Surgery - Enucleation (Bipolar Enucleation, HoLEP)",
      "BPH Surgery - Simple Prostatectomy (Open, Laparoscopic or Robotic)",
      "Circumcision",
      "Frenulectomy",
      "Hydrocele/Spermatocele/Epididymal Cyst Repair",
      "Genital/Urethral Condyloma Excision/Laser Ablation",
      "Intravesical Botox Injection",
      "Dorsal Slit",
      "Duplex Doppler Ultrasound",
      "Cavernosometry/Cavernosography",
      "Penile Deformity Assessment",
      "Intracavernosal Injections/Artificial Erection",
      "Intralesional Injections (Xiaflex, Verapamil)",
      "Testosterone Pellet Insertion",
      "Biothesiometry",
      "Hot and Cold Perception Testing",
      "Sacral Dermatome Testing",
      "Bulbocavernosus Reflex Latency Testing",
      "Pelvic Floor Botox Injections",
      "Ureteroscopy",
      "Urethral Stricture Balloon Dilation/Incision",
      "Shockwave Treatment",
      "Platelet-Rich Plasma Injection (PRP)",
      "Stem Cell Treatment",
      "Semen Analysis",
      "Spermatic Cord Nerve Blocks/Botox",
      "Vulvoscopy",
      "Q-tip Testing",
      "Vestibular Anesthesia Testing",
      "Clitoral Anesthesia Testing",
    ],
  },
];

/**
 * Build the SMSNA procedure list as generic `Procedure` objects for
 * ProcedurePicker. Deliberately NOT appended to PROCEDURE_LIBRARY so these
 * entries can never leak into another specialty's list or global search —
 * consumers must call this explicitly (gated on `isSmsnaProfile`).
 */
export function getSmsnaProcedures(): Procedure[] {
  const out: Procedure[] = [];
  SMSNA_CATEGORIES.forEach((cat, catIdx) => {
    cat.procedures.forEach((name, i) => {
      out.push({
        id: `smsna-${catIdx}-${i}`,
        name,
        specialty: "smsna",
        category: cat.name,
        subcategory: cat.name,
        approaches: [],
        aliases: [],
        complexityTier: 2,
        active: true,
      });
    });
  });
  return out;
}

export function getSmsnaCategoryByKey(key: SmsnaCategoryKey): SmsnaCategory | undefined {
  return SMSNA_CATEGORIES.find((c) => c.key === key);
}

export function getSmsnaCategoryByName(name: string): SmsnaCategory | undefined {
  return SMSNA_CATEGORIES.find((c) => c.name === name);
}

export function getSmsnaCategoryForProcedure(procedureName: string): SmsnaCategory | undefined {
  return SMSNA_CATEGORIES.find((c) => c.procedures.includes(procedureName));
}
