// ---------------------------------------------------------------------------
// Plastics — procedure-specific dictation templates
// ---------------------------------------------------------------------------

import type { ProcedureTemplate } from "./types";

const p = (
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
): ProcedureTemplate => ({ specialty: "plastics", ...partial });

export const CARPAL_TUNNEL_RELEASE = p({
  key: "plastics.hand.carpal_tunnel_release",
  subcategory: "hand",
  procedureName: "Open carpal tunnel release",
  synonyms: ["carpal tunnel release", "ctr", "carpal tunnel"],
  matchPatterns: [/\bcarpal\s+tunnel(\s+release)?|\bctr\b/i],
  topMatter: {
    anesthesia: "Local 1% lidocaine with epinephrine + IV sedation; or wide-awake local anesthetic no tourniquet (WALANT) increasingly common.",
    position: "Supine with operative arm on hand table; tourniquet at upper arm inflated to 250 mmHg (or no tourniquet for WALANT).",
    prep: "Operative hand prepped with chlorhexidine; hand-table draping.",
    ebl: "Minimal.",
    disposition: "Discharge home immediately.",
  },
  findings: {
    headline: "Median nerve compressed at the level of the transverse carpal ligament; flexor tenosynovium [unremarkable / proliferative]. Decompression confirmed by direct visualisation of the nerve regaining normal caliber distally. Recurrent motor branch identified and protected.",
  },
  operativeSteps: {
    steps: [
      "Local 1% lidocaine + 1:100,000 epinephrine infiltrated subcutaneously along the planned incision line in the palm.",
      "Longitudinal incision (~3 cm) made in line with the radial border of the ring finger from the distal wrist crease to the level of Kaplan's cardinal line (intersection of thumb's ulnar border and index extension).",
      "Subcutaneous tissue incised; palmar fat retracted; palmar fascia identified.",
      "Palmar fascia incised longitudinally; transverse carpal ligament (TCL) identified.",
      "TCL incised under direct vision from distal to proximal (or proximal to distal per surgeon preference) using #15 blade or scissors, decompressing the median nerve which is visualised below.",
      "Median nerve inspected: normal calibre, no neuroma, no aberrant anatomy. Recurrent motor branch identified at the radial side of the nerve in 50% of patients (variable origin) and protected.",
      "Distal extent of TCL release confirmed at the superficial palmar arch level.",
      "Tenosynovium inspected; tenosynovectomy performed only if proliferative.",
      "Wound irrigated; tourniquet released and hemostasis confirmed (skip for WALANT).",
    ],
    closure: "Skin closed with interrupted 4-0 nylon vertical mattress sutures × 4-6. Soft bulky dressing + volar wrist splint × 1 week.",
  },
  devices: {
    instruments: ["Standard hand tray", "Tourniquet (skip for WALANT)", "Self-retaining hand retractor"],
  },
  specimens: { default: "Tenosynovium to pathology only if proliferative or unusual gross appearance." },
  tubesAndDrains: { default: "Soft bulky dressing + volar wrist splint × 1 week." },
  complicationChecks: [
    { label: "Recurrent motor branch injury (rare; thenar weakness)" },
    { label: "Incomplete release (persistent symptoms — most common cause of failure)" },
    { label: "Pillar pain (palmar pain at incision site, common, typically resolves in 3-6 months)" },
    { label: "Reflex sympathetic dystrophy / CRPS (rare)" },
    { label: "Bowstringing (incomplete TCL release leaves flexor tendons in mid-palm — over-aggressive release)" },
  ],
  postopPlan: {
    disposition: "Discharge home immediately.",
    analgesia: "Acetaminophen + NSAID; ice + elevation × 48 h.",
    activity: "Range of motion exercises POD 1; volar splint × 1 week; no heavy gripping × 4 weeks.",
    followup: ["Suture removal at 10-14 days", "Clinic at 2-3 weeks for symptom assessment"],
    returnPrecautions: ["Worsening pain / new numbness", "Wound infection signs", "Persistent thenar weakness"],
  },
  requiredFields: [
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "approach", label: "Approach", type: "enum", options: ["Open standard incision", "Mini-open", "Endoscopic single-portal", "Endoscopic two-portal"] },
    { id: "tenosynovectomy", label: "Tenosynovectomy performed", type: "boolean" },
    { id: "walant", label: "WALANT (no tourniquet)", type: "boolean" },
  ],
});

