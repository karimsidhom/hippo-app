// ---------------------------------------------------------------------------
// General Surgery — procedure-specific dictation templates
// Procedures covered: cholecystectomy, appendectomy, inguinal hernia repair,
// ventral hernia repair, right hemicolectomy, sleeve gastrectomy.
// All templates produce attending-quality, procedure-specific dictations
// with named instruments, suture sizes, and named techniques (e.g. CVS).
// ---------------------------------------------------------------------------

import type { ProcedureTemplate } from "./types";

const g = (
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
): ProcedureTemplate => ({ specialty: "general-surgery", ...partial });

export const LAP_CHOLECYSTECTOMY = g({
  key: "general-surgery.hpb.lap_cholecystectomy",
  subcategory: "hpb",
  procedureName: "Laparoscopic cholecystectomy",
  synonyms: ["cholecystectomy", "lap chole"],
  matchPatterns: [/\bcholecystectom|\blap\s+chole/i],
  topMatter: {
    anesthesia: "General endotracheal anesthesia.",
    position: "Supine; arms tucked; reverse Trendelenburg with left tilt for exposure.",
    prep: "Abdomen prepped with chlorhexidine from nipples to mid-thigh; sterile drape.",
    ebl: "Minimal — under 50 mL.",
    disposition: "Discharge home same-day if uncomplicated.",
  },
  findings: {
    headline: "Gallbladder [chronically thickened / acutely inflamed with omental adhesions / hydropic and tense / contracted]; cystic duct and cystic artery clearly identified within the hepatocystic triangle. Critical View of Safety (Strasberg) achieved with only two structures entering the gallbladder, lower third separated from the liver bed.",
    supporting: [
      "Common bile duct and common hepatic duct identified and protected.",
      "Liver bed: [normal / fibrotic from chronic disease / no bile leak after gallbladder removal].",
      "[Intraoperative cholangiogram performed / not indicated]: [normal biliary anatomy with contrast flow into the duodenum / no choledocholithiasis identified].",
    ],
  },
  operativeSteps: {
    steps: [
      "Veress needle entry at the umbilicus (or Hasson cut-down for prior surgery); pneumoperitoneum to 15 mmHg confirmed by saline-drop test.",
      "Four ports placed under direct vision: 12 mm subxiphoid (operative), 10 mm umbilical (camera), 5 mm right mid-clavicular (assistant retraction), 5 mm right anterior axillary (gallbladder fundus retractor).",
      "Gallbladder fundus grasped and retracted cephalad over the dome of the liver. Infundibulum grasped and retracted laterally to open the hepatocystic triangle.",
      "Peritoneum overlying the hepatocystic triangle dissected sharply on both anterior and posterior surfaces, clearing all fibrofatty tissue off the gallbladder-cystic duct junction.",
      "Critical View of Safety (Strasberg) confirmed: only two structures (cystic duct + cystic artery) entering the gallbladder; lower third of the gallbladder separated from the liver bed; hepatocystic triangle cleared.",
      "Cystic artery doubly clipped proximally and distally with 5 mm Hem-o-lok or absorbable LigaMax clips and divided sharply.",
      "Cystic duct doubly clipped proximally (toward CBD) and singly clipped distally (toward gallbladder), then divided sharply.",
      "[Intraoperative cholangiogram performed via cholangiocatheter through the cystic duct stump — confirmed normal biliary anatomy and no choledocholithiasis prior to division.]",
      "Gallbladder taken down from the liver bed using monopolar hook electrocautery in the avascular plane between gallbladder serosa and liver capsule. Liver bed inspected for hemostasis and any bile leak.",
      "Specimen placed in an Endo Catch retrieval bag and removed through the umbilical or subxiphoid port (port site extended as needed for stones).",
    ],
    closure: "Pneumoperitoneum released; ports removed under direct vision. 10/12 mm fascial defects closed with 0 Vicryl figure-of-eight using Carter-Thomason. Skin closed with 4-0 Monocryl subcuticular running suture. Sterile dressings applied.",
  },
  devices: {
    instruments: [
      "Veress needle / Hasson trocar at umbilicus",
      "10 mm 30° laparoscope (Karl Storz / Olympus)",
      "5 mm Maryland dissector + 5 mm Cad-2 grasper",
      "Monopolar hook electrocautery (or Harmonic scalpel)",
      "Endo Catch specimen retrieval bag",
    ],
    consumables: ["5 mm Hem-o-lok / Endo Clip ML clips × 6", "0.25% bupivacaine for port-site infiltration", "0 Vicryl + 4-0 Monocryl"],
  },
  specimens: { default: "Gallbladder with cystic duct and cystic artery stumps to permanent pathology." },
  tubesAndDrains: { default: "None routinely. JP drain placed only for difficult dissection / bile leak concern." },
  complicationChecks: [
    { label: "Bile duct injury (Strasberg classification A-E)" },
    { label: "Bile leak (cystic duct stump or duct of Luschka)" },
    { label: "Bleeding from cystic artery / liver bed" },
    { label: "Conversion to open" },
    { label: "Subhepatic abscess (delayed)" },
  ],
  postopPlan: {
    disposition: "Recovery → discharge home same-day for uncomplicated cases.",
    analgesia: "Acetaminophen + NSAID; opioid sparingly.",
    antibiotics: "Single perioperative dose only; no continuation.",
    activity: "Resume normal activities as tolerated; no heavy lifting > 10 lbs × 2 weeks.",
    diet: "Resume regular diet immediately; some patients prefer low-fat for first 2-3 weeks.",
    followup: ["Clinic at 2-4 weeks for wound check + pathology review"],
    returnPrecautions: ["Worsening abdominal pain / right upper quadrant pain", "Fevers > 38.5°C", "Jaundice or scleral icterus (rule out missed bile duct injury)", "Persistent nausea and vomiting"],
  },
  requiredFields: [
    { id: "indication", label: "Indication", type: "enum", options: ["Symptomatic cholelithiasis", "Acute cholecystitis", "Choledocholithiasis (pre-/post-ERCP)", "Gallbladder polyp", "Biliary dyskinesia", "Acalculous cholecystitis"] },
    { id: "intraop_cholangiogram", label: "Intraoperative cholangiogram performed", type: "boolean" },
    { id: "conversion", label: "Converted to open", type: "boolean" },
    { id: "drain_placed", label: "Drain placed", type: "boolean" },
  ],
  billingPrompts: [
    "Document Critical View of Safety achieved.",
    "Document if intraoperative cholangiogram was performed.",
    "Convert to open changes the fee code.",
  ],
});

