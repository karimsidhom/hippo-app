// ---------------------------------------------------------------------------
// Orthopedics — procedure-specific dictation templates
// ---------------------------------------------------------------------------

import type { ProcedureTemplate } from "./types";

const o = (
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
): ProcedureTemplate => ({ specialty: "orthopedics", ...partial });

export const TKA = o({
  key: "orthopedics.arthroplasty.tka",
  subcategory: "arthroplasty",
  procedureName: "Total knee arthroplasty",
  synonyms: ["total knee arthroplasty", "tka", "tkr", "knee replacement"],
  matchPatterns: [/\b(total\s+knee\s+arthroplast|tka|tkr|knee\s+replacement)/i],
  topMatter: {
    anesthesia: "Spinal with adductor canal block (preferred for early mobility); GA with multimodal analgesia for selected patients.",
    position: "Supine in knee positioner; tourniquet at proximal thigh inflated to 250-300 mmHg after Esmarch exsanguination.",
    prep: "Operative leg prepped from foot to mid-thigh with chlorhexidine-alcohol; impervious draping; cefazolin 2 g IV (vancomycin if MRSA risk) within 60 min.",
    ebl: "100-300 mL (with TXA 1 g IV at incision + 1 g topical at closure, often < 100 mL).",
    disposition: "Surgical floor on rapid-recovery pathway; LOS 0-1 day for ambulatory candidates.",
  },
  findings: {
    headline: "[Right / Left] knee with tricompartmental osteoarthritis: medial > lateral compartment cartilage loss with bone-on-bone contact, [varus / valgus] deformity of approximately ___°. Patellofemoral with full-thickness cartilage loss. ACL [present and competent / deficient]. PCL [preserved with CR design / sacrificed for PS]. Final mechanical alignment within 3° of neutral; flexion/extension gap balanced; patellar tracking confirmed without lateral release.",
  },
  operativeSteps: {
    steps: [
      "TXA 1 g IV given pre-incision (transfusion reduction 50-70%; level A).",
      "Tourniquet inflated 250-300 mmHg after Esmarch exsanguination.",
      "Standard midline anterior longitudinal incision; medial parapatellar arthrotomy; patella subluxed laterally; soft-tissue releases as needed (medial release for varus, lateral release with iliotibial-band z-plasty for valgus).",
      "Intramedullary distal femoral cutting guide at 5-7° valgus; distal femoral cut performed; AP sizer applied with 3° external rotation referenced off posterior condylar axis (or Whiteside's line); anterior, posterior, and chamfer cuts performed.",
      "Tibial alignment guide (extramedullary or intramedullary); proximal tibial cut perpendicular to mechanical axis with 3° posterior slope.",
      "Trial femoral and tibial components; flexion and extension gaps balanced with spacer blocks; patellar tracking assessed with no-thumbs technique.",
      "Patellar resurfacing: thickness measured pre- and post-resection; patellar component sized to recreate native thickness without overstuffing.",
      "Final implants ([cemented / cementless / hybrid]) placed: tibial baseplate first (cement applied to tibial cut and undersurface); polyethylene insert ([CR / PS] thickness ___ mm); femoral component (cement applied to chamfer + posterior cuts); patellar button.",
      "Cement cured under axial pressure for 8-10 minutes.",
      "Tourniquet released; hemostasis confirmed; topical TXA 1 g applied prior to closure.",
      "Final ROM and patellar tracking re-confirmed: full extension, flexion to ___°, no patellar tilt or subluxation.",
    ],
    closure: "Capsule closed with #2 Vicryl interrupted figure-of-eight; subcutaneous with 2-0 Vicryl; skin with 3-0 Monocryl subcuticular + Dermabond + Aquacel surgical dressing.",
  },
  devices: {
    instruments: ["Tourniquet (Stryker / Zimmer)", "TKA cutting blocks (intramedullary femoral, extramedullary tibial)", "Bone saw with sagittal blade", "Spacer blocks for gap balancing"],
    implants: ["Femoral component", "Tibial baseplate + polyethylene insert (___ mm)", "Patellar button (when resurfaced)"],
    consumables: ["TXA 1 g IV + 1 g topical", "Bone cement (Palacos R+G / Simplex P)"],
  },
  specimens: { default: "Synovium for pathology in inflammatory arthritis or revision; cut bone discarded." },
  tubesAndDrains: { default: "None routinely (drains increase transfusion risk per multiple meta-analyses)." },
  complicationChecks: [
    { label: "Periprosthetic joint infection (1-2% lifetime)" },
    { label: "DVT/PE (rivaroxaban / aspirin / Lovenox prophylaxis × 14-35 days)" },
    { label: "Patellar maltracking" },
    { label: "Stiffness requiring MUA at 6-12 weeks" },
    { label: "Aseptic loosening (long-term)" },
    { label: "Periprosthetic fracture" },
  ],
  postopPlan: {
    disposition: "Rapid-recovery pathway; most discharge POD 0 or 1.",
    catheter: "No Foley.",
    analgesia: "Multimodal: scheduled acetaminophen + NSAID + adductor canal catheter (if placed); opioid sparingly. Ice + elevation.",
    antibiotics: "Single perioperative dose; no continuation.",
    activity: "WBAT POD 0; CPM machine for ROM; ambulation with walker × 2 weeks.",
    followup: ["Clinic at 2 weeks for wound + ROM check", "PT 2-3×/week × 6 weeks", "Surveillance imaging at 1, 5, 10 years"],
    returnPrecautions: ["Erythema / drainage / wound dehiscence (PJI concern)", "Calf or chest pain (DVT/PE)", "Sudden inability to bear weight (periprosthetic fracture)"],
  },
  requiredFields: [
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "design", label: "Implant design", type: "enum", options: ["Cruciate-retaining (CR)", "Posterior-stabilised (PS)", "Bicruciate-retaining", "Constrained / hinged"] },
    { id: "fixation", label: "Fixation", type: "enum", options: ["Cemented", "Cementless", "Hybrid"] },
    { id: "patella_resurfaced", label: "Patella resurfaced", type: "boolean" },
    { id: "polyethylene_thickness_mm", label: "Polyethylene thickness (mm)", type: "number" },
    { id: "tourniquet_minutes", label: "Tourniquet time (min)", type: "number" },
    { id: "txa", label: "TXA given", type: "boolean" },
  ],
});

