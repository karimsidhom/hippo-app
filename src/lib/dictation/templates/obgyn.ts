// ---------------------------------------------------------------------------
// OB/GYN — procedure-specific dictation templates
// ---------------------------------------------------------------------------

import type { ProcedureTemplate } from "./types";

const ob = (
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
): ProcedureTemplate => ({ specialty: "obgyn", ...partial });

export const CESAREAN_DELIVERY = ob({
  key: "obgyn.obstetrics.cesarean_delivery",
  subcategory: "obstetrics",
  procedureName: "Cesarean delivery (low transverse)",
  synonyms: ["cesarean", "caesarean", "c-section", "lscs", "c/s"],
  matchPatterns: [/\b(cesarean|caesarean|c-section|c\/s|lscs)\b/i],
  topMatter: {
    anesthesia: "Spinal / combined spinal-epidural (preferred for elective and most urgent cases); GA reserved for emergent or contraindications to neuraxial.",
    position: "Supine with left lateral tilt of 15° (Crawford wedge under right hip — relieves IVC compression and improves uteroplacental perfusion).",
    prep: "Abdomen prepped with chlorhexidine from xiphoid to mid-thigh; cefazolin 2 g IV (3 g for BMI > 80) within 60 min PRE-INCISION (per ACOG — changed from cord-clamp dosing ~10 yrs ago, reduces SSI 30-50%); azithromycin 500 mg IV added for non-elective.",
    ebl: "800-1000 mL.",
    disposition: "Postpartum recovery with infant for skin-to-skin and breastfeeding initiation; standard post-cesarean ERAS pathway.",
  },
  findings: {
    headline: "Live [singleton / twin] gestation delivered in [vertex / breech / transverse] presentation. FHR during procedure remained [Category I / intermittently Category II with reassuring return / Category III prompting expedited delivery]. Amniotic fluid [clear / meconium-stained (thin/thick) / bloody]. Placenta delivered intact with 3-vessel umbilical cord. Cord gases sent. APGAR ___ at 1 min, ___ at 5 min. Estimated weight ___ g. Uterus delivered into operative field, responded well to oxytocin / methergine with good tone. Tubes and ovaries inspected and normal. Hysterotomy closed in two layers with running absorbable suture and was hemostatic.",
  },
  operativeSteps: {
    steps: [
      "Foley catheter placed; pre-incision time-out completed (patient, gestational age, indication, antibiotics, neonatal team presence).",
      "Pfannenstiel skin incision two finger-breadths above pubic symphysis, carried down through subcutaneous tissue with electrocautery.",
      "Anterior rectus sheath incised transversely with #10 blade and extended bilaterally with Mayo scissors.",
      "Rectus muscles separated in midline bluntly (not divided — preserves abdominal wall integrity).",
      "Peritoneum elevated between two clamps and entered sharply, with care to avoid bladder and bowel.",
      "Bladder flap developed by incising vesicouterine peritoneum transversely and bluntly dissecting bladder inferiorly.",
      "Low transverse hysterotomy created with scalpel; extended bilaterally with bandage scissors (or bluntly per Joel-Cohen) in curvilinear fashion to avoid uterine vessel extension.",
      "Infant's [head / breech] delivered atraumatically; nares and mouth suctioned; cord doubly clamped and divided; infant handed to neonatal team. Apgars and cord blood gases obtained.",
      "Placenta delivered spontaneously with controlled cord traction (or manually as indicated) and inspected for completeness; cavity wiped clear of membranes and clot.",
      "Hysterotomy edges grasped with green Armytage clamps; closure with 0 Vicryl in [single-layer running unlocked / two-layer with first running locked + second imbricating layer per surgeon preference; two-layer closure has lower rupture risk in subsequent TOLAC by NNH ~70].",
      "Adnexa inspected bilaterally and confirmed normal. Hemostasis confirmed.",
      "Uterus returned to abdominal cavity; gutters inspected.",
    ],
    closure: "Fascia with running 0 Vicryl. Subcutaneous tissue with [plain gut / 3-0 Vicryl] (only if subcutaneous depth > 2 cm — reduces wound disruption). Skin with [3-0 Vicryl on a straight needle / 4-0 Monocryl subcuticular]. Sterile dressing.",
  },
  devices: {
    instruments: ["Pfannenstiel tray", "Green Armytage hysterotomy clamps", "Bandage scissors / blunt expansion"],
    consumables: ["0 Vicryl × 2 for hysterotomy + fascia", "Oxytocin 40 U/L IV infusion", "TXA 1 g IV (for high-risk PPH per WHO)"],
  },
  specimens: { default: "Placenta to pathology per institutional protocol (per ACOG, mandatory for: stillbirth, severe maternal disease, suspected chorioamnionitis, multiples)." },
  tubesAndDrains: { default: "Foley × 12 h; no abdominal drains." },
  complicationChecks: [
    { label: "Postpartum hemorrhage > 1000 mL" },
    { label: "Uterine atony" },
    { label: "Bladder injury" },
    { label: "Hysterotomy extension into uterine vessels" },
    { label: "VTE (DVT/PE — pregnancy is hypercoagulable)" },
    { label: "Endometritis" },
  ],
  postopPlan: {
    disposition: "Postpartum recovery with infant.",
    catheter: "Foley × 12 h (allow regional anesthesia recovery).",
    analgesia: "Multimodal: scheduled acetaminophen + NSAID + opioid sparingly; intrathecal morphine when neuraxial anesthesia used.",
    antibiotics: "Single perioperative dose only (no continuation unless chorioamnionitis).",
    activity: "Early ambulation POD 0; gradual return to activity over 6 weeks.",
    diet: "Clear liquids POD 0 within 6 h, advance per ERAS.",
    followup: [
      "Postpartum visit at 1-2 weeks (incision check) and 6 weeks (comprehensive)",
      "Counsel re: TOLAC eligibility for subsequent pregnancies (one prior LTCS with appropriate criteria — VBAC success ~70%)",
    ],
    returnPrecautions: ["Heavy bleeding (> 1 pad/hr) or large clots", "Fevers > 38.5°C", "Wound discharge / dehiscence", "Calf or chest pain (DVT/PE)"],
  },
  requiredFields: [
    { id: "indication", label: "Indication", type: "text" },
    { id: "presentation", label: "Fetal presentation at delivery", type: "enum", options: ["Vertex", "Breech (frank/complete/footling)", "Transverse / oblique", "Other"] },
    { id: "fhr_category", label: "FHR category", type: "enum", options: ["Category I", "Category II", "Category III"] },
    { id: "amniotic_fluid", label: "Amniotic fluid", type: "enum", options: ["Clear", "Thin meconium", "Thick meconium", "Bloody"] },
    { id: "apgar_1min", label: "APGAR 1 min", type: "number" },
    { id: "apgar_5min", label: "APGAR 5 min", type: "number" },
    { id: "birth_weight_g", label: "Birth weight (g)", type: "number" },
    { id: "hysterotomy_closure", label: "Hysterotomy closure", type: "enum", options: ["Single-layer running", "Two-layer (first locked, second imbricating)"] },
    { id: "tubal_ligation", label: "Concomitant tubal ligation", type: "boolean" },
  ],
});

