// ---------------------------------------------------------------------------
// Cardiothoracic Surgery — procedure-specific dictation templates
// ---------------------------------------------------------------------------

import type { ProcedureTemplate } from "./types";

const ct = (
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
): ProcedureTemplate => ({ specialty: "cardiothoracic", ...partial });

export const CABG = ct({
  key: "cardiothoracic.cardiac.cabg",
  subcategory: "cardiac",
  procedureName: "Coronary artery bypass grafting",
  synonyms: ["cabg", "coronary artery bypass grafting", "coronary bypass"],
  matchPatterns: [/\bcabg\b|\bcoronary\s+artery\s+bypass|\bcoronary\s+bypass/i],
  topMatter: {
    anesthesia: "General endotracheal with arterial line, central venous access, PA catheter, and intraoperative TEE.",
    position: "Supine; arms tucked; legs prepped if vein harvest from saphenous.",
    prep: "Chest + bilateral legs (for SVG harvest) + bilateral arms (radial harvest) prepped widely.",
    ebl: "400-800 mL.",
    disposition: "Cardiac ICU intubated and on minimal vasoactive support; standard post-cardiac pathway.",
  },
  findings: {
    headline: "Preoperative cardiac catheterisation demonstrated severe triple-vessel coronary artery disease with [___% LAD / ___% LCx-OM / ___% RCA] stenoses. Preoperative EF [___%]. Pre-bypass TEE: preserved biventricular function, no significant valvular disease. Aortic and bicaval cannulation without complication. CPB time [___] min, cross-clamp [___] min. Antegrade + retrograde cold blood cardioplegia for myocardial protection. Grafts: LIMA → LAD, SVG to [___, ___]. All anastomoses inspected and widely patent with good Doppler signals. Weaning from bypass uneventful. Post-bypass TEE: preserved biventricular function without new wall motion abnormalities.",
  },
  operativeSteps: {
    steps: [
      "Median sternotomy with sagittal saw; sternal retractor placed.",
      "Left internal mammary artery (LIMA) harvested in [pedicled / skeletonised] fashion from first intercostal space to bifurcation, using bipolar + small clips for side branches.",
      "Saphenous vein harvested endoscopically from leg (or open).",
      "Pericardium opened in inverted-T fashion and tacked up.",
      "Heparin 400 U/kg IV; ACT verified > 480 sec.",
      "Ascending aorta cannulated with 22 Fr arterial cannula; right atrium with two-stage venous cannula. Cardiopulmonary bypass initiated; patient cooled to 32-34°C.",
      "Aorta cross-clamped. Antegrade cold blood cardioplegia delivered via aortic root achieving prompt diastolic arrest. Retrograde cardioplegia via coronary sinus as adjunct.",
      "[LAD, diagonal, OM, PDA, RCA] targets sequentially exposed. Arteriotomies made; distal anastomoses end-to-side with running 7-0 or 8-0 Prolene under loupe magnification.",
      "LIMA anastomosed to LAD; SVGs to remaining targets. Proximal SVG anastomoses constructed on partial side-biting clamp.",
      "Aorta de-aired. Cross-clamp removed (total cross-clamp time: ___ min). Cardiac activity returned. Patient rewarmed.",
      "Pacing wires placed. Bypass weaned without difficulty.",
      "Protamine administered 1:1 with heparin for full reversal. Cannulae removed; purse-string sutures tied.",
      "Hemostasis confirmed.",
    ],
    closure: "Mediastinal + bilateral pleural 32 Fr chest tubes placed. Sternum re-approximated with stainless steel wires (5-7 wires). Subcutaneous tissue with 0 Vicryl; skin with running 4-0 Monocryl.",
  },
  devices: {
    instruments: ["Sternal saw + retractor (Finochietto)", "Cardiopulmonary bypass circuit + aortic + bicaval cannulas", "Endoscopic saphenous vein harvest system"],
    consumables: ["7-0/8-0 Prolene for distal anastomoses", "5-0/6-0 Prolene for proximal anastomoses", "Heparin 400 U/kg + protamine 1:1", "Cold blood cardioplegia"],
  },
  specimens: { default: "None routinely." },
  tubesAndDrains: { default: "Mediastinal + bilateral pleural 32 Fr chest tubes; temporary atrial + ventricular pacing wires." },
  complicationChecks: [
    { label: "Postoperative bleeding requiring re-exploration (~3%)" },
    { label: "Atrial fibrillation (~30% — rate / rhythm control)" },
    { label: "Stroke (1-3%)" },
    { label: "Sternal wound infection / mediastinitis" },
    { label: "Acute kidney injury" },
    { label: "Graft failure (early or late)" },
  ],
  postopPlan: {
    disposition: "Cardiac ICU.",
    analgesia: "Multimodal: scheduled acetaminophen + NSAID + opioid (PCA).",
    antibiotics: "Cefazolin 24 h; vancomycin if MRSA risk.",
    activity: "Early extubation < 6 h when possible; cardiac rehab POD 3-4.",
    followup: [
      "Aspirin 81 mg lifelong + statin",
      "Beta-blocker for AF prophylaxis × 30 days",
      "Cardiac rehab × 8-12 weeks",
      "Clinic at 1 week, 4 weeks, 3 months, 1 year",
    ],
    returnPrecautions: ["Sternal click / instability", "Wound drainage / fever", "Chest pain / dyspnea / palpitations"],
  },
  requiredFields: [
    { id: "vessels_grafted", label: "Vessels grafted", type: "text" },
    { id: "lima_to_lad", label: "LIMA to LAD", type: "boolean" },
    { id: "cpb_time_min", label: "CPB time (min)", type: "number" },
    { id: "cross_clamp_time_min", label: "Cross-clamp time (min)", type: "number" },
    { id: "preop_ef_pct", label: "Preop EF (%)", type: "number" },
    { id: "off_pump", label: "Off-pump CABG", type: "boolean" },
  ],
});

