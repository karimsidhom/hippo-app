// ---------------------------------------------------------------------------
// Urology — Oncology + reconstructive procedure templates
// ---------------------------------------------------------------------------

import type { ProcedureTemplate } from "../types";

export const PARTIAL_NEPHRECTOMY: ProcedureTemplate = {
  key: "urology.oncology.partial_nephrectomy",
  specialty: "urology",
  subcategory: "oncology",
  procedureName: "Partial nephrectomy",
  synonyms: ["partial nephrectomy", "nephron-sparing surgery"],
  matchPatterns: [/\bpartial\s+nephrectom|\bnephron[-\s]sparing/i],
  topMatter: {
    anesthesia: "General endotracheal anesthesia with arterial line; epidural for open approach.",
    position: "Modified flank (open / minimally invasive lateral) with ipsilateral side up; all pressure points padded.",
    prep: "Abdomen prepped from xiphoid to mid-thigh including the ipsilateral flank.",
    ebl: "100–500 mL depending on tumor complexity (RENAL nephrometry score).",
    disposition: "Admission to surgical floor; LOS 1–3 days for minimally invasive, 3–5 days open.",
  },
  findings: {
    headline: "[Right / Left] [polar / mid] cortical mass measuring approximately ___ cm, RENAL nephrometry score ___ (___). Mass [exophytic / endophytic with sinus involvement]. Clear plane between mass and remaining parenchyma identified.",
    supporting: [
      "Hilar anatomy: single renal artery and vein (or accessory vessels documented).",
      "Collecting system entry: [no entry / entered and repaired with two-layer 4-0 Monocryl on the urothelium + 3-0 Vicryl on the renorrhaphy].",
      "Margin: macroscopically clear; intraoperative frozen section [negative / not performed].",
    ],
  },
  operativeSteps: {
    steps: [
      "Access obtained via [open flank / 5-port robotic da Vinci Xi / laparoscopic transperitoneal] approach. Pneumoperitoneum at 15 mmHg for minimally invasive cases.",
      "Colon mobilised along the white line of Toldt; the kidney was exposed within Gerota's fascia, preserving the perirenal fat overlying the tumor.",
      "Hilum dissected: renal artery (and vein) skeletonised and encircled with vessel loops. Bulldog clamps placed for warm ischemia (clamp time tracked, target < 25 min for full warm ischemia; off-clamp for selected exophytic lesions).",
      "Tumor demarcated using intraoperative ultrasound; resection bed marked with electrocautery 5–10 mm from the visible edge.",
      "Tumor excised sharply with cold scissors along the demarcation line, maintaining a thin rim of normal parenchyma. Specimen delivered to pathology.",
      "Collecting system entry (when present) was closed with running 4-0 Monocryl in a watertight fashion.",
      "Renorrhaphy: deep medullary closure with 3-0 V-Loc barbed suture in interrupted figure-of-eight; cortical closure with 0 V-Loc running and Hem-o-lok clip-cinched suture (sliding-clip renorrhaphy) over Surgicel + FloSeal in the resection bed.",
      "Bulldog clamps removed; clamp time documented. Hemostasis confirmed with brief reduction of insufflation pressure (or direct visualisation in open).",
      "[Drain placed for collecting-system entry, large defects, or surgeon preference.]",
    ],
    closure: "Specimen extracted via Endo Catch bag through extended port site or Pfannenstiel. Ports / fascial layers closed in standard fashion.",
  },
  devices: {
    instruments: [
      "DaVinci Xi (robotic) or laparoscopic instruments / open vascular tray",
      "Bulldog vessel clamps",
      "Intraoperative ultrasound probe",
      "Cold scissors (Potts) for tumor excision",
    ],
    implants: ["Hem-o-lok clips for sliding-clip renorrhaphy"],
    consumables: ["3-0 / 4-0 V-Loc barbed sutures", "4-0 Monocryl for collecting system", "Surgicel + FloSeal hemostatic agents"],
  },
  specimens: {
    default: "Renal mass with surrounding rim of parenchyma — orient for pathology with marked margin / hilar surface.",
  },
  tubesAndDrains: {
    default: "Foley catheter intraoperatively. Closed-suction drain (Blake) placed when collecting system entered or oozing bed; otherwise no drain.",
  },
  complicationChecks: [
    { label: "Bleeding requiring transfusion / IR embolisation" },
    { label: "Urine leak (collecting system entry not adequately closed)" },
    { label: "Pseudoaneurysm (presents POD 5–14 with delayed bleeding)" },
    { label: "Acute kidney injury (warm ischemia time > 25 min increases risk)" },
    { label: "Conversion to radical nephrectomy" },
  ],
  postopPlan: {
    disposition: "Surgical floor; ICU only for hemodynamic instability.",
    catheter: "Foley × 24–48 h. Drain removed POD 1–2 if dry / non-creatinine-rich; sooner for dry beds.",
    analgesia: "Multimodal: epidural (open) or TAP block (MIS) + acetaminophen + NSAID + opioid sparingly.",
    antibiotics: "Single perioperative dose; no continuation unless drain in place > 48 h.",
    activity: "No heavy lifting × 6 weeks; gradual return to baseline.",
    followup: [
      "Pathology + final stage at 7–10 days",
      "Cr at 1 week and 1 month (post-op nephron-loss baseline)",
      "Cross-sectional imaging at 3, 6, 12 months then per AUA renal cancer surveillance guideline",
      "Genetic testing if young, multifocal, bilateral, or family history (VHL, HLRCC, BHD)",
    ],
    returnPrecautions: [
      "Bright-red gross hematuria with clots (delayed pseudoaneurysm bleed)",
      "New-onset flank pain or fevers",
      "Wound concerns",
    ],
  },
  requiredFields: [
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "approach", label: "Approach", type: "enum", options: ["Open", "Laparoscopic", "Robotic"] },
    { id: "tumor_location", label: "Tumor location", type: "enum", options: ["Upper pole", "Mid", "Lower pole", "Hilar", "Endophytic"] },
    { id: "tumor_size_cm", label: "Tumor size (cm)", type: "number" },
    { id: "renal_score", label: "RENAL nephrometry score", type: "text" },
    { id: "ischemia_type", label: "Ischemia type", type: "enum", options: ["Warm", "Cold", "Off-clamp"] },
    { id: "clamp_time_min", label: "Clamp time (min)", type: "number" },
    { id: "collecting_system_entry", label: "Collecting system entered", type: "boolean" },
    { id: "drain_placed", label: "Drain placed", type: "boolean" },
  ],
  billingPrompts: [
    "Document approach (different fee codes for open / lap / robotic).",
    "Document warm vs cold ischemia and clamp time.",
    "Document collecting system entry and renorrhaphy details.",
  ],
};

