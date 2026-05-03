// ---------------------------------------------------------------------------
// Vascular Surgery — procedure-specific dictation templates
// ---------------------------------------------------------------------------

import type { ProcedureTemplate } from "./types";

const v = (
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
): ProcedureTemplate => ({ specialty: "vascular", ...partial });

export const CEA = v({
  key: "vascular.open.carotid_endarterectomy",
  subcategory: "open",
  procedureName: "Carotid endarterectomy",
  synonyms: ["carotid endarterectomy", "cea"],
  matchPatterns: [/\bcarotid\s+endarterectomy|\bcea\b/i],
  topMatter: {
    anesthesia: "General endotracheal with continuous EEG / cerebral oximetry monitoring; cervical block (deep + superficial) for awake CEA in selected centres.",
    position: "Supine with head turned to contralateral side; shoulder roll to extend the neck.",
    prep: "Neck prepped from mandible to clavicle; ipsilateral chest available for proximal control if needed.",
    ebl: "50-100 mL.",
    disposition: "Step-down × 24 h for neuro + BP + neck-hematoma surveillance.",
  },
  findings: {
    headline: "[Right / Left] carotid bifurcation with [70-89% / > 90%] atherosclerotic stenosis at the origin of the ICA on preoperative duplex / CTA. Plaque [soft and ulcerated / heavily calcified and stable]. Hypoglossal, vagus, and marginal mandibular nerves identified and preserved. Stump pressure ___ mmHg ([< 50 → shunt placed / ≥ 50 → no shunt]). Feathered distal endpoint achieved on ICA without residual flap. Post-closure intraoperative duplex / Doppler confirmed triphasic flow in ICA, CCA, ECA without intimal flap or residual stenosis.",
  },
  operativeSteps: {
    steps: [
      "Oblique incision along anterior border of sternocleidomastoid from angle of mandible to just above clavicle, carried down through platysma.",
      "SCM retracted laterally; carotid sheath entered. Common, internal, external carotid arteries dissected free with vessel loops around each.",
      "Hypoglossal, vagus, and marginal mandibular nerves identified and preserved.",
      "Heparin 5000 units IV; ACT verified > 250 sec.",
      "Sequential clamping: ICA → CCA → ECA. Stump pressure measured at distal CCA — [< 50 mmHg → Pruitt-Inahara shunt placed after arteriotomy started / ≥ 50 mmHg → no shunt].",
      "Longitudinal arteriotomy on CCA extended onto ICA beyond the plaque. Plaque carefully dissected from arterial wall in the subadventitial plane with feathered distal endpoint achieved on the ICA. All residual debris and loose intimal flaps removed; lumen irrigated.",
      "Bovine pericardial patch fashioned and sewn onto the arteriotomy with running 6-0 Prolene. Prior to final tying, flow flushed through ECA, CCA, and finally ICA to evacuate air and debris. Clamps released in order ECA → CCA → ICA.",
      "Hemostasis confirmed. Protamine administered to reverse heparinisation. Doppler signals confirmed in superficial temporal artery and across endarterectomy site.",
    ],
    closure: "Platysma closed with 3-0 Vicryl; skin with 4-0 Monocryl subcuticular. No drain.",
  },
  devices: {
    instruments: ["Vascular tray with bulldog clamps", "Pruitt-Inahara shunt (selective use)", "Stump pressure manometer", "Bovine pericardial patch (or PTFE / Dacron)"],
    consumables: ["Heparin 5000 units IV (with protamine reversal)", "6-0 Prolene for patch closure"],
  },
  specimens: { default: "Carotid plaque to pathology — confirms atherosclerotic etiology and grades vulnerability." },
  tubesAndDrains: { default: "None routinely." },
  complicationChecks: [
    { label: "Stroke (peri-operative ~2%)" },
    { label: "Cranial nerve injury (hypoglossal — tongue deviation; vagus / RLN — hoarseness; marginal mandibular — lip droop)" },
    { label: "Neck hematoma (compression airway emergency)" },
    { label: "Hyperperfusion syndrome (hypertension + headache + seizures days post-op)" },
    { label: "Restenosis (long-term)" },
  ],
  postopPlan: {
    disposition: "Step-down × 24 h for neuro + BP + neck-hematoma checks.",
    analgesia: "Multimodal oral.",
    antibiotics: "Single perioperative dose.",
    activity: "Strict BP control (target SBP 120-140); IV nicardipine drip available bedside.",
    followup: [
      "Carotid duplex at 1 month, 6 months, then annually × 5 yrs",
      "Continue antiplatelet (ASA + clopidogrel × 30 days post-op then ASA alone) and statin",
      "Smoking cessation, BP / lipid optimisation",
    ],
    returnPrecautions: ["New focal neuro deficit", "Sudden neck swelling / difficulty breathing (hematoma)", "Severe headache (hyperperfusion)"],
  },
  requiredFields: [
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "stenosis_pct", label: "Preop stenosis (%)", type: "number" },
    { id: "shunt_used", label: "Shunt placed", type: "boolean" },
    { id: "stump_pressure_mmhg", label: "Stump pressure (mmHg)", type: "number" },
    { id: "patch_material", label: "Patch material", type: "enum", options: ["Bovine pericardium", "PTFE", "Dacron", "Vein", "No patch (eversion CEA)"] },
    { id: "act_sec", label: "Peak ACT (sec)", type: "number" },
  ],
});