export const AVR = ct({
  key: "cardiothoracic.cardiac.avr",
  subcategory: "cardiac",
  procedureName: "Aortic valve replacement (SAVR)",
  synonyms: ["avr", "aortic valve replacement", "savr"],
  matchPatterns: [/\bavr\b|\baortic\s+valve\s+replacement|\bsavr\b/i],
  topMatter: {
    anesthesia: "General endotracheal with arterial line, central venous access, PA catheter, intraoperative TEE.",
    position: "Supine; arms tucked.",
    prep: "Chest prepped widely.",
    ebl: "400-600 mL.",
    disposition: "Cardiac ICU intubated; standard post-cardiac pathway.",
  },
  findings: {
    headline: "Preoperative TTE + catheterisation showed severe aortic stenosis: mean gradient ___ mmHg, peak velocity ___ m/s, valve area ___ cm². Preoperative EF [___%]. Native valve [tricuspid / bicuspid] and heavily calcified. Pre-bypass TEE confirmed findings. CPB time [___] min, cross-clamp [___] min. Antegrade cold blood cardioplegia. Native valve excised; annulus debrided and sized. [___ mm bovine pericardial / mechanical bileaflet] prosthesis secured with pledgeted 2-0 Ethibond sutures. Post-bypass TEE: well-seated valve, no paravalvular leak, trace transvalvular gradient, preserved biventricular function.",
  },
  operativeSteps: {
    steps: [
      "Median sternotomy; pericardium opened and tacked up.",
      "Aortic + two-stage right atrial venous cannulation. Heparin 400 U/kg IV; ACT > 480.",
      "Cardiopulmonary bypass initiated.",
      "Aorta cross-clamped. Cardioplegia delivered antegrade via root + retrograde via coronary sinus achieving diastolic arrest.",
      "Transverse aortotomy made above sinotubular junction.",
      "Diseased native aortic valve inspected and excised; annulus debrided of calcium.",
      "Annulus sized.",
      "[___ mm bovine pericardial / mechanical bileaflet] prosthesis chosen.",
      "Pledgeted 2-0 Ethibond sutures placed in non-everting mattress fashion around annulus and brought through sewing ring of valve; valve parachuted into position and tied.",
      "Prosthesis inspected: unobstructed coronary ostia + free leaflet motion.",
      "Aortotomy closed in two layers with 4-0 Prolene.",
      "Heart de-aired. Cross-clamp removed (total cross-clamp time: ___ min). Patient rewarmed and weaned off bypass without difficulty.",
      "Protamine administered. Hemostasis confirmed.",
    ],
    closure: "Mediastinal + bilateral pleural 32 Fr chest tubes placed. Sternum closed with stainless steel wires.",
  },
  devices: {
    instruments: ["Standard cardiac surgery tray + sternal retractor", "CPB circuit + aortic + bicaval cannulas"],
    implants: ["[___ mm bovine pericardial (Carpentier-Edwards Magna Ease, St Jude Trifecta) / mechanical bileaflet (St Jude, On-X)] aortic prosthesis"],
    consumables: ["Pledgeted 2-0 Ethibond sutures × 12-15 for valve placement", "4-0 Prolene for aortotomy closure"],
  },
  specimens: { default: "Native aortic valve leaflets to pathology." },
  tubesAndDrains: { default: "Mediastinal + bilateral pleural chest tubes; pacing wires." },
  complicationChecks: [
    { label: "Paravalvular leak (intraoperative TEE — needs revision)" },
    { label: "Heart block requiring permanent pacemaker (~5%)" },
    { label: "Postoperative bleeding" },
    { label: "Stroke" },
    { label: "Endocarditis (rare; lifetime)" },
  ],
  postopPlan: {
    disposition: "Cardiac ICU.",
    analgesia: "Multimodal + PCA.",
    antibiotics: "Cefazolin 24 h.",
    activity: "Cardiac rehab POD 3-4.",
    followup: [
      "Mechanical valve: warfarin lifelong (INR target 2.5-3.5)",
      "Bioprosthetic: ASA 81 mg + warfarin × 3 months then ASA alone",
      "Echocardiogram at 1 month, 6 months, then annually",
      "Endocarditis prophylaxis lifelong",
    ],
  },
  requiredFields: [
    { id: "valve_type", label: "Valve type", type: "enum", options: ["Bioprosthetic (porcine)", "Bioprosthetic (bovine pericardial — Magna Ease, Trifecta)", "Mechanical bileaflet (St Jude, On-X)", "Mechanical (CarboMedics)", "Homograft", "Ross procedure (autograft)"] },
    { id: "valve_size_mm", label: "Valve size (mm)", type: "number" },
    { id: "cpb_time_min", label: "CPB time (min)", type: "number" },
    { id: "cross_clamp_time_min", label: "Cross-clamp time (min)", type: "number" },
    { id: "preop_mean_gradient", label: "Preop mean gradient (mmHg)", type: "number" },
  ],
});

