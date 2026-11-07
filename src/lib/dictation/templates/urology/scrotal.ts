// ---------------------------------------------------------------------------
// Urology — Scrotal / inguinal procedure templates
// ---------------------------------------------------------------------------

import type { ProcedureTemplate } from "../types";

// ---------------------------------------------------------------------------
// Scrotal exploration / bilateral orchiopexy for testicular torsion
// Source: matches the user's example #3 attending dictation
// ---------------------------------------------------------------------------

export const SCROTAL_EXPLORATION_TORSION: ProcedureTemplate = {
  key: "urology.scrotal.scrotal_exploration_torsion",
  specialty: "urology",
  subcategory: "scrotal",
  procedureName: "Scrotal exploration with bilateral orchiopexy",
  synonyms: ["scrotal exploration", "testicular torsion", "torsion", "spermatic cord torsion"],
  matchPatterns: [
    /\bscrotal\s+exploration\b/i,
    /\b(testicular|spermatic\s+cord)\s+torsion\b/i,
    /\btorsion\b/i,
  ],
  topMatter: {
    anesthesia: "General endotracheal anesthesia (urgent — expedited consent given suspected testicular torsion).",
    position: "Supine.",
    prep: "Genitalia prepped with chlorhexidine and draped in the usual sterile fashion. Pre-incision antibiotic prophylaxis (cefazolin 2 g IV) within 60 minutes.",
    ebl: "Minimal.",
    disposition: "The patient tolerated the procedure well and was transferred to recovery. Plan: overnight observation with discharge in the morning if clinically well.",
  },
  findings: {
    headline: "[Right / Left] testis noted to be torsed approximately [360° / 540° / 720°]. The testis was markedly edematous, firm, and [purple / dusky / black] in colour, extending proximally toward the spermatic cord.",
    supporting: [
      "Following detorsion and warm saline-soaked gauze application, there was [gradual / rapid / no] return of perfusion with [improvement in colour, particularly of the spermatic cord, and partial improvement in testicular appearance / no return of viable colour despite reperfusion].",
      "The contralateral testis appeared normal.",
      "Reactive hydrocele fluid was [serous / serosanguinous / dark].",
    ],
  },
  operativeSteps: {
    steps: [
      "Given the urgency of suspected testicular torsion (every additional hour of warm ischemia drops salvage rates by ~10%; > 80% salvage at < 6 h vs < 20% at > 24 h, Visser series), the case was expedited from consent to incision.",
      "A midline scrotal raphe incision was made with a #15 blade and carried down through the dartos muscle layer, exposing the [left / right] hemiscrotum.",
      "The tunica vaginalis was identified and opened, releasing reactive hydrocele fluid; the testis was delivered into the wound by gentle traction.",
      "The affected testis was confirmed to be torsed approximately [360° / 540° / 720°] in the [counterclockwise (most common, on the left) / clockwise (more common on the right)] direction. The cord was untwisted with manual detorsion (\"open-like-a-book\" — outward for both sides).",
      "The testis was wrapped in warm saline-soaked gauze and left in situ to reperfuse for 5–10 minutes.",
      "Attention turned to the contralateral testis for prophylactic orchiopexy: the bell-clapper deformity is bilateral in 80% of patients, mandating contralateral fixation regardless of presenting laterality. A subdartos pouch was developed by elevating scrotal skin off the dartos with sharp dissection.",
      "The contralateral testis was delivered, inspected (normal), and secured with a 3-point orchiopexy using 4-0 PDS interrupted sutures placed through the tunica albuginea at the medial, lateral, and inferior aspects, anchored to the dartos within the subdartos pouch.",
      "Attention was returned to the originally torsed testis after the 5–10 minute reperfusion interval. [Salvage variant:] The spermatic cord showed return of healthy pink colour and the testis demonstrated clear improvement compared to initial presentation. The decision was made to proceed with orchiopexy rather than orchiectomy. A subdartos pouch was developed on this side, and a 3-point orchiopexy was performed using 4-0 PDS sutures in the medial, lateral, and inferior positions. [Orchiectomy variant:] The testis remained black, firm, with no return of pink colour or surface bleed despite warm saline application — non-viable. The cord was double-clamped, divided sharply between the clamps, and triple suture-ligated with 0 silk on the proximal stump. The non-viable testis was removed and submitted to pathology.",
    ],
    closure: "The dartos layer was closed with running 3-0 Vicryl, approximating from the lateral aspects toward the midline to ensure hemostasis along the closure. The skin was closed with interrupted 5-0 Monocryl sutures. A scrotal support was applied with a scrotal weight for approximately 2 hours postoperatively for compression hemostasis.",
  },
  devices: {
    instruments: ["#15 blade for midline scrotal incision", "Standard scrotal exploration tray"],
    consumables: ["Warm saline", "4-0 PDS × 6 for 3-point bilateral orchiopexy", "3-0 Vicryl for dartos closure", "5-0 Monocryl for skin"],
  },
  specimens: {
    default: "None.",
    alternates: [
      { when: /orchiectom/i, text: "Non-viable testis to pathology." },
    ],
  },
  tubesAndDrains: { default: "None. Scrotal support with scrotal weight for ~2 h postoperatively." },
  complicationChecks: [
    { label: "Testicular non-viability requiring orchiectomy" },
    { label: "Late testicular atrophy (30–50% if presentation > 6 h)" },
    { label: "Scrotal hematoma" },
    { label: "Wound infection" },
  ],
  postopPlan: {
    disposition: "Overnight observation; discharge in the morning if clinically well.",
    analgesia: "Acetaminophen + NSAID; opioid sparingly.",
    antibiotics: "Single perioperative dose only (clean field).",
    activity: "Scrotal support × 1 week; ice over the first 48 hours; no strenuous activity × 2 weeks.",
    followup: [
      "Salvage variant: scrotal ultrasound at 6–12 weeks to assess for atrophy",
      "Orchiectomy variant: counselling re: hormonal status (contralateral sufficient) and prosthesis discussion at clinic",
      "Future fertility counselling deferred to clinic for both variants",
    ],
    returnPrecautions: [
      "Fevers > 38.5°C, increasing scrotal pain or swelling, wound concerns",
      "New scrotal mass on the salvaged side (atrophy → testicular cancer surveillance reasoning)",
    ],
  },
  requiredFields: [
    { id: "presenting_laterality", label: "Presenting laterality", type: "laterality" },
    { id: "torsion_degrees", label: "Degrees of torsion", type: "enum", options: ["180", "360", "540", "720", "Multiple turns"] },
    { id: "ischemia_duration_hours", label: "Symptom duration to OR (hours)", type: "number" },
    { id: "viability_outcome", label: "Outcome", type: "enum", options: ["Salvaged — bilateral orchiopexy", "Orchiectomy + contralateral orchiopexy"] },
    { id: "reperfusion_minutes", label: "Reperfusion interval (min)", type: "number" },
    { id: "fixation_sutures", label: "Fixation suture", type: "enum", options: ["4-0 PDS × 3 points", "3-0 Prolene × 3 points", "Other"] },
  ],
  billingPrompts: [
    "Specify whether contralateral orchiopexy was performed.",
    "Document orchiectomy if performed (separate billing code).",
  ],
};

