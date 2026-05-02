// ---------------------------------------------------------------------------
// Urology — Endourology procedure templates
//
// Rich, structured templates for the highest-volume endourologic
// procedures. Each template generates an attending-quality dictation that
// reads procedure-specifically (a TURBT and a cystoscopy must not look
// alike). Match patterns are narrow and ordered most-specific-first.
// ---------------------------------------------------------------------------

import type { ProcedureTemplate } from "../types";

// ---------------------------------------------------------------------------
// Ureteric stent insertion (cystoscopic, retrograde)
// Source: matches the user's example #1 attending dictation
// ---------------------------------------------------------------------------

export const URETERIC_STENT_INSERTION: ProcedureTemplate = {
  key: "urology.endourology.ureteric_stent_insertion",
  specialty: "urology",
  subcategory: "endourology",
  procedureName: "Cystoscopy with ureteric stent insertion",
  synonyms: [
    "stent placement",
    "stent insertion",
    "ureteric stent",
    "ureteral stent",
    "double-j",
    "dj stent",
  ],
  matchPatterns: [
    // Stent insertion / placement, but NOT removal or exchange
    /\bcystoscop.*\bstent\b(?!\s*(removal|exchange))/i,
    /\bstent\s+(insertion|placement|in)\b/i,
    /\b(double[-\s]?j|dj)\s+stent\s+insertion\b/i,
  ],
  topMatter: {
    anesthesia: "IV sedation (or general endotracheal anesthesia for selected patients).",
    position: "The patient was placed in dorsal lithotomy with the legs in well-padded candy-cane stirrups; common peroneal nerve compression off-loaded at the fibular head.",
    prep: "The genitalia and perineum were prepped with chlorhexidine and draped in the usual sterile fashion. Pre-instrumentation antibiotic prophylaxis (cefazolin 2 g IV or culture-directed) was administered within 60 minutes per AUA guidelines.",
    ebl: "Minimal.",
    disposition: "The patient tolerated the procedure well and was transferred to recovery. Plan: continue current antibiotic regimen as appropriate, follow-up in clinic for definitive management of the underlying pathology.",
  },
  findings: {
    headline: "[Right / Left / Bilateral] hydroureteronephrosis with [obstructing distal / mid / proximal ureteric stone / ureteric stricture / extrinsic compression]. The renal pelvis was [decompressed / dilated / appeared normal].",
    supporting: [
      "Cystoscopy demonstrated normal urethral and bladder anatomy without other abnormalities; ureteric orifices identified bilaterally.",
      "Retrograde pyelogram demonstrated [intrarenal contrast / a contrast column to the level of obstruction / no extravasation].",
      "[Note any anatomic variant — ectopic kidney, malrotation, prior surgery distorting anatomy.]",
    ],
  },
  operativeSteps: {
    steps: [
      "A 17 Fr flexible cystoscope was advanced per meatus into the urethra under direct vision. The urethra was inspected en route, including the prostatic urethra in male patients. The bladder was systematically inspected.",
      "Attention was turned to the affected ureteric orifice. A Sensor (PTFE-coated, 0.038\") guidewire was advanced through the cystoscope working channel and passed up the ureter under fluoroscopic guidance.",
      "Intrarenal wire position was confirmed by visualisation of the wire curling within the renal pelvis on AP fluoroscopy.",
      "The cystoscope was de-instrumented, leaving the Sensor wire in place. A 5 Fr open-tip ureteric catheter (Cook or Bard) was advanced over the wire.",
      "A retrograde pyelogram was performed with [5 mL] of Omnipaque diluted contrast injected through the catheter, with the Sensor wire withdrawn for imaging and replaced afterwards. Fluoroscopic imaging confirmed appropriate intrarenal position and characterised the upper-tract anatomy.",
      "The Sensor wire was re-advanced; the 5 Fr ureteric catheter was withdrawn over the wire, the wire remaining in position throughout.",
      "A 6 Fr × [22 / 26 / 28] cm double-J ureteric stent (Boston Scientific Polaris Loop or institution-equivalent) was advanced over the Sensor wire and deployed with the proximal coil in the renal pelvis (confirmed by fluoroscopic visualisation of the curled coil) and the distal coil in the bladder under direct cystoscopic vision.",
      "Final fluoroscopic and cystoscopic imaging confirmed appropriate proximal and distal coil position. The wire was withdrawn.",
      "The bladder was emptied through the cystoscope, and the cystoscope was withdrawn under direct vision.",
    ],
  },
  devices: {
    instruments: [
      "17 Fr flexible cystoscope",
      "Sensor (PTFE-coated 0.038\") guidewire",
      "5 Fr open-tip ureteric catheter",
      "Fluoroscopy unit",
    ],
    implants: ["6 Fr × [22 / 26 / 28] cm double-J ureteric stent"],
    consumables: ["Omnipaque contrast (~5 mL for pyelogram)"],
  },
  specimens: {
    default: "Urine sent for culture (if clinical suspicion of infection); otherwise none.",
  },
  tubesAndDrains: {
    default: "Indwelling 6 Fr × [length] cm double-J ureteric stent. Foley catheter was [placed / not placed] depending on voiding status and hematuria.",
  },
  complicationChecks: [
    { label: "Ureteric perforation" },
    { label: "Stent malposition / proximal migration" },
    { label: "Hematuria" },
    { label: "Post-instrumentation sepsis" },
  ],
  postopPlan: {
    disposition: "Recovery → discharge home same-day if stable.",
    catheter: "Stent indwelling. Foley as documented above; voiding trial in recovery if no Foley.",
    analgesia: "Tamsulosin 0.4 mg PO daily for stent symptoms; acetaminophen and NSAIDs as tolerated.",
    antibiotics: "Continue ongoing antibiotic course as appropriate (e.g., amoxicillin/clavulanic acid for febrile UTI). No routine prophylaxis post-discharge.",
    activity: "No restrictions; encourage hydration.",
    followup: [
      "Clinic follow-up for definitive management of underlying pathology",
      "Stent removal scheduled at the appropriate interval (typically 1–6 weeks depending on indication)",
    ],
    returnPrecautions: [
      "Fevers > 38.5°C, rigors, or progressive flank pain (suggestive of stent obstruction or infection)",
      "Heavy persistent gross hematuria or clot retention",
      "Inability to void or significant dysuria not relieved by tamsulosin",
    ],
  },
  requiredFields: [
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "indication", label: "Indication", type: "text", hint: "Stone, stricture, malignant compression, post-op, infection" },
    { id: "infection_status", label: "Infection status", type: "enum", options: ["No infection", "Suspected infection", "Confirmed UTI / sepsis"] },
    { id: "retrograde_pyelogram", label: "Retrograde pyelogram performed", type: "boolean" },
    { id: "urine_drained", label: "Urine drained", type: "boolean" },
    { id: "urine_culture_sent", label: "Urine culture sent", type: "boolean" },
    { id: "stent_size_fr", label: "Stent size (Fr)", type: "enum", options: ["4.7", "6", "7"] },
    { id: "stent_length_cm", label: "Stent length (cm)", type: "enum", options: ["22", "24", "26", "28", "30"] },
    { id: "foley_placed", label: "Foley placed", type: "boolean" },
  ],
  optionalFields: [
    { id: "anatomic_variant", label: "Anatomic variant", type: "text", hint: "Malrotation, ectopia, prior surgery, etc." },
    { id: "wire_difficulty", label: "Wire passage difficulty", type: "text" },
  ],
  billingPrompts: [
    "Document stent size and length explicitly.",
    "Confirm laterality.",
    "Document if retrograde pyelogram was performed.",
  ],
};

