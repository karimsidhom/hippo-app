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
    const isLaser = name.includes("evla") || name.includes("laser");
    return [
      `CEAP classification was reviewed (C0 no signs, C1 telangiectasia, C2 varicose veins, C3 edema, C4 skin changes, C5 healed ulcer, C6 active ulcer) — typical indication for endothermal ablation is C2-C6 with documented saphenous reflux ≥ 0.5 seconds on duplex (Eklöf criteria). Anatomy was reviewed on preoperative duplex map: GSV diameter (typical ablation candidate 5-15 mm; > 15 mm may have poor outcomes), tortuosity, depth from skin (must be > 1 cm to permit safe tumescent anesthesia and avoid skin burn), location of accessory branches, presence of incompetent perforators, SFJ anatomy. Anticoagulation was held per institutional protocol (no anticoagulation modification routinely needed for endovenous ablation).`,
      `The patient was positioned ${name.includes("gsv") || name.includes("greater") ? "supine with the leg externally rotated and slightly bent at the knee for GSV access" : "prone for SSV access"}. The leg was prepped with chlorhexidine and draped widely. The vein was mapped along its course and marked with a sterile skin marker, with the planned access point at the lowest point of incompetence (typically distal thigh or knee for GSV, mid-calf for SSV — proximal to the lowest competent valve to avoid treating segments that should not be ablated).`,
      `Under ultrasound guidance using a high-frequency linear probe (8-15 MHz, "L15-7io" or similar), the GSV was accessed at the marked entry point with a 21-gauge micropuncture needle in real-time short-axis ultrasound visualisation. A 0.018" guidewire was advanced through the needle into the vein lumen. The needle was exchanged for a 4-7 Fr sheath (depending on the ablation system). The guidewire was advanced under ultrasound up to the SFJ and the position confirmed by visualising the wire 2 cm distal to the junction (avoiding placement at or beyond the junction to prevent thermal injury to the femoral vein).`,
      `${isLaser ? "An EVLA laser fibre (980 nm, 1320 nm, or 1470 nm — 1470 nm preferred for water-absorbing chromophore, less perforation, less postoperative pain than 980 nm) — typically a 600-micron bare-tip or radial-tip fibre" : "A radiofrequency ablation catheter (Medtronic ClosureFast 7 cm catheter for segmental treatment, or Closure RFS for focal/perforator treatment)"} was advanced over the guidewire (or through the sheath) under ultrasound guidance to a position 2 cm distal to the SFJ — confirmed by ultrasound visualisation of the catheter tip. The wire was removed and tip position re-confirmed before any energy was delivered.`,
      `Tumescent anesthesia was infused along the entire course of the saphenous compartment under continuous ultrasound guidance (Klein technique): the standard tumescent solution consisted of 1 L of cold normal saline + 50 mL of 1% lidocaine + 1 mL of 1:1000 epinephrine + 10 mEq sodium bicarbonate, infused via a 22-gauge spinal needle from distal to proximal to surround the vein in the saphenous compartment. The tumescent volume (typical 200-500 mL per limb) achieved three goals: (1) anesthesia, (2) compression of the vein around the fibre to maximise contact area + reduce vein diameter for better ablation efficacy, (3) thermal protection of skin and surrounding tissue (target 1 cm of fluid between vein and skin). The tumescent created a pearl-on-a-string appearance under ultrasound.`,
      `Trendelenburg position was achieved (15-30° head down) to empty the vein further. ${isLaser ? "EVLA: laser energy was delivered at 60-80 J/cm linear endovenous energy density (LEED) — recommended dose to achieve durable closure. Withdrawal speed 1-3 mm/sec depending on vein diameter, withdrawing the fibre at a steady rate while monitoring under ultrasound. Total energy was tracked." : "RFA Closurefast: the catheter was activated for 20-second cycles delivering controlled RF energy at 120°C, achieving controlled segmental thermal ablation. Each 7 cm segment received two 20-second cycles. The catheter was withdrawn 6.5 cm and the next cycle initiated, continuing distal until the entire incompetent segment was treated."} Post-treatment ultrasound confirmed complete vein closure with absent flow signal and a fibrotic, non-compressible vein cord.`,
      `${name.includes("phlebectomy") || name.includes("varices") ? "Adjunctive ambulatory phlebectomy was performed for visible surface varicosities (Müller technique): the bulging tributary varicosities were marked preoperatively with the patient standing. With the patient supine, 2-3 mm stab incisions were made over each marked vein with a #11 blade. A small phlebectomy hook (Müller hook 14- or 18-gauge, or Oesch hook) was inserted through the stab to engage and exteriorise the vein, which was then teased out and avulsed by gentle traction. The exteriorised vein was rolled around the hook and removed. Hemostasis at each site was achieved with manual compression for 1-2 minutes. Stab incisions were closed with Steri-strips (no sutures needed)." : ""}`,
      `The leg was wrapped immediately in a layered compression bandage (or directly into a 30-40 mmHg compression stocking — equivalent outcomes per RCT evidence). The patient was instructed to ambulate immediately upon arrival in recovery (encourages venous return, reduces DVT risk — endovenous ablation has 0.5-1% DVT rate, with EHIT — endovenous heat-induced thrombosis — class 1-4 occurring in 1-3%; class 3 (extending into femoral vein) requires anticoagulation). Discharge same day with compression × 1-2 weeks (no benefit beyond 2 weeks per RCT). Follow-up duplex at 1 week to assess closure and screen for EHIT, then at 3 months for durability assessment.`,
    ];
  }

  if (includesAny(name, ["thrombectomy", "embolectomy", "fogarty"])) {
    return [
      `Acute limb ischemia was classified per Rutherford: I (viable, no immediate threat — no sensory loss, no motor weakness, audible arterial Doppler), IIa (marginally threatened — minimal sensory loss in toes, no motor weakness, audible Doppler), IIb (immediately threatened — sensory loss beyond toes with rest pain, mild motor weakness, inaudible arterial Doppler), III (irreversible — major sensory loss + paralysis + absent capillary refill + non-viable muscle — primary amputation). Rutherford IIa-IIb required emergent revascularisation within 6 hours; Rutherford III mandated primary amputation. Etiology was characterised: embolic (sudden onset, atrial fibrillation, normal contralateral pulses, no chronic claudication history) vs thrombotic (gradual progression, chronic claudication, abnormal contralateral pulses, atherosclerotic disease).`,
      `Preoperative imaging (CTA preferred for unstable patients; angiography for catheter-directed thrombolysis option) was reviewed. The patient was systemically heparinised with 100 U/kg IV bolus + infusion preoperatively to limit propagation. Therapeutic ACT > 250 was confirmed. Type and screen was prepared. The patient was positioned supine on a fluoroscopy-capable table with the affected limb prepped and draped. Antibiotic prophylaxis (cefazolin 2 g IV) was administered.`,
      `${name.includes("femoral") || !name.includes("brachial") ? "A vertical or longitudinal groin incision was made over the common femoral artery (palpated below the inguinal ligament). The incision was deepened through subcutaneous tissue and the femoral sheath. The CFA, SFA, and profunda femoris were exposed and encircled with silastic vessel loops, with care to identify the femoral nerve laterally and femoral vein medially. The CFA was inspected — the diseased segment was characterised (typically firm chronic atheroma, with overlying soft acute thrombus distinguishable by colour and consistency)." : "A longitudinal antecubital fossa incision (S-shaped to cross the elbow crease) was made over the brachial artery just medial to the biceps tendon. The bicipital aponeurosis (lacertus fibrosus) was divided and the brachial artery exposed at the bifurcation into radial and ulnar arteries. The vessels were encircled with vessel loops."} Pulses were assessed by direct palpation: typically forceful proximal pulsation, absent distal pulse, with the exact level of occlusion identified.`,
      `A transverse arteriotomy was made (preferred over longitudinal for routine embolectomy — easier primary closure without narrowing) at a healthy arterial segment ${name.includes("femoral") ? "at the CFA (allowing access to both proximal — iliac/aorta — and distal — SFA, profunda — circulations)" : "at the brachial artery"}. ${name.includes("femoral") ? "Embolic clot in the CFA, if present, was extracted with a Penfield dissector or DeBakey forceps. " : ""}A Fogarty embolectomy catheter was selected by size based on target vessel: ${name.includes("femoral") ? "5 Fr for the iliac/aorta (passed proximally to the suprarenal aorta if needed for saddle embolus), 4 Fr for the SFA/profunda (passed distally), 3 Fr for the popliteal/below-knee vessels (passed selectively into anterior tibial, posterior tibial, peroneal)" : "3-4 Fr for the brachial/forearm vessels"}.`,
      `The Fogarty catheter was passed proximally first: the catheter (with deflated balloon) was advanced as far as it would go through the arteriotomy, the balloon was inflated to vessel-wall contact (judged by tactile feedback — 'snug' fit; over-inflation causes intimal injury and dissection), and withdrawn slowly while maintaining inflation, dragging the clot back into the arteriotomy. The retrieved clot was inspected (fresh red emboli vs organised pale thrombus vs atherosclerotic debris) and saved for pathology + culture. The pass was repeated 2-3 times until brisk inflow was confirmed (pulsatile arterial bleeding through the arteriotomy when proximal control was released). The catheter was then passed distally into each outflow vessel sequentially with the same technique, removing distal clot until brisk back-bleeding was achieved from each outflow channel.`,
      `Completion angiography was performed if back-bleeding was inadequate or distal clot was suspected: a 5 Fr catheter was passed distally and contrast injected to image the runoff. Persistent thrombus was treated with: (1) repeat Fogarty passes; (2) selective intraoperative thrombolysis with tPA 5-10 mg into the distal vessel; (3) bypass for chronic occlusion with diseased outflow. The arteriotomy was closed primarily with running 6-0 Prolene (or with a vein/bovine pericardial patch if narrowing > 30% expected — common when vessel is small, atherosclerotic, or thick-walled).`,
      `Pulses were re-checked distally — a palpable distal pulse confirmed restoration of perfusion. Doppler signals were obtained and documented at the DP/PT (lower extremity) or radial/ulnar (upper extremity). The wound was inspected and hemostasis confirmed. Compartment pressures were assessed by clinical examination (tense, painful compartment) and direct measurement if needed (Stryker manometer; threshold pressure within 30 mmHg of diastolic BP, or absolute > 30 mmHg) — fasciotomy was performed prophylactically for ischemia time > 4-6 hours or any clinical concern, with 4-compartment fasciotomy of the lower leg through dual incisions (medial and lateral).`,
      `Protamine was administered (1 mg per 100 U heparin given) for partial reversal — not full reversal due to ongoing thrombosis risk. Wounds were closed in layers: subcutaneous 3-0 Vicryl, dermis 4-0 Monocryl, skin 4-0 Monocryl subcuticular. Postoperative monitoring: hourly distal pulse and Doppler checks × 6-12 hours, then q4h × 24h; serial CK levels for rhabdomyolysis (peak at 24-48 hours, treat with aggressive IV fluid + alkalinisation if CK > 5000); urine for myoglobinuria (positive dipstick blood without RBCs on micro); compartment monitoring × 24-48h. Therapeutic anticoagulation was maintained with IV heparin transition to enoxaparin or DOAC depending on etiology — embolic source required workup (echo for thrombus, telemetry for AF, hypercoagulable workup if young/atypical).`,
    ];
  }

  if (includesAny(name, ["ivc filter"])) {
    return [
      `Indication was reviewed: contraindication to anticoagulation in patient with documented PE or proximal DVT (most common indication), failure of therapeutic anticoagulation with progression of VTE, anticoagulation complication requiring cessation, or bridging in trauma/perioperative period at high VTE risk. Filter type was selected: retrievable filter (preferred for temporary indications — Cook Celect, Cordis OptEase, Bard Denali, Argon Option) — must have a documented retrieval plan; permanent filter (Bird's Nest, Greenfield, TrapEase) for lifelong indications. The patient's planned retrieval date was documented prospectively to avoid 'forgotten filters' (high rate of long-term complications: filter migration, fracture, IVC thrombosis, organ perforation — FDA safety alert 2010 + 2014).`,
      `The patient was positioned supine on the angiography table. Both groin areas were prepped and draped to allow alternative access. Topical anaesthesia (1% lidocaine) was infiltrated at the planned access site. Conscious sedation was administered with fentanyl + midazolam titrated to comfort.`,
      `Vascular access was obtained via the right common femoral vein under ultrasound guidance using a 21-gauge micropuncture needle (preferred over jugular for right-handed operators with infrarenal placement; jugular access for IVC thrombosis or femoral vein occlusion). A 5-7 Fr sheath was placed and a 0.035" guidewire advanced under fluoroscopy into the IVC, then to the SVC for stable wire position. The choice of access side was based on imaging: right femoral was first-line; left femoral required navigating the IVC convergence and was technically more difficult but acceptable; right internal jugular access was used for IVC thrombosis below the renal veins (filter delivered from above the thrombus).`,
      `Cavogram: a 5 Fr pigtail catheter was advanced into the IVC and contrast (15-20 mL of iohexol or iodinated contrast — or CO2 angiography for renal failure patients) was injected with cine fluoroscopic imaging in PA and lateral projections. Critical anatomic landmarks were identified: (1) lowest renal vein (most common: right renal vein at L1-2; ~25% have a left renal vein lower than the right); (2) IVC diameter (typical 16-28 mm — measure carefully because mega-cava > 28 mm is a contraindication to most filters and requires bilateral iliac filtration with smaller bilateral filters); (3) IVC thrombus location (rule out infrarenal thrombus that would require suprarenal filter placement — gold standard for placement just below lowest renal vein, but suprarenal placement permitted for caval thrombus, gravid uterus, or renal vein thrombus); (4) circumaortic left renal vein (variant in 5-15% — important to know exact position relative to filter); (5) IVC duplication (rare, < 1% — would require bilateral filters).`,
      `An appropriately sized retrievable IVC filter was selected based on cavogram measurement and indication: ${name.includes("celect") ? "Cook Celect (4-cm length, conical design with 12 struts, indicated for IVC up to 30 mm)" : name.includes("denali") ? "Bard Denali (4.5-cm length, retrieval hook, indicated for IVC up to 28 mm)" : name.includes("option") ? "Argon Option ELITE (conical design, low-profile)" : "Cook Celect or equivalent retrievable filter"}. The filter delivery sheath (10-14 Fr depending on system) was advanced over the wire to the planned deployment level. The filter was deployed in the infrarenal IVC with the cephalad apex 1-2 mm caudal to the lowest renal vein orifice — too high (across renals) risks renal vein occlusion; too low (overlying iliac confluence) risks lumbar/iliac venous occlusion. Filter orientation was confirmed: apex cephalad, struts engaged perpendicular to IVC wall.`,
      `Post-deployment cavogram confirmed: filter position immediately below lowest renal vein with > 5 mm cephalad clearance from the renal vein orifice; symmetric strut deployment without tilt > 15° (excessive tilt makes future retrieval difficult or impossible — accepts tilt up to 15-20° as routine; > 15° prompts consideration of repositioning at deployment); flow through the IVC without obstruction; no extravasation or perforation. The sheath was withdrawn and hemostasis at the femoral access site achieved with manual compression × 10-15 minutes (or vascular closure device — Perclose, StarClose).`,
      `Postoperative care: bed rest with leg straight × 2-4 hours; check distal pulses bilaterally; monitor access site for hematoma. Discharge same day. Anticoagulation resumption was considered as soon as the original contraindication permitted (filter is adjunct, not replacement — anticoagulation reduces the 25-30% risk of recurrent VTE and reduces filter complications). Filter retrieval was scheduled at the index hospitalisation discharge for 4-12 weeks postoperatively (per Society of Interventional Radiology and FDA safety communications — every retrievable filter has a retrieval plan; no longer indicated indications mandate prompt removal). Long-term complications if not retrieved: filter fracture (~1-3% per year), migration, IVC perforation/penetration (40-50% by 5 years on imaging), IVC thrombosis (5-10%), recurrent PE (despite filter, ~3-5%), DVT (20-30% post filter).`,
    ];
  }

  if (includesAny(name, ["below-knee amputation", "bka", "transtibial"])) {
    return [
      `Indication was reviewed: chronic limb-threatening ischemia (CLTI) with non-reconstructable disease (failed bypass + endovascular options exhausted, or absent runoff for distal bypass), wet gangrene with sepsis, dry gangrene with non-viable foot tissue, severe diabetic foot infection (Wagner grade 4-5) with bone involvement, traumatic injury with non-salvageable limb, malignancy. Preoperative optimisation included: vascular workup confirming inflow at popliteal level (BKA requires patent popliteal artery for flap viability — if popliteal occluded, AKA is required); nutritional assessment (albumin > 3.0 g/dL, prealbumin) — poor nutrition predicts wound failure (~30% wound dehiscence in CLTI patients); diabetes optimisation (HbA1c < 8% reduces wound complications); cardiac clearance (CLTI patients have 30-day mortality 5-10%); social workup with prosthetic + rehabilitation team consultation. Antibiotic prophylaxis was tailored to wound contamination — broad-spectrum (piperacillin-tazobactam) for infected wet gangrene, cefazolin for clean amputations.`,
      `The patient was positioned supine on the operating table with a sandbag under the ipsilateral hip to allow lateral rotation. The entire lower extremity was prepped circumferentially from above the knee to the foot with chlorhexidine and draped to allow free range of motion. The contaminated foot was wrapped in a sterile stockinette with iodine-soaked gauze to isolate it from the operative field. Tourniquet was placed at the thigh and inflated to 250 mmHg (avoided in dysvascular patients to prevent further ischemic injury — use direct vessel control instead).`,
      `The amputation level was marked: typically 12-15 cm distal to the tibial tuberosity (or one hand-breadth below the tibial tuberosity at the junction of the upper and middle thirds of the tibia). The skin incision was marked using the long posterior musculocutaneous flap technique (Burgess flap — the standard) — superior anterior incision extended in a transverse line at the planned level + a long posterior flap extending distally for a length 1.5-2x the AP diameter of the calf at the amputation level (typical 13-15 cm flap length).`,
      `The anterior incision was made and deepened through the skin and subcutaneous tissue. The anterior compartment muscles (tibialis anterior, EDL, EHL, peroneus tertius) were transected with electrocautery 2-3 cm distal to the planned bone cut. The anterior tibial artery and vein were identified at the interosseous membrane, doubly clamped, transected, and triple suture-ligated with 2-0 silk (proximal vessel) and electrocautery (distal stump). The deep peroneal nerve was identified, gently pulled distally, sharply transected with a #15 blade on stretch, and allowed to retract proximally — preventing painful neuroma formation in the stump.`,
      `The interosseous membrane was divided and the lateral compartment (peroneus longus + brevis) was transected with electrocautery. The peroneal artery and vein within the lateral compartment were ligated. The fibula was transected approximately 2 cm proximal to the planned tibial cut using a sagittal saw or Gigli saw — the fibula short cut is essential to allow proper stump shape and prosthetic fitting (a fibula projecting beyond the tibia causes a painful prominence + skin breakdown).`,
      `The tibia was transected at the planned level using a sagittal saw or oscillating saw, with the cut bevelled anteriorly at 45° to prevent skin pressure points (anterior tibial bevel of 1-2 cm length). Tibial periosteum was elevated 1 cm proximal to the cut and trimmed flush with the bone. The medullary canal was inspected and irrigated.`,
      `The posterior compartment was transected at the level of the bone cut using a sharp #20 blade ('amputation knife') — the posterior compartment muscle (gastrocnemius + soleus) is preserved as the long flap because of its robust posterior tibial artery blood supply that supports the stump. The posterior tibial vessels (artery and vein) were identified at the interosseous membrane, doubly ligated with 2-0 silk and transected. The peroneal vessels were similarly ligated. The tibial nerve was identified posteriorly, gently pulled distally, sharply transected on stretch, and allowed to retract — no ligature on nerve (causes neuroma).`,
      `Bony edges were rasped smooth with a bone rasp. Hemostasis was meticulously confirmed at all transected vessels. The wound was irrigated with saline. The posterior musculocutaneous flap (gastrocnemius + soleus + skin) was rotated anteriorly over the bone cut. Myodesis (suturing posterior compartment muscle to anterior tibia through pre-drilled holes — Burgess technique) provided stable muscle attachment with #1 Vicryl × 4-6 sutures, preventing muscle retraction and providing a cushion over the bone end. Alternative myoplasty (suturing anterior to posterior fascia — non-bone-anchored) was acceptable for vascular patients with limited rehabilitation potential.`,
      `Excess posterior flap was tailored at the proximal anterior incision. The deep fascia was closed with running 0 Vicryl. The skin was closed loosely with interrupted 3-0 nylon vertical mattress sutures (or staples) — loose closure is essential to allow drainage of postoperative edema; tight closure causes wound dehiscence. A non-adherent gauze + bulky pressure dressing + immediate postoperative rigid prosthetic dressing (IPOP — preferred per multiple RCTs to prevent flexion contracture and promote early prosthetic fitting) or sterile soft dressing were applied. The tourniquet was deflated.`,
      `Postoperative care: knee extension splint to prevent flexion contracture; multimodal analgesia + phantom limb pain prevention (gabapentin 300 mg TID + amitriptyline 25 mg qhs); early prosthetic team consultation (typical first prosthetic fitting at 6-8 weeks once stump shape stabilised); contralateral limb optimization (vascular workup if peripheral arterial disease — 50% of dysvascular amputees lose contralateral limb within 5 years); rehabilitation focus on quadriceps strengthening, transfer training, gait re-training. Wound check at 2 weeks for staple/suture removal (or sooner if concern). Stump shrinker sock at 2-3 weeks once wound healed.`,
    ];
  }

  if (includesAny(name, ["above-knee amputation", "aka", "transfemoral"])) {
    return [
      `Indication for AKA was reviewed: failed BKA with stump breakdown (most common); inadequate popliteal inflow precluding BKA viability; extensive wet gangrene above the knee; non-ambulatory patient with non-reconstructable CLTI for source control of pain or sepsis; trauma with non-salvageable limb; malignancy with proximal involvement. Preoperative discussion emphasised the AKA's lower energy expenditure walking with prosthesis is achievable in only 25-50% of dysvascular AKA patients (vs 70-80% of BKA — major rehabilitation difference favoring BKA when feasible). The patient was positioned supine. The entire limb was prepped and draped. Sandbag under the ipsilateral hip allowed lateral access. The infected/gangrenous foot was wrapped in a sterile bag.`,
      `The amputation level was marked: typically 10-12 cm proximal to the knee joint (or two hand-breadths) — preserving as much length as possible while allowing 8-10 cm clearance for the prosthetic knee joint. The skin incision was marked using equal anterior and posterior fish-mouth flaps, with each flap length approximately equal to half the AP thigh diameter at the amputation level. Care was taken not to mark too short a flap (causing skin tension and ischemia) or too long (causing dog-ears).`,
      `The anterior incision was made first and deepened through the skin and subcutaneous tissue. The quadriceps muscle group (rectus femoris, vastus lateralis, vastus medialis, vastus intermedius) was transected with electrocautery 2-3 cm distal to the planned bone cut. The superficial femoral artery and vein were identified within the adductor canal (Hunter's canal), doubly clamped, transected, and triple suture-ligated with 2-0 silk (artery first to limit blood loss; the SFA may have ongoing pulsatile flow even in CLTI patients).`,
      `The posterior incision was made and deepened through the hamstring muscles (biceps femoris, semitendinosus, semimembranosus). The sciatic nerve was identified posterolaterally — the nerve was gently pulled distally, the accompanying sciatic nerve artery (vasa nervorum, sometimes substantial) ligated with 4-0 silk to prevent stump hematoma, and the nerve sharply transected on stretch with a #15 blade and allowed to retract proximally. No ligation on the nerve trunk itself (causes neuroma; some surgeons place a short 4-0 chromic suture loosely around the nerve sheath to seal the perineurium without compressing the nerve).`,
      `The femur was transected with a sagittal saw at the planned level, perpendicular to the long axis of the femur. The bone end was rasped smooth and the medullary canal was irrigated. Periosteum was trimmed flush with the bone end (minimal stripping to preserve vascularity). Hemostasis was meticulously confirmed at all muscle and vascular cuts.`,
      `Myodesis was performed for ambulatory candidates (essential for stable prosthetic fitting + walking — Gottschalk technique): drill holes were created in the distal lateral femur (4-5 holes spaced 1 cm apart). The adductor magnus tendon (insertion at the adductor tubercle — the most important muscle for hip adduction during prosthetic gait) was secured to the femur through these drill holes with #1 Vicryl or non-absorbable suture, with the femur held in adduction during suture tying — this prevents progressive hip abduction contracture postoperatively (common in non-myodesis amputations) which severely impairs prosthetic gait. The quadriceps and hamstring muscles were similarly secured with myodesis or myoplasty (anterior-to-posterior fascial suturing).`,
      `The deep fascia was closed with running 0 Vicryl. A 19 Fr Blake drain was placed in the muscle bed and brought out through a separate stab incision laterally — drains are commonly used in AKA due to muscle bed bleeding (in contrast to BKA where drains are routine). The skin and subcutaneous tissue were closed loosely with interrupted 3-0 nylon vertical mattress sutures (or staples) — loose closure essential. A bulky pressure dressing was applied with the hip in extension. Early ambulation goals same as BKA: prevent flexion contracture (hip + knee), early prosthetic team consultation, multimodal analgesia, phantom-limb pain prevention.`,
      `Postoperative care: hip extension splint or pillow under the stump for stretches every 2-3 hours to prevent hip flexion contracture; aggressive PT focus on quadriceps and hip extensor strengthening; prosthetic team consultation; counseling on realistic functional expectations (prosthetic walking is achievable in only 25-50% of dysvascular AKA patients with associated comorbidities). Drain removal when output < 30 mL/day (typically POD 2-3). Staples or sutures removed at 2-3 weeks. Stump shrinker at 4-6 weeks once wound healed for further shaping in preparation for prosthetic fitting at 8-12 weeks.`,
    ];
  }

  if (includesAny(name, ["popliteal aneurysm"])) {
    return [
      `Popliteal artery aneurysm was characterised: size (intervention indicated for asymptomatic ≥ 2.0 cm or any symptomatic — acute thrombosis, distal embolisation, rupture, mass effect); presence of mural thrombus (50-75% of popliteal aneurysms have thrombus, with high embolic risk); contralateral status (50% bilaterality); presence of additional aneurysms (40% have AAA, 30% have femoral aneurysm — full vascular survey indicated). Outflow assessment was critical: angiography or CTA confirmed presence of patent runoff vessels (≥ 1 patent tibial vessel — three-vessel runoff is best, single-vessel runoff is acceptable; no runoff is a relative contraindication to bypass and may favor anticoagulation alone if asymptomatic).`,
      `Conduit was selected: ipsilateral GSV is the gold standard (5-year patency 70-80% with vein vs 50-60% with prosthetic per JVS Hopkins data); contralateral GSV or arm vein if ipsilateral GSV unavailable; ePTFE or Dacron prosthetic only if no autogenous conduit available, with poorer long-term patency for below-knee distal anastomoses. The patient was positioned supine on the operating table with the operative leg externally rotated and slightly flexed at the knee (to expose the medial leg for both proximal and distal exposures and the GSV harvest course).`,
      `${name.includes("posterior") ? "Posterior approach (preferred for posterior popliteal aneurysm with no need for distal extension): the patient was positioned prone with the leg slightly flexed. An S-shaped incision was made over the popliteal fossa, with the incision crossing the popliteal crease obliquely. The fascia was incised, the small saphenous vein and sural nerve identified and preserved, and the popliteal vessels exposed posteriorly with the aneurysm directly visible." : "Medial approach (standard for most popliteal aneurysms — allows for distal extension to tibial vessels and proximal extension to SFA without repositioning): two incisions were made on the medial aspect of the leg — supragenicular medial thigh incision exposing the SFA at the adductor hiatus (Hunter's canal exit), and infragenicular medial calf incision exposing the popliteal artery distal to the aneurysm and the tibioperoneal trunk."} The vessels were dissected free and controlled with vessel loops proximal and distal to the aneurysm.`,
      `The greater saphenous vein was harvested through 2-3 small interrupted incisions along its course (skin-bridge technique to minimise wound complications) or via continuous incision for poor-quality vein assessment. The vein was prepared on the back table: tributaries ligated with 4-0 silk, the vein flushed with heparinised saline, and inspected for varicosities or stenoses. A reverse vein conduit was used for above-knee bypass; in-situ technique with valvulotomy preserved branches and was preferred for distal popliteal-to-tibial bypass when in-situ length matched anatomy.`,
      `The patient was systemically heparinised with 100 U/kg IV heparin and ACT was confirmed > 250 seconds. Proximal control of the SFA was obtained with a vascular clamp; distal control of the popliteal artery (or tibial vessels for distal bypass) was obtained.`,
      `Proximal anastomosis: a longitudinal arteriotomy was made on the SFA (or proximal popliteal). The vein conduit was beveled to match. An end-to-side anastomosis was constructed with running 5-0 Prolene from heel to toe, with parachute technique for the corner. Flushing was performed before final tying — proximal flushing of the artery to clear any debris, then retrograde flushing of the conduit to remove air. The anastomosis was tested by releasing proximal control briefly and inspecting for hemostasis.`,
      `Distal anastomosis: the conduit was tunnelled in the anatomic plane (preferred for popliteal-popliteal bypass to follow the natural course of the popliteal artery) or subcutaneously (for fem-to-distal-popliteal bypass) — the tunnel was carefully created with a Yankauer or vessel tunnelling instrument to avoid kinking or torsion. The distal anastomosis was created end-to-side at the distal popliteal or tibial vessel with running 6-0 to 7-0 Prolene depending on vessel size, again with parachute technique and flushing before final tying.`,
      `Aneurysm management: the aneurysm was either (1) excluded by ligating proximal and distal of the aneurysm sac (preferred for most cases — the bypass restores flow and the excluded sac thromboses; back-bleeding from geniculate branches can sometimes maintain sac perfusion requiring later embolisation if persistent expansion), or (2) resected with interposition (only when sac is causing local mass effect such as venous compression, nerve compression, or skin necrosis — adds operative time and risk of nerve/vein injury). Geniculate branches feeding the aneurysm sac were ligated with 2-0 silk to prevent retrograde sac perfusion.`,
      `Flow was restored by sequential clamp release (distal first, then proximal). Distal Doppler signals were confirmed in the DP and PT arteries — improvement from preoperative absent/dampened signals to brisk triphasic signals. Completion duplex or angiography confirmed graft patency, no kinking, and no distal embolisation. Protamine was administered (1 mg per 100 U heparin given) for partial reversal. Wounds were closed in layers: muscle and fascia with 0 Vicryl, subcutaneous 3-0 Vicryl, skin 4-0 Monocryl subcuticular. Postop: serial pulse and Doppler checks, dual antiplatelet therapy (aspirin + clopidogrel × 6 weeks then aspirin alone), surveillance duplex at 1 month, 6 months, then annually for graft patency assessment.`,
    ];
  }

  if (includesAny(name, ["distal bypass", "fem-tibial", "fem-pt", "popliteal-pedal", "popliteal-tibial"])) {
    return [
      `Indication was confirmed: chronic limb-threatening ischemia (CLTI Rutherford 4-6: 4 = ischemic rest pain; 5 = minor tissue loss; 6 = major tissue loss/gangrene) with documented infrapopliteal disease and absent/inadequate outflow precluding fem-pop bypass. WIfI staging was reviewed (Wound, Ischemia, foot Infection — guides revascularisation urgency: WIfI 4 mandates urgent revascularisation, WIfI 1 may permit medical management). Preoperative angiography identified the optimal target distal vessel: anterior tibial (best for direct angiosome perfusion to dorsum + lateral foot), posterior tibial (best for plantar foot — most reliably patent in diabetics), peroneal (last-choice — provides only collateral perfusion to foot but acceptable when AT and PT are not available). Angiosome-directed revascularisation (target the artery feeding the wound's angiosome) is supported by retrospective evidence for improved wound healing.`,
      `Conduit selection: ipsilateral GSV is gold standard (5-year primary patency for fem-distal bypass with vein 50-65%, prosthetic 25-40% per JVS data); contralateral GSV, arm vein (cephalic + basilic), or composite/spliced vein for inadequate ipsilateral GSV; ePTFE prosthetic only as last resort with consideration of distal vein patch or cuff (Miller cuff or Taylor patch — can improve prosthetic patency). Preoperative duplex vein mapping confirmed GSV diameter > 3 mm throughout the planned conduit length. The patient was positioned supine. Bilateral lower extremities were prepped and draped (allowing contralateral GSV harvest if needed). Antibiotic prophylaxis (cefazolin 2 g + clindamycin if penicillin allergy) was given for prosthetic graft cases.`,
      `A longitudinal incision was made over the common femoral artery in the groin and the CFA, SFA, and profunda were exposed and encircled with vessel loops. The CFA was inspected for inflow disease — significant inflow stenosis required pre-bypass endarterectomy + patch angioplasty or sequential proximal endovascular intervention. A separate distal incision exposed the target tibial vessel: anterior tibial accessed lateral to the tibialis anterior tendon at mid-leg; posterior tibial accessed posterior to the medial malleolus or higher in the medial leg behind the tibia; peroneal accessed from a lateral approach with fibular partial resection or from a medial approach. The target vessel was dissected free, controlled with delicate vessel loops, and inspected for adequate caliber and quality (target diameter ≥ 1.5-2 mm; smaller vessels have poor patency).`,
      `The greater saphenous vein was harvested in non-reversed (in-situ technique with valvulotomy — preserves the natural saphenous taper, with diameter matching the inflow at the proximal anastomosis and the outflow at the distal anastomosis; requires meticulous valve disruption with valvulotome and tributary ligation through a separate stab to prevent steal) or reverse fashion (reversed vein — proximal vein matches the small distal vessel; technically simpler but distal end is the smaller vein end matched to the larger inflow; some hemodynamic mismatch). For very long bypasses or limited GSV, composite (vein + vein splice with running 7-0 Prolene at junction) or sequential (jump graft to two distal targets) configurations were considered. Tributaries on the harvested vein were ligated with 4-0 silk near the vein wall (avoid stenosis from incorporated tributary stumps).`,
      `The patient was systemically heparinised with 100 U/kg IV heparin and ACT confirmed > 250 seconds. Proximal control of the CFA was obtained. The proximal anastomosis was created end-to-side to the CFA with running 5-0 Prolene over a longitudinal arteriotomy. The vein was beveled to match the arteriotomy length. Parachute technique was used for the heel of the anastomosis with flushing prior to final tying.`,
      `A subcutaneous or anatomic tunnel was created between the two incisions using a vessel tunnelling rod, with attention to: (1) avoid kinking at the popliteal fossa (the bend at the knee can cause flow disruption — the bypass should follow a gentle curve); (2) avoid torsion (the proximal and distal ends must be aligned correctly — pre-tunnelling marker stitches help); (3) leave enough length for natural ambulation (excessive length causes kinking; insufficient length causes tension). The vein was passed through the tunnel and the orientation confirmed.`,
      `The distal anastomosis was created end-to-side to the target tibial vessel using running 7-0 Prolene under loupe magnification (×3.5-4.5) or operating microscope for small target vessels. Care was taken to avoid posterior wall injury (especially in calcified vessels), to ensure the vein lies smoothly against the artery, and to flush the conduit and artery thoroughly before final tying. The anastomosis was tested by releasing distal control briefly to assess for hemostasis.`,
      `Flow was restored by sequential clamp release: distal control released first (allowing back-flow from collateral runoff), then proximal release. The foot was assessed: typical observations include warmth, capillary refill restored, and Doppler signals on the DP/PT/plantar/digital arteries. Completion angiography (preferred for distal bypass — direct visualisation of distal anastomosis + outflow + foot perfusion) confirmed: graft patency without kinking; no distal embolisation; restored flow to the target angiosome; no anastomotic narrowing or intimal flap. Any defect identified prompted immediate revision.`,
      `Protamine was administered (1 mg per 100 U heparin given) for partial reversal. Wounds were closed in layers (muscle and fascia with 0 Vicryl, subcutaneous 3-0 Vicryl, skin 4-0 Monocryl subcuticular). Postoperative care: hourly distal pulse + Doppler checks × 6 hours, then q4h × 24 h; serial CK + creatinine for compartment syndrome / rhabdomyolysis surveillance; therapeutic anticoagulation (heparin to enoxaparin or DOAC for 48-72 hours) bridging to dual antiplatelet (aspirin 81 mg + clopidogrel 75 mg × 6 weeks then ASA alone — VOYAGER PAD trial supports rivaroxaban 2.5 mg BID + ASA for 12 months for further patency benefit). Surveillance duplex at 1, 3, 6, 12 months then annually — moderate stenosis (PSV ratio > 2.5) detected on surveillance was treated with PTA + stent before progression to graft thrombosis. Wound care at 2 weeks for staple removal. Long-term: 50% primary patency at 5 years for vein bypass; limb salvage rate 60-70% at 5 years for CLTI.`,
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