export const TLH = ob({
  key: "obgyn.gynecology.total_laparoscopic_hysterectomy",
  subcategory: "gynecology",
  procedureName: "Total laparoscopic hysterectomy",
  synonyms: ["total laparoscopic hysterectomy", "tlh", "lavh", "laparoscopic hysterectomy"],
  matchPatterns: [/\b(total\s+laparoscopic\s+hysterectomy|tlh|lavh)\b/i, /\blaparoscopic\s+hysterectomy/i],
  topMatter: {
    anesthesia: "General endotracheal anesthesia.",
    position: "Dorsal lithotomy in Allen stirrups; arms tucked.",
    prep: "Abdominal prep with chlorhexidine; vaginal prep with povidone-iodine; cefazolin 2 g IV + (azithromycin if vaginal cuff entry).",
    ebl: "100-250 mL.",
    disposition: "Surgical floor; LOS 0-1 day.",
  },
  findings: {
    headline: "Uterus [normal-sized / fibroid-studded with largest myoma ___ cm at the (anterior / posterior / fundal) wall / boggy with adenomyosis]; adnexa [normal bilaterally / contained ___ cm simple cyst]. Pelvic anatomy: [no / dense] adhesions; pouch of Douglas [open / obliterated]. Ureters identified bilaterally and traced safely throughout dissection. Cuff closed with 0 V-Loc / 0 Vicryl, hemostatic. No bladder or bowel injury — confirmed by post-procedure cystoscopy with bilateral ureteric jets.",
  },
  operativeSteps: {
    steps: [
      "Foley placed; uterine manipulator with ceramic vaginal cup ([Valchev / RUMI / V-Care / Hohl]) inserted and seated.",
      "Veress needle pneumoperitoneum to 15 mmHg via subumbilical entry (or Palmer's point if prior surgery); 10-12 mm camera port; three additional 5 mm working ports under direct vision (one left, two right) avoiding epigastric vessels.",
      "Steep Trendelenburg achieved.",
      "Right side: infundibulopelvic ligament identified by lifting tube anteriorly; right ureter visualised on pelvic sidewall with peristalsis confirmed. Vessel-sealing device ([LigaSure / Thunderbeat / Enseal]) used to clamp and ligate IP ligament in three sequential overlapping bites; cut mid-distance and pedicle inspected for hemostasis.",
      "Broad ligament sequentially clamped, ligated, and cut working towards round ligament, staying away from ureter and sidewall vasculature. Round ligament ligated and cut. Anterior leaf of broad ligament taken down toward peritoneal reflection at bladder base adjacent to cervix.",
      "Same sequence repeated on the left.",
      "Bladder dissected free from lower anterior uterine segment; uterine arteries clamped and ligated bilaterally at the level of the ceramic cup. Pedicles inspected — hemostatic.",
      "Vaginal vault incised circumferentially with monopolar [J-hook / L-hook / Mahnes needle] at the level of the ceramic manipulator cup.",
      "Uterus (± tubes/ovaries) delivered through vagina and sent to pathology; cuff edges examined.",
      "Sterile glove placed in vagina to form pneumatic seal. Pedicles and cuff edges examined; bipolar cautery for hemostasis.",
      "Vaginal vault closed laparoscopically with [0 V-Loc barbed / 0 Vicryl] running, incorporating uterosacral ligaments bilaterally for apical support and avoiding bladder and lateral pedicles. Hemostasis re-confirmed.",
      "Cystoscopy performed: bladder mucosa normal, bilateral ureteric jets visualised — no evidence of injury.",
    ],
    closure: "Pneumoperitoneum released. 10-12 mm port fascia closed with 0 Vicryl figure-of-eight (Carter-Thomason). 5 mm port sites closed at skin only with 4-0 Monocryl subcuticular.",
  },
  devices: {
    instruments: ["Uterine manipulator with ceramic cup (Valchev / RUMI / V-Care / Hohl)", "10 mm 30° laparoscope", "Vessel-sealing device (LigaSure / Thunderbeat / Enseal)", "Cystoscope for end-of-case bladder check"],
    consumables: ["0 V-Loc or 0 Vicryl for cuff closure"],
  },
  specimens: { default: "Uterus + cervix ± adnexa to pathology, oriented." },
  tubesAndDrains: { default: "Foley × 12 h; no abdominal drains." },
  complicationChecks: [
    { label: "Ureteric injury (most common at IP ligation, uterine artery, or cuff closure)" },
    { label: "Bladder injury (anterior peritoneal reflection)" },
    { label: "Bowel injury" },
    { label: "Vaginal cuff dehiscence (~1%) — counsel re: pelvic rest × 8 weeks" },
    { label: "VTE (DVT/PE)" },
  ],
  postopPlan: {
    disposition: "Surgical floor; LOS 0-1 day.",
    catheter: "Foley × 12 h.",
    analgesia: "Multimodal: TAP block + acetaminophen + NSAID + opioid sparingly.",
    antibiotics: "Single perioperative dose.",
    activity: "Early ambulation POD 0; pelvic rest × 8 weeks (no intercourse, tampons, douching).",
    followup: ["Clinic at 2 weeks for incision + cuff check", "Pathology review at 7-10 days"],
    returnPrecautions: ["Vaginal bleeding > a tampon-load/hour", "Cuff dehiscence (sudden vaginal pain with feeling of 'something coming out')", "Fever, increasing abdominal pain, calf or chest pain"],
  },
  requiredFields: [
    { id: "indication", label: "Indication", type: "enum", options: ["Symptomatic fibroids", "Abnormal uterine bleeding", "Endometriosis / adenomyosis", "Endometrial hyperplasia / cancer", "Cervical CIN / cancer", "Pelvic organ prolapse", "Other"] },
    { id: "uterine_size_g", label: "Uterine size (g, on pathology)", type: "number" },
    { id: "adnexa_management", label: "Adnexa", type: "enum", options: ["Preserved bilaterally", "Right oophorectomy / salpingectomy", "Left oophorectomy / salpingectomy", "Bilateral salpingo-oophorectomy", "Bilateral salpingectomy with ovarian preservation"] },
    { id: "cystoscopy_done", label: "Cystoscopy at end of case", type: "boolean" },
    { id: "cuff_closure", label: "Cuff closure", type: "enum", options: ["0 V-Loc barbed", "0 Vicryl running", "Endo Loc / interrupted"] },
  ],
});