// ---------------------------------------------------------------------------
// Stent exchange (via cystoscopy or ileal conduit)
// Source: matches the user's example #2 attending dictation (conduit variant)
// ---------------------------------------------------------------------------

export const URETERIC_STENT_EXCHANGE: ProcedureTemplate = {
  key: "urology.endourology.ureteric_stent_exchange",
  specialty: "urology",
  subcategory: "endourology",
  procedureName: "Ureteric stent exchange",
  synonyms: [
    "stent exchange",
    "stent change",
    "ureteric stent change",
    "double-j exchange",
  ],
  matchPatterns: [
    /\bstent\s+exchange\b/i,
    /\bstent\s+change\b/i,
    /\b(double[-\s]?j|dj)\s+exchange\b/i,
  ],
  topMatter: {
    anesthesia: "IV sedation; general anesthesia reserved for difficult anatomy or patient request.",
    position: "Supine for ileal-conduit exchange (direct stoma access); dorsal lithotomy for native cystoscopic exchange.",
    prep: "Conduit stoma site (or genitalia + perineum) prepped with chlorhexidine and draped sterilely.",
    ebl: "Minimal.",
    disposition: "Patient tolerated the procedure well, no concerns. Routine recovery and discharge same-day. Plan: clinic follow-up in approximately 6 months for the next scheduled stent exchange.",
  },
  findings: {
    headline: "Indwelling stent in expected position; no encrustation requiring fragmentation; right renal pelvis decompressed on retrograde imaging.",
    supporting: [
      "[For conduit exchange: stent visible protruding ~1 cm from the stoma, allowing direct grasp without cystoscopy.]",
      "[For cystoscopic exchange: cystoscopy demonstrated the distal coil at the trigone in expected position.]",
    ],
  },
  operativeSteps: {
    steps: [
      "[Conduit variant] The patient was positioned supine; the ileal-conduit stoma was prepped and draped. The indwelling stent was identified protruding ~1 cm from the conduit edge and was therefore graspable without cystoscopy.",
      "[Native variant] A 17 Fr flexible cystoscope was advanced per meatus and the affected ureteric orifice / distal stent coil was identified at the trigone.",
      "Under fluoroscopic guidance, a Sensor (0.038\") guidewire was passed retrograde alongside the existing stent up the ureter and confirmed within the renal pelvis.",
      "A retrograde pyelogram was performed through a 5 Fr open-tip ureteric catheter ([5 mL] Omnipaque) to confirm wire position within the renal pelvis and document upper-tract anatomy.",
      "The existing stent was removed, leaving the Sensor wire in place.",
      "A new [6 Fr × 26 cm / 8 Fr × 20 cm] double-J ureteric stent was advanced over the Sensor wire and deployed with the proximal coil within the renal pelvis (confirmed by fluoroscopy) and the distal coil [in the bladder / exteriorised through the conduit stoma].",
      "Final fluoroscopic imaging confirmed appropriate proximal coil position. The wire was withdrawn.",
    ],
  },
  devices: {
    instruments: [
      "17 Fr flexible cystoscope (cystoscopic variant)",
      "Sensor 0.038\" guidewire",
      "5 Fr open-tip ureteric catheter",
      "Fluoroscopy unit",
    ],
    implants: ["New [size] Fr × [length] cm double-J ureteric stent"],
    consumables: ["Omnipaque contrast (~5 mL for pyelogram)"],
  },
  specimens: {
    default: "Removed indwelling stent — discarded. Urine sent for culture if clinical suspicion of infection.",
  },
  tubesAndDrains: {
    default: "New double-J stent in situ. Foley not routinely required.",
  },
  complicationChecks: [
    { label: "Wire / stent migration during exchange" },
    { label: "Encrustation requiring fragmentation" },
    { label: "Conduit / stomal trauma" },
    { label: "Hematuria" },
  ],
  postopPlan: {
    disposition: "Recovery → discharge home same-day.",
    activity: "No restrictions; encourage hydration.",
    followup: [
      "Clinic in approximately 6 months for the next routine stent exchange (interval may shorten with infection or encrustation history)",
    ],
    returnPrecautions: [
      "Fevers, rigors, or flank pain suggesting obstruction or sepsis",
      "Stent-related symptoms not relieved by tamsulosin",
    ],
  },
  requiredFields: [
    { id: "approach", label: "Access route", type: "enum", options: ["Native cystoscopy", "Ileal conduit (direct)", "Continent diversion (via cystoscopy)"] },
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "interval_months", label: "Interval since last exchange (months)", type: "number" },
    { id: "stent_size_fr", label: "New stent size (Fr)", type: "enum", options: ["6", "7", "8"] },
    { id: "stent_length_cm", label: "New stent length (cm)", type: "enum", options: ["20", "22", "24", "26", "28"] },
  ],
  billingPrompts: [
    "Specify the access route (cystoscopy vs conduit) — different fee codes.",
    "Document new stent size and length.",
  ],
};