export const VATS_LOBECTOMY = ct({
  key: "cardiothoracic.thoracic.vats_lobectomy",
  subcategory: "thoracic",
  procedureName: "VATS lobectomy",
  synonyms: ["vats lobectomy", "thoracoscopic lobectomy", "lobectomy"],
  matchPatterns: [/\bvats\s+lobectom|\bthoracoscopic\s+lobectom|\b(?<!pneumon)lobectom/i],
  topMatter: {
    anesthesia: "General endotracheal with double-lumen ETT for selective single-lung ventilation; arterial line; epidural / paravertebral block for postoperative analgesia.",
    position: "Lateral decubitus with operative side up.",
    prep: "Operative hemithorax prepped from clavicle to costal margin.",
    ebl: "100-300 mL.",
    disposition: "Thoracic step-down; LOS 3-5 days.",
  },
  findings: {
    headline: "Operative lung collapsed well after one-lung ventilation initiated. [Right upper / right middle / right lower / left upper / left lower] lobe contained ___ cm mass consistent with preoperative imaging — no gross pleural or chest wall invasion. Mediastinal + hilar lymph nodes sampled from stations [___, ___, ___]. Pulmonary vein, artery, bronchus identified, isolated, and divided with endoscopic staplers. Bronchial stump tested underwater — no air leak.",
  },
  operativeSteps: {
    steps: [
      "Lateral decubitus position with operative side up; double-lumen ETT for selective single-lung ventilation.",
      "10 mm camera port placed at 7th intercostal space mid-axillary line.",
      "Two additional working ports under direct vision: 4 cm utility incision in 4th intercostal space anteriorly + 10 mm port in 8th intercostal space posteriorly.",
      "Pleural space inspected; adhesions lysed sharply.",
      "[Right upper / right middle / right lower / left upper / lingula / left lower] lobe mobilised; fissure completed with endostapler.",
      "Pulmonary artery branches to the lobe individually dissected, test-clamped, and divided sequentially with vascular endostaplers (Endo GIA white load).",
      "Pulmonary vein to the lobe similarly dissected and divided with vascular stapler.",
      "Lobar bronchus skeletonised; transected with endoscopic stapler (Endo GIA tan load).",
      "Specimen placed in EndoBag retrieval bag and removed through utility incision.",
      "Systematic mediastinal lymph node sampling / dissection of stations [2R, 4R, 7, 9 right; 5, 6, 7, 9 left] as per AJCC criteria for adequate staging.",
      "Hemostasis + air leak checked with underwater test.",
    ],
    closure: "24 Fr chest tube placed through camera port site, directed apically + posteriorly. Lung re-expanded under direct vision. Port sites closed in layers: muscle + fascia with 0 Vicryl; skin with 4-0 Monocryl subcuticular.",
  },
  devices: {
    instruments: ["10 mm 30° thoracoscope", "Endo GIA stapler with white (vascular) + tan (bronchus) loads", "EndoBag specimen retrieval", "Energy device (Harmonic / LigaSure)"],
  },
  specimens: { default: "Resected lobe to permanent pathology + mediastinal lymph nodes submitted separately by station (≥ 12 nodes for adequate AJCC staging)." },
  tubesAndDrains: { default: "24 Fr chest tube to suction × 24-72 h; removed when no air leak + drainage < 200 mL/24 h." },
  complicationChecks: [
    { label: "Postoperative air leak (especially incomplete fissure or chronic emphysema — 10-15% > 5 days)" },
    { label: "Atelectasis / pneumonia" },
    { label: "Bronchopleural fistula (rare; staple-line failure)" },
    { label: "Atrial fibrillation (~25%)" },
    { label: "Chylothorax (left-sided lobectomies — thoracic duct injury)" },
  ],
  postopPlan: {
    disposition: "Thoracic step-down.",
    catheter: "Foley × 24 h; chest tube to suction × 24-72 h.",
    analgesia: "Epidural × 48-72 h; transition to multimodal oral.",
    antibiotics: "Cefazolin 24 h.",
    activity: "Aggressive pulmonary toilet (incentive spirometry q1h while awake); early ambulation POD 0-1.",
    followup: [
      "Pathology + final stage at 7-10 days",
      "Adjuvant chemo discussion if pT2+ or N+ (NSCLC) per NCCN",
      "Surveillance CT at 6 months, 12 months, then annually × 5 years",
    ],
    returnPrecautions: ["Worsening dyspnea / chest pain", "Persistent air leak / new pneumothorax", "Fever, productive cough, or dehydration"],
  },
  requiredFields: [
    { id: "lobe_resected", label: "Lobe resected", type: "enum", options: ["Right upper", "Right middle", "Right lower", "Left upper", "Lingula", "Left lower", "Bilobectomy"] },
    { id: "approach", label: "Approach", type: "enum", options: ["VATS (3-port)", "VATS uniportal", "Robotic (DaVinci)", "Open thoracotomy"] },
    { id: "indication", label: "Indication", type: "enum", options: ["NSCLC", "Solitary pulmonary nodule (suspicious)", "Metastasis (oligometastatic)", "Bronchiectasis", "Aspergilloma", "Other"] },
    { id: "tumor_size_cm", label: "Tumor size (cm)", type: "number" },
    { id: "lymph_nodes_sampled", label: "Lymph nodes sampled (count)", type: "number" },
    { id: "intraop_air_leak", label: "Intraoperative air leak", type: "boolean" },
  ],
});