export const ECTOPIC = ob({
  key: "obgyn.gynecology.ectopic_pregnancy",
  subcategory: "gynecology",
  procedureName: "Laparoscopic salpingectomy / salpingostomy for ectopic",
  synonyms: ["ectopic pregnancy", "salpingostomy for ectopic", "ectopic salpingectomy"],
  matchPatterns: [/\bectopic\s+(pregnancy|salping)|\bsalpingostomy\s+for\s+ectopic/i],
  topMatter: {
    anesthesia: "General endotracheal anesthesia.",
    position: "Low lithotomy (allows uterine manipulator + permits open conversion).",
    prep: "Abdomen + perineum + vagina prepped; cefazolin 2 g IV.",
    ebl: "100-500 mL (variable; brisk for ruptured ectopic with hemoperitoneum).",
    disposition: "Recovery → discharge home same-day (or short observation if hemodynamic instability).",
  },
  findings: {
    headline: "[Right / Left] tubal ectopic pregnancy at the [ampullary (most common, 70%) / isthmic / fimbrial / interstitial / cornual] portion, measuring approximately ___ cm. Hemoperitoneum estimated at ___ mL. Contralateral tube and bilateral ovaries normal. Heterotopic pregnancy ruled out (uterine cavity inspected on bimanual + manipulator-confirmed). RUQ inspected for Fitz-Hugh-Curtis adhesions (5-10% of ectopic patients).",
  },
  operativeSteps: {
    steps: [
      "Foley placed; uterine manipulator (RUMI II or Valchev) inserted to elevate uterus and permit pelvic exposure.",
      "Pneumoperitoneum to 15 mmHg via Veress at umbilicus or Hasson if prior surgery; 10-12 mm umbilical optical trocar; two 5 mm working ports in lower quadrants under direct vision (lateral to inferior epigastrics, transilluminated in slim patients).",
      "Steep Trendelenburg ~25-30°. Pelvis systematically inspected: hemoperitoneum suctioned and quantified ([___ mL] — important for postoperative fluid management and transfusion consideration).",
      "Ectopic pregnancy localised; contralateral tube + bilateral ovaries inspected and documented. Uterus examined for any concurrent intrauterine pregnancy (heterotopic — 1/4000 spontaneous, 1/100 with IVF).",
      "[Salpingectomy preferred for ruptured ectopic, contralateral tube intact, completed family, or recurrent ectopic in same tube:] Affected tube elevated by grasping fimbriated end. Vessel-sealing device (LigaSure / Harmonic / Thunderbeat) used to serially seal and divide mesosalpinx working from fimbriated end toward cornual end, with 1-2 cm overlapping bites. Care taken to stay close to tube to avoid devascularising ovary. Cornual portion sealed and divided flush with uterine wall. Specimen placed in 10 mm Endo Catch bag and removed through umbilical port.",
      "[Salpingostomy for fertility preservation when contralateral tube damaged + small unruptured ampullary ectopic:] Dilute vasopressin (20 U in 100 mL saline) injected into mesosalpinx beneath ectopic to reduce bleeding. 1.5-2 cm linear incision along antimesenteric border with monopolar scissors; products of conception extruded; gentle hydrodissection with irrigation expelled residual tissue without traumatising tubal endothelium. Tubal serosa left to heal by secondary intention (suturing increases stricture risk). Beta-hCG must be followed weekly to negativity (persistent trophoblast 5-15%).",
      "Pelvis irrigated with warmed saline; RUQ inspected for liver/diaphragmatic adhesions (Fitz-Hugh-Curtis); subdiaphragmatic spaces suctioned of any blood. Hemostasis confirmed at insufflation pressure 8 mmHg to identify low-pressure venous bleeding.",
    ],
    closure: "Umbilical port released; 10-12 mm fascia closed with 0 Vicryl Carter-Thomason. 5 mm port sites at skin only with 4-0 Monocryl. Anti-D 300 mcg IM if Rh-negative (regardless of gestational age — fetomaternal hemorrhage risk from ectopic).",
  },
  devices: {
    instruments: ["10 mm 30° laparoscope", "Vessel-sealing device (LigaSure / Harmonic / Thunderbeat)", "Endo Catch retrieval bag"],
    consumables: ["Dilute vasopressin (20 U/100 mL saline) for salpingostomy hemostasis", "Anti-D immunoglobulin 300 mcg IM (Rh-negative patients)"],
  },
  specimens: { default: "Affected fallopian tube ± products of conception to pathology — confirms tubal pregnancy and rules out gestational trophoblastic disease." },
  tubesAndDrains: { default: "Foley removed in PACU; no abdominal drains." },
  complicationChecks: [
    { label: "Hemorrhage requiring conversion to laparotomy" },
    { label: "Persistent trophoblast post-salpingostomy (5-15% — methotrexate may be required)" },
    { label: "Tubal stricture / future ectopic risk" },
    { label: "Inadvertent contralateral injury" },
  ],
  postopPlan: {
    disposition: "Discharge home same-day or short observation.",
    analgesia: "Acetaminophen + NSAID; opioid sparingly.",
    antibiotics: "Single perioperative dose.",
    activity: "Light activity × 2 weeks; pelvic rest × 2-4 weeks.",
    followup: [
      "Beta-hCG weekly to negativity (especially after salpingostomy)",
      "Clinic at 2-4 weeks",
      "Anti-D given (Rh-negative)",
      "Future fertility counselling: contralateral tube intact predicts good IUP rates; bilateral tubal disease may favor IVF",
    ],
    returnPrecautions: ["Worsening pelvic pain / signs of bleeding", "Persistent / rising β-hCG"],
  },
  requiredFields: [
    { id: "side", label: "Side", type: "enum", options: ["Right", "Left"] },
    { id: "tubal_location", label: "Tubal location of ectopic", type: "enum", options: ["Ampullary", "Isthmic", "Fimbrial", "Interstitial / cornual", "Other"] },
    { id: "ruptured", label: "Ruptured at presentation", type: "boolean" },
    { id: "hemoperitoneum_ml", label: "Hemoperitoneum (mL)", type: "number" },
    { id: "procedure_done", label: "Procedure", type: "enum", options: ["Salpingectomy", "Salpingostomy (fertility preservation)"] },
    { id: "rh_status", label: "Rh status", type: "enum", options: ["Rh-positive", "Rh-negative — Anti-D given"] },
  ],
});