// ---------------------------------------------------------------------------
// Stent removal (cystoscopic, simple)
// ---------------------------------------------------------------------------

export const URETERIC_STENT_REMOVAL: ProcedureTemplate = {
  key: "urology.endourology.ureteric_stent_removal",
  specialty: "urology",
  subcategory: "endourology",
  procedureName: "Cystoscopic ureteric stent removal",
  synonyms: ["stent removal", "remove stent", "stent off"],
  matchPatterns: [/\bstent\s+(removal|off)\b/i, /\bremove\s+stent\b/i],
  topMatter: {
    anesthesia: "Topical 2% lidocaine jelly per urethra; no sedation routinely required.",
    position: "Dorsal lithotomy in the cystoscopy suite.",
    prep: "Genitalia prepped and draped sterilely.",
    ebl: "Minimal.",
    disposition: "Discharged home from cystoscopy suite immediately following the procedure.",
  },
  findings: {
    headline: "Distal coil of stent identified in the bladder in expected position. Stent removed atraumatically with no fragmentation; ureteric orifice patent without significant edema.",
  },
  operativeSteps: {
    steps: [
      "Topical 2% lidocaine hydrochloride jelly (UroJet 10 mL) was instilled per urethra and held for 5–10 minutes for anesthetic effect.",
      "A 16-17 Fr flexible cystoscope was lubricated and introduced per urethra under direct vision through irrigation flow.",
      "The bladder was systematically inspected; the distal stent coil was identified at the trigone.",
      "Stent-grasping forceps (Olympus 3 Fr or 5 Fr alligator) were passed through the working channel and engaged the distal coil.",
      "The stent was removed gently under direct vision through the urethra alongside the cystoscope, and inspected for full-length removal — both coils intact, no fragmentation.",
      "The ureteric orifice was reinspected: patent, without active bleeding, with clear ureteric efflux. The cystoscope was withdrawn.",
    ],
  },
  devices: {
    instruments: ["16-17 Fr flexible cystoscope", "Stent-grasping (alligator) forceps"],
  },
  specimens: { default: "Removed stent — discarded after measurement / inspection." },
  tubesAndDrains: { default: "None." },
  complicationChecks: [
    { label: "Stent fragmentation / retained fragments" },
    { label: "Mucosal injury at orifice" },
    { label: "Encrustation requiring fragmentation under anesthesia" },
  ],
  postopPlan: {
    disposition: "Discharged home immediately.",
    activity: "No restrictions; increase fluid intake.",
    followup: [
      "Per underlying diagnosis: post-stone-treatment stents may require no further follow-up; post-reconstructive stents need US/MAG3 at 4–6 weeks",
    ],
    returnPrecautions: [
      "Fevers, persistent flank pain (suggesting recurrent obstruction)",
      "Inability to void",
    ],
  },
  requiredFields: [
    { id: "indication_for_removal", label: "Indication", type: "enum", options: ["Scheduled removal", "Post-stone-treatment", "Post-reconstructive (pyeloplasty/reimplant)", "Encrusted / infected"] },
    { id: "duration_weeks", label: "Duration in situ (weeks)", type: "number" },
    { id: "full_length_removed", label: "Full length removed (no fragments)", type: "boolean" },
  ],
};

// ---------------------------------------------------------------------------
// Ureteroscopy + laser lithotripsy
// ---------------------------------------------------------------------------

