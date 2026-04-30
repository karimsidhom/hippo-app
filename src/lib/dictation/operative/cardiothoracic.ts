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
      `Under sterile conditions and after local anesthesia with 1% lidocaine, a 3 cm transverse incision was made over the [4th/5th] intercostal space at the [mid-axillary] line on the [right/left].`,
      `Blunt dissection was carried down to the parietal pleura with a Kelly clamp, hugging the superior border of the rib to avoid the neurovascular bundle. A finger sweep confirmed entry into the pleural space.`,
      `A 28–32 Fr chest tube was advanced into the pleural space, directing the tip apically (for pneumothorax) or posteriorly/inferiorly (for effusion). The tube was secured to the skin with a 0 silk anchoring + air-knot suture and connected to underwater seal ± suction.`,
      `Post-insertion CXR confirmed appropriate placement and lung re-expansion.`,
    ];
  }

  // -- Esophagectomy (Ivor Lewis / McKeown / transhiatal) -------------------
  if (includesAny(name, ["esophagectomy", "ivor lewis", "mckeown", "transhiatal"])) {
    return [
      `The abdomen was entered (laparotomy or laparoscopy) and the gastric conduit prepared: greater curvature mobilised, short gastrics divided, gastric tube created with sequential GIA stapler firings preserving the right gastroepiploic arcade. A pyloroplasty / pyloromyotomy was added per surgeon preference.`,
      `For Ivor Lewis: a right thoracotomy / VATS was performed. The thoracic esophagus was mobilised. The conduit was passed through the hiatus into the chest. The intrathoracic anastomosis was created (stapled or hand-sewn) above the level of the azygos vein.`,
      `For McKeown: a left cervical incision was added. The esophagus was mobilised in the neck. The conduit was passed up through the posterior mediastinum and the cervical anastomosis was completed (hand-sewn or stapled).`,
      `For transhiatal: the esophagus was bluntly mobilised through the hiatus from below and from the cervical incision above. The conduit was passed up and a cervical anastomosis was created.`,
      `A nasogastric tube was placed and a feeding J-tube was inserted. Drains were positioned. The chest / abdomen / neck were closed.`,
    ];
  }

  // -- Off-pump CABG ---------------------------------------------------------
  if (includesAny(name, ["off-pump", "opcab"])) {
    return [
      `Median sternotomy was performed. The pericardium was opened. The LIMA was harvested in a pedicled / skeletonised fashion. Saphenous vein was harvested.`,
      `Heparin was given to a target ACT > 300. A tissue stabiliser (Octopus / Genzyme) was used to immobilise the target vessel during construction of each anastomosis. Coronary occlusion shunts were placed as needed for distal perfusion.`,
      `Each distal anastomosis was completed with running 7-0 / 8-0 Prolene. Proximal saphenous vein graft anastomoses to the ascending aorta were created with side-biting clamps. Doppler signals were confirmed in each graft.`,
      `Protamine was administered. Hemodynamic stability was maintained throughout without conversion to on-pump. Mediastinal and bilateral pleural drains were placed. Sternum closed with stainless steel wires.`,
    ];
  }

  // -- Decortication ---------------------------------------------------------
  if (includesAny(name, ["decortication"])) {
    return [
      `A standard posterolateral thoracotomy was performed (or VATS approach). The pleural space was entered through a thickened parietal pleura. A copious empyema cavity was identified.`,
      `The pleural fluid was suctioned and sent for culture. The fibrinopurulent peel was systematically stripped from the visceral pleura, mediastinum, and diaphragm using a Kittner / blunt finger / Yankauer dissection.`,
      `Lung re-expansion was confirmed under direct vision. Hemostasis was achieved. Two large-bore (32 Fr) chest tubes were placed: one apical, one basal.`,
      `The thoracotomy was closed in layers.`,
    ];
  }

  // -- Heller myotomy --------------------------------------------------------
  if (includesAny(name, ["heller myotomy", "esophageal myotomy"])) {
    return [
      `Pneumoperitoneum was established and ports placed (12 mm supraumbilical + 5 mm × 3 + Nathanson). The liver was retracted. The GE junction was identified.`,
      `The phrenoesophageal ligament was incised. The anterior surface of the distal esophagus was exposed for [6 cm] proximal to the GE junction. A myotomy was begun with a hook cautery on low setting, dividing all longitudinal then circular muscle fibres down to but not through the mucosa.`,
      `The myotomy was extended distally [2 cm] onto the gastric cardia. Intraoperative endoscopy / methylene blue test confirmed no mucosal perforation.`,
      `[A partial fundoplication: Dor (anterior 180°) or Toupet (posterior 270°) was added] for reflux prophylaxis using interrupted 2-0 Ethibond sutures.`,
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
