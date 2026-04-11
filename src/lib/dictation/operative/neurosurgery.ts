import type { CaseLog } from "@/lib/types";
import { includesAny } from "../shared/format";

// ---------------------------------------------------------------------------
// Neurosurgery — procedure-specific operative steps.
//
// Covers the high-volume cranial and spinal cases: craniotomies for tumor /
// hematoma, burr holes, EVDs, shunts, decompressive laminectomies, and
// microdiscectomies. Tone follows standard neurosurgical operative-note
// conventions (meticulous positioning, navigation, microscope use, dural
// closure, wound layers).
// ---------------------------------------------------------------------------

function neuroOpSteps(c: CaseLog): string[] {
  const name = c.procedureName.toLowerCase();

  // -- Craniotomy for tumor --------------------------------------------------
  if (includesAny(name, ["craniotomy for tumor", "tumor resection", "supratentorial tumor"])) {
    return [
      `The patient was positioned [supine / lateral / prone] with the head secured in a Mayfield three-point head holder. Neuronavigation was registered to the preoperative MRI and accuracy confirmed.`,
      `A [curvilinear / question-mark] scalp incision was planned over the lesion and infiltrated with local anesthetic. The scalp was incised, Raney clips applied, and the myocutaneous flap elevated to expose the cranium. Subperiosteal dissection defined the craniotomy margins.`,
      `Burr holes were placed at [__] sites. The craniotomy was completed with a high-speed drill and side-cutting bit, and the bone flap elevated. The dura was inspected, tented up with 4-0 Nurolon stitches, and opened in a [cruciate / U-shaped] fashion with a #11 blade and curved scissors under the operating microscope.`,
      `Under the microscope, the tumor was identified. A subpial / transcortical approach was used. The tumor was debulked internally with the ultrasonic aspirator and systematically separated from surrounding brain along the gliotic plane. Frozen section confirmed [diagnosis]. Gross total resection was achieved as tolerated by neuromonitoring and the vascular anatomy.`,
      `The resection cavity was inspected for hemostasis with copious irrigation and bipolar cautery. Hemostasis was complete. The dura was closed in a watertight fashion with running 4-0 Nurolon and a dural substitute patch as needed. The bone flap was replaced and secured with [titanium cranial plates]. The galea was closed with 2-0 Vicryl and the skin with staples.`,
    ];
  }

  // -- Craniotomy for hematoma / decompressive --------------------------------
  if (includesAny(name, ["craniotomy for hematoma", "decompressive craniectomy", "evacuation of hematoma", "subdural", "epidural hematoma"])) {
    const isCraniectomy = includesAny(name, ["craniectomy"]);
    return [
      `The patient was positioned supine with the head turned to the contralateral side and fixed in a Mayfield head holder. Rapid sequence positioning was used given the emergent nature of the case.`,
      `A large [reverse question-mark] scalp incision was made and the myocutaneous flap elevated. Burr holes were rapidly placed and a large ${isCraniectomy ? "craniectomy" : "craniotomy"} was fashioned. The bone flap was elevated.`,
      `The dura was opened under tension and the [subdural / epidural] hematoma was evacuated with irrigation and suction. The underlying cortex was inspected for active bleeding; the source of bleeding was identified and controlled with bipolar cautery. The brain was noted to be [edematous / slack after decompression].`,
      `Hemostasis was meticulously confirmed. ${isCraniectomy ? "The bone flap was not replaced and was banked in the abdominal subcutaneous pocket / cryopreserved. Duraplasty was performed with a dural substitute to allow room for brain swelling." : "The dura was closed primarily in a watertight fashion and the bone flap replaced and secured with cranial plates."}`,
      `The galea was closed with 2-0 Vicryl and the skin with staples. A sterile dressing was applied.`,
    ];
  }

  // -- Burr hole / SDH drainage ----------------------------------------------
  if (includesAny(name, ["burr hole", "subdural drainage", "twist drill"])) {
    return [
      `The patient was positioned supine with the head turned. The planned burr hole site was marked, shaved, and infiltrated with local anesthetic.`,
      `A small linear scalp incision was made and a self-retaining retractor placed. A burr hole was drilled through the cranium with a perforator followed by a matchstick bit. The dura was opened in a cruciate fashion and coagulated.`,
      `Dark, motor-oil chronic subdural hematoma was encountered and evacuated under low suction with copious warm saline irrigation until the effluent ran clear. A subdural drain was placed and tunneled through a separate stab incision.`,
      `The scalp was closed in layers with Vicryl to the galea and staples or nylon to the skin. A sterile dressing was applied.`,
    ];
  }

  // -- EVD placement ---------------------------------------------------------
  if (includesAny(name, ["external ventricular drain", "evd", "ventriculostomy"])) {
    return [
      `The patient was positioned supine with the head of bed elevated. The right (non-dominant) Kocher's point was identified [10 cm posterior to the nasion and 3 cm lateral to midline] and marked. The area was shaved, prepped, and draped in the usual sterile fashion. Local anesthetic was infiltrated.`,
      `A small stab incision was made at the entry point. A twist-drill burr hole was made through the cranium. The dura was punctured with a spinal needle. A ventricular catheter was advanced along a trajectory aimed at the ipsilateral medial canthus and a point just anterior to the ipsilateral external auditory canal.`,
      `CSF was encountered at [__] cm depth and was noted to be [clear / xanthochromic / bloody]. The catheter was tunneled subcutaneously and secured to the scalp with 2-0 nylon. The external drainage system was connected and leveled at the tragus at [10 cm H2O].`,
    ];
  }

  // -- VP shunt --------------------------------------------------------------
  if (includesAny(name, ["vp shunt", "ventriculoperitoneal", "shunt placement"])) {
    return [
      `The patient was positioned supine with the head turned to the left and a shoulder roll placed. The right cranial, cervical, and abdominal sites were prepped and draped as a single field.`,
      `A curvilinear scalp incision was made at the planned entry point (Kocher's or Frazier's) and a burr hole was made. The ventricular catheter was passed into the ipsilateral frontal horn and CSF return was confirmed. The catheter was connected to a [programmable medium-pressure valve] with an on-off reservoir.`,
      `The distal catheter was tunneled subcutaneously from the cranial site to a small supraumbilical abdominal incision. The peritoneum was entered under direct vision and the distal catheter passed into the peritoneal cavity with free CSF flow confirmed.`,
      `All incisions were irrigated and closed in layers. Valve settings were confirmed prior to sterile dressings being applied.`,
    ];
  }

  // -- Microdiscectomy -------------------------------------------------------
  if (includesAny(name, ["microdiscectomy", "lumbar discectomy"])) {
    return [
      `The patient was positioned prone on a Wilson frame with the abdomen hanging free. Fluoroscopy confirmed the correct level for the herniation.`,
      `A small midline incision was made over the target level and carried down through the lumbodorsal fascia. Subperiosteal dissection exposed the lamina. A self-retaining tube retractor was placed.`,
      `Under the operating microscope, a small laminotomy was performed and the ligamentum flavum was carefully removed to expose the dura and exiting nerve root. The nerve root was gently retracted medially to expose the disc herniation.`,
      `The disc fragment was identified and removed, followed by curettage of loose disc material within the disc space. The nerve root was then noted to be fully decompressed and pulsatile.`,
      `Hemostasis was obtained with bipolar cautery. The wound was irrigated and closed in layers: lumbodorsal fascia with 0 Vicryl, subcutaneous with 2-0 Vicryl, and skin with Monocryl.`,
    ];
  }

  // -- Laminectomy / decompression -------------------------------------------
  if (includesAny(name, ["laminectomy", "decompressive laminectomy", "spinal stenosis decompression"])) {
    return [
      `The patient was positioned prone on a Jackson table. Fluoroscopy confirmed the correct levels. A midline posterior incision was made and dissection carried down to the spinous processes and laminae.`,
      `A subperiosteal dissection exposed the laminae at each target level. Using a high-speed drill and Kerrison rongeurs, the laminae were removed systematically with preservation of the facet joints to maintain spinal stability. The ligamentum flavum was resected to fully decompress the thecal sac and nerve roots bilaterally.`,
      `Adequate decompression was confirmed by free dural pulsations and unrestricted nerve root excursion. Hemostasis was achieved with bipolar cautery and hemostatic agents. The wound was irrigated and closed in layers over a drain.`,
    ];
  }

  // -- Carotid endarterectomy is vascular, not neurosurgery — skip

  // Generic neurosurgery fallback
  return [
    `The patient was carefully positioned with the head appropriately secured. Neuronavigation was registered where applicable. The planned approach was marked and the operative field was prepped and draped.`,
    ``,
    `The ${c.procedureName} was carried out with meticulous microsurgical technique, preservation of eloquent neural and vascular structures, and frequent communication with anesthesia and neuromonitoring. [Expand with procedure-specific technical steps.]`,
    ``,
    `Hemostasis was confirmed. Dural closure (where applicable) was watertight. The wound was closed in anatomic layers.`,
  ];
}

export function neurosurgeryBody(c: CaseLog): string[] {
  const preamble = [
    `Description of Procedure: The risks, benefits, and alternatives were discussed with the patient and/or surrogate, and informed consent was obtained. The patient was brought to the operating room and carefully positioned with all pressure points padded. After induction of general endotracheal anesthesia, pre-incision antibiotics were administered and neuromonitoring baselines were obtained where applicable.`,
    ``,
    `A surgical time-out was completed confirming patient identity, procedure, site, side, consent, antibiotics, blood products, and imaging. The operative site was prepped and draped in the usual sterile fashion.`,
    ``,
  ];
  const closure = [
    ``,
    `At the end of the procedure, hemostasis was confirmed, sponge and instrument counts were correct, and the patient was awakened and extubated [in the OR / transferred to the ICU intubated]. A postoperative neurologic exam was performed and documented separately.`,
  ];
  return [...preamble, ...neuroOpSteps(c), ...closure];
}
