// ---------------------------------------------------------------------------
// Subspecialty sections: the single source of truth for "which part of my
// specialty was this case?".
//
// A resident trains in one specialty, so a breakdown by specialty is
// meaningless. What matters is the spread across the sections of that
// specialty (for urology: Endourology & Stones, Oncology, Andrology, ...).
//
// Nothing here is stored. Every case is resolved at read time:
//   1. procedureDefinitionId, when it is a library id (live rows are DB cuids,
//      so in practice this is rare and step 2 does the work)
//   2. exact name or alias match against the procedure library, preferring
//      the user's specialty
//   3. keyword rules for the user's specialty (catches free-text names and
//      names from other catalogues such as the SMSNA form)
//   4. an exact library match in another specialty -> "Off-service"
//   5. close token match against the library (own specialty first)
//   6. otherwise "Other"
// Cases that clearly belong to another specialty (off-service rotations) are
// grouped as "Off-service" instead of being forced into a section.
//
// Relative imports only: scripts/test-subspecialty.ts runs this file under
// ts-node without the "@/" path alias.
// ---------------------------------------------------------------------------

import { PROCEDURE_LIBRARY, type Procedure } from "./procedureLibrary";
import { SPECIALTIES } from "./constants";
import { SMSNA_CATEGORIES } from "./smsna/taxonomy";

export interface Section {
  key: string;
  label: string;
}

export const OFF_SERVICE: Section = { key: "off-service", label: "Off-service" };
export const OTHER: Section = { key: "other", label: "Other" };