// ---------------------------------------------------------------------------
// Vasectomy
// ---------------------------------------------------------------------------

export const VASECTOMY: ProcedureTemplate = {
  key: "urology.scrotal.vasectomy",
  specialty: "urology",
  subcategory: "scrotal",
  procedureName: "Bilateral no-scalpel vasectomy",
  synonyms: ["vasectomy", "no-scalpel vasectomy"],
  matchPatterns: [/\bvasectom/i],
  topMatter: {
    anesthesia: "Local anesthesia (1% lidocaine spermatic cord block); IV sedation optional.",
    position: "Supine.",
    prep: "Scrotum prepped with chlorhexidine and draped sterilely.",
    ebl: "Minimal.",
    disposition: "Discharge home from clinic / day surgery same-day with scrotal support and ice.",
  },
  findings: {
    headline: "Bilateral vasa deferentia palpable and isolated through small midline scrotal punctures using the no-scalpel technique. No vascular abnormalities or unexpected anatomy.",
  },
  operativeSteps: {
    steps: [
      "Bilateral spermatic cord blocks were placed with 1% lidocaine using a 27-gauge needle to anaesthetise each vas at the upper scrotum.",
      "On the right side: the vas was palpated through the scrotal skin, immobilised between the operator's thumb and finger, and brought to the surface. A single midline puncture was made through the scrotal skin with sharp ringed forceps (no-scalpel technique).",
      "The vas was isolated through the puncture, freed from surrounding fascia, and a 1-cm segment was excised between two clamps.",
      "Luminal cautery (low-current) was applied to both lumens to ensure occlusion, and a fascial interposition was performed by suturing the vasal sheath over one cut end with 4-0 chromic — driving the failure rate to ~0.5% (no-scalpel + cautery + fascial interposition is the gold-standard combination per RCSU + AUA guideline).",
      "The contralateral side was completed with the identical technique through the same midline puncture (or a second puncture per surgeon preference).",
      "Excised segments were submitted to pathology to confirm vasal tissue (medico-legal documentation of the procedure).",
    ],
    closure: "The midline puncture was closed with a single 5-0 chromic suture (or left open for primary closure by secondary intention).",
  },
  devices: {
    instruments: ["Sharp ringed forceps (no-scalpel set)", "Vas-isolating ringed forceps", "Low-current cautery"],
    consumables: ["1% lidocaine", "4-0 chromic for fascial interposition", "5-0 chromic for skin"],
  },
  specimens: {
    default: "Bilateral excised vas deferens segments to pathology to confirm vasal tissue.",
  },
  tubesAndDrains: { default: "None." },
  complicationChecks: [
    { label: "Hematoma (1–2%)" },
    { label: "Vasitis nodosa" },
    { label: "Sperm granuloma" },
    { label: "Failure / recanalisation (~0.5% with no-scalpel + cautery + fascial interposition)" },
    { label: "Chronic post-vasectomy pain syndrome (1–3% — counselled preop)" },
  ],
  postopPlan: {
    disposition: "Discharge home immediately.",
    analgesia: "Acetaminophen + NSAID; opioid not routinely required.",
    antibiotics: "Not routinely indicated.",
    activity: "Scrotal support × 1 week; ice × 48 h; no heavy lifting × 1 week; no intercourse × 1 week.",
    followup: [
      "Post-vasectomy semen analysis at 8–16 weeks to confirm azoospermia per AUA — backup contraception MANDATORY until two consecutive azoospermic samples (or rare nonmotile sperm < 100,000/mL)",
    ],
    returnPrecautions: [
      "Hematoma (firm scrotal swelling)",
      "Wound infection",
      "Persistent pain > 3 months (chronic post-vasectomy pain syndrome — refer to urology)",
    ],
  },
  requiredFields: [
    { id: "technique", label: "Technique", type: "enum", options: ["No-scalpel + cautery + fascial interposition (gold standard)", "Conventional incision", "Other"] },
    { id: "fascial_interposition", label: "Fascial interposition performed", type: "boolean" },
    { id: "luminal_cautery", label: "Luminal cautery performed", type: "boolean" },
    { id: "specimen_to_pathology", label: "Specimens to pathology", type: "boolean" },
  ],
};

