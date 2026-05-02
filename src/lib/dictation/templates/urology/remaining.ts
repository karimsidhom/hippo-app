// ---------------------------------------------------------------------------
// Urology — remaining procedure templates (compact but procedure-specific)
//
// Each template still includes structured fields, devices, specimens,
// drains, complications, and postop plan — the "stub" label here only means
// the operative narrative is shorter than the rich endourology / oncology
// templates. None of these falls back to a generic specialty note.
// ---------------------------------------------------------------------------

import type { ProcedureTemplate } from "../types";

const u = (
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
): ProcedureTemplate => ({ specialty: "urology", ...partial });

export const FLEXIBLE_CYSTOSCOPY = u({
  key: "urology.endourology.flexible_cystoscopy",
  subcategory: "endourology",
  procedureName: "Flexible cystoscopy",
  synonyms: ["flexible cystoscopy", "flex cysto", "office cystoscopy"],
  matchPatterns: [/\bflexible\s+cystoscop|\bflex\s+cysto|\boffice\s+cystoscop/i, /\bcystoscop(?!.*(turbt|turp|stent|biops))/i],
  topMatter: {
    anesthesia: "Topical 2% lidocaine jelly per urethra; no sedation routinely required.",
    position: "Supine for flexible cystoscopy; dorsal lithotomy is acceptable for selected cases.",
    prep: "Genitalia prepped with chlorhexidine.",
    ebl: "Minimal.",
    disposition: "Discharged from cystoscopy suite immediately following the procedure.",
  },
  findings: {
    headline: "Cystoscopy demonstrated [normal urethra and bladder mucosa / focal abnormality at ___]; ureteric orifices identified bilaterally with clear efflux.",
    supporting: [
      "[Findings: ___ — describe any mucosal abnormality, mass, foreign body, or instrumentation difficulty.]",
    ],
  },
  operativeSteps: {
    steps: [
      "Topical 2% lidocaine hydrochloride jelly (UroJet 10 mL) was instilled per urethra and held for 5–10 minutes.",
      "A 16-17 Fr flexible cystoscope (Olympus CYF-V or Storz FLEXOR) was lubricated and introduced per urethra under direct vision through the irrigation flow. The urethra was inspected en route.",
      "The bladder was filled with 100–150 mL of sterile saline. A complete clockwise survey was performed: bladder neck, trigone, both ureteric orifices, posterior wall, lateral walls, dome, anterior wall.",
      "Findings were documented by clock-face nomenclature.",
      "[Cold-cup biopsies were taken at suspicious areas if identified.]",
      "The cystoscope was withdrawn under direct vision.",
    ],
  },
  devices: {
    instruments: ["Flexible cystoscope (16-17 Fr)", "UroJet topical lidocaine"],
  },
  specimens: { default: "None routinely; cold-cup biopsies if abnormality identified." },
  tubesAndDrains: { default: "None." },
  complicationChecks: [
    { label: "Hematuria (mild, transient)" },
    { label: "Post-instrumentation UTI (1–2%)" },
  ],
  postopPlan: {
    disposition: "Discharge home immediately.",
    activity: "No restrictions; increase fluid intake.",
    followup: ["Per indication — surveillance interval per AUA NMIBC risk category"],
    returnPrecautions: ["Heavy hematuria > 24 h", "Inability to void", "Fevers"],
  },
  requiredFields: [
    { id: "indication", label: "Indication", type: "enum", options: ["Hematuria workup", "NMIBC surveillance", "Voiding symptoms", "Stricture assessment", "Stent / foreign body assessment", "Other"] },
    { id: "biopsy_taken", label: "Biopsy taken", type: "boolean" },
  ],
});

export const RIGID_CYSTOSCOPY = u({
  key: "urology.endourology.rigid_cystoscopy",
  subcategory: "endourology",
  procedureName: "Rigid cystoscopy",
  synonyms: ["rigid cystoscopy"],
  matchPatterns: [/\brigid\s+cystoscop/i],
  topMatter: {
    anesthesia: "Spinal or general anesthesia (rigid cystoscopy in awake male is poorly tolerated and routinely avoided; reserved for cases where a flexible scope cannot accomplish the planned intervention — e.g., bladder washing, biopsy, retrograde catheter placement, or stent management).",
    position: "Dorsal lithotomy with legs in well-padded candy-cane stirrups.",
    prep: "Genitalia and perineum prepped with chlorhexidine; pre-instrumentation antibiotic per AUA guidelines.",
    ebl: "Minimal.",
    disposition: "Recovery → discharge home unless intervention performed.",
  },
  findings: {
    headline: "Bladder mucosa [normal / focal abnormality at ___]; ureteric orifices identified bilaterally with [clear / blood-tinged] efflux.",
    supporting: [
      "[For male:] Anterior, bulbar, membranous, and prostatic urethra inspected en route — [normal / stricture noted at ___].",
      "[For female:] Short urethra inspected; bladder neck competent.",
      "Trigone, bilateral lateral walls, posterior wall, dome, and anterior wall systematically inspected with the 30° lens; 70° lens used for the dome and proximal anterior wall.",
    ],
  },
  operativeSteps: {
    steps: [
      "A 22 Fr Storz (or Olympus) rigid cystoscope with 30° lens was advanced per urethra under direct vision through continuous irrigation flow. The 30° lens was selected as the workhorse for the trigone, lateral walls, posterior wall, and prostatic urethra.",
      "[For male anatomy:] The cystoscope was advanced gently along the urethra with attention to the natural anterior curve at the bulbomembranous junction; the prostatic urethra was inspected with verumontanum and ejaculatory ducts identified.",
      "[For female anatomy:] The cystoscope was passed atraumatically through the short female urethra; bladder neck competence was assessed.",
      "The bladder was filled with 200-300 mL of sterile saline irrigation to allow systematic inspection without overdistention (which causes mucosal blanching and obscures lesions).",
      "Systematic survey performed in clockwise fashion: bladder neck, trigone, right ureteric orifice, right lateral wall, posterior wall, left lateral wall, left ureteric orifice — using the 30° lens.",
      "The 70° lens was then introduced to inspect the dome and anterior wall (the two locations where the 30° lens has limited reach).",
      "Findings documented by clock-face nomenclature with the bladder neck at 6 o'clock and the dome at 12 o'clock. Each finding characterised by location, size, configuration (papillary / sessile / flat), surface, color, and surrounding mucosa.",
      "[Procedure-specific intervention performed via working channel: cold-cup biopsy with 5 Fr forceps, bugbee fulguration at 15-20 W, retrograde catheter placement via the Albarrán bridge, or stent grasping / placement.]",
      "The bladder was emptied through the cystoscope. The cystoscope was withdrawn under direct vision with re-inspection of the urethra.",
    ],
  },
  devices: {
    instruments: [
      "22 Fr Storz / Olympus rigid cystoscope sheath",
      "30° + 70° lenses (and 12° lens for difficult prostatic urethra navigation)",
      "Albarrán bridge for working-channel deflection (when retrograde access is needed)",
      "Bugbee electrode (for focal hemostasis at 15-20 W coagulation)",
    ],
    consumables: ["Sterile saline irrigation (large-volume bag-set)"],
  },
  specimens: { default: "Per indication — cold-cup biopsies separately labelled by location; otherwise none." },
  tubesAndDrains: {
    default: "None unless extensive intervention; 16 Fr Foley overnight if hematuria or bladder dilation > 400 mL.",
  },
  complicationChecks: [
    { label: "Mucosal injury (focal denuded area at instrumentation site)" },
    { label: "Post-procedural UTI (1-2%)" },
    { label: "Urethral injury / false passage in male anatomy (1-3%; higher with stricture)" },
    { label: "Bladder perforation (rare; risk during forceful biopsy at the dome)" },
  ],
  postopPlan: {
    disposition: "Discharge home unless intervention performed.",
    activity: "No restrictions; increase oral fluid intake.",
    followup: ["Per indication — pathology review at 7-10 days for any biopsies"],
    returnPrecautions: [
      "Heavy persistent gross hematuria with clots",
      "Inability to void (consider retention from urethral edema)",
      "Fevers > 38.5°C",
    ],
  },
  requiredFields: [
    { id: "indication", label: "Indication", type: "enum", options: ["Hematuria workup with intervention planned", "Biopsy", "Retrograde stent placement", "Stent management", "Bladder washing for cytology", "Foreign body retrieval", "Other"] },
    { id: "intervention_performed", label: "Intervention performed", type: "boolean" },
    { id: "anesthesia_type", label: "Anesthesia", type: "enum", options: ["Spinal", "General", "MAC sedation"] },
  ],
});