export const FEM_POP_BYPASS = v({
  key: "vascular.open.fem_pop_bypass",
  subcategory: "open",
  procedureName: "Femoral-popliteal bypass",
  synonyms: ["fem-pop bypass", "femoral popliteal bypass"],
  matchPatterns: [/\bfem[-\s]?pop\b|\bfemoral\s+popliteal\s+bypass/i],
  topMatter: {
    anesthesia: "General with arterial line.",
    position: "Supine with operative leg externally rotated and slightly flexed at knee.",
    prep: "Operative leg prepped from groin to foot; contralateral GSV harvest path also prepped if needed.",
    ebl: "200-400 mL.",
    disposition: "Step-down × 24 h then surgical floor; LOS 3-5 days.",
  },
  findings: {
    headline: "[Right / Left] [above-knee / below-knee] popliteal target vessel patent and suitable. Inflow CFA: soft, pulsatile, free of significant disease. Outflow [3-vessel runoff / 2-vessel / single-vessel to ___]. Conduit: ipsilateral GSV diameter ___ mm (> 3 mm acceptable, > 4 mm preferred). End-to-side anastomoses tension-free; palpable pulse throughout graft post-clamp release; restored Doppler signals at DP / PT distally. Completion duplex / angiography confirmed graft patency without kinking or distal embolisation.",
  },
  operativeSteps: {
    steps: [
      "Longitudinal incision over CFA; CFA, SFA, profunda exposed and encircled with vessel loops.",
      "Second incision over [above-knee / below-knee] popliteal artery; target segment exposed.",
      "Ipsilateral GSV harvested through skin-bridge incisions; tributaries ligated with 4-0 silk; vein flushed with heparinised saline; prepared as [reversed conduit / in-situ with valvulotomy].",
      "[If GSV unavailable: 6 mm ringed PTFE.]",
      "Heparin 100 U/kg IV; ACT > 250 sec.",
      "Subcutaneous tunnel created between two incisions (anatomic for native; subcutaneous for prosthetic).",
      "Proximal anastomosis: longitudinal arteriotomy on CFA; end-to-side with running 5-0 Prolene using parachute technique for the heel; flushing before final tying.",
      "Distal anastomosis: end-to-side to popliteal artery with running 6-0 Prolene (loupe magnification for distal targets).",
      "Sequential clamp release: distal first, then proximal. Strong palpable pulse throughout graft; Doppler signals confirmed at DP and PT.",
      "Completion [angiography / duplex] confirms patency without kink or distal embolisation.",
      "Protamine 50 mg IV (1 mg per 100 U heparin) for partial reversal.",
    ],
    closure: "Wound closed in layers: muscle/fascia with 0 Vicryl, subcutaneous with 3-0 Vicryl, skin with 4-0 Monocryl subcuticular.",
  },
  devices: {
    instruments: ["Vascular tray", "Saphenous vein-stripping kit (for in-situ valvulotomy)"],
    implants: ["[Reversed GSV / In-situ GSV with valvulotomy / 6 mm ringed PTFE / Composite]"],
    consumables: ["5-0 + 6-0 Prolene for anastomoses", "Heparin + protamine"],
  },
  specimens: { default: "None routinely." },
  tubesAndDrains: { default: "Foley × 24 h; no surgical drains." },
  complicationChecks: [
    { label: "Graft thrombosis / occlusion (acute or delayed)" },
    { label: "Wound infection (groin most common)" },
    { label: "Bleeding requiring re-exploration" },
    { label: "Distal embolisation" },
    { label: "Compartment syndrome (after long ischemic interval)" },
    { label: "Lymphocele (groin)" },
  ],
  postopPlan: {
    disposition: "Step-down × 24 h then floor.",
    catheter: "Foley × 24 h.",
    analgesia: "Multimodal oral.",
    antibiotics: "Single perioperative dose.",
    activity: "Hourly distal pulse + Doppler checks × 6 h then q4h × 24 h.",
    followup: [
      "Therapeutic anticoagulation transitioning to dual antiplatelet (ASA + clopidogrel × 6 weeks then ASA alone)",
      "Surveillance duplex at 1, 3, 6, 12 months, then annually",
      "VOYAGER PAD: rivaroxaban 2.5 mg BID + ASA × 12 months supports patency",
    ],
    returnPrecautions: ["Sudden cold or pulseless foot (graft thrombosis)", "Increasing pain in calf (compartment syndrome)", "Wound infection signs"],
  },
  requiredFields: [
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "distal_target", label: "Distal target", type: "enum", options: ["Above-knee popliteal", "Below-knee popliteal", "Tibial / pedal (distal bypass)"] },
    { id: "conduit", label: "Conduit", type: "enum", options: ["Reversed GSV", "In-situ GSV with valvulotomy", "Contralateral GSV", "6 mm ringed PTFE", "8 mm ringed PTFE", "Composite"] },
    { id: "runoff", label: "Distal runoff", type: "enum", options: ["3-vessel", "2-vessel", "Single-vessel"] },
    { id: "completion_imaging", label: "Completion imaging", type: "enum", options: ["Angiography", "Duplex", "Both"] },
  ],
});