/** Standard Canadian subspecialty sections per specialty (SPECIALTIES slug). */
export const SPECIALTY_SECTIONS: Record<string, Section[]> = {
  urology: [
    { key: "endo-stones", label: "Endourology & Stones" },
    { key: "oncology", label: "Oncology" },
    { key: "andrology", label: "Andrology" },
    { key: "reconstruction", label: "Reconstruction" },
    { key: "functional", label: "Functional & Female" },
    { key: "pediatric", label: "Pediatric" },
    { key: "transplant", label: "Transplant" },
    { key: "general", label: "General" },
  ],
  "general-surgery": [
    { key: "hpb", label: "HPB" },
    { key: "colorectal", label: "Colorectal" },
    { key: "upper-gi", label: "Upper GI & Bariatric" },
    { key: "breast-endocrine", label: "Breast & Endocrine" },
    { key: "acute-care", label: "Acute Care & Trauma" },
    { key: "hernia", label: "Hernia & Abdominal Wall" },
    { key: "surg-onc", label: "Surgical Oncology" },
    { key: "general", label: "General" },
  ],
  neurosurgery: [
    { key: "spine", label: "Spine" },
    { key: "neuro-onc", label: "Neuro-oncology" },
    { key: "vascular", label: "Cerebrovascular" },
    { key: "functional", label: "Functional & Epilepsy" },
    { key: "csf", label: "CSF & Hydrocephalus" },
    { key: "trauma", label: "Trauma" },
    { key: "general", label: "General" },
  ],
  orthopedic: [
    { key: "arthroplasty", label: "Arthroplasty" },
    { key: "sports", label: "Sports" },
    { key: "trauma", label: "Trauma" },
    { key: "spine", label: "Spine" },
    { key: "hand", label: "Hand & Upper Extremity" },
    { key: "foot-ankle", label: "Foot & Ankle" },
    { key: "general", label: "General" },
  ],
  cardiac: [
    { key: "coronary", label: "Coronary" },
    { key: "valve", label: "Valve" },
    { key: "aorta", label: "Aorta" },
    { key: "heart-failure", label: "Heart Failure & Transplant" },
    { key: "arrhythmia", label: "Arrhythmia" },
    { key: "congenital", label: "Congenital" },
    { key: "general", label: "General" },
  ],
  vascular: [
    { key: "aortic", label: "Aortic & Visceral" },
    { key: "carotid", label: "Carotid" },
    { key: "peripheral", label: "Peripheral Arterial" },
    { key: "venous", label: "Venous" },
    { key: "access", label: "Dialysis Access" },
    { key: "amputation", label: "Amputation" },
    { key: "general", label: "General" },
  ],
  plastic: [
    { key: "breast", label: "Breast" },
    { key: "hand", label: "Hand & Microsurgery" },
    { key: "craniofacial", label: "Craniofacial & Cleft" },
    { key: "aesthetic", label: "Aesthetic" },
    { key: "burns-wound", label: "Burns & Wound" },
    { key: "reconstructive", label: "Reconstructive" },
    { key: "general", label: "General" },
  ],
  ent: [
    { key: "otology", label: "Otology" },
    { key: "rhinology", label: "Rhinology" },
    { key: "laryngology", label: "Laryngology & Airway" },
    { key: "head-neck", label: "Head & Neck" },
    { key: "sleep", label: "Sleep" },
    { key: "general", label: "General" },
  ],
  obgyn: [
    { key: "obstetrics", label: "Obstetrics" },
    { key: "gynecology", label: "Gynecology" },
    { key: "gyn-onc", label: "Gynecologic Oncology" },
    { key: "urogyn", label: "Urogynecology" },
    { key: "general", label: "General" },
  ],
  ophthalmology: [
    { key: "anterior", label: "Cataract & Anterior Segment" },
    { key: "cornea", label: "Cornea" },
    { key: "glaucoma", label: "Glaucoma" },
    { key: "retina", label: "Retina" },
    { key: "oculoplastics", label: "Oculoplastics" },
    { key: "pediatric", label: "Pediatric & Strabismus" },
    { key: "general", label: "General" },
  ],
  pediatric: [
    { key: "gi", label: "GI & Abdominal" },
    { key: "neonatal", label: "Neonatal" },
    { key: "thoracic", label: "Thoracic" },
    { key: "oncology", label: "Oncology" },
    { key: "urology", label: "Urology" },
    { key: "hernia", label: "Hernia" },
    { key: "general", label: "General" },
  ],
  thoracic: [
    { key: "lung", label: "Lung" },
    { key: "esophagus", label: "Esophagus" },
    { key: "mediastinum", label: "Mediastinum" },
    { key: "airway", label: "Airway" },
    { key: "pleura", label: "Pleura & Chest Wall" },
    { key: "transplant", label: "Transplant" },
    { key: "general", label: "General" },
  ],
  colorectal: [
    { key: "colon", label: "Colon" },
    { key: "rectal", label: "Rectal" },
    { key: "anorectal", label: "Anorectal" },
    { key: "general", label: "General" },
  ],
  transplant: [
    { key: "kidney", label: "Kidney" },
    { key: "liver", label: "Liver" },
    { key: "pancreas", label: "Pancreas" },
    { key: "procurement", label: "Procurement" },
    { key: "general", label: "General" },
  ],
  "surg-onc": [
    { key: "hpb", label: "HPB" },
    { key: "upper-gi", label: "Upper GI" },
    { key: "breast-endocrine", label: "Breast & Endocrine" },
    { key: "melanoma-sarcoma", label: "Melanoma & Sarcoma" },
    { key: "peritoneal", label: "Peritoneal" },
    { key: "head-neck", label: "Head & Neck" },
    { key: "general", label: "General" },
  ],
  omfs: [
    { key: "dentoalveolar", label: "Dentoalveolar" },
    { key: "trauma", label: "Facial Trauma" },
    { key: "orthognathic", label: "Orthognathic" },
    { key: "oncology", label: "Oncology & Reconstruction" },
    { key: "tmj", label: "TMJ" },
    { key: "salivary", label: "Salivary" },
    { key: "general", label: "General" },
  ],
  // Andrology fellows (SMSNA log): the SMSNA form's own case categories.
  smsna: SMSNA_CATEGORIES.map((c) => ({ key: c.key, label: c.name })),
  other: [{ key: "general", label: "General" }],
};

/** Specialties that share a case vocabulary (an andrology fellow is still a urologist). */
const FAMILY: Record<string, string> = { smsna: "urology" };
const familyOf = (slug: string) => FAMILY[slug] ?? slug;

