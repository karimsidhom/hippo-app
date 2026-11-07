// ---------------------------------------------------------------------------
// ENT — procedure-specific dictation templates
// ---------------------------------------------------------------------------

import type { ProcedureTemplate } from "./types";

const e = (
  partial: Pick<
    ProcedureTemplate,
    | "key"
    | "subcategory"
    | "procedureName"
    | "synonyms"
    | "matchPatterns"
    | "topMatter"
    | "findings"
    | "operativeSteps"
    | "devices"
    | "specimens"
    | "tubesAndDrains"
    | "complicationChecks"
    | "postopPlan"
    | "requiredFields"
  > & Partial<Pick<ProcedureTemplate, "billingPrompts" | "optionalFields" | "notes">>,
): ProcedureTemplate => ({ specialty: "ent", ...partial });

export const TONSILLECTOMY = e({
  key: "ent.airway.tonsillectomy",
  subcategory: "airway",
  procedureName: "Tonsillectomy",
  synonyms: ["tonsillectomy", "t&a", "tonsillectomy and adenoidectomy"],
  matchPatterns: [/\btonsillectom|\bt\s*&\s*a\b/i],
  topMatter: {
    anesthesia: "General endotracheal with oral RAE tube taped to lower lip; nasal cuff inflated.",
    position: "Supine with shoulder roll for neck extension; Crowe-Davis mouth gag with appropriate-size blade in suspension.",
    prep: "Oral cavity inspected; no skin prep needed.",
    ebl: "Minimal — under 50 mL.",
    disposition: "Same-day discharge for most adults; admission for OSA patients with AHI > 30 and pediatric < 3 yrs.",
  },
  findings: {
    headline: "Bilateral palatine tonsils [Brodsky grade 1-4]; cryptic / chronically inflamed appearance. Tonsillar fossae after removal: hemostatic without bleeding from arterial branches. [Adenoid pad: ___ percent obstruction of nasopharynx — removed under mirror visualisation when adenoidectomy performed.]",
  },
  operativeSteps: {
    steps: [
      "Crowe-Davis mouth gag inserted; oral RAE endotracheal tube secured in midline.",
      "Tongue depressed; uvula retracted; tonsillar pillars and posterior pharyngeal wall inspected.",
      "[Coblation technique:] Coblator wand at hemostasis setting (3); mucosal incision along anterior pillar carried into tonsillar capsule plane; tonsil dissected from inferior to superior in the avascular subcapsular plane; pedicle at superior pole sealed with coblation; specimen removed.",
      "[Monopolar electrocautery technique:] Tonsil grasped at superior pole with Allis clamp; mucosa incised along anterior pillar with monopolar at 15 W coagulation; capsular plane developed; tonsil dissected inferior to superior; inferior pedicle controlled with monopolar.",
      "Hemostasis at tonsillar fossae secured with monopolar / coblator at 8-12 W coagulation; care taken to avoid injury to inferior tonsillar artery branches and parapharyngeal vessels.",
      "Contralateral tonsil removed identically.",
      "[For T&A: nasopharyngeal mirror placed; adenoid pad visualised; curette / coblator / shaver used to remove adenoid tissue with care to avoid eustachian tube orifices laterally and tubal tonsils.]",
      "Final inspection of fossae: dry, no bleeding. Tonsillar fossae packed with saline-soaked gauze for 1 minute then re-inspected.",
    ],
  },
  devices: {
    instruments: ["Crowe-Davis mouth gag with assorted blades", "Coblator wand or monopolar electrocautery", "Tonsil curette / shaver (for adenoidectomy)", "Yankauer suction"],
  },
  specimens: { default: "Bilateral palatine tonsils to pathology — confirms histology and rules out occult lymphoma in unilateral asymmetric cases." },
  tubesAndDrains: { default: "None." },
  complicationChecks: [
    { label: "Primary hemorrhage (within 24 h — usually venous)" },
    { label: "Secondary hemorrhage (POD 5-10 — eschar sloughing; can be life-threatening)" },
    { label: "Postoperative airway compromise (OSA patients)" },
    { label: "Dehydration from poor oral intake" },
    { label: "Velopharyngeal insufficiency (rare; adenoidectomy can unmask)" },
  ],
  postopPlan: {
    disposition: "Discharge home same-day for most adults; admission for OSA AHI > 30 and pediatric < 3 yrs.",
    analgesia: "Acetaminophen + ibuprofen scheduled (no opioid in pediatric per FDA black-box for codeine; cautious in adults); ice pack to neck.",
    antibiotics: "Not routine.",
    activity: "Light activity × 2 weeks; soft cool diet × 7-14 days; no straws (suction can dislodge eschar).",
    followup: ["Clinic at 2-3 weeks for healing check"],
    returnPrecautions: [
      "Active bleeding from mouth (ANY bleeding day 5-10 — secondary hemorrhage emergency, can rapidly become life-threatening)",
      "Inability to maintain oral intake / signs of dehydration",
      "Fever > 38.5°C, increasing pain at day 7+",
    ],
  },
  requiredFields: [
    { id: "indication", label: "Indication", type: "enum", options: ["Recurrent tonsillitis (Paradise criteria)", "Obstructive sleep apnea", "Tonsillar asymmetry / suspected lymphoma", "Peritonsillar abscess (interval)", "Other"] },
    { id: "technique", label: "Technique", type: "enum", options: ["Coblation", "Monopolar electrocautery", "Bipolar dissection", "Cold steel + bipolar"] },
    { id: "adenoidectomy", label: "Concomitant adenoidectomy", type: "boolean" },
    { id: "brodsky_grade", label: "Brodsky tonsil grade", type: "enum", options: ["1", "2", "3", "4"] },
  ],
});

