// ---------------------------------------------------------------------------
// Neurosurgery — procedure-specific dictation templates
// ---------------------------------------------------------------------------

import type { ProcedureTemplate } from "./types";

const n = (
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
): ProcedureTemplate => ({ specialty: "neurosurgery", ...partial });

export const CRANIOTOMY_TUMOR = n({
  key: "neurosurgery.cranial.craniotomy_tumor",
  subcategory: "cranial",
  procedureName: "Craniotomy for tumor resection",
  synonyms: ["craniotomy", "tumor resection", "glioma resection", "meningioma resection", "metastasis resection"],
  matchPatterns: [/\bcraniotom(?!.*hematom)|\btumou?r\s+resection|\bglioma\s+resection|\bmeningioma\s+resection|\bmetastasis\s+resection/i],
  topMatter: {
    anesthesia: "General endotracheal with arterial line, central access, Foley, continuous neuromonitoring (SSEP + MEP + EMG when relevant).",
    position: "Supine / lateral / prone with head fixed in Mayfield three-point head holder; reverse Trendelenburg for venous drainage.",
    prep: "Hair clipped (not shaved) at planned incision; betadine + chlorhexidine; cefazolin 2 g IV (vancomycin if MRSA risk) within 60 min.",
    ebl: "150-400 mL.",
    disposition: "Neuro-ICU × 24 h for hourly neuro checks + BP control + seizure prophylaxis; postoperative MRI within 24-48 h.",
  },
  findings: {
    headline: "Preoperative MRI demonstrated [contrast-enhancing / non-enhancing / cystic with mural nodule] mass in [right frontal / left temporal / parietal / occipital / cerebellar] region measuring approximately ___ × ___ × ___ cm with surrounding vasogenic edema. Frameless stealth neuronavigation registered with accuracy < 1 mm. Intraoperative neuromonitoring (SSEP + MEP) intact throughout. Tumor [firm / soft / vascular / cystic / fibrous] and resected to [gross-total / near-total > 95% / subtotal] extent under microscopic visualisation. Brain relaxation excellent; cortex protected throughout. Hemostasis within tumor bed meticulously confirmed. Dura closed in watertight fashion and leak-tested with Valsalva.",
  },
  operativeSteps: {
    steps: [
      "Mayfield three-point head holder applied with appropriate pin pressure (60 lbs adult).",
      "Frameless stealth neuronavigation (BrainLab / Medtronic StealthStation) registered to preoperative MRI; accuracy < 1 mm verified at multiple landmarks.",
      "[Curvilinear / question-mark / linear] scalp incision planned over lesion using neuronavigation; infiltrated with 1% lidocaine + epinephrine 1:200,000; incised with #10 blade.",
      "Raney clips applied to scalp edges for hemostasis; myocutaneous flap elevated to expose cranium.",
      "Subperiosteal dissection defined craniotomy margins.",
      "Burr holes placed at 4-5 sites using high-speed drill.",
      "Craniotomy completed with side-cutting B5 footplate; bone flap elevated and stored in saline soak.",
      "Dura inspected, tented up with 4-0 Nurolon stay sutures, opened in [cruciate / U-shaped] fashion under operating microscope.",
      "Mannitol 1 g/kg IV + furosemide 20 mg IV given for brain relaxation.",
      "Subpial / transcortical approach to tumor; sulcus identified using neuronavigation.",
      "Tumor debulked internally with ultrasonic aspirator (CUSA — Integra Sonastar) or bipolar; systematic separation from surrounding brain along gliotic plane.",
      "Frozen section sent for diagnosis confirmation; await result before deciding extent of resection.",
      "Gross total resection achieved as tolerated by neuromonitoring + vascular anatomy + eloquent-cortex proximity.",
      "[Awake mapping variant: cortical mapping with bipolar stimulator (Ojemann) at 60 Hz, 1 ms pulse, 2-6 mA; functional cortex marked with sterile letters; subcortical white-matter tract mapping for motor / language pathways.]",
      "Resection cavity inspected for hemostasis with copious irrigation + bipolar cautery; Surgicel + FloSeal applied as needed.",
    ],
    closure: "Dura closed in watertight fashion with running 4-0 Nurolon + dural substitute (DuraSeal / Duragen) as needed; Valsalva leak-test passed. Bone flap replaced with titanium cranial plates × 4-6. Galea closed with 2-0 Vicryl. Skin with staples (or 3-0 Monocryl subcuticular + Dermabond for cosmetic).",
  },
  devices: {
    instruments: ["Mayfield three-point head holder", "Frameless stealth neuronavigation", "High-speed drill (Midas Rex / Stryker)", "Operating microscope (Zeiss Pentero / Leica M530OH)", "Ultrasonic aspirator (CUSA)", "Bipolar electrocautery", "SSEP/MEP neuromonitoring"],
    implants: ["Titanium cranial plates × 4-6 + screws"],
    consumables: ["Mannitol 1 g/kg + Lasix 20 mg", "Surgicel + FloSeal", "DuraSeal / Duragen"],
  },
  specimens: { default: "Tumor submitted fresh for frozen + permanent pathology + molecular markers (IDH, MGMT, 1p/19q for gliomas; HER2 / hormone receptors for metastases)." },
  tubesAndDrains: { default: "Subgaleal drain × 24 h; Foley × 24 h." },
  complicationChecks: [
    { label: "Postoperative hematoma (epidural / subdural / intracerebral)" },
    { label: "Seizure (prophylaxis with levetiracetam 1 g BID × 7 days)" },
    { label: "CSF leak / pseudomeningocele" },
    { label: "Wound infection / bone flap osteomyelitis" },
    { label: "New focal neurologic deficit" },
    { label: "DVT/PE" },
  ],
  postopPlan: {
    disposition: "Neuro-ICU × 24 h.",
    catheter: "Foley × 24 h; subgaleal drain × 24 h.",
    analgesia: "Multimodal: scheduled acetaminophen + sparingly opioid.",
    antibiotics: "Single perioperative dose.",
    activity: "Strict BP control (SBP < 140); HOB elevated 30°; q1h neuro checks × 12 h then q2h × 12 h.",
    followup: [
      "Postoperative MRI within 24-48 h to assess extent of resection",
      "Pathology + molecular markers at 7-10 days",
      "Levetiracetam 1 g BID × 7 days seizure prophylaxis",
      "Neuro-oncology referral for adjuvant therapy",
      "Subgaleal drain removed POD 1-2",
    ],
    returnPrecautions: ["New / worsening focal deficit", "Severe headache / nausea / decreased LOC (hematoma)", "Fever + wound concerns", "Seizure activity"],
  },
  requiredFields: [
    { id: "lesion_location", label: "Lesion location", type: "text" },
    { id: "lesion_size_cm", label: "Lesion size (cm)", type: "number" },
    { id: "approach", label: "Approach", type: "enum", options: ["Pterional", "Bifrontal", "Frontotemporal", "Parietal", "Occipital", "Suboccipital / midline", "Retrosigmoid", "Other"] },
    { id: "extent_of_resection", label: "Extent of resection", type: "enum", options: ["Gross total", "Near-total (> 95%)", "Subtotal (50-95%)", "Biopsy only"] },
    { id: "neuromonitoring", label: "Neuromonitoring used", type: "boolean" },
    { id: "navigation_used", label: "Stealth navigation used", type: "boolean" },
    { id: "frozen_section", label: "Frozen section sent", type: "boolean" },
  ],
});