// ── Library procedure -> section ────────────────────────────────────────────

type SectionKey = string;

/**
 * Section for one library procedure. Driven by the library's own
 * category/subcategory, with a few explicit id overrides.
 */
export function libraryProcedureSection(proc: Procedure): SectionKey {
  const { specialty: s, category: cat, subcategory: sub, id } = proc;
  switch (s) {
    case "urology": {
      // Explicit calls (Karim): cystoscopy, SPC and circumcision are General.
      if (id === "uro-001" || id === "uro-002" || id === "uro-010" || id === "uro-055") return "general";
      if (cat === "Endourology") return "endo-stones";
      // Judgment call, easy to change: BPH surgery (TURP, HoLEP, PVP, Rezum,
      // UroLift) is filed under Endourology & Stones because it is endoscopic
      // outlet work in most Canadian programs. Move it to "general" here and
      // in UROLOGY_RULES below if the program counts it differently.
      if (cat === "Prostate" && sub === "BPH") return "endo-stones";
      if (sub === "Oncology" || sub === "Testis" || sub === "Adrenal") return "oncology";
      // Prostate and bladder biopsies are cancer work-up.
      if (sub === "Diagnostic") return "oncology";
      // Neobladder is the diversion step of a cystectomy for cancer.
      if (id === "uro-018") return "oncology";
      if (cat === "Andrology") return "andrology";
      if (cat === "Pediatric") return "pediatric";
      if (sub === "Transplant") return "transplant";
      if (cat === "Incontinence") return "functional";
      if (sub === "Reconstruction") return "reconstruction";
      return "general"; // hydrocelectomy, meatotomy
    }
    case "general-surgery": {
      if (cat === "Bariatric" || cat === "Foregut") return "upper-gi";
      // Cholecystectomy and CBD work are filed under HPB (organ system).
      if (cat === "Biliary" || cat === "HPB") return "hpb";
      if (cat === "Breast" || cat === "Endocrine") return "breast-endocrine";
      if (cat === "Hernia") return "hernia";
      if (cat === "Trauma") return "acute-care";
      if (cat === "Colorectal") {
        if (sub === "Appendix" || sub === "Emergency" || sub === "Obstruction") return "acute-care";
        return "colorectal";
      }
      return "general"; // vascular access
    }
    case "neurosurgery": {
      if (cat === "Spine") return sub === "Trauma" ? "trauma" : "spine";
      if (cat === "Vascular") return "vascular";
      if (cat === "Functional" || cat === "Epilepsy" || cat === "Cranial Nerve") return "functional";
      if (cat === "CSF") return "csf";
      if (cat === "Sellar") return "neuro-onc";
      if (cat === "Cranial") {
        if (sub === "Tumor" || sub === "Posterior Fossa") return "neuro-onc";
        if (sub === "Trauma") return "trauma";
      }
      return "general";
    }
    case "orthopedic": {
      if (cat === "Arthroplasty") return "arthroplasty";
      if (cat === "Sports") return "sports";
      if (cat === "Trauma") return "trauma";
      if (cat === "Spine") return "spine";
      if (cat === "Hand") return "hand";
      if (cat === "Foot & Ankle") return "foot-ankle";
      return "general";
    }
    case "cardiac": {
      if (cat === "Coronary") return "coronary";
      if (cat === "Valve") return "valve";
      if (cat === "Aorta") return "aorta";
      if (cat === "Mechanical Support" || cat === "Transplant") return "heart-failure";
      if (cat === "Arrhythmia") return "arrhythmia";
      if (cat === "Congenital") return "congenital";
      return "general";
    }
    case "vascular": {
      if (cat === "Aortic" || cat === "Visceral" || cat === "Renal" || cat === "Extraanatomic") return "aortic";
      if (cat === "Carotid") return "carotid";
      if (cat === "Lower Extremity" || cat === "Peripheral" || cat === "Upper Extremity") return "peripheral";
      if (cat === "Venous") return "venous";
      if (cat === "Access") return "access";
      if (cat === "Amputation") return "amputation";
      return "general";
    }
    case "plastic": {
      if (cat === "Reconstructive" && sub === "Breast") return "breast";
      if (cat === "Aesthetic" && sub === "Breast") return "aesthetic";
      if (cat === "Hand") return "hand";
      if (cat === "Pediatric") return "craniofacial";
      if (cat === "Aesthetic") return "aesthetic";
      if (cat === "Wound") return "burns-wound";
      if (cat === "Reconstructive") return "reconstructive";
      return "general";
    }
    case "ent": {
      if (cat === "Otology") return "otology";
      if (cat === "Rhinology") return "rhinology";
      if (cat === "Laryngology" || cat === "Airway") return "laryngology";
      if (cat === "Head & Neck" || cat === "Salivary" || cat === "Thyroid") return "head-neck";
      if (cat === "Sleep") return "sleep";
      return "general"; // tonsils, adenoids
    }
    case "obgyn": {
      if (cat === "Obstetrics") return "obstetrics";
      if (cat === "Gynecologic Oncology") return "gyn-onc";
      if (cat === "Urogynecology") return "urogyn";
      if (cat === "Benign Gynecology" || cat === "Minimally Invasive" || cat === "Cervix" || cat === "Emergency") return "gynecology";
      return "general";
    }
    case "ophthalmology": {
      if (cat === "Anterior Segment") return "anterior";
      if (cat === "Cornea") return "cornea";
      if (cat === "Glaucoma") return "glaucoma";
      if (cat === "Retina") return "retina";
      if (cat === "Oculoplastic") return "oculoplastics";
      if (cat === "Pediatric") return "pediatric";
      return "general";
    }
    case "pediatric": {
      if (cat === "GI" || cat === "HPB") return "gi";
      if (cat === "Neonatal") return "neonatal";
      if (cat === "Thoracic") return "thoracic";
      if (cat === "Oncology") return "oncology";
      if (cat === "GU") return "urology";
      if (cat === "Hernias") return "hernia";
      return "general";
    }
    case "thoracic": {
      if (cat === "Lung") return "lung";
      if (cat === "Esophagus") return "esophagus";
      if (cat === "Mediastinum") return "mediastinum";
      if (cat === "Airway") return "airway";
      if (cat === "Pleura" || cat === "Chest Wall") return "pleura";
      if (cat === "Transplant") return "transplant";
      return "general";
    }
    case "colorectal": {
      if (cat === "Colon") return "colon";
      if (cat === "Rectum") return "rectal";
      if (cat === "Anal") return "anorectal";
      return "general";
    }
    case "transplant": {
      if (cat === "Kidney") return "kidney";
      if (cat === "Liver") return "liver";
      if (cat === "Pancreas") return "pancreas";
      if (cat === "Procurement") return "procurement";
      return "general";
    }
    case "surg-onc": {
      if (cat === "HPB") return "hpb";
      if (cat === "Foregut" || cat === "GI") return "upper-gi";
      if (cat === "Endocrine" || sub === "ALND") return "breast-endocrine";
      if (cat === "Soft Tissue" || sub === "ILND") return "melanoma-sarcoma";
      if (cat === "Peritoneal") return "peritoneal";
      if (cat === "Head & Neck") return "head-neck";
      return "general";
    }
    case "omfs": {
      if (cat === "Dentoalveolar") return "dentoalveolar";
      if (cat === "Facial Trauma") return "trauma";
      if (cat === "Orthognathic") return "orthognathic";
      if (cat === "Oncology" || cat === "Reconstructive") return "oncology";
      if (cat === "TMJ") return "tmj";
      if (cat === "Salivary") return "salivary";
      return "general";
    }
    default:
      return "general";
  }
}

