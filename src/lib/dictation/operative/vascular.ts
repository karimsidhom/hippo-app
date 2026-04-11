import type { CaseLog } from "@/lib/types";
import { includesAny } from "../shared/format";

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