export const SEPTOPLASTY = e({
  key: "ent.rhinology.septoplasty",
  subcategory: "rhinology",
  procedureName: "Septoplasty",
  synonyms: ["septoplasty", "nasal septoplasty"],
  matchPatterns: [/\bseptoplasty/i],
  topMatter: {
    anesthesia: "General endotracheal with oral RAE tube; topical 4% cocaine + injected 1% lidocaine with epinephrine to nasal mucosa for hemostasis.",
    position: "Supine with shoulder roll; head slightly elevated for venous drainage.",
    prep: "Topical decongestant (oxymetazoline / phenylephrine pledgets) placed bilaterally for 5-10 min.",
    ebl: "Minimal under 50 mL.",
    disposition: "Discharge home same-day.",
  },
  findings: {
    headline: "Septal deviation [right / left] with [anterior cartilaginous / posterior bony / combined] component. Spurs at [___ ]. Inferior turbinates hypertrophic — [submucous resection / outfracture / radiofrequency reduction] performed. Final nasal cavity widely patent bilaterally; septum midline and stable.",
  },
  operativeSteps: {
    steps: [
      "Oxymetazoline / phenylephrine pledgets placed bilaterally × 5-10 min for mucosal decongestion.",
      "1% lidocaine + 1:100,000 epinephrine injected submucoperichondrially along the septum bilaterally.",
      "Hemitransfixion incision at the caudal end of the cartilaginous septum (Killian incision is alternative).",
      "Mucoperichondrial flap elevated with Cottle elevator on one side; mucoperiosteal flap continues posteriorly over the bony septum.",
      "Cartilaginous septum incised carefully (preserving 1.5 cm dorsal + 1.5 cm caudal L-strut for nasal tip / dorsal support — violation causes saddle nose deformity).",
      "Deviated cartilage and bone removed (perpendicular plate of ethmoid + vomer + maxillary crest).",
      "[Spurs / large deviated segments scored / morselised / replaced as cartilage graft to dorsal septum if needed.]",
      "Mucoperichondrial flap re-approximated with quilting suture (4-0 plain gut on Keith needle in mattress fashion through both sides) to obliterate dead space.",
      "[Inferior turbinate reduction: submucous resection with microdebrider, outfracture with Boies elevator, or radiofrequency reduction.]",
      "Hemitransfixion incision closed with 4-0 chromic.",
      "Doyle silastic splints placed bilaterally (when used) and secured with 4-0 nylon through caudal septum.",
    ],
  },
  devices: {
    instruments: ["Killian / hemitransfixion blade", "Cottle elevator + Freer elevator", "Septal scissors", "Microdebrider (for IT reduction)", "Doyle splints"],
  },
  specimens: { default: "Cartilage / bone fragments — usually discarded; sent if pathology suspected." },
  tubesAndDrains: { default: "Doyle splints × 5-7 days when used; no nasal packing routinely (pain + obstruction without benefit per RCT data)." },
  complicationChecks: [
    { label: "Septal hematoma (urgent drainage to prevent saddle nose deformity)" },
    { label: "Septal perforation" },
    { label: "Saddle nose deformity (insufficient L-strut)" },
    { label: "Persistent obstruction / inadequate correction" },
    { label: "CSF leak (rare; from cribriform plate violation)" },
  ],
  postopPlan: {
    disposition: "Discharge home same-day.",
    analgesia: "Acetaminophen + ibuprofen; opioid sparingly.",
    antibiotics: "Single perioperative dose; oral course only when splints in place.",
    activity: "No nose-blowing × 2 weeks; saline rinses TID; head-elevated sleep × 1 week.",
    followup: ["Splint removal at 5-7 days in clinic", "Clinic at 4 weeks for symptom assessment"],
    returnPrecautions: ["Severe nasal pain or pressure (septal hematoma)", "Persistent epistaxis", "Clear watery rhinorrhea (CSF leak)"],
  },
  requiredFields: [
    { id: "deviation_side", label: "Deviation side", type: "enum", options: ["Right", "Left", "Bilateral / S-shape"] },
    { id: "deviation_type", label: "Deviation type", type: "enum", options: ["Anterior cartilaginous", "Posterior bony", "Combined", "Spur isolated"] },
    { id: "turbinate_reduction", label: "Inferior turbinate reduction", type: "boolean" },
    { id: "splints_placed", label: "Doyle splints placed", type: "boolean" },
  ],
});