export const EVD = n({
  key: "neurosurgery.cranial.evd",
  subcategory: "cranial",
  procedureName: "External ventricular drain placement",
  synonyms: ["evd", "external ventricular drain", "ventriculostomy"],
  matchPatterns: [/\bevd\b|\bexternal\s+ventricular\s+drain|\bventriculostomy/i],
  topMatter: {
    anesthesia: "Local 1% lidocaine + sedation; bedside placement common in ICU.",
    position: "Supine with head of bed elevated 30°.",
    prep: "Hair clipped at Kocher's point; chlorhexidine prep; sterile drape.",
    ebl: "Minimal.",
    disposition: "Neuro-ICU; ICP monitoring + serial CSF output recording; CT head to confirm tip placement.",
  },
  findings: {
    headline: "Preoperative imaging demonstrated [hydrocephalus / IVH / SAH with hydrocephalus]. Right (non-dominant) frontal approach via Kocher's point. Ventricle cannulated successfully on first pass at depth approximately 6 cm with immediate return of [clear / xanthochromic / bloody] CSF. Initial ICP measured at ___ cm H2O.",
  },
  operativeSteps: {
    steps: [
      "Right (non-dominant) Kocher's point identified: 10 cm posterior to nasion + 3 cm lateral to midline (just anterior to coronal suture, just lateral to mid-pupillary line).",
      "Hair clipped at entry point; chlorhexidine prep; sterile drape; local 1% lidocaine + epinephrine.",
      "Small linear scalp incision (~1 cm); Weitlaner self-retainer; subperiosteal dissection.",
      "Twist-drill burr hole with hand drill through cranium until inner table breached.",
      "Dura punctured with spinal needle.",
      "Ventricular catheter (Codman EDS-3 / Medtronic Becker / antibiotic-impregnated Bactiseal) advanced along trajectory aimed at ipsilateral medial canthus + ipsilateral external auditory meatus (target: ipsilateral foramen of Monro).",
      "CSF return at depth approximately 6 cm: [clear / xanthochromic / bloody]; depth at scalp marked.",
      "Initial ICP measured: ___ cm H2O.",
      "Catheter tunneled subcutaneously ~5-7 cm via stab incision; secured to scalp with 2-0 nylon.",
      "External drainage system connected and leveled at the tragus + ___ cm H2O above tragus.",
    ],
    closure: "Scalp incision closed with skin staples or 4-0 nylon. Sterile occlusive dressing.",
  },
  devices: {
    instruments: ["Hand twist-drill", "Spinal needle for dural puncture", "Tunneling rod"],
    implants: ["Ventricular catheter (Codman EDS-3, Medtronic Becker, or antibiotic-impregnated Bactiseal)"],
    consumables: ["External drainage system + collection chamber"],
  },
  specimens: { default: "CSF at placement: cell count, protein, glucose, gram stain, culture, opening pressure." },
  tubesAndDrains: { default: "EVD leveled at tragus + ___ cm H2O; output recorded q1h." },
  complicationChecks: [
    { label: "Catheter malposition (CT confirmation mandatory)" },
    { label: "Intracerebral hemorrhage along catheter tract" },
    { label: "Ventriculitis (1-5% per day — antibiotic-impregnated catheter for prolonged drainage)" },
    { label: "Catheter occlusion / dislodgement" },
    { label: "Overdrainage causing subdural hygroma" },
  ],
  postopPlan: {
    disposition: "Neuro-ICU.",
    activity: "EVD level adjusted per ICP target; weaning trial when underlying pathology resolves.",
    antibiotics: "Cefazolin 2 g IV q8h × 24 h (or until EVD removed if antibiotic-impregnated catheter not used).",
    followup: [
      "CT head within 12 h to confirm tip placement",
      "Daily CSF studies if ventriculitis suspected",
      "Wean EVD progressively when underlying pathology improves",
      "Convert to VP shunt if persistent hydrocephalus after 2 weeks of clamping trials",
    ],
    returnPrecautions: ["No CSF output (occlusion)", "Fever + worsening headache (ventriculitis)", "Decreased LOC"],
  },
  requiredFields: [
    { id: "indication", label: "Indication", type: "enum", options: ["Acute hydrocephalus", "Intraventricular hemorrhage", "SAH with hydrocephalus", "TBI with elevated ICP", "Tumor-related hydrocephalus", "Other"] },
    { id: "side", label: "Side", type: "enum", options: ["Right (non-dominant)", "Left", "Bilateral"] },
    { id: "passes_required", label: "Passes required", type: "number" },
    { id: "opening_pressure_cmh2o", label: "Opening pressure (cm H2O)", type: "number" },
    { id: "csf_appearance", label: "CSF appearance", type: "enum", options: ["Clear", "Xanthochromic", "Bloody", "Cloudy / purulent"] },
    { id: "antibiotic_catheter", label: "Antibiotic-impregnated catheter", type: "boolean" },
  ],
});