export const BREAST_REDUCTION = p({
  key: "plastics.breast.reduction_mammaplasty",
  subcategory: "breast",
  procedureName: "Bilateral reduction mammaplasty",
  synonyms: ["breast reduction", "reduction mammaplasty", "wise pattern"],
  matchPatterns: [/\bbreast\s+reduction|\breduction\s+mammaplasty|\bwise\s+pattern/i],
  topMatter: {
    anesthesia: "General endotracheal anesthesia.",
    position: "Supine with arms abducted on padded armboards (90°); operating table upright at 45° for sitting position checks.",
    prep: "Bilateral breasts prepped from clavicle to umbilicus + bilateral axillae.",
    ebl: "200-400 mL.",
    disposition: "Surgical floor; LOS 0-1 day.",
  },
  findings: {
    headline: "Bilateral macromastia. Preoperative measurements: SN-N right ___ cm, left ___ cm. Final tissue resected: right ___ g, left ___ g (target ≥ 500 g per side for insurance criteria where applicable). Wise-pattern markings; inferior / medial / superomedial pedicle preserving NAC viability. Final NAC position [21-23 cm from sternal notch] confirmed in upright sitting position. Symmetric breast contour with adequate pole-to-pole projection.",
  },
  operativeSteps: {
    steps: [
      "Preoperative markings: sternal notch + midline + inframammary fold + new NAC position (21-23 cm from sternal notch + 9-11 cm from midline) + Wise-pattern keyhole + medial + lateral limb markings done with patient standing.",
      "Patient positioned supine with arms abducted; sitting position confirmed for symmetry checks.",
      "Right breast first: NAC marked with 38-42 mm circular cookie cutter; pedicle marking (inferior / medial / superomedial per surgeon choice) drawn around NAC.",
      "Wise-pattern incision made: keyhole around new NAC + medial + lateral limbs to inframammary fold.",
      "De-epithelialisation of pedicle (preserving dermal blood supply to NAC) performed sharply with #15 blade.",
      "NAC isolated on pedicle; medial + lateral skin flaps elevated.",
      "Excess breast tissue resected en bloc — typically inferior + lateral excess, weighed and submitted to pathology.",
      "Pedicle rotated to new NAC position; tension assessed; viability confirmed (capillary refill at NAC).",
      "Closure: dermal pillar (medial + lateral limbs) approximated with 3-0 PDS interrupted; skin with 3-0 Monocryl subcuticular running suture.",
      "Same procedure repeated on left.",
      "Sitting position re-checked: symmetric breast contour, NAC position 21-23 cm from sternal notch bilaterally, IMF symmetric.",
      "JP drain placed bilaterally and brought out laterally.",
    ],
    closure: "Skin closed with 4-0 Monocryl subcuticular + Steri-Strips. Surgical bra applied.",
  },
  devices: {
    instruments: ["38-42 mm NAC marker", "Standard plastics tray", "Bipolar electrocautery (preserves pedicle vasculature)"],
    consumables: ["3-0 PDS for dermal closure", "3-0 + 4-0 Monocryl for skin"],
  },
  specimens: { default: "Bilateral breast tissue resected, weighed, and submitted to permanent pathology to rule out occult breast malignancy (1-3% incidence)." },
  tubesAndDrains: { default: "Bilateral closed-suction (JP) drains × 24-72 h, removed when output < 30 mL/24 h. Surgical bra × 4-6 weeks." },
  complicationChecks: [
    { label: "NAC necrosis (partial / complete; most worry with superomedial pedicle in heavy smokers)" },
    { label: "Hematoma (re-exploration if expanding)" },
    { label: "Wound dehiscence (T-junction at IMF most common)" },
    { label: "Asymmetry (cosmetic revision in 5-10%)" },
    { label: "Loss of nipple sensation (15-25%)" },
    { label: "Inability to breastfeed (variable based on pedicle preserved)" },
  ],
  postopPlan: {
    disposition: "Surgical floor LOS 0-1 day.",
    analgesia: "Multimodal: scheduled acetaminophen + NSAID + opioid sparingly.",
    antibiotics: "Single perioperative dose; oral course only with drains in place.",
    activity: "Surgical bra × 4-6 weeks; no heavy lifting × 6 weeks; gradual return to exercise at 4 weeks.",
    followup: [
      "Drain removal in clinic at 24-72 h once output < 30 mL/24 h",
      "Clinic at 2 weeks for wound check",
      "Pathology review at 7-10 days",
      "Cosmetic outcome assessed at 3 + 6 months (final shape settles ~6 months)",
    ],
    returnPrecautions: ["NAC discoloration (necrosis)", "Expanding hematoma", "Wound dehiscence at T-junction", "Fever / wound discharge"],
  },
  requiredFields: [
    { id: "pedicle_type", label: "Pedicle type", type: "enum", options: ["Inferior pedicle", "Medial pedicle", "Superomedial pedicle", "Superior pedicle", "Lateral pedicle", "Free nipple graft"] },
    { id: "skin_pattern", label: "Skin pattern", type: "enum", options: ["Wise (anchor / inverted-T)", "Vertical (lollipop)", "Periareolar (donut)"] },
    { id: "right_resection_g", label: "Right resection weight (g)", type: "number" },
    { id: "left_resection_g", label: "Left resection weight (g)", type: "number" },
    { id: "snn_right_cm", label: "Right SN-N (cm)", type: "number" },
    { id: "snn_left_cm", label: "Left SN-N (cm)", type: "number" },
  ],
});