export const RETROGRADE_PYELOGRAM = u({
  key: "urology.endourology.retrograde_pyelogram",
  subcategory: "endourology",
  procedureName: "Cystoscopy with bilateral retrograde pyelogram",
  synonyms: ["retrograde pyelogram", "rpg", "rpgs"],
  matchPatterns: [/\bretrograde\s+pyelogram|\brpg\b/i],
  topMatter: {
    anesthesia: "IV sedation; topical jelly + sedation often sufficient.",
    position: "Dorsal lithotomy.",
    prep: "Genitalia prepped with chlorhexidine.",
    ebl: "Minimal.",
    disposition: "Recovery → discharge home same-day.",
  },
  findings: {
    headline: "Bilateral retrograde pyelograms demonstrated [normal pelvicalyceal anatomy bilaterally / right hydroureteronephrosis to the level of ___ / filling defect at ___].",
  },
  operativeSteps: {
    steps: [
      "A 22 Fr rigid cystoscope with 30° lens was advanced per urethra. Both ureteric orifices identified at the trigone.",
      "A 5 Fr open-tip ureteric catheter was advanced into the right ureteric orifice; ~5 mL of Omnipaque diluted contrast injected under fluoroscopic guidance.",
      "Findings documented; catheter withdrawn.",
      "The procedure was repeated on the contralateral side.",
      "[Stent placement deferred unless obstruction identified — see stent insertion template.]",
    ],
  },
  devices: { instruments: ["22 Fr rigid cystoscope", "5 Fr open-tip ureteric catheter", "Fluoroscopy unit"], consumables: ["Omnipaque contrast (~5 mL per side)"] },
  specimens: { default: "Urine to culture if clinical suspicion of infection." },
  tubesAndDrains: { default: "None unless stent placed." },
  complicationChecks: [
    { label: "Contrast extravasation suggesting forniceal rupture" },
    { label: "Post-instrumentation UTI" },
  ],
  postopPlan: {
    disposition: "Discharge home same-day.",
    activity: "No restrictions.",
    followup: ["Per indication; cross-sectional imaging follow-up if filling defect identified"],
  },
  requiredFields: [
    { id: "laterality", label: "Side(s) studied", type: "enum", options: ["Right", "Left", "Bilateral"] },
    { id: "stent_placed", label: "Stent placed", type: "boolean" },
  ],
});

export const ESWL = u({
  key: "urology.endourology.eswl",
  subcategory: "endourology",
  procedureName: "Extracorporeal shock wave lithotripsy (ESWL)",
  synonyms: ["eswl", "shock wave lithotripsy"],
  matchPatterns: [/\beswl\b|\bshock\s+wave\s+lithotripsy/i],
  topMatter: {
    anesthesia: "IV sedation (propofol + fentanyl) titrated to comfort.",
    position: "Supine on lithotripter table; affected side up by table tilt.",
    prep: "Skin prepped at the flank coupling site.",
    ebl: "None.",
    disposition: "Recovery → discharge home same-day.",
  },
  findings: {
    headline: "Stone localised on combined fluoroscopy + integrated ultrasound. Stone-to-skin distance approximately ___ cm; Hounsfield density [<800 / 800–1000 / >1000] HU.",
  },
  operativeSteps: {
    steps: [
      "Stone localised under fluoroscopy/ultrasound; coupling between the lithotripter cushion and patient's skin established with copious gel (no air bubbles — > 99% energy attenuation per > 2% air coverage).",
      "Shock wave delivery initiated at 60 SW/min with progressive voltage ramp (11 → 14 → 18–20 kV) per Pace stepwise protocol.",
      "Approximately ___ shocks delivered total; intermittent re-imaging confirmed continued focal alignment.",
      "Post-treatment imaging documented [adequate fragmentation with snowstorm pattern / inadequate fragmentation — repeat session vs alternative modality recommended].",
    ],
  },
  devices: {
    instruments: ["Storz Modulith SLX-F2 / Dornier Compact Sigma lithotripter", "Combined fluoro + integrated ultrasound"],
  },
  specimens: { default: "None — fragments passed naturally." },
  tubesAndDrains: { default: "None." },
  complicationChecks: [
    { label: "Steinstrasse (stone-street) requiring ureteric stenting" },
    { label: "Subcapsular renal hematoma" },
    { label: "Sepsis with infected stone" },
    { label: "Cardiac arrhythmia (rare; ECG-gating for at-risk patients)" },
  ],
  postopPlan: {
    disposition: "Discharge home same-day.",
    analgesia: "Tamsulosin 0.4 mg PO daily + acetaminophen + NSAID for stone passage.",
    activity: "Strain urine for stone composition; encourage hydration ≥ 2 L/day.",
    followup: [
      "KUB at 4 weeks to assess clearance",
      "Repeat ESWL session for residual fragments > 4 mm",
      "Stone composition + metabolic workup if recurrent",
    ],
    returnPrecautions: ["Severe colicky pain unrelieved by analgesics", "Fever > 38.5°C", "Inability to void"],
  },
  requiredFields: [
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "stone_location", label: "Stone location", type: "enum", options: ["Renal pelvis", "Upper-pole calyx", "Mid-calyx", "Lower-pole calyx", "Proximal ureter", "Mid ureter", "Distal ureter"] },
    { id: "stone_size_mm", label: "Stone size (mm)", type: "number" },
    { id: "shocks_delivered", label: "Total shocks delivered", type: "number" },
    { id: "max_voltage_kv", label: "Max voltage (kV)", type: "number" },
    { id: "fragmentation_outcome", label: "Fragmentation", type: "enum", options: ["Complete", "Partial — repeat session", "Failed — alternative modality"] },
  ],
});

export const TURP = u({
  key: "urology.bph.turp",
  subcategory: "bph",
  procedureName: "Transurethral resection of the prostate (TURP)",
  synonyms: ["turp", "transurethral resection of prostate"],
  matchPatterns: [/\bturp\b|\btransurethral\s+resection\s+of\s+prostate/i],
  topMatter: {
    anesthesia: "Spinal or general anesthesia; spinal preferred for elderly cardiac comorbidity and to enable detection of TUR syndrome (in monopolar TURP).",
    position: "Dorsal lithotomy.",
    prep: "Genitalia prepped with povidone-iodine; preoperative antibiotic prophylaxis.",
    ebl: "100–300 mL.",
    disposition: "Admission overnight for CBI; discharge POD 1.",
  },
  findings: {
    headline: "Prostate volume approximately ___ g with [bilateral lateral / median + bilateral lateral] lobe hyperplasia. Bladder neck contracture [present / absent]. Bilateral ureteric orifices identified at the trigone, protected throughout resection.",
    supporting: [
      "Verumontanum identified as the distal landmark — resection terminated at this level to preserve external sphincter.",
      "Bladder examined post-resection — no perforation, hemostasis adequate.",
    ],
  },
  operativeSteps: {
    steps: [
      "A 26 Fr resectoscope with 30° lens was advanced per urethra; bladder + ureteric orifices identified.",
      "[Bipolar TURis in saline / monopolar in glycine] resection initiated.",
      "Median lobe (when present) resected first — from the bladder neck to the verumontanum.",
      "Bilateral lateral lobes resected systematically with the verumontanum as the absolute distal landmark to preserve the external sphincter.",
      "Hemostasis was achieved with focal coagulation of arterial bleeders.",
      "Tissue chips evacuated using Ellik evacuator.",
      "Bladder inspected at low volume — no perforation.",
      "A 22 Fr 3-way Foley placed; CBI initiated at moderate flow.",
    ],
  },
  devices: {
    instruments: ["26 Fr resectoscope", "Bipolar TURis loop or monopolar loop", "Ellik evacuator", "22 Fr 3-way Foley"],
  },
  specimens: { default: "Prostate chips for permanent pathology — weight approximately ___ g." },
  tubesAndDrains: { default: "22 Fr 3-way Foley with CBI overnight." },
  complicationChecks: [
    { label: "TUR syndrome (monopolar/glycine — hyponatremic hyperammonemia, eliminated with bipolar saline TURP)" },
    { label: "Capsular perforation with extravasation" },
    { label: "Hematuria / clot retention" },
    { label: "Stress incontinence (rare with verumontanum-respect)" },
    { label: "Bladder neck contracture / urethral stricture (long-term)" },
  ],
  postopPlan: {
    disposition: "Admission overnight; discharge POD 1.",
    catheter: "CBI overnight; trial of void POD 1 once urine clear.",
    analgesia: "Acetaminophen + NSAID; oxybutynin for spasm.",
    antibiotics: "Single perioperative dose.",
    activity: "Light activity × 4 weeks; no heavy lifting.",
    followup: [
      "Pathology review at 7–10 days",
      "Clinic at 4 weeks: uroflow + post-void residual",
      "Counsel re: retrograde ejaculation (~70%)",
    ],
    returnPrecautions: ["Heavy persistent hematuria", "Inability to void after Foley removal", "Fevers"],
  },
  requiredFields: [
    { id: "energy", label: "Energy modality", type: "enum", options: ["Bipolar (saline)", "Monopolar (glycine)"] },
    { id: "prostate_volume_g", label: "Prostate volume (g)", type: "number" },
    { id: "tissue_weight_g", label: "Tissue weight resected (g)", type: "number" },
    { id: "catheter_size_fr", label: "Catheter size (Fr)", type: "enum", options: ["22", "24"] },
    { id: "cbi", label: "CBI ordered", type: "boolean" },
  ],
});