export const RADICAL_NEPHRECTOMY: ProcedureTemplate = {
  key: "urology.oncology.radical_nephrectomy",
  specialty: "urology",
  subcategory: "oncology",
  procedureName: "Radical nephrectomy",
  synonyms: ["radical nephrectomy", "total nephrectomy"],
  matchPatterns: [/\bradical\s+nephrectom|\btotal\s+nephrectom/i],
  topMatter: {
    anesthesia: "General endotracheal anesthesia + arterial line + central access for IVC tumor thrombus cases.",
    position: "Modified flank or supine for retroperitoneal / transabdominal approach.",
    prep: "From nipples to mid-thigh.",
    ebl: "200–800 mL; higher for large tumors or IVC thrombus (then 1000+ mL with cell-saver setup).",
    disposition: "Surgical floor or step-down; LOS 2–4 days minimally invasive, 4–7 days open.",
  },
  findings: {
    headline: "[Right / Left] renal mass approximately ___ cm, [no / segmental / IVC] vein involvement (Mayo level ___ if present). Adrenal gland: [preserved / removed for tumor proximity].",
    supporting: [
      "Hilar anatomy: artery first ligated, then vein (avoids splanchnic congestion); regional lymph nodes inspected — [normal / enlarged].",
      "Specimen integrity: Gerota's fascia intact; oncologic envelope preserved.",
    ],
  },
  operativeSteps: {
    steps: [
      "Access via [robotic da Vinci Xi 5-port / laparoscopic transperitoneal / open flank or thoracoabdominal].",
      "Colon reflected medially along the white line of Toldt to expose the kidney within Gerota's fascia.",
      "Renal hilum dissected: renal artery skeletonised, doubly clipped, divided. Renal vein skeletonised, stapled with vascular load Endo GIA (or tied with 0 silk and divided in open).",
      "Ureter identified, dissected toward the bladder, clipped, and divided at the level of the iliac crossing.",
      "Adrenal gland: preserved when tumor is mid/lower pole and adrenal anatomy intact; removed en bloc with the kidney when upper-pole tumor or anatomic distortion (radical nephrectomy with adrenalectomy).",
      "Specimen mobilised entirely within Gerota's fascia and placed in Endo Catch bag (MIS) or delivered through the open incision.",
      "Lymph node sampling/dissection from the renal hilum if grossly enlarged or per oncologic protocol.",
      "Hemostasis confirmed; bed inspected; pneumoperitoneum reduced for venous-bleed check.",
    ],
  },
  devices: {
    instruments: ["DaVinci Xi or open vascular tray", "Endo GIA vascular load (white)", "Hem-o-lok clips", "Endo Catch bag (large)"],
  },
  specimens: { default: "Kidney within Gerota's fascia ± adrenal gland ± lymph nodes — oriented for pathology." },
  tubesAndDrains: { default: "Foley intraoperatively. No routine drain." },
  complicationChecks: [
    { label: "Bleeding requiring transfusion" },
    { label: "Adjacent organ injury (bowel, spleen on left, duodenum on right)" },
    { label: "Pneumothorax for upper-pole / thoracoabdominal access" },
    { label: "Postop AKI (especially for solitary kidney)" },
  ],
  postopPlan: {
    disposition: "Surgical floor.",
    catheter: "Foley × 24–48 h.",
    analgesia: "Multimodal; epidural for open.",
    antibiotics: "Single perioperative dose.",
    activity: "No heavy lifting × 6 weeks.",
    followup: [
      "Pathology + final stage at 7–10 days",
      "Surveillance per AUA renal cancer guideline (cross-sectional imaging q6mo × 2 y, then annually)",
      "Cr trend at 1 week and 1 month",
    ],
  },
  requiredFields: [
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "approach", label: "Approach", type: "enum", options: ["Open", "Laparoscopic", "Robotic"] },
    { id: "tumor_size_cm", label: "Tumor size (cm)", type: "number" },
    { id: "ivc_thrombus", label: "IVC tumor thrombus", type: "enum", options: ["None", "Mayo I (renal vein)", "Mayo II (infrahepatic)", "Mayo III (intrahepatic)", "Mayo IV (atrial)"] },
    { id: "adrenal_removed", label: "Adrenal removed", type: "boolean" },
    { id: "lymphadenectomy", label: "Lymph node dissection", type: "boolean" },
  ],
};