export const URETEROSCOPY_LASER: ProcedureTemplate = {
  key: "urology.endourology.ureteroscopy_laser_lithotripsy",
  specialty: "urology",
  subcategory: "endourology",
  procedureName: "Ureteroscopy and laser lithotripsy",
  synonyms: ["ureteroscopy", "urs", "laser lithotripsy"],
  matchPatterns: [
    /\bureteroscop|\burs\b/i,
    /\blaser\s+lithotrips/i,
  ],
  topMatter: {
    anesthesia: "General endotracheal anesthesia (LMA acceptable for short cases).",
    position: "Dorsal lithotomy with the legs well-padded in candy-cane stirrups.",
    prep: "Genitalia and perineum prepped with chlorhexidine; pre-instrumentation antibiotic per AUA pre-instrumentation guidelines.",
    ebl: "Minimal.",
    disposition: "Recovery → discharge home same-day for uncomplicated cases.",
  },
  findings: {
    headline: "[Right / Left] [proximal / mid / distal / intrarenal] [calculus measuring approximately ___ mm], composition presumed [calcium oxalate / uric acid / cystine] based on density / history.",
    supporting: [
      "Ureter inspected on withdrawal — [healthy mucosa / mild edema / focal inflammation / Hayes grade 1-4 injury at the level of ___].",
      "Renal collecting system inspected — [no further stones / additional fragments at upper-pole calyx, treated].",
    ],
  },
  operativeSteps: {
    steps: [
      "Cystoscopy was performed via 22 Fr rigid cystoscope; ureteric orifice on the affected side was cannulated with a Sensor 0.038\" guidewire passed up to the renal pelvis under fluoroscopic guidance.",
      "[If access sheath used:] A 12/14 Fr × 35 cm Cook Flexor ureteric access sheath was advanced over a stiff (Amplatz) wire to the proximal ureter under fluoroscopic guidance, with a safety wire left alongside.",
      "A semi-rigid ureteroscope (8/9.8 Fr Storz) was advanced through [the orifice / the access sheath] for distal-to-mid ureteric inspection.",
      "A flexible ureteroscope (Olympus URF-V2 or Storz Flex-X2 single-use) was advanced to the upper tract for renal pelvis and calyceal access.",
      "The stone was visualised and stabilised. Holmium:YAG laser lithotripsy was performed at [0.5 J × 60 Hz dusting / 1.0 J × 8 Hz fragmentation] settings via a 200/272 µm laser fibre.",
      "[If basket extraction:] Stone fragments were extracted with a 1.5 Fr nitinol tipless basket (NCircle / Zero Tip) and removed for stone-composition analysis.",
      "The renal collecting system was inspected systematically (upper, interpolar, lower-pole calyces) for residual stones.",
      "On withdrawal, the ureter was inspected for injury (Hayes grading 1–4); a 6 Fr × [22 / 26] cm double-J ureteric stent was placed if [edema, length > 30 min, ureteric injury, single-use ureteroscope].",
    ],
  },
  devices: {
    instruments: [
      "22 Fr rigid cystoscope",
      "Sensor 0.038\" guidewire (+ Amplatz stiff wire if access sheath used)",
      "8/9.8 Fr semi-rigid ureteroscope",
      "Olympus URF-V2 / Storz Flex-X2 flexible ureteroscope",
      "Holmium:YAG laser (Lumenis or equivalent), 200/272 µm fibre",
      "12/14 Fr × 35 cm Cook Flexor ureteric access sheath (when used)",
      "1.5 Fr nitinol tipless basket (NCircle / Zero Tip)",
    ],
    implants: ["6 Fr × [22 / 26] cm double-J ureteric stent (when placed)"],
  },
  specimens: {
    default: "Stone fragments sent for composition analysis if extracted; otherwise dust evacuated and discarded.",
  },
  tubesAndDrains: {
    default: "Double-J stent placed when indicated; Foley catheter optional and removed in recovery.",
  },
  complicationChecks: [
    { label: "Ureteric perforation / Hayes grade injury" },
    { label: "Stone retropulsion to upper tract" },
    { label: "Post-URS sepsis" },
    { label: "Mucosal stripping at access sheath site" },
  ],
  postopPlan: {
    disposition: "Discharge home same-day.",
    catheter: "Stent (when placed) for 5–14 days; removal in clinic with flexible cystoscopy.",
    analgesia: "Tamsulosin 0.4 mg daily for stent + medical expulsive therapy; acetaminophen + NSAID; opioid sparingly.",
    antibiotics: "Single perioperative dose unless infected stone — then 5–7 day course tailored to culture.",
    activity: "Light activity, hydration ≥ 2 L/day.",
    followup: [
      "Stone composition results in 7–10 days",
      "Stent removal at appropriate interval",
      "Repeat KUB at 4 weeks if dusting performed; metabolic workup for recurrent stones (24-h urine + serum profile)",
    ],
    returnPrecautions: [
      "Fevers > 38.5°C, rigors (post-URS sepsis 2–5%)",
      "Severe flank pain unrelieved by stent (suggests obstruction)",
      "Unable to void / severe stent symptoms",
    ],
  },
  requiredFields: [
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "stone_location", label: "Stone location", type: "enum", options: ["Distal ureter", "Mid ureter", "Proximal ureter", "Renal pelvis", "Upper-pole calyx", "Mid-calyx", "Lower-pole calyx", "Multiple"] },
    { id: "stone_size_mm", label: "Stone size (mm)", type: "number" },
    { id: "scope_used", label: "Scope used", type: "enum", options: ["Semi-rigid only", "Flexible only", "Both"] },
    { id: "safety_wire", label: "Safety wire used", type: "boolean" },
    { id: "access_sheath", label: "Ureteric access sheath used", type: "boolean" },
    { id: "laser_strategy", label: "Lithotripsy strategy", type: "enum", options: ["Dusting", "Fragmentation + basket", "Combination"] },
    { id: "ureter_inspected", label: "Ureter inspected on withdrawal", type: "boolean" },
    { id: "stent_placed", label: "Stent placed", type: "boolean" },
    { id: "stone_for_analysis", label: "Stone fragments sent for analysis", type: "boolean" },
  ],
  billingPrompts: [
    "Document stone location, size, scope used, and whether laser was applied.",
    "Specify whether a stent was placed and its size/length.",
  ],
};