export const LAP_APPENDECTOMY = g({
  key: "general-surgery.acute-care.lap_appendectomy",
  subcategory: "acute-care",
  procedureName: "Laparoscopic appendectomy",
  synonyms: ["appendectomy", "lap appy", "appy"],
  matchPatterns: [/\bappendectom|\blap\s+appy/i],
  topMatter: {
    anesthesia: "General endotracheal anesthesia.",
    position: "Supine, arms tucked; left tilt + Trendelenburg for exposure.",
    prep: "Abdomen prepped from xiphoid to pubis with chlorhexidine.",
    ebl: "Minimal.",
    disposition: "Discharge home same-day for uncomplicated; admit overnight if perforation/abscess.",
  },
  findings: {
    headline: "Appendix [acutely inflamed with surface fibrin / gangrenous with focal perforation / chronically inflamed / phlegmonous with periappendiceal inflammation], length approximately ___ cm. Cecal base healthy; mesoappendix not chronically thickened.",
    supporting: [
      "Adjacent terminal ileum, cecum, and right ovary (if female) inspected and normal.",
      "[For perforation: localised purulent collection of ___ mL evacuated and irrigated; abscess cavity entered.]",
    ],
  },
  operativeSteps: {
    steps: [
      "Pneumoperitoneum established to 15 mmHg via Hasson cut-down at the umbilicus.",
      "Three ports placed: 12 mm umbilical (camera), 5 mm suprapubic (operative), 5 mm left lower quadrant (assistant). Some surgeons use a single-incision SILS approach.",
      "Steep Trendelenburg with left tilt to expose the right lower quadrant. Bowel and omentum reflected away.",
      "Appendix identified at the cecal base; mesoappendix divided with LigaSure (or Harmonic) energy device, working from tip to base.",
      "Appendiceal base skeletonised; window created at the appendix-cecal junction.",
      "Endo GIA stapler with vascular load (white) or tan reload fired across the base of the appendix; staple line inspected for hemostasis.",
      "[For inflamed/friable cecal base: stapler line placed slightly lateral on healthy cecum to ensure secure closure.]",
      "Appendix placed in Endo Catch retrieval bag and removed through the 12 mm umbilical port to avoid wound contamination.",
      "Right lower quadrant irrigated; suction-aspirated until clear.",
    ],
    closure: "Pneumoperitoneum released. 12 mm fascia closed with 0 Vicryl figure-of-eight; 5 mm port sites closed at skin only with 4-0 Monocryl subcuticular.",
  },
  devices: {
    instruments: ["Hasson trocar at umbilicus", "5 mm LigaSure / Harmonic scalpel", "Endo GIA stapler with white (vascular) load + tan reload", "Endo Catch retrieval bag", "10 mm 30° laparoscope"],
  },
  specimens: { default: "Appendix to permanent pathology — note any perforation, gangrene, or unexpected mass." },
  tubesAndDrains: {
    default: "None routinely.",
    alternates: [{ when: /perforat|abscess/i, text: "Closed-suction drain placed in the right lower quadrant for established abscess; removed in 3-5 days when output < 30 mL/day." }],
  },
  complicationChecks: [
    { label: "Stump leak / cecal staple line failure" },
    { label: "Ileus / SBO" },
    { label: "Surgical site infection (port-site or pelvic abscess)" },
    { label: "Stump appendicitis (rare; missed appendiceal tissue)" },
  ],
  postopPlan: {
    disposition: "Same-day discharge for uncomplicated; overnight admit for perforation/abscess.",
    analgesia: "Acetaminophen + NSAID; opioid sparingly.",
    antibiotics: "Single perioperative dose for uncomplicated. 5-7 days IV/PO course for perforation per AAST guidelines (piperacillin-tazobactam or ceftriaxone + metronidazole).",
    activity: "Resume normal activities as tolerated; no heavy lifting × 2 weeks.",
    diet: "Resume regular diet immediately.",
    followup: ["Clinic at 2-4 weeks for wound check + pathology review (rule out neuroendocrine tumor or mucinous neoplasm)"],
    returnPrecautions: ["Worsening abdominal pain", "Fevers > 38.5°C", "Persistent nausea/vomiting", "Wound drainage"],
  },
  requiredFields: [
    { id: "perforation", label: "Perforation", type: "boolean" },
    { id: "appendix_appearance", label: "Appendix appearance", type: "enum", options: ["Acute inflammation", "Gangrenous", "Perforated", "Phlegmonous", "Normal (incidental)", "Mass / suspicious"] },
    { id: "stump_closure", label: "Stump closure", type: "enum", options: ["Endo GIA stapler", "Endoloop × 2", "Suture ligature"] },
    { id: "drain_placed", label: "Drain placed", type: "boolean" },
  ],
});