export const AV_FISTULA = v({
  key: "vascular.access.av_fistula",
  subcategory: "access",
  procedureName: "Arteriovenous fistula creation",
  synonyms: ["av fistula", "avf", "arteriovenous fistula", "dialysis access"],
  matchPatterns: [/\b(av\s+fistula|avf|arteriovenous\s+fistula|dialysis\s+access)\b/i],
  topMatter: {
    anesthesia: "Regional (axillary / supraclavicular brachial plexus) with monitored anesthesia care.",
    position: "Supine with operative arm on hand table.",
    prep: "Operative arm prepped circumferentially shoulder to fingertips.",
    ebl: "Minimal.",
    disposition: "Discharge home same-day with thrill / bruit confirmed at anastomosis.",
  },
  findings: {
    headline: "[Right / Left] [radiocephalic / brachiocephalic / brachiobasilic] AV fistula configuration per pre-operative vein mapping. Target vein: ___ mm caliber, free of prior cannulation injury. Inflow artery: > 2 mm and soft. End-to-side anastomosis with running 6-0 Prolene. On clamp release: strong palpable thrill across anastomosis and clearly audible bruit distally. No steal, hematoma, or anastomotic stenosis.",
  },
  operativeSteps: {
    steps: [
      "Longitudinal incision over the planned [radiocephalic / brachiocephalic / brachiobasilic] anastomosis location.",
      "Cephalic / basilic vein identified, dissected free, controlled with vessel loops.",
      "Radial / brachial artery similarly exposed.",
      "Heparin 50 U/kg IV.",
      "Vein mobilised adequately for tension-free anastomosis; divided distally.",
      "Longitudinal arteriotomy created; end-to-side anastomosis between vein and artery with running 7-0 Prolene (parachute technique for heel; flush before final tying).",
      "Flow restored: audible thrill and palpable pulse confirmed through fistula. Doppler distal to anastomosis confirms patency without distal steal.",
      "Hemostasis confirmed.",
      "[Brachiobasilic specifically: basilic vein transposition — vein lifted from medial arm into a more superficial subcutaneous tunnel for cannulation accessibility.]",
    ],
    closure: "Wound closed in layers with 4-0 Vicryl + 5-0 Monocryl subcuticular.",
  },
  devices: {
    instruments: ["Microvascular tray", "Loupe magnification (×3.5-4.5)"],
    consumables: ["6-0 / 7-0 Prolene for anastomosis", "Heparin 50 U/kg IV"],
  },
  specimens: { default: "None." },
  tubesAndDrains: { default: "None." },
  complicationChecks: [
    { label: "Fistula failure to mature (~30%)" },
    { label: "Steal syndrome (distal ischemia from arterial diversion)" },
    { label: "Aneurysm / pseudoaneurysm (long-term cannulation effect)" },
    { label: "Central vein stenosis" },
    { label: "Thrombosis" },
  ],
  postopPlan: {
    disposition: "Discharge home same-day.",
    analgesia: "Acetaminophen + NSAID.",
    activity: "No BP measurements / IVs / venous draws on operative arm permanently. Strengthening exercises: ball squeezes 10× × 4/day to encourage maturation.",
    followup: [
      "Clinic at 2 weeks for incision check + fistula assessment",
      "Maturation duplex at 4-6 weeks (Rule of 6s — diameter > 6 mm, depth < 6 mm from skin, flow > 600 mL/min)",
      "Pre-cannulation duplex prior to first dialysis use",
    ],
    returnPrecautions: ["Loss of thrill / bruit (thrombosis)", "Pale / cold / painful hand (steal syndrome)", "Wound infection signs"],
  },
  requiredFields: [
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "configuration", label: "Configuration", type: "enum", options: ["Radiocephalic (Brescia-Cimino)", "Brachiocephalic", "Brachiobasilic with transposition", "Snuffbox", "Other"] },
    { id: "vein_diameter_mm", label: "Vein diameter (mm)", type: "number" },
    { id: "thrill_present", label: "Thrill present at anastomosis", type: "boolean" },
  ],
});

