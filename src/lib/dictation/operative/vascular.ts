import type { CaseLog } from "@/lib/types";
import { includesAny } from "../shared/format";
import type { TopMatter } from "./types";

// ---------------------------------------------------------------------------
// Vascular — forced fields:
//   - Laterality and vessel targeted
//   - Inflow and outflow quality
//   - Distal pulses preoperatively and postoperatively
//   - Heparin dose and ACT
//   - Graft type, size, tunneling route
//   - Patch material (bovine pericardium / PTFE / vein)
//   - Intraoperative completion imaging (duplex / angio)
// ---------------------------------------------------------------------------

export function vascularTopMatter(c: CaseLog): TopMatter {
  const name = c.procedureName.toLowerCase();

  if (includesAny(name, ["carotid endarterectomy", "cea"])) {
    return {
      anesthesia: "General endotracheal anesthesia with intraoperative EEG / cerebral oximetry monitoring.",
      ebl: "Approximately 50–100 ml.",
      drains: "None routinely (closed-suction drain may be placed for extensive dissection).",
      specimens: "Carotid plaque specimen sent for pathology.",
      disposition:
        "The patient tolerated the procedure well and was extubated in the operating room. Neurologic exam intact. Admitted to the step-down unit for overnight monitoring of neurologic status, blood pressure control, and neck hematoma surveillance.",
    };
  }

  if (includesAny(name, ["bypass", "fem-pop", "fem-fem", "fem pop", "fem fem", "axillo-fem", "aorto-bifem", "aorto-femoral"])) {
    return {
      anesthesia: "General endotracheal anesthesia with arterial line and central venous access.",
      ebl: "Approximately 200–400 ml.",
      drains: "None routinely.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well. Admitted for postoperative monitoring. Serial distal pulse and graft checks every hour × 4, then every 4 hours. Maintain mean arterial pressure to support graft perfusion. Therapeutic anticoagulation / antiplatelet per service protocol.",
    };
  }

  if (includesAny(name, ["av fistula", "avf", "arteriovenous fistula", "dialysis access"])) {
    return {
      anesthesia: "Regional block with monitored anesthesia care.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well. Thrill and bruit palpable / audible over the anastomosis. Discharge home the same day. Follow-up in 2 weeks for fistula maturation assessment; plan for duplex ultrasound at 4–6 weeks prior to first cannulation.",
    };
  }

  if (includesAny(name, ["evar", "tevar", "endovascular aneurysm repair"])) {
    return {
      anesthesia: "General endotracheal anesthesia with arterial line and central access.",
      ebl: "Approximately 100–200 ml.",
      drains: "None.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well. Admitted for overnight monitoring. Serial femoral access site checks, distal pulse checks, and hemoglobin monitoring. Completion angiogram confirmed no type I or III endoleak. Plan for surveillance CT angiogram at 1 month and 6 months.",
    };
  }

  if (includesAny(name, ["varicose vein", "rfa vein", "evla", "endovenous", "vein stripping", "phlebectomy", "sclerotherapy"])) {
    return {
      anesthesia: "Local tumescent anesthesia ± sedation; general for extensive stripping.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Stripped vein segments to pathology if requested.",
      disposition:
        "The patient tolerated the procedure well. Discharge home the same day in compression stockings × 2 weeks. Plan: ambulate immediately, follow-up duplex at 1 week to confirm closure.",
    };
  }

  if (includesAny(name, ["thrombectomy", "embolectomy", "fogarty"])) {
    return {
      anesthesia: "General or regional anesthesia depending on urgency.",
      ebl: "Approximately 100–200 ml.",
      drains: "None.",
      specimens: "Thrombus / embolus to pathology and culture.",
      disposition:
        "The patient tolerated the procedure well. Admitted for monitoring of distal perfusion and reperfusion-injury sequelae (compartment syndrome, hyperkalaemia, myoglobinuria). Therapeutic anticoagulation per service protocol.",
    };
  }

  if (includesAny(name, ["ivc filter", "vena cava filter"])) {
    return {
      anesthesia: "Local with sedation.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well. Discharge home the same day. Plan: filter retrieval scheduled at 4–6 weeks if temporary indication is resolved.",
    };
  }

  if (includesAny(name, ["below-knee amputation", "bka", "above-knee amputation", "aka", "lower extremity amputation", "transtibial", "transfemoral"])) {
    return {
      anesthesia: "General or regional anesthesia.",
      ebl: "Approximately 200–400 ml.",
      drains: "None routinely (closed-suction drain may be placed in muscle bed for AKA).",
      specimens: "Amputation specimen to pathology if indicated.",
      disposition:
        "The patient tolerated the procedure well. Admitted to the surgical floor for stump care and rehabilitation planning. Plan: prosthetic referral, multidisciplinary rehabilitation, vascular optimization of the contralateral limb.",
    };
  }

  if (includesAny(name, ["popliteal aneurysm"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Approximately 100–200 ml.",
      drains: "None routinely.",
      specimens: "None (aneurysm left in situ if bypassed; specimen if resected).",
      disposition:
        "The patient tolerated the procedure well. Admitted for monitoring of graft patency and distal perfusion. Plan: serial pulse checks, duplex at 1 month and 6 months.",
    };
  }

  if (includesAny(name, ["distal bypass", "femoral-tibial", "fem-tibial", "fem-pt", "popliteal-pedal", "popliteal-tibial"])) {
    return {
      anesthesia: "General endotracheal anesthesia with arterial line.",
      ebl: "Approximately 100–300 ml.",
      drains: "None.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well. Admitted to the step-down unit for monitoring. Plan: hourly pulse / Doppler checks × 6 hours, then q4h. Therapeutic anticoagulation transitioning to dual antiplatelet per protocol. Duplex at 1 month for graft surveillance.",
    };
  }

  return {
    anesthesia: "General endotracheal anesthesia.",
    ebl: "Approximately ________ ml.",
    drains: "[None / closed-suction drain].",
    specimens: "[None / plaque / clot].",
    disposition:
      "The patient tolerated the procedure well. Serial distal pulse checks, BP management, and anticoagulation per service protocol.",
  };
}

export function vascularFindings(c: CaseLog): string {
  const name = c.procedureName.toLowerCase();
  const side = /\bbilateral\b/.test(name) ? "bilateral" : /\bleft\b/.test(name) ? "left" : /\bright\b/.test(name) ? "right" : "[left/right]";

  if (includesAny(name, ["carotid endarterectomy", "cea"])) {
    return `A ${side} carotid bifurcation with a high-grade (> 70%) atherosclerotic plaque at the origin of the internal carotid artery was identified, consistent with the preoperative duplex imaging. The plaque was [soft and ulcerated / calcified and stable]. A feathered distal endpoint on the ICA was achieved without residual flap. The hypoglossal, vagus, and marginal mandibular nerves were identified and preserved. The patient was heparinized with 5,000 units IV heparin and the ACT was confirmed > 250 seconds. Shunting was [not required based on stump pressure / used via a Pruitt-Inahara shunt]. After closure with a bovine pericardial patch, intraoperative duplex / Doppler confirmed triphasic flow in the ICA, CCA, and ECA without evidence of intimal flap or residual stenosis.`;
  }

  if (includesAny(name, ["bypass", "fem-pop", "fem pop", "fem-fem", "fem fem", "axillo-fem", "aorto-femoral"])) {
    return `The inflow artery was soft, pulsatile, and free of significant disease on inspection and palpation. The outflow target vessel was [patent / moderately diseased with an acceptable landing zone]. The patient was heparinized with 80 units/kg IV heparin and ACT was confirmed > 250 seconds. A ${side} bypass graft was constructed from [reversed great saphenous vein / 6 mm ringed PTFE / 8 mm Dacron] tunneled in the [anatomic / subcutaneous] plane. End-to-side anastomoses were created proximally and distally with running 5-0 Prolene. After release of clamps there was strong palpable pulse throughout the graft and restored Doppler signals in the [DP / PT / plantar] vessels distally. Completion angiography / duplex confirmed patency without kinking or distal embolization. Preoperative distal pulses were absent; postoperatively they were palpable.`;
  }

  if (includesAny(name, ["av fistula", "arteriovenous fistula", "avf", "dialysis access"])) {
    return `A ${side} [radiocephalic / brachiocephalic / brachiobasilic] configuration was used, consistent with the preoperative vein mapping. The target vein was at least 3 mm in caliber and free of prior cannulation injury. The inflow artery was > 2 mm and soft. An end-to-side anastomosis was created with running 6-0 Prolene. On clamp release there was a strong palpable thrill across the anastomosis and a clearly audible bruit distally. There was no evidence of steal, hematoma, or anastomotic stenosis.`;
  }

  if (includesAny(name, ["evar", "tevar"])) {
    return `Aortic anatomy was consistent with preoperative CTA: adequate proximal and distal landing zones, suitable iliac access, and no excessive thrombus at the sealing zones. The aneurysm sac measured approximately [__] cm in maximum diameter. An appropriately sized [Zenith / Endurant / Excluder] endograft was deployed under fluoroscopic guidance with accurate placement at the planned landing zones. Completion angiography demonstrated no type I or type III endoleak, with a small type II endoleak [present / absent] and no target organ compromise.`;
  }

  if (includesAny(name, ["varicose vein", "rfa vein", "evla", "endovenous", "vein stripping", "phlebectomy"])) {
    return `${side} symptomatic varicose veins (CEAP class [C2–C6]) with reflux at the saphenofemoral junction confirmed on preoperative duplex (reflux time > 0.5 seconds). The greater saphenous vein was incompetent over the entire thigh. There were [no / minimal] suprafascial varicosities consistent with secondary tributaries. Hemostasis was achieved at all access sites.`;
  }

  if (includesAny(name, ["thrombectomy", "embolectomy", "fogarty"])) {
    return `${side} acute limb ischemia (Rutherford [I/IIA/IIB]) was confirmed with absent palpable pulses and Doppler signals at the [DP/PT] preoperatively. A [fresh / organized] embolus / thrombus was retrieved with the Fogarty catheter from the [common femoral / popliteal / brachial] artery. Distal back-bleeding was confirmed after extraction. Restoration of palpable pulses or Doppler signals was achieved post-thrombectomy.`;
  }

  if (includesAny(name, ["ivc filter"])) {
    return `Cavogram demonstrated a patent infrarenal IVC measuring approximately [__] mm with normal renal vein anatomy. There was no thrombus in the access vein. The filter was deployed in the infrarenal IVC below the lowest renal vein. Position was confirmed on completion imaging.`;
  }

  if (includesAny(name, ["below-knee amputation", "bka", "above-knee amputation", "aka", "transtibial", "transfemoral"])) {
    return `${side} non-salvageable limb ischemia / chronic non-healing wound / necrotizing infection was confirmed. Tissue at the planned amputation level was viable, well-perfused, and free of infection / ischemia. The skin flaps were healthy and tension-free at closure. Hemostasis was satisfactory.`;
  }

  if (includesAny(name, ["popliteal aneurysm"])) {
    return `${side} popliteal aneurysm measuring approximately [__] cm with [partial / complete / no] mural thrombus and [patent / occluded] outflow vessels. The greater saphenous vein was suitable as a conduit, measuring > 3 mm. Bypass and exclusion or interposition graft was performed without complication. Distal perfusion was restored.`;
  }

  if (includesAny(name, ["distal bypass", "fem-tibial", "fem-pt", "popliteal-pedal", "popliteal-tibial"])) {
    return `${side} chronic limb-threatening ischemia (CLTI Rutherford [4/5/6]) with poor outflow on the angiogram. The target distal vessel ([anterior tibial / posterior tibial / peroneal / pedal]) was identified, dissected free, and was suitable for anastomosis. The reverse / in-situ greater saphenous vein was a satisfactory conduit. After completion of bypass, the foot was warm and well-perfused with restored distal Doppler signals.`;
  }

  return `Intraoperative findings were consistent with the preoperative imaging. The target vessel was identified and controlled proximally and distally. The patient was systemically heparinized with adequate ACT. Inflow and outflow were satisfactory. Distal perfusion was restored at the conclusion of the case, confirmed by palpable pulse / Doppler signal / completion imaging.`;
}

function vascularOpSteps(c: CaseLog): string[] {
  const name = c.procedureName.toLowerCase();

  if (includesAny(name, ["carotid endarterectomy", "cea"])) {
    return [
      `An oblique incision was made along the anterior border of the sternocleidomastoid, extending from the angle of the mandible to just above the clavicle, and carried down through the platysma. The SCM was retracted laterally and the carotid sheath entered. The common, internal, and external carotid arteries were dissected free with vessel loops placed around each. The hypoglossal, vagus, and marginal mandibular nerves were identified and preserved.`,
      `The patient was systemically heparinized with 5,000 units of IV heparin and an ACT was drawn and verified above 250 seconds. The internal, common, and external carotid arteries were cross-clamped in that order. [A Pruitt-Inahara shunt was placed after the arteriotomy was started / shunting was not required based on stump pressure and intraoperative monitoring.]`,
      `A longitudinal arteriotomy was made on the CCA and extended onto the ICA beyond the plaque. The atherosclerotic plaque was carefully dissected from the arterial wall in the subadventitial plane, with a feathered distal endpoint achieved on the ICA. All residual debris and loose intimal flaps were removed and the lumen was irrigated.`,
      `A bovine pericardial patch was fashioned and sewn onto the arteriotomy with running 6-0 Prolene. Prior to final tying, flow was flushed through the ECA, CCA, and finally the ICA to evacuate air and debris. Clamps were released in the order ECA → CCA → ICA.`,
      `Hemostasis was confirmed. Protamine was administered to reverse heparinization. Doppler signals were confirmed in the superficial temporal artery and across the endarterectomy site. The platysma was closed with 3-0 Vicryl and the skin with 4-0 Monocryl subcuticular.`,
    ];
  }

  if (includesAny(name, ["open aaa", "aaa repair", "open abdominal aortic"])) {
    return [
      `A midline laparotomy was performed and the abdomen explored. The small bowel was retracted to the right and the ligament of Treitz was taken down to expose the retroperitoneum overlying the infrarenal aorta. The retroperitoneum was incised and the infrarenal neck, both iliac arteries, and the left renal vein were exposed. Care was taken to protect the IMV, duodenum, and ureters.`,
      `The patient was systemically heparinized with 100 units/kg of IV heparin and an ACT verified above 250. The iliac arteries were cross-clamped, followed by the infrarenal aortic clamp. The aneurysm sac was opened longitudinally.`,
      `Mural thrombus was evacuated. Back-bleeding lumbar arteries were suture-ligated from within the sac with 2-0 Prolene. A [tube / aorto-bi-iliac] Dacron graft was sized and sewn proximally to the infrarenal aortic cuff with running 3-0 Prolene in a parachute technique, then flushed and the anastomosis tested. The distal anastomosis(es) were completed to the iliac arteries with 4-0 Prolene.`,
      `Prior to final unclamping, the graft was flushed and clamps were released sequentially to avoid declamping hypotension. Anastomoses were inspected and hemostatic. Distal perfusion was confirmed by Doppler of the femoral vessels.`,
      `Protamine was administered. The aneurysm sac was closed over the graft with running 2-0 Vicryl to exclude the bowel from the graft. The retroperitoneum was re-approximated. The abdomen was closed in standard fashion.`,
    ];
  }

  if (includesAny(name, ["evar", "endovascular aortic"])) {
    return [
      `Bilateral common femoral arteries were accessed percutaneously under ultrasound guidance with pre-closure using two Perclose ProGlide devices on each side. 5 Fr sheaths were placed and guidewires advanced under fluoroscopy into the descending thoracic aorta.`,
      `A calibrated pigtail catheter was advanced and an aortogram performed to identify the renal arteries and iliac bifurcation. The sheaths were upsized to accommodate the main body and contralateral limb of the [Gore Excluder / Medtronic Endurant / Cook Zenith] endograft.`,
      `Systemic heparinization was achieved (100 units/kg) with ACT > 250. The main body was deployed with the lowest renal artery as the proximal landing zone. The contralateral gate was cannulated and the contralateral limb deployed. Molding balloon angioplasty was performed at the proximal neck, flow divider, and distal landing zones.`,
      `Completion angiography demonstrated exclusion of the aneurysm sac without evidence of type I or III endoleak, and patent renal and hypogastric arteries. Sheaths were removed and the pre-placed ProGlide sutures were cinched down, achieving hemostasis of both groins. Protamine was administered.`,
    ];
  }

  if (includesAny(name, ["fem-pop", "femoral-popliteal", "femoropopliteal", "fem pop bypass"])) {
    return [
      `A longitudinal incision was made over the common femoral artery and the CFA, SFA, and profunda were exposed and encircled with vessel loops. A second incision was made over the [above-knee / below-knee] popliteal artery and the target segment exposed.`,
      `The ipsilateral greater saphenous vein was harvested and prepared as a reversed conduit (or in situ with valvulotomy). [Alternatively, a PTFE graft was selected based on conduit availability.] The patient was systemically heparinized (100 units/kg) with ACT > 250.`,
      `A subcutaneous tunnel was created between the two incisions. The proximal anastomosis was created end-to-side to the CFA with running 5-0 Prolene after a longitudinal arteriotomy, flushing prior to final tying. The distal anastomosis was performed end-to-side to the popliteal artery with 6-0 Prolene.`,
      `Flow was restored and the graft and anastomoses inspected for hemostasis. Distal Doppler signals were confirmed in the DP and PT arteries. Protamine was administered. Wounds were closed in layers with 3-0 Vicryl and 4-0 Monocryl.`,
    ];
  }

  if (includesAny(name, ["av fistula", "arteriovenous fistula", "avf", "dialysis access"])) {
    return [
      `Under local anesthesia with sedation, a longitudinal incision was made over the [radiocephalic / brachiocephalic] region. The cephalic vein was identified, dissected free, and controlled with vessel loops. The [radial / brachial] artery was similarly exposed.`,
      `The patient was heparinized (50 units/kg IV). The vein was mobilized adequately to allow a tension-free anastomosis and divided distally. A longitudinal arteriotomy was created and an end-to-side anastomosis between the vein and artery was performed with running 7-0 Prolene.`,
      `Flow was restored and an audible thrill and palpable pulse confirmed through the fistula. The wound was closed in layers with 4-0 Vicryl and 5-0 Monocryl subcuticular.`,
    ];
  }

  if (includesAny(name, ["varicose vein", "rfa vein", "evla", "endovenous", "vein stripping", "phlebectomy"])) {
    return [
      `Under tumescent local anesthesia, the great saphenous vein was accessed at the level of the medial malleolus / mid-calf under ultrasound guidance and a 5 Fr sheath placed. A guidewire was advanced up to the SFJ and confirmed under ultrasound.`,
      `An RF / laser fibre was advanced over the guidewire to a position 2 cm distal to the SFJ. Tumescent anesthesia (cold normal saline + lidocaine + epinephrine + bicarbonate) was infused along the saphenous course under ultrasound control to compress the vein around the fibre, provide thermal protection, and anesthetize.`,
      `The RF / laser was activated with sequential pull-back at the manufacturer-recommended energy settings until the entire incompetent segment was treated. Post-treatment ultrasound confirmed complete closure with no flow signal.`,
      `[Stab phlebectomies were performed at marked surface varicosities using a phlebectomy hook through 1–2 mm stab incisions, all closed with Steri-strips.] The leg was wrapped in compression and the patient transitioned to a 30–40 mmHg compression stocking.`,
    ];
  }

  if (includesAny(name, ["thrombectomy", "embolectomy", "fogarty"])) {
    return [
      `A longitudinal incision was made over the [common femoral / brachial / popliteal] artery and the vessel was exposed and encircled with vessel loops. The patient was systemically heparinized (100 units/kg IV) with ACT > 250.`,
      `A transverse arteriotomy was made and a [3 Fr / 4 Fr / 5 Fr] Fogarty embolectomy catheter was passed proximally then distally, with the balloon gently inflated and withdrawn to extract clot. Multiple passes were performed in each direction until brisk inflow and back-bleeding were confirmed.`,
      `The arteriotomy was closed primarily with running 6-0 Prolene (or with a vein/bovine pericardial patch if narrowing). Pulses were re-checked distally and Doppler signals confirmed.`,
      `Protamine was administered. Fasciotomies should be considered for prolonged ischemia or a clinically tense compartment.`,
    ];
  }

  if (includesAny(name, ["ivc filter"])) {
    return [
      `Right common femoral or right internal jugular vein access was obtained under ultrasound guidance. A 5 Fr sheath was placed and a guidewire advanced up the IVC.`,
      `A 5 Fr pigtail catheter was advanced and a cavogram performed identifying the renal veins, IVC diameter, and ruling out IVC thrombus.`,
      `An appropriately sized retrievable IVC filter (Cook Celect / Cordis OptEase / Bard Denali) was deployed in the infrarenal IVC, just below the lowest renal vein. Position was confirmed by post-deployment cavogram.`,
      `The sheath was withdrawn and hemostasis achieved at the access site by manual pressure.`,
    ];
  }

  if (includesAny(name, ["below-knee amputation", "bka", "transtibial"])) {
    return [
      `A long posterior musculocutaneous flap and a short anterior flap were marked at the proposed level (typically 12–15 cm distal to the tibial tuberosity). Anterior incision was made, deepened to expose the tibia and fibula.`,
      `The anterior compartment muscles were transected with electrocautery. The anterior tibial vessels were ligated with 2-0 silk. The tibia and fibula were transected with a sagittal saw, with the fibula transected 2 cm proximal to the tibial cut and the tibia bevelled anteriorly.`,
      `The posterior compartment was transected at the level of the bone cut, identifying and ligating the peroneal and posterior tibial vessels. The tibial nerve was sharply transected on stretch and allowed to retract.`,
      `Bony edges were rasped smooth. The posterior musculocutaneous flap was rotated anteriorly and tailored. Myodesis (suturing posterior compartment muscle to anterior tibia) was completed with 2-0 Vicryl. The skin was closed loosely with interrupted 3-0 nylon.`,
    ];
  }

  if (includesAny(name, ["above-knee amputation", "aka", "transfemoral"])) {
    return [
      `Equal anterior and posterior fishmouth flaps were marked. The incision was made and deepened, transecting the quadriceps anteriorly and the hamstrings posteriorly with electrocautery.`,
      `The superficial femoral artery and vein were dissected free, double-clamped, transected, and triple-suture-ligated with 2-0 silk. The sciatic nerve was identified, sharply transected on stretch, and allowed to retract.`,
      `The femur was transected with a sagittal saw at a level approximately 12 cm proximal to the knee joint. Bony edges were rasped smooth.`,
      `Myodesis of the adductors and quadriceps to the femur was performed with #1 Vicryl through drill holes. The skin and subcutaneous tissue were closed loosely with interrupted 3-0 nylon. A drain was placed in the muscle bed.`,
    ];
  }

  if (includesAny(name, ["popliteal aneurysm"])) {
    return [
      `A medial thigh and a medial calf incision exposed the above- and below-knee popliteal artery. The aneurysm was identified and proximal/distal control obtained.`,
      `The greater saphenous vein was harvested for use as a reverse bypass conduit. The patient was systemically heparinized (100 units/kg) with ACT > 250.`,
      `Proximal and distal anastomoses were created end-to-side with running 6-0 Prolene. The aneurysm was [excluded by ligating proximal and distal of the aneurysm and bypassing / resected with interposition].`,
      `Flow was restored and distal Doppler signals confirmed. Protamine was administered. The wounds were closed in layers.`,
    ];
  }

  if (includesAny(name, ["distal bypass", "fem-tibial", "fem-pt", "popliteal-pedal", "popliteal-tibial"])) {
    return [
      `A longitudinal incision was made over the common femoral artery and a separate distal incision exposed the target tibial vessel. Both vessels were dissected free, controlled with vessel loops, and inspected.`,
      `The greater saphenous vein was harvested in non-reversed (in situ with valvulotomy) or reverse fashion as the conduit, depending on length needed and quality. The patient was systemically heparinized (100 units/kg).`,
      `A subcutaneous tunnel was created. The proximal anastomosis was created end-to-side to the CFA with running 5-0 Prolene; the distal anastomosis was performed end-to-side to the [tibial vessel] with running 7-0 Prolene over loupes / microscope.`,
      `Flow was restored and the foot was warm with restored distal Doppler signals. Completion angiography confirmed graft patency and outflow without distal embolization. Protamine was administered. Wounds were closed in layers.`,
    ];
  }

  // Generic fallback for other vascular cases
  return [
    `Proximal and distal vascular control were obtained with vessel loops and atraumatic clamps. The patient was systemically heparinized with an ACT verified above 250 seconds. [Describe the specific reconstruction, endarterectomy, bypass, or endovascular intervention.] Flow was restored in a controlled fashion. Distal pulses/Doppler signals were confirmed. Protamine was administered and hemostasis confirmed.`,
    ``,
  ];
}

export function vascularBody(c: CaseLog): string[] {
  const isEndo =
    c.surgicalApproach === "ENDOSCOPIC" ||
    c.surgicalApproach === "PERCUTANEOUS" ||
    includesAny(c.procedureName.toLowerCase(), [
      "evar",
      "tevar",
      "endovascular",
      "angioplasty",
      "stent",
    ]);
  const preamble = isEndo
    ? [
        `Description of Procedure: The risks, benefits, and alternatives were discussed with the patient and informed consent was obtained. The patient was brought to the hybrid OR / angio suite and placed supine on a fluoroscopy-capable table. [General / local with sedation] anesthesia was induced. Pre-procedure antibiotics were administered and both groins were prepped and draped in the usual sterile fashion.`,
        ``,
        `A surgical time-out was completed.`,
        ``,
      ]
    : [
        `Description of Procedure: The risks, benefits, and alternatives were discussed with the patient and informed consent was obtained. The patient was brought to the operating room and placed supine. After induction of general endotracheal anesthesia, an arterial line was placed and pre-incision antibiotics were administered. The operative field was prepped and draped in the usual sterile fashion.`,
        ``,
        `A surgical time-out was completed, confirming patient identity, procedure, site, consent, antibiotics, and availability of blood products and graft material.`,
        ``,
      ];
  const steps = vascularOpSteps(c);
  const closure = isEndo
    ? [
        `Hemostasis at both groin access sites was confirmed. Sterile dressings were applied. Distal pulses were confirmed bilaterally at the end of the procedure.`,
      ]
    : [
        `Hemostasis was meticulously confirmed. Distal pulses/Doppler signals were confirmed. The wound(s) were closed in layers with 3-0 Vicryl for the fascia, 3-0 Vicryl for the subcutaneous tissue, and 4-0 Monocryl subcuticular for the skin, followed by sterile dressings.`,
      ];
  return [...preamble, ...steps, ...closure];
}
