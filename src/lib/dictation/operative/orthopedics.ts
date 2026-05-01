import type { CaseLog } from "@/lib/types";
import { includesAny } from "../shared/format";
import type { TopMatter } from "./types";

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

  // REVIEW: orthopaedic attending sign-off needed before residents bill from these.
  if (includesAny(name, ["revision arthroplasty", "revision tha", "revision tka", "rev tha", "rev tka"])) {
    return {
      anesthesia: "General or regional anesthesia. Plan for higher EBL than primary arthroplasty.",
      ebl: "Approximately 500–1500 ml (variable).",
      drains: "15 Fr Hemovac closed-suction drain × 24h.",
      specimens: "Removed prosthesis components + tissue cultures (gram stain + aerobic + anaerobic + fungal + AFB) + frozen for periprosthetic infection assessment.",
      disposition:
        "The patient tolerated the procedure well. Admitted for monitoring. Plan: weight-bearing per intraoperative stability, antibiotic regimen pending cultures, DVT prophylaxis.",
    };
  }

  if (includesAny(name, ["achilles tendon repair", "achilles rupture", "achilles tendon"])) {
    return {
      anesthesia: "Regional (popliteal block) ± sedation, or general.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None routinely.",
      disposition:
        "The patient tolerated the procedure well. Discharge home the same day in plantarflexion splint. Plan: non-weight-bearing × 2 weeks, then transition to walking boot with heel wedges and gradual ROM/strengthening over 12 weeks.",
    };
  }

  if (includesAny(name, ["distal radius fracture", "distal radius orif", "colles", "smith"])) {
    return {
      anesthesia: "Regional (Bier or supraclavicular block) ± sedation, or general.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well. Discharge home the same day in volar splint × 2 weeks, then transition to short-arm cast or splint. Plan: hand therapy referral, OT for early finger ROM.",
    };
  }

  if (includesAny(name, ["dupuytren", "fasciectomy"])) {
    return {
      anesthesia: "Regional or general anesthesia.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Resected fascia to pathology.",
      disposition:
        "The patient tolerated the procedure well. Discharge home the same day in plaster splint × 1 week. Plan: hand therapy at 1 week for ROM and night extension splint × 6 months.",
    };
  }

  if (includesAny(name, ["tendon repair", "flexor tendon", "extensor tendon"])) {
    return {
      anesthesia: "Regional (Bier) or general.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well. Discharge home the same day in dorsal blocking splint. Plan: hand therapy referral within 3–5 days for early controlled motion (Duran or Kleinert protocol).",
    };
  }

  if (includesAny(name, ["meniscus repair", "meniscectomy"]) && !includesAny(name, ["arthroscopy"])) {
    return {
      anesthesia: "General or regional.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Meniscal tissue (partial meniscectomy) to pathology.",
      disposition:
        "The patient tolerated the procedure well. Discharge home the same day. Plan: WBAT for partial meniscectomy / TDWB for repair × 4 weeks, ROM as tolerated, return to sports at 4–12 weeks.",
    };
  }

  if (includesAny(name, ["hip resurfacing"])) {
    return {
      anesthesia: "General or regional.",
      ebl: "Approximately 300–500 ml.",
      drains: "15 Fr closed-suction drain.",
      specimens: "Femoral head bone for pathology.",
      disposition:
        "The patient tolerated the procedure well. Admitted for monitoring. Plan: WBAT, PT, DVT prophylaxis, hip precautions.",
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

  // REVIEW: ortho attending sign-off needed before residents bill from these.
  if (includesAny(name, ["revision arthroplasty", "revision tha", "revision tka", "rev tha", "rev tka"])) {
    return `${lat} [hip/knee] revision arthroplasty was performed for [aseptic loosening / periprosthetic infection / instability / peri-prosthetic fracture / wear and osteolysis]. Intraoperative tissue cultures were obtained from [5+ sites] and frozen sections sent. Bone defects were classified as [Paprosky / AORI grade __] with [contained / uncontained] cavitary loss. Components removed: [acetabular cup / poly liner / femoral stem / femoral head / tibial tray / patellar button]. Replacement constructs: [revision shell ± augments / metal augments / cones or sleeves / revision stem / constrained liner if instability]. Final reduction was stable through full ROM with no impingement. Pre- and post-operative neurovascular exam intact.`;
  }

  if (includesAny(name, ["achilles tendon repair", "achilles rupture", "achilles tendon"])) {
    return `${lat} acute Achilles tendon rupture confirmed intraoperatively, with the rupture site approximately [__] cm proximal to the calcaneal insertion. The tendon ends were [mop-end frayed / sharply transected]. After debridement of degenerative tissue, the ends were re-approximated in equinus with the foot resting at neutral. Repair was performed using a [Krackow / Bunnell] core suture with [#2 FiberWire] reinforced by an epitenon running suture. Intraoperative Thompson test confirmed appropriate tension and resting plantarflexion comparable to the contralateral side.`;
  }

  if (includesAny(name, ["distal radius fracture", "distal radius orif", "colles", "smith"])) {
    return `${lat} distal radius fracture confirmed by intraoperative fluoroscopy with [__] mm dorsal angulation, [__] mm radial shortening, and [__] degrees of inclination loss. Articular [step-off / gap] of [__] mm was reduced anatomically under direct visualization. Volar plate (DVR / variable-angle) was applied with [3] proximal cortical screws and [__] distal locking screws under fluoroscopy. Final imaging confirmed restoration of radial inclination, volar tilt, and ulnar variance. Median nerve in the carpal tunnel was inspected and free of compression.`;
  }

  if (includesAny(name, ["dupuytren", "fasciectomy"])) {
    return `${lat} hand demonstrated Dupuytren contracture with [Tubiana stage __] involvement of the [ring / small / middle] finger MCP and PIP joints. Pretendinous, spiral, and central cords were identified. The neurovascular bundles were under direct vision throughout dissection — the spiral cord course was carefully identified and the digital nerves and arteries protected at all times. Following fasciectomy, full passive extension was restored at the MCP and improved at the PIP. No iatrogenic injury occurred.`;
  }

  if (includesAny(name, ["tendon repair", "flexor tendon", "extensor tendon"])) {
    return `${lat} hand demonstrated a Zone [I/II/III/IV/V] [flexor / extensor] tendon laceration of the [__] finger / thumb. Both ends of the tendon were retrieved without aggressive trauma to the sheath. The tendon was repaired with a [4-strand modified Kessler] core suture using [4-0 Ethibond / FiberWire] and a circumferential epitenon running 6-0 nylon. Active and passive ROM testing intraoperatively demonstrated tendon glide without gapping. Concomitant injuries: [neurovascular structures intact / digital nerve repair performed].`;
  }

  if (includesAny(name, ["meniscus repair", "meniscectomy"]) && !includesAny(name, ["arthroscopy"])) {
    return `${lat} knee arthroscopy demonstrated a [__] cm [bucket-handle / longitudinal / radial / horizontal cleavage / complex] tear in the [medial / lateral] meniscus, located in the [red-red / red-white / white-white] zone. Tear was [reducible / irreducible]. ${includesAny(name, ["repair"]) ? "Tear was located in the vascular zone with reducible morphology, suitable for repair. Inside-out / all-inside repair with [__] vertical mattress sutures was performed." : "Partial meniscectomy was performed with conservative resection back to a stable rim, preserving as much functional meniscus as possible."} Articular surfaces and ACL were [intact / Outerbridge __ chondral changes].`;
  }

  if (includesAny(name, ["hip resurfacing"])) {
    return `${lat} hip showed degenerative arthritis with adequate femoral head bone stock and acceptable femoral neck quality, suitable for resurfacing in this [young / active] patient. Acetabular bone was [normal / mildly cystic but adequate]. Final components: [Birmingham / Conserve+ / ADEPT] [size]/[size]. Trial reduction was stable through full range of motion without impingement. Leg lengths were equal. Pre- and post-op neurovascular exam intact.`;
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

  // -- Revision arthroplasty -------------------------------------------------
  if (includesAny(name, ["revision arthroplasty", "revision tha", "revision tka", "rev tha", "rev tka"])) {
    return [
      `The previous skin incision was used and extended as needed. Dissection was carried down through scar tissue carefully identifying neurovascular structures.`,
      `Tissue cultures were obtained from [≥5 sites] (synovium, capsule, fluid, bone-implant interface) prior to extensive debridement. Tissue and fluid sent for frozen section, gram stain, aerobic + anaerobic + fungal + AFB cultures.`,
      `Existing components were systematically removed: [acetabular cup with curved osteotome / explant system; femoral stem with cement osteotomes if cemented or extraction handle if cementless]. Bone-cement interface was preserved when possible. Femur / tibia was inspected for cortical perforation.`,
      `Bone defects were classified intraoperatively (Paprosky / AORI). Defects were managed with [impaction grafting / structural allograft / metal augments / cones / sleeves] as appropriate.`,
      `New components were trialed and reduced. Stability was tested through full range of motion. [Constrained liner used if instability concerns.] Final implants placed.`,
      `The wound was irrigated copiously and closed in layers over a 15 Fr Hemovac drain. Compressive dressing applied.`,
    ];
  }

  // -- Achilles tendon repair ------------------------------------------------
  if (includesAny(name, ["achilles tendon repair", "achilles rupture"])) {
    return [
      `The patient was placed prone with the operative leg slightly elevated. A longitudinal incision was made just medial to the Achilles tendon, slightly off-midline to avoid sural nerve and to keep the scar away from shoe wear.`,
      `The paratenon was incised longitudinally, identifying and protecting the sural nerve. The tendon ends were exposed and freshened of mop-end frayed tissue.`,
      `With the foot in resting equinus, a Krackow whip-stitch was placed in each tendon end using #2 FiberWire. The sutures were tied snugly to approximate the tendon ends, restoring physiologic tension matching the contralateral side.`,
      `An epitenon running 3-0 Vicryl reinforcement was placed circumferentially. Thompson test confirmed appropriate plantarflexion response. The paratenon was closed with 3-0 Vicryl, the subcutaneous tissue with 3-0 Monocryl, and the skin with 4-0 nylon interrupted.`,
      `The patient was placed in a plantarflexed plaster splint.`,
    ];
  }

  // -- Distal radius fracture ORIF -------------------------------------------
  if (includesAny(name, ["distal radius fracture", "distal radius orif", "colles", "smith"])) {
    return [
      `The arm was exsanguinated and the tourniquet inflated to 250 mmHg. A volar Henry approach was used: incision over the FCR tendon sheath, opening the FCR sheath and retracting the FCR tendon ulnarly to protect the median nerve.`,
      `The pronator quadratus was elevated subperiosteally from radial to ulnar to expose the volar distal radius. Fracture site was identified and hematoma evacuated.`,
      `Reduction was achieved by traction, dorsal-to-volar pressure, and ulnar deviation. Anatomic reduction was confirmed by direct visualisation of the volar cortex and intraoperative AP and lateral fluoroscopy.`,
      `A volar locking plate (DVR / Acumed Acu-Loc / Synthes VA-LCP) was applied. Three proximal cortical screws and [__] distal locking screws (subchondral, parallel to articular surface) were placed. Final fluoroscopy confirmed restoration of radial inclination, volar tilt, and ulnar variance with no intra-articular screw penetration.`,
      `Pronator quadratus was approximated over the plate with 3-0 Vicryl. The wound was closed in layers. Volar splint applied.`,
    ];
  }

  // -- Dupuytren fasciectomy -------------------------------------------------
  if (includesAny(name, ["dupuytren", "fasciectomy"])) {
    return [
      `The hand was exsanguinated and tourniquet inflated to 250 mmHg. A Brunner zigzag incision was marked over the affected ray(s). Skin flaps were elevated carefully — the diseased fascia is densely adherent to dermis in many places.`,
      `The pretendinous, spiral, and central cords were systematically identified. The neurovascular bundles were sought first using the spiral cord as a guide — the cord forces the digital nerve and artery to corkscrew around it. Both bundles were dissected free over the entire course before any cord was excised.`,
      `Diseased fascia was excised piecewise from proximal to distal, releasing MCP and PIP contractures. Passive joint extension was tested at each step.`,
      `Hemostasis was achieved after tourniquet release. Skin was closed loosely with 5-0 nylon — Z-plasties were used at flexion creases to prevent recurrent web contracture and skin compromise.`,
      `Plaster splint applied with the digit in extension.`,
    ];
  }

  // -- Tendon repair (flexor / extensor) ------------------------------------
  if (includesAny(name, ["tendon repair", "flexor tendon", "extensor tendon"])) {
    return [
      `The hand was exsanguinated and tourniquet inflated. The skin laceration was extended in a Brunner zigzag fashion as needed for adequate exposure.`,
      `The tendon sheath was identified and the proximal and distal tendon ends located. The proximal end was retrieved using a milking technique or a tendon retriever passed through a separate proximal incision when needed.`,
      `A 4-strand modified Kessler core suture using 4-0 looped Ethibond / FiberWire was placed across the repair site, ensuring symmetric grasp on each tendon end and avoiding gapping under tension.`,
      `A circumferential epitenon running suture using 6-0 nylon was placed to smooth the repair surface and add ~30% strength.`,
      `Active and passive ROM testing intraoperatively confirmed tendon glide without gapping. Tendon sheath was loosely closed if intact. Skin was closed with 5-0 nylon. Dorsal blocking splint applied.`,
    ];
  }

  // -- Meniscus repair / meniscectomy ----------------------------------------
  if (includesAny(name, ["meniscus repair", "meniscectomy"]) && !includesAny(name, ["arthroscopy"])) {
    const repair = includesAny(name, ["repair"]);
    return [
      `Standard knee arthroscopy was performed via anterolateral viewing portal and anteromedial working portal. Diagnostic survey was completed.`,
      `The [medial / lateral] meniscus tear was characterized: [longitudinal / radial / horizontal cleavage / bucket-handle / complex] morphology, located in the [red-red / red-white / white-white] zone, length [__] cm.`,
      repair
        ? `Tear was reducible and located in vascular zone, suitable for repair. Tear edges were freshened with a rasp. [Inside-out repair with vertical mattress sutures using 2-0 PDS / All-inside repair with [__] FasT-Fix devices] was performed across the tear, achieving stable reduction.`
        : `Tear was located in the avascular zone or had irreparable morphology. Partial meniscectomy was performed using punch and shaver, conservatively resecting back to a stable rim while preserving as much functional meniscus as possible.`,
      `Articular cartilage and ACL were re-inspected. Hemostasis confirmed. Portals closed with 4-0 nylon. Compressive dressing applied.`,
    ];
  }

  // -- Hip resurfacing -------------------------------------------------------
  if (includesAny(name, ["hip resurfacing"])) {
    return [
      `The patient was placed in lateral decubitus. A posterior approach was used. The short external rotators were released and the posterior capsule incised.`,
      `The hip was dislocated by internal rotation and adduction. The femoral head was inspected and confirmed adequate for resurfacing (sufficient bone stock, no avascular necrosis).`,
      `The femoral head and neck were templated and a guide pin placed centrally up the femoral neck under fluoroscopic guidance. Sequential reaming and milling prepared the femoral head for the resurfacing component.`,
      `The acetabulum was exposed and reamed sequentially to prepare for a press-fit cup. The cementless acetabular component was impacted in [40°/15°] inclination/anteversion.`,
      `The femoral resurfacing component was cemented onto the prepared head with bone cement, ensuring complete seating without cement extrusion. Trial reduction confirmed stability through full ROM.`,
      `Hip was reduced. Posterior capsule and external rotators were repaired. Standard layered closure.`,
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