export const RADICAL_PROSTATECTOMY: ProcedureTemplate = {
  key: "urology.oncology.radical_prostatectomy",
  specialty: "urology",
  subcategory: "oncology",
  procedureName: "Robotic radical prostatectomy",
  synonyms: ["radical prostatectomy", "rrp", "rarp", "lrp", "ralp"],
  matchPatterns: [/\bradical\s+prostatectom|\b(rrp|rarp|lrp|ralp)\b/i],
  topMatter: {
    anesthesia: "General endotracheal anesthesia + arterial line.",
    position: "Steep Trendelenburg in low lithotomy.",
    prep: "Lower abdomen + perineum.",
    ebl: "100–400 mL.",
    disposition: "Surgical floor; LOS typically 1 day for robotic.",
  },
  findings: {
    headline: "Prostate gland approximately ___ g; [unilateral / bilateral] nerve-sparing achieved on the side(s) without adverse pathology. Pelvic lymph nodes: [normal / sampled with extended PLND].",
    supporting: [
      "Bladder neck: [preserved / reconstructed with anterior tennis-racket closure].",
      "Apical dissection: short urethral stump; vesicourethral anastomosis tension-free with Rocco posterior reconstruction.",
      "Frozen section margins: [negative / positive at right posterolateral apex — wider re-resection performed].",
    ],
  },
  operativeSteps: {
    steps: [
      "DaVinci Xi 6-port placement (12 mm camera + 3× 8 mm robotic arms + 12 mm + 5 mm assistant). Steep Trendelenburg.",
      "Anterior bladder neck developed; the bladder dropped from the anterior abdominal wall.",
      "Endopelvic fascia incised bilaterally; dorsal venous complex (DVC) was suture-ligated with 0 V-Loc and divided.",
      "Anterior bladder neck identified and incised, exposing the prostatic urethra and Foley balloon. Posterior bladder neck developed.",
      "Vasa deferentia identified, clipped, and divided. Seminal vesicles dissected and removed en bloc with the prostate (athermal technique near the neurovascular bundles).",
      "Denonvilliers' fascia incised and the posterior prostate dissected off the rectum in the avascular plane.",
      "Lateral prostatic pedicles taken with Hem-o-lok clips and athermal scissors (preserves NVBs for nerve-sparing patients).",
      "Apex transected sharply; urethra divided, leaving short urethral stump.",
      "Specimen placed in Endo Catch bag.",
      "Vesicourethral anastomosis: posterior reconstruction (Rocco stitch) with 3-0 V-Loc; 6 + 6 anastomotic running 3-0 V-Loc; 22 Fr Foley placed and balloon inflated to 15 mL.",
      "Pelvic lymph node dissection (extended template per NCCN risk criteria) — obturator + external iliac + internal iliac packets.",
    ],
  },
  devices: {
    instruments: ["DaVinci Xi system", "AirSeal insufflation system", "Endo GIA stapler"],
    implants: ["Hem-o-lok clips × multiple", "22 Fr Foley catheter"],
    consumables: ["3-0 V-Loc × 2 (anastomosis)", "0 V-Loc (DVC)"],
  },
  specimens: { default: "Prostate + bilateral seminal vesicles ± pelvic lymph node packets, oriented for pathology." },
  tubesAndDrains: { default: "22 Fr Foley × 7–10 days. JP drain placed if extensive PLND or anastomotic concern." },
  complicationChecks: [
    { label: "Anastomotic leak / urinoma" },
    { label: "Lymphocele (3–6% with PLND)" },
    { label: "Rectal injury (rare, ~1%)" },
    { label: "Postoperative incontinence (transient 60–80%, persistent ~5%)" },
    { label: "Erectile dysfunction (varies with nerve sparing + age)" },
  ],
  postopPlan: {
    disposition: "Surgical floor; discharge POD 1.",
    catheter: "Foley × 7–10 days; cystogram on POD 7 prior to removal.",
    analgesia: "Multimodal: TAP block + acetaminophen + NSAID; opioid sparingly.",
    antibiotics: "Single perioperative dose.",
    activity: "Pelvic floor exercises start POD 1–2; no heavy lifting × 4 weeks.",
    followup: [
      "Pathology + Decipher / Gleason re-grade at 7–10 days",
      "PSA at 6 weeks, then q3mo × 2 y, q6mo × 3 y, then annually",
      "Continence assessment at 3, 6, 12 months",
      "ED management discussion at 6 weeks",
    ],
    returnPrecautions: ["Heavy hematuria", "Inability to void after Foley removal", "Fevers / wound concerns"],
  },
  requiredFields: [
    { id: "approach", label: "Approach", type: "enum", options: ["Open retropubic", "Laparoscopic", "Robotic"] },
    { id: "nerve_sparing", label: "Nerve sparing", type: "enum", options: ["None", "Unilateral", "Bilateral"] },
    { id: "pelvic_lnd", label: "Pelvic lymph node dissection", type: "enum", options: ["None", "Limited", "Extended"] },
    { id: "frozen_margins", label: "Frozen-section margins", type: "enum", options: ["Negative", "Positive — re-resected", "Not done"] },
    { id: "prostate_weight_g", label: "Specimen prostate weight (g)", type: "number" },
  ],
};