export const INGUINAL_HERNIA = g({
  key: "general-surgery.hernia.inguinal_hernia",
  subcategory: "hernia",
  procedureName: "Inguinal hernia repair",
  synonyms: ["inguinal hernia", "lichtenstein", "tep", "tapp"],
  matchPatterns: [/\binguinal\s+hernia|\blichtenstein|\btep\b|\btapp\b/i],
  topMatter: {
    anesthesia: "General anesthesia (laparoscopic) or local + sedation (open).",
    position: "Supine; both arms tucked for laparoscopic.",
    prep: "Lower abdomen + bilateral groins prepped with chlorhexidine.",
    ebl: "Minimal.",
    disposition: "Discharge home same-day.",
  },
  findings: {
    headline: "[Right / Left / Bilateral] [direct / indirect / pantaloon] inguinal hernia with [reducible / incarcerated] contents consisting of [omentum / preperitoneal fat / small bowel]. Defect measuring approximately ___ × ___ cm.",
    supporting: [
      "[Lichtenstein: spermatic cord structures and ilioinguinal/iliohypogastric nerves identified and preserved.]",
      "[Laparoscopic TEP/TAPP: pubic symphysis, Cooper's ligament, epigastric vessels, and cord structures identified bilaterally; myopectineal orifice (MPO) cleared.]",
      "Femoral and obturator spaces inspected — no concomitant defects.",
    ],
  },
  operativeSteps: {
    steps: [
      "[Lichtenstein open variant:] 6 cm transverse incision over inguinal canal; Scarpa's fascia opened; external oblique aponeurosis split in line of fibres preserving ilioinguinal + iliohypogastric nerves. Spermatic cord encircled with Penrose drain.",
      "[Lichtenstein:] Hernia sac dissected from cord (indirect — high ligation with 2-0 silk and reduced into preperitoneal space; direct — defect imbricated with running 2-0 Vicryl).",
      "[Lichtenstein:] Pre-shaped 6 × 12 cm polypropylene mesh (Bard ProGrip or PerFix) tailored and secured to pubic tubercle, shelving edge of inguinal ligament, and conjoint tendon with 2-0 Prolene interrupted, creating a new internal ring snug around cord.",
      "[Laparoscopic TEP variant:] Preperitoneal space developed via balloon dissector through subumbilical incision. Three ports placed (10 mm at umbilicus + two 5 mm midline). MPO cleared bilaterally; sac reduced.",
      "[Laparoscopic TAPP variant:] Pneumoperitoneum established. Peritoneal flap created above the defect. Sac reduced. MPO cleared.",
      "[Laparoscopic:] Large pre-shaped 3DMax or 15 × 10 cm Bard polypropylene mesh introduced and positioned to cover direct + indirect + femoral spaces with > 5 cm overlap medially across midline.",
      "[Laparoscopic:] Mesh secured with absorbable tacks to Cooper's ligament, avoiding the triangle of doom (medial to cord, contains external iliac vessels) and triangle of pain (lateral to cord, contains lateral femoral cutaneous + genitofemoral nerves). Or self-gripping ProGrip mesh requiring no tacks.",
      "[TAPP:] Peritoneal flap re-approximated with running 3-0 V-Loc.",
    ],
    closure: "[Lichtenstein] External oblique re-approximated with 2-0 Vicryl interrupted; Scarpa's with 3-0 Vicryl; skin with 4-0 Monocryl subcuticular + Dermabond. [Laparoscopic] Pneumoperitoneum released; 10 mm fascia closed with 0 Vicryl Carter-Thomason; skin with 4-0 Monocryl.",
  },
  devices: {
    instruments: ["Open: standard hernia tray + Penrose drain. Lap: 10 mm 30° scope, balloon dissector (TEP), insufflation system."],
    implants: ["Polypropylene mesh — pre-shaped 6 × 12 cm (Lichtenstein) or 15 × 10 cm 3DMax (laparoscopic), or self-gripping Bard ProGrip"],
    consumables: ["2-0 Prolene for mesh fixation (open)", "0.25% bupivacaine for nerve block + port sites"],
  },
  specimens: { default: "Hernia sac to pathology — usually reported as fibrofatty tissue." },
  tubesAndDrains: { default: "None routinely." },
  complicationChecks: [
    { label: "Chronic post-herniorrhaphy pain (5-15%)" },
    { label: "Recurrence (1-3% lifetime)" },
    { label: "Cord injury / testicular ischemia (rare)" },
    { label: "Mesh infection (< 1%)" },
    { label: "Seroma / hematoma" },
  ],
  postopPlan: {
    disposition: "Discharge same-day.",
    analgesia: "Acetaminophen + NSAID; ice for first 24 h.",
    activity: "No lifting > 10 lbs × 4-6 weeks; gradual return to baseline activity.",
    followup: ["Clinic at 2-4 weeks for wound check"],
    returnPrecautions: ["Worsening pain / new bulge", "Wound drainage / fevers", "Testicular pain or swelling"],
  },
  requiredFields: [
    { id: "approach", label: "Approach", type: "enum", options: ["Open Lichtenstein", "Laparoscopic TEP", "Laparoscopic TAPP", "Robotic TAPP"] },
    { id: "laterality", label: "Laterality", type: "laterality" },
    { id: "hernia_type", label: "Hernia type", type: "enum", options: ["Direct", "Indirect", "Pantaloon", "Femoral", "Obturator", "Recurrent"] },
    { id: "mesh_used", label: "Mesh", type: "enum", options: ["Pre-shaped polypropylene", "3DMax", "Self-gripping (ProGrip)", "Biologic (contaminated field)", "No mesh (Shouldice / Bassini)"] },
  ],
});