export const REZUM = u({
  key: "urology.bph.rezum",
  subcategory: "bph",
  procedureName: "Rezum (water vapor thermal therapy of the prostate)",
  synonyms: ["rezum", "water vapor therapy"],
  matchPatterns: [/\brezum\b|\bwater\s+vapor/i],
  topMatter: {
    anesthesia: "MAC sedation or local with periprostatic block.",
    position: "Dorsal lithotomy.",
    prep: "Genitalia prepped with chlorhexidine.",
    ebl: "Minimal.",
    disposition: "Discharge home with Foley × 3–7 days.",
  },
  findings: {
    headline: "Prostate volume approximately ___ g; [bilateral lateral / median + bilateral lateral] lobe hyperplasia. Total of ___ vapor injections delivered as planned.",
  },
  operativeSteps: {
    steps: [
      "Periprostatic block placed with 1% lidocaine bilaterally for analgesia.",
      "Rezum delivery system advanced per urethra under direct cystoscopic vision.",
      "9-second steam (water vapor) injections delivered into each lateral lobe at 1-cm intervals from the bladder neck to the verumontanum (typical: 4–6 injections per side).",
      "[Median lobe variant: 1–2 additional injections into the median lobe.]",
      "16 Fr Foley catheter placed; trial of void planned at 3–7 days post-procedure.",
    ],
  },
  devices: {
    instruments: ["Rezum delivery system + console", "Standard cystoscope for visualisation", "16 Fr Foley"],
  },
  specimens: { default: "None." },
  tubesAndDrains: { default: "16 Fr Foley × 3–7 days." },
  complicationChecks: [
    { label: "Urinary retention requiring extended Foley" },
    { label: "Post-procedure UTI" },
    { label: "Hematuria" },
    { label: "Suboptimal symptom relief (response peaks at 3 months)" },
  ],
  postopPlan: {
    disposition: "Discharge home.",
    catheter: "Foley × 3–7 days; trial of void in office.",
    analgesia: "Acetaminophen + NSAID; alpha-blocker continued.",
    antibiotics: "Single dose perioperative.",
    activity: "No restrictions.",
    followup: ["Foley removal in office at 3–7 days", "Symptom assessment at 3 months (peak response)"],
  },
  requiredFields: [
    { id: "prostate_volume_g", label: "Prostate volume (g)", type: "number" },
    { id: "lateral_injections", label: "Lateral lobe injections (per side)", type: "number" },
    { id: "median_injections", label: "Median lobe injections", type: "number" },
  ],
});

export const UROLIFT = u({
  key: "urology.bph.urolift",
  subcategory: "bph",
  procedureName: "UroLift prostatic urethral lift",
  synonyms: ["urolift", "prostatic urethral lift", "pul"],
  matchPatterns: [/\burolift|\bprostatic\s+urethral\s+lift|\bpul\b/i],
  topMatter: {
    anesthesia: "MAC sedation or local.",
    position: "Dorsal lithotomy.",
    prep: "Genitalia prepped.",
    ebl: "Minimal.",
    disposition: "Discharge home — no Foley required for most patients.",
  },
  findings: {
    headline: "Prostate volume approximately ___ g; bilateral lateral lobe enlargement amenable to lift; no obstructive median lobe.",
  },
  operativeSteps: {
    steps: [
      "Cystoscopic UroLift delivery system advanced per urethra; bilateral lateral lobes identified.",
      "First implant placed in the right lateral lobe approximately 1 cm distal to the bladder neck under cystoscopic vision.",
      "Subsequent implants placed bilaterally at 1-cm intervals (typical 4–6 implants total) — sufficient to widely retract lateral lobes off the urethral channel.",
      "Final cystoscopic view confirmed widely patent prostatic urethra without trauma to the verumontanum.",
    ],
  },
  devices: {
    instruments: ["UroLift delivery system + cystoscope"],
    implants: ["UroLift implants (4–6 total): a small piece of nitinol, polypropylene suture, and stainless-steel anchor per implant"],
  },
  specimens: { default: "None." },
  tubesAndDrains: { default: "None — Foley reserved for patients with retention or significant hematuria." },
  complicationChecks: [
    { label: "Implant migration / extrusion" },
    { label: "Hematuria" },
    { label: "Postoperative urgency / dysuria" },
    { label: "Insufficient relief — possible HoLEP / TURP later" },
  ],
  postopPlan: {
    disposition: "Discharge home.",
    analgesia: "Acetaminophen + NSAID; alpha-blocker discontinued.",
    activity: "No restrictions.",
    followup: ["Symptom assessment at 4 weeks"],
  },
  requiredFields: [
    { id: "implants_placed", label: "Number of implants", type: "number" },
    { id: "median_lobe_present", label: "Median lobe enlargement", type: "boolean" },
  ],
});

export const SUPRAPUBIC_CATHETER = u({
  key: "urology.misc.suprapubic_catheter",
  subcategory: "misc",
  procedureName: "Suprapubic catheter insertion",
  synonyms: ["suprapubic catheter", "spc placement", "suprapubic cystostomy"],
  matchPatterns: [/\bsuprapubic\s+(catheter|cystostom)|\bspc\s+(placement|insertion)/i],
  topMatter: {
    anesthesia: "Local with sedation.",
    position: "Supine.",
    prep: "Lower abdomen prepped with chlorhexidine.",
    ebl: "Minimal.",
    disposition: "Discharge home if outpatient indication; floor admission if hospitalised.",
  },
  findings: {
    headline: "Bladder confirmed adequately full (≥ 300 mL) by bedside ultrasound. Trocar passed cleanly into the bladder with brisk return of clear (or bloody) urine.",
  },
  operativeSteps: {
    steps: [
      "The bladder was confirmed full by bedside ultrasound (≥ 300 mL) — open cystostomy is the alternative if inadequate filling.",
      "Local anesthesia (1% lidocaine 5–10 mL) was infiltrated at the planned puncture site, ~2 fingerbreadths cephalad to the pubic symphysis in the midline.",
      "A 1-cm midline skin incision was made.",
      "[Trocar variant:] A 16 Fr Cope-Loop suprapubic catheter set was advanced through the rectus sheath and into the bladder under continuous ultrasound visualisation at a 60° angle directed inferiorly. Brisk urine return confirmed intraluminal position. [Seldinger variant:] A 22 G needle was introduced under ultrasound to obtain initial bladder access; a 0.038\" guidewire passed; tract sequentially dilated to 16 Fr; the Cope-Loop catheter advanced over the dilator.",
      "Catheter balloon inflated with 10 mL sterile water to retain.",
      "Catheter secured to the abdominal wall with a 2-0 silk anchor stitch and connected to closed drainage.",
    ],
  },
  devices: {
    instruments: ["16 Fr Cope-Loop suprapubic catheter set / Stamey trocar kit", "Bedside ultrasound"],
    implants: ["16 Fr Cope-Loop catheter"],
  },
  specimens: { default: "Urine to culture." },
  tubesAndDrains: { default: "16 Fr Cope-Loop indwelling; first exchange at 4–6 weeks once tract is mature." },
  complicationChecks: [
    { label: "Bowel injury (uncommon if bladder adequately full + ultrasound used)" },
    { label: "Bleeding from rectus / inferior epigastric vessels" },
    { label: "Catheter dislodgement before tract maturity" },
  ],
  postopPlan: {
    disposition: "Per underlying admission status.",
    catheter: "Cope-Loop indwelling; secured with silk anchor + closed drainage.",
    activity: "No baths × 1 week; sponge baths only.",
    followup: ["Anchor stitch removal at 1 week", "First catheter exchange at 4–6 weeks"],
    returnPrecautions: ["Catheter blockage / no urine output", "Catheter dislodgement", "Fevers"],
  },
  requiredFields: [
    { id: "technique", label: "Technique", type: "enum", options: ["Trocar", "Seldinger", "Open cystostomy"] },
    { id: "catheter_size_fr", label: "Catheter size (Fr)", type: "enum", options: ["12", "14", "16", "18", "20"] },
  ],
});