export const RADICAL_CYSTECTOMY: ProcedureTemplate = {
  key: "urology.oncology.radical_cystectomy",
  specialty: "urology",
  subcategory: "oncology",
  procedureName: "Radical cystectomy with urinary diversion",
  synonyms: ["radical cystectomy", "cystoprostatectomy", "anterior pelvic exenteration"],
  matchPatterns: [/\bradical\s+cystectom|\bcystoprostatectom|\banterior\s+pelvic\s+exenteration/i],
  topMatter: {
    anesthesia: "General endotracheal anesthesia + arterial line + central access.",
    position: "Supine; reverse Trendelenburg.",
    prep: "From nipples to mid-thigh including perineum.",
    ebl: "300–1500 mL.",
    disposition: "Surgical floor / step-down; LOS 5–10 days.",
  },
  findings: {
    headline: "Bladder mass clinically T2–T4; cystectomy with [bilateral standard / extended pelvic] lymphadenectomy. Diversion: [ileal conduit / orthotopic neobladder / cutaneous ureterostomy].",
    supporting: [
      "Frozen-section ureteric margins: [bilateral negative / positive on right — re-resected to negative].",
      "[For ileal conduit:] 15-cm ileal segment isolated 15 cm proximal to the ileocecal valve; bowel continuity restored with side-to-side stapled jejuno-jejunostomy.",
      "Stoma matured at right lower quadrant per preoperative marking.",
    ],
  },
  operativeSteps: {
    steps: [
      "Access via lower midline incision (or 6-port robotic da Vinci Xi).",
      "Pelvic lymphadenectomy (extended template: obturator + external iliac + internal iliac + presacral) before cystectomy for staging.",
      "Ureters identified, mobilised, and divided at the iliac crossing; distal margins sent for frozen section.",
      "Bladder pedicles (lateral, posterior) taken with vessel-sealing energy and Hem-o-lok clips.",
      "Anterior bladder dissection in the retropubic space; dorsal venous complex ligated.",
      "Apical urethral dissection: urethra divided sharply (preserved for orthotopic neobladder candidates; transected at the proximal margin for ileal conduit / non-continent diversion).",
      "Specimen delivered.",
      "Diversion construction: [Ileal conduit — 15 cm ileal segment isolated, ureteroileal anastomoses (Bricker or Wallace), distal end matured as end stoma at preoperatively marked RLQ site / Orthotopic neobladder — Studer or T-pouch — 60-cm ileal segment detubularised, neobladder constructed, ureteroileal and urethroileal anastomoses / Cutaneous ureterostomy when bowel diversion contraindicated].",
      "Bowel continuity restored with side-to-side stapled jejuno-jejunostomy.",
    ],
  },
  devices: {
    instruments: ["DaVinci Xi or open vascular tray", "GIA staplers", "Bookwalter retractor (open)"],
    implants: ["Ureteric stents (single or double-J) bilaterally to protect uretero-ileal anastomoses × 7–14 days"],
  },
  specimens: { default: "Bladder + prostate (in males) ± uterus + adnexa (in females, anterior pelvic exenteration); pelvic lymph node packets; bilateral ureteric margins for frozen." },
  tubesAndDrains: { default: "16 Fr NG; pelvic JP drain × 5–7 days; bilateral ureteric stents in conduit / neobladder; Foley in neobladder × 21 days; SPC for ileal conduit not needed (stoma drains)." },
  complicationChecks: [
    { label: "Anastomotic leak (ureteroenteric or enteroenteric)" },
    { label: "Stomal complications (necrosis, retraction, parastomal hernia)" },
    { label: "Postoperative ileus / SBO" },
    { label: "Pulmonary embolism (high-risk cohort)" },
    { label: "Wound dehiscence / infection" },
  ],
  postopPlan: {
    disposition: "Floor / step-down × 24–48 h then floor.",
    catheter: "Pelvic JP × 5–7 d; ureteric stents × 7–14 d (removed in clinic); neobladder Foley × 21 d.",
    analgesia: "Epidural × 48–72 h; transition to multimodal oral.",
    antibiotics: "Single perioperative dose; extended only for established infection.",
    activity: "Early mobilisation POD 1; gum chewing for ileus prevention.",
    diet: "NPO until flatus / GI tolerance; advance per ERAS-cystectomy pathway.",
    followup: [
      "Pathology + final stage at 7–10 days; adjuvant chemo discussion if pT3+ or N+",
      "Stoma nurse education (for ileal conduit) — daily during admission",
      "Cross-sectional imaging at 3, 6, 12 months, then per AUA/EAU surveillance for muscle-invasive disease",
      "Vitamin B12 + electrolyte monitoring (ileal segment effects) — annual labs",
    ],
    returnPrecautions: [
      "Worsening abdominal pain, fevers (anastomotic leak / sepsis)",
      "Stomal necrosis / retraction",
      "Reduced urine output despite hydration",
    ],
  },
  requiredFields: [
    { id: "approach", label: "Approach", type: "enum", options: ["Open", "Robotic"] },
    { id: "lnd", label: "Lymphadenectomy template", type: "enum", options: ["Standard", "Extended", "Super-extended"] },
    { id: "diversion", label: "Diversion", type: "enum", options: ["Ileal conduit (Bricker)", "Ileal conduit (Wallace)", "Orthotopic neobladder (Studer)", "Orthotopic neobladder (T-pouch)", "Continent cutaneous (Indiana pouch)", "Cutaneous ureterostomy"] },
    { id: "frozen_ureteric_margin", label: "Frozen ureteric margin status", type: "enum", options: ["Bilateral negative", "Re-resected to negative", "Final positive"] },
  ],
};