export const FESS = e({
  key: "ent.rhinology.fess",
  subcategory: "rhinology",
  procedureName: "Functional endoscopic sinus surgery",
  synonyms: ["fess", "functional endoscopic sinus surgery", "ess", "endoscopic sinus surgery"],
  matchPatterns: [/\bfess\b|\bfunctional\s+endoscopic\s+sinus|\bess\b/i],
  topMatter: {
    anesthesia: "General endotracheal with oral RAE tube; controlled hypotension (TIVA preferred).",
    position: "Supine with reverse Trendelenburg ~15°.",
    prep: "Oxymetazoline pledgets + lidocaine/epinephrine submucosal injection for vasoconstriction.",
    ebl: "Minimal-100 mL.",
    disposition: "Discharge home same-day.",
  },
  findings: {
    headline: "Bilateral sinus disease per Lund-Mackay score (right ___ / left ___, max 24 each). Uncinectomy + maxillary antrostomy + anterior ethmoidectomy [+ posterior ethmoidectomy + sphenoidotomy + frontal recess clearance per Draf I/II/III] performed bilaterally. All natural ostia widely patent at end of case. Image-guidance (Stryker / Medtronic StealthStation) used for posterior ethmoid + frontal recess + sphenoid identification.",
  },
  operativeSteps: {
    steps: [
      "Right side: 0° rigid endoscope (Storz or Karl Storz) advanced; uncinate process identified with sickle knife or backbiter.",
      "Uncinectomy: incision along anterior edge of uncinate from superior to inferior; uncinate medialised and removed with through-cutting forceps (preserves mucosa, prevents Onodi cell injury).",
      "Maxillary antrostomy: natural ostium identified; antrostomy enlarged anteriorly to 1-1.5 cm avoiding accessory ostium creation.",
      "Anterior ethmoidectomy: bulla ethmoidalis identified and entered medially; basal lamella of middle turbinate identified as posterior limit; cells cleared anterior to it.",
      "[Posterior ethmoidectomy: basal lamella violated medially; posterior cells cleared with care for orbital lamina papyracea laterally and skull base superiorly.]",
      "[Sphenoidotomy: natural ostium of sphenoid identified at superior septal area medial to superior turbinate; ostium enlarged inferomedially with mushroom punch; care for optic nerve + carotid prominence in lateral wall.]",
      "[Frontal recess (Draf I/IIa/IIb/III): agger nasi cell + frontal cells identified with image guidance; frontal sinus ostium identified; clearance per planned Draf classification.]",
      "Lamina papyracea inspected — intact, no orbital fat herniation. Skull base inspected — no CSF leak.",
      "Contralateral side performed identically.",
      "Hemostasis with topical FloSeal or fibrin glue; no nasal packing routinely.",
    ],
  },
  devices: {
    instruments: ["0° + 30° + 70° rigid sinus endoscopes (Storz)", "Sickle knife + backbiter for uncinectomy", "Through-cutting forceps", "Microdebrider", "Image-guidance system (Stryker / Medtronic StealthStation)"],
    consumables: ["FloSeal hemostatic matrix", "Oxymetazoline pledgets"],
  },
  specimens: { default: "Sinus mucosa / polyps to pathology (especially when polyps appear unusual or suspected fungal disease)." },
  tubesAndDrains: { default: "None routinely; absorbable packing (Nasopore / Sinu-Foam) may be placed for hemostasis." },
  complicationChecks: [
    { label: "CSF leak (cribriform plate / fovea ethmoidalis injury)" },
    { label: "Orbital injury (lamina papyracea violation — orbital hematoma, optic nerve injury, diplopia)" },
    { label: "Carotid injury (rare; sphenoid surgery — catastrophic)" },
    { label: "Synechia formation" },
    { label: "Recurrent disease requiring revision (10-20% lifetime)" },
  ],
  postopPlan: {
    disposition: "Discharge home same-day.",
    analgesia: "Acetaminophen + ibuprofen.",
    antibiotics: "Oral antibiotic course × 7-10 days for chronic rhinosinusitis with polyps; not routine for non-polyp.",
    activity: "Saline rinses TID-QID starting POD 1; no nose-blowing × 2 weeks; no straining.",
    followup: ["Clinic at 1 week for debridement", "Repeat debridement at 3 + 6 weeks", "Topical steroid rinses ongoing for chronic rhinosinusitis"],
    returnPrecautions: ["Clear watery rhinorrhea (CSF leak)", "Sudden vision changes / proptosis (orbital injury)", "Severe epistaxis"],
  },
  requiredFields: [
    { id: "indication", label: "Indication", type: "enum", options: ["Chronic rhinosinusitis without polyps", "Chronic rhinosinusitis with polyps", "Recurrent acute rhinosinusitis", "Mucocele", "Antrochoanal polyp", "Tumor / mass"] },
    { id: "lund_mackay", label: "Lund-Mackay total score", type: "number" },
    { id: "image_guidance", label: "Image guidance used", type: "boolean" },
    { id: "extent", label: "Extent of surgery", type: "enum", options: ["Unilateral", "Bilateral", "Maxillary + anterior ethmoid only", "Full FESS (maxillary + ethmoid + sphenoid + frontal)"] },
  ],
});

