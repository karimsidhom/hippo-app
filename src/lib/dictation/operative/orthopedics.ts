import type { CaseLog } from "@/lib/types";
import { includesAny } from "../shared/format";
import type { TopMatter } from "./index";

// ---------------------------------------------------------------------------
// Orthopedics — forced fields:
//   - Limb and laterality
//   - Pre- and post-operative neurovascular status
//   - Fixation details (plate/screws/nail/prosthesis model and size)
//   - Tourniquet time and pressure
//   - Weight-bearing status
//   - Splint / cast / brace plan
//   - DVT prophylaxis plan
// ---------------------------------------------------------------------------

function detectLaterality(name: string): string {
  const n = name.toLowerCase();
  if (/\bbilateral\b/.test(n)) return "bilateral";
  if (/\bleft\b/.test(n)) return "left";
  if (/\bright\b/.test(n)) return "right";
  return "[left/right]";
}

export function orthopedicsTopMatter(c: CaseLog): TopMatter {
  const name = c.procedureName.toLowerCase();
  const lat = detectLaterality(name);

  if (includesAny(name, ["total knee arthroplasty", "tka"])) {
    return {
      anesthesia: "Spinal anesthesia with adductor canal block for postoperative analgesia.",
      ebl: "Approximately 100–200 ml. Tourniquet time [__] min at 300 mmHg.",
      drains: "None.",
      specimens: "None routinely.",
      disposition: `The patient tolerated the procedure well. Admitted to the ortho floor. Weight-bearing as tolerated on the ${lat} lower extremity with a front-wheeled walker. Immediate physical therapy, CPM as indicated. DVT prophylaxis with ASA 81 mg BID for 4 weeks (or therapeutic anticoagulation for high-risk). Discharge home or to acute rehab when ambulating safely.`,
    };
  }

  if (includesAny(name, ["total hip arthroplasty", "tha"])) {
    return {
      anesthesia: "Spinal anesthesia.",
      ebl: "Approximately 200–400 ml.",
      drains: "None routinely.",
      specimens: "Femoral head and resected acetabulum to pathology per indication.",
      disposition: `The patient tolerated the procedure well. Admitted to the ortho floor. Weight-bearing as tolerated on the ${lat} lower extremity, posterior hip precautions (for posterior approach), early physical therapy, ASA 81 mg BID × 4 weeks for DVT prophylaxis.`,
    };
  }

  if (includesAny(name, ["orif", "open reduction internal fixation", "plating", "im nail", "intramedullary"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Approximately 100–300 ml.",
      drains: "None routinely.",
      specimens: "None.",
      disposition: `The patient tolerated the procedure well. Intact postoperative neurovascular exam documented in the ${lat} extremity. Splinted in appropriate position. Weight-bearing status: [non-weight-bearing / toe-touch / weight-bearing as tolerated] on the operative extremity. DVT prophylaxis per protocol. Follow-up in 2 weeks for wound check and suture removal.`,
    };
  }

  if (includesAny(name, ["rotator cuff repair", "arthroscopic rotator cuff"])) {
    return {
      anesthesia: "General anesthesia with interscalene block.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None.",
      disposition: `The patient tolerated the procedure well. ${lat} shoulder placed in an abduction sling. Non-weight-bearing / no active abduction × 6 weeks. Physical therapy with passive ROM only for the first 6 weeks, then progressive active ROM.`,
    };
  }

  if (includesAny(name, ["acl reconstruction", "acl repair"])) {
    return {
      anesthesia: "General anesthesia with adductor canal block.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None.",
      disposition: `The patient tolerated the procedure well. ${lat} knee in a hinged brace locked in extension. Weight-bearing as tolerated with crutches. Early physical therapy focusing on quadriceps activation and range of motion per ACL protocol.`,
    };
  }

  if (includesAny(name, ["arthroscopy", "knee scope", "shoulder scope"])) {
    return {
      anesthesia: "General or regional anesthesia.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Meniscal / labral tissue submitted to pathology as indicated.",
      disposition: `The patient tolerated the procedure well. Discharge home the same day. Weight-bearing as tolerated with crutches × 3–5 days. Elevation, ice, and early range of motion.`,
    };
  }

  if (includesAny(name, ["fusion", "acdf", "tlif", "plif", "laminectomy with fusion"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Approximately 200–500 ml.",
      drains: "15 Fr closed-suction drain at the surgical site.",
      specimens: "Bone for pathology as indicated.",
      disposition: "The patient tolerated the procedure well. Intact postoperative neurologic exam documented. Admitted for pain control and mobilization. Log-roll precautions. Cervical / lumbar brace as indicated. PT mobilization on POD 1.",
    };
  }

  return {
    anesthesia: "General or regional anesthesia.",
    ebl: "Approximately ________ ml.",
    drains: "[None / closed-suction drain].",
    specimens: "[None / pathology specimen].",
    disposition: "The patient tolerated the procedure well. Neurovascular exam intact. Weight-bearing and immobilization plan per operating surgeon.",
  };
}

export function orthopedicsFindings(c: CaseLog): string {
  const name = c.procedureName.toLowerCase();
  const lat = detectLaterality(name);

  if (includesAny(name, ["total knee arthroplasty", "tka"])) {
    return `The ${lat} knee had severe tricompartmental osteoarthritis with eburnated bone, osteophytes, and [varus / valgus] deformity of approximately [__] degrees. The cruciate and collateral ligaments were [intact / partially deficient]. After bony cuts and trial reduction, the knee tracked centrally with excellent stability in full extension and flexion. Final components: [femoral / tibial / patellar] [manufacturer model, size]. Preoperative and postoperative neurovascular exam of the operative extremity was intact with 2+ distal pulses and normal sensation in all dermatomes.`;
  }

  if (includesAny(name, ["total hip arthroplasty", "tha"])) {
    return `The ${lat} hip demonstrated severe degenerative joint disease with loss of joint space, femoral head deformity, and osteophytic overgrowth. The acetabular bone stock was adequate with no significant defects. The femoral canal was suitable for a [cemented / cementless] stem. Final components: [acetabular cup size, liner, femoral stem model and size, femoral head size]. Leg lengths were equalized and trial reduction was stable through full range of motion without impingement. Pre- and post-operative neurovascular exam of the operative extremity was intact.`;
  }

  if (includesAny(name, ["orif", "open reduction internal fixation"])) {
    return `The ${lat} [bone/fracture site] fracture was confirmed by intraoperative fluoroscopy, consistent with the preoperative imaging. The fracture was [comminuted / simple / displaced / angulated]. Fracture reduction was achieved under direct visualization with anatomic alignment restored. [Implant type and model, screws/plates/intramedullary nail] was applied and reduction/fixation confirmed on AP and lateral fluoroscopy. Preoperative and postoperative neurovascular exam was intact with 2+ distal pulses and normal sensation/motor function.`;
  }

  if (includesAny(name, ["rotator cuff repair"])) {
    return `${lat} shoulder arthroscopy demonstrated a [supraspinatus / infraspinatus / subscapularis] full-thickness rotator cuff tear measuring approximately [__] cm in AP × ML dimensions. The tear was [retracted to / over the glenoid rim / at the footprint]. Tissue quality was [excellent / fair / poor]. The biceps tendon was [normal / frayed / torn]. The cuff was mobilized and repaired in a [single-row / double-row / suture-bridge] configuration with [__] anchors, restoring the footprint without undue tension.`;
  }

  if (includesAny(name, ["acl reconstruction"])) {
    return `${lat} knee arthroscopy demonstrated a complete ACL tear with [intact / torn] menisci and [no / grade __] chondral injury. Graft choice: [bone-patellar tendon-bone autograft / hamstring autograft / quadriceps tendon autograft / allograft]. Femoral and tibial tunnels were drilled in anatomic position under direct visualization. The graft was passed and fixed with [interference screws / suspensory fixation], achieving excellent tension and stability. Lachman and pivot-shift were negative under anesthesia after reconstruction.`;
  }

  if (includesAny(name, ["arthroscopy", "knee scope", "shoulder scope"])) {
    return `${lat} [knee / shoulder] arthroscopy demonstrated [intraarticular pathology consistent with preoperative imaging]. [Describe chondral, meniscal, labral, or rotator cuff findings]. The appropriate intervention was performed as described below.`;
  }

  if (includesAny(name, ["fusion", "acdf", "tlif", "plif"])) {
    return `Preoperative imaging showed degenerative disc disease / spondylolisthesis / central canal stenosis at [__]. Intraoperative fluoroscopy confirmed the correct levels. Adequate decompression was achieved with restoration of the neural foramen / central canal. Pedicle screws were placed under fluoroscopic guidance with intact neuromonitoring signals throughout. Interbody graft was placed with satisfactory alignment. Preoperative and postoperative neurologic exam was documented.`;
  }

  return `The ${lat} operative limb and relevant joint were identified and prepped under tourniquet. Neurovascular examination was intact preoperatively. Fluoroscopic imaging confirmed anatomy and alignment throughout. Postoperative neurovascular exam was intact with 2+ distal pulses and normal sensation/motor function.`;
}

// ---------------------------------------------------------------------------
// Orthopedic Surgery — procedure-specific operative steps.
//
// Covers the high-volume arthroplasty, fracture, sports, and hand cases
// residents dictate. Wording follows standard orthopedic op-note conventions
// (indication, positioning, tourniquet, approach, reduction/fixation,
// reduction confirmation, wound closure, dressings).
// ---------------------------------------------------------------------------

function orthoOpSteps(c: CaseLog): string[] {
  const name = c.procedureName.toLowerCase();

  // -- Total hip arthroplasty ------------------------------------------------
  if (includesAny(name, ["total hip", "tha", "hip arthroplasty", "hip replacement"])) {
    return [
      `The patient was positioned in the [lateral decubitus / supine] position with the operative hip up. A [posterior / direct anterior / anterolateral] approach was planned and the skin marked accordingly. The leg was prepped and draped free.`,
      `A [posterior] skin incision was made centered over the greater trochanter. Dissection was carried through the subcutaneous tissue and the fascia lata was split in line with its fibers. The short external rotators were identified and tagged, then released from the femur to expose the posterior capsule.`,
      `A capsulotomy was performed and the hip was dislocated by internal rotation and adduction. The femoral neck osteotomy was made at the planned level using the preoperative template. The femoral head was removed and sized.`,
      `The acetabulum was exposed and reamed sequentially until healthy subchondral bone was reached with appropriate hemispherical contour. A [size] cementless acetabular component was press-fit into the prepared bed in [approximately 40° abduction and 15° anteversion]. A [poly / ceramic] liner was impacted into place.`,
      `Attention was turned to the femur. The canal was entered and broached sequentially to obtain rotational and axial stability. A trial reduction confirmed appropriate offset, length, and range of motion without impingement or instability. The final [cemented / cementless] femoral stem was implanted and a [ceramic / metal] head placed on the trunnion.`,
      `The hip was reduced and stability tested through a full range of motion. Leg lengths were clinically equal. The capsule and short external rotators were repaired through transosseous tunnels. Closure was performed in layers with 0 Vicryl to fascia, 2-0 Vicryl subcutaneous, and staples / 3-0 Monocryl to skin. A sterile dressing was applied.`,
    ];
  }

  // -- Total knee arthroplasty -----------------------------------------------
  if (includesAny(name, ["total knee", "tka", "knee arthroplasty", "knee replacement"])) {
    return [
      `The patient was positioned supine with a thigh tourniquet applied. The leg was prepped and draped free. The tourniquet was inflated to [250] mmHg after exsanguination.`,
      `A midline longitudinal skin incision was made centered over the knee. A [medial parapatellar] arthrotomy was performed and the patella was everted laterally. The ACL was excised and the menisci removed.`,
      `The distal femoral cut was made in [5°] of valgus using an intramedullary guide. The proximal tibial cut was made perpendicular to the mechanical axis with a [3°] posterior slope using an extramedullary guide. Rotation of the femoral component was set using the [transepicondylar axis / Whiteside's line / posterior condylar axis].`,
      `Appropriate-sized [femoral, tibial, and patellar] trials were inserted. The knee was taken through a full range of motion and assessed for balance, tracking, and stability in flexion and extension. Adjustments to the tibial cut and releases were made as needed.`,
      `The bone surfaces were irrigated and dried. [Cemented / cementless] final components were implanted in proper orientation. The patella was resurfaced and the extensor mechanism tracked centrally without maltracking.`,
      `The tourniquet was deflated and hemostasis confirmed. The arthrotomy was closed with interrupted 0 Vicryl. The subcutaneous tissue was closed with 2-0 Vicryl and the skin with staples. A sterile dressing was applied.`,
    ];
  }

  // -- Hip hemiarthroplasty --------------------------------------------------
  if (includesAny(name, ["hemiarthroplasty", "bipolar", "unipolar"])) {
    return [
      `The patient was positioned in the lateral decubitus position. A posterior approach to the hip was performed. The short external rotators were released and the capsule opened.`,
      `The displaced femoral neck fragments were removed and the acetabulum inspected — cartilage was preserved. The femur was broached to rotational and axial stability. Trial reduction confirmed appropriate head size, offset, and length.`,
      `A [bipolar / unipolar] head was assembled on the final stem. The hip was reduced and stability confirmed through a full range of motion. The capsule and short external rotators were repaired. Layered closure as standard.`,
    ];
  }

  // -- ORIF (generic fracture fixation) --------------------------------------
  if (includesAny(name, ["orif", "open reduction", "fracture fixation"])) {
    return [
      `A [tourniquet was applied / no tourniquet was used] and the extremity was prepped and draped. Fluoroscopy was positioned and checked for adequate imaging.`,
      `A [describe approach appropriate to fracture location] incision was made and dissection carried down to the fracture site, with careful protection of neurovascular structures.`,
      `The fracture was exposed and debrided of hematoma. Reduction was achieved with [direct manipulation / pointed reduction clamps / ligamentotaxis via traction] and confirmed fluoroscopically in AP and lateral views. Provisional fixation was obtained with K-wires.`,
      `Definitive fixation was placed using a [size, length, type] [plate / intramedullary nail / cannulated screws / external fixator]. Screws were measured and placed with appropriate bicortical purchase where applicable. Final fluoroscopic views confirmed acceptable alignment, reduction, and hardware position.`,
      `The wound was irrigated and closed in layers. A sterile dressing and [splint / cast] were applied.`,
    ];
  }

  // -- Rotator cuff repair ---------------------------------------------------
  if (includesAny(name, ["rotator cuff"])) {
    return [
      `The patient was positioned in the [lateral decubitus / beach chair] position. A standard posterior viewing portal was established and a diagnostic arthroscopy was performed. Glenohumeral pathology was documented and any intra-articular pathology addressed.`,
      `The scope was repositioned into the subacromial space and a lateral working portal was established. Bursectomy was performed and the rotator cuff tear was identified, measured, and mobilized. An acromioplasty was performed as indicated.`,
      `The greater tuberosity footprint was prepared to a bleeding bony bed. [Single-row / double-row / suture-bridge] repair was performed using [__] suture anchors placed at the medial row and [__] lateral anchors. Sutures were passed through the cuff and tied, achieving a tension-free anatomic repair of the cuff to the footprint.`,
      `Portals were closed with interrupted nylon sutures and a sling was applied.`,
    ];
  }

  // -- ACL reconstruction ----------------------------------------------------
  if (includesAny(name, ["acl", "anterior cruciate"])) {
    return [
      `The patient was positioned supine with a tourniquet on the operative thigh. Standard arthroscopic portals were established and a diagnostic arthroscopy was performed. The ACL tear was confirmed and any meniscal pathology addressed.`,
      `A [bone-patellar tendon-bone / hamstring / quadriceps] autograft was harvested and prepared on the back table to [__ mm] diameter. The ACL remnant was debrided and the femoral and tibial footprints were identified.`,
      `Femoral and tibial tunnels were drilled with the aid of appropriate guides at the anatomic footprint. The graft was passed into the tunnels and fixed with [interference screw / suspensory button / staple] constructs. Fixation stability was confirmed, and the knee was cycled to confirm isometry and restoration of Lachman and pivot-shift testing.`,
      `The arthroscope was removed. Portals were closed with nylon sutures and a hinged knee brace applied.`,
    ];
  }

  // -- Knee / shoulder arthroscopy -------------------------------------------
  if (includesAny(name, ["arthroscopy", "meniscectomy", "meniscal repair"])) {
    return [
      `The patient was positioned [supine with thigh tourniquet / lateral decubitus / beach chair]. Standard portals were established and a diagnostic arthroscopy was performed systematically, documenting all compartments.`,
      `Pathology identified: [describe]. [Partial meniscectomy / meniscal repair / chondroplasty / loose body removal] was performed using [shaver / biter / radiofrequency ablation].`,
      `The joint was irrigated and portals were closed with nylon sutures. A compression dressing was applied.`,
    ];
  }

  // -- Carpal tunnel release (open) ------------------------------------------
  if (includesAny(name, ["carpal tunnel"])) {
    return [
      `A [2 cm] longitudinal incision was made in line with the radial border of the ring finger in the palm, ending proximal to Kaplan's cardinal line. Dissection was carried down through the palmar fascia to expose the transverse carpal ligament.`,
      `The transverse carpal ligament was divided sharply along its entire length under direct visualization, protecting the median nerve. The nerve was inspected and glided freely after release.`,
      `Hemostasis was achieved with bipolar cautery. The skin was closed with interrupted 5-0 nylon. A soft dressing was applied.`,
    ];
  }

  // -- Spinal fusion ---------------------------------------------------------
  if (includesAny(name, ["spinal fusion", "lumbar fusion", "cervical fusion", "tlif", "plif", "alif", "acdf"])) {
    const isCervicalAnterior = includesAny(name, ["acdf", "cervical fusion"]);
    if (isCervicalAnterior) {
      return [
        `The patient was positioned supine with a shoulder roll. A right-sided transverse cervical incision was made at the level of the target disc space. Dissection was carried through the platysma, the medial border of the sternocleidomastoid was retracted laterally, and the prevertebral fascia was opened.`,
        `The longus colli muscles were elevated off the vertebral bodies and self-retaining retractors placed. Fluoroscopy confirmed the correct level. The anterior longitudinal ligament and anulus were incised and a discectomy was performed to the posterior longitudinal ligament with meticulous decompression of the endplates and foramina.`,
        `An appropriately-sized interbody graft/cage was placed with excellent fit. An anterior cervical plate was secured to the adjacent vertebral bodies with bicortical screws. Fluoroscopy confirmed alignment and hardware position.`,
        `Hemostasis was confirmed. A drain was placed. Closure was performed in layers with platysma reapproximation and skin closure with Monocryl.`,
      ];
    }
    return [
      `The patient was positioned prone on a Jackson frame with appropriate padding. Fluoroscopy confirmed correct spinal levels.`,
      `A midline posterior incision was made and dissection carried down to the spinous processes and laminae. Subperiosteal dissection exposed the transverse processes bilaterally at the fusion levels.`,
      `Pedicle screws were placed at each level using anatomic landmarks and fluoroscopic / navigation guidance. Decompression was performed as indicated ([laminectomy / facetectomy]) with neurolysis and preservation of the thecal sac and nerve roots.`,
      `An interbody device was placed via [TLIF / PLIF] approach with autograft bone. Rods were contoured and secured to the pedicle screws; final construct was confirmed fluoroscopically. Arthrodesis beds were decorticated and grafted.`,
      `Hemostasis was confirmed. A drain was placed. Closure was performed in layers over the fascia with absorbable suture and skin closed with staples.`,
    ];
  }

  // -- Hardware removal ------------------------------------------------------
  if (includesAny(name, ["hardware removal", "implant removal"])) {
    return [
      `The previous incision was opened and dissection carried down to the hardware, with careful identification and preservation of surrounding neurovascular structures.`,
      `The hardware was identified and removed systematically: [screws, plate, nail, etc.]. Any bony overgrowth was curetted to facilitate removal. Fluoroscopy confirmed complete removal.`,
      `The wound was irrigated and closed in layers. A sterile dressing was applied.`,
    ];
  }

  // Generic orthopedic fallback
  return [
    `The extremity was exsanguinated and the tourniquet [inflated to 250 mmHg / not used]. An incision was made at the planned site and dissection carried down to the operative target with protection of neurovascular structures.`,
    ``,
    `The ${c.procedureName} was performed in standard fashion. Fluoroscopy (where applicable) confirmed anatomic reduction and hardware position. [Expand with procedure-specific technical steps.]`,
    ``,
    `The wound was irrigated and closed in layers. A sterile dressing and appropriate immobilization were applied. The tourniquet was released; total tourniquet time was [___] minutes.`,
  ];
}

export function orthopedicsBody(c: CaseLog): string[] {
  const preamble = [
    `Description of Procedure: Risks, benefits, and alternatives were discussed and informed consent was obtained. The patient was brought to the operating room and placed in the [supine / prone / lateral decubitus / beach chair] position, with all pressure points padded. After induction of [general / regional] anesthesia, pre-incision antibiotics were administered and sequential compression devices applied as appropriate.`,
    ``,
    `A surgical time-out was completed, confirming patient identity, procedure, site, laterality, consent, antibiotics, and availability of imaging and implants. The operative extremity was prepped and draped in the usual sterile fashion.`,
    ``,
  ];
  const closure = [
    ``,
    `At the end of the procedure, hemostasis was confirmed, all counts were correct, and the patient was awakened and transferred to recovery in stable condition. Neurovascular exam was intact distal to the operative site.`,
  ];
  return [...preamble, ...orthoOpSteps(c), ...closure];
}
