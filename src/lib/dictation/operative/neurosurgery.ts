import type { CaseLog } from "@/lib/types";
import { includesAny } from "../shared/format";
import type { TopMatter } from "./types";

// ---------------------------------------------------------------------------
// Neurosurgery — forced fields:
//   - Pre- and post-operative GCS and motor exam
//   - Intraoperative neuromonitoring (SSEP, MEP, EMG)
//   - Frame/neuronavigation accuracy
//   - Dural closure technique and watertight status
//   - EVD / ICP readings when placed
//   - Hemostasis and brain relaxation
//   - Imaging correlation (MRI/CT stealth)
// ---------------------------------------------------------------------------

export function neurosurgeryTopMatter(c: CaseLog): TopMatter {
  const name = c.procedureName.toLowerCase();

  if (includesAny(name, ["craniotomy for tumor", "tumor resection", "glioma", "meningioma", "metastasis"])) {
    return {
      anesthesia: "General endotracheal anesthesia with arterial line, Foley catheter, and continuous intraoperative neuromonitoring (SSEP, MEP, EMG).",
      ebl: "Approximately 150–400 ml.",
      drains: "Subgaleal drain placed; Foley catheter.",
      specimens: "Tumor specimen submitted fresh for frozen section and permanent pathology.",
      disposition: "The patient tolerated the procedure well. Extubated in the OR after intact neurologic exam. Admitted to the neuro-ICU for serial hourly neurologic checks, blood pressure control, and seizure prophylaxis. Postoperative MRI within 24–48 hours.",
    };
  }

  if (includesAny(name, ["craniotomy for hematoma", "evacuation", "subdural", "epidural"])) {
    return {
      anesthesia: "General endotracheal anesthesia with arterial line and neuromonitoring.",
      ebl: "Approximately 200–400 ml.",
      drains: "Subdural drain / subgaleal drain; Foley catheter.",
      specimens: "None.",
      disposition: "The patient tolerated the procedure well. Admitted to the neuro-ICU for hourly neurologic checks, blood pressure control, and CT imaging within 24 hours.",
    };
  }

  if (includesAny(name, ["burr hole", "chronic subdural"])) {
    return {
      anesthesia: "General / local with MAC.",
      ebl: "Minimal.",
      drains: "Subdural drain to gravity drainage × 24–48 hours.",
      specimens: "None.",
      disposition: "The patient tolerated the procedure well. Admitted for 24-hour drain monitoring, serial neuro exams, and repeat CT prior to drain removal.",
    };
  }

  if (includesAny(name, ["evd", "external ventricular drain"])) {
    return {
      anesthesia: "Local anesthesia with MAC.",
      ebl: "Minimal.",
      drains: "External ventricular drain leveled at the tragus at [__] cmH2O, draining clear CSF.",
      specimens: "CSF sent for cell count, protein, glucose, Gram stain, and culture.",
      disposition: "The patient tolerated the procedure well. ICU admission. Serial ICP monitoring and EVD output recording. CT confirmation of catheter tip placement.",
    };
  }

  if (includesAny(name, ["vp shunt", "ventriculoperitoneal shunt"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "CSF sent for studies.",
      disposition: "The patient tolerated the procedure well. Admitted for overnight observation. Shunt valve setting confirmed. Postoperative CT head / shunt series to confirm placement.",
    };
  }

  if (includesAny(name, ["microdiscectomy", "laminectomy", "decompression"])) {
    return {
      anesthesia: "General endotracheal anesthesia with neuromonitoring.",
      ebl: "Approximately 100–250 ml.",
      drains: "None routinely.",
      specimens: "Disc / ligamentum flavum / bone to pathology as indicated.",
      disposition: "The patient tolerated the procedure well. Intact postoperative neurologic exam. Admitted briefly for pain control and mobilization. PT for ambulation and log-roll precautions.",
    };
  }

  // REVIEW: neurosurgery attending sign-off needed before residents bill from these.
  if (includesAny(name, ["aneurysm clipping", "cerebral aneurysm"])) {
    return {
      anesthesia: "General endotracheal anesthesia with arterial line, central access, neuromonitoring, mannitol, and burst suppression.",
      ebl: "Approximately 200–500 ml (variable; can be brisk if intraoperative rupture).",
      drains: "Subgaleal drain.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well. Neuro-ICU admission for hourly neuro checks, BP control (avoid HTN), nimodipine, vasospasm surveillance with TCDs, repeat CTA at 7 days.",
    };
  }

  if (includesAny(name, ["avm resection", "arteriovenous malformation"])) {
    return {
      anesthesia: "General endotracheal anesthesia with arterial line, central access, neuromonitoring, controlled hypotension during dissection.",
      ebl: "Approximately 300–800 ml (variable).",
      drains: "Subgaleal drain.",
      specimens: "AVM specimen to pathology.",
      disposition:
        "The patient tolerated the procedure well. Neuro-ICU. Plan: BP control, hourly neuro checks, MRI/MRA at 24h to confirm complete resection.",
    };
  }

  if (includesAny(name, ["dbs", "deep brain stimulator"])) {
    return {
      anesthesia: "Local anesthesia with sedation (awake) for lead placement; general for IPG.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well. Admitted overnight. Plan: postoperative CT/MRI to confirm lead position. IPG activation in clinic at 2–4 weeks.",
    };
  }

  if (includesAny(name, ["acdf", "anterior cervical discectomy"])) {
    return {
      anesthesia: "General endotracheal anesthesia with neuromonitoring.",
      ebl: "Approximately 50–150 ml.",
      drains: "Penrose / 7 Fr Jackson-Pratt drain × 24h.",
      specimens: "Disc + osteophyte fragments + structural allograft (or trough cage) for pathology if indicated.",
      disposition:
        "The patient tolerated the procedure well. Admitted for 24h neuro and dysphagia monitoring. Soft cervical collar × 4–6 weeks. Soft diet, advance per dysphagia screen.",
    };
  }

  if (includesAny(name, ["kyphoplasty", "vertebroplasty"])) {
    return {
      anesthesia: "Local with sedation or general.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Bone biopsy if indicated.",
      disposition:
        "The patient tolerated the procedure well. Discharge home the same day. Plan: gradual mobilisation, bone-density assessment, anti-osteoporotic therapy.",
    };
  }

  return {
    anesthesia: "General endotracheal anesthesia with arterial line and neuromonitoring.",
    ebl: "Approximately ________ ml.",
    drains: "[Describe drains or 'None'].",
    specimens: "[Describe specimens or 'None'].",
    disposition: "The patient tolerated the procedure well. Neuro-ICU admission per standard neurosurgery protocol.",
  };
}

export function neurosurgeryFindings(c: CaseLog): string {
  const name = c.procedureName.toLowerCase();

  if (includesAny(name, ["craniotomy for tumor"])) {
    return `Preoperative MRI demonstrated an enhancing mass in the [right frontal / left temporal / other] lobe measuring approximately [__] × [__] × [__] cm with surrounding vasogenic edema. Preoperative GCS was 15 with [intact / mild] focal neurologic deficit. Frameless stealth neuronavigation was registered with accuracy within 1 mm. Intraoperative neuromonitoring with SSEPs and MEPs was intact throughout. The tumor was [firm / soft / vascular / cystic] and was resected to a [gross-total / subtotal] extent under microscopic visualization. Brain relaxation was excellent and the cortex was protected throughout. Hemostasis within the tumor bed was meticulously confirmed. The dura was closed in a watertight fashion and leak-tested with Valsalva.`;
  }

  if (includesAny(name, ["craniotomy for hematoma", "evacuation", "subdural", "epidural"])) {
    return `Preoperative CT demonstrated an acute [subdural / epidural / intraparenchymal] hematoma in the [right / left] [frontal / temporal / parietal] region with [__] mm of midline shift and [compressed / effaced] basal cisterns. Preoperative GCS was [__] with [__] pupillary response. The hematoma was evacuated completely with immediate brain relaxation and decompression of the brainstem. Active bleeding sources were controlled. [A decompressive craniectomy was performed / the bone flap was replaced] based on intraoperative swelling. Hemostasis was meticulously confirmed.`;
  }

  if (includesAny(name, ["burr hole", "chronic subdural"])) {
    return `Preoperative CT demonstrated a chronic / subacute subdural hematoma with a hypodense / mixed density collection measuring [__] mm in maximum thickness and [__] mm of midline shift. Preoperative GCS [__] with [mild hemiparesis / confusion]. Two burr holes were made, the dura was opened, and xanthochromic subdural fluid was evacuated with copious saline irrigation until the effluent ran clear. A subdural drain was left in place.`;
  }

  if (includesAny(name, ["evd", "external ventricular drain"])) {
    return `Preoperative imaging demonstrated hydrocephalus with [effaced / enlarged] ventricles. Preoperative GCS [__]. A right / left frontal approach via Kocher's point was used with trajectory toward the ipsilateral medial canthus and external auditory meatus. The ventricle was successfully cannulated on the first pass at a depth of approximately 6 cm, with immediate return of clear CSF. ICP on initial drainage was [__] cmH2O.`;
  }

  if (includesAny(name, ["microdiscectomy", "laminectomy", "decompression"])) {
    return `Preoperative MRI demonstrated [central / paracentral / foraminal] disc herniation / severe central canal stenosis at [__] causing compression of the traversing / exiting nerve root. Preoperative neurologic exam showed [radicular symptoms in the __ distribution / motor weakness of __]. Intraoperative fluoroscopy confirmed the correct level. The nerve root was identified, decompressed, and mobilized without injury. Hemostasis within the epidural space was meticulously confirmed.`;
  }

  if (includesAny(name, ["aneurysm clipping", "cerebral aneurysm"])) {
    return `Preoperative CTA / DSA demonstrated a [__] mm saccular aneurysm at the [ACOM / PCOM / MCA / ICA / PICA] with a [narrow / wide] neck and a [__]:1 dome-to-neck ratio. The aneurysm was identified intraoperatively under the microscope after wide Sylvian fissure dissection. Temporary clipping was used for [__] minutes during permanent clip placement. A [Yasargil / Sugita] [__] mm clip was placed across the neck with full obliteration confirmed on intraoperative ICG videoangiography. Parent vessels and perforators were patent.`;
  }

  if (includesAny(name, ["avm resection", "arteriovenous malformation"])) {
    return `Preoperative DSA / MRI defined a Spetzler-Martin grade [__] AVM in the [location] with feeders from [arteries] and drainage into [veins]. Intraoperative findings confirmed the angio-architecture. Feeders were systematically coagulated and divided. The nidus was circumferentially mobilised and the major draining vein taken last. Postoperative ICG videoangiography confirmed complete resection without residual nidus.`;
  }

  if (includesAny(name, ["dbs", "deep brain stimulator"])) {
    return `Stereotactic frame was placed and target coordinates calculated from preoperative MRI fused with stereotactic CT. Microelectrode recordings confirmed appropriate firing patterns at the [STN / GPi / VIM] target. Test stimulation produced expected motor improvement / minimal side effects. The lead was secured at the burr hole with a Stim-Loc device. The IPG was connected through a subcutaneous tunnel to the infraclavicular pocket.`;
  }

  if (includesAny(name, ["acdf", "anterior cervical discectomy"])) {
    return `Preoperative MRI demonstrated cervical disc herniation / spondylotic disease at [C5–6 / C6–7 / __] with foraminal narrowing and cord / root compression. Intraoperative fluoroscopy confirmed the correct level. The disc and posterior osteophytes were removed under microscope, decompressing the cord and bilateral nerve roots. A [structural allograft / PEEK cage] filled with cancellous bone was inserted, secured with an anterior cervical plate and screws.`;
  }

  if (includesAny(name, ["kyphoplasty", "vertebroplasty"])) {
    return `Preoperative MRI / CT demonstrated [acute / subacute] vertebral compression fracture at [__] with [__]% loss of vertebral height. Bilateral transpedicular access was achieved under fluoroscopic guidance. [Kyphoplasty: balloon tamps were inflated bilaterally restoring [__]% of vertebral height.] PMMA cement was injected under continuous fluoroscopy with no extravasation into the spinal canal or paravertebral veins.`;
  }

  return `Preoperative imaging was reviewed and intraoperative findings were consistent. Preoperative GCS and neurologic exam were documented. Intraoperative neuromonitoring was intact throughout. Hemostasis was meticulously achieved and the dura was closed in a watertight fashion.`;
}

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

  // -- Aneurysm clipping -----------------------------------------------------
  if (includesAny(name, ["aneurysm clipping", "cerebral aneurysm"])) {
    return [
      `Preoperative workup was reviewed: aneurysm characterised by location, size, neck width, dome-to-neck ratio, branching vessels (CTA + DSA — DSA gold standard for surgical planning); SAH grade (Hunt-Hess I-V, modified Fisher 0-4 — predicts vasospasm risk); aneurysm treatment decision multidisciplinary review (clipping vs coiling per ISAT trial — coiling preferred for posterior circulation, narrow-neck aneurysms; clipping preferred for MCA bifurcation, broad-neck aneurysms, large hematoma evacuation needed). Antifibrinolytics (tranexamic acid 1 g IV) for SAH. Patient positioning: supine with the head turned 30° contralateral and fixed in a Mayfield three-point head holder; the head elevated 15° and slightly extended. Neuronavigation registered. Antibiotics (cefazolin 2 g IV).`,
      `A pterional ('reverse question-mark') skin incision was made starting 1 cm anterior to the tragus and extending forward to the contralateral midline at the hairline. Scalp flap reflected anteriorly with Raney clips. The temporalis muscle was incised and reflected inferiorly with myocutaneous flap technique (preserving frontal branch of facial nerve which courses superficially over the zygomatic arch). MacCarty's keyhole was identified at the frontozygomatic suture. A pterional craniotomy was performed using high-speed drill and side-cutting bit, with attention to drilling the lateral sphenoid wing flat to maximise exposure of the Sylvian fissure (the more lateral sphenoid drilling, the less brain retraction required during dissection — Yasargil emphasised this principle). The bone flap was elevated and the dura inspected.`,
      `The dura was tented up with 4-0 Nurolon stay sutures and opened in a curvilinear fashion based on the sphenoid wing under the operating microscope (Zeiss Pentero 800 or Leica M530OH). Mannitol 1 g/kg + furosemide 20 mg IV were given for brain relaxation. CSF drainage via lumbar drain or ventriculostomy (placed if Hunt-Hess III-V) further relaxed the brain. The brain was inspected; SAH or intracerebral hematoma was managed. Burst suppression with propofol or thiopental was instituted by anesthesia for cerebral protection during temporary clipping (target 5-6 burst-suppression seconds on EEG).`,
      `Sylvian fissure dissection (Yasargil technique): the arachnoid over the Sylvian fissure was incised at its lateral aspect with a #11 blade then microscissors, opening the fissure widely with progressive sharp dissection, working from lateral to medial (proximal to distal). Sylvian veins were preserved (sacrifice causes venous infarction). The fissure was opened to the limen insulae, exposing the M1 segment. The arachnoid bands were sharply divided to release the frontal and temporal lobes from each other and from the carotid cistern. The supracarotid cistern was opened with sharp dissection, releasing CSF to relax the brain.`,
      `Aneurysm exposure: the carotid bifurcation, A1 (anterior cerebral), M1 (middle cerebral), and aneurysm were systematically identified. Critical preoperative landmarks were confirmed: parent vessel + branches in relation to aneurysm neck; perforating arteries (lenticulostriates from M1 — devastating to occlude; recurrent artery of Heubner from proximal A2 — devastating to occlude; thalamoperforators from PCOM/PCA — devastating to occlude). The aneurysm dome was inspected for any thin areas or daughter sacs.`,
      `Proximal control: temporary clips (Yasargil mini-temp clips, 30 g closing pressure — gentler than permanent clips to minimise vessel injury) were placed on the parent artery proximal to the aneurysm. Temporary occlusion time was tracked and limited to ≤ 5-minute intervals (longer occlusion increases ischemic complications; if longer needed, intermittent reperfusion every 5 min for 1 min preserves tissue). Adenosine bolus (transient cardiac arrest, 0.4-0.5 mg/kg) was an alternative for proximal control of giant aneurysms or pseudoaneurysms where temporary clipping was infeasible.`,
      `Permanent clip placement: the aneurysm neck was carefully dissected free of arachnoid, perforators, and adherent vessels — perforators must be visualised and protected, often along the posterior or medial neck. The aneurysm sac was deflated by gentle aspiration with a fine needle if needed for very tense aneurysms (controversial — alternative is direct clipping with maintenance of dome integrity). Permanent titanium aneurysm clips (Yasargil, Sugita, or Lazic) were selected by length and configuration: straight, curved, fenestrated (for branches passing through the clip), bayonet, or angled. The clip was placed across the neck flush with the parent vessel — too distal placement leaves residual neck (regrowth risk); too proximal compromises parent vessel or branches.`,
      `Multiple clips may be required for complex aneurysms: stacking, overlapping, or 'tandem' clip placement. For broad-neck or atherosclerotic necks: angled fenestrated clip was used to allow visualisation of perforators within the fenestration. After permanent clip placement, the temporary clips were released; total temporary occlusion time was [__] minutes. The aneurysm was inspected for dome collapse and absent residual filling.`,
      `Indocyanine green (ICG) videoangiography (Stryker SPY or Zeiss Flow800) was performed: 25 mg ICG injected IV, the microscope switched to fluorescence mode for 1-2 minutes of imaging. Confirmation of: (1) complete obliteration of the aneurysm dome (no fluorescence within sac); (2) patent parent vessel and branches (full ICG flow); (3) patent perforators (small but identifiable ICG flow). Any residual aneurysm filling required clip repositioning. Doppler probe (microvascular Doppler) confirmed parent vessel patency. Intraoperative DSA was used selectively for complex cases (giant aneurysms, suboptimal ICG).`,
      `Hemostasis was meticulously achieved with bipolar cautery and Surgicel/Floseal. The dura was closed watertight with running 4-0 Nurolon. The bone flap was replaced and secured with titanium cranial plates (Synthes, Stryker). Temporalis muscle reapproximated with 0 Vicryl. Galea closed with 3-0 Vicryl. Skin closed with staples. A subgaleal drain was placed. Postop: neuro-ICU × 7-14 days for SAH (vasospasm peak 7-10 days, monitored by daily transcranial Doppler — increasing velocities > 200 cm/sec or rapid rise > 50 cm/sec/day suggests vasospasm; treatment with permissive hypertension, balloon angioplasty, intra-arterial verapamil). Nimodipine 60 mg PO q4h × 21 days (level A evidence reduces poor outcomes). Repeat CTA at 7 days, MRI at 6-12 weeks. Long-term: 5% recurrence after clipping, 30% after coiling — life-long imaging surveillance every 2-5 years.`,
    ];
  }

  // -- AVM resection ---------------------------------------------------------
  if (includesAny(name, ["avm resection", "arteriovenous malformation"])) {
    return [
      `Preoperative AVM workup: DSA + MRI/MRA defined the angio-architecture (feeders, nidus, drainage); Spetzler-Martin grade calculated (size 1-3 + eloquence 0-1 + venous drainage 0-1, total 1-5; SM grade I-II favorable for surgery, IV-V often non-surgical; supplementary Lawton-Young grade adds age + hemorrhage history + diffuseness for nuanced risk assessment); embolisation often performed days before surgery (interventional neuroradiology embolises feeders to reduce intraoperative bleeding by 30-50% — staged Onyx or n-BCA glue embolisation). The patient was positioned with the head fixed in Mayfield based on AVM location, with the contralateral side of the body slightly tilted to permit gravity-assisted brain retraction. Neuronavigation registered. Burst suppression instituted for cerebral protection. Antifibrinolytics held off (TXA may worsen normal pressure perfusion breakthrough). Type and crossmatch 4 units PRBC + cell-saver setup (variable EBL, can be brisk).`,
      `Craniotomy planned to expose the entire nidus + feeders + draining veins (large craniotomy preferred to AVM border + 1-2 cm; never restrict exposure as residual nidus is catastrophic). Standard craniotomy techniques as for tumor resection. Dura opened. Mannitol given for brain relaxation. The surface was inspected; dilated arterialised veins (red instead of blue color due to arterial blood — pathognomonic of AVM drainage) were identified.`,
      `Strategy of feeder-first dissection (the cardinal principle of AVM surgery — must take all feeders before any draining vein, otherwise the nidus engorges with arterial blood without venous outflow → catastrophic intraparenchymal hemorrhage): the feeding arteries were systematically identified and prioritised. Each feeder was: (1) localised by ICG videoangiography or microvascular Doppler; (2) dissected free from surrounding gliotic plane; (3) tested with temporary clip — if no neurological signal change on neuromonitoring + no shift on ICG of normal cortex perfusion, then permanent occlusion; (4) coagulated with bipolar cautery (low setting, 10-15 W, with constant irrigation to prevent vessel rupture from charring); (5) sharply divided.`,
      `Critical principle: distinguish 'true' feeders (terminate in the nidus, can be safely taken) from 'en passage' vessels (continue past the nidus to supply normal brain — must be preserved). En passage vessels are recognised by their continued course beyond the AVM and visible normal-brain branches distally. Sacrifice causes ischemic stroke in normal eloquent cortex.`,
      `Nidus mobilisation: with feeders progressively occluded, the AVM nidus was circumferentially dissected in the gliotic plane around its periphery. The plane was developed with sharp dissection, bipolar cautery for small feeders, microclip for medium feeders. Deep feeders (often the most challenging — perforating arteries from lenticulostriates, choroidals, or brainstem perforators) were addressed last as deep dissection progressed. Subependymal AVMs (extending to ependyma) required ventricular entry, with care for ventricular drainage.`,
      `The major draining vein(s) were carefully preserved throughout — arterialised draining veins were RED (cardinal sign of an AVM draining vein), in contrast to normal cortical veins which are BLUE. The drainage vein progressively darkened (color shift from red to blue) as feeders were occluded — this color change confirmed feeder occlusion progression. The major draining vein was taken LAST when the nidus was completely isolated and showed venous color (blue) on the draining vein.`,
      `Once the nidus was fully isolated and the venous color confirmed blue, the draining vein was permanently coagulated and divided. The AVM specimen was removed en bloc. The cavity was inspected systematically for any residual nidus — incomplete resection causes recurrence and re-hemorrhage. ICG videoangiography confirmed no residual filling within the resection cavity. Intraoperative DSA was performed in selected cases (high SM grade, near-eloquent cortex) to confirm complete obliteration before closure.`,
      `Hemostasis was meticulously confirmed — AVM resection bed often has friable vessels predisposing to delayed hemorrhage, requiring careful inspection at multiple insufflation pressures. NPPB (normal-pressure perfusion breakthrough) — postoperative cerebral edema/hemorrhage from shunted blood now flowing through normal cortex — was anticipated and managed with strict postoperative hypertension control (SBP < 130 for 2-3 days). Closure as for craniotomy: dura watertight with 4-0 Nurolon, bone flap with cranial plates, layered scalp closure with staples. Subgaleal drain. Postop neuro-ICU × 24-72 hours, BP control, hourly neuro checks, MRI/MRA at 24-48 hours confirming complete resection. Long-term DSA at 6-12 months confirms no recurrence (recurrence rate 1-3% in adults, higher in children where late re-hemorrhage from recanalisation is described).`,
    ];
  }

  // -- DBS placement ---------------------------------------------------------
  if (includesAny(name, ["dbs", "deep brain stimulator"])) {
    return [
      `Indication confirmed: Parkinson's disease (motor fluctuations + dyskinesia despite optimal medical therapy — STN or GPi target; UK Brain Bank diagnostic criteria, levodopa response > 30% required); essential tremor (medication-refractory functional impairment — VIM target; > 5 years of disease duration usually); dystonia (DYT1 mutation, generalised primary dystonia — GPi target); intractable OCD (NICE-approved, anterior limb internal capsule target); rare indications including Tourette syndrome, depression. Multidisciplinary screening — movement disorder neurologist + neuropsychology (rule out cognitive impairment that worsens with DBS), neurosurgeon, psychiatry. Off-medication state preoperatively (held > 12 hours for PD patients to enable intraoperative testing of motor symptoms).`,
      `STAGE 1 (lead placement, awake): Leksell stereotactic frame was applied under local anesthesia (1% lidocaine at frame pin sites). The patient remained awake throughout (sedation with dexmedetomidine if needed, avoiding propofol/benzodiazepines which dampen tremor + dystonia and confound MER recordings). Stereotactic CT was obtained and fused with preoperative MRI (typically 3T DTI sequences for STN/GPi visualisation, T2/SWI for direct STN visualisation in PD). Target coordinates calculated for ${name.includes("stn") ? "STN (anteroposterior to AC-PC midpoint, 12 mm lateral to midline, 4 mm below intercommissural line — typical landmarks; modified by direct visualisation of STN on T2 imaging where the subthalamic nucleus appears hypointense)" : name.includes("gpi") ? "GPi (anteroposterior 21 mm anterior to PC, 21 mm lateral to midline, 4 mm below AC-PC line)" : name.includes("vim") ? "VIM thalamus (anteroposterior 25% of AC-PC distance anterior to PC, 11.5 mm lateral to midline, level of AC-PC line)" : "selected target"}. Coordinates were verified by direct visualisation on fused imaging.`,
      `A small (3-4 cm) curvilinear scalp incision was made anterior to the coronal suture and 2-3 cm lateral to the midline (Kocher's point modified for the planned trajectory — avoiding sulci and vessels on the cortical surface visible on the planning MRI). A 14 mm burr hole was drilled through the cranium. The dura was sharply incised and the underlying pia carefully cauterised at the planned entry point — pial entry is a high-risk site for cortical hemorrhage if cortical vessels are not avoided. The microelectrode-recording (MER) cannula was advanced toward target along the planned trajectory.`,
      `Microelectrode recording (MER): a tungsten microelectrode (FHC NeuroProbe or Alpha Omega) was inserted through the cannula and slowly advanced toward target while continuously recording extracellular neuronal activity. Characteristic firing patterns identified each anatomic structure traversed: (1) cortex — bursting at 10-30 Hz; (2) white matter — quiescent; (3) ${name.includes("stn") ? "STN — irregular firing 25-50 Hz with movement-responsive cells (kinesthetic cells)" : name.includes("gpi") ? "GPi — high-frequency tonic firing 60-90 Hz, distinguished from GPe (more bursting)" : "VIM — tremor cells firing in synchrony with rest tremor"}. The microelectrode was advanced 0.5 mm at a time. The dorsal and ventral borders of the target nucleus were defined by the firing pattern. Multiple parallel tracks were recorded if needed (typically 2-5 tracks) to optimally localise target.`,
      `Macroelectrode test stimulation: after MER mapping, a macroelectrode was advanced to the optimal target. Test stimulation was performed at incremental currents (0.5-3 mA, 130 Hz, 60 μs pulse width) on each of the 4 contacts of the planned permanent lead position. The patient was assessed by the movement disorders neurologist for: (1) symptomatic benefit (tremor reduction, rigidity reduction in PD; tremor reduction in ET; dystonia reduction over weeks not minutes); (2) capsular side effects (contralateral motor contraction at 2-4 mA — too lateral, requiring repositioning); (3) ophthalmologic side effects (gaze deviation, oscillopsia — too medial); (4) parasthesias (sensory thalamus encroachment — too posterior); (5) mood / affective changes (limbic system encroachment — non-motor STN). The optimal contact was selected based on widest therapeutic window (benefit at low current, side effect threshold high current).`,
      `Permanent DBS lead placement: ${name.includes("medtronic") ? "Medtronic 3389 (4 contacts, 1.5 mm height each, 0.5 mm spacing) for STN/GPi or 3387 (4 contacts, 1.5 mm height, 1.5 mm spacing) for VIM" : name.includes("boston") ? "Boston Scientific Vercise (8-contact directional lead enables current steering — newer-generation directional therapy)" : name.includes("abbott") ? "Abbott Infinity (8-contact directional)" : "selected DBS lead"} was advanced through the cannula to target depth. Position was confirmed by intraoperative CT with stereotactic frame (modern centers may use ClearPoint MRI-guided placement under general anesthesia — equivalent outcomes per multiple studies). The lead was secured at the burr hole with a Stim-Loc cap (Medtronic) or Navigus device + bone wax for additional security.`,
      `${name.includes("bilateral") || name.includes("ipg") || name.includes("stage 2") ? "STAGE 2 (IPG implantation, typically 1-2 weeks after lead placement): under general anesthesia, an IPG pocket was developed in the infraclavicular subcutaneous tissue (right side preferred for non-dominant access). The lead was tunnelled subcutaneously from the cranial site behind the ear and over the clavicle to the IPG pocket. The lead was connected to the IPG (Medtronic Activa, Activa RC rechargeable, Boston Scientific Vercise PC, or Abbott Infinity). Impedances were checked on all 4 contacts (target 200-1500 ohms — out of range suggests broken lead, fibrosis, or short circuit). Intraoperative test stimulation through the IPG confirmed expected response. IPG was sutured to the pectoral fascia to prevent migration." : ""}`,
      `Closure: the cranial incision was closed in layers (galea with 3-0 Vicryl, skin with 4-0 Monocryl or staples). ${name.includes("bilateral") || name.includes("ipg") || name.includes("stage 2") ? "IPG pocket closed with 3-0 Vicryl in deep dermal layer + 4-0 Monocryl skin." : ""} Postop CT and high-resolution MRI confirmed lead position. Postop care: usually overnight observation. IPG activation was scheduled at 2-4 weeks postop (allowing tissue healing + microlesion effect resolution before precise programming). Programming optimisation occurred over weeks-months in clinic with the movement disorders team. Long-term outcomes: PD STN-DBS — 60% reduction in motor symptoms + medication, durable for > 10 years; ET VIM-DBS — > 70% tremor reduction; dystonia GPi-DBS — gradual improvement over months. Battery life: non-rechargeable 3-5 years; rechargeable 9-15 years. Complications: infection 3-5% (IPG-pocket — typically requires explanation), lead migration 1-2%, hemorrhage 1-3% (most are small asymptomatic).`,
    ];
  }

  // -- ACDF ------------------------------------------------------------------
  if (includesAny(name, ["acdf", "anterior cervical discectomy"])) {
    return [
      `Indication confirmed: cervical radiculopathy/myelopathy from disc herniation, spondylotic disease, or trauma — failed conservative management × 6 weeks (or progressive neurological deficit, severe myelopathy with cord compression, or trauma with instability). Workup: MRI cervical spine confirms level + cord/root compression; flexion-extension X-rays assess instability; modified Japanese Orthopedic Association (mJOA) score for myelopathy quantification (mild 15-17, moderate 12-14, severe 0-11 — drives surgical urgency); Nurick scale for ambulatory function. Number of levels confirmed: single-level ACDF most common; 2-level for multi-segmental disease; 3-level approaches limit (consider posterior approach for > 3 levels, or laminoplasty alternative). Patient positioning: supine on standard OR table with the neck in slight extension (tape, gel roll, or shoulder roll under shoulders), arms tucked. Mayfield headholder placement is alternative for 3-level cases. Antibiotic prophylaxis (cefazolin 2 g IV + vancomycin if MRSA risk) was given.`,
      `Neuromonitoring: SSEPs + MEPs were established preoperatively as baseline. Particularly critical for myelopathic patients with cord compression where intraoperative cord injury risk exists. Loss of signals during retraction or instrumentation prompted immediate review of positioning + decompression maneuvers + checking for hypotension.`,
      `A right-sided transverse skin crease incision was made at the level of the target disc — landmarks include cricoid cartilage at C6, hyoid bone at C3, with the angle of the mandible at C2-3. A right-sided approach was chosen by most surgeons (preserves the recurrent laryngeal nerve which courses more medially and predictably on the right) but a left approach is standard in some training (preserves the dominant left RLN — reverse rationale, used by some). Subcutaneous tissue was incised and the platysma was identified and divided in line with the skin incision. Subplatysmal flaps were raised superiorly and inferiorly to permit caudal-to-cephalad mobility of the operative window.`,
      `The medial border of the sternocleidomastoid was identified and the SCM was retracted laterally. The carotid sheath (carotid artery + internal jugular vein + vagus nerve) was identified and retracted laterally. The trachea + esophagus + thyroid + recurrent laryngeal nerve (medial structures) were retracted medially. The dissection developed between these two retractor positions in the avascular plane through the deep cervical fascia. The longus colli muscle bellies were identified covering the anterior vertebral bodies bilaterally. The longus colli muscles were monopolar-divided medially to expose the anterior vertebral bodies + disc spaces, and Caspar self-retaining retractor blades were placed underneath the elevated longus colli muscles to maintain medial-lateral retraction. Lateral retractors were placed protecting the carotid sheath laterally. Fluoroscopic confirmation (lateral view) confirmed the correct level by counting up from C7 (or down from C2 odontoid).`,
      `The disc space was opened with a #15 blade making a bilateral transverse incision through the anterior longitudinal ligament + anulus. Caspar pin distractors were placed: a Caspar pin was driven into the cephalad and caudad vertebral body in the midline (2-3 mm anterior to the disc space, parallel to the disc space); the Caspar distractor was attached to spread the disc space apart (gentle distraction — overdistraction can stretch nerve roots and cord). The disc was removed using a curette + pituitary rongeur + microdiscectomy under operating microscope (Zeiss Pentero or Leica M530OH).`,
      `The discectomy proceeded systematically: anterior anulus + central disc → posterior anulus → posterior longitudinal ligament. The PLL was opened with microscissors or Kerrison rongeur (controversial — some surgeons preserve PLL to maintain a barrier; others routinely remove for direct cord visualization and posterior osteophyte removal). Posterior osteophytes were removed with a high-speed cutting drill (Midas Rex 4 mm bit) and Kerrison rongeur. The bilateral nerve roots were decompressed by removing the uncinate process / uncovertebral joint with Kerrison rongeur (foraminotomy) — drilled lateral to medial until the nerve root was visibly free of compression.`,
      `Adequate decompression was confirmed by direct visualisation of: (1) decompressed thecal sac with no posterior compression; (2) bilateral nerve roots free of compression (visible exit from the foramen, with mobility); (3) no residual posterior osteophyte; (4) no missed disc fragment behind the PLL.`,
      `Disc space sizing: a trial spacer was placed for sizing (typical 5-7 mm height for healthy disc, 6-8 mm for height-restoring goals; over-sized worsens dysphagia and reduces motion at adjacent levels — risk of accelerated adjacent-segment disease). The selected fusion graft was placed: ${name.includes("allograft") ? "structural cervical allograft (e.g., Synthes structural allograft)" : name.includes("peek") || name.includes("cage") ? "PEEK cage (Stryker AVS, Medtronic Atlantis, or similar) packed with cancellous autograft (iliac crest harvest) or DBM (demineralized bone matrix) or BMP-2 (rare in cervical due to swelling complications)" : "structural allograft or PEEK cage with autograft/DBM filler"}. The graft was tapped into the disc space with the Caspar distraction released to establish snug fit.`,
      `Anterior cervical plate placement: the plate was sized to span the cephalad and caudad vertebral bodies (e.g., Synthes Skyline, Medtronic Atlantis, or Stryker Reflex Hybrid). The plate was contoured to fit the cervical lordosis. Locking screws were placed bicortically into each vertebral body (4 screws total for 1-level, 6 for 2-level, etc.) with screw trajectories slightly converging to maximise pull-out strength + avoid the disc space below or vertebral artery laterally. Final fluoroscopic confirmation (AP + lateral) verified plate, screw, and graft position. SSEPs/MEPs were re-checked + confirmed unchanged from baseline.`,
      `A 7 Fr Jackson-Pratt drain or Penrose drain was placed in the prevertebral space and tunnelled out through a separate stab incision (drain prevents prevertebral hematoma which can cause dysphagia + airway compromise — drain output and removal at POD 1-2). Closure: platysma re-approximated with running 3-0 Vicryl, dermis with 4-0 Monocryl, skin with 4-0 Monocryl subcuticular running suture or Steri-Strips. A soft cervical collar was applied. Postop pathway: overnight admission for neurological + airway monitoring (postop hematoma is a surgical emergency causing airway compromise — recognised by escalating dysphagia + hoarseness + neck swelling). Soft cervical collar × 2-6 weeks. Soft diet × 1 week, advance per dysphagia screen. Common complications: dysphagia 30-50% transient, < 10% persistent at 1 year; RLN palsy 1-3%; pseudarthrosis 5-10% (worse with smoking + multilevel); adjacent segment disease 2-3% per year requiring revision in 10-15% at 10 years.`,
    ];
  }

  // -- Kyphoplasty / vertebroplasty ------------------------------------------
  if (includesAny(name, ["kyphoplasty", "vertebroplasty"])) {
    const isKypho = name.includes("kyphoplasty");
    return [
      `Indication was reviewed: vertebral compression fracture (VCF) with severe persistent pain refractory to conservative management × 6 weeks (NSAIDs + bracing + activity modification + bisphosphonate optimisation), in osteoporotic patients (T-score < -2.5, history of fragility fracture); pathologic VCF from metastasis or multiple myeloma; trauma with painful but stable acute fracture (vs unstable burst fracture requiring open fixation). The trial evidence is conflicting: VERTOS, INVEST, FREE trials showed mixed outcomes — recent VAPOUR trial (2016) showed clear pain benefit for acute (< 6 weeks) painful VCFs. Patient selection: MRI confirms acute fracture (bone marrow edema + STIR hyperintensity — distinguishing acute fractures with cement potential vs chronic fractures already fibrosed); preoperative pain quantification (VAS > 7/10 typical for kyphoplasty candidates).`,
      `Patient positioning: prone on a Jackson table (radiolucent) with bolsters under the chest and pelvis to allow gentle hyperextension (helps reduce kyphotic angulation by gravity reduction — particularly for fractures in the thoracolumbar junction). Bilateral fluoroscopy units were positioned for AP and lateral imaging. The skin overlying the targeted vertebral level was prepped and draped sterilely. Conscious sedation (midazolam + fentanyl) was administered (or general anesthesia for prone-intolerant patients).`,
      `The targeted vertebral level was confirmed under AP and lateral fluoroscopy. Local anesthesia (1% lidocaine with epinephrine, 5-10 mL per side) was infiltrated subcutaneously, into the periosteum of the pedicle, and to the deep paraspinal tissues at each planned trocar entry point. Bilateral transpedicular access points were marked: one level cephalad (to enter the pedicle obliquely for trajectory into the upper one-third of the vertebral body) — typical position 1 cm lateral to the midline of the pedicle on AP view, with the trajectory starting at the upper outer quadrant of the pedicle on AP view ('bull's eye' technique).`,
      `Bilateral 11-gauge or 13-gauge bone biopsy trochars (Jamshidi needle or vertebroplasty needle, e.g., Stryker AVAflex, Medtronic Kyphon balloon kit) were advanced under fluoroscopic guidance through the bilateral pedicles into the vertebral body. The trajectory was carefully monitored on AP and lateral views: (1) on AP view, the trochar must remain medial to the medial border of the pedicle (lateral breach risks medial breach into spinal canal at vertebral body level); (2) on lateral view, the trochar should advance from the posterior edge of the vertebral body toward the anterior 1/3 of the vertebral body (avoiding too anterior placement — risk of anterior cortex breach with cement extravasation into great vessels). Trochar position was confirmed at the anterior 1/3 to 1/2 of the vertebral body.`,
      `${isKypho ? "Kyphoplasty (preferred over vertebroplasty for fractures with kyphotic deformity > 15°): Bilateral inflatable bone tamps (IBT — Kyphon balloon, 10-15 mm length depending on vertebral level) were introduced through the working cannulas after the trochar removal. Each balloon was slowly inflated under continuous fluoroscopic monitoring with iohexol contrast filling, with AP and lateral imaging. The balloons were inflated alternately or simultaneously to a target pressure 200-300 psi or volume 4-6 mL, monitoring for: (1) cavity creation (the cancellous bone is compressed peripherally creating a void); (2) endplate elevation / kyphosis reduction (particularly important for the goal of height restoration); (3) any cortical breach (immediate cessation if observed). Kyphosis reduction was typically 50-70% of the lost vertebral height for acute fractures < 10 days old; less for older fractures. Balloons were deflated and removed, leaving the cavity for cement filling under low-pressure conditions." : "Vertebroplasty (no balloon, direct cement injection)"}.`,
      `PMMA (polymethylmethacrylate) bone cement was prepared by the scrub on the back table by mixing the polymer powder with the liquid monomer until a doughy 'toothpaste' consistency was achieved (typical preparation time 3-5 minutes; cement was injected during the working time of approximately 5-10 minutes). Cement was loaded into the injection cannula or syringe.`,
      `Cement injection: PMMA cement was injected SLOWLY under continuous lateral fluoroscopic monitoring, with the injection rate kept low (1 mL/min maximum) to detect any extravasation in real-time. The cement filled the vertebral body (or the cavity created by kyphoplasty balloons) progressively. Critical complications to monitor for and abort injection: (1) extravasation into the spinal canal via posterior cortex breach (risk of cord/root compression — emergent decompression required); (2) extravasation into the paravertebral veins or basivertebral plexus (risk of cement pulmonary embolism — devastating, with sudden hypotension/hypoxia/cardiac arrest); (3) extravasation into the disc space (cement in the disc accelerates adjacent vertebral fracture — adjacent fracture incidence 12-20% per year post-vertebroplasty). Bilateral injection technique: cement injected first on one side until adequate fill, then on the contralateral side to a balanced fill pattern.`,
      `Total cement volume: typical 3-7 mL per side for thoracic, 4-8 mL per lumbar vertebra (kyphoplasty often uses lower volumes due to pre-formed cavity and reduced extravasation risk). Final volume was determined by adequate fill on AP and lateral fluoroscopy (~30-50% of vertebral body volume) without extravasation. Once cement had hardened (5-10 minutes after injection), the cannulas were removed. Skin incisions (1-2 mm puncture sites) were closed with a single Steri-Strip each — no sutures needed.`,
      `Postoperative care: monitoring × 1-2 hours for hemodynamic and neurologic stability. Standing AP + lateral X-rays before discharge to confirm cement position. Same-day discharge with: home pain control, gradual mobilisation per tolerance (no bed rest — early mobilisation reduces DVT and adjacent fracture rates), bone density assessment within 3 months, anti-osteoporotic therapy initiation (bisphosphonate, denosumab, or anabolic teriparatide for high-fracture-risk patients per AACE guidelines), fall prevention. Long-term: typical pain reduction VAS 8 → 3 within hours-days for acute fractures; durable improvement at 1 year. Adjacent-level fracture risk 12-20% per year (increased over osteoporosis baseline ~2-fold by some studies — patient counseling important). Repeat kyphoplasty at adjacent levels for new symptomatic fractures.`,
    ];
  }

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