export const THA = o({
  key: "orthopedics.arthroplasty.tha",
  subcategory: "arthroplasty",
  procedureName: "Total hip arthroplasty",
  synonyms: ["total hip arthroplasty", "tha", "thr", "hip replacement"],
  matchPatterns: [/\b(total\s+hip\s+arthroplast|tha|thr|hip\s+replacement)/i],
  topMatter: {
    anesthesia: "Spinal with hip fascia-iliaca block.",
    position: "Lateral decubitus (posterior approach) or supine on Hana / fracture table (direct anterior); operative leg prepped free.",
    prep: "Iliac crest to foot; impervious drapes.",
    ebl: "200-500 mL.",
    disposition: "Surgical floor; LOS 0-2 days.",
  },
  findings: {
    headline: "[Right / Left] hip with severe degenerative joint disease: complete cartilage loss with subchondral cyst formation, osteophytes at the head-neck junction, [posterior / anterior / superior] joint space loss. [Cam / pincer] morphology noted. Hip ROM improved post-implant; leg-length and offset restored within 5 mm of contralateral.",
  },
  operativeSteps: {
    steps: [
      "[Posterior approach] Curvilinear incision from PSIS to greater trochanter and along femoral shaft; gluteus maximus split in line with fibres; piriformis tendon and short external rotators tagged with #2 Vicryl and released; capsulotomy as a posterior capsular flap (preserved for repair).",
      "[Direct anterior approach] Smith-Petersen interval between sartorius and tensor fasciae latae; LFCN identified and protected; capsulotomy.",
      "Femoral neck osteotomy at planned level using calibrated reciprocating saw; femoral head removed.",
      "Acetabular preparation: progressive reaming to bleeding subchondral bone; trial cup; final cementless press-fit cup ([Trabecular Metal / Pinnacle]) impacted at 15-25° anteversion + 30-45° abduction (Lewinnek safe zone, with patient-specific spinopelvic-mobility adjustment).",
      "Polyethylene liner ([standard / lipped / dual-mobility]) snapped into cup.",
      "Femoral preparation: progressive broaching; trial reduction to assess leg length, offset, and stability.",
      "Final femoral component ([cementless tapered wedge / cemented]) impacted; final head ([28 / 32 / 36 / 40] mm, [+0 / +5 / +10] mm neck length) placed.",
      "Final reduction; ROM tested through extension/external rotation, flexion/internal rotation, adduction without dislocation.",
      "[Posterior capsular flap re-attached to greater trochanter through bone tunnels with #2 FibreWire — significantly reduces dislocation risk for posterior approach.]",
    ],
    closure: "Fascia closed with #1 Vicryl running; subcutaneous with 2-0 Vicryl; skin with 3-0 Monocryl subcuticular + Dermabond.",
  },
  devices: {
    instruments: ["THA-specific reamers and broaches", "Calibrated saw for femoral neck osteotomy"],
    implants: ["Acetabular cup + polyethylene liner", "Femoral stem", "Femoral head"],
    consumables: ["TXA 1 g IV + 1 g topical", "#2 FibreWire for posterior capsule repair"],
  },
  specimens: { default: "Femoral head to pathology; synovium when inflammatory arthritis suspected." },
  tubesAndDrains: { default: "None." },
  complicationChecks: [
    { label: "Dislocation (early — first 3 months)" },
    { label: "Periprosthetic joint infection (1-2%)" },
    { label: "DVT/PE (prophylaxis 14-35 days)" },
    { label: "Sciatic / lateral femoral cutaneous nerve injury" },
    { label: "Leg-length discrepancy > 1 cm" },
    { label: "Periprosthetic fracture" },
  ],
  postopPlan: {
    disposition: "Surgical floor; LOS 0-2 days.",
    analgesia: "Multimodal: acetaminophen + NSAID + opioid sparingly.",
    antibiotics: "Single perioperative dose.",
    activity: "WBAT POD 0; hip precautions for posterior approach (no flexion > 90°, no adduction past midline, no internal rotation × 6 weeks); no precautions for direct anterior.",
    followup: ["Clinic at 2 weeks for wound + ROM check", "PT 2-3×/week × 6 weeks", "Surveillance at 1, 5, 10 years"],
    returnPrecautions: ["Sudden hip pain with deformity or shortening (dislocation)", "Erythema / drainage (PJI)", "Calf or chest pain (DVT/PE)"],
  },
  requiredFields: [
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "approach", label: "Approach", type: "enum", options: ["Posterior", "Direct anterior", "Anterolateral", "Lateral"] },
    { id: "fixation", label: "Femoral fixation", type: "enum", options: ["Cementless tapered wedge", "Cementless fit-and-fill", "Cemented", "Hybrid"] },
    { id: "head_size_mm", label: "Femoral head size (mm)", type: "enum", options: ["28", "32", "36", "40"] },
    { id: "neck_length", label: "Neck length", type: "enum", options: ["+0", "+5", "+10", "+12"] },
  ],
});

