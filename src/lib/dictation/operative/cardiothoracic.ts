import type { CaseLog } from "@/lib/types";
import { includesAny } from "../shared/format";
import type { TopMatter } from "./types";

// ---------------------------------------------------------------------------
// Cardiothoracic — forced fields:
//   - Bypass time and cross-clamp time
//   - Cardioplegia route (antegrade/retrograde), type, volume
//   - Cannulation strategy
//   - Pre- and post-bypass TEE findings
//   - EF preoperatively and estimated postoperatively
//   - Graft / valve specs (sizes, models, prosthesis type)
//   - Chest tube sizes and locations
// ---------------------------------------------------------------------------

export function cardiothoracicTopMatter(c: CaseLog): TopMatter {
  const name = c.procedureName.toLowerCase();

  if (includesAny(name, ["cabg", "coronary artery bypass"])) {
    return {
      anesthesia: "General endotracheal anesthesia with arterial line, central venous access, PA catheter, and intraoperative TEE.",
      ebl: "Approximately 400–800 ml.",
      drains: "Mediastinal and left pleural 32 Fr chest tubes. Temporary atrial and ventricular pacing wires.",
      specimens: "None.",
      disposition: "The patient tolerated the procedure well. Chest closed over pacing wires and chest tubes. Transferred intubated to the cardiac ICU in stable condition on minimal vasoactive support. Standard post-cardiac pathway: early extubation, serial CT output checks, glucose control, DVT prophylaxis when bleeding stabilized.",
    };
  }

  if (includesAny(name, ["avr", "aortic valve replacement"])) {
    return {
      anesthesia: "General endotracheal anesthesia with arterial line, central venous access, PA catheter, and intraoperative TEE.",
      ebl: "Approximately 400–600 ml.",
      drains: "Mediastinal and left pleural 32 Fr chest tubes. Temporary atrial and ventricular pacing wires.",
      specimens: "Native aortic valve leaflets to pathology.",
      disposition: "The patient tolerated the procedure well. Transferred intubated to the cardiac ICU. Post-bypass TEE confirmed well-seated prosthetic valve with no paravalvular leak, trace transvalvular gradient, and preserved biventricular function.",
    };
  }

  if (includesAny(name, ["mvr", "mitral valve replacement", "mitral repair", "mitral valve repair"])) {
    return {
      anesthesia: "General endotracheal anesthesia with arterial line, central access, PA catheter, and TEE.",
      ebl: "Approximately 400–600 ml.",
      drains: "Mediastinal and left pleural 32 Fr chest tubes. Pacing wires.",
      specimens: "Resected mitral leaflet tissue / native valve to pathology.",
      disposition: "The patient tolerated the procedure well. Transferred intubated to the CICU. Post-bypass TEE confirmed [no residual MR / trace MR after repair] with well-seated annuloplasty ring / competent prosthetic valve.",
    };
  }

  if (includesAny(name, ["vats", "wedge", "lobectomy", "pneumonectomy"])) {
    return {
      anesthesia: "General endotracheal anesthesia with double-lumen endotracheal tube for single-lung ventilation, arterial line, and epidural / paravertebral block.",
      ebl: "Approximately 100–300 ml.",
      drains: "28 Fr chest tube to the operative hemithorax on -20 cmH2O suction.",
      specimens: "Resected lung / lobe / wedge specimen, with lymph nodes submitted separately by station.",
      disposition: "The patient tolerated the procedure well. Extubated in the OR with stable respiratory status. Admitted to the thoracic step-down unit. Serial chest X-rays, incentive spirometry, early ambulation.",
    };
  }

  if (includesAny(name, ["mediastinoscopy"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Mediastinal lymph nodes from levels [2R, 4R, 4L, 7] sent for pathology.",
      disposition: "The patient tolerated the procedure well. Discharge home the same day or admitted for overnight observation. Return precautions for bleeding, dyspnea, or hoarseness.",
    };
  }

  if (includesAny(name, ["pericardial window"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Minimal.",
      drains: "Pericardial drain to suction.",
      specimens: "Pericardial fluid for cytology, Gram stain, and culture; pericardial tissue biopsy.",
      disposition: "The patient tolerated the procedure well. Admitted for pericardial drain monitoring. Serial echo. Drain removal when output < 50 ml/day.",
    };
  }

  // REVIEW: cardiothoracic attending sign-off needed before residents bill from these.
  if (includesAny(name, ["chest tube", "tube thoracostomy", "pleural drain"])) {
    return {
      anesthesia: "Local anesthesia with sedation.",
      ebl: "Minimal.",
      drains: "28–32 Fr chest tube to underwater seal ± suction.",
      specimens: "Pleural fluid sent for cytology, cell count, gram stain, culture, pH, LDH, protein.",
      disposition:
        "The patient tolerated the procedure well. Admitted for monitoring of drain output and air leak. Plan: serial CXR, drain removal when output < 200 mL/day and no air leak.",
    };
  }

  if (includesAny(name, ["esophagectomy", "ivor lewis", "mckeown", "transhiatal"])) {
    return {
      anesthesia: "General endotracheal anesthesia with double-lumen tube + arterial line + central access + epidural for postoperative analgesia.",
      ebl: "Approximately 300–500 ml.",
      drains: "Right pleural drain (Ivor Lewis), neck drain (McKeown), J-tube for enteral feeds.",
      specimens: "Esophagectomy specimen with regional lymph nodes, oriented for pathology.",
      disposition:
        "The patient tolerated the procedure well. Admitted to the cardiothoracic / surgical ICU. Plan: NG decompression, J-tube feeds advanced per protocol, anastomotic leak surveillance with contrast study POD 5–7, mobilization, multimodal analgesia.",
    };
  }

  if (includesAny(name, ["off-pump", "opcab"])) {
    return {
      anesthesia: "General endotracheal anesthesia with arterial line, PA catheter, TEE.",
      ebl: "Approximately 200–400 ml.",
      drains: "Mediastinal + bilateral pleural drains.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well. Admitted to the cardiothoracic ICU. Plan: serial chest tube outputs, hemodynamic monitoring, antiplatelet/statin per service protocol.",
    };
  }

  if (includesAny(name, ["decortication"])) {
    return {
      anesthesia: "General endotracheal anesthesia with double-lumen tube.",
      ebl: "Approximately 200–500 ml (variable).",
      drains: "Two large-bore (32 Fr) chest tubes — apical and basal.",
      specimens: "Pleural rind / fibrinopurulent peel to pathology + culture.",
      disposition:
        "The patient tolerated the procedure well. Admitted for chest tube management and antibiotics. Plan: tubes to suction, lung re-expansion confirmed on serial CXR, tubes removed when full re-expansion + minimal output.",
    };
  }

  if (includesAny(name, ["heller myotomy", "esophageal myotomy"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Minimal.",
      drains: "None routinely.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well. Admitted overnight. Plan: clear liquids POD 0, advance over 1 week to soft diet, follow-up barium swallow at 4 weeks.",
    };
  }

  return {
    anesthesia: "General endotracheal anesthesia with appropriate monitoring.",
    ebl: "Approximately ________ ml.",
    drains: "[Describe chest tubes and drains].",
    specimens: "[Describe specimens or 'None'].",
    disposition: "The patient tolerated the procedure well. Admitted to the cardiothoracic ICU / step-down per standard service protocol.",
  };
}

export function cardiothoracicFindings(c: CaseLog): string {
  const name = c.procedureName.toLowerCase();

  if (includesAny(name, ["cabg", "coronary artery bypass"])) {
    return `Preoperative cardiac catheterization demonstrated severe triple-vessel coronary artery disease with [__%] stenosis of the LAD, [__%] of the circumflex / OM, and [__%] of the RCA. Preoperative ejection fraction was [__%]. Pre-bypass TEE confirmed preserved biventricular function and no significant valvular disease. Aortic and bicaval cannulation was established without complication. Cardiopulmonary bypass time was [__] minutes and cross-clamp time was [__] minutes. Antegrade and retrograde cold blood cardioplegia was used for myocardial protection. Grafts performed: LIMA to LAD, and saphenous vein grafts to [__, __]. All anastomoses were inspected and were widely patent with good Doppler signals. Weaning from bypass was uneventful. Post-bypass TEE confirmed preserved biventricular function without new wall motion abnormalities.`;
  }

  if (includesAny(name, ["avr", "aortic valve replacement"])) {
    return `Preoperative TTE and catheterization showed severe aortic stenosis with a mean gradient of [__] mmHg, peak velocity [__] m/s, and valve area [__] cm². Preoperative EF was [__%]. The native valve was [tricuspid / bicuspid] and heavily calcified. Pre-bypass TEE confirmed findings. Aortic and bicaval cannulation was performed. Bypass time [__] min, cross-clamp [__] min. Antegrade cold blood cardioplegia. The native valve was excised and the annulus debrided and sized. A [__] mm [manufacturer, bioprosthetic / mechanical] valve was secured with pledgeted 2-0 Ethibond sutures. Post-bypass TEE confirmed a well-seated valve with no paravalvular leak, trace transvalvular gradient, and preserved biventricular function.`;
  }

  if (includesAny(name, ["mvr", "mitral valve"])) {
    return `Preoperative TEE demonstrated severe mitral regurgitation due to [prolapse of P2 / flail posterior leaflet / rheumatic disease / functional MR]. Preoperative EF was [__%]. Pre-bypass TEE confirmed findings. Bypass time [__] min, cross-clamp [__] min, antegrade/retrograde cold blood cardioplegia. Via a left atriotomy through Sondergaard's groove, the mitral valve was exposed and [repaired with a [__] mm Edwards Physio ring and neochordae / replaced with a [__] mm bioprosthetic valve]. Post-bypass TEE confirmed [no residual MR / trace MR] with preserved biventricular function.`;
  }

  if (includesAny(name, ["vats", "wedge", "lobectomy"])) {
    return `The operative lung collapsed well after one-lung ventilation was established. The [right upper / right middle / right lower / left upper / left lower] lobe contained a [__] cm mass consistent with the preoperative imaging, with no gross evidence of pleural or chest wall invasion. Mediastinal and hilar lymph nodes were sampled from stations [__, __, __]. The pulmonary vein, artery, and bronchus were identified, isolated, and divided with endoscopic staplers. The bronchial stump was tested underwater and had no air leak.`;
  }

  if (includesAny(name, ["pneumonectomy"])) {
    return `The [right / left] lung was found to contain a bulky mass with [__] involvement. No gross pleural implants or chest wall invasion were identified. The pulmonary artery, superior and inferior pulmonary veins, and mainstem bronchus were divided in sequence. The bronchial stump was closed with a stapler and buttressed with intercostal muscle / pleural flap and tested underwater without air leak.`;
  }

  if (includesAny(name, ["mediastinoscopy"])) {
    return `The mediastinoscope was advanced along the pretracheal plane and paratracheal / subcarinal lymph node stations were identified and biopsied as indicated. Hemostasis was meticulously confirmed at each station. No great vessel or airway injury was encountered.`;
  }

  if (includesAny(name, ["pericardial window"])) {
    return `A large pericardial effusion was identified on preoperative echo with tamponade physiology. Upon entering the pericardium, [serous / sanguineous / purulent] fluid was drained under pressure with immediate hemodynamic improvement. A pericardial biopsy was obtained. No gross tumor implants were identified on the pericardium.`;
  }

  if (includesAny(name, ["chest tube", "tube thoracostomy", "pleural drain"])) {
    return `[Right / left] [pleural effusion / pneumothorax / hemothorax / empyema] confirmed on preoperative imaging. The pleural space was entered through the [4th/5th] intercostal space at the [mid / anterior / posterior] axillary line. [__] mL of [serous / sanguineous / purulent] fluid was drained. Lung re-expansion was confirmed.`;
  }

  if (includesAny(name, ["esophagectomy", "ivor lewis", "mckeown", "transhiatal"])) {
    return `A [distal / mid / cervical] esophageal mass / Barrett's-related adenocarcinoma was identified, consistent with preoperative endoscopy and staging. The tumor was [resectable] with adequate proximal and distal margins. The conduit (gastric tube / colonic interposition) was viable and reached the planned anastomotic site without tension. Anastomotic leak test was negative. Regional lymph node harvest yielded [__] nodes.`;
  }

  if (includesAny(name, ["off-pump", "opcab"])) {
    return `Severe coronary artery disease was confirmed on preoperative catheterization. The patient was a candidate for off-pump CABG based on stable hemodynamics, target vessel quality, and surgeon experience. Grafts: LIMA → LAD with stabilizer; saphenous vein graft(s) to [target vessels]. All anastomoses were patent with good Doppler signals. Hemodynamic stability was maintained throughout without conversion to on-pump.`;
  }

  if (includesAny(name, ["decortication"])) {
    return `[Right / left] empyema / chronic fibrothorax with a thick fibrinopurulent peel encasing the lung. The pleural rind was systematically stripped from the visceral pleura and the diaphragmatic and mediastinal pleura. Full lung re-expansion was achieved. Cultures were obtained from the pleural fluid + rind. Wound contamination class: III.`;
  }

  if (includesAny(name, ["heller myotomy", "esophageal myotomy"])) {
    return `Achalasia confirmed on preoperative manometry (aperistalsis + non-relaxing LES). The lower esophageal sphincter was identified at the GE junction. A myotomy was performed extending [6 cm] proximal to the GE junction and [2 cm] onto the gastric cardia, with all longitudinal and circular muscle fibers divided to expose the underlying mucosa. No mucosal perforation occurred (confirmed with intraoperative endoscopy / methylene blue test). [A partial fundoplication (Dor or Toupet) was added for reflux prophylaxis.]`;
  }

  return `Preoperative imaging and catheterization findings were reviewed and were consistent with intraoperative findings. Cardiopulmonary bypass (if used) was established and weaned without complication with documented bypass and cross-clamp times. Post-bypass or end-of-case imaging confirmed satisfactory result.`;
}

// ---------------------------------------------------------------------------
// Cardiothoracic Surgery — procedure-specific operative steps.
//
// Covers the high-volume cardiac (CABG, valve replacement) and thoracic
// (VATS/thoracotomy lobectomy, wedge, pneumonectomy, mediastinoscopy)
// cases residents dictate. Tone mirrors standard CT surgical operative
// note conventions with explicit cannulation, ischemic times, and
// rewarming steps.
// ---------------------------------------------------------------------------

function ctOpSteps(c: CaseLog): string[] {
  const name = c.procedureName.toLowerCase();

  // -- CABG ------------------------------------------------------------------
  if (includesAny(name, ["cabg", "coronary artery bypass"])) {
    return [
      `A median sternotomy was performed and the sternum was divided with a sternal saw. A self-retaining sternal retractor was placed.`,
      `The left internal mammary artery (LIMA) was harvested in a [pedicled / skeletonized] fashion from the first intercostal space to its bifurcation, using bipolar cautery and small clips for side branches. Saphenous vein was harvested endoscopically from the leg.`,
      `The pericardium was opened in an inverted-T fashion and tacked up. Heparin was administered ([400 U/kg]) to achieve an ACT >480. The ascending aorta was cannulated with a [22 Fr] arterial cannula and the right atrium with a two-stage venous cannula. Cardiopulmonary bypass was initiated and the patient cooled to [32-34°C].`,
      `The aorta was cross-clamped and antegrade cold blood cardioplegia was delivered via the aortic root, achieving prompt diastolic arrest. Retrograde cardioplegia was administered via the coronary sinus as an adjunct.`,
      `The [LAD, diagonal, obtuse marginal, PDA, RCA] targets were sequentially exposed. Arteriotomies were made and distal anastomoses performed end-to-side with running 7-0 or 8-0 Prolene under loupe magnification. The LIMA was anastomosed to the LAD; saphenous vein grafts were used for the remaining targets. Proximal anastomoses were constructed on a partial side-biting clamp.`,
      `The aorta was de-aired. The cross-clamp was removed (total cross-clamp time: [___] min). Cardiac activity returned. The patient was rewarmed. Pacing wires were placed and bypass was weaned without difficulty. Protamine was administered. Cannulae were removed and purse-string sutures tied.`,
      `Hemostasis was obtained. Mediastinal and pleural drains were placed. The sternum was reapproximated with stainless steel wires, and the wound closed in layers.`,
    ];
  }

  // -- Aortic valve replacement / SAVR ---------------------------------------
  if (includesAny(name, ["avr", "aortic valve replacement"])) {
    return [
      `Median sternotomy was performed. The pericardium was opened and tacked up. Cannulation was performed with an aortic arterial cannula and a two-stage right atrial venous cannula. Heparin was administered to ACT >480 and cardiopulmonary bypass was initiated.`,
      `The aorta was cross-clamped and cardioplegia delivered antegrade via the root and retrograde via the coronary sinus to achieve diastolic arrest. A transverse aortotomy was made above the sinotubular junction.`,
      `The diseased native aortic valve was inspected and excised, with careful decalcification of the annulus. The annulus was sized.`,
      `A [___ mm bovine pericardial / mechanical bileaflet] prosthesis was chosen. Pledgeted 2-0 Ethibond sutures were placed in a non-everting mattress fashion around the annulus and brought through the sewing ring of the valve, which was then parachuted into position and tied. The prosthesis was inspected to ensure unobstructed coronary ostia and free leaflet motion.`,
      `The aortotomy was closed in two layers with 4-0 Prolene. The heart was de-aired and the cross-clamp was removed (total cross-clamp time: [___] min). The patient was rewarmed and weaned off bypass without difficulty. Protamine was given. Hemostasis was confirmed. Drains were placed and sternal closure performed.`,
    ];
  }

  // -- Mitral valve repair/replacement ---------------------------------------
  if (includesAny(name, ["mitral valve", "mvr"])) {
    return [
      `Median sternotomy (or right mini-thoracotomy) was performed and the pericardium opened. Bicaval cannulation was performed along with aortic cannulation. CPB was initiated and the patient cooled. The aorta was cross-clamped with antegrade cardioplegia.`,
      `A left atriotomy was made in the interatrial groove (Sondergaard's) and a self-retaining atrial retractor placed to expose the mitral valve. The valve apparatus was inspected systematically (anterior and posterior leaflet segments A1/A2/A3 and P1/P2/P3, chordae, and subvalvular apparatus).`,
      `${includesAny(name, ["mitral repair", "mitral valvuloplasty"]) ? "A [P2 triangular/quadrangular resection with sliding annuloplasty / edge-to-edge Alfieri / neochord placement with PTFE] repair technique was used, followed by a [36 mm Physio II] annuloplasty ring secured with 2-0 Ethibond interrupted sutures." : "The valve was excised with preservation of the posterior leaflet and chordal apparatus. A [___ mm bioprosthetic / mechanical] valve was sized and seated with pledgeted 2-0 Ethibond sutures in the annulus."}`,
      `Saline test confirmed a competent valve. The left atrium was closed with a double layer of 4-0 Prolene, de-aired, and the cross-clamp removed. Pacing wires placed, rewarming and weaning off CPB without difficulty. Hemostasis, drains, and sternal closure as standard.`,
    ];
  }

  // -- VATS lobectomy / wedge resection --------------------------------------
  if (includesAny(name, ["vats", "thoracoscopic lobectomy", "wedge resection", "lung biopsy"])) {
    const isLob = includesAny(name, ["lobectomy"]);
    return [
      `The patient was positioned in the lateral decubitus position with the operative side up. A double-lumen endotracheal tube was used to allow selective single-lung ventilation.`,
      `A 10 mm camera port was placed at the [7th] intercostal space in the mid-axillary line. Two additional working ports were placed under direct vision: a 4 cm utility incision in the [4th] intercostal space anteriorly and a 10 mm port in the [8th] intercostal space posteriorly.`,
      `The pleural space was inspected. Adhesions were lysed sharply. ${isLob ? "The [right upper / right lower / left upper / lingula / left lower] lobe was mobilized and the fissure was completed with an endostapler. The pulmonary artery branches, bronchus, and pulmonary vein to the lobe were individually dissected, test-clamped, and divided sequentially with vascular and bronchial endostaplers." : "The lesion was identified and a wedge resection was performed using sequential endostapler firings to encompass the nodule with a negative margin."}`,
      `The specimen was placed in a retrieval bag and removed through the utility incision. A systematic mediastinal lymph node sampling / dissection was performed of stations [__, __, __]. Hemostasis and air leak were checked with underwater testing.`,
      `A [24 Fr] chest tube was placed through the camera port site and directed apically and posteriorly. The lung was re-expanded under direct vision. The port sites were closed in layers.`,
    ];
  }

  // -- Open thoracotomy lobectomy / pneumonectomy ----------------------------
  if (includesAny(name, ["thoracotomy", "open lobectomy", "pneumonectomy"])) {
    const isPneumo = includesAny(name, ["pneumonectomy"]);
    return [
      `The patient was positioned in the lateral decubitus position. A posterolateral thoracotomy incision was made and dissection carried through the latissimus dorsi and serratus anterior. The chest was entered through the [5th] intercostal space and a Finochietto rib spreader was placed.`,
      `The lung was mobilized by taking down the inferior pulmonary ligament and the pleural reflections. ${isPneumo ? "The hilum was encircled and the pulmonary artery was dissected, test-clamped, and divided with a vascular stapler. The superior and inferior pulmonary veins were sequentially divided with stapler loads. Finally, the mainstem bronchus was skeletonized, stapled, and divided flush with the carina. The bronchial stump was buttressed with a pleural flap." : "The [target] lobe was mobilized. The fissure was completed with electrocautery and stapling. The lobar pulmonary artery, vein, and bronchus were individually dissected and divided with vascular and bronchial staplers."}`,
      `The specimen was removed from the chest and sent for pathology. A complete mediastinal lymph node dissection was performed. Hemostasis was confirmed and an underwater air-leak test was performed.`,
      `${isPneumo ? "No chest tube was placed on the pneumonectomy side (or a balanced-drainage tube was placed per surgeon preference)." : "Two chest tubes (one apical, one basal) were placed and secured."} The thoracotomy was closed in layers with pericostal 0 Vicryl sutures, muscle reapproximation, and subcuticular skin closure.`,
    ];
  }

  // -- Mediastinoscopy -------------------------------------------------------
  if (includesAny(name, ["mediastinoscopy"])) {
    return [
      `The patient was positioned supine with a shoulder roll and the neck extended. A small transverse cervical incision was made above the sternal notch. Dissection was carried through the platysma and the strap muscles were separated in the midline.`,
      `The pretracheal fascia was opened and blunt finger dissection was used to create a plane along the anterior trachea down into the mediastinum. A mediastinoscope was advanced under direct vision.`,
      `Lymph node stations [2R, 2L, 4R, 4L, 7] were sampled with cup biopsy forceps after aspiration with a long needle to exclude vascular structures. Specimens were sent for pathology. Hemostasis was confirmed.`,
      `The scope was withdrawn. The strap muscles were reapproximated with 3-0 Vicryl, platysma with 4-0 Vicryl, and skin with 5-0 Monocryl subcuticular.`,
    ];
  }

  // -- Pericardial window ----------------------------------------------------
  if (includesAny(name, ["pericardial window", "subxiphoid"])) {
    return [
      `A subxiphoid incision was made and carried down through the linea alba. The xiphoid process was retracted superiorly and the pericardium identified.`,
      `The pericardium was grasped with Allis clamps, tented up, and opened sharply. Pericardial fluid was encountered and sent for cytology and microbiology. A [5 × 5 cm] rectangular window was excised and sent for pathology.`,
      `A pericardial drain was placed through the window and tunneled through a separate stab incision. The fascia and skin were closed in layers.`,
    ];
  }

  // -- Chest tube ------------------------------------------------------------
  if (includesAny(name, ["chest tube", "tube thoracostomy", "pleural drain"])) {
    return [
      `Indication was confirmed: pneumothorax (simple, tension after needle decompression, traumatic, recurrent), pleural effusion (transudative, exudative, malignant — Light's criteria reviewed), hemothorax (traumatic — > 1500 mL initial output or > 200 mL/h × 4 h indicates urgent thoracotomy per ATLS), empyema (Class III thick fibropurulent — chest tube + intrapleural fibrinolytics per MIST-2 trial), or chylothorax. Tube size selected per indication: 14-16 Fr small-bore pigtail for simple pneumothorax or transudate (per BTS guidelines, equivalent outcomes to large-bore with less pain); 28 Fr for moderate effusion; 32 Fr for hemothorax or empyema (large-bore needed for thicker fluid). Coagulation was confirmed (INR < 1.5, platelets > 50,000 — emergent placement may proceed despite coagulopathy with simultaneous correction).`,
      `Patient positioning: supine with head of bed at 30-45°; ipsilateral arm raised over head exposing the lateral chest wall and "safe triangle" — bordered anteriorly by the lateral pectoralis major, posteriorly by the anterior latissimus dorsi, inferiorly by the line through the level of the nipple (5th intercostal space) — this triangle avoids the long thoracic nerve, internal mammary artery, and diaphragm. Surgical time-out was performed confirming side, indication, and recent imaging.`,
      `Sterile preparation was performed with chlorhexidine and the area was widely draped. Local anesthesia with 1% lidocaine + epinephrine 5-10 mL was infiltrated subcutaneously, into the intercostal muscle (over the SUPERIOR border of the rib below to avoid the intercostal neurovascular bundle which runs at the inferior rib border), and into the parietal pleura (parietal pleura has somatic innervation and is highly pain-sensitive — adequate anesthesia critical). The needle was advanced over the rib until aspiration of air or fluid confirmed pleural entry, then anesthesia delivered.`,
      `A 3 cm transverse skin incision was made one intercostal space below the planned tube insertion site (allowing the tube to traverse a soft tissue tunnel as a flutter valve). Blunt dissection with a Kelly clamp was carried down through the subcutaneous tissue and intercostal muscles, hugging the superior border of the rib below to avoid the neurovascular bundle. The parietal pleura was entered with a controlled "pop" sensation; air or fluid escaped confirming entry.`,
      `A finger sweep was performed through the pleural opening to: (1) confirm pleural entry rather than subcutaneous or extrapleural placement (the fingertip should feel lung tissue); (2) detect any visceral or parietal pleural adhesions that might require lysis or alternative entry site; (3) sweep the tube path free of obstructions. The chest tube was guided into the pleural space through the dissected tract, directed apically and posteriorly for pneumothorax (apex is highest in supine patient) or posteriorly and inferiorly for pleural effusion/blood (drains gravity-dependent fluid). All fenestrations on the tube were confirmed within the pleural space (last fenestration ~3-5 cm from the tip — the proximal fenestration must be intrapleural; markers on the tube assist).`,
      `The tube was secured to the skin with two anchor stitches: a "stay" stitch (0 silk vertical mattress through the dermis on each side of the wound) prevents tube dislodgement; an "air knot" / purse-string stitch is placed at the wound edge for closure at tube removal. The wound was closed with simple interrupted 2-0 silk sutures. The tube was connected to a closed underwater-seal drainage system (Pleur-Evac or Atrium Express): -20 cmH2O suction for pneumothorax with persistent air leak; water seal alone (-2 cmH2O) for resolved leak or simple effusion; consider chest drain digital monitoring system (Topaz, Sahara) for objective air leak quantification.`,
      `Sterile occlusive dressing (petrolatum gauze + dry gauze + tegaderm) was applied. Post-insertion portable upright CXR was obtained immediately to confirm: (1) tube position (last fenestration intrapleural); (2) lung re-expansion; (3) no acute complication (mediastinal shift, contralateral injury). Post-procedural management: serial CXR at 4-6 h then daily; output (volume, character) tracked q4h; air leak assessment (continuous, intermittent with cough only, none); transition from suction to water seal once lung fully re-expanded and air leak resolved or < 100 mL/h fluid output. Tube removal at peak inspiration or peak expiration with breath-hold (controversial — most evidence supports no difference) once: (a) no air leak × 12-24 h on water seal; (b) output < 200 mL/24 h non-chylous, non-bloody; (c) lung fully re-expanded on CXR. Removed dressing applied. Follow-up CXR at 4-6 h post-removal to rule out recurrent pneumothorax.`,
    ];
  }

  // -- Esophagectomy (Ivor Lewis / McKeown / transhiatal) -------------------
  if (includesAny(name, ["esophagectomy", "ivor lewis", "mckeown", "transhiatal"])) {
    const isIL = name.includes("ivor") || name.includes("lewis");
    const isMcKeown = name.includes("mckeown") || name.includes("3-stage") || name.includes("three stage");
    const isTHE = name.includes("transhiatal") || name.includes("the");
    return [
      `Preoperative workup confirmed: histologic diagnosis of esophageal cancer (adenocarcinoma 70% — typically distal, GE junction; squamous cell carcinoma 30% — typically mid-thoracic), staging EUS + CT-PET + bronchoscopy, multidisciplinary tumor board review, neoadjuvant chemoradiation completed (CROSS regimen — carboplatin + paclitaxel + 41.4 Gy radiation, with restaging CT-PET at 6 weeks post-completion), nutritional optimisation (J-tube placement preoperatively if required for nutrition during neoadjuvant therapy), pulmonary optimisation (cessation of smoking ≥ 4 weeks preop, pulmonary rehab, incentive spirometry training). Approach was selected: ${isIL ? "Ivor-Lewis transthoracic for distal esophageal/GE junction tumors with intrathoracic anastomosis" : isMcKeown ? "McKeown 3-field for mid-thoracic tumors requiring complete thoracic + cervical mobilisation with cervical anastomosis" : isTHE ? "transhiatal for select distal cancers with surgeon comfort with blunt thoracic dissection (without thoracotomy — lower pulmonary morbidity, but limited thoracic lymph node yield)" : "approach individualised to tumor location and surgeon experience"}.`,
      `Patient positioning: ${isIL ? "supine for laparoscopy/laparotomy phase, then re-positioned to left lateral decubitus for right thoracotomy/VATS phase" : isMcKeown ? "supine for laparoscopy, left lateral decubitus for thoracotomy, then supine for cervical phase — three-position case" : "supine with the neck extended for combined abdominal + cervical access"}. Double-lumen ETT for single-lung ventilation during the thoracic phase. Thoracic epidural for postoperative analgesia. Arterial line + central access. Antibiotic prophylaxis (cefazolin + metronidazole or piperacillin-tazobactam). Multimodal DVT prophylaxis (SCDs + LMWH).`,
      `ABDOMINAL PHASE: ${name.includes("laparoscopic") || name.includes("minimally") ? "Pneumoperitoneum was established. Five ports were placed: 12 mm camera supraumbilical, 5 mm right and left mid-clavicular subcostal, 12 mm right paramedian, Nathanson liver retractor at subxiphoid." : "Upper midline laparotomy."} The abdomen was systematically explored for occult metastasis (peritoneum, liver surface, omental implants, gastrohepatic and celiac nodes). Frozen section of any suspicious lesion was obtained — positive metastasis aborted the resection.`,
      `Gastric conduit preparation (the most critical surgical step — conduit viability dictates anastomotic integrity): the lesser sac was entered. The greater curvature was mobilised with care to PRESERVE the right gastroepiploic artery (the dominant blood supply to the gastric tube post-resection — must be preserved end-to-end from the pylorus distally throughout the conduit). Short gastric vessels were divided. The left gastric artery and coronary vein were exposed at the celiac axis, ligated, and divided at their origin (this provides oncologic D2 lymph node dissection — celiac, common hepatic, splenic node stations). The right gastric artery may be preserved or divided depending on conduit length needs.`,
      `The diaphragmatic crura were exposed. The hiatus was opened by dividing the phrenoesophageal ligament. The distal esophagus was mobilised within the abdomen. A Kocher maneuver was performed to mobilise the duodenum, with consideration of pyloroplasty / pyloromyotomy (controversial — meta-analysis shows reduced delayed gastric emptying with pyloric drainage but no impact on overall outcomes; many surgeons now omit) — when performed, a Heineke-Mikulicz transverse pyloroplasty was created with 3-0 Vicryl interrupted Lembert sutures.`,
      `The gastric tube was created with sequential linear stapler firings (60 mm Endo GIA blue/black load) starting at the lesser curvature distal to the right gastric vessels and progressing along the lesser curvature toward the angle of His, creating a tubularised conduit 4-5 cm in diameter (narrower conduits have less anastomotic complications and improved emptying — newer data favors narrow conduit ≤ 4 cm). The conduit length and viability were inspected — well-perfused gastric tube with arterial pulsations through the right gastroepiploic, no ischemic mottling. ICG fluorescence imaging (when available) was used to confirm conduit perfusion at the planned anastomotic site.`,
      `${isIL ? `THORACIC PHASE (Ivor-Lewis): The patient was repositioned to left lateral decubitus. Right thoracotomy at the 5th interspace (or VATS through 4-5 ports including 4 cm utility incision at the 4th interspace anteriorly). The mediastinal pleura was opened. The azygos vein was identified, ligated with vascular stapler, and divided to expose the entire intrathoracic esophagus. The thoracic esophagus was mobilised en bloc with the surrounding mediastinal lymph nodes (paraesophageal, paratracheal, subcarinal stations 4R, 7, 8 — minimum 15 nodes per AJCC for adequate staging). The gastric conduit was delivered into the chest through the hiatus. The proximal esophagus was transected ≥ 5 cm above the proximal tumor margin (frozen section confirmed negative margin). The intrathoracic anastomosis was created — preferred technique is end-to-side circular stapled (25-28 mm EEA) with the anvil in the proximal esophagus and the stapler advanced through a gastrotomy in the conduit; alternatively side-to-side linear stapled (Orringer technique modified — ~70% reduction in stricture rate vs end-to-side); rarely hand-sewn 2-layer. The gastrotomy was closed transversely with linear stapler. NG tube was advanced across the anastomosis under direct vision. ICG fluorescence (when available) confirmed anastomotic perfusion. A 28 Fr chest tube was placed apically, and a 19 Fr Blake drain was placed near the anastomosis.` : ""}${isMcKeown ? `THORACIC PHASE (McKeown — same as Ivor Lewis intrathoracic mobilisation but no anastomosis): the entire thoracic esophagus was mobilised + lymph node dissection. The esophagus was passed up to the cervical dissection rather than transected in the chest. CERVICAL PHASE: A left cervical oblique incision (anterior to the SCM) was made. The platysma was divided. The omohyoid was retracted. The carotid sheath was retracted laterally and the trachea medially. The recurrent laryngeal nerve was identified in the tracheoesophageal groove and protected (RLN palsy is the major morbidity of cervical anastomosis, 5-10% incidence — meticulous dissection essential). The cervical esophagus was mobilised circumferentially. The thoracic esophagus was delivered up through the cervical wound. The gastric conduit was delivered through the posterior mediastinum (or anterior substernal — alternative route) into the neck. The cervical anastomosis was created hand-sewn 2-layer (Orringer end-to-side stapled is alternative — equivalent leak rate but lower stricture rate). A neck drain was placed.` : ""}${isTHE ? `TRANSHIATAL APPROACH (no thoracotomy — blunt mediastinal mobilisation): the thoracic esophagus was bluntly mobilised through the hiatus from below using progressive blunt dissection along the esophagus, and from the cervical incision above using finger dissection downward — the dissection planes meet in the mid-thorax. This blunt mobilisation has limited oncologic lymph node yield (no formal mediastinal dissection) and risk of major thoracic vessel injury (azygos, aorta) but avoids thoracotomy morbidity. Cervical anastomosis was created as for McKeown.` : ""}`,
      `Feeding J-tube was placed (10-12 Fr Witzel-tunnelled jejunostomy 30 cm distal to the ligament of Treitz, secured to the abdominal wall with anchor stitches and brought through a separate stab incision). NG tube was confirmed in correct position (across anastomosis or just proximal in the conduit per surgeon preference). All wounds were closed. Counts confirmed correct.`,
      `Postoperative pathway: ICU admission for 24-48 h with extubation per pulmonary status. NG tube to gravity drainage × 5-7 days. NPO until POD 5-7 with esophagram (water-soluble contrast then thin barium) ruling out anastomotic leak — leak rate 5-15% intrathoracic, 10-25% cervical (cervical leaks managed conservatively with neck drainage usually heal; intrathoracic leaks are catastrophic and may require thoracotomy + diversion + esophageal stent). Clear liquids POD 5-8 if no leak, advance to soft diet over 4 weeks. J-tube feeds during the NPO period maintain nutrition. Postop complications: pulmonary (pneumonia 20-30%, ARDS 5-10% — major mortality contributor), anastomotic leak, conduit ischemia (1-3% requires re-do), chylothorax, RLN palsy (5-10%), DVT/PE (5%). Long-term: dumping syndrome 30-50%, dysphagia from stricture (anastomotic stricture 30-40% — needs serial endoscopic dilation), reflux 80% (PPI lifelong), 50% 5-year survival for stage III after neoadjuvant + surgery.`,
    ];
  }

  // -- Off-pump CABG ---------------------------------------------------------
  if (includesAny(name, ["off-pump", "opcab"])) {
    return [
      `OPCAB candidacy was reviewed: stable hemodynamics for tolerating cardiac displacement during anastomosis (LV ejection fraction > 30% preferred); favorable coronary targets (graftable LAD essential — dominant target for OPCAB; complex distal LAD or intramural targets less suitable); no severe LMS disease with hemodynamic compromise (severe LMS may require IABP support or favor on-pump); surgeon experience with off-pump techniques (significant learning curve, operator-dependent outcomes per ROOBY trial — outcomes equivalent at 1 year only with experienced surgeons). The patient was positioned supine on a heat-loss-prevention warming blanket. Arterial line, central venous access, PA catheter, and TEE were placed. SCD + standard skin prep + drape. Antibiotic prophylaxis (cefazolin 2-3 g IV based on weight + vancomycin if MRSA risk).`,
      `Median sternotomy was performed with a sagittal saw. The sternum was retracted with a Finochietto retractor. The pericardium was opened in an inverted-T fashion and tacked up with stay sutures, with care to elevate the pericardial cradle to maximise cardiac exposure for off-pump anastomosis.`,
      `Left internal mammary artery (LIMA) harvest was performed first — this conduit is the gold standard for the LAD with > 90% 10-year patency. The LIMA was harvested in a pedicled fashion (preserving the surrounding fascia + vein + fat — provides robust vasculature and easier handling) or skeletonised (free of surrounding tissue — 5-10% longer reach + reduced sternal devascularisation but technically more demanding). The LIMA was inspected for spasm/atherosclerosis and confirmed to have brisk pulsatile flow. The distal end was prepared (clip + sharp transection at the planned distal anastomotic length).`,
      `Saphenous vein was harvested (typically endoscopically through 1-2 small leg incisions for cosmesis + reduced wound complications) — 10-15% lower long-term patency than EVH vs open harvest per ROOBY-FS trial (though absolute difference small). Vein was prepared on the back table: tributaries ligated with 4-0 silk close to the wall, vein flushed with heparinised saline, intimal injuries inspected. Total length harvested as needed for planned grafts (typically 30-60 cm).`,
      `Heparin was administered (200-300 U/kg, lower than full bypass dose of 400 U/kg) targeting ACT > 300 seconds (vs > 480 for on-pump). The target vessels were sequentially exposed using cardiac positioner (Medtronic Octopus, Genzyme XPose 4) suction stabilisers + apical positioner — these allow displacement of the beating heart while maintaining stable myocardial wall for anastomosis. The patient was placed in steep Trendelenburg + tilted right-side-up to maximise venous return during cardiac displacement.`,
      `Each distal anastomosis was performed sequentially. For each target: a coronary stabiliser (Octopus) was placed across the target vessel to immobilise the local epicardium. The vessel was inspected and a coronary occlusion shunt (3M Flo-Thru — 1.5-3 mm intraluminal silastic) was placed during arteriotomy to: (1) maintain distal myocardial perfusion during anastomosis (reduces ischemic time), (2) prevent backbleeding during anastomosis. The arteriotomy was made with a #11 blade, extended with Potts scissors. The distal anastomosis was constructed end-to-side with running 7-0 or 8-0 Prolene under loupe magnification (×3.5-4.5) using the parachute technique. Shunt was removed just before final tying. After completion, the anastomosis was inspected for hemostasis and Doppler signal confirmed (transit-time flow meter — VeriQ — mean graft flow > 15 mL/min, pulsatility index < 5 indicates adequate graft).`,
      `Sequential anastomoses: LIMA → LAD (always first when feasible); SVG to remaining targets (diagonal, OM1/OM2, PDA, PLB) in order of accessibility and clinical priority. For sequential SVG: side-to-side anastomosis to the first target, then end-to-side to the second target — provides 2 distal anastomoses with one proximal anastomosis on the aorta (reduces aortic manipulation and atheroembolic risk).`,
      `Proximal anastomoses to the ascending aorta were created using a partial side-biting Lambert-Kay clamp on the aorta (intermittent rather than full clamping to reduce embolic risk). Aortic punch holes were made with a 4-5 mm aortic punch. Proximal anastomoses constructed with running 5-0 or 6-0 Prolene parachuted into position.`,
      `Anastomotic patency confirmation: transit-time flow measurement on each completed graft confirmed adequate flow + pulsatility. Intraoperative TEE confirmed no new wall motion abnormalities (would suggest graft failure or distal embolisation requiring revision). Hemodynamic stability was maintained throughout — conversion to on-pump was prepared but not required (5-10% conversion rate even in experienced hands). Protamine was administered (1:1 with heparin) for full reversal.`,
      `Hemostasis was meticulously confirmed at all anastomotic sites. Mediastinal and bilateral pleural drains (32 Fr) were placed. Temporary epicardial pacing wires were placed (atrial × 2 + ventricular × 2). The sternum was reapproximated with stainless steel wires (5-7 wires through the sternum). Subcutaneous tissue closed with 0 Vicryl, skin with running 4-0 Monocryl. Postop: cardiac ICU 24-48 h, early extubation (often 4-8 h post-OR), aspirin 81 mg + statin (atorvastatin 80 mg) lifelong, beta-blocker, surveillance for postoperative AF (~30%). 30-day mortality 1-2%, 5-year survival 80-90% for elective CABG.`,
    ];
  }

  // -- Decortication ---------------------------------------------------------
  if (includesAny(name, ["decortication"])) {
    return [
      `Indication was reviewed: empyema thoracis (Class III thick organising stage with trapped lung and fibrinopurulent rind — beyond effective tube drainage + intrapleural fibrinolytics from Class I-II), chronic fibrothorax with pleural restriction (post-trauma, post-radiation, post-tuberculosis, post-PE with restrictive pattern + lung trapped under thick visceral pleural peel), or malignant pleural mesothelioma (rare — requires extrapleural pneumonectomy or pleurectomy/decortication with multi-modality therapy). Preoperative imaging: CT chest with contrast assessed pleural thickness, loculation, chest wall invasion, lung trapping; PET-CT for malignancy; bronchoscopy ruled out endobronchial obstruction. Cultures from prior thoracentesis or chest tube guided antibiotic selection. Patient was hemodynamically optimised; anticoagulation reversed; antibiotics tailored to culture (typical empyema organisms: Streptococcus anginosus group, anaerobes, MSSA, gram-negatives — broad coverage with piperacillin-tazobactam or vanco + meropenem until cultures finalise).`,
      `Patient positioning: lateral decubitus with operative side up, axillary roll, table flexed at the costo-iliac angle to widen the intercostal spaces. Double-lumen endotracheal tube for selective single-lung ventilation (the affected lung must be deflated for safe entry, but cannot be reliably deflated if pleural rind is severe — sometimes requires bronchial blocker or spontaneous ventilation strategies). Thoracic epidural placed for postoperative analgesia. Antibiotic prophylaxis continued therapeutically.`,
      `${name.includes("vats") || name.includes("thoracoscopic") ? "VATS approach (preferred for early Class III empyema with thinner peel, less mature fibrosis — feasibility 60-80%, with conversion to thoracotomy as needed): three ports placed — 10 mm camera at 7th-8th interspace mid-axillary, 4 cm utility port at 4th-5th interspace anterior axillary, 10 mm port at 8th-9th posterior. Single-lung ventilation initiated. Adhesions broken down sharply with cold scissors and energy device." : "Thoracotomy approach (gold standard for thick mature peel, post-tuberculous fibrothorax, or after failed VATS): standard posterolateral thoracotomy at the 5th-6th interspace was performed, with division of the latissimus dorsi (with consideration of muscle preservation per Bethencourt for cosmesis), serratus anterior split. The chest was entered through the bed of the 5th rib, with rib resection if needed for exposure (typically 5th or 6th rib resection 2-3 cm subperiosteally for adequate exposure). Finochietto rib spreader placed."} The pleural space was entered through the thickened parietal pleura. The pleural cavity was cautiously explored — the trapped lung was identified with its overlying fibropurulent peel.`,
      `Pleural fluid evacuation: any remaining fluid was suctioned and sent for culture (aerobic + anaerobic + AFB + fungal + cytology). Loculations were broken down with finger dissection or sharp scissors. Pleural biopsies were taken for histopathology and culture (excluding malignancy or TB).`,
      `Decortication of the visceral pleura — the critical surgical step: the fibrinopurulent peel was systematically stripped from the visceral pleura, working from the easier areas (diaphragmatic surface, mediastinal surface) to the more difficult (apical, fissural). Technique: a plane was developed between the peel and the underlying visceral pleura using a combination of (1) sharp dissection with a #15 blade or curved Mayo scissors at the leading edge to elevate the peel; (2) blunt finger dissection to develop the plane in less adherent areas; (3) Yankauer suction tip used as a blunt dissector; (4) Kittner peanuts. The visceral pleura must be preserved as much as possible — intentional violation creates persistent air leaks (the most common complication, 30-50% incidence). Small parenchymal leaks were oversewn with 4-0 Vicryl figure-of-eight sutures or pledgeted; sealants (TissuePatch, FloSeal) applied. Pleural fissures were systematically opened to fully expose the lung surfaces and allow complete decortication.`,
      `Decortication of the parietal pleura: the parietal peel (covering chest wall, diaphragm, mediastinum) was less critical for lung re-expansion but was stripped from the chest wall in cases of chronic fibrosis to permit chest wall mobility. The diaphragmatic surface was particularly important to clear to permit normal respiratory mechanics. Care was taken not to injure the phrenic nerve along the mediastinal surface or the intercostal vessels along the chest wall.`,
      `Lung re-expansion testing: the operative lung was re-expanded with progressive ventilation. Adequate re-expansion was confirmed by direct visualisation of the lung filling the entire pleural space without residual space. Underwater air leak test: the chest was filled with saline, the lung ventilated, and any air leaks identified by bubbling and treated with sutures + sealants. Persistent air leak after these maneuvers required visceral pleural reinforcement (pleural tent, omental flap, intercostal muscle flap).`,
      `Drainage: two large-bore (32 Fr) chest tubes were placed — one apical (for residual air) and one basal (for fluid drainage), positioned to remove any residual fluid + trapped air during the postoperative recovery. Tubes were brought through separate stab incisions and connected to underwater seal with -20 cmH2O suction. Both tubes were tunneled subcutaneously to allow soft tissue tract for closure. The thoracotomy was closed in layers: pericostal sutures with 0 Vicryl figure-of-eight (with care to keep neurovascular bundle within the suture but not compressed), serratus anterior reapproximated with 0 Vicryl running, latissimus with 0 Vicryl, subcutaneous 3-0 Vicryl, skin 4-0 Monocryl subcuticular.`,
      `Postoperative pathway: thoracic step-down or ICU × 24-48h. Aggressive pulmonary toilet (incentive spirometry q1h while awake, IS-cough-deep breathing, early ambulation, mucolytics). Multimodal analgesia (epidural, intercostal blocks, scheduled NSAIDs/acetaminophen, opioid sparing). Antibiotics tailored to culture, typical course 2-4 weeks for empyema (longer for TB). Chest tube management: tubes typically removed 5-10 days postop when no air leak + < 200 mL/24 h drainage. Common complications: persistent air leak 30-50% (managed with prolonged tube, +/- chemical pleurodesis, +/- Heimlich valve outpatient management); empyema recurrence 5-10%; mortality 2-5% for VATS, 5-10% for thoracotomy. Long-term outcomes: improved lung function, reduced restriction, return to baseline activities at 8-12 weeks.`,
    ];
  }

  // -- Heller myotomy --------------------------------------------------------
  if (includesAny(name, ["heller myotomy", "esophageal myotomy"])) {
    return [
      `Diagnostic workup confirmed achalasia: upper endoscopy ruled out pseudoachalasia from cancer at GE junction; esophagram showed 'bird's beak' deformity with dilated proximal esophagus; HRM (high-resolution manometry) confirmed achalasia subtype per Chicago Classification 4.0 — Type I (classical, no pressurisation, smaller esophageal dilation, best surgical response 95%), Type II (pan-esophageal pressurisation, best response to all therapies including pneumatic dilation and POEM), Type III (spastic, premature contractions, worst response with persistent dysphagia rate 30-40%, may favor longer myotomy or POEM). Other workup: timed barium swallow for objective dysphagia assessment; preoperative discussion regarding alternatives (POEM — peroral endoscopic myotomy, equivalent outcomes per RCT; pneumatic dilation — stepwise pneumatic dilation of LES). Antibiotic prophylaxis (cefazolin 2 g IV) given.`,
      `Patient positioning: supine in low lithotomy with the surgeon between the legs (French position) for laparoscopic approach. Foley catheter placed. The abdomen prepped from nipples to mid-thigh and draped. Pneumoperitoneum was established to 15 mmHg via Veress at Palmer's point or supraumbilical Hasson. Five ports placed in standard French configuration (similar to fundoplication): 12 mm supraumbilical (camera, slightly to left of midline), 5 mm right and left subcostal mid-clavicular, 5 mm left lateral subcostal (assistant), Nathanson liver retractor at subxiphoid.`,
      `The Nathanson retractor was placed and the left lobe of the liver retracted superiorly to expose the gastrohepatic ligament and GE junction. The pars flaccida was opened to enter the lesser sac. The right and left crura were identified. The phrenoesophageal ligament was incised circumferentially around the esophagus. The mediastinal esophagus was mobilised within the chest for 5-6 cm above the GE junction by gentle blunt dissection (the longitudinal muscle of the esophagus must be preserved during mobilisation — the myotomy will divide it later; preserving the adventitial layer maintains the anatomic plane).`,
      `Exposure of the GE junction: the esophagus was retracted to the left to expose its right anterolateral surface (where the myotomy will be placed). A short anterior fat pad covering the GE junction (located along the anterior surface) was carefully dissected and reflected — this exposes the underlying longitudinal and circular muscle fibers. The anterior vagus nerve (typically running along the anterior esophagus) was identified and preserved by lateralising it during the myotomy.`,
      `The myotomy was performed using a hook cautery on low setting (15-20 W, monopolar) with intermittent application of bipolar cautery for hemostasis on submucosal vessels (extensive cautery near mucosa risks delayed perforation): the longitudinal muscle layer was first identified and divided over the GE junction. The dissection was developed in the submucosal plane between the inner circular muscle and the underlying mucosa — recognised by its thin, glistening appearance in contrast to the more robust muscle layers. The circular muscle was then divided over a 6 cm length proximal to the GE junction (extending well above the lower esophageal sphincter — inadequate proximal extension is the most common cause of persistent dysphagia after Heller myotomy).`,
      `The myotomy was extended distally onto the gastric cardia for 2-3 cm — this is essential to disrupt the pinch-cock effect of the gastric sling fibers and the LES. The transition from esophagus to stomach was identified by the change from a smooth muscle layer to the thicker, more muscular gastric body and by the appearance of stomach mucosa (yellower, more vascular than the pinker esophageal mucosa). The myotomy was completed by ensuring divided fibers were lateralised to expose ≥ 50% of the underlying mucosa circumference for the entire myotomy length.`,
      `Mucosal integrity testing was the most critical step: the table was tilted into Trendelenburg, the GE junction submerged in irrigation, and the mucosa insufflated with air via the OG tube — any bubbles indicated mucosal perforation requiring immediate repair. Alternatively (and complementarily), intraoperative endoscopy was performed with attention to the myotomy from the lumen: complete circular muscle division was visualised as a 'bulge' of mucosa into the lumen at the myotomy site, with the GE junction crossing easily without resistance. Methylene blue test instillation was historically used but largely replaced by air insufflation. Mucosal perforations (3-5% incidence) identified intraoperatively were repaired with interrupted 4-0 Vicryl seromuscular sutures + omental patch — recognised intraoperatively, leaks heal without sequelae; missed leaks cause delayed perforation with mediastinitis (catastrophic).`,
      `Antireflux procedure (essential — Heller alone causes severe GERD in 50-70% of patients; partial fundoplication reduces this to 5-15% per Richards meta-analysis): a partial fundoplication was added — anterior Dor (180°) preferred for protection of the exposed mucosa post-myotomy, with the wrap covering the myotomy site; posterior Toupet (270°) provides better reflux protection but the wrap does not cover the myotomy bed. ${name.includes("dor") ? "Dor anterior 180° fundoplication: the gastric fundus was passed over the anterior surface of the esophagus and the right limb of the wrap was secured to the right crus and the right side of the esophagus with 2-0 Ethibond interrupted sutures, then the left limb was secured to the left side. The wrap covered the entire myotomy bed." : "Toupet posterior 270° fundoplication: the fundus was passed posterior to the esophagus, with right and left limbs secured to the right and left anterolateral esophagus respectively, leaving the anterior 90° uncovered."} Nissen 360° wrap was avoided — causes severe postoperative dysphagia in achalasia patients due to inadequate esophageal motility to overcome the wrap.`,
      `Pneumoperitoneum was released and ports removed under direct vision. 12 mm fascia closed with 0 Vicryl Carter-Thomason; 5 mm at skin with 4-0 Monocryl. NG tube was kept overnight + advanced to clear liquids on POD 0 if no concerns. UGI series with water-soluble contrast on POD 1 confirmed: (1) no extravasation (excluding leak); (2) widely patent GE junction with rapid emptying. Soft diet × 1 week, then advance per tolerance over 2 weeks. Long-term outcome: > 90% improvement in dysphagia at 1-2 years for Type I/II achalasia; persistent dysphagia 10-15%, GERD 10-15% requiring PPI, recurrence 5-10% at 5 years requiring repeat intervention. Follow-up: timed barium swallow + symptom assessment at 3 months, 6 months, then annually.`,
    ];
  }

  // Generic CT fallback
  return [
    `The chest was entered using the planned approach with meticulous attention to single-lung ventilation, hemodynamic monitoring, and anticoagulation management. The ${c.procedureName} was performed with close collaboration between the surgical and anesthesia teams. [Expand with procedure-specific technical steps, including cannulation, cross-clamp, and bypass details where applicable.]`,
    ``,
    `Hemostasis was confirmed at the end of the procedure. Drains and chest tubes were placed as indicated, and the chest was closed in anatomic layers.`,
  ];
}

export function cardiothoracicBody(c: CaseLog): string[] {
  const preamble = [
    `Description of Procedure: Risks, benefits, and alternatives were discussed with the patient, and informed consent was obtained. The patient was brought to the operating room and positioned [supine for median sternotomy / lateral decubitus for thoracotomy or VATS]. After induction of general endotracheal anesthesia with [single-lumen / double-lumen] intubation, arterial and central venous access were obtained. Pre-incision antibiotics were administered.`,
    ``,
    `A surgical time-out was completed confirming patient identity, procedure, site, laterality, consent, antibiotics, blood products, and availability of bypass / ECMO support as applicable. The chest was prepped and draped in the usual sterile fashion.`,
    ``,
  ];
  const closure = [
    ``,
    `Hemostasis was confirmed, sponge and instrument counts were correct, and the patient was transferred to the ICU in stable condition, intubated and monitored.`,
  ];
  return [...preamble, ...ctOpSteps(c), ...closure];
}