export const ABDOMINOPLASTY = p({
  key: "plastics.body_contouring.abdominoplasty",
  subcategory: "body-contouring",
  procedureName: "Abdominoplasty (tummy tuck)",
  synonyms: ["abdominoplasty", "tummy tuck"],
  matchPatterns: [/\babdominoplasty|\btummy\s+tuck/i],
  topMatter: {
    anesthesia: "General endotracheal anesthesia.",
    position: "Supine with bed flexed 30-45° at the hips for adequate undermining + closure.",
    prep: "Lower abdomen + suprapubic region prepped widely; cefazolin 2 g IV (3 g if BMI > 80).",
    ebl: "200-500 mL.",
    disposition: "Surgical floor; LOS 1-2 days.",
  },
  findings: {
    headline: "Diastasis recti measuring approximately ___ cm wide. Excess lower abdominal skin + subcutaneous fat panniculus reaching to or below the symphysis. Liposuction performed at flanks bilaterally for contouring (___ mL aspirate per side). Total skin + fat resected: approximately ___ × ___ cm. Rectus diastasis plicated with running 0 PDS in two layers (deep + superficial) achieving abdominal wall tightening. Final contour symmetric with new umbilicus inset.",
  },
  operativeSteps: {
    steps: [
      "Preoperative markings: low transverse abdominoplasty incision in suprapubic / pannus crease + new umbilical position + diastasis extent + flank liposuction zones — done with patient standing.",
      "Patient positioned supine; bed flexed 30-45° at hips.",
      "Liposuction performed first at flanks bilaterally with 3-4 mm cannula via small stab incisions for contouring; tumescent infiltration with lidocaine + epinephrine; aspirate volume documented.",
      "Lower transverse abdominoplasty incision made (low Pfannenstiel-style or pannus-crease incision) — extended from anterior superior iliac spine to ASIS bilaterally.",
      "Skin + subcutaneous flap raised superiorly off the rectus fascia in the avascular plane to the level of the xiphoid + costal margin. Umbilical stalk preserved on its own pedicle.",
      "Diastasis recti identified (medial separation of rectus muscles). Plication of rectus fascia with running 0 PDS in two layers (deep then superficial) from xiphoid to suprapubic region — achieves abdominal wall tightening.",
      "Excess skin + subcutaneous fat (pannus) resected in elliptical wedge with the inferior incision as the lower margin.",
      "Bed flexed further to facilitate tension-free closure; flap advanced inferiorly; closure tension assessed.",
      "New umbilical position marked on the advanced flap; cruciate incision through skin only; umbilicus delivered through and inset with 4-0 Vicryl deep + 5-0 Monocryl skin in petal-shaped pattern.",
      "Drains placed bilaterally and brought out at the lateral suprapubic region.",
    ],
    closure: "Layered closure: Scarpa's fascia approximated with running 2-0 PDS; deep dermis with 3-0 Monocryl; skin with 4-0 Monocryl subcuticular running + Dermabond. Compression garment applied.",
  },
  devices: {
    instruments: ["Standard plastics tray", "Liposuction cannulas (3, 4, 5 mm)", "Bipolar + monopolar electrocautery"],
    consumables: ["Tumescent solution (1 L NS + 1 mg epinephrine + 200 mg lidocaine)", "0 PDS for diastasis plication", "Closed-suction drains × 2"],
  },
  specimens: { default: "Skin + fat + subcutaneous tissue resection — measured + weighed + submitted to pathology to rule out incidental pathology." },
  tubesAndDrains: { default: "Bilateral closed-suction drains × 1-2 weeks until output < 30 mL/24 h. Compression garment × 6 weeks." },
  complicationChecks: [
    { label: "Wound dehiscence at T-junction (~5%)" },
    { label: "Seroma (5-15% — risk reduced by drains + progressive tension sutures)" },
    { label: "VTE (DVT/PE — high-risk procedure; SCDs + chemoprophylaxis × 7-10 days)" },
    { label: "Skin necrosis (especially with smoking history)" },
    { label: "Persistent abdominal numbness above incision" },
    { label: "Asymmetric umbilical inset / 'mickey mouse ears'" },
  ],
  postopPlan: {
    disposition: "Surgical floor LOS 1-2 days.",
    analgesia: "Multimodal: TAP block intraoperatively + scheduled acetaminophen + NSAID + opioid PRN.",
    antibiotics: "Single perioperative dose; oral while drains in place.",
    activity: "Compression garment × 6 weeks; flexed-hip walking × 1-2 weeks; no heavy lifting × 6 weeks; gradual return to baseline activity.",
    followup: [
      "Drain removal in clinic when output < 30 mL/24 h × 2 days",
      "Clinic weekly × 4 weeks then at 3 months",
      "DVT prophylaxis (Lovenox or rivaroxaban × 7-10 days post-op per Caprini score)",
    ],
    returnPrecautions: ["Wound dehiscence", "Calf or chest pain (DVT/PE)", "Expanding fluid collection (hematoma vs seroma)", "Fever / wound concerns"],
  },
  requiredFields: [
    { id: "approach", label: "Approach", type: "enum", options: ["Standard abdominoplasty", "Mini-abdominoplasty", "Fleur-de-lis (vertical + transverse)", "Reverse abdominoplasty"] },
    { id: "diastasis_repair", label: "Diastasis recti repair", type: "boolean" },
    { id: "concomitant_lipo", label: "Concomitant liposuction (flanks)", type: "boolean" },
    { id: "tissue_resected_g", label: "Tissue resected (g)", type: "number" },
    { id: "lipo_aspirate_ml", label: "Liposuction aspirate (mL)", type: "number" },
    { id: "umbilical_translocation", label: "Umbilical translocation performed", type: "boolean" },
  ],
});