export const DC = ob({
  key: "obgyn.gynecology.dilation_curettage",
  subcategory: "gynecology",
  procedureName: "Dilation and curettage",
  synonyms: ["d&c", "dilation and curettage", "d and c", "suction d&c"],
  matchPatterns: [/\bd&c\b|\bd\s+and\s+c\b|\bdilat(at)?ion\s+and\s+curettage|\bsuction\s+d&c/i],
  topMatter: {
    anesthesia: "MAC sedation (propofol + fentanyl titrated) or general anesthesia for septic / large uterus; paracervical block for office D&C.",
    position: "Dorsal lithotomy with buttocks at table edge.",
    prep: "Vagina + perineum prepped with chlorhexidine.",
    ebl: "Minimal.",
    disposition: "Discharge home same-day.",
  },
  findings: {
    headline: "Cervix [parous / nulliparous]; sounded to ___ cm. Curettings: [scant / moderate / abundant] tissue obtained from all four quadrants until gritty endometrium appreciated. No perforation. Specimen sent for permanent pathology.",
  },
  operativeSteps: {
    steps: [
      "Bimanual exam under anesthesia: uterine size, position (anteverted / retroverted), and mobility confirmed.",
      "Weighted speculum placed posteriorly; cervix grasped at 12 o'clock with single-tooth tenaculum.",
      "Paracervical block with 10 mL of 1% lidocaine + epinephrine at 4 and 8 o'clock (cervico-vaginal junction at uterosacral insertion level) for analgesia; 5-min pause for vasoconstriction.",
      "Sims uterine sound passed gently to identify cavity length (typically 6-9 cm) and direction; resistance felt at internal os; sounding past internal os performed gently.",
      "Cervix serially dilated with Hegar (or Pratt for postmenopausal/scarred cervix) progressively from 4 mm to [12-14 mm for suction curettage / 8-10 mm for sharp curettage]. Misoprostol 400 mcg vaginal pretreatment 3-4 h preop used in nulliparous / postmenopausal patients to soften cervix.",
      "[Suction variant for retained products / missed abortion / incomplete miscarriage] Karman cannula (10-12 mm) introduced; gentle suction (≤ 60 mmHg) applied while rotating cannula and moving fundus-to-cervix in systematic 4-quadrant pattern. Procedure complete when no further tissue aspirated and gritty wall sensation appreciated.",
      "[Sharp variant for AUB workup / endometrial sampling] Sharp curette (Sims size 3-4) introduced; cavity systematically curetted from all four quadrants until uniform gritty sensation appreciated. Tissue collected on gauze in posterior cul-de-sac.",
      "[Optional diagnostic hysteroscopy after curettage] 5 mm flexible hysteroscope with saline distention to confirm complete cavity evacuation; any residual tissue or pathology (polyp, fibroid, synechiae) identified.",
      "Hemostasis confirmed by direct visualisation through the dilated cervix — minimal bleeding from cavity expected. Heavy persistent bleeding suggests retained tissue (re-curette), atony (uterotonics — methylergonovine 0.2 mg IM, carboprost 250 mcg IM, misoprostol 800 mcg PR), or perforation (consider diagnostic laparoscopy).",
      "Tenaculum removed; tenaculum site hemostasis confirmed (silver nitrate or Monsel's if bleeding); speculum removed.",
    ],
  },
  devices: {
    instruments: ["Weighted speculum + single-tooth tenaculum", "Hegar / Pratt cervical dilators", "Karman 10-12 mm suction cannula (or Sims sharp curette size 3-4)", "Sims uterine sound"],
    consumables: ["1% lidocaine for paracervical block", "Misoprostol 400 mcg vaginal preop (selected cases)"],
  },
  specimens: { default: "Endometrial / placental curettings to permanent pathology. For trophoblastic disease: separate request for histology + serial β-hCG." },
  tubesAndDrains: { default: "None." },
  complicationChecks: [
    { label: "Uterine perforation (~1% — fundal most common)" },
    { label: "Asherman syndrome (intrauterine adhesions, especially after septic D&C)" },
    { label: "Hemorrhage requiring uterotonics or balloon tamponade" },
    { label: "Cervical injury / lateral tear" },
    { label: "Endometritis (post-D&C UTI/sepsis)" },
  ],
  postopPlan: {
    disposition: "Discharge home immediately.",
    analgesia: "Acetaminophen + NSAID.",
    antibiotics: "Single perioperative dose for retained products / symptomatic miscarriage; not routinely for AUB workup.",
    activity: "Pelvic rest × 2 weeks (no intercourse, tampons, douching).",
    followup: [
      "Pathology review at 7-10 days",
      "Anti-D 300 mcg IM if Rh-negative with confirmed pregnancy tissue",
      "Serial β-hCG to negativity for trophoblastic disease (weekly to 0, then monthly × 6 months)",
      "Pelvic exam at 2-4 weeks",
    ],
    returnPrecautions: ["Heavy bleeding > 1 pad/h × 2 h", "Severe abdominal pain (suggests perforation)", "Fevers > 38.5°C, foul discharge (endometritis)"],
  },
  requiredFields: [
    { id: "indication", label: "Indication", type: "enum", options: ["Incomplete miscarriage", "Missed abortion", "Retained products of conception", "AUB workup (perimenopausal/postmenopausal endometrial sampling)", "Trophoblastic disease", "Septic abortion", "Other"] },
    { id: "technique", label: "Technique", type: "enum", options: ["Suction (Karman cannula)", "Sharp (Sims curette)", "Combined suction + sharp"] },
    { id: "uterine_sound_cm", label: "Uterine sound (cm)", type: "number" },
    { id: "max_dilation_mm", label: "Max dilation (mm)", type: "number" },
    { id: "perforation", label: "Perforation", type: "boolean" },
    { id: "rh_neg", label: "Rh-negative — Anti-D given", type: "boolean" },
  ],
});