// ---------------------------------------------------------------------------
// TURBT
// ---------------------------------------------------------------------------

export const TURBT: ProcedureTemplate = {
  key: "urology.oncology.turbt",
  specialty: "urology",
  subcategory: "oncology",
  procedureName: "Transurethral resection of bladder tumor (TURBT)",
  synonyms: ["turbt", "transurethral resection of bladder", "bladder tumor resection"],
  matchPatterns: [
    /\bturbt\b|\btransurethral\s+resection\s+of\s+bladder/i,
    /\bbladder\s+tumou?r\s+resection\b/i,
  ],
  topMatter: {
    anesthesia: "General endotracheal anesthesia with non-depolarising paralysis (mandatory for lateral-wall tumors to suppress the obturator reflex during monopolar resection); regional anesthesia acceptable when bipolar TURis is used.",
    position: "Dorsal lithotomy with legs in candy-cane stirrups.",
    prep: "Genitalia and perineum prepped with povidone-iodine or chlorhexidine; pre-incision antibiotic per AUA pre-instrumentation guidelines.",
    ebl: "Variable; typically 50–150 mL for standard resections.",
    disposition: "Recovery → admission for CBI overnight (most cases) or discharge home for small/superficial tumors per surgeon preference.",
  },
  findings: {
    headline: "[Single / multiple] bladder tumor(s) located at the [right / left / posterior / anterior / dome / trigone] wall, measuring approximately ___ cm, [papillary / sessile / solid / erythematous flat lesion], appearing [low-grade superficial / high-grade / muscle-invasive].",
    supporting: [
      "Cystoscopic systematic survey: dome, anterior wall, both lateral walls, posterior wall, trigone — additional findings as documented.",
      "Ureteric orifices identified bilaterally with clear efflux; tumor [does / does not] involve a ureteric orifice.",
      "Resection: complete to apparent base; [muscle visualised / muscle confirmed in deep specimen / muscle not visualised — re-resection planned at 4–6 weeks].",
      "Bladder examined at low volume after resection — no perforation; no further suspicious lesions.",
    ],
  },
  operativeSteps: {
    steps: [
      "A 26 Fr resectoscope (Storz / Olympus) with 30° lens was advanced per urethra under direct vision; the bladder was systematically inspected (dome, anterior, lateral walls, posterior, trigone) at moderate fill.",
      "All visible tumors were characterised by location, size, configuration, and number; ureteric orifices were identified bilaterally.",
      "Resection was performed with a [bipolar TURis loop in saline / monopolar loop in glycine] using cutting current. The tumor was resected progressively in chips down to the muscle layer.",
      "A separate, deliberate deep-muscle base specimen was obtained and submitted in a separately labelled container for accurate pT staging.",
      "Tumor chips were evacuated using an Ellik evacuator.",
      "Hemostasis at the resection bed was secured with the bipolar/monopolar coagulation electrode at 30–40 W; persistent venous oozing addressed with focal coagulation.",
      "The bladder was inspected at low volume to rule out perforation; no extravasation noted.",
      "[If indicated and not contraindicated:] Single-dose intravesical mitomycin C 40 mg in 40 mL sterile water was instilled via the irrigation channel and retained for 1 hour with patient rotation every 15 min — per AUA/EAU guideline for low/intermediate-risk NMIBC.",
      "A 22 Fr 3-way Foley catheter was placed for [continuous bladder irrigation × 24 h / gravity drainage].",
    ],
  },
  devices: {
    instruments: [
      "26 Fr resectoscope (Storz / Olympus) with 30° lens",
      "Bipolar TURis loop (or monopolar loop with glycine irrigation)",
      "Ellik evacuator",
      "22 Fr 3-way Foley catheter",
    ],
    consumables: [
      "Saline / glycine irrigation",
      "Mitomycin C 40 mg (when single-dose intravesical chemotherapy indicated)",
    ],
  },
  specimens: {
    default: "1) Bladder tumor chips for permanent pathology. 2) Deep muscle base specimen — separately labelled for accurate pT staging.",
  },
  tubesAndDrains: {
    default: "22 Fr 3-way Foley with continuous bladder irrigation (or gravity drainage for small superficial resections).",
  },
  complicationChecks: [
    { label: "Bladder perforation (intra- vs extraperitoneal)" },
    { label: "Obturator reflex injury (lateral-wall tumors)" },
    { label: "Hematuria requiring CBI / clot retention" },
    { label: "Ureteric orifice injury / stricture" },
    { label: "Post-operative UTI / sepsis" },
  ],
  postopPlan: {
    disposition: "Admission overnight for CBI; discharge POD 1 once urine clear and Foley out, OR same-day discharge for small superficial resections.",
    catheter: "22 Fr 3-way Foley with CBI overnight; trial of void POD 1 once urine clear.",
    analgesia: "Acetaminophen + NSAID; oxybutynin 5 mg PO q8h for bladder spasm.",
    antibiotics: "Single perioperative dose; no routine post-discharge antibiotics unless documented infection.",
    activity: "No heavy lifting × 2 weeks; expect mild hematuria up to 4 weeks.",
    followup: [
      "Pathology review at 7–10 days — risk-stratify per AUA NMIBC guidelines",
      "If high-grade or muscle absent: re-TURBT at 4–6 weeks",
      "Surveillance cystoscopy + cytology per risk category (low: 3, 12 months; intermediate: q3 mo × 2 y; high: q3 mo × 2 y + upper-tract imaging)",
      "BCG induction discussion for high-risk NMIBC (CIS, T1, high-grade Ta multifocal/recurrent)",
    ],
    returnPrecautions: [
      "Heavy persistent bleeding or clot retention",
      "Inability to void after Foley removal",
      "Fevers > 38.5°C, severe abdominal pain (suggests perforation)",
    ],
  },
  requiredFields: [
    { id: "tumor_location", label: "Tumor location", type: "text" },
    { id: "tumor_size_cm", label: "Largest tumor size (cm)", type: "number" },
    { id: "number_of_tumors", label: "Number of tumors", type: "number" },
    { id: "appearance", label: "Tumor appearance", type: "enum", options: ["Papillary", "Sessile", "Solid", "Erythematous flat", "Mixed"] },
    { id: "completeness", label: "Completeness of resection", type: "enum", options: ["Complete", "Subtotal — debulking only", "Visualised but unable to resect"] },
    { id: "muscle_in_specimen", label: "Muscle in specimen", type: "enum", options: ["Yes — muscle confirmed", "No — re-TURBT planned", "Unknown — pending pathology"] },
    { id: "perforation", label: "Perforation", type: "boolean" },
    { id: "intravesical_chemo", label: "Single-dose intravesical chemo given", type: "boolean" },
    { id: "catheter_size_fr", label: "Catheter size (Fr)", type: "enum", options: ["20", "22", "24"] },
    { id: "cbi", label: "CBI ordered", type: "boolean" },
  ],
  billingPrompts: [
    "Document tumor size and number — drives the fee tier.",
    "Document whether CBI was placed and intravesical chemo given.",
  ],
};