export const SCAR_REVISION = p({
  key: "plastics.reconstructive.scar_revision",
  subcategory: "reconstructive",
  procedureName: "Scar revision (Z-plasty / W-plasty)",
  synonyms: ["scar revision", "z-plasty", "w-plasty"],
  matchPatterns: [/\bscar\s+revision|\bz[-\s]?plasty|\bw[-\s]?plasty/i],
  topMatter: {
    anesthesia: "Local 1% lidocaine with epinephrine + IV sedation (general for extensive cases).",
    position: "Per scar location; supine standard.",
    prep: "Operative site prepped with chlorhexidine; surrounding hair clipped if needed.",
    ebl: "Minimal.",
    disposition: "Discharge home same-day.",
  },
  findings: {
    headline: "[Hypertrophic / contracted / aesthetically poor] scar at [location] measuring ___ cm in length, oriented [against / along] relaxed skin tension lines (RSTL — Borges' lines). [Z-plasty / W-plasty / direct elliptical excision] performed for [tension redirection / scar irregularization / focal lesion excision]. Final result: scar reoriented [60° / 90°] to RSTL with tension-free closure.",
  },
  operativeSteps: {
    steps: [
      "Preoperative markings: existing scar + planned revision (Z-plasty 60° angles for 75% length gain, or W-plasty serial triangles for irregularization without length gain) drawn on skin with patient awake to confirm orientation against RSTL.",
      "Local 1% lidocaine + 1:100,000 epinephrine infiltrated subcutaneously around the planned excision; 5-min wait for vasoconstriction.",
      "Existing scar excised with #15 blade — full-thickness through dermis and subcutaneous tissue.",
      "[Z-plasty: two limb incisions made at 60° to the central scar — one above + one below; flaps elevated through full thickness of skin + subcutaneous tissue without undermining further than necessary. Flaps transposed: top flap moves to bottom, bottom flap to top, central scar reoriented 90° to original axis.] [W-plasty: zigzag incisions on each side of the scar; small triangular flaps interdigitated to break up the linear scar into a serrated pattern — no length change.]",
      "Hemostasis with bipolar.",
      "Layered closure: deep dermis with 4-0 / 5-0 Monocryl interrupted (size by location — 5-0 for face, 4-0 for trunk/extremity); skin with 5-0 Monocryl subcuticular running + Dermabond.",
    ],
  },
  devices: {
    instruments: ["Standard plastics tray", "Adson forceps + skin hooks", "Bipolar electrocautery"],
    consumables: ["4-0 / 5-0 Monocryl"],
  },
  specimens: { default: "Excised scar tissue to pathology only if unusual gross appearance or pre-revision diagnosis suggests skin cancer." },
  tubesAndDrains: { default: "None; Steri-Strips for 1-2 weeks." },
  complicationChecks: [
    { label: "Recurrent hypertrophic scarring / keloid formation (especially in keloid-prone patients)" },
    { label: "Wound dehiscence" },
    { label: "Suboptimal cosmetic outcome (revision rate ~10-20%)" },
    { label: "Tip necrosis (Z-plasty flaps)" },
  ],
  postopPlan: {
    disposition: "Discharge home same-day.",
    analgesia: "Acetaminophen + ibuprofen.",
    activity: "No heavy lifting / strain on incision × 4 weeks; sun protection (SPF 50+) × 6 months to prevent hyperpigmentation; silicone gel sheeting × 6 months for scar maturation.",
    followup: ["Steri-Strips removed in clinic at 1-2 weeks", "Clinic at 4-6 weeks for scar maturation assessment", "Final cosmetic outcome assessed at 6-12 months"],
  },
  requiredFields: [
    { id: "scar_location", label: "Scar location", type: "text" },
    { id: "scar_length_cm", label: "Scar length (cm)", type: "number" },
    { id: "technique", label: "Technique", type: "enum", options: ["Z-plasty (60° single)", "Z-plasty (multiple)", "W-plasty", "Direct elliptical excision", "Geometric broken-line"] },
    { id: "rstl_orientation", label: "Original scar orientation", type: "enum", options: ["Against RSTL (revision indicated)", "Along RSTL", "Mixed"] },
  ],
});

export const PLASTICS_TEMPLATES: ProcedureTemplate[] = [
  CARPAL_TUNNEL_RELEASE,
  BREAST_REDUCTION,
  ABDOMINOPLASTY,
  SCAR_REVISION,
];