export const EVAR = v({
  key: "vascular.endo.evar",
  subcategory: "endo",
  procedureName: "Endovascular aortic aneurysm repair (EVAR)",
  synonyms: ["evar", "endovascular aneurysm repair"],
  matchPatterns: [/\bevar\b|\bendovascular\s+aneurysm\s+repair/i],
  topMatter: {
    anesthesia: "General endotracheal with arterial line + central access; some centres do EVAR under regional / local for percutaneous bilateral femoral access.",
    position: "Supine on radiolucent angio table.",
    prep: "Bilateral groins prepped; abdomen available for conversion to open.",
    ebl: "100-300 mL.",
    disposition: "ICU or step-down × 24 h then floor; LOS 1-3 days.",
  },
  findings: {
    headline: "AAA on CTA: maximum sac diameter ___ cm; infrarenal neck length ___ mm with diameter ___ mm and angulation ___° (within IFU); iliac access bilaterally ___ mm and free of significant tortuosity / calcification. Endograft deployed: [Gore Excluder / Medtronic Endurant / Cook Zenith] main body + contralateral limb. Completion angiography demonstrated exclusion of aneurysm sac without type I or III endoleak; type II endoleak [present / absent].",
  },
  operativeSteps: {
    steps: [
      "Bilateral common femoral arteries accessed percutaneously under ultrasound guidance with pre-closure using two Perclose ProGlide devices on each side (total 4). 5 Fr sheaths placed; guidewires advanced under fluoroscopy into descending thoracic aorta.",
      "Calibrated pigtail catheter advanced; aortogram performed to identify renal arteries and iliac bifurcation in working projection.",
      "Sheaths upsized to accommodate main body and contralateral limb of [Gore Excluder / Medtronic Endurant / Cook Zenith] endograft per IFU.",
      "Heparin 100 U/kg IV; ACT > 250 sec.",
      "Main body deployed with the lowest renal artery as proximal landing zone (1-2 mm caudal to renal artery orifice) and contralateral gate oriented for cannulation.",
      "Contralateral gate cannulated from contralateral femoral access; contralateral limb deployed.",
      "Molding balloon angioplasty performed at proximal neck, flow divider, and bilateral distal landing zones.",
      "Completion angiography in AP and lateral: aneurysm sac excluded without type I or type III endoleak; renal and hypogastric arteries patent. Type II (lumbar / IMA) endoleak [absent / present — small, observed].",
      "Sheaths removed; pre-placed ProGlide sutures cinched down achieving hemostasis. Protamine 50 mg IV.",
    ],
  },
  devices: {
    instruments: ["Hybrid OR / angio suite with C-arm fluoroscopy", "Pigtail catheter for aortogram", "Reliant molding balloon"],
    implants: ["[Gore Excluder / Medtronic Endurant / Cook Zenith] modular endograft", "Perclose ProGlide × 4 for percutaneous closure"],
    consumables: ["Heparin + protamine", "Iodinated contrast (Omnipaque)"],
  },
  specimens: { default: "None." },
  tubesAndDrains: { default: "Foley × 24 h." },
  complicationChecks: [
    { label: "Type I endoleak (proximal or distal seal failure — requires revision)" },
    { label: "Type II endoleak (lumbar / IMA backflow — usually observed; intervene if sac enlarges)" },
    { label: "Type III endoleak (modular junction — requires revision)" },
    { label: "Limb occlusion" },
    { label: "Access site bleeding / hematoma / pseudoaneurysm" },
    { label: "Post-implantation syndrome (fever + leukocytosis days post-op)" },
  ],
  postopPlan: {
    disposition: "Step-down or floor × 24 h.",
    catheter: "Foley × 24 h.",
    analgesia: "Acetaminophen + NSAID.",
    antibiotics: "Single perioperative dose.",
    activity: "Light activity × 4 weeks; no heavy lifting.",
    followup: [
      "CT angiography at 1 month, 6 months, 12 months, then annually for life",
      "Surveillance for endoleak progression and sac enlargement",
      "Smoking cessation, BP / lipid / glucose optimisation",
    ],
    returnPrecautions: ["Severe back / flank pain", "Sudden cold / blue leg (limb occlusion)", "Groin swelling / fever"],
  },
  requiredFields: [
    { id: "device", label: "Device", type: "enum", options: ["Gore Excluder", "Medtronic Endurant II/IIs", "Cook Zenith Flex", "Other"] },
    { id: "main_body_size_mm", label: "Main body diameter (mm)", type: "number" },
    { id: "neck_diameter_mm", label: "Neck diameter (mm)", type: "number" },
    { id: "neck_length_mm", label: "Neck length (mm)", type: "number" },
    { id: "type1_or_3_endoleak", label: "Type I/III endoleak on completion", type: "boolean" },
    { id: "type2_endoleak", label: "Type II endoleak on completion", type: "boolean" },
    { id: "percutaneous_closure", label: "Percutaneous closure (ProGlide)", type: "boolean" },
  ],
});