export const ACL_RECONSTRUCTION = o({
  key: "orthopedics.sports.acl_reconstruction",
  subcategory: "sports",
  procedureName: "ACL reconstruction",
  synonyms: ["acl reconstruction", "acl repair", "anterior cruciate ligament"],
  matchPatterns: [/\bacl\s+(reconstruction|repair)|\banterior\s+cruciate/i],
  topMatter: {
    anesthesia: "Spinal or general; femoral / adductor canal block.",
    position: "Supine with knee positioner allowing 90-110° flexion; tourniquet at thigh.",
    prep: "Operative leg prepped from foot to mid-thigh.",
    ebl: "Minimal.",
    disposition: "Discharge home same-day.",
  },
  findings: {
    headline: "[Right / Left] knee with complete ACL tear (mid-substance, ___ % retraction); meniscal status: [intact / medial meniscal tear treated with all-inside repair / lateral meniscal partial meniscectomy]. Articular cartilage [grade I-IV per ICRS at involved compartments]. Reconstruction with [bone-patellar-tendon-bone / quadrupled hamstring / quadriceps tendon] autograft; femoral fixation ___; tibial fixation ___; pivot shift negative post-graft tensioning at 20° flexion.",
  },
  operativeSteps: {
    steps: [
      "Diagnostic arthroscopy via standard anterolateral and anteromedial portals: chondral, meniscal, and ACL pathology characterised.",
      "Meniscal pathology addressed first (repair if reparable — red-red zone / red-white zone with all-inside Smith & Nephew Fast-Fix; partial meniscectomy if irreparable).",
      "Graft harvest: [BPTB — 10 mm-wide central third with patellar bone block + tibial tubercle bone block / quadrupled hamstring (semitendinosus + gracilis stripped at musculotendinous junction) prepared on back table to 8-10 mm diameter / quadriceps tendon].",
      "Notch preparation: notchplasty with shaver to ensure no impingement on the lateral wall.",
      "Femoral tunnel: drilled through anteromedial portal at the centre of the native ACL footprint (Resident's Ridge as posterior-superior landmark; lateral intercondylar ridge anteriorly), with knee at 110° flexion to optimise tunnel trajectory and avoid posterior wall blowout.",
      "Tibial tunnel: drilled with tibial guide centred on native ACL footprint (between tibial spines, anterior to PCL), at 55° angle in sagittal plane.",
      "Graft passed: pulled into femoral tunnel and secured with [EndoButton (cortical suspensory) / bio-interference screw (aperture)]; tensioned to 20-30 N at 20° knee flexion.",
      "Tibial fixation: [interference screw (PEEK / bioabsorbable) + supplementary backup with staple or post-and-washer / suspensory device].",
      "Final ROM tested: full extension confirmed without graft impingement; pivot-shift and Lachman tests negative.",
    ],
    closure: "Portals closed with 4-0 Monocryl subcuticular + Dermabond; harvest-site incision closed in layers.",
  },
  devices: {
    instruments: ["30° arthroscope", "ACL reconstruction-specific guide kit", "Shaver + radiofrequency ablator"],
    implants: ["Femoral suspensory device (EndoButton / RetroButton)", "Tibial interference screw + supplemental fixation"],
  },
  specimens: { default: "Excised meniscus to pathology if partial meniscectomy; otherwise none." },
  tubesAndDrains: { default: "None." },
  complicationChecks: [
    { label: "Graft failure / re-rupture (5-10% lifetime)" },
    { label: "Cyclops lesion (loss of full extension)" },
    { label: "Tunnel widening" },
    { label: "Septic arthritis (rare; < 0.5%)" },
    { label: "Donor-site morbidity (anterior knee pain BPTB; hamstring weakness HS autograft)" },
  ],
  postopPlan: {
    disposition: "Discharge home same-day.",
    analgesia: "Multimodal; ice + elevation.",
    activity: "WBAT in hinged knee brace locked in extension × 2 weeks; brace adjusted for ROM 0-90° at 2 weeks; full ROM by 6 weeks; running at 3-4 months; return to pivoting sport at 9-12 months with isokinetic strength testing.",
    followup: ["PT 2-3×/week starting POD 1 (Manley accelerated rehab protocol)", "Surgeon at 2 weeks, 6 weeks, 3, 6, 12 months"],
  },
  requiredFields: [
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "graft_type", label: "Graft type", type: "enum", options: ["BPTB autograft", "Hamstring autograft (quadrupled)", "Quadriceps tendon autograft", "Allograft"] },
    { id: "meniscal_pathology", label: "Concomitant meniscal pathology", type: "enum", options: ["None", "Medial repair", "Medial partial meniscectomy", "Lateral repair", "Lateral partial meniscectomy", "Bilateral"] },
    { id: "femoral_fixation", label: "Femoral fixation", type: "text" },
    { id: "tibial_fixation", label: "Tibial fixation", type: "text" },
  ],
});