export const PYELOPLASTY: ProcedureTemplate = {
  key: "urology.reconstructive.pyeloplasty",
  specialty: "urology",
  subcategory: "reconstructive",
  procedureName: "Pyeloplasty (Anderson-Hynes dismembered)",
  synonyms: ["pyeloplasty", "anderson-hynes"],
  matchPatterns: [/\bpyeloplast/i],
  topMatter: {
    anesthesia: "General endotracheal anesthesia.",
    position: "Modified flank with operative side up.",
    prep: "Abdomen and ipsilateral flank.",
    ebl: "Minimal.",
    disposition: "Surgical floor; LOS 1–2 days minimally invasive, 3–4 days open.",
  },
  findings: {
    headline: "[Right / Left] UPJ obstruction confirmed; intrinsic narrowing [with / without] crossing lower-pole vessel. Renal pelvis dilated; ureter normal caliber distal to UPJ.",
  },
  operativeSteps: {
    steps: [
      "Access via [robotic da Vinci Xi 4-port / laparoscopic transperitoneal / open flank].",
      "Colon reflected; ureter identified and traced cephalad to the renal pelvis.",
      "Crossing lower-pole vessel (when present) was preserved and transposed posterior to the new anastomosis.",
      "Redundant renal pelvis was incised obliquely; the proximal ureter was transected at the level of the UPJ.",
      "Ureter was spatulated laterally for ~1.5 cm.",
      "Anderson-Hynes dismembered anastomosis: posterior wall completed first with 4-0 V-Loc / 4-0 Vicryl running, then anterior wall, over a [6 Fr × 22 cm] indwelling double-J stent placed antegrade.",
      "[Crossing-vessel variant: vessel transposed posterior to the anastomosis (Hellström maneuver) prior to anterior closure.]",
      "Hemostasis confirmed. Drain placed in selected cases.",
    ],
  },
  devices: {
    instruments: ["DaVinci Xi or open vascular tray", "Cystoscope for distal stent confirmation"],
    implants: ["6 Fr × [22 / 26] cm double-J stent × 4–6 weeks"],
    consumables: ["4-0 V-Loc or 4-0 Vicryl for anastomosis"],
  },
  specimens: { default: "Excised UPJ segment for permanent pathology." },
  tubesAndDrains: { default: "Double-J stent indwelling; Foley × 24 h; perinephric drain optional." },
  complicationChecks: [
    { label: "Urine leak from anastomosis" },
    { label: "Stent migration / encrustation" },
    { label: "Recurrent obstruction (~5–10%)" },
  ],
  postopPlan: {
    disposition: "Floor.",
    catheter: "Foley × 24 h; stent × 4–6 weeks; clinic cystoscopic removal.",
    followup: [
      "MAG3 diuretic renogram at 3 months — T1/2 < 10 min indicates successful drainage",
      "Renal US at 6–12 months",
    ],
  },
  requiredFields: [
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "approach", label: "Approach", type: "enum", options: ["Open", "Laparoscopic", "Robotic"] },
    { id: "crossing_vessel", label: "Crossing vessel", type: "boolean" },
    { id: "stent_size_fr", label: "Stent size (Fr)", type: "enum", options: ["6", "7"] },
    { id: "stent_length_cm", label: "Stent length (cm)", type: "enum", options: ["22", "26"] },
    { id: "drain_placed", label: "Drain placed", type: "boolean" },
  ],
};

// Aggregate
export const ONCOLOGY_TEMPLATES: ProcedureTemplate[] = [
  PARTIAL_NEPHRECTOMY,
  RADICAL_NEPHRECTOMY,
  RADICAL_PROSTATECTOMY,
  RADICAL_CYSTECTOMY,
  PYELOPLASTY,
];