export const CYSTOLITHOLAPAXY = u({
  key: "urology.endourology.cystolitholapaxy",
  subcategory: "endourology",
  procedureName: "Cystolitholapaxy",
  synonyms: ["cystolitholapaxy", "bladder stone fragmentation"],
  matchPatterns: [/\bcystolitholapax|\bbladder\s+stone\s+(fragmentation|removal)/i],
  topMatter: {
    anesthesia: "General or spinal.",
    position: "Dorsal lithotomy.",
    prep: "Genitalia prepped.",
    ebl: "Minimal–moderate.",
    disposition: "Discharge home same-day for small stones; admission overnight for large/multiple.",
  },
  findings: {
    headline: "[Single / multiple] bladder stone(s), largest measuring approximately ___ cm. Underlying obstruction (BPH / urethral stricture) [identified / not identified].",
  },
  operativeSteps: {
    steps: [
      "A 26 Fr resectoscope (or cystolitholapaxy sheath) was advanced per urethra; bladder stones identified.",
      "Stones fragmented with [Holmium:YAG laser via 550 µm fibre / Cyberwand ultrasonic / pneumatic lithoclast (Lithoclast EMS)].",
      "Fragments evacuated with Ellik evacuator until bladder cleared.",
      "Final cystoscopic inspection confirmed no residual stone material; underlying obstruction addressed at same setting (TURP / urethral dilation) when relevant.",
      "16-22 Fr Foley placed for hematuria / CBI per case.",
    ],
  },
  devices: {
    instruments: ["26 Fr resectoscope or cystolitholapaxy sheath", "Holmium:YAG laser / Cyberwand / pneumatic lithoclast", "Ellik evacuator"],
  },
  specimens: { default: "Stone fragments for composition analysis." },
  tubesAndDrains: { default: "16-22 Fr Foley × 24 h ± CBI." },
  complicationChecks: [
    { label: "Bladder perforation" },
    { label: "Hematuria / clot retention" },
    { label: "Underlying obstruction not addressed → stone recurrence" },
  ],
  postopPlan: {
    disposition: "Per stone burden.",
    catheter: "Foley × 24 h.",
    followup: ["Address underlying obstruction (TURP/HoLEP) if not done at same setting", "Stone composition + metabolic workup"],
  },
  requiredFields: [
    { id: "stone_burden_cm", label: "Total stone burden (cm)", type: "number" },
    { id: "lithotripter", label: "Lithotripter modality", type: "enum", options: ["Holmium:YAG laser", "Ultrasonic (Cyberwand)", "Pneumatic"] },
    { id: "obstruction_addressed", label: "Underlying obstruction addressed", type: "boolean" },
  ],
});

export const BLADDER_BIOPSY = u({
  key: "urology.oncology.bladder_biopsy",
  subcategory: "oncology",
  procedureName: "Bladder biopsy (cystoscopic, no resection)",
  synonyms: ["bladder biopsy", "mapping biopsy"],
  matchPatterns: [/\bbladder\s+biops|\bmapping\s+biops/i],
  topMatter: {
    anesthesia: "General or spinal.",
    position: "Dorsal lithotomy.",
    prep: "Genitalia prepped.",
    ebl: "Minimal.",
    disposition: "Discharge home same-day.",
  },
  findings: {
    headline: "Bladder mucosa [normal / focal abnormality at ___ / diffuse erythema concerning for CIS]; [random mapping biopsies / targeted biopsies] taken.",
  },
  operativeSteps: {
    steps: [
      "A 22 Fr rigid cystoscope advanced per urethra. Bladder filled with 200 mL saline; systematic survey performed.",
      "Cold-cup biopsy forceps used to obtain biopsies from [target locations / standard 6 mapping sites: dome, anterior, both lateral walls, posterior, trigone].",
      "Each biopsy labelled separately by location for accurate pathologic mapping.",
      "Hemostasis achieved at biopsy sites with bugbee electrode at 15-20 W coagulation.",
      "[Single-dose mitomycin C 40 mg in 40 mL instilled if intermediate-risk NMIBC indication.]",
    ],
  },
  devices: { instruments: ["22 Fr rigid cystoscope", "Cold-cup biopsy forceps", "Bugbee electrode"], consumables: ["Mitomycin C 40 mg (per indication)"] },
  specimens: { default: "Cold-cup biopsies from mapped locations — separately labelled containers." },
  tubesAndDrains: { default: "Foley × 24 h if multiple biopsies / hematuria; otherwise none." },
  complicationChecks: [
    { label: "Bladder perforation (especially at the dome)" },
    { label: "Hematuria" },
    { label: "Post-biopsy UTI" },
  ],
  postopPlan: {
    disposition: "Discharge home same-day.",
    followup: ["Pathology review at 7–10 days; surveillance per AUA NMIBC risk category"],
  },
  requiredFields: [
    { id: "biopsy_strategy", label: "Strategy", type: "enum", options: ["Targeted", "Mapping (6 sites)", "Targeted + mapping"] },
    { id: "intravesical_chemo", label: "Single-dose intravesical chemo given", type: "boolean" },
  ],
});

export const ORCHIECTOMY = u({
  key: "urology.scrotal.orchiectomy",
  subcategory: "scrotal",
  procedureName: "Orchiectomy",
  synonyms: ["orchiectomy", "orchidectomy", "radical orchiectomy", "simple orchiectomy"],
  matchPatterns: [/\borchiectom|\borchidectom/i],
  topMatter: {
    anesthesia: "General or spinal anesthesia.",
    position: "Supine.",
    prep: "Lower abdomen + genitalia prepped.",
    ebl: "Minimal.",
    disposition: "Discharge home same-day.",
  },
  findings: {
    headline: "[Right / Left] testis examined; [solid mass with normal contralateral / atrophic / non-viable post-torsion / infected]. Cord structures normal.",
  },
  operativeSteps: {
    steps: [
      "[Radical inguinal variant:] Transverse inguinal incision over the inguinal canal. Scarpa's fascia opened, external oblique aponeurosis incised in line with fibres preserving ilioinguinal nerve. Spermatic cord cross-clamped at the internal ring (oncologic principle to minimise venous tumor cell embolisation).",
      "Testis delivered into the wound; cord divided in two pedicles (vascular + vasal), doubly ligated with 0 silk, specimen removed.",
      "[Simple subcapsular variant for benign / hormonal indications:] Midline scrotal incision; tunica albuginea opened; tubules excised within the capsule; capsule closed to preserve scrotal contour.",
      "Permanent suture tag placed on the cord stump (radio-opaque marker for surveillance + landmark for future RPLND).",
    ],
    closure: "External oblique re-approximated with 2-0 Vicryl interrupted; Scarpa's with 3-0 Vicryl; skin with 4-0 Monocryl subcuticular.",
  },
  devices: {
    instruments: ["Standard inguinal / scrotal tray"],
    consumables: ["0 silk for cord pedicles", "2-0 / 3-0 Vicryl for closure"],
  },
  specimens: {
    default: "Testis with cord stump — orient for pathology with cord margin marked.",
  },
  tubesAndDrains: { default: "None." },
  complicationChecks: [
    { label: "Hematoma" },
    { label: "Wound infection" },
    { label: "Ilioinguinal nerve injury (sensory loss to medial thigh / scrotum)" },
  ],
  postopPlan: {
    disposition: "Discharge home same-day.",
    analgesia: "Acetaminophen + NSAID.",
    antibiotics: "Single perioperative dose.",
    activity: "Scrotal support × 1–2 weeks; no heavy lifting × 4 weeks.",
    followup: [
      "Pathology review at 7–10 days",
      "[For testicular cancer: tumor markers (AFP, hCG, LDH) + chest/abdominal CT for staging; oncology referral; sperm cryopreservation discussion if not done preop]",
      "Counsel re: hormonal status (contralateral testis sufficient) and testicular prosthesis",
    ],
  },
  requiredFields: [
    { id: "approach", label: "Approach", type: "enum", options: ["Radical inguinal (oncologic)", "Simple scrotal", "Simple subcapsular"] },
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "indication", label: "Indication", type: "enum", options: ["Testicular cancer", "Non-viable post-torsion", "Severe trauma", "Chronic pain", "Hormonal castration"] },
    { id: "preop_markers_drawn", label: "Pre-op tumor markers drawn", type: "boolean" },
    { id: "sperm_cryopreservation", label: "Sperm cryopreservation discussed", type: "boolean" },
  ],
});