// ---------------------------------------------------------------------------
// Hydrocelectomy
// ---------------------------------------------------------------------------

export const HYDROCELECTOMY: ProcedureTemplate = {
  key: "urology.scrotal.hydrocelectomy",
  specialty: "urology",
  subcategory: "scrotal",
  procedureName: "Hydrocelectomy",
  synonyms: ["hydrocelectomy", "hydrocele repair", "jaboulay", "lord plication"],
  matchPatterns: [/\bhydrocele/i],
  topMatter: {
    anesthesia: "General or spinal anesthesia.",
    position: "Supine.",
    prep: "Scrotum prepped with chlorhexidine and draped sterilely.",
    ebl: "Minimal.",
    disposition: "Discharge home same-day.",
  },
  findings: {
    headline: "[Right / Left] communicating / non-communicating hydrocele, sac volume approximately ___ mL of clear yellow [or serosanguinous] fluid drained intraoperatively. Underlying testis and epididymis confirmed normal on direct inspection. Pre-incision transillumination confirmed clear fluid (rules out hematocele or solid intratesticular pathology).",
  },
  operativeSteps: {
    steps: [
      "Pre-incision transillumination of the scrotal mass confirmed a clear, fluid-filled sac without solid components — supporting the clinical diagnosis of hydrocele rather than hematocele or testicular tumor.",
      "A 4-5 cm transverse [hemiscrotal / median raphe] incision was made over the most prominent point of the sac and carried down through the dartos with monopolar electrocautery.",
      "The hydrocele sac was identified, freed circumferentially from surrounding scrotal tissue, and delivered into the wound. The sac was opened sharply with a #15 blade; clear / serosanguinous fluid (~___ mL) was suctioned for measurement.",
      "The testis and epididymis were inspected and confirmed normal on direct vision; cord structures preserved.",
      "[Jaboulay sac eversion (preferred for moderate-to-large hydroceles): the redundant tunica was trimmed leaving a 1 cm cuff, then everted behind the cord and sutured to itself with running 3-0 Vicryl in continuous spiral fashion from the cord caudally to the dependent pole, securing the sac in an everted position so it cannot re-form.] OR [Lord plication (preferred for small sacs to reduce hematoma risk): the redundant sac was plicated radially with 6-8 interrupted 3-0 Vicryl bites placed in spoke-wheel fashion from the testis tunica out to the free edge of the opened sac, gathering the redundant tunica without excision.]",
      "Sac edges and dartos were inspected for hemostasis; bipolar cautery applied focally to small bleeders. A small Penrose drain was [placed in the dependent dartos and brought out through a separate stab incision, secured with 2-0 silk, for very large sacs > 200 mL or oozing dissection beds / not placed for smaller cases].",
    ],
    closure: "Dartos closed with running 3-0 Vicryl. Scrotal skin closed with 4-0 chromic interrupted vertical mattress (interrupted preferred over subcuticular here — better hemostasis at the wound edge in the dependent scrotum). Sterile dressing + scrotal support applied.",
  },
  devices: {
    instruments: ["Standard scrotal tray", "Bipolar cautery", "Monopolar electrocautery for dartos"],
    consumables: ["3-0 Vicryl × 6-8 (Lord) or running × 1 (Jaboulay)", "4-0 chromic interrupted for skin", "Optional small Penrose drain for large sacs"],
  },
  specimens: { default: "Hydrocele sac fluid measured (~___ mL) and discarded; sac wall to pathology only if unusual gross appearance (mesothelial papilloma, mass)." },
  tubesAndDrains: {
    default: "None routinely.",
    alternates: [
      { when: /large|giant/i, text: "Small Penrose drain placed in dependent dartos for large sacs > 200 mL — removed POD 1." },
    ],
  },
  complicationChecks: [
    { label: "Postoperative hematoma (5-15%)" },
    { label: "Wound infection" },
    { label: "Recurrence (< 5% with proper technique)" },
    { label: "Inadvertent vas / cord injury" },
  ],
  postopPlan: {
    disposition: "Discharge home same-day.",
    analgesia: "Acetaminophen + NSAID; ice packs × 48 h.",
    antibiotics: "Single perioperative dose only.",
    activity: "Scrotal support × 1-2 weeks; no heavy lifting × 4 weeks.",
    followup: ["Clinic at 4-6 weeks for wound check and recurrence assessment"],
    returnPrecautions: ["Worsening swelling (suggests hematoma)", "Wound discharge / fever", "Persistent firmness > 6 weeks (suggests recurrence)"],
  },
  requiredFields: [
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "sac_volume_ml", label: "Sac fluid volume (mL)", type: "number" },
    { id: "transillumination_confirmed", label: "Pre-incision transillumination confirmed clear fluid", type: "boolean" },
    { id: "technique", label: "Technique", type: "enum", options: ["Jaboulay (sac eversion)", "Lord plication", "Excisional sac trimming"] },
    { id: "incision_length_cm", label: "Incision length (cm)", type: "number" },
    { id: "drain_placed", label: "Drain placed", type: "boolean" },
  ],
};