/** Every library procedure id -> { specialty, section }. */
export const SECTION_BY_PROCEDURE_ID: Record<string, { specialty: string; section: SectionKey }> =
  Object.fromEntries(PROCEDURE_LIBRARY.map((p) => [p.id, { specialty: p.specialty, section: libraryProcedureSection(p) }]));

// ── Name normalisation + library index ──────────────────────────────────────

/** "Penile plication/Nesbit", "penile_plication/nesbit" -> "penile plication nesbit" */
export function normalizeProcedureName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[_/\\()[\],.;:+&-]+/g, " ")
    .replace(/[^a-z0-9 ]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const NAME_INDEX: Map<string, Procedure[]> = (() => {
  const m = new Map<string, Procedure[]>();
  const add = (k: string, p: Procedure) => {
    if (!k) return;
    const list = m.get(k) ?? [];
    if (!list.includes(p)) list.push(p);
    m.set(k, list);
  };
  for (const p of PROCEDURE_LIBRARY) {
    add(normalizeProcedureName(p.name), p);
    for (const a of p.aliases) add(normalizeProcedureName(a), p);
  }
  return m;
})();

const SMSNA_INDEX: Map<string, string> = new Map(
  SMSNA_CATEGORIES.flatMap((c) => c.procedures.map((n) => [normalizeProcedureName(n), c.key] as const)),
);

// Words that say how, not what. Ignored by the fuzzy matcher.
const STOP = new Set([
  "of", "the", "and", "with", "for", "a", "an", "in", "to", "or", "via",
  "open", "laparoscopic", "lap", "robotic", "robot", "assisted", "endoscopic",
  "percutaneous", "minimally", "invasive", "left", "right", "bilateral",
  "unilateral", "procedure", "surgery", "repair", "primary", "revision",
]);
const tokens = (n: string) => n.split(" ").filter((t) => t.length > 1 && !STOP.has(t));

const TOKEN_INDEX: { proc: Procedure; toks: Set<string> }[] = PROCEDURE_LIBRARY.flatMap((p) =>
  [p.name, ...p.aliases].map((n) => ({ proc: p, toks: new Set(tokens(normalizeProcedureName(n))) })),
);

function fuzzyLibraryMatch(norm: string, preferSpecialty: string | null): Procedure | null {
  const q = new Set(tokens(norm));
  if (q.size === 0) return null;
  let best: { proc: Procedure; score: number } | null = null;
  for (const { proc, toks } of TOKEN_INDEX) {
    if (toks.size === 0) continue;
    let shared = 0;
    for (const t of q) if (toks.has(t)) shared++;
    if (shared === 0) continue;
    const jaccard = shared / (q.size + toks.size - shared);
    // Slight preference for the user's own specialty on ties.
    const score = jaccard + (preferSpecialty && familyOf(proc.specialty) === familyOf(preferSpecialty) ? 0.01 : 0);
    if (!best || score > best.score) best = { proc, score };
  }
  return best && best.score >= 0.5 ? best.proc : null;
}

// ── Keyword rules (free-text names, other catalogues) ──────────────────────

type Rule = [SectionKey, RegExp];

// Order matters: the first matching rule wins. Patterns are written against
// normalizeProcedureName() output (lowercase, punctuation -> spaces) and are
// deliberately organ-specific so off-service names ("radical hysterectomy",
// "anal fistula", "biliary stent") do not get pulled into urology.
const UROLOGY_RULES: Rule[] = [
  ["transplant", /\b(renal|kidney) transplant|transplant nephrectomy|donor nephrectomy|\btransplant\b/],
  ["pediatric", /\bpediatric|\bpaediatric|hypospadias|orchiopexy|orchidopexy|undescended|vesicoureteral reflux|\bvur\b|posterior urethral valve|\bpuv\b|deflux|epispadias|exstrophy|\bwilms/],
  // Karim's explicit General list, checked before andrology / oncology.
  ["general", /hydrocel|circumcis|scrotal exploration|\btorsion\b|frenul|meatotomy|meatoplasty|dorsal slit|condylom|fournier|scrotal abscess|simple nephrectomy/],
  // BPH: see the judgment-call note in libraryProcedureSection().
  ["endo-stones", /simple prostatectomy|\bturp\b|transurethral resection of (the )?prostate|\bholep\b|\bthulep\b|\bholap\b|enucleation|\bpvp\b|greenlight|photoselective|vapori[sz]ation|\brezum\b|urolift|prostatic urethral lift|aquablation|\btuip\b|\bitind\b|\bbph\b|\bmist\b|bladder neck incision/],
  ["oncology", /\bturbt\b|resection of (the )?bladder (tumou?r|lesion)|bladder tumou?r|\bcystectomy|\bcystoprostatectomy|\bprostatectomy|\b(hemi)?nephrectomy|\bnephroureterectomy|\bnux\b|\brnu\b|\brplnd\b|retroperitoneal lymph|pelvic lymph node|\bplnd\b|inguinal lymph|\bilnd\b|adrenalectomy|orchiectomy|orchidectomy|\bbcg\b|mitomycin|gemcitabine|intravesical (bcg|chemo|mitomycin|gemcitabine)|prostate biopsy|prostatic biopsy|\btrus\b|fusion biopsy|transperineal biopsy|bladder biopsy|cold cup|penectomy|urethrectomy|brachytherapy|cryoablation|\bhifu\b|renal mass|kidney mass|\brarp\b|\bralp\b|\brarc\b|\brapn\b|\blpn\b|\blrn\b|partial neph|radical neph|ureteroscopic (biopsy|ablation|laser ablation)|upper tract (tumou?r|urothelial)/],
  ["andrology", /penile|\bpenis\b|prosthes|\bipp\b|plication|nesbit|peyronie|corporoplasty|tunica|plaque incision|plaque excision|xiaflex|collagenase|vasectomy|vasovasostomy|vasoepididymostomy|\bvasal\b|\bvv\b|\bve\b|\btese\b|microtese|micro tese|sperm|\bpesa\b|\bmesa\b|\btesa\b|varicocel|priapism|erectile|testicular implant|testis implant|spermatocel|epididym|infertil|ejaculat|\btured\b|seminal vesic|vasogram|crural ligation|glans|phalloplasty|scrotoplasty|metoidioplasty|testis biopsy|testicular biopsy|testis fna|cord denervation|spermatic cord/],
  ["functional", /\bsling\b|\btvt\b|\btot\b|botox|botulinum|onabot|neuromodulation|interstim|sacral nerve|\bsnm\b|\bptns\b|tibial nerve|prolapse|colporrhaphy|colpopexy|sacrocolpopexy|cystocele|rectocele|bulking|bulkamid|macroplastique|urethral diverticul|vesicovaginal|urodynamic|artificial urinary sphincter|\baus\b|proact|continence balloon|incontinence|bladder neck closure|vestibulectomy|bartholin/],
  ["reconstruction", /urethroplasty|(urethr|ureter|bulbar|meatal|bladder neck)[a-z]* (stricture|stenosis|contracture)|stricture (repair|incision|dilation|dilatation)|reimplant|ureteroneocystostomy|pyeloplasty|bladder augment|augmentation cystoplasty|cystoplasty|ureteroureterostomy|ureterocalicostomy|\bboari\b|psoas hitch|ileal ureter|mitrofanoff|appendicovesicostomy|buccal|urethrotomy|optilume|urethrostomy|urinary diversion|neobladder|ileal conduit|\bconduit\b|(urethr|vesic|ureter|bladder)[a-z]* .*fistula|fistula .*(urethr|vesic|bladder)|vaginoplasty|buried penis|ureterolysis|(urethral|ureteral|ureteric|bladder|genital) reconstruct/],
  ["endo-stones", /ureteroscop|ureterorenoscop|\burs\b|\bfurs\b|\brirs\b|\bpcnl\b|nephrolith|lithotri|litholapax|\beswl\b|\bswl\b|(renal|kidney|ureteric|ureteral|ureter|bladder|staghorn|urinary|uric) (stone|calcul)|urolithiasis|cystolith|ureter[a-z]* stent|\bjj\b|double j|\bdj stent|stent (insertion|exchange|removal|change|placement)|nephrostomy|\bpcn\b|retrograde pyelogra|\brpg\b|percutaneous (renal )?access/],
  ["general", /cystoscop|\bcysto\b|suprapubic|\bspc\b|catheter|clot evacuation|bladder washout|urethral dilat|examination under an|\beua\b|ha?ematuria|orchialgia|testicular pain/],
];

const GENERAL_SURGERY_RULES: Rule[] = [
  ["surg-onc", /sarcoma|melanoma|\bhipec\b|cytoreduct|peritonectomy|\bgist\b/],
  ["breast-endocrine", /breast|mastectomy|lumpectomy|sentinel|axillary|thyroid|parathyroid|adrenal/],
  ["hernia", /hernia|herniorrhaphy|hernioplasty|abdominal wall|component separation|diastasis/],
  ["upper-gi", /bariatric|sleeve|gastric bypass|\broux|gastrectomy|fundoplication|nissen|toupet|hiatal|hiatus|heller|achalasia|esophag|oesophag|\bpeg\b|gastrostomy|jejunostomy|duodenal switch|gastric band/],
  ["hpb", /cholecyst|gallbladder|\bcbd\b|common bile duct|biliary|\bercp\b|hepatectomy|hepatic|\bliver\b|pancrea|whipple|splenectomy|choledoch/],
  ["acute-care", /appendic|laparotomy|trauma|perforat|obstruction|adhesiolysis|incision and drainage|\bi d\b|abscess|necrotizing|debridement/],
  ["colorectal", /colect|hemicolect|sigmoid|rectal|rectum|anterior resection|\bapr\b|abdominoperineal|hartmann|ileostomy|colostomy|stoma|hemorrhoid|haemorrhoid|fistula in ano|\banal\b|pilonidal|small bowel/],
  ["general", /\bport\b|central line|\bpicc\b|\bcvc\b|vascular access|lipoma|cyst excision|lymph node biopsy|skin lesion|wound/],
];

const RULES: Record<string, Rule[]> = {
  urology: UROLOGY_RULES,
  "general-surgery": GENERAL_SURGERY_RULES,
};

// ── Specialty of the user ───────────────────────────────────────────────────

/** "Urology" / "urology" / "Andrology" -> SPECIALTIES slug, or null. */
export function specialtySlug(value?: string | null): string | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  const hit = SPECIALTIES.find((s) => s.slug === v || s.name.toLowerCase() === v);
  return hit ? hit.slug : null;
}