export const RIGHT_HEMICOLECTOMY = g({
  key: "general-surgery.colorectal.right_hemicolectomy",
  subcategory: "colorectal",
  procedureName: "Laparoscopic right hemicolectomy",
  synonyms: ["right hemicolectomy", "right colectomy"],
  matchPatterns: [/\bright\s+hemicolectom|\bright\s+colectom/i],
  topMatter: {
    anesthesia: "General endotracheal anesthesia + epidural for postoperative analgesia.",
    position: "Supine with arms tucked; left lateral tilt + Trendelenburg as needed.",
    prep: "Abdomen prepped from nipples to pubis. Foley placed.",
    ebl: "100-200 mL.",
    disposition: "Surgical floor on ERAS pathway; LOS 3-4 days.",
  },
  findings: {
    headline: "[Cecal / ascending / hepatic flexure] mass (or polyp / diverticular stricture / Crohn's stricture) measuring approximately ___ cm. No carcinomatosis, liver metastases, or ascites.",
    supporting: [
      "Liver surfaces, peritoneum, and small bowel inspected — no metastatic disease.",
      "Right ureter and gonadal vessels identified and protected throughout dissection.",
      "Stapled side-to-side functional end-to-end ileocolic anastomosis: patent, well-perfused, tension-free; air-leak test negative.",
      "Mesenteric lymph node harvest: ___ nodes including ileocolic and right colic packets (target ≥ 12 per AJCC for adequate staging).",
    ],
  },
  operativeSteps: {
    steps: [
      "Pneumoperitoneum established to 15 mmHg via Veress at the umbilicus or Palmer's point.",
      "Five-port configuration: 12 mm camera at umbilicus, 12 mm right paramedian, 5 mm left lower quadrant, 5 mm left upper quadrant, 5 mm suprapubic.",
      "Right colon mobilised laterally to medially along the white line of Toldt from the cecum to the hepatic flexure. Hepatocolic and gastrocolic ligaments divided with LigaSure energy.",
      "Duodenum swept posteriorly; care taken to protect the right ureter and gonadal vessels at the iliac crossing.",
      "Ileocolic pedicle identified, skeletonised at its origin off the SMA/SMV, divided with vascular load Endo GIA stapler (or Hem-o-lok clips × 2 + transection) for high-tie at origin (essential for ≥ 12 lymph node yield).",
      "Right colic and right branch of middle colic vessels similarly divided.",
      "Terminal ileum and transverse colon transected with Endo GIA stapler (purple/tan load).",
      "Specimen placed in extraction bag and removed through extended periumbilical incision (or Pfannenstiel).",
      "Side-to-side functional end-to-end stapled ileocolic anastomosis created: enterotomies on antimesenteric border of ileum and colon; stapler fired creating common channel; common enterotomy closed with second stapler firing.",
      "Air-leak test performed and negative; mesenteric defect closed with 3-0 silk continuous to prevent internal hernia.",
    ],
    closure: "Pneumoperitoneum released. 12 mm fascia closed with 0 Vicryl Carter-Thomason; extraction-incision fascia closed with running 1 PDS. Skin with 4-0 Monocryl subcuticular.",
  },
  devices: {
    instruments: ["10 mm 30° laparoscope", "LigaSure or Harmonic scalpel", "Endo GIA stapler with vascular (white), purple, and tan loads", "Wound protector for specimen extraction"],
    consumables: ["3-0 silk for mesenteric defect closure", "1 PDS for fascia"],
  },
  specimens: { default: "Right colon segment with ileocolic + right colic lymph node packets en bloc — oriented with proximal/distal margins marked for pathology. Target ≥ 12 lymph nodes for adequate AJCC staging." },
  tubesAndDrains: { default: "Foley × 24 h. No routine pelvic drain for ileocolic anastomosis." },
  complicationChecks: [
    { label: "Anastomotic leak (1-3%)" },
    { label: "Postoperative ileus / SBO" },
    { label: "Bleeding from mesenteric / vascular pedicles" },
    { label: "Internal hernia at mesenteric defect" },
    { label: "Surgical site infection" },
  ],
  postopPlan: {
    disposition: "Surgical floor; ERAS pathway.",
    catheter: "Foley × 24-48 h.",
    analgesia: "Epidural × 48 h; transition to multimodal oral.",
    antibiotics: "Single perioperative dose; no continuation.",
    activity: "Early ambulation POD 0; gum chewing for ileus prevention.",
    diet: "Clear liquids POD 0; advance per ERAS as tolerated; expect return of bowel function POD 3-4.",
    followup: ["Pathology + final staging at 7-10 days; oncology referral if malignancy", "Surveillance per NCCN colon cancer guidelines (CEA, CT, colonoscopy intervals)"],
    returnPrecautions: ["Worsening abdominal pain / fevers > 38.5°C (anastomotic leak)", "Persistent nausea/vomiting (ileus or SBO)", "Wound concerns"],
  },
  requiredFields: [
    { id: "indication", label: "Indication", type: "enum", options: ["Right colon adenocarcinoma", "Right colon polyp not amenable to colonoscopy", "Cecal diverticulitis", "Ileocolic Crohn's disease", "Appendiceal tumor"] },
    { id: "approach", label: "Approach", type: "enum", options: ["Laparoscopic", "Robotic", "Open"] },
    { id: "anastomosis_type", label: "Anastomosis type", type: "enum", options: ["Stapled side-to-side functional end-to-end", "Hand-sewn end-to-end", "Stapled end-to-end (EEA)"] },
    { id: "lymph_node_yield", label: "Lymph nodes harvested", type: "number" },
    { id: "drain_placed", label: "Drain placed", type: "boolean" },
  ],
});