// ---------------------------------------------------------------------------
// HoLEP
// ---------------------------------------------------------------------------

export const HOLEP: ProcedureTemplate = {
  key: "urology.bph.holep",
  specialty: "urology",
  subcategory: "bph",
  procedureName: "Holmium laser enucleation of the prostate (HoLEP)",
  synonyms: ["holep", "holmium enucleation", "laser enucleation prostate"],
  matchPatterns: [/\bholep\b|\bholmium\s+enucleation\b/i],
  topMatter: {
    anesthesia: "General or regional anesthesia (regional preferred for elderly / cardiac comorbidity, allows intraoperative neurological assessment).",
    position: "Dorsal lithotomy.",
    prep: "Genitalia and perineum prepped with chlorhexidine; preoperative antibiotic prophylaxis per AUA pre-instrumentation guidelines.",
    ebl: "Typically minimal — under 100 mL even for very large glands.",
    disposition: "Admission overnight for CBI; discharge POD 1 once urine clear.",
  },
  findings: {
    headline: "Prostate volume approximately ___ g on preoperative imaging / cystoscopy, with [median lobe + bilateral lateral lobe / bilateral lateral lobe] hyperplasia. Bladder neck contracture: [present / absent]. Trabeculated bladder consistent with chronic bladder outlet obstruction.",
    supporting: [
      "Bilateral ureteric orifices identified at the trigone, protected throughout enucleation.",
      "[For median lobe variant: median lobe enucleated separately as the first step.]",
      "Lateral lobe enucleation: complete bilateral en-bloc release from the surgical capsule.",
      "Morcellation: complete; weight of tissue retrieved approximately ___ g.",
      "Intraoperative bladder examination: no perforation, hemostasis adequate.",
    ],
  },
  operativeSteps: {
    steps: [
      "A 26 Fr Storz HoLEP resectoscope was advanced per urethra under direct vision. Bladder and urethra were systematically inspected; bilateral ureteric orifices identified.",
      "A 100 W (or 120 W) Holmium:YAG laser via a 550 µm end-firing fibre was used at [2.0 J × 50 Hz] for enucleation and [0.5 J × 30 Hz long-pulse] for hemostasis.",
      "The median lobe was enucleated first (when present): the verumontanum was identified as the distal landmark and a midline incision was carried from the verumontanum to the bladder neck through the surgical capsule. The median lobe was bluntly developed off the capsule and advanced into the bladder.",
      "Lateral lobe enucleation: the right (or left) lateral lobe was developed by extending the incision laterally along the surgical capsule plane; the lobe was bluntly dissected off the capsule, mobilising it medially toward the bladder neck, and advanced into the bladder. The contralateral lobe was treated identically.",
      "Hemostasis was secured at the prostatic fossa using long-pulse settings; pinpoint bleeders coagulated focally.",
      "The resectoscope was exchanged for a Piranha (Wolf) morcellator. The morcellator was advanced into the bladder and used to evacuate the enucleated lobes piecemeal under continuous bladder distention with saline irrigation. All tissue was evacuated and weighed.",
      "Final cystoscopy confirmed no residual lobe tissue, intact ureteric orifices, and adequate hemostasis at the prostatic fossa.",
      "A 22 Fr 3-way Foley catheter was placed; CBI initiated at moderate flow.",
    ],
  },
  devices: {
    instruments: [
      "26 Fr Storz HoLEP resectoscope",
      "100 W or 120 W Holmium:YAG laser, 550 µm end-firing fibre",
      "Piranha (Wolf) tissue morcellator",
      "22 Fr 3-way Foley catheter",
    ],
    consumables: ["Continuous saline irrigation"],
  },
  specimens: {
    default: "Prostate chips (enucleated tissue) for permanent pathology — weight approximately ___ g.",
  },
  tubesAndDrains: {
    default: "22 Fr 3-way Foley with CBI overnight.",
  },
  complicationChecks: [
    { label: "Bladder injury (mucosal or full-thickness during morcellation)" },
    { label: "Stress incontinence (10–20% transient, < 5% persistent)" },
    { label: "Capsular perforation with extravasation" },
    { label: "Hematuria / clot retention" },
    { label: "Bladder neck contracture (long-term)" },
  ],
  postopPlan: {
    disposition: "Admission overnight for CBI.",
    catheter: "Foley with CBI × ~24 h, removed once urine clear; trial of void POD 1.",
    analgesia: "Acetaminophen + NSAID; oxybutynin 5 mg PO q8h for spasm.",
    antibiotics: "Single perioperative dose; no routine post-discharge antibiotics.",
    activity: "Light activity × 4 weeks; no heavy lifting.",
    followup: [
      "Pathology review at 7–10 days (incidental prostate cancer 5–10%)",
      "Clinic at 4 weeks: uroflow + post-void residual",
      "Pelvic floor exercises for stress incontinence (most resolve by 3 months)",
      "Counsel re: retrograde ejaculation (~80%)",
    ],
    returnPrecautions: [
      "Heavy persistent hematuria or clot retention",
      "Inability to void after Foley removal",
      "Fevers > 38.5°C",
    ],
  },
  requiredFields: [
    { id: "prostate_volume_g", label: "Prostate volume (g)", type: "number" },
    { id: "indication", label: "Indication", type: "enum", options: ["LUTS refractory to medical therapy", "Urinary retention", "Recurrent gross hematuria", "Recurrent UTI", "Bladder stones secondary to BOO"] },
    { id: "lobar_anatomy", label: "Lobar anatomy", type: "enum", options: ["Bilateral lateral lobes", "Bilateral lateral + median lobe", "Predominantly median lobe"] },
    { id: "morcellation_complete", label: "Morcellation completed", type: "boolean" },
    { id: "tissue_weight_g", label: "Tissue weight (g)", type: "number" },
    { id: "catheter_size_fr", label: "Catheter size (Fr)", type: "enum", options: ["20", "22", "24"] },
    { id: "balloon_volume_ml", label: "Balloon volume (mL)", type: "number" },
    { id: "cbi", label: "CBI", type: "boolean" },
  ],
  billingPrompts: [
    "Document prostate volume and tissue weight enucleated.",
    "Confirm morcellation was completed.",
  ],
};