export const ORCHIDOPEXY_CRYPTORCHIDISM = u({
  key: "urology.peds.orchidopexy_cryptorchidism",
  subcategory: "peds",
  procedureName: "Orchidopexy for undescended testis",
  synonyms: ["orchidopexy", "orchiopexy", "undescended testis", "cryptorchidism"],
  matchPatterns: [/\borchi[od]opexy(?!\s*for\s+torsion)/i, /\bcryptorchid|\bundescended\s+test/i],
  notes: "For acute torsion + scrotal exploration, see SCROTAL_EXPLORATION_TORSION.",
  topMatter: {
    anesthesia: "General anesthesia + caudal block (pediatric).",
    position: "Supine.",
    prep: "Inguinal + ipsilateral scrotum prepped.",
    ebl: "Minimal.",
    disposition: "Discharge home same-day.",
  },
  findings: {
    headline: "[Right / Left] undescended testis identified at the [inguinal canal / abdominal / 'peeping'] position. Patent processus vaginalis present (universal in cryptorchid patients). Testis viable; cord length adequate after retroperitoneal mobilisation.",
  },
  operativeSteps: {
    steps: [
      "Contralateral testis position re-confirmed under anesthesia (up to 30% are retractile and would not require surgery).",
      "Transverse inguinal incision over the inguinal canal; external oblique opened in fibres preserving ilioinguinal nerve.",
      "Testis identified within the canal / at internal ring / intra-abdominally (laparoscopic exploration if impalpable).",
      "Patent processus vaginalis dissected from cord (vas medially, vessels laterally) with fine Stevens scissors + bipolar; high-ligated at internal ring with 3-0 Vicryl interrupted suture and divided.",
      "Cord length assessed; retroperitoneal mobilisation (Prentiss maneuver) performed if needed; Fowler-Stephens (vessel-division) reserved as backup for very high testes.",
      "Scrotal incision (1-2 cm) made; subdartos pouch developed.",
      "Testis passed into pouch through dartos opening; pouch neck tightened around cord with 4-0 Vicryl.",
      "Testis tacked to dartos at most-dependent point with 1-2 sutures of 4-0 Vicryl.",
    ],
    closure: "External oblique re-approximated with 3-0 Vicryl interrupted; Scarpa's with 4-0 Vicryl; scrotal skin with 5-0 chromic interrupted; inguinal skin with 5-0 Monocryl subcuticular + skin glue or Steri-Strips.",
  },
  devices: { instruments: ["Pediatric inguinal tray", "Stevens scissors", "Bipolar cautery"] },
  specimens: { default: "None." },
  tubesAndDrains: { default: "None." },
  complicationChecks: [
    { label: "Testicular atrophy / re-ascent (5–10%)" },
    { label: "Inguinal hernia (usually addressed by high ligation)" },
    { label: "Cord injury (vas / vessels)" },
  ],
  postopPlan: {
    disposition: "Discharge home same-day.",
    analgesia: "Acetaminophen + ibuprofen.",
    activity: "No straddling activities × 4 weeks.",
    followup: [
      "Clinic at 6 weeks to confirm intrascrotal position",
      "Annual follow-up + self-exam education at puberty (lifetime testis cancer risk 4–7×)",
    ],
  },
  requiredFields: [
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "preop_position", label: "Preoperative position", type: "enum", options: ["Inguinal canal", "Internal ring / 'peeping'", "Intra-abdominal", "Impalpable"] },
    { id: "approach", label: "Approach", type: "enum", options: ["Inguinal alone", "Inguinal + scrotal", "Laparoscopic (impalpable testis)", "Fowler-Stephens (staged)"] },
    { id: "patent_pv", label: "Patent processus vaginalis", type: "boolean" },
  ],
});

export const URETHROPLASTY = u({
  key: "urology.reconstructive.urethroplasty",
  subcategory: "reconstructive",
  procedureName: "Urethroplasty",
  synonyms: ["urethroplasty", "buccal mucosal graft urethroplasty", "anastomotic urethroplasty"],
  matchPatterns: [/\burethroplast/i],
  topMatter: {
    anesthesia: "General endotracheal anesthesia.",
    position: "Dorsal lithotomy in candy-cane stirrups.",
    prep: "Perineum + lower abdomen prepped; oral cavity prepped if buccal graft harvested.",
    ebl: "Minimal–100 mL.",
    disposition: "Surgical floor or discharge same-day depending on case complexity.",
  },
  findings: {
    headline: "[Bulbar / penile / panurethral] stricture, length approximately ___ cm, [single / multiple] segments. [Anastomotic technique appropriate for short bulbar / buccal graft for longer or repeat] urethroplasty.",
  },
  operativeSteps: {
    steps: [
      "[For bulbar anastomotic:] Perineal midline incision; bulbocavernosus split; corpus spongiosum mobilised; strictured segment excised; spatulated tension-free anastomosis with 4-0 Vicryl interrupted over 16 Fr Foley.",
      "[For dorsal-onlay buccal graft:] Buccal mucosa harvested from cheek (Stensen duct identified and avoided); strictured urethra opened dorsally; buccal graft sutured as dorsal onlay over 16 Fr Foley.",
      "[For ventral-onlay buccal graft:] Strictured urethra opened ventrally; buccal graft sutured as ventral onlay; spongiosum re-approximated.",
      "Bulbocavernosus closed; perineum closed in layers.",
    ],
  },
  devices: {
    instruments: ["Perineal urethroplasty tray", "Operating microscope or loupe magnification"],
    consumables: ["4-0 Vicryl for anastomosis", "16 Fr Foley × 3 weeks"],
  },
  specimens: { default: "Excised strictured segment to pathology." },
  tubesAndDrains: { default: "16 Fr Foley × 3 weeks; suprapubic catheter occasionally." },
  complicationChecks: [
    { label: "Recurrent stricture (15–25% at 5 y)" },
    { label: "Erectile dysfunction (transient — bulbar dissection)" },
    { label: "Urethrocutaneous fistula" },
    { label: "Buccal graft donor-site oral pain" },
  ],
  postopPlan: {
    disposition: "Floor or discharge same-day.",
    catheter: "Foley × 3 weeks; pericatheter VCUG before removal.",
    followup: [
      "Cystoscopy at 3 months + uroflow at 6 and 12 months",
      "Annual follow-up × 5 y",
    ],
  },
  requiredFields: [
    { id: "stricture_location", label: "Stricture location", type: "enum", options: ["Bulbar", "Penile", "Panurethral", "Bulbomembranous"] },
    { id: "stricture_length_cm", label: "Stricture length (cm)", type: "number" },
    { id: "technique", label: "Technique", type: "enum", options: ["Anastomotic (excision + anastomosis)", "Buccal graft dorsal onlay", "Buccal graft ventral onlay", "Two-stage Johanson", "Other"] },
  ],
});

export const URETERIC_REIMPLANT = u({
  key: "urology.reconstructive.ureteric_reimplant",
  subcategory: "reconstructive",
  procedureName: "Ureteroneocystostomy (ureteric reimplant)",
  synonyms: ["ureteric reimplant", "ureteral reimplant", "ureteroneocystostomy"],
  matchPatterns: [/\bureter(o|ic|al)\s+reimplant|\bureteroneocystostomy/i],
  topMatter: {
    anesthesia: "General endotracheal.",
    position: "Supine.",
    prep: "Abdomen prepped to mid-thigh.",
    ebl: "Minimal–200 mL.",
    disposition: "Surgical floor; LOS 2–4 days.",
  },
  findings: {
    headline: "[Right / Left] distal ureteric [stricture / VUR / iatrogenic injury] requiring reimplantation. Bladder mobile and capacity adequate for tension-free anastomosis with [direct / psoas hitch / Boari flap] technique.",
  },
  operativeSteps: {
    steps: [
      "Lower midline / Pfannenstiel incision (or robotic 5-port). Bladder mobilised by dividing medial umbilical ligaments and peritoneal reflections.",
      "Affected ureter dissected to its distal diseased segment; diseased portion excised back to healthy ureter; proximal end spatulated 1.5 cm.",
      "[Direct anastomosis:] Suitable when length permits.",
      "[Psoas hitch:] Bladder dome elevated to ipsilateral psoas tendon and secured with 0 Vicryl parallel to fibres (avoiding genitofemoral nerve), gaining 4–6 cm length.",
      "[Boari flap:] U-shaped bladder flap raised and tubularised, providing 8–12 cm length.",
      "Lich-Gregoir extravesical antireflux tunnel: detrusor muscle incised longitudinally 3–5 cm without entering mucosa; mucosa elevated; ureter laid in submucosal bed; ureteric mucosa-to-bladder mucosa anastomosis with 4-0 Vicryl over 6 Fr × 26 cm double-J stent.",
      "Detrusor re-approximated over the tunneled ureter with interrupted 3-0 Vicryl (Paquin 4:1 tunnel-to-ureter ratio).",
      "Watertight closure tested with bladder fill; pelvic Blake drain placed.",
    ],
  },
  devices: {
    instruments: ["Open / laparoscopic / robotic tray"],
    implants: ["6 Fr × 26 cm double-J stent × 4–6 weeks"],
    consumables: ["4-0 Vicryl ureteric anastomosis", "3-0 Vicryl detrusor reapproximation"],
  },
  specimens: { default: "Excised distal ureter." },
  tubesAndDrains: { default: "Foley × 7 days; pelvic Blake drain × 3–5 days; double-J stent × 4–6 weeks." },
  complicationChecks: [
    { label: "Anastomotic leak / urinoma" },
    { label: "Ureteric stricture (5–10%)" },
    { label: "Persistent reflux (Paquin ratio dependent)" },
  ],
  postopPlan: {
    disposition: "Floor.",
    catheter: "Foley × 7 days; stent × 4–6 weeks.",
    followup: [
      "Stent removal in clinic at 4–6 weeks via flexible cystoscopy",
      "Renal US at 1 month + 6 months",
      "MAG3 at 6–12 months for functional assessment",
    ],
  },
  requiredFields: [
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "approach", label: "Approach", type: "enum", options: ["Open", "Laparoscopic", "Robotic"] },
    { id: "technique", label: "Technique", type: "enum", options: ["Direct (Lich-Gregoir extravesical)", "Psoas hitch", "Boari flap", "Politano-Leadbetter intravesical"] },
    { id: "stent_size_fr", label: "Stent size (Fr)", type: "number" },
    { id: "drain_placed", label: "Drain placed", type: "boolean" },
  ],
});