export interface CaseLike {
  procedureName: string;
  specialtyId?: string | null;
  procedureDefinitionId?: string | null;
}

/**
 * The user's specialty: profile first; otherwise the most common specialty
 * slug stored on their cases. Null when nothing is known.
 */
export function inferUserSpecialty(profileSpecialty: string | null | undefined, cases: CaseLike[]): string | null {
  const fromProfile = specialtySlug(profileSpecialty);
  if (fromProfile) return fromProfile;
  const votes = new Map<string, number>();
  for (const c of cases) {
    const slug = specialtySlug(c.specialtyId ?? null);
    if (slug && slug !== "other") votes.set(slug, (votes.get(slug) ?? 0) + 1);
  }
  const top = [...votes.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : null;
}

// ── Case -> section ─────────────────────────────────────────────────────────

export interface ResolvedSection extends Section {
  offService: boolean;
}

function sectionOf(specialty: string, key: SectionKey): ResolvedSection {
  const def = (SPECIALTY_SECTIONS[specialty] ?? []).find((s) => s.key === key);
  return def ? { ...def, offService: false } : { ...OTHER, offService: false };
}

const offService = (): ResolvedSection => ({ ...OFF_SERVICE, offService: true });
const other = (): ResolvedSection => ({ ...OTHER, offService: false });

/**
 * Resolve one case to a section of the user's specialty, "Off-service" when it
 * clearly belongs to a different specialty, or "Other".
 */
export function resolveCaseSection(c: CaseLike, userSpecialty: string | null): ResolvedSection {
  const norm = normalizeProcedureName(c.procedureName ?? "");
  const user = userSpecialty && SPECIALTY_SECTIONS[userSpecialty] ? userSpecialty : null;
  const userFamily = user ? familyOf(user) : null;

  // Andrology fellows: the SMSNA form's categories come first.
  if (user === "smsna") {
    const smsnaKey = SMSNA_INDEX.get(norm);
    if (smsnaKey) return sectionOf("smsna", smsnaKey);
  }

  // A case explicitly filed under a different, unrelated specialty.
  const caseSlug = specialtySlug(c.specialtyId ?? null);
  const filedElsewhere = !!(userFamily && caseSlug && caseSlug !== "other" && familyOf(caseSlug) !== userFamily);

  // 1. Library id (rare: live procedureDefinitionId values are DB cuids).
  const byId = c.procedureDefinitionId ? SECTION_BY_PROCEDURE_ID[c.procedureDefinitionId] : undefined;
  if (byId) {
    if (!user) return other();
    if (familyOf(byId.specialty) === userFamily) return user === "smsna" ? other() : sectionOf(byId.specialty, byId.section);
    return offService();
  }

  if (!user) return other();
  const rules = RULES[userFamily!] ?? [];

  // 2. Exact name / alias match in the user's own specialty family.
  const exact = NAME_INDEX.get(norm) ?? [];
  const own = exact.find((p) => familyOf(p.specialty) === userFamily);
  if (own && !filedElsewhere) {
    return user === "smsna" ? other() : sectionOf(own.specialty, libraryProcedureSection(own));
  }

  // 3. Keyword rules for the user's specialty.
  if (!filedElsewhere) {
    for (const [key, re] of rules) {
      if (re.test(norm)) return user === "smsna" ? other() : sectionOf(userFamily!, key);
    }
  }

  // 4. Exact match only in another specialty, or filed under another one.
  if (exact.length > 0 || filedElsewhere) return offService();

  // 5. Close token match against the library.
  const fuzzy = fuzzyLibraryMatch(norm, user);
  if (fuzzy) {
    if (familyOf(fuzzy.specialty) === userFamily) {
      return user === "smsna" ? other() : sectionOf(fuzzy.specialty, libraryProcedureSection(fuzzy));
    }
    return offService();
  }

  return other();
}

// ── Breakdown for charts ────────────────────────────────────────────────────

export interface SectionCount extends Section {
  count: number;
  /** Share of all cases, 0-100. */
  pct: number;
  /** Share of this section's cases done independently or teaching, 0-100. */
  independentPct: number;
  offService: boolean;
}

/**
 * Cases per section of the user's specialty, ranked by count. Off-service and
 * Other are always listed last. Sections with no cases are omitted unless
 * `includeEmpty` is set (the PD coverage grid wants every column).
 */
export function sectionBreakdown(
  cases: (CaseLike & { autonomyLevel?: string | null })[],
  userSpecialty: string | null,
  opts: { includeEmpty?: boolean } = {},
): SectionCount[] {
  const counts = new Map<string, { section: ResolvedSection; n: number; indep: number }>();
  for (const c of cases) {
    const s = resolveCaseSection(c, userSpecialty);
    const row = counts.get(s.key) ?? { section: s, n: 0, indep: 0 };
    row.n++;
    if (c.autonomyLevel === "INDEPENDENT" || c.autonomyLevel === "TEACHING") row.indep++;
    counts.set(s.key, row);
  }
  if (opts.includeEmpty && userSpecialty && SPECIALTY_SECTIONS[userSpecialty]) {
    for (const s of SPECIALTY_SECTIONS[userSpecialty]) {
      if (!counts.has(s.key)) counts.set(s.key, { section: { ...s, offService: false }, n: 0, indep: 0 });
    }
  }
  const total = cases.length || 1;
  const tail = (k: string) => (k === OFF_SERVICE.key ? 2 : k === OTHER.key ? 1 : 0);
  return [...counts.values()]
    .map(({ section, n, indep }) => ({
      key: section.key,
      label: section.label,
      offService: section.offService,
      count: n,
      pct: Math.round((n / total) * 1000) / 10,
      independentPct: n > 0 ? Math.round((indep / n) * 100) : 0,
    }))
    .sort((a, b) => tail(a.key) - tail(b.key) || b.count - a.count || a.label.localeCompare(b.label));
}