export const ROTATOR_CUFF_REPAIR = o({
  key: "orthopedics.sports.rotator_cuff_repair",
  subcategory: "sports",
  procedureName: "Arthroscopic rotator cuff repair",
  synonyms: ["rotator cuff repair", "rcr", "supraspinatus repair"],
  matchPatterns: [/\brotator\s+cuff|\brcr\b|\bsupraspinatus\s+repair/i],
  topMatter: {
    anesthesia: "Interscalene block + general or sedation.",
    position: "Beach-chair (45-60°) or lateral decubitus with arm in 10 lbs longitudinal traction at 45° abduction.",
    prep: "Operative shoulder + axilla prepped; arm draped free.",
    ebl: "Minimal.",
    disposition: "Discharge home same-day.",
  },
  findings: {
    headline: "Arthroscopic findings: [supraspinatus / supra + infraspinatus / subscapularis] full-thickness tear measuring approximately ___ × ___ cm; [crescent / U-shaped / L-shaped] tear pattern; medial-to-lateral mobility ___ cm. Biceps [intact / SLAP type ___ / tenotomised / tenodesed]. Subacromial bursectomy + acromioplasty performed; AC joint [normal / Mumford for symptomatic AC arthritis]. Repair: [single-row / double-row / suture-bridge transosseous-equivalent] with ___ anchors total.",
  },
  operativeSteps: {
    steps: [
      "Diagnostic arthroscopy via posterior viewing portal; anterior working portal established with spinal needle localisation.",
      "Glenohumeral joint inspected: biceps, labrum, articular cartilage, subscapularis, undersurface of supra/infraspinatus assessed.",
      "Arthroscope moved to subacromial space via standard posterior portal; lateral and posterolateral working portals established.",
      "Subacromial bursectomy with 4.5 mm shaver; coracoacromial ligament preserved (CA ligament release predisposes to anterosuperior escape with future massive tears).",
      "Acromioplasty with 5.5 mm round burr to recreate flat type-I acromion (when type II/III pre-op).",
      "Tear pattern and mobility re-assessed; medial-to-lateral mobility evaluated for tension-free repair.",
      "Bone bed prepared at greater tuberosity (footprint) with shaver to bleeding cancellous bone — promotes biologic healing.",
      "Repair construct: [single-row: 2 medial anchors with simple sutures pulling tendon to footprint / double-row: 2 medial + 2 lateral anchors with mattress sutures over tendon (preferred for tears > 2 cm) / suture-bridge: 2 medial anchors with sutures passed through tendon then secured laterally with knotless anchors (transosseous-equivalent — gold standard for large tears)].",
      "All knots tied arthroscopically; final repair tested by abducting and rotating the arm — no gap formation at 30° or 60° abduction.",
    ],
    closure: "Portals closed with 4-0 Monocryl subcuticular + Dermabond. Shoulder placed in immobiliser sling.",
  },
  devices: {
    instruments: ["30° + 70° arthroscope", "4.5 mm shaver", "5.5 mm round burr", "Suture passers (Scorpion / SutureLasso)"],
    implants: ["Suture anchors (5.5 mm Bio-Composite or all-suture Q-Fix): 2-4 total per case"],
  },
  specimens: { default: "Bursa fragments to pathology only if unusual gross appearance." },
  tubesAndDrains: { default: "None." },
  complicationChecks: [
    { label: "Re-tear (15-25% at 1 year for large tears)" },
    { label: "Adhesive capsulitis / stiffness" },
    { label: "Anchor pullout" },
    { label: "Infection (< 1%)" },
  ],
  postopPlan: {
    disposition: "Discharge home same-day.",
    analgesia: "Continuous interscalene catheter (when placed) + multimodal oral.",
    activity: "Sling × 6 weeks (full-time first 4 weeks, then weaned); passive ROM POD 0; active assisted ROM at 6 weeks; full active ROM at 12 weeks; return to throwing sports at 6 months with strength testing.",
    followup: ["PT starting at 1-2 weeks (passive only initially)", "Surgeon at 2 weeks, 6 weeks, 3, 6 months"],
  },
  requiredFields: [
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "tendons_involved", label: "Tendons involved", type: "enum", options: ["Supraspinatus alone", "Supraspinatus + infraspinatus", "Supraspinatus + subscapularis", "Massive 3-tendon", "Subscapularis isolated"] },
    { id: "tear_size_cm", label: "Tear size (largest dimension, cm)", type: "number" },
    { id: "repair_construct", label: "Repair construct", type: "enum", options: ["Single-row", "Double-row", "Suture-bridge / transosseous-equivalent"] },
    { id: "anchors_used", label: "Anchors used (total)", type: "number" },
    { id: "biceps_management", label: "Biceps management", type: "enum", options: ["Intact / preserved", "Tenotomy", "Tenodesis", "SLAP repair"] },
  ],
});