export const ACDF = n({
  key: "neurosurgery.spine.acdf",
  subcategory: "spine",
  procedureName: "Anterior cervical discectomy and fusion",
  synonyms: ["acdf", "anterior cervical discectomy", "anterior cervical fusion"],
  matchPatterns: [/\bacdf\b|\banterior\s+cervical\s+(discectomy|fusion)/i],
  topMatter: {
    anesthesia: "General endotracheal with continuous SSEP + MEP neuromonitoring.",
    position: "Supine with shoulder roll for slight neck extension; arms tucked.",
    prep: "Anterior neck prepped from chin to upper chest in chlorhexidine.",
    ebl: "50-150 mL.",
    disposition: "Surgical floor; LOS 1-2 days.",
  },
  findings: {
    headline: "Preoperative MRI demonstrated [central / paracentral / foraminal] disc herniation at [C5-6 / C6-7] with [cord compression / foraminal narrowing] and [myelopathy / radiculopathy / both]. Intraoperative fluoroscopy confirmed correct level. Disc and posterior osteophytes removed under microscope; cord and bilateral nerve roots decompressed. [Structural allograft / PEEK cage with autograft] placed in disc space; anterior cervical plate secured with 4 locking screws. Final neuromonitoring intact + unchanged.",
  },
  operativeSteps: {
    steps: [
      "Right-sided transverse skin-crease incision at the target level (cricoid cartilage = C6, hyoid bone = C3).",
      "Subplatysmal flaps raised superiorly + inferiorly. Platysma divided in line with skin incision.",
      "Medial border of SCM identified; carotid sheath retracted laterally; trachea + esophagus + thyroid + RLN retracted medially.",
      "Longus colli muscle bellies identified covering anterior vertebral bodies; divided medially with monopolar.",
      "Caspar self-retaining retractor blades placed underneath elevated longus colli bilaterally.",
      "Lateral retractors placed protecting carotid sheath.",
      "Fluoroscopic confirmation (lateral view) of correct level by counting up from C7 (or down from C2 odontoid).",
      "Disc space opened with #15 blade; Caspar pin distractors placed for distraction.",
      "Under operating microscope (Zeiss Pentero), disc and posterior osteophytes removed using curette + pituitary rongeur + Kerrison rongeur; high-speed drill (Midas Rex 4 mm cutting bit) for posterior osteophytes.",
      "PLL opened with microscissors / Kerrison rongeur (controversial — some preserve PLL).",
      "Bilateral foraminotomy: uncinate process / uncovertebral joint removed laterally with Kerrison rongeur until nerve root visibly free of compression.",
      "Adequate decompression confirmed by direct visualisation: thecal sac decompressed, bilateral roots free + mobile.",
      "Trial spacer placed for sizing (typical 5-7 mm height).",
      "[Structural cervical allograft / PEEK cage filled with cancellous autograft / DBM] placed in disc space; Caspar distraction released for snug fit.",
      "Anterior cervical plate (Synthes Skyline / Medtronic Atlantis / Stryker Reflex Hybrid) sized to span cephalad + caudad vertebral bodies; contoured to cervical lordosis.",
      "Locking screws placed bicortically (4 screws total for 1-level; 6 for 2-level), trajectories slightly converging.",
      "Final fluoroscopic confirmation (AP + lateral) of plate, screw, and graft position.",
      "Final SSEP/MEP signals confirmed unchanged from baseline.",
    ],
    closure: "7 Fr Jackson-Pratt drain placed in prevertebral space, brought out laterally — drain prevents prevertebral hematoma which can cause dysphagia + airway compromise. Platysma re-approximated with running 3-0 Vicryl. Skin with 4-0 Monocryl subcuticular + Steri-Strips. Soft cervical collar applied.",
  },
  devices: {
    instruments: ["Caspar pin distractor + retractor", "Operating microscope", "High-speed drill", "Kerrison + pituitary rongeurs", "C-arm fluoroscopy"],
    implants: ["Structural allograft OR PEEK cage with autograft / DBM", "Anterior cervical plate + 4-6 locking screws"],
  },
  specimens: { default: "Disc + osteophyte fragments to pathology when indicated." },
  tubesAndDrains: { default: "7 Fr JP × 24-48 h; soft cervical collar × 2-6 weeks." },
  complicationChecks: [
    { label: "Recurrent laryngeal nerve palsy (1-3% — hoarseness)" },
    { label: "Postoperative hematoma → airway compromise (surgical emergency — open at bedside)" },
    { label: "Dysphagia (30-50% transient, < 10% persistent at 1 year)" },
    { label: "Pseudarthrosis (5-10%; worse with smoking, multilevel)" },
    { label: "Adjacent-segment disease" },
    { label: "Esophageal injury (rare; catastrophic)" },
  ],
  postopPlan: {
    disposition: "Surgical floor.",
    catheter: "JP drain × 24-48 h.",
    analgesia: "Multimodal oral; opioid sparingly.",
    antibiotics: "Single perioperative dose.",
    activity: "Soft cervical collar × 2-6 weeks; soft diet × 1 week, advance per dysphagia screen.",
    followup: [
      "Clinic at 2 weeks for wound + dysphagia + neuro assessment",
      "Cervical X-rays at 6 weeks + 3 months + 12 months for fusion assessment",
      "Smoking cessation reinforced",
    ],
    returnPrecautions: ["Difficulty breathing + neck swelling (HEMATOMA — surgical emergency)", "New / worsening neurologic deficit", "Severe dysphagia + inability to maintain hydration"],
  },
  requiredFields: [
    { id: "levels", label: "Levels operated", type: "text" },
    { id: "indication", label: "Indication", type: "enum", options: ["Cervical radiculopathy", "Cervical myelopathy", "Both", "Trauma + instability"] },
    { id: "graft_type", label: "Graft type", type: "enum", options: ["Structural allograft", "PEEK cage with autograft", "PEEK cage with DBM / synthetic"] },
    { id: "plate_used", label: "Anterior plate used", type: "boolean" },
    { id: "neuromonitoring", label: "Neuromonitoring used", type: "boolean" },
    { id: "drain_placed", label: "Drain placed", type: "boolean" },
  ],
});