// ---------------------------------------------------------------------------
// PCNL
// ---------------------------------------------------------------------------

export const PCNL: ProcedureTemplate = {
  key: "urology.endourology.pcnl",
  specialty: "urology",
  subcategory: "endourology",
  procedureName: "Percutaneous nephrolithotomy (PCNL)",
  synonyms: ["pcnl", "percutaneous nephrolithotomy", "mini-perc"],
  matchPatterns: [/\bpcnl\b|\bpercutaneous\s+nephrolithotomy\b/i],
  topMatter: {
    anesthesia: "General endotracheal anesthesia.",
    position: "Initial dorsal lithotomy for cystoscopy + retrograde catheter placement, then prone (or supine PCNL per surgeon preference) with all pressure points carefully padded.",
    prep: "Flank prepped from below the costal margin to the iliac crest.",
    ebl: "Variable — 50 to 500 mL depending on stone burden and tract size.",
    disposition: "Admission for tubeless / nephrostomy management; typical LOS 1–3 days.",
  },
  findings: {
    headline: "[Right / Left] [staghorn / large pelvic / multiple calyceal] calculus, total stone burden approximately ___ mm. Pelvicalyceal anatomy on retrograde pyelogram: [normal / dilated / complex].",
    supporting: [
      "Access into [posterior upper-pole / inter-polar / lower-pole] calyx achieved on first pass under fluoroscopic / ultrasound guidance.",
      "Tract: [single 24/30 Fr Amplatz / mini-perc 16-22 Fr / micro-perc].",
      "Stone clearance: [complete / near-complete with planned second-look / staged].",
      "No collecting-system perforation or vascular injury.",
    ],
  },
  operativeSteps: {
    steps: [
      "Cystoscopy was performed in dorsal lithotomy; a 5/6 Fr open-tip retrograde ureteric catheter was advanced to the renal pelvis on the affected side and secured to the indwelling Foley.",
      "The patient was repositioned prone (or supine PCNL position per surgeon preference) with all pressure points padded.",
      "Retrograde pyelogram via the ureteric catheter outlined the pelvicalyceal anatomy and selected the optimal calyx for percutaneous access — typically posterior, ideally upper- or mid-pole, traversing only Brodel's avascular line.",
      "Renal access was obtained under combined fluoroscopic + ultrasound guidance using an 18-gauge access needle. Successful entry into the target calyx was confirmed by aspiration of urine and contrast injection through the needle.",
      "A 0.038\" stiff (Amplatz) guidewire was advanced through the needle into the renal pelvis (ideally extending down the ureter for maximum security).",
      "The tract was sequentially dilated with [Amplatz dilators to 30 Fr / balloon dilator to 24 Fr] over the wire, and an Amplatz working sheath was placed.",
      "A 24 Fr nephroscope was advanced through the sheath; the stone was visualised and fragmented using [Holmium:YAG laser via 550 µm fibre / pneumatic lithoclast / ultrasonic lithotripter (Cyberwand)]. Fragments were extracted with stone-grasping forceps or evacuated by suction.",
      "Final inspection: complete (or near-complete) stone clearance; renal pelvis and accessible calyces inspected; flexible nephroscopy added to inspect inaccessible calyces with deflection.",
      "[Tubeless variant:] No nephrostomy tube was placed; a JJ stent was passed antegrade and the tract closed at the skin. [Tubed variant:] A 14-22 Fr nephrostomy tube was placed and secured at skin level; capping/clamping per surgeon preference.",
    ],
  },
  devices: {
    instruments: [
      "Cystoscope + 5/6 Fr retrograde ureteric catheter",
      "18-gauge percutaneous access needle",
      "0.038\" stiff Amplatz guidewire (+ safety wire)",
      "Amplatz dilators (or balloon dilator)",
      "Amplatz working sheath",
      "24 Fr (or 16-22 Fr mini-perc) nephroscope",
      "Holmium:YAG laser / pneumatic lithoclast / ultrasonic lithotripter",
      "Stone-grasping forceps + suction-irrigation system",
    ],
    implants: ["6 Fr × [22 / 26] cm double-J ureteric stent (when placed antegrade)", "Nephrostomy tube (when placed)"],
  },
  specimens: { default: "Stone fragments for composition analysis." },
  tubesAndDrains: {
    default: "[Tubeless: JJ stent only / Tubed: 14-22 Fr nephrostomy tube + JJ stent / Totally tubeless: neither — surgeon-specific].",
  },
  complicationChecks: [
    { label: "Bleeding requiring transfusion / angio-embolisation (1–5%)" },
    { label: "Sepsis (CIROC criteria for stone-induced sepsis)" },
    { label: "Pleural / pulmonary injury (especially upper-pole supra-12th rib access)" },
    { label: "Adjacent organ injury (colon, spleen, liver — rare)" },
    { label: "Persistent urine leak from tract" },
  ],
  postopPlan: {
    disposition: "Admission to floor (or step-down for high-risk patients).",
    catheter: "Nephrostomy + Foley; nephrostomy clamping trial POD 1, removed POD 2-3 if antegrade pyelogram clear.",
    analgesia: "PCA opioid in first 24 h; transition to PO acetaminophen + NSAID; tamsulosin for stent symptoms.",
    antibiotics: "IV antibiotics tailored to preop urine culture for 24-48 h; oral course post-discharge as indicated.",
    activity: "Light activity × 4 weeks; no heavy lifting.",
    followup: [
      "Stone composition and metabolic workup (24-h urine + serum)",
      "Stent removal at 1-2 weeks via cystoscopy",
      "KUB at 4 weeks ± low-dose CT to assess residual fragments",
      "Repeat session for residual stones > 4 mm",
    ],
    returnPrecautions: [
      "Heavy persistent hematuria",
      "Fevers / rigors (post-PCNL sepsis)",
      "Worsening flank pain or new chest pain (rule out pleural injury)",
    ],
  },
  requiredFields: [
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "stone_burden_mm", label: "Total stone burden (mm)", type: "number" },
    { id: "access_calyx", label: "Access calyx", type: "enum", options: ["Upper-pole posterior", "Mid-pole posterior", "Lower-pole posterior", "Multiple"] },
    { id: "tract_size_fr", label: "Tract size (Fr)", type: "enum", options: ["16 (mini)", "22 (mini)", "24 (standard)", "30 (standard)"] },
    { id: "lithotripter", label: "Lithotripter used", type: "enum", options: ["Holmium:YAG laser", "Pneumatic lithoclast", "Ultrasonic (Cyberwand)", "Combination"] },
    { id: "stone_clearance", label: "Stone clearance", type: "enum", options: ["Complete", "Near-complete (planned second-look)", "Staged"] },
    { id: "tube_strategy", label: "Tube strategy", type: "enum", options: ["Totally tubeless", "Tubeless (JJ stent only)", "Tubed (nephrostomy + stent)", "Tubed (nephrostomy only)"] },
  ],
  billingPrompts: [
    "Document stone burden, access tract size, and lithotripter modality.",
    "Specify tubeless vs tubed and stent details.",
  ],
};

// Aggregate export
export const ENDOUROLOGY_TEMPLATES: ProcedureTemplate[] = [
  // Order matters: more-specific patterns first.
  URETERIC_STENT_EXCHANGE,
  URETERIC_STENT_REMOVAL,
  URETERIC_STENT_INSERTION,
  PCNL,
  URETEROSCOPY_LASER,
  TURBT,
  HOLEP,
];