export const AUS = u({
  key: "urology.reconstructive.artificial_urinary_sphincter",
  subcategory: "reconstructive",
  procedureName: "Artificial urinary sphincter (AMS 800)",
  synonyms: ["aus", "artificial urinary sphincter", "ams 800"],
  matchPatterns: [/\bartificial\s+urinary\s+sphincter|\baus\b|\bams\s*800/i],
  topMatter: {
    anesthesia: "General endotracheal.",
    position: "Dorsal lithotomy with combined perineal + lower abdominal access.",
    prep: "Perineum + lower abdomen prepped; vancomycin + gentamicin prophylaxis given.",
    ebl: "Minimal.",
    disposition: "Surgical floor; LOS 1 day.",
  },
  findings: {
    headline: "Bulbar urethra exposed; urethral cuff size measured at ___ cm. Pressure-regulating balloon (PRB) pressure: ___ cm H2O. Pump positioned in dependent scrotum. Device cycled three times at the conclusion — full inflation/deflation confirmed.",
  },
  operativeSteps: {
    steps: [
      "4-5 cm vertical perineal incision; bulbocavernosus split; bulbar urethra mobilised circumferentially over 2–3 cm.",
      "Urethra sized with AMS sizing tape; cuff ([4.0 / 4.5 / 5.0] cm) selected one size larger than the snug measurement to prevent atrophy.",
      "Cuff placed around bulbar urethra and locked.",
      "Small Pfannenstiel incision; prevesical (Retzius) space developed; pressure-regulating balloon ([51-60 / 61-70] cm H2O) placed.",
      "Pump tunneled to dependent scrotum (or labia majora) into a position the patient can reach.",
      "Tubing connected with AMS quick-connectors under saline (no air); device cycled three times to confirm function and left deactivated for 6-week tissue healing before activation.",
    ],
  },
  devices: {
    instruments: ["AMS 800 system + sizing tape"],
    implants: ["AMS 800 cuff + pressure-regulating balloon + control pump"],
  },
  specimens: { default: "None." },
  tubesAndDrains: { default: "Foley × 24 h." },
  complicationChecks: [
    { label: "Device infection (3–5% — devastating, requires explant)" },
    { label: "Urethral atrophy at cuff site (most common cause of late failure)" },
    { label: "Mechanical failure" },
    { label: "Urethral erosion (rare; presents with pain + recurrent incontinence)" },
  ],
  postopPlan: {
    disposition: "Floor.",
    catheter: "Foley × 24 h.",
    activity: "No bicycling / vigorous lower extremity activity × 6 weeks.",
    followup: [
      "Activation in clinic at 6 weeks (allows tissue healing around cuff before pumping cycle resumes)",
      "Counsel re: 5-year reoperation rate ~25% for atrophy / mechanical failure",
    ],
    returnPrecautions: ["Wound infection / fluid collection over device", "Severe scrotal pain", "Difficulty cycling pump"],
  },
  requiredFields: [
    { id: "cuff_size_cm", label: "Cuff size (cm)", type: "enum", options: ["3.5", "4.0", "4.5", "5.0", "5.5", "6.0"] },
    { id: "prb_pressure", label: "Balloon pressure (cm H2O)", type: "enum", options: ["41-50", "51-60", "61-70", "71-80"] },
    { id: "pump_location", label: "Pump location", type: "enum", options: ["Right dependent scrotum", "Left dependent scrotum", "Labia majora"] },
  ],
});

export const MALE_SLING = u({
  key: "urology.reconstructive.male_sling",
  subcategory: "reconstructive",
  procedureName: "Male transobturator sling (AdVance)",
  synonyms: ["male sling", "advance sling", "transobturator male sling"],
  matchPatterns: [/\bmale\s+sling|\badvance\s+sling/i],
  topMatter: {
    anesthesia: "General or spinal.",
    position: "Dorsal lithotomy.",
    prep: "Perineum + thighs prepped.",
    ebl: "Minimal.",
    disposition: "Discharge home same-day.",
  },
  findings: { headline: "Mild–moderate stress urinary incontinence (1–3 PPD); residual urethral coaptation present on cystoscopy. AdVance sling positioned tension-free under proximal bulbar urethra." },
  operativeSteps: {
    steps: [
      "Perineal vertical incision; bulbar urethra and central tendon identified; bulbocavernosus retracted.",
      "Bilateral transobturator trocars passed outside-in through ischiopubic ramus and obturator membrane.",
      "AdVance polypropylene mesh sling attached; arms pulled through; sling positioned tension-free under proximal bulbar urethra.",
      "Cystoscopy confirms no urethral perforation, urethra well coapted at sling site.",
      "Trocar arms trimmed flush at thigh skin; perineum closed in layers.",
    ],
  },
  devices: {
    instruments: ["AdVance trocar set + perineal retractors", "Cystoscope for confirmation"],
    implants: ["AdVance polypropylene transobturator sling"],
  },
  specimens: { default: "None." },
  tubesAndDrains: { default: "Foley overnight; trial of void in recovery / clinic next day." },
  complicationChecks: [
    { label: "Urinary retention requiring CIC / Foley re-insertion" },
    { label: "Persistent incontinence" },
    { label: "Mesh exposure (rare in male)" },
    { label: "Perineal pain" },
  ],
  postopPlan: {
    disposition: "Discharge home.",
    catheter: "Foley overnight.",
    followup: ["Clinic at 4 weeks for void diary + pad weight test"],
  },
  requiredFields: [
    { id: "preop_pad_weight", label: "Preop 24-h pad weight (g)", type: "number" },
    { id: "preop_ppd", label: "Preop pads-per-day", type: "number" },
  ],
});

export const PENILE_PROSTHESIS = u({
  key: "urology.reconstructive.penile_prosthesis",
  subcategory: "reconstructive",
  procedureName: "Inflatable penile prosthesis (3-piece)",
  synonyms: ["penile prosthesis", "inflatable penile prosthesis", "ipp", "ams 700", "coloplast titan"],
  matchPatterns: [/\bpenile\s+prosthes|\bipp\b|\bams\s*700|\bcoloplast\s+titan/i],
  topMatter: {
    anesthesia: "General or spinal.",
    position: "Supine with legs slightly abducted.",
    prep: "10-min chlorhexidine-alcohol scrub from umbilicus to mid-thigh; vancomycin + gentamicin prophylaxis given.",
    ebl: "Minimal.",
    disposition: "Discharge home same-day.",
  },
  findings: {
    headline: "Penoscrotal incision; corpora dilated atraumatically; cylinder length [proximal + distal] measured at ___ cm. Reservoir 100 mL placed in prevesical space; pump in dependent scrotum.",
  },
  operativeSteps: {
    steps: [
      "Penoscrotal vertical raphe incision; dartos opened; corpora cavernosa exposed bilaterally.",
      "2-cm corporotomies made bilaterally; corpora sequentially dilated with Brooks dilators (avoid crossover).",
      "Corporal length measured proximal + distal with Furlow inserter; cylinders selected.",
      "[AMS 700 LGX with InhibiZone / Coloplast Titan with rifampin-gentamicin soak per Mulcahy protocol] cylinders inserted; rear-tip extenders added.",
      "Corporotomies closed with running 2-0 PDS.",
      "Pump placed in dependent scrotum via blunt finger dissection.",
      "Reservoir 100 mL placed in prevesical space via the same penoscrotal incision through divided floor of inguinal canal.",
      "Tubing connected with AMS quick-connectors under saline; device cycled three times.",
      "Wound closed in layers; penile compressive dressing applied with penis taped to lower abdomen for 24 h.",
    ],
  },
  devices: {
    instruments: ["Penile prosthesis tray", "Brooks corporal dilators", "Furlow inserter"],
    implants: ["3-piece IPP: cylinders + 100 mL reservoir + control pump"],
  },
  specimens: { default: "None." },
  tubesAndDrains: { default: "Foley overnight; small Penrose drain in dependent scrotum × POD 1." },
  complicationChecks: [
    { label: "Device infection (1–3% primary; 7–10% revision — devastating)" },
    { label: "Cylinder buckling / S-shaped deformity" },
    { label: "Pump migration" },
    { label: "Reservoir herniation" },
    { label: "Glans cooling (S-shaped tip with insufficient distal corporal sizing)" },
  ],
  postopPlan: {
    disposition: "Discharge home.",
    catheter: "Foley × 24 h.",
    activity: "Device deactivation × 4–6 weeks; activation + cycling instruction at 4–6 weeks.",
    followup: [
      "Clinic at 4–6 weeks for activation + cycling instruction",
      "Long-term satisfaction 85–95%; revision rate 10–15% at 5 years",
    ],
  },
  requiredFields: [
    { id: "manufacturer", label: "Manufacturer", type: "enum", options: ["AMS 700 LGX (InhibiZone)", "AMS 700 CX", "Coloplast Titan (rifampin-gentamicin soak)", "Coloplast Titan Touch"] },
    { id: "cylinder_length_cm", label: "Cylinder length (cm)", type: "number" },
    { id: "reservoir_size_ml", label: "Reservoir size (mL)", type: "enum", options: ["75", "100", "Low-profile (65)"] },
    { id: "rte_cm", label: "Rear-tip extenders (cm)", type: "number" },
  ],
});