// ---------------------------------------------------------------------------
// Circumcision
// ---------------------------------------------------------------------------

export const CIRCUMCISION: ProcedureTemplate = {
  key: "urology.scrotal.circumcision",
  specialty: "urology",
  subcategory: "scrotal",
  procedureName: "Circumcision",
  synonyms: ["circumcision"],
  matchPatterns: [/\bcircumcis/i],
  topMatter: {
    anesthesia: "General anesthesia or local with sedation; dorsal penile nerve block always performed at the start.",
    position: "Supine.",
    prep: "Penis prepped with povidone-iodine and draped.",
    ebl: "Minimal.",
    disposition: "Discharge home same-day.",
  },
  findings: {
    headline: "Adequate redundant foreskin for sleeve resection; [phimosis / paraphimosis / cosmetic indication / recurrent balanitis]. No abnormalities of the glans or meatus.",
  },
  operativeSteps: {
    steps: [
      "Dorsal penile nerve block was performed bilaterally with 5-10 mL of 1% lidocaine WITHOUT epinephrine (epinephrine is contraindicated in penile blocks — risk of ischemic injury to an end-artery organ); ring block at the penile base added if persistent sensation.",
      "The foreskin was retracted and any preputial adhesions to the glans were lysed bluntly with a probe; the coronal sulcus was inspected.",
      "[For tight phimosis with a non-retractable ring, a dorsal slit was made first to relieve the constriction, then the foreskin reduced and the standard sleeve technique applied. Otherwise, the standard double-incision sleeve was performed directly.]",
      "The proposed coronal incision line was marked circumferentially on the outer surface of the foreskin, just proximal to the corona.",
      "A second incision was marked on the inner surface of the foreskin, leaving a sufficient mucosal collar of 5-8 mm (insufficient collar leads to dehiscence; excessive collar leaves redundant inner skin that contracts later).",
      "Both incisions were made with a #15 blade through skin and dartos to the deep fascia of the penis (Buck's fascia preserved). The intervening foreskin was excised as a sleeve and submitted as a single specimen for measurement.",
      "Frenulum was [preserved (intact and not contracted) / divided and sutured with figure-of-eight 4-0 chromic to address frenular bleeding (the most common late bleeding source) / formally frenuloplasty performed for tight frenulum].",
      "Hemostasis was secured at the dartos vessels with low-power bipolar cautery (8-15 W coagulation setting; never above 20 W — risk of deep coagulation injury to corpora or urethra). Specific attention was paid to the 4 and 8 o'clock positions where the dorsal vessels are most prominent.",
    ],
    closure: "The mucosal collar and shaft skin edges were re-approximated with 6-8 interrupted 5-0 chromic sutures circumferentially (chromic chosen for absorbability without pediatric suture removal). A petroleum-impregnated gauze dressing was applied with the penis taped to the lower abdomen for 24 h to reduce edema.",
  },
  devices: {
    instruments: ["Standard penile tray", "Bipolar cautery"],
    consumables: ["1% lidocaine for dorsal nerve block", "5-0 chromic sutures"],
  },
  specimens: { default: "Foreskin specimen — discarded (or to pathology if pre-malignant lesion suspected)." },
  tubesAndDrains: { default: "Petroleum-gauze dressing only." },
  complicationChecks: [
    { label: "Bleeding requiring return to OR (1–2%)" },
    { label: "Wound dehiscence" },
    { label: "Meatal stenosis (long-term)" },
    { label: "Cosmetic dissatisfaction (skin redundancy or insufficient skin)" },
  ],
  postopPlan: {
    disposition: "Discharge home same-day.",
    analgesia: "Acetaminophen + NSAID; topical lidocaine ointment for first 24 h.",
    antibiotics: "Single perioperative dose only.",
    activity: "No intercourse × 6 weeks; sponge baths × 1 week; minimal physical activity.",
    diet: "As tolerated.",
    followup: ["Clinic at 4–6 weeks for wound check"],
    returnPrecautions: ["Active bleeding > 30 min", "Inability to void", "Fevers / wound infection"],
  },
  requiredFields: [
    { id: "indication", label: "Indication", type: "enum", options: ["Phimosis", "Paraphimosis", "Recurrent balanitis", "Cosmetic", "Religious / cultural", "Pre-malignant lesion (e.g., BXO)"] },
    { id: "technique", label: "Technique", type: "enum", options: ["Sleeve resection", "Plastibell (pediatric)", "Mogen / Gomco (pediatric)"] },
  ],
};

// Aggregate
export const SCROTAL_TEMPLATES: ProcedureTemplate[] = [
  SCROTAL_EXPLORATION_TORSION,
  VASECTOMY,
  HYDROCELECTOMY,
  CIRCUMCISION,
];