export const THYROIDECTOMY = e({
  key: "ent.head_neck.thyroidectomy",
  subcategory: "head-neck",
  procedureName: "Thyroidectomy",
  synonyms: ["thyroidectomy", "total thyroidectomy", "hemithyroidectomy", "thyroid lobectomy"],
  matchPatterns: [/\bthyroidectom|\bthyroid\s+lobectom/i],
  topMatter: {
    anesthesia: "General endotracheal with continuous recurrent laryngeal nerve monitoring (NIM-3 system).",
    position: "Supine with shoulder roll for neck extension; arms tucked.",
    prep: "Neck prepped from chin to upper chest.",
    ebl: "Minimal — under 50 mL.",
    disposition: "Surgical floor for overnight observation (airway + calcium); some centres discharge same-day for hemithyroidectomy.",
  },
  findings: {
    headline: "Thyroid [diffusely enlarged / nodular / contained ___ cm dominant nodule in (right / left) lobe / Graves' goitre]. Both recurrent laryngeal nerves identified and preserved with continuous intraoperative nerve monitoring confirming intact signal pre- and post-resection. All four parathyroid glands identified and preserved on their vascular pedicles. No extrathyroidal extension or central-compartment lymphadenopathy. Final specimen oriented for pathology.",
  },
  operativeSteps: {
    steps: [
      "Transverse collar incision two finger-breadths above sternal notch in a natural skin crease, carried down through platysma.",
      "Subplatysmal flaps raised superiorly to thyroid cartilage and inferiorly to sternal notch.",
      "Strap muscles (sternohyoid + sternothyroid) separated in the midline and retracted laterally to expose thyroid (strap muscle division reserved for very large goitres).",
      "Thyroid lobe mobilisation (right side described; left identical):",
      "Superior pole mobilised: superior thyroid artery branches identified and ligated on the thyroid capsule (preserves external branch of superior laryngeal nerve which crosses cricothyroid muscle).",
      "Middle thyroid vein ligated and divided.",
      "Inferior pole mobilised: inferior thyroid artery identified.",
      "Recurrent laryngeal nerve identified in tracheo-esophageal groove using continuous NIM monitoring; nerve traced superiorly to its insertion at the cricothyroid joint, preserved throughout.",
      "Parathyroid glands identified (typically 4 — superior near upper pole, inferior near lower pole) and preserved on their vascular pedicles. Inferior parathyroids most at risk during inferior thyroid artery ligation.",
      "Inferior thyroid artery ligated on the thyroid capsule (peripheral ligation preserves parathyroid blood supply).",
      "Berry's ligament (suspensory ligament of thyroid to trachea) divided sharply with care for RLN at this critical zone.",
      "Thyroid lobe removed; specimen oriented and sent to pathology.",
      "[For total thyroidectomy: contralateral lobe removed identically with renewed RLN identification + parathyroid preservation.]",
      "Final RLN signal confirmed > 100 µV (pre- and post-resection comparison) — predicts intact vocal cord function.",
      "[Devitalised parathyroid: minced and reimplanted into SCM muscle in 2 mm cubes secured with non-absorbable suture (Halsted).]",
    ],
    closure: "Hemostasis meticulously confirmed (Valsalva to provoke any venous bleeding). Strap muscles re-approximated in midline with 3-0 Vicryl. Platysma with 3-0 Vicryl. Skin with 4-0 Monocryl subcuticular + Dermabond.",
  },
  devices: {
    instruments: ["Thyroid retractor set (Lahey, Gelpi)", "NIM-3 / Medtronic recurrent laryngeal nerve monitoring system", "Harmonic scalpel / LigaSure (vessel-sealing for capsular vessels)"],
  },
  specimens: { default: "Thyroid lobe(s) oriented for pathology; central-compartment lymph nodes (Level VI) submitted separately when sampled for malignancy." },
  tubesAndDrains: { default: "No drain routinely (drains do not reduce hematoma per RCT data)." },
  complicationChecks: [
    { label: "Recurrent laryngeal nerve injury (1-2% temporary, < 1% permanent)" },
    { label: "Bilateral RLN injury — acute upper airway obstruction at extubation (NEVER extubate without confirming vocal cord function)" },
    { label: "Hypocalcemia (transient 10-30%; permanent < 2% — total thyroidectomy)" },
    { label: "Neck hematoma — airway compromise (open at bedside if suspected)" },
    { label: "External branch of superior laryngeal nerve injury (high-pitched voice loss)" },
  ],
  postopPlan: {
    disposition: "Surgical floor overnight for total / Graves; same-day discharge acceptable for hemi.",
    analgesia: "Acetaminophen + NSAID; opioid sparingly.",
    antibiotics: "Single perioperative dose.",
    activity: "Soft cervical collar × 1-2 days for comfort; no neck strain × 2 weeks.",
    followup: [
      "Pathology review at 7-10 days",
      "Total thyroidectomy: ionised calcium at 6 + 12 + 24 h post-op; calcitriol + calcium carbonate started for hypocalcemia",
      "Levothyroxine started immediately post-op (total) or based on TSH in 6 weeks (hemi)",
      "Voice assessment at 2 weeks (laryngoscopy if any concern)",
    ],
    returnPrecautions: [
      "Neck swelling / difficulty breathing (HEMATOMA — emergency, open at bedside)",
      "Numbness / tingling around mouth or hands (hypocalcemia)",
      "Persistent hoarseness > 2 weeks",
    ],
  },
  requiredFields: [
    { id: "extent", label: "Extent", type: "enum", options: ["Hemithyroidectomy / lobectomy", "Total thyroidectomy", "Completion thyroidectomy", "Subtotal thyroidectomy (Graves)"] },
    { id: "indication", label: "Indication", type: "enum", options: ["Bethesda IV/V/VI thyroid nodule", "Differentiated thyroid cancer (PTC/FTC)", "Medullary thyroid carcinoma", "Graves' disease refractory to medical management", "Multinodular goitre with compression / cosmesis", "Thyroid lymphoma (rare)"] },
    { id: "nim_used", label: "RLN nerve monitoring used", type: "boolean" },
    { id: "central_lnd", label: "Central neck dissection (Level VI)", type: "boolean" },
    { id: "parathyroids_preserved", label: "Parathyroids preserved (count)", type: "number" },
    { id: "parathyroid_reimplanted", label: "Parathyroid reimplanted", type: "boolean" },
  ],
});