export const TESTICULAR_PROSTHESIS = u({
  key: "urology.reconstructive.testicular_prosthesis",
  subcategory: "reconstructive",
  procedureName: "Testicular prosthesis insertion",
  synonyms: ["testicular prosthesis", "testis prosthesis", "torpedo prosthesis"],
  matchPatterns: [/\btestic(le|ular)?\s+prosthes/i],
  topMatter: {
    anesthesia: "General or local with MAC sedation.",
    position: "Supine.",
    prep: "Scrotum + ipsilateral inguinal region prepped with chlorhexidine; vancomycin + gentamicin prophylaxis (prosthetic implant).",
    ebl: "Minimal.",
    disposition: "Discharge home same-day.",
  },
  findings: {
    headline: "Empty [right / left] hemiscrotum; subdartos pouch developed of adequate size matched to contralateral testis dimensions. Saline-filled silicone Coloplast Torpedo (or AMS) testicular prosthesis size [small (2.6 × 4.0 cm) / medium (3.4 × 5.1 cm) / large (3.8 × 5.7 cm) / extra-large (4.1 × 6.2 cm)] selected by direct comparison to the contralateral side and placed in the dependent pouch.",
    supporting: [
      "Pre-incision sizing performed with the contralateral testis in hand using the manufacturer's sizing template.",
      "Surrounding tissues healthy with no evidence of prior infection or fibrosis to obstruct pouch creation.",
    ],
  },
  operativeSteps: {
    steps: [
      "Pre-incision sizing: the contralateral testis dimensions were measured with calipers (length × width × depth in cm), and the prosthesis sized one increment smaller (the silicone implant feels firmer than native testis, so a slightly smaller volume avoids contralateral asymmetry).",
      "[Inguinoscrotal incision: 4 cm transverse incision in the upper hemiscrotum extending toward the inguinal canal — preferred for primary placement and when concomitant orchiectomy was performed via the same incision.] OR [Pure scrotal incision: 3 cm transverse upper hemiscrotal incision — preferred for delayed placement when the inguinal scar has fully healed.]",
      "The incision was carried down through dartos with monopolar electrocautery; a subdartos pouch was developed by elevating scrotal skin off the dartos with sharp scissor dissection in the avascular plane. The pouch was sized to comfortably accommodate the chosen prosthesis without tension at the neck and without redundancy at the apex.",
      "The Coloplast Torpedo (or AMS) saline-filled silicone prosthesis was opened in sterile fashion at the back table, inspected for any defects, and irrigated with vancomycin solution 1 g in 500 mL saline (per Mulcahy protocol for prosthetic device soak prior to placement).",
      "The prosthesis was placed in the subdartos pouch oriented with the suture tab at the most dependent point.",
      "The suture tab on the prosthesis was anchored to the dartos at the most dependent point with 2-3 interrupted 4-0 Vicryl sutures (preventing late ascent into the upper scrotum, the most common cosmetic complication).",
      "The pouch neck was tightened around the cord side of the prosthesis with 2 interrupted 4-0 Vicryl sutures, forming a snug seal that permits cord passage but prevents prosthesis migration upward.",
      "Final positioning re-checked by external palpation comparing to the contralateral testis — symmetry confirmed before closure.",
    ],
    closure: "Dartos closed with running 3-0 Vicryl. Skin closed with 4-0 Monocryl subcuticular running suture. Sterile dressing + scrotal support applied.",
  },
  devices: {
    instruments: ["Standard scrotal tray", "Calipers for sizing"],
    implants: ["Coloplast Torpedo or AMS saline-filled silicone testicular prosthesis (sizes: small 2.6 × 4.0, medium 3.4 × 5.1, large 3.8 × 5.7, XL 4.1 × 6.2 cm)"],
    consumables: ["Vancomycin 1 g/500 mL saline for implant soak", "4-0 Vicryl × 4-5 for tab anchor + pouch neck", "3-0 Vicryl + 4-0 Monocryl for closure"],
  },
  specimens: { default: "None." },
  tubesAndDrains: { default: "None." },
  complicationChecks: [
    { label: "Implant infection (~3% — explant required if infected)" },
    { label: "Asymmetric position / migration into upper scrotum" },
    { label: "Suture extrusion through skin" },
    { label: "Patient dissatisfaction with size or firmness (less compressible than native testis)" },
  ],
  postopPlan: {
    disposition: "Discharge home.",
    activity: "Scrotal support × 1 week; no heavy lifting × 4 weeks; no straddling activities × 4 weeks.",
    analgesia: "Acetaminophen + NSAID; ice × 48 h.",
    antibiotics: "Single perioperative dose only (no continuation despite implant — current evidence does not support extended antibiotics).",
    followup: ["Clinic at 4 weeks for position + cosmetic + symmetry check"],
    returnPrecautions: ["Wound discharge / fluctuant swelling (fever / infection — explant emergency)", "Significant migration upward", "Persistent pain"],
  },
  requiredFields: [
    { id: "prosthesis_size", label: "Size", type: "enum", options: ["Small (2.6 × 4.0 cm)", "Medium (3.4 × 5.1 cm)", "Large (3.8 × 5.7 cm)", "Extra-large (4.1 × 6.2 cm)"] },
    { id: "manufacturer", label: "Manufacturer", type: "enum", options: ["Coloplast Torpedo", "AMS", "Other"] },
    { id: "incision_approach", label: "Incision approach", type: "enum", options: ["Inguinoscrotal", "Pure scrotal", "Inguinal extension of orchiectomy scar"] },
    { id: "indication", label: "Indication", type: "enum", options: ["Post-orchiectomy (cancer)", "Post-orchiectomy (torsion)", "Congenital absence", "Atrophy", "Trauma"] },
    { id: "concomitant_orchiectomy", label: "Same-stage orchiectomy", type: "boolean" },
  ],
});