export const SLEEVE_GASTRECTOMY = g({
  key: "general-surgery.bariatric.sleeve_gastrectomy",
  subcategory: "bariatric",
  procedureName: "Laparoscopic sleeve gastrectomy",
  synonyms: ["sleeve gastrectomy", "vsg", "lsg"],
  matchPatterns: [/\bsleeve\s+gastrectom|\bvsg\b|\blsg\b/i],
  topMatter: {
    anesthesia: "General endotracheal anesthesia.",
    position: "Supine with footboard for steep reverse Trendelenburg; arms tucked.",
    prep: "Abdomen prepped from nipples to pubis. Bariatric prophylaxis: enoxaparin 40-60 mg SQ preop, SCDs, ambulation goals.",
    ebl: "Minimal — under 50 mL.",
    disposition: "Surgical floor on bariatric ERAS pathway; discharge POD 1-2.",
  },
  findings: {
    headline: "Stomach normal; greater curvature mobilised completely from the gastrocolic ligament with division of all short gastric vessels. Angle of His fully exposed. Sleeve created over a 36 Fr orogastric bougie with adequate antrum preservation. Methylene blue leak test negative.",
  },
  operativeSteps: {
    steps: [
      "Pneumoperitoneum established to 15 mmHg via Veress at Palmer's point (preferred for high BMI to avoid uncertain umbilical anatomy).",
      "Five ports placed: 12 mm supraumbilical (camera), 12 mm left mid-clavicular subcostal (stapler), 5 mm right mid-clavicular subcostal, 5 mm left lateral subcostal, Nathanson liver retractor at subxiphoid.",
      "Reverse Trendelenburg achieved. Liver elevated.",
      "Pylorus identified — staple line begins 4-6 cm proximal to preserve antral pump function (< 2 cm increases reflux risk).",
      "Greater curvature mobilised from antrum to angle of His with LigaSure (or Harmonic): gastrocolic ligament + gastrosplenic ligament + short gastric vessels divided. Posterior gastric attachments taken down to fully mobilise the fundus and expose the left crus posteriorly.",
      "36 Fr orogastric bougie passed transorally by anaesthesia and positioned along the lesser curvature down to the antrum.",
      "Sequential Endo GIA staple firings: green load (4.1 mm closed staple height) for thicker antral wall first 1-2 firings; tan/black for body and fundus to 3.5 mm closed staple height. Each firing tightly along the bougie but without compressing it.",
      "Staple line started 4-6 cm proximal to pylorus, progressed cephalad in serial firings to angle of His, leaving 1-2 cm of fundus lateral to angle of His (most common leak site is proximal staple line).",
      "Staple line inspected for hemostasis; bleeding sites controlled with bipolar cautery or oversewn with 3-0 Vicryl Lembert sutures.",
      "Methylene blue leak test: bougie withdrawn, OG tube passed, 60 mL of methylene blue + saline instilled while occluding antrum with bowel grasper. No extravasation along the staple line.",
      "Resected stomach placed in Endo Catch bag and removed through 12 mm supraumbilical port (extended to ~2 cm).",
    ],
    closure: "Pneumoperitoneum released. 12 mm fascia closed with 0 Vicryl Carter-Thomason. Skin closed with 4-0 Monocryl subcuticular.",
  },
  devices: {
    instruments: ["10 mm 30° laparoscope", "LigaSure or Harmonic scalpel", "Endo GIA stapler with green (4.1 mm), tan (3.5 mm), and black (4.1 mm) loads"],
    consumables: ["Buttressing material (Seamguard / Peristrips Dry) — selective use", "36 Fr orogastric bougie"],
  },
  specimens: { default: "Resected gastric body and fundus to pathology." },
  tubesAndDrains: { default: "None routinely (per bariatric ERAS) — surgeon may place drain along staple line." },
  complicationChecks: [
    { label: "Staple line leak (1-2%; most common at proximal staple line near angle of His)" },
    { label: "Staple line bleeding" },
    { label: "Stenosis at incisura angularis (sleeve too tight on bougie)" },
    { label: "New-onset GERD (~30% — counselled preop, PPI × 6 months)" },
    { label: "VTE (DVT/PE) — bariatric high-risk" },
  ],
  postopPlan: {
    disposition: "Surgical floor; bariatric ERAS pathway.",
    analgesia: "Multimodal: TAP block + acetaminophen + NSAID; opioid sparingly.",
    antibiotics: "Single perioperative dose only.",
    activity: "Early mobilisation POD 0; ambulation 30 min × 4/day.",
    diet: "Clear liquids POD 0 (50 mL/h); full liquids POD 1; UGI series at POD 1 per protocol; advance per bariatric dietitian over weeks.",
    followup: [
      "Bariatric clinic at 2 weeks, 3 months, 6 months, then annually",
      "Lifelong vitamin/mineral supplementation: multivitamin, B12 1000 mcg monthly IM or 350 mcg PO daily, calcium citrate 1200 mg/day, vitamin D 3000 IU/day",
      "PPI × 6 months for GERD prophylaxis",
    ],
    returnPrecautions: [
      "Tachycardia / fevers / abdominal pain (concern for staple line leak)",
      "Persistent dysphagia or vomiting (stenosis)",
      "Calf pain / chest pain (DVT/PE)",
    ],
  },
  requiredFields: [
    { id: "bmi", label: "Preoperative BMI", type: "number" },
    { id: "bougie_size", label: "Bougie size (Fr)", type: "enum", options: ["32", "36", "38", "40"] },
    { id: "staple_line_buttress", label: "Staple line buttress", type: "boolean" },
    { id: "leak_test", label: "Leak test", type: "enum", options: ["Methylene blue (negative)", "Intraoperative endoscopy + air (negative)", "None"] },
    { id: "drain_placed", label: "Drain placed", type: "boolean" },
  ],
  billingPrompts: [
    "Bariatric procedures often require a separate qualifying letter / case manager note.",
    "Document BMI and qualifying comorbidities for insurance.",
  ],
});

export const GENERAL_SURGERY_TEMPLATES: ProcedureTemplate[] = [
  LAP_CHOLECYSTECTOMY,
  LAP_APPENDECTOMY,
  INGUINAL_HERNIA,
  RIGHT_HEMICOLECTOMY,
  SLEEVE_GASTRECTOMY,
];