export const CHEST_TUBE = ct({
  key: "cardiothoracic.thoracic.chest_tube",
  subcategory: "thoracic",
  procedureName: "Tube thoracostomy (chest tube)",
  synonyms: ["chest tube", "tube thoracostomy", "pleural drain"],
  matchPatterns: [/\bchest\s+tube|\btube\s+thoracostomy|\bpleural\s+drain/i],
  topMatter: {
    anesthesia: "Local 1% lidocaine with epinephrine + IV sedation; topical EMLA for awake bedside placement.",
    position: "Supine with operative arm raised over head exposing lateral chest wall and the 'safe triangle'.",
    prep: "Skin prepped with chlorhexidine + sterile draped widely.",
    ebl: "Minimal.",
    disposition: "Per indication — admit for monitoring of drain output + air leak assessment.",
  },
  findings: {
    headline: "[Right / Left] [pleural effusion / pneumothorax / hemothorax / empyema] confirmed on preoperative imaging. Pleural space entered through [4th/5th] intercostal space at [mid / anterior / posterior] axillary line within the safe triangle. ___ mL of [serous / sanguinous / purulent / chylous] fluid drained. Lung re-expansion confirmed on post-insertion CXR.",
  },
  operativeSteps: {
    steps: [
      "Patient positioned with operative arm raised; safe triangle identified — bordered anteriorly by lateral pectoralis major, posteriorly by anterior latissimus dorsi, inferiorly by line through nipple level (5th intercostal space).",
      "Sterile prep with chlorhexidine; sterile drape; surgical time-out confirming side, indication, and recent imaging.",
      "Local anesthetic (1% lidocaine + epinephrine 5-10 mL) infiltrated subcutaneously, into intercostal muscle (over SUPERIOR border of rib below to avoid intercostal neurovascular bundle which runs at inferior rib border), and into parietal pleura (parietal pleura is highly pain-sensitive).",
      "Needle advanced over rib until aspiration of air or fluid confirms pleural entry; then anesthesia delivered.",
      "3 cm transverse skin incision one intercostal space below the planned tube insertion site (allowing tube to traverse a soft-tissue tunnel as a flutter valve).",
      "Blunt dissection with Kelly clamp through subcutaneous tissue + intercostal muscles, hugging the SUPERIOR border of the rib below to avoid the neurovascular bundle.",
      "Parietal pleura entered with controlled 'pop' sensation; air or fluid escapes confirming entry.",
      "Finger sweep performed through pleural opening to: (1) confirm pleural entry vs subcutaneous / extrapleural placement; (2) detect any visceral or parietal pleural adhesions; (3) sweep tube path free.",
      "Chest tube ([28-32 Fr for hemothorax / empyema, 14-16 Fr small-bore pigtail for simple pneumothorax / transudate per BTS guidelines]) guided into pleural space through dissected tract, directed apically + posteriorly for pneumothorax (apex highest in supine) or posteriorly + inferiorly for effusion / blood (drains gravity-dependent fluid). All fenestrations confirmed within pleural space.",
      "Tube secured with two anchor stitches: (1) 'stay' stitch (0 silk vertical mattress through dermis on each side of wound — prevents dislodgement); (2) 'air knot' / purse-string at wound edge for closure at tube removal.",
      "Wound closed with simple interrupted 2-0 silk.",
      "Tube connected to closed underwater-seal drainage system (Pleur-Evac / Atrium Express): -20 cmH2O suction for pneumothorax with persistent air leak; water seal alone (-2 cmH2O) for resolved leak or simple effusion.",
    ],
    closure: "Sterile occlusive dressing (petrolatum gauze + dry gauze + tegaderm). Post-insertion portable upright CXR obtained to confirm: (1) tube position (last fenestration intrapleural); (2) lung re-expansion; (3) no acute complication.",
  },
  devices: {
    instruments: ["Standard chest tube tray (Kelly clamp, scissors, scalpel, hemostats)", "Fluoroscopy / ultrasound guidance for difficult cases"],
    implants: ["Chest tube (size determined by indication: 14-16 Fr small-bore for simple PTX, 28-32 Fr for hemothorax / empyema)"],
    consumables: ["Closed underwater-seal drainage system (Pleur-Evac / Atrium Express)", "0 silk for stay stitch + air knot"],
  },
  specimens: { default: "Pleural fluid sent for cell count, gram stain, culture, pH, LDH, protein, cytology (any fluid > 50 mL)." },
  tubesAndDrains: { default: "Chest tube to underwater seal ± suction." },
  complicationChecks: [
    { label: "Lung parenchymal injury (intraparenchymal placement)" },
    { label: "Diaphragm / liver / spleen injury (tube placed too low)" },
    { label: "Intercostal neurovascular bundle injury (chronic pain)" },
    { label: "Tube dislodgement / kink" },
    { label: "Re-expansion pulmonary edema (rapid drainage of large effusion)" },
  ],
  postopPlan: {
    disposition: "Admit for chest tube monitoring; serial CXR.",
    activity: "Per underlying pathology.",
    antibiotics: "Per indication (e.g., empyema requires prolonged course).",
    followup: [
      "Serial CXR at 4-6 h then daily",
      "Output (volume + character) tracked q4h; air leak assessed (continuous, intermittent with cough only, none)",
      "Transition from suction to water seal once lung fully re-expanded + air leak resolved or < 100 mL/h fluid output",
      "Tube removal at peak inspiration or expiration with breath-hold once: (a) no air leak × 12-24 h on water seal; (b) output < 200 mL/24 h non-chylous, non-bloody; (c) lung fully re-expanded on CXR",
      "Follow-up CXR at 4-6 h post-removal to rule out recurrent pneumothorax",
    ],
    returnPrecautions: ["Worsening dyspnea / chest pain", "Tube dislodgement", "Increasing drainage / change in character"],
  },
  requiredFields: [
    { id: "side", label: "Side", type: "enum", options: ["Right", "Left", "Bilateral"] },
    { id: "indication", label: "Indication", type: "enum", options: ["Pneumothorax", "Pleural effusion", "Hemothorax", "Empyema", "Chylothorax", "Iatrogenic / postoperative"] },
    { id: "tube_size_fr", label: "Tube size (Fr)", type: "enum", options: ["14 (pigtail)", "16 (pigtail)", "20", "28", "32", "36"] },
    { id: "intercostal_space", label: "Intercostal space", type: "enum", options: ["4th", "5th", "6th"] },
    { id: "fluid_volume_ml", label: "Initial drainage (mL)", type: "number" },
    { id: "fluid_character", label: "Fluid character", type: "enum", options: ["Air only (PTX)", "Serous", "Sanguinous", "Purulent", "Chylous", "Mixed"] },
  ],
});

export const CARDIOTHORACIC_TEMPLATES: ProcedureTemplate[] = [
  CABG,
  AVR,
  VATS_LOBECTOMY,
  CHEST_TUBE,
];