export const BLADDER_BOTOX = u({
  key: "urology.functional.bladder_botox",
  subcategory: "functional",
  procedureName: "Cystoscopic intradetrusor botulinum toxin A injection",
  synonyms: ["bladder botox", "intradetrusor botox", "onabotulinumtoxin a bladder"],
  matchPatterns: [/\b(bladder|intradetrusor)\s+botox|\bonabotulinumtoxin\s+a/i],
  topMatter: {
    anesthesia: "Topical lidocaine jelly + intravesical lidocaine; MAC sedation for selected patients.",
    position: "Dorsal lithotomy.",
    prep: "Genitalia prepped.",
    ebl: "Minimal.",
    disposition: "Discharge home immediately.",
  },
  findings: { headline: "Bladder mucosa normal; ureteric orifices identified; ___ U onabotulinumtoxin A delivered as ___ injections of ___ U each, sparing the trigone." },
  operativeSteps: {
    steps: [
      "Topical 2% lidocaine jelly per urethra; flexible (or rigid) cystoscope advanced; bladder filled to 200 mL.",
      "Intravesical lidocaine 1% × 50 mL instilled and dwelled × 5 minutes for additional analgesia.",
      "[Idiopathic OAB:] 100 U onabotulinumtoxin A diluted in 10 mL saline injected at 20 sites of 0.5 mL each, sparing the trigone, into the detrusor muscle (1-2 mm deep).",
      "[Neurogenic detrusor overactivity:] 200 U onabotulinumtoxin A diluted in 30 mL injected at 30 sites of 1 mL each.",
      "Catheter not routinely placed.",
    ],
  },
  devices: {
    instruments: ["Flexible / rigid cystoscope", "Botox injection needle (Uroplasty / Cook 23 G)"],
    consumables: ["Onabotulinumtoxin A (Botox) 100 U or 200 U"],
  },
  specimens: { default: "None." },
  tubesAndDrains: { default: "None." },
  complicationChecks: [
    { label: "Urinary retention requiring CIC (5–15% in idiopathic, up to 30% in neurogenic)" },
    { label: "UTI" },
    { label: "Hematuria" },
  ],
  postopPlan: {
    disposition: "Discharge home immediately.",
    activity: "No restrictions.",
    followup: [
      "Symptom assessment at 4–6 weeks (peak effect)",
      "Re-injection at 6–9 months when symptoms recur",
      "Patient must be willing/able to perform CIC if retention develops",
    ],
  },
  requiredFields: [
    { id: "indication", label: "Indication", type: "enum", options: ["Idiopathic OAB", "Neurogenic detrusor overactivity"] },
    { id: "dose_units", label: "Dose (units)", type: "enum", options: ["100", "200", "300"] },
    { id: "number_of_injections", label: "Number of injections", type: "number" },
  ],
});

export const SACRAL_NEUROMODULATION = u({
  key: "urology.functional.sacral_neuromodulation",
  subcategory: "functional",
  procedureName: "Sacral neuromodulation (InterStim) — stage 1 lead placement",
  synonyms: ["sacral neuromodulation", "interstim", "snm", "sns"],
  matchPatterns: [/\bsacral\s+neuromodulation|\binterstim|\bsnm\b|\bsns\b/i],
  topMatter: {
    anesthesia: "MAC sedation (must be light enough to detect motor + sensory responses) or local.",
    position: "Prone with chest + iliac crest bolsters; abdomen hanging free.",
    prep: "Lower back + bilateral buttocks prepped widely.",
    ebl: "Minimal.",
    disposition: "Discharge home with externalised lead × 7-14-day trial.",
  },
  findings: {
    headline: "S3 foramen successfully cannulated on first pass under fluoroscopic guidance. All four electrodes elicited bellows + plantarflexion of the great toe at < 2 V — confirming optimal lead position.",
  },
  operativeSteps: {
    steps: [
      "Surface anatomy + true lateral fluoroscopy used to localise S3 (medial edge of sciatic notch, ~9-11 cm cephalad to coccyx, 2 cm lateral to midline).",
      "16 G × 9 cm Medtronic foramen needle (041828) advanced into S3 foramen at 60° caudal angle under intermittent AP + lateral fluoroscopy.",
      "Test stimulation 0.5-2 V via external test stimulator confirmed S3 motor response (bellows-like contraction of perineal levator ani + plantarflexion of ipsilateral great toe alone).",
      "Sensory response (vibration in rectum/vagina/scrotum) confirmed in awake patients.",
      "Guidewire passed; needle removed; dilator-introducer assembled; 4-electrode tined lead (Medtronic 3889) advanced into S3.",
      "Each of 4 electrodes tested — all elicited bellows + great-toe responses at < 2 V threshold; AP + lateral fluoro confirmed lead curve along S3 nerve root.",
      "Tined lead deployed by retracting introducer sheath; lead tunnelled subcutaneously to gluteal incision and externalised for 7-14-day trial.",
    ],
  },
  devices: {
    instruments: ["16 G × 9 cm Medtronic foramen needle (041828)", "External test stimulator", "Fluoroscopy unit"],
    implants: ["Medtronic Model 3889 4-electrode tined lead (or Axonics quadripolar)"],
  },
  specimens: { default: "None." },
  tubesAndDrains: { default: "None." },
  complicationChecks: [
    { label: "Lead migration (5–10% at 5 y)" },
    { label: "Pocket pain (Stage 2)" },
    { label: "Infection at lead exit / IPG pocket" },
  ],
  postopPlan: {
    disposition: "Discharge home with programmer.",
    activity: "Restrictions on bending / lifting > 10 lbs × 6 weeks (after Stage 2) for tined-lead ingrowth.",
    followup: [
      "Symptom diary × 7–14 days during trial",
      "If > 50% improvement: Stage 2 IPG implantation",
      "Programming optimisation at 2 weeks post-Stage 2",
    ],
  },
  requiredFields: [
    { id: "stage", label: "Stage", type: "enum", options: ["Stage 1 (lead trial)", "Stage 2 (IPG implant)", "Single-stage", "Revision"] },
    { id: "indication", label: "Indication", type: "enum", options: ["Refractory urge incontinence", "Refractory urge frequency", "Non-obstructive urinary retention", "Fecal incontinence"] },
    { id: "thresholds_low", label: "All electrodes < 2 V threshold", type: "boolean" },
  ],
});

export const URODYNAMICS = u({
  key: "urology.functional.urodynamics",
  subcategory: "functional",
  procedureName: "Urodynamic study (multichannel)",
  synonyms: ["urodynamics", "urodynamic study", "uds", "cystometry"],
  matchPatterns: [/\burodynamic|\bcystometry|\buds\b/i],
  topMatter: {
    anesthesia: "None — awake study.",
    position: "Sitting on commode (filling) → supine for fluoroscopy if VCUG.",
    prep: "Genitalia prepped with chlorhexidine.",
    ebl: "None.",
    disposition: "Discharge home immediately.",
  },
  findings: { headline: "Cystometric capacity ___ mL; first sensation ___ mL; first desire ___ mL; strong desire ___ mL. [Detrusor overactivity present at ___ mL with leak / no DO]. Compliance ___ mL/cm H2O. Maximum detrusor pressure ___ cm H2O. Pdet at Qmax ___ cm H2O at flow ___ mL/sec — [normal / obstructive (Schäfer/ICS nomogram)]." },
  operativeSteps: {
    steps: [
      "Pre-void uroflow + post-void residual obtained.",
      "9 Fr dual-lumen filling catheter (T-DOC or equivalent) placed in bladder; rectal pressure catheter (or vaginal in females) for abdominal pressure subtraction.",
      "Bladder filled with room-temperature saline at 30 mL/min to cystometric capacity.",
      "Sensations marked in real time (first sensation, first desire, strong desire); detrusor activity documented.",
      "Urge incontinence / stress maneuvers (Valsalva, cough) elicited as needed.",
      "Pressure-flow study (PFS) performed at maximum capacity for outlet obstruction assessment.",
      "[Videourodynamics: fluoroscopic imaging during filling and voiding for VUR / bladder neck assessment.]",
    ],
  },
  devices: {
    instruments: ["Multichannel urodynamics console (Laborie / Andromeda)", "T-DOC dual-lumen 9 Fr filling catheter", "Rectal pressure catheter"],
  },
  specimens: { default: "None." },
  tubesAndDrains: { default: "None." },
  complicationChecks: [
    { label: "Post-study UTI (1–3%)" },
    { label: "Patient discomfort during testing" },
  ],
  postopPlan: {
    disposition: "Discharge home immediately.",
    activity: "No restrictions.",
    followup: ["Results discussion in clinic at 1–2 weeks"],
  },
  requiredFields: [
    { id: "indication", label: "Indication", type: "enum", options: ["Mixed urinary incontinence workup", "Neurogenic bladder (annual UDS)", "Refractory voiding symptoms", "Pre-op assessment for prolapse / sling", "Pediatric VUR / voiding dysfunction"] },
    { id: "videourodynamics", label: "Videourodynamics performed", type: "boolean" },
    { id: "cystometric_capacity_ml", label: "Cystometric capacity (mL)", type: "number" },
    { id: "do_present", label: "Detrusor overactivity present", type: "boolean" },
  ],
});

// Aggregate
export const REMAINING_UROLOGY_TEMPLATES: ProcedureTemplate[] = [
  // Order: most-specific patterns first within the urology service.
  RIGID_CYSTOSCOPY,
  RETROGRADE_PYELOGRAM,
  ESWL,
  TURP,
  REZUM,
  UROLIFT,
  CYSTOLITHOLAPAXY,
  BLADDER_BIOPSY,
  ORCHIECTOMY,
  ORCHIDOPEXY_CRYPTORCHIDISM,
  URETHROPLASTY,
  URETERIC_REIMPLANT,
  AUS,
  MALE_SLING,
  PENILE_PROSTHESIS,
  TESTICULAR_PROSTHESIS,
  SUPRAPUBIC_CATHETER,
  BLADDER_BOTOX,
  SACRAL_NEUROMODULATION,
  URODYNAMICS,
  FLEXIBLE_CYSTOSCOPY,
];