export const PAROTIDECTOMY = e({
  key: "ent.head_neck.parotidectomy",
  subcategory: "head-neck",
  procedureName: "Parotidectomy",
  synonyms: ["parotidectomy", "superficial parotidectomy", "total parotidectomy"],
  matchPatterns: [/\bparotidectom/i],
  topMatter: {
    anesthesia: "General endotracheal; continuous facial nerve monitoring (NIM-3).",
    position: "Supine with head turned to contralateral side; shoulder roll.",
    prep: "Operative side of face from forehead to clavicle including external ear; cotton in EAC.",
    ebl: "Minimal-100 mL.",
    disposition: "Surgical floor overnight; LOS 1-2 days.",
  },
  findings: {
    headline: "[Right / Left] parotid mass measuring approximately ___ cm in [superficial / deep] lobe. Facial nerve trunk identified and traced through tragal pointer / posterior belly of digastric / tympanomastoid suture; all five branches preserved with continuous NIM-3 monitoring confirming intact signals throughout. [Superficial parotidectomy / total parotidectomy with facial nerve preservation] completed.",
  },
  operativeSteps: {
    steps: [
      "Modified Blair incision (preauricular extending into a cervical limb in a natural skin crease): preauricular + retromandibular + cervical components.",
      "Skin flap elevated anteriorly to the anterior border of the parotid in the subcutaneous plane.",
      "Greater auricular nerve identified and preserved if possible (sacrificed if tumor adherent — sensory loss to ear).",
      "Posterior belly of digastric muscle identified — key landmark.",
      "Tragal pointer (cartilage spike) identified — facial nerve trunk lies ~1 cm deep + slightly inferior + medial to it.",
      "Tympanomastoid suture line palpated as additional landmark.",
      "Facial nerve trunk identified using NIM-3 stimulation; nerve traced anteriorly through pes anserinus to bifurcation into upper (temporofacial) and lower (cervicofacial) divisions; further branches identified as needed (temporal, zygomatic, buccal, marginal mandibular, cervical).",
      "Parotid tissue progressively dissected from the nerve branches in superficial-to-deep direction (or branch-by-branch).",
      "[For deep lobe / total parotidectomy: nerve mobilised and elevated; deep lobe dissected free with tumor.]",
      "Specimen removed en bloc with negative grossly clear margins.",
      "Hemostasis with bipolar (avoiding monopolar near nerve branches).",
      "Final NIM-3 stimulation at trunk and all branches: intact signals confirmed at end of case.",
    ],
    closure: "Drain (closed-suction Blake or JP) placed in parotid bed and brought out posterior to the cervical incision. SMAS / parotid capsule re-approximated with 3-0 Vicryl. Skin with 5-0 Monocryl subcuticular + Steri-Strips for cosmesis.",
  },
  devices: {
    instruments: ["NIM-3 facial nerve monitoring system", "Bipolar cautery (monopolar avoided near nerve)", "Lacrimal probe (for ductal cannulation in tumor near Stensen's duct)"],
  },
  specimens: { default: "Parotid mass + surrounding gland to pathology — orient for margin assessment." },
  tubesAndDrains: { default: "Closed-suction drain (JP or 7 Fr Blake) × 24-48 h, removed when output < 30 mL/day." },
  complicationChecks: [
    { label: "Facial nerve weakness / paralysis (transient 30-50%; permanent 1-3%)" },
    { label: "Frey's syndrome (gustatory sweating; long-term — auriculotemporal nerve aberrant regeneration)" },
    { label: "First-bite syndrome (deep lobe / parapharyngeal dissection)" },
    { label: "Salivary fistula / sialocele" },
    { label: "Greater auricular nerve numbness (preserved when possible)" },
  ],
  postopPlan: {
    disposition: "Surgical floor overnight; LOS 1-2 days.",
    analgesia: "Acetaminophen + NSAID; opioid sparingly.",
    antibiotics: "Single perioperative dose.",
    activity: "No restrictions; head-of-bed elevated × 24 h.",
    followup: [
      "Pathology at 7-10 days; oncology referral for malignancy",
      "Drain removal at 24-48 h once output < 30 mL/day",
      "Photographic documentation of facial nerve function at 2 weeks; recovery may take up to 6 months for transient weakness",
    ],
    returnPrecautions: ["New facial weakness post-discharge", "Wound discharge / infection", "Persistent salivary leak (sialocele)"],
  },
  requiredFields: [
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "extent", label: "Extent", type: "enum", options: ["Superficial parotidectomy", "Total parotidectomy with facial nerve preservation", "Total parotidectomy with facial nerve sacrifice", "Extracapsular dissection (selected pleomorphic adenoma)"] },
    { id: "facial_nerve_preserved", label: "Facial nerve preserved", type: "boolean" },
    { id: "nim_signal_intact", label: "NIM signal intact at end of case", type: "boolean" },
    { id: "concomitant_neck_dissection", label: "Concomitant neck dissection", type: "boolean" },
  ],
});

export const ENT_TEMPLATES: ProcedureTemplate[] = [
  TONSILLECTOMY,
  SEPTOPLASTY,
  FESS,
  THYROIDECTOMY,
  PAROTIDECTOMY,
];