export const MYOMECTOMY = ob({
  key: "obgyn.gynecology.myomectomy",
  subcategory: "gynecology",
  procedureName: "Laparoscopic myomectomy",
  synonyms: ["myomectomy", "fibroid removal"],
  matchPatterns: [/\bmyomectom|\bfibroid\s+removal/i],
  topMatter: {
    anesthesia: "General endotracheal anesthesia.",
    position: "Dorsal lithotomy in Allen stirrups; arms tucked.",
    prep: "Abdomen + vagina prepped; uterine manipulator inserted; cefazolin 2 g IV.",
    ebl: "200-400 mL (variable by fibroid number, size, and location).",
    disposition: "Surgical floor; LOS 0-1 day for laparoscopic; 1-2 days open.",
  },
  findings: {
    headline: "Uterus enlarged with [___ ] intramural / subserosal / pedunculated leiomyomata; FIGO classification largest fibroid: type ___ measuring approximately ___ cm at [anterior / posterior / fundal / lateral] wall. Pseudocapsule planes well-developed. Tubes and ovaries normal. Pouch of Douglas open. Final uterine integrity confirmed; cavity entry [no / yes — closed in two layers].",
  },
  operativeSteps: {
    steps: [
      "Foley placed; uterine manipulator inserted; Veress to 15 mmHg pneumoperitoneum at Palmer's point (preferred for large uteri to avoid Veress vascular injury at umbilicus).",
      "Five ports: 12 mm camera (supraumbilical for uteri > 12-week size, umbilical for smaller), two 5 mm in lower quadrants, 5 mm suprapubic, and 12 mm for morcellator/extraction.",
      "Steep Trendelenburg.",
      "Dilute vasopressin (20 U in 100 mL warmed saline) injected into serosa and myometrium overlying the dominant fibroid using 22-gauge spinal needle. Aspiration before injection to avoid intravascular injection (causes profound vasoconstriction, hypertension, bradycardia).",
      "Tourniquet (Penrose drain or Foley) placed at lower uterine segment around broad-ligament base for very large myomectomies (Bonney's clamp / Rubin tourniquet) — released every 20 min to prevent ischemic injury.",
      "Vertical midline anterior or posterior serosal incision (preferred over transverse — less interference with uterine vasculature); incision carried through serosa to fibroid pseudocapsule (glistening white plane between fibroid and surrounding myometrium).",
      "Fibroid grasped with corkscrew (open) or tenaculum/myoma screw (laparoscopic); gentle traction-counter-traction with sharp dissection in pseudocapsule plane to enucleate without breaching myometrium.",
      "Vascular pedicle at deepest point identified, sealed with vessel-sealing device or suture-ligated, divided.",
      "Additional fibroids removed through same incision when possible by tunneling within myometrium ('beach diving' technique) — limits serosal incisions for adhesion prevention.",
      "Uterine defect closed in 2-3 layers based on depth: deep myometrium with 0 Vicryl interrupted figure-of-eight or 0 V-Loc barbed running, obliterating dead space (hematoma predisposes to dehiscence and rupture in pregnancy); superficial myometrium with 2-0 Vicryl running; serosa with 3-0 Vicryl baseball/imbricating to bury raw surface.",
      "Hemostasis confirmed at each layer.",
      "Tissue extraction: contained morcellation in Endo Catch bag (FDA black-box for open power morcellation due to occult leiomyosarcoma risk ~1/350; current standard is in-bag with PneumoLiner / containment system, OR vaginal extraction via colpotomy, OR mini-laparotomy).",
      "Anti-adhesion barrier (Interceed / SprayShield) applied to all serosal incisions.",
    ],
    closure: "Pneumoperitoneum released. 12 mm fascia closed with 0 Vicryl Carter-Thomason. Skin with 4-0 Monocryl subcuticular.",
  },
  devices: {
    instruments: ["Uterine manipulator", "10 mm 30° laparoscope", "Vessel-sealing device", "Myoma screw / tenaculum for traction", "Containment system (PneumoLiner) for morcellation"],
    consumables: ["Dilute vasopressin (20 U/100 mL saline)", "0 Vicryl + 2-0 Vicryl + 3-0 Vicryl for layered closure", "0 V-Loc barbed (alternative)", "Anti-adhesion barrier"],
  },
  specimens: { default: "Leiomyoma specimens to permanent pathology — orient for sarcoma rule-out (especially in postmenopausal patients or rapidly enlarging fibroids)." },
  tubesAndDrains: { default: "Foley × 24 h." },
  complicationChecks: [
    { label: "Bleeding requiring transfusion (~5%)" },
    { label: "Conversion to hysterectomy (rare; for uncontrolled bleeding or unexpected pathology)" },
    { label: "Uterine rupture in subsequent pregnancy (deep myomectomy with cavity entry mandates elective C/S 36-37 weeks)" },
    { label: "Adhesion formation" },
    { label: "Inadvertent occult leiomyosarcoma dissemination (FDA warning re: power morcellation)" },
  ],
  postopPlan: {
    disposition: "Surgical floor.",
    catheter: "Foley × 24 h.",
    analgesia: "Multimodal: TAP block + acetaminophen + NSAID.",
    antibiotics: "Single perioperative dose.",
    activity: "Light activity × 2 weeks; no heavy lifting × 4-6 weeks.",
    followup: [
      "Pathology review at 7-10 days",
      "Counsel future pregnancy: deep myomectomy with cavity entry → elective C/S 36-37 weeks (uterine rupture risk 1-4% in labor); superficial subserosal → TOLAC permitted",
      "MRI at 6 months in fertility-seeking patients (recurrence ~25% at 5 years)",
    ],
    returnPrecautions: ["Heavy bleeding", "Worsening abdominal pain", "Fevers / wound concerns"],
  },
  requiredFields: [
    { id: "approach", label: "Approach", type: "enum", options: ["Laparoscopic", "Robotic", "Open (laparotomy)", "Hysteroscopic (submucosal only)"] },
    { id: "fibroid_count", label: "Number of fibroids removed", type: "number" },
    { id: "largest_fibroid_cm", label: "Largest fibroid (cm)", type: "number" },
    { id: "figo_class", label: "FIGO classification (largest)", type: "enum", options: ["Type 0 (intracavitary)", "Type 1 (< 50% intramural)", "Type 2 (≥ 50% intramural)", "Type 3 (intramural reaching endometrium)", "Type 4 (intramural)", "Type 5 (subserosal ≥ 50% intramural)", "Type 6 (subserosal < 50% intramural)", "Type 7 (pedunculated subserosal)", "Type 8 (parasitic)"] },
    { id: "cavity_entry", label: "Endometrial cavity entered", type: "boolean" },
    { id: "morcellation_strategy", label: "Tissue extraction", type: "enum", options: ["In-bag morcellation (PneumoLiner)", "Vaginal extraction", "Mini-laparotomy extraction", "Removed intact through laparotomy"] },
    { id: "tourniquet_used", label: "Pelvic tourniquet used", type: "boolean" },
  ],
});

export const OBGYN_TEMPLATES: ProcedureTemplate[] = [
  CESAREAN_DELIVERY,
  TLH,
  ECTOPIC,
  DC,
  MYOMECTOMY,
];