export const HIP_FRACTURE_ORIF = o({
  key: "orthopedics.trauma.hip_fracture_orif",
  subcategory: "trauma",
  procedureName: "Hip fracture ORIF / hemiarthroplasty",
  synonyms: ["hip fracture", "femoral neck fracture", "intertrochanteric fracture", "im nail", "hemiarthroplasty"],
  matchPatterns: [/\b(hip|femoral\s+neck|intertrochanteric)\s+fracture|\bim\s+nail|\bhemiarthroplasty/i],
  topMatter: {
    anesthesia: "Spinal preferred (lower mortality vs GA for fragility hip fractures, NEJM 2021); regional fascia-iliaca block.",
    position: "Supine on Hana / fracture table with operative leg in traction; contralateral abducted; C-arm at the foot.",
    prep: "Operative hip prepped from iliac crest to mid-thigh.",
    ebl: "150-400 mL.",
    disposition: "Surgical floor; LOS 3-7 days; geriatric co-management for fragility cases.",
  },
  findings: {
    headline: "[Right / Left] [intertrochanteric / subtrochanteric / displaced femoral neck Garden III/IV / non-displaced femoral neck Garden I/II] fracture. Reduction confirmed under fluoroscopy in AP and lateral before instrumentation.",
  },
  operativeSteps: {
    steps: [
      "[Intertrochanteric — short cephalomedullary nail] Closed reduction on fracture table by traction + internal rotation + adduction; fluoroscopic confirmation of reduction in AP and lateral.",
      "Lateral incision at proximal greater trochanter; entry portal at tip of greater trochanter (or piriformis fossa per nail system).",
      "Awl + guide wire passed under fluoroscopy; reaming over wire (typically 1 mm larger than nail diameter); short [Synthes TFNA / Stryker Gamma 3 / Smith & Nephew TRIGEN] cephalomedullary nail inserted.",
      "Lag screw placed into femoral head: tip-apex distance < 25 mm (drives cutout risk); helical blade vs lag screw per system.",
      "Distal interlocking screw under fluoroscopic perfect-circle technique.",
      "[Displaced femoral neck — hemiarthroplasty] Posterior or anterolateral approach; femoral neck osteotomy at planned level; femoral head removed; acetabular cartilage assessed (intact for hemi, eroded would prefer total).",
      "[Hemi] Cementless or cemented unipolar / bipolar femoral component placed; trial reduction; final implantation; capsule repaired.",
      "[Non-displaced femoral neck — multiple percutaneous cannulated screws] Three 7.3 mm partially-threaded cannulated screws in inverted-triangle configuration under fluoroscopy.",
    ],
    closure: "Layered: fascia with #1 Vicryl; subcutaneous with 2-0 Vicryl; skin with staples or 3-0 Monocryl + Dermabond.",
  },
  devices: {
    instruments: ["Fracture table with traction", "C-arm fluoroscopy", "Reaming system"],
    implants: ["[Short cephalomedullary nail with lag screw + distal interlock / Hemiarthroplasty femoral component / Three 7.3 mm cannulated screws]"],
  },
  specimens: { default: "[Hemi: femoral head to pathology — confirm fracture, rule out occult tumor in pathologic fracture cases.]" },
  tubesAndDrains: { default: "None." },
  complicationChecks: [
    { label: "Lag screw cutout (TAD > 25 mm)" },
    { label: "Avascular necrosis (AVN — particularly with displaced femoral neck fixation in young)" },
    { label: "Periprosthetic / peri-implant fracture" },
    { label: "DVT/PE" },
    { label: "Hospital-acquired complications (delirium, pressure ulcer, UTI in elderly)" },
  ],
  postopPlan: {
    disposition: "Floor with geriatrics co-management for fragility fractures.",
    analgesia: "Multimodal; opioid sparingly (delirium risk in elderly); acetaminophen scheduled.",
    antibiotics: "Single perioperative dose.",
    activity: "WBAT POD 0 (level A for fragility hip fractures — earliest possible mobilisation); walker × 2 weeks then cane.",
    followup: [
      "PT POD 1; daily inpatient PT during admission",
      "Surgeon at 2 weeks, 6 weeks, 3 months, 1 year",
      "DEXA + osteoporosis treatment (any fragility fracture is Z-score-independent indication per AAOS)",
      "Falls assessment + home safety evaluation",
    ],
    returnPrecautions: ["Sudden inability to bear weight (peri-implant fracture / cutout)", "Infection signs", "Calf / chest pain (DVT/PE)"],
  },
  requiredFields: [
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "fracture_pattern", label: "Fracture pattern", type: "enum", options: ["Intertrochanteric stable (AO 31-A1)", "Intertrochanteric unstable (AO 31-A2/A3)", "Subtrochanteric", "Femoral neck displaced (Garden III/IV)", "Femoral neck non-displaced (Garden I/II)"] },
    { id: "fixation_strategy", label: "Fixation strategy", type: "enum", options: ["Short cephalomedullary nail", "Long cephalomedullary nail", "Hemiarthroplasty (cemented)", "Hemiarthroplasty (cementless)", "Total hip arthroplasty", "Cannulated screws"] },
    { id: "tad_mm", label: "Tip-apex distance (mm)", type: "number" },
  ],
});

export const ORTHOPEDICS_TEMPLATES: ProcedureTemplate[] = [
  TKA,
  THA,
  ACL_RECONSTRUCTION,
  ROTATOR_CUFF_REPAIR,
  HIP_FRACTURE_ORIF,
];