export const MICRODISCECTOMY = n({
  key: "neurosurgery.spine.lumbar_microdiscectomy",
  subcategory: "spine",
  procedureName: "Lumbar microdiscectomy",
  synonyms: ["microdiscectomy", "lumbar discectomy"],
  matchPatterns: [/\bmicrodiscectom|\blumbar\s+discectom/i],
  topMatter: {
    anesthesia: "General endotracheal with neuromonitoring.",
    position: "Prone on Wilson frame or Andrews bed with abdomen hanging free (relieves epidural venous pressure to reduce bleeding).",
    prep: "Lumbar region prepped from mid-thoracic to sacrum.",
    ebl: "50-100 mL.",
    disposition: "Discharge home same-day or surgical floor; LOS 0-1 day.",
  },
  findings: {
    headline: "Preoperative MRI demonstrated [central / paracentral / foraminal] disc herniation at [L4-5 / L5-S1] causing compression of [traversing L5 / exiting L4] nerve root. Preoperative neurologic exam: [radicular symptoms in L5/S1 distribution / motor weakness ___]. Intraoperative fluoroscopy confirmed correct level. Nerve root identified, decompressed, and mobilised without injury. Hemostasis within epidural space meticulously confirmed.",
  },
  operativeSteps: {
    steps: [
      "Patient positioned prone on Wilson frame with abdomen hanging free; pressure points padded.",
      "Fluoroscopy confirmed correct level with 22-gauge spinal needle marker.",
      "Small midline incision (~3-4 cm) over target level; carried down through subcutaneous tissue + lumbodorsal fascia.",
      "Subperiosteal dissection along spinous process and lamina with periosteal elevator; lamina exposed.",
      "Self-retaining tube retractor (METRx X-Tube / Quadrant) inserted and confirmed at correct level by fluoroscopy.",
      "Operating microscope (Zeiss Pentero / Leica M530OH) brought in.",
      "Small laminotomy with high-speed drill (Midas Rex 3 mm matchstick bit) and Kerrison rongeur; just enough to expose ligamentum flavum and dural margin.",
      "Ligamentum flavum carefully removed with Kerrison rongeur (4 mm) to expose dura and traversing nerve root.",
      "Nerve root identified and gently retracted medially with Penfield #4 to expose disc herniation.",
      "Disc fragment identified and removed with pituitary rongeur (4 mm).",
      "Curette + pituitary rongeur used to remove loose disc material within disc space (limited disc-space curetting to prevent recurrence vs over-aggressive removal which causes disc-space collapse + back pain).",
      "Nerve root reassessed: fully decompressed and pulsatile; no further compression.",
      "Hemostasis with bipolar cautery at low setting; FloSeal / Surgicel applied to epidural venous plexus.",
    ],
    closure: "Wound irrigated. Lumbodorsal fascia closed with interrupted 0 Vicryl. Subcutaneous with 2-0 Vicryl. Skin with 4-0 Monocryl subcuticular + Dermabond.",
  },
  devices: {
    instruments: ["Wilson frame / Andrews bed", "Self-retaining tube retractor (METRx / Quadrant)", "Operating microscope", "High-speed drill (Midas Rex 3 mm)", "Kerrison rongeurs (3 mm + 4 mm)", "Pituitary rongeurs", "C-arm fluoroscopy"],
    consumables: ["FloSeal / Surgicel for epidural hemostasis"],
  },
  specimens: { default: "Disc fragment to pathology." },
  tubesAndDrains: { default: "None routinely." },
  complicationChecks: [
    { label: "Dural tear / CSF leak (1-3% — primary repair if recognised)" },
    { label: "Nerve root injury (rare; presents as new motor / sensory deficit)" },
    { label: "Recurrent disc herniation (5-15% lifetime)" },
    { label: "Wrong-level surgery (mandatory fluoroscopic confirmation)" },
    { label: "Discitis (rare; < 1%)" },
  ],
  postopPlan: {
    disposition: "Discharge home same-day or POD 1.",
    analgesia: "Multimodal oral; opioid sparingly.",
    antibiotics: "Single perioperative dose.",
    activity: "Up + ambulating POD 0; no lifting > 10 lbs × 4 weeks; no bending / twisting × 6 weeks; PT at 4 weeks.",
    followup: ["Clinic at 2 weeks for wound + neuro assessment", "MRI only for new / worsening symptoms (not routine)"],
    returnPrecautions: [
      "Cauda equina symptoms (saddle anesthesia, urinary retention, fecal incontinence) — surgical emergency",
      "New / worsening motor weakness",
      "Severe headache / clear watery drainage from wound (CSF leak)",
      "Wound infection signs",
    ],
  },
  requiredFields: [
    { id: "level", label: "Level", type: "enum", options: ["L1-2", "L2-3", "L3-4", "L4-5", "L5-S1", "Two-level"] },
    { id: "side", label: "Side", type: "enum", options: ["Right", "Left", "Bilateral"] },
    { id: "herniation_type", label: "Herniation type", type: "enum", options: ["Central", "Paracentral", "Foraminal", "Far-lateral / extraforaminal", "Sequestered fragment"] },
    { id: "approach", label: "Approach", type: "enum", options: ["Microscopic minimally invasive (METRx tube)", "Open midline", "Endoscopic (uniportal / biportal)"] },
    { id: "dural_tear", label: "Dural tear (intraoperative)", type: "boolean" },
  ],
});

export const NEUROSURGERY_TEMPLATES: ProcedureTemplate[] = [
  CRANIOTOMY_TUMOR,
  EVD,
  ACDF,
  MICRODISCECTOMY,
];