export const BKA = v({
  key: "vascular.amputation.bka",
  subcategory: "amputation",
  procedureName: "Below-knee amputation",
  synonyms: ["below-knee amputation", "bka", "transtibial amputation"],
  matchPatterns: [/\bbelow[-\s]?knee\s+amputation|\bbka\b|\btranstibial\s+amputation/i],
  topMatter: {
    anesthesia: "General or regional (femoral + sciatic blocks).",
    position: "Supine with sandbag under ipsilateral hip; tourniquet at thigh (avoided in dysvascular patients).",
    prep: "Operative leg prepped circumferentially; contaminated foot wrapped in sterile stockinette with iodine-soaked gauze.",
    ebl: "200-400 mL.",
    disposition: "Surgical floor; LOS 3-7 days; rehab consult.",
  },
  findings: {
    headline: "[Right / Left] non-salvageable limb ischemia / wet gangrene / chronic non-healing wound. Tissue at planned amputation level (12-15 cm distal to tibial tuberosity) viable and free of infection. Skin flaps healthy and tension-free at closure.",
  },
  operativeSteps: {
    steps: [
      "Long posterior musculocutaneous flap (Burgess) and short anterior flap marked at 12-15 cm distal to tibial tuberosity. Posterior flap length 1.5-2× the AP diameter of the calf.",
      "Anterior incision deepened through skin and subcutaneous tissue. Anterior compartment muscles transected with electrocautery 2-3 cm distal to planned bone cut.",
      "Anterior tibial artery and vein doubly clamped, transected, triple-suture-ligated with 2-0 silk. Deep peroneal nerve sharply transected on stretch with #15 blade and allowed to retract proximally (prevents painful neuroma).",
      "Interosseous membrane divided. Lateral compartment (peroneus longus + brevis) transected; peroneal vessels ligated.",
      "Fibula transected ~2 cm proximal to planned tibial cut using sagittal saw or Gigli saw — fibula short cut essential for proper stump shape.",
      "Tibia transected at planned level using sagittal saw with anterior bevel of 1-2 cm length to prevent skin pressure points.",
      "Periosteum elevated 1 cm proximal to bone cut and trimmed flush. Medullary canal inspected.",
      "Posterior compartment (gastrocnemius + soleus) transected at level of bone cut using sharp #20 blade ('amputation knife') — preserved as the long flap (robust posterior tibial artery blood supply).",
      "Posterior tibial vessels doubly ligated with 2-0 silk and transected. Tibial nerve gently pulled distally, sharply transected on stretch (no ligature on nerve trunk — causes neuroma).",
      "Bony edges rasped smooth. Hemostasis meticulously confirmed. Wound irrigated with saline.",
      "Posterior musculocutaneous flap rotated anteriorly. Myodesis (suturing posterior compartment muscle to anterior tibia through pre-drilled holes — Burgess technique) with #1 Vicryl × 4-6 sutures.",
    ],
    closure: "Excess posterior flap tailored. Deep fascia closed with running 0 Vicryl. Skin closed loosely with interrupted 3-0 nylon vertical mattress sutures (or staples) — loose closure essential to allow drainage of postoperative edema. Bulky pressure dressing + immediate postoperative rigid prosthetic dressing (IPOP — preferred to prevent flexion contracture and promote early prosthetic fitting).",
  },
  devices: {
    instruments: ["Amputation tray", "Sagittal / Gigli saw", "Bone rasp"],
    consumables: ["#1 Vicryl × 4-6 for myodesis", "0 silk for vascular ligation", "Rigid postoperative prosthetic dressing (IPOP)"],
  },
  specimens: { default: "Amputated limb to pathology if indicated by underlying pathology (tumor)." },
  tubesAndDrains: { default: "None routinely." },
  complicationChecks: [
    { label: "Stump breakdown (poor healing — common in dysvascular patients)" },
    { label: "Phantom limb pain" },
    { label: "Flexion contracture (knee)" },
    { label: "Contralateral limb loss within 5 yrs (~50% of dysvascular amputees)" },
    { label: "DVT/PE" },
  ],
  postopPlan: {
    disposition: "Surgical floor; LOS 3-7 days; rehab consult.",
    analgesia: "Multimodal + phantom-limb pain prevention (gabapentin 300 mg TID + amitriptyline 25 mg qhs); regional catheters × 48 h.",
    antibiotics: "Tailored to wound contamination — broad-spectrum (piperacillin-tazobactam) for infected wet gangrene; cefazolin alone for clean amputations.",
    activity: "Knee extension splint to prevent flexion contracture; PT focus on quadriceps strengthening, transfer training.",
    followup: [
      "Wound check at 2 weeks for staple/suture removal",
      "Stump shrinker sock at 2-3 weeks once wound healed",
      "First prosthetic fitting at 6-8 weeks once stump shape stabilised",
      "Contralateral limb optimisation",
    ],
    returnPrecautions: ["Wound discharge / dehiscence", "Increasing stump pain", "Contralateral limb new symptoms"],
  },
  requiredFields: [
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "indication", label: "Indication", type: "enum", options: ["Chronic limb-threatening ischemia (failed bypass)", "Wet gangrene with sepsis", "Dry gangrene with non-viable foot", "Diabetic foot infection (Wagner 4-5)", "Trauma", "Tumor"] },
    { id: "flap_technique", label: "Flap technique", type: "enum", options: ["Long posterior (Burgess)", "Equal sagittal (Skew)", "Equal posterior + anterior fishmouth"] },
    { id: "myodesis_done", label: "Myodesis performed", type: "boolean" },
    { id: "ipop_applied", label: "IPOP rigid dressing applied", type: "boolean" },
  ],
});

export const VASCULAR_TEMPLATES: ProcedureTemplate[] = [
  CEA,
  FEM_POP_BYPASS,
  AV_FISTULA,
  EVAR,
  BKA,
];
