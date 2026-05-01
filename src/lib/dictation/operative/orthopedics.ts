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
    const isHip = includesAny(name, ["revision tha", "rev tha", "hip"]);
    return [
      `The previous skin incision was identified, marked, and reopened sharply, extending it proximally and distally as needed for adequate exposure. Subcutaneous scar was carefully divided with electrocautery. The deep fascia was incised in line with the prior approach. Dissection was carried down meticulously through dense scar tissue, with continuous palpation and direct identification of any retained suture material, nerves, and vascular structures. ${isHip ? "Care was taken to identify and preserve the sciatic nerve in posterior approaches and the femoral neurovascular bundle in anterior approaches." : "Care was taken to identify and protect the common peroneal nerve at the level of the fibular head and the popliteal vessels posteriorly."}`,
      `Before any extensive debridement, a careful inspection of the joint was made. Five separate intraoperative tissue cultures were taken from the synovium, capsule, prosthesis-bone interface, periarticular soft tissue, and any visible exudate using clean instruments and individually labelled containers. Three frozen-section samples were sent for histopathologic neutrophil count to assess for periprosthetic joint infection (Mirra criteria: > 5 PMNs per HPF in 5 fields). Aerobic, anaerobic, fungal, AFB, and 14-day extended cultures were ordered.`,
      `Existing components were systematically removed. ${isHip ? "The acetabular liner was removed first using a curved osteotome to free the locking mechanism. The acetabular cup was removed using an Explant device, taking care to preserve as much native bone stock as possible. The femoral stem was extracted using a stem extractor; for cemented stems, a Moreland-type cement removal system was used to develop the cement-prosthesis interface, with cement osteotomes and ultrasonic devices to evacuate the cement column without cortical perforation." : "The polyethylene insert was removed first by disengaging the locking mechanism. The femoral component was loosened from the bone with a curved osteotome at the bone-prosthesis interface, working circumferentially. The tibial component was similarly mobilised. For cemented components, a high-speed pencil-tip burr and ultrasonic cement removal devices were used to evacuate cement without compromising cortical integrity."} The femur and ${isHip ? "acetabulum" : "tibia"} were inspected for cortical perforation, cracks, or thinning at intervals throughout the explant.`,
      `Bone defects were systematically classified using ${isHip ? "Paprosky classification (acetabular: I, IIA, IIB, IIC, IIIA, IIIB; femoral: I, II, IIIA, IIIB, IV)" : "AORI classification (femoral and tibial: F1/T1, F2A/T2A, F2B/T2B, F3/T3)"} and addressed accordingly. Contained cavitary defects were managed with morselised cancellous allograft impaction grafting. Segmental defects were managed with structural allograft, porous metal augments (tantalum cones / sleeves), or modular metaphyseal sleeves. Cortical perforations were bypassed with stem fixation extending two cortical diameters past the defect.`,
      `Trial reduction was performed with the planned revision components. Stability was tested through full range of motion in flexion, extension, abduction, adduction, and rotation. ${isHip ? "If recurrent instability concerns: a constrained liner or dual-mobility articulation was selected. Leg lengths were equalised within 1 cm of the contralateral side, confirmed clinically and radiographically." : "Coronal and rotational alignment were assessed; medial-lateral and flexion-extension gaps were balanced. If gross instability persisted: a varus-valgus constrained or rotating-hinge knee was selected with the appropriate revision augments."}`,
      `Final components were cemented or press-fit per the construct selected. ${isHip ? "Cement, when used, was pressurised in third-generation technique with restrictor placement, pulse lavage, drying, and retrograde delivery. Modular junction (Morse taper) was thoroughly cleaned and dried before assembly." : "Cement, when used, was pressurised through third-generation technique. Patellar resurfacing or button revision was performed if indicated."} Final reduction confirmed stability through full range of motion. Tissue cultures previously sent were re-confirmed labelled and intact.`,
      `The wound was irrigated copiously with 9 L of pulsatile saline lavage, with the final 3 L containing dilute betadine. A 15 Fr Hemovac closed-suction drain was placed in the deep wound and brought out through a separate stab incision. Closure was performed in standard fashion: deep capsule with #1 Vicryl interrupted; fascia with #1 looped PDS or Vicryl running; subcutaneous tissue with 2-0 Vicryl; and skin with staples or 3-0 Monocryl subcuticular. A sterile compressive dressing and ace wrap were applied.`,
    ];
  }

  // -- Achilles tendon repair ------------------------------------------------
  if (includesAny(name, ["achilles tendon repair", "achilles rupture"])) {
    return [
      `The patient was placed prone on the operating table with adequate gel rolls under the chest, hips, and ankles, ensuring adequate ventilation and avoiding pressure on the eyes, breasts (in females), and male genitalia. The operative leg was supported with the foot hanging off the end of the table to allow free movement. The contralateral leg was checked for resting tension to use as a reference. The leg was prepped from mid-thigh to toes and draped free.`,
      `The Achilles tendon defect was palpated to confirm the level of rupture, typically 2-6 cm proximal to the calcaneal insertion within the watershed area of poor vascularity. A 6-8 cm longitudinal skin incision was made just medial to the midline of the Achilles tendon — the medial paramedian approach was selected to avoid injury to the sural nerve, which courses laterally, and to keep the eventual scar away from shoe counter friction. The incision was deepened sharply through the subcutaneous tissue to the paratenon.`,
      `The paratenon was incised longitudinally and reflected medially and laterally, taking care to preserve the paratenon for subsequent closure (it provides nutrition and tendon glide post-repair). The sural nerve and its vena comitans were identified laterally and protected with a moist gauze. The ruptured tendon ends were exposed; both were typically frayed in a "mop-end" pattern with disorganised tendon fibrils. Devitalised, frayed tissue was sharply debrided back to healthy, white, glistening tendon.`,
      `With the ankle held in resting equinus position matching the contralateral resting tension, a heavy nonabsorbable core suture was placed in each tendon end using a 4-strand or 6-strand technique. A modified Krackow stitch using #2 FiberWire (or alternative #2 Ethibond) was placed: starting at the cut end, three locking loops were placed in each tendon end, with the suture exiting at the cut surface. The two ends were tied snugly together using a buried surgeon's knot, restoring tendon length matched to the contralateral side.`,
      `A circumferential epitenon running suture of 3-0 Vicryl was then placed to smooth the repair site, reduce gap formation, and add approximately 30% strength to the construct. Intraoperative Thompson test was performed: with the leg in prone position, the calf was squeezed and appropriate plantarflexion was confirmed, comparable to the contralateral side at neutral and resting equinus.`,
      `The paratenon was repaired with running 3-0 Vicryl to restore the tendon's natural sliding sheath and vascular supply. The subcutaneous tissue was approximated with 3-0 Monocryl. The skin was closed with interrupted 4-0 nylon, taking care not to grasp the underlying tendon to avoid adhesions. A bulky compressive dressing was applied followed by a posterior plaster splint with the ankle in 30 degrees of plantarflexion to take tension off the repair.`,
    ];
  }

  // -- Distal radius fracture ORIF -------------------------------------------
  if (includesAny(name, ["distal radius fracture", "distal radius orif", "colles", "smith"])) {
    return [
      `The arm was exsanguinated using an Esmarch bandage applied from the fingertips to the upper arm, and the pneumatic tourniquet was inflated to 250 mmHg (or 100 mmHg above systolic blood pressure). The arm was placed on a hand table with the forearm supinated. A volar Henry approach was selected as the workhorse for distal radius ORIF: a 6-8 cm longitudinal incision was made along the medial border of the flexor carpi radialis (FCR) tendon, beginning at the volar wrist crease and extending proximally.`,
      `The incision was deepened through the subcutaneous tissue. The FCR tendon sheath was identified and opened longitudinally on its radial side. The FCR tendon was retracted ulnarly with a moist sponge, exposing the floor of the FCR sheath. This floor was incised, providing entry into the deep flexor compartment while keeping the median nerve and FPL (flexor pollicis longus) tendon ulnar to the dissection plane and protected.`,
      `The pronator quadratus muscle was identified and elevated subperiosteally with a Freer elevator from radial to ulnar, taking the entire muscle as a single flap that would be repaired at closure. This exposed the volar surface of the distal radius and the fracture site. Fracture hematoma was evacuated using a curette and pulse lavage, exposing healthy bone for direct visualisation of the fracture lines and articular surface.`,
      `Fracture reduction was achieved with a combination of longitudinal traction, dorsal-to-volar translation pressure on the dorsal cortex, and ulnar deviation of the wrist. The brachioradialis tendon insertion was released if it tethered the distal fragment in radial deviation. Anatomic reduction was confirmed by direct visualisation of the volar cortex (no step-off) and by intraoperative posteroanterior and lateral fluoroscopy showing restoration of the three radiographic parameters: radial inclination (22 degrees), volar tilt (11 degrees), and radial length (12 mm with neutral ulnar variance).`,
      `A volar locking plate (DVR Anatomic, Acumed Acu-Loc 2, or Synthes VA-LCP Two-Column) was selected matched to the distal radius anatomy. The plate was provisionally fixed with a 2.4 mm temporary K-wire through the proximal slot. Three 2.4 mm cortical screws were placed proximally in the radial shaft to secure the plate. Distal locking screws (typically 5-7 screws) were then placed using the targeting guide, positioned subchondrally and parallel to the joint surface, with screw lengths chosen to engage the dorsal cortex without penetrating the articular surface or the dorsal compartments.`,
      `Final intraoperative fluoroscopy in PA, lateral, and "skyline" oblique views confirmed restoration of all three parameters, no intra-articular hardware penetration, and acceptable dorsal screw lengths. The wrist was taken through full passive range of motion to confirm absence of mechanical block. The pronator quadratus was repaired over the plate with 3-0 Vicryl interrupted sutures to provide soft tissue coverage and reduce flexor tendon irritation. The FCR sheath floor was closed with 3-0 Vicryl, the subcutaneous tissue with 3-0 Monocryl, and the skin with 4-0 nylon interrupted sutures. A bulky dressing and volar wrist splint with the wrist in 30 degrees of extension and the MCP joints free were applied.`,
    ];
  }

  // -- Dupuytren fasciectomy -------------------------------------------------
  if (includesAny(name, ["dupuytren", "fasciectomy"])) {
    return [
      `The hand was exsanguinated and the pneumatic tourniquet inflated to 250 mmHg. The arm was supported on a hand table. Brunner zigzag incisions were marked extending from the proximal palm distally to involve each affected ray, with apex angles at the flexion creases at the level of the MCP, PIP, and DIP joints to prevent linear scar contracture. For severe contracture, V-Y or Z-plasty modifications were planned at the flexion creases to enable post-operative extension.`,
      `The skin incision was made and skin flaps were elevated meticulously off the underlying diseased fascia. This step required extreme care because Dupuytren disease creates dense pathologic adherence between the diseased fascia and the overlying dermis, putting the dermal blood supply at risk. Tenotomy scissors were used in a lifting-spreading motion to maintain a thick subdermal flap. The flaps were elevated to the radial and ulnar sides of the affected ray.`,
      `The diseased fascial cords were identified by their characteristic white, dense appearance and by their contraction effect on the joint. The pretendinous cord was identified first running longitudinally over the flexor tendons. The neurovascular bundles were then carefully identified by tracing them proximally where they cross-cut radial to ulnar — the radial digital nerve was identified first and traced distally with care. Spiral cords were identified by the fact that they force the digital nerve and artery to corkscrew laterally and dorsally around them; the bundles were dissected free with magnification before any cord was excised in that region.`,
      `Once both digital nerves and arteries had been identified and isolated along the entire course of the affected ray, the diseased fascia was excised piecewise from proximal to distal. The pretendinous cord was excised first. Then the central cord, lateral cord, and spiral cord were excised in sequence. After each portion of cord was removed, passive joint extension was tested at the MCP and PIP joints to confirm release. Residual cord segments contributing to remaining contracture were identified and excised.`,
      `Particular attention was paid to PIP joint contractures, which often persist after pretendinous cord excision. Joint capsulotomy of the volar plate or central slip was avoided when possible. Skin shortage was assessed: if the skin was inadequate to allow full extension after fasciectomy, full-thickness skin grafts were planned for delayed application, or a modified open palm (McCash) technique was used with delayed healing by secondary intention.`,
      `The tourniquet was released and hemostasis was meticulously achieved with bipolar cautery before final closure to prevent postoperative hematoma — the most common cause of skin necrosis in Dupuytren surgery. The skin was closed loosely with 5-0 nylon interrupted sutures using Z-plasties at all flexion creases. A bulky dressing with cotton balls in each web space was applied, followed by a volar plaster splint immobilising the wrist and digits in maximum comfortable extension. The patient was educated regarding hand therapy starting at 3-5 days, including extension splinting, edema management, and progressive ROM.`,
    ];
  }

  // -- Tendon repair (flexor / extensor) ------------------------------------
  if (includesAny(name, ["tendon repair", "flexor tendon", "extensor tendon"])) {
    const isFlexor = includesAny(name, ["flexor"]);
    return [
      `The arm was exsanguinated and the tourniquet was inflated to 250 mmHg. The hand was prepped and draped, with the arm placed on a hand table. The original skin laceration was identified and extended proximally and distally as needed in a Brunner zigzag fashion, ensuring incisions cross flexion creases at oblique angles to prevent contracture.`,
      `The tendon sheath was identified, with knowledge of the relevant zone (Zone I distal to the FDS insertion, Zone II "no man's land" between the A1 pulley and FDS insertion, Zone III in the palm, Zone IV at the carpal tunnel, Zone V in the distal forearm for flexor tendons; or the corresponding extensor tendon zones over the fingers, hand, and wrist). The injured tendon ends were identified within the sheath. ${isFlexor ? "For flexor tendon injuries, the A2 and A4 pulleys were preserved at all costs; the A1, A3, and A5 pulleys could be vented as needed for retrieval and repair." : "For extensor tendon injuries, the relevant compartment and any concurrent retinaculum were addressed."}`,
      `Tendon retrieval: the proximal tendon end was often retracted proximally due to muscle tension. It was retrieved using one of several techniques: gentle milking from proximal to distal, passing a small Foley catheter or pediatric feeding tube through the sheath and using the inflated balloon to deliver the proximal end, or making a separate proximal incision to grasp and deliver the tendon end. Excessive trauma to the sheath and tendon ends was avoided as this contributes to adhesions.`,
      `A 4-strand modified Kessler core suture was placed using 4-0 looped braided polyester (Ethibond, FiberWire, or Supramid). The first pass entered the volar surface of one tendon end, traversed within the substance of the tendon for approximately 1 cm, exited at the cut surface, then entered the cut surface of the opposite tendon end and exited dorsally. A locking loop was created on each side. The repair created four core-suture strands crossing the repair site, providing approximately 30 N of tensile strength sufficient for early controlled active motion.`,
      `An epitenon running peripheral suture was placed using 6-0 nylon or Prolene in a circumferential horizontal mattress or simple running pattern, taking small bites of the tendon surface only. This peripheral repair smooths the repair surface for tendon glide, reduces gap formation under tension, and adds approximately 30% additional strength to the construct, bringing total construct strength to approximately 50 N — adequate for early active motion protocols.`,
      `Active and passive range-of-motion testing was performed intraoperatively to confirm adequate tendon glide without gapping or repair site rupture. The flexor tendon sheath was loosely repaired with 6-0 nylon if intact, or left open. The skin was closed with 5-0 nylon interrupted sutures. A dorsal blocking splint was applied with the wrist in 20 degrees flexion, MCPs in 60-70 degrees flexion, and PIPs/DIPs in extension (Kleinert position) for ${isFlexor ? "flexor" : "extensor"} tendon repairs. Hand therapy referral was made for early controlled motion (Duran or Kleinert protocol) starting at 3-5 days.`,
    ];
  }

  // -- Meniscus repair / meniscectomy ----------------------------------------
  if (includesAny(name, ["meniscus repair", "meniscectomy"]) && !includesAny(name, ["arthroscopy"])) {
    const repair = includesAny(name, ["repair"]);
    return [
      `The patient was positioned supine with the leg in a leg holder and the operative side's knee flexed to 90 degrees. The leg was prepped and draped free. A standard knee arthroscopy was performed: the anterolateral viewing portal was established at the soft spot lateral to the patellar tendon at the joint line, just superior to the lateral tibial plateau. The 30-degree, 4 mm arthroscope was introduced and the pump pressure set to 60-80 mmHg with a flow rate of 4 L/min.`,
      `A diagnostic survey was performed in a systematic 8-10 step pattern: suprapatellar pouch, patellofemoral joint, medial gutter, medial compartment with valgus stress and figure-of-4 positioning, intercondylar notch with examination of ACL and PCL, lateral gutter, lateral compartment with figure-of-4 positioning, and posteromedial and posterolateral compartments via Gillquist maneuver if indicated. The anteromedial working portal was established under direct vision medial to the patellar tendon at the joint line, confirming safe entry away from the medial meniscus.`,
      `The ${name.includes("medial") ? "medial" : name.includes("lateral") ? "lateral" : "[medial / lateral]"} meniscus tear was characterised: ${repair ? "longitudinal vertical tear of [__] cm in the [posterior horn / mid-body / anterior horn], located in the red-red or red-white vascular zone, suitable for repair given vascular potential." : "[radial / horizontal cleavage / complex / bucket-handle / flap] tear morphology, located in the white-white avascular zone, with [__] cm of unstable tissue. Tear was probed with a meniscal probe to confirm pattern and stability."}`,
      repair
        ? `The tear edges were prepared with a meniscal rasp to abrade and stimulate vascular ingrowth from the synovial border, increasing healing potential. ${name.includes("posterior") ? "Inside-out repair was selected for posterior horn tears: 18-gauge double-armed needles loaded with 2-0 PDS were passed from the anteromedial portal through the meniscus tear edges and out through a posteromedial accessory incision. The incision was made with skin only, then blunt dissection was carried down between the medial gastrocnemius and posterior capsule, with the use of a popliteal retractor protecting the saphenous nerve. The needles were retrieved through the accessory incision, and vertical mattress sutures were tied over the capsule." : "All-inside repair was performed using FasT-Fix devices (or Meniscal Cinch / RapidLoc), each placed approximately 5 mm apart across the tear, alternating superior and inferior limbs to create a stack of vertical mattress configurations. 4-6 devices were typically required for a longitudinal tear."}`
        : `Partial meniscectomy was performed using a combination of basket forceps and an arthroscopic shaver. The unstable tear segment was conservatively resected with the shaver and basket back to a stable rim, preserving as much functional meniscus as possible. The remaining rim was probed to confirm stability — preserving meniscal hoop stresses is critical for long-term cartilage protection. The articular cartilage of the femoral condyle and tibial plateau was inspected for chondral injury (Outerbridge grading I-IV) and addressed with debridement or microfracture if indicated.`,
      `The articular cartilage and ACL were re-inspected. The arthroscope was withdrawn and the joint was infiltrated with bupivacaine 0.5% (60 mL) with epinephrine for postoperative analgesia. The portals were closed with 4-0 nylon interrupted sutures. A compressive cryotherapy dressing was applied. The patient was instructed regarding ${repair ? "touch-down weight-bearing in a hinged knee brace locked in extension for 4 weeks, then progressive ROM and weight-bearing per surgeon protocol over 3 months" : "weight-bearing as tolerated with a knee sleeve and quadriceps-strengthening exercises starting POD 1"}.`,
    ];
  }

  // -- Hip resurfacing -------------------------------------------------------
  if (includesAny(name, ["hip resurfacing"])) {
    return [
      `The patient was positioned in lateral decubitus with adequate hip and torso supports, ensuring the operative side was vertically aligned. The contralateral leg was protected with adequate padding. A posterior approach was selected as it provides excellent acetabular and femoral exposure suitable for resurfacing, despite a slightly higher dislocation risk that is mitigated by the larger head-to-neck ratio of resurfacing implants.`,
      `An 18-22 cm curvilinear posterior incision was made, centered over the greater trochanter and curving slightly anterior at the proximal end. The fascia lata was split in line with its fibres. The gluteus maximus was split bluntly. The short external rotators (piriformis, conjoint tendon, obturator internus, gemelli, and quadratus femoris) were tagged with sutures and released from their femoral insertion as a sleeve to allow later anatomic repair. The posterior capsule was then incised in T-fashion to expose the hip joint.`,
      `The hip was dislocated by internal rotation, adduction, and flexion. The femoral head was inspected for resurfacing candidacy: adequate bone stock without significant cyst formation, no avascular necrosis, intact articular cartilage on the femoral neck, and absence of significant deformity. If criteria were met, resurfacing proceeded; otherwise the case was converted to total hip arthroplasty.`,
      `Femoral preparation began with placement of a guide pin centrally up the femoral neck under fluoroscopic guidance, ensuring valgus orientation (5-10 degrees) to avoid varus stem alignment which increases femoral neck fracture risk. The femoral head was then prepared sequentially: cylindrical reaming established the diameter, followed by a planar reamer for the chamfer cuts, and a top-of-head reamer to create the final shape matching the implant geometry. The femoral neck was protected throughout to avoid notching.`,
      `Acetabular preparation was performed next. The femoral head was retracted out of the acetabulum (or osteotomised if access was limited). The labrum was excised and the acetabulum was sequentially reamed with hemispherical reamers, starting 2 mm undersized and reaming progressively to achieve a press-fit. Reaming was extended to the medial wall to ensure full contact and to optimise component coverage. The acetabular component (typically 4 mm larger than the femoral) was impacted with the inserter at 40-45 degrees inclination and 15-20 degrees anteversion.`,
      `The femoral resurfacing component was cemented onto the prepared head using cement applied retrograde into the implant cup (reverse hybrid technique). The cement was prepared in vacuum mixing and applied at correct viscosity. The component was impacted onto the head, ensuring complete seating without cement extrusion or interposition between the implant and the residual cancellous bone.`,
      `Trial reduction confirmed stability through full range of motion: 90 degrees flexion, 30 degrees abduction, neutral rotation, and resistance to dislocation in extension and external rotation. Leg lengths were equalised. The hip was reduced. The posterior capsule was repaired through transosseous tunnels in the greater trochanter using #2 nonabsorbable suture. The short external rotators were re-attached. Standard layered closure was performed: fascia with #1 Vicryl, subcutaneous with 2-0 Vicryl, and skin with staples or 3-0 Monocryl.`,
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
