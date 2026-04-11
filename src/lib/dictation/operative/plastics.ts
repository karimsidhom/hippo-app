import type { CaseLog } from "@/lib/types";
import { includesAny } from "../shared/format";

// ---------------------------------------------------------------------------
// Plastic & Reconstructive Surgery — procedure-specific operative steps.
//
// Covers the high-frequency aesthetic, reconstructive, breast, hand, and
// craniofacial cases residents dictate. Wording is original; structure
// follows standard plastic-surgery operative-note conventions.
// ---------------------------------------------------------------------------

function plasticsOpSteps(c: CaseLog): string[] {
  const name = c.procedureName.toLowerCase();

  // -- Breast reduction ------------------------------------------------------
  if (includesAny(name, ["breast reduction", "reduction mammaplasty"])) {
    return [
      `Preoperative markings were confirmed in the upright position using a [Wise / vertical / inferior pedicle] pattern, with the new nipple position marked at the inframammary fold meridian. The sternal notch to nipple distance and nipple to IMF distance were documented bilaterally.`,
      `The nipple-areolar complex was marked with a 42 mm cookie cutter and de-epithelialized within the pedicle boundaries, preserving the dermal layer for vascular supply. The skin was incised along the pattern and the [inferior / superomedial] pedicle was developed to a uniform thickness.`,
      `The [medial, lateral, and superior] resection wedges were excised en bloc, weighed, and labeled by side. The pedicle was inset into the keyhole and the nipple-areolar complex brought through with good capillary refill and arterial bleeding from the dermis.`,
      `Closure proceeded in layers with interrupted 3-0 Vicryl to the deep dermis, 4-0 Monocryl in a running subcuticular fashion, and Steri-Strips. The contralateral side was approached identically with a symmetric resection weight.`,
      `Both breasts were assessed for symmetry, contour, and nipple viability prior to dressing application.`,
    ];
  }

  // -- Breast augmentation ---------------------------------------------------
  if (includesAny(name, ["breast augmentation", "augmentation mammaplasty", "breast implant"])) {
    return [
      `Preoperative markings were reviewed: midline, IMF, new IMF position, and the planned [inframammary / periareolar / transaxillary] incision. The implant pocket plane ([subglandular / dual-plane / submuscular]) and implant specifications were confirmed.`,
      `A [5 cm] incision was made at the marked site. Dissection was carried down to the [pectoralis fascia / muscle]. The pocket was developed bluntly and sharply to the preoperative markings, taking care to preserve the IMF and the lateral and medial borders.`,
      `The pocket was irrigated with triple-antibiotic solution and inspected for hemostasis. A Keller funnel was used to place a [manufacturer, size, shape, profile] implant under no-touch technique. The contralateral side was approached identically.`,
      `The patient was placed upright on the table to assess symmetry, IMF position, and implant position. Closure was performed in three layers: 3-0 Vicryl to the deep fascia, 3-0 Vicryl to the deep dermis, and 4-0 Monocryl subcuticular. Dressings were applied and a supportive bra placed.`,
    ];
  }

  // -- TRAM / DIEP / latissimus flap -----------------------------------------
  if (includesAny(name, ["tram", "diep", "latissimus"])) {
    const isDiep = includesAny(name, ["diep"]);
    const isLat = includesAny(name, ["latissimus"]);
    if (isDiep) {
      return [
        `The abdominal flap was marked from the infraumbilical crease to the suprapubic region in a standard fleur-de-lis pattern. Doppler was used to identify the dominant perforators on the selected side based on the preoperative CTA.`,
        `The flap was elevated from lateral to medial in the suprafascial plane. Chosen perforators were identified and preserved. Intramuscular dissection of the perforators was carried out meticulously, separating them from the rectus fibers with bipolar cautery and microvascular clips.`,
        `The deep inferior epigastric vessels were then traced to their origin at the external iliac. Once the recipient vessels (internal mammary artery and vein, exposed by removing a segment of [3rd] costal cartilage) were prepared, the flap was divided and transferred.`,
        `Microvascular anastomoses were performed under the operating microscope: artery to artery with 9-0 nylon interrupted sutures, and vein to vein with a 2.5 mm coupler. Flow was confirmed with strong pulsatile arterial signal and venous drainage. The flap was inset and secured with deep dermal sutures and closed in layers over a drain.`,
      ];
    }
    if (isLat) {
      return [
        `The latissimus dorsi was marked on the donor side with the patient in the lateral decubitus position. An elliptical skin paddle was designed along the muscle's long axis.`,
        `The skin paddle was incised and the latissimus muscle was elevated off the serratus and chest wall, preserving the thoracodorsal pedicle as the dominant vascular supply. The humeral insertion was divided.`,
        `The flap was tunneled through the axilla to the anterior chest wall defect. It was inset to cover the recipient site with deep dermal 3-0 Vicryl sutures. The donor site was closed primarily over a drain in layers.`,
      ];
    }
    // TRAM fallback
    return [
      `A lower abdominal ellipse was marked and the rectus abdominis flap was elevated with the overlying skin and fat. The rectus sheath was incised and the muscle mobilized on its superior epigastric pedicle.`,
      `The flap was tunneled to the recipient site and inset with deep dermal sutures. The abdominal fascia was reinforced with mesh and closed over drains. The donor site was closed in layers.`,
    ];
  }

  // -- Skin graft ------------------------------------------------------------
  if (includesAny(name, ["skin graft", "stsg", "split thickness", "full thickness"])) {
    const isFull = includesAny(name, ["full thickness", "ftsg"]);
    return [
      `The recipient site was debrided to healthy, bleeding tissue. Dimensions were measured (${isFull ? "full-thickness" : "split-thickness"} graft required: [__ x __ cm]). Hemostasis was confirmed.`,
      isFull
        ? `A template was made and transferred to the [preauricular / postauricular / supraclavicular / groin] donor site. A full-thickness graft was harvested, defatted meticulously with scissors, and placed on the recipient site.`
        : `A [0.015 inch] split-thickness graft was harvested from the [anterolateral thigh] with a dermatome. The graft was meshed at [1.5:1] and applied to the recipient site.`,
      `The graft was secured circumferentially with 5-0 chromic sutures. A bolster dressing was applied with Xeroform and cotton balls, tied over the graft. The donor site was dressed with Tegaderm/Xeroform as appropriate.`,
    ];
  }

  // -- Local / rotation / advancement flap -----------------------------------
  if (includesAny(name, ["local flap", "rotation flap", "advancement flap", "v-y", "rhomboid", "bilobed"])) {
    return [
      `The defect was measured and a [rotation / advancement / rhomboid / bilobed] flap was designed based on adjacent tissue laxity, perfusion, and scar orientation. Doppler was used to confirm a robust perforator within the flap base where applicable.`,
      `The flap was incised to the subcutaneous fat / subdermal plexus and elevated off the underlying fascia. Back-cuts were made sparingly to improve reach without compromising the pedicle. The flap was inset to the defect under no tension.`,
      `Key sutures were placed with 4-0 Vicryl in the deep dermis. The skin was approximated with 5-0 nylon or 5-0 Monocryl in a running subcuticular fashion. Viability was confirmed by brisk dermal bleeding and normal capillary refill.`,
    ];
  }

  // -- Free flap (generic) ---------------------------------------------------
  if (includesAny(name, ["free flap", "alt flap", "anterolateral thigh", "radial forearm", "fibula flap"])) {
    return [
      `The recipient site was prepared and recipient vessels identified and dissected under loupe magnification. Vessel caliber and flow were confirmed adequate for microvascular anastomosis.`,
      `The donor flap was designed over the selected perforator. The flap was elevated with preservation of its dominant pedicle, which was then traced proximally for adequate length and caliber.`,
      `Ischemia time began as the pedicle was divided. The flap was transferred to the recipient site and inset. Under the operating microscope, an end-to-end arterial anastomosis was performed with interrupted 9-0 nylon, and the venous anastomosis with a [2.5 / 3.0 mm] coupler.`,
      `Reperfusion was confirmed by pulsatile arterial flow, venous filling, and brisk capillary refill at the flap edges. Total ischemia time was [___] minutes. Implantable Doppler was placed on the venous pedicle. The donor site was closed in layers over a drain.`,
    ];
  }

  // -- Carpal tunnel ---------------------------------------------------------
  if (includesAny(name, ["carpal tunnel"])) {
    return [
      `A [2 cm] longitudinal incision was made in line with the radial border of the ring finger, within the glabrous skin of the palm and ending proximal to Kaplan's cardinal line. Dissection was carried through the palmar fascia to expose the transverse carpal ligament.`,
      `The ligament was divided sharply along its entire length under direct vision, protecting the underlying median nerve. The nerve was inspected and appeared [healthy / compressed with hourglass deformity]. No neurolysis was required.`,
      `Hemostasis was achieved with bipolar cautery. The skin was closed with interrupted 5-0 nylon. A soft dressing was applied with a wrist splint for comfort.`,
    ];
  }

  // -- Trigger finger release ------------------------------------------------
  if (includesAny(name, ["trigger finger", "trigger thumb", "a1 pulley"])) {
    return [
      `A transverse incision was made over the A1 pulley at the metacarpophalangeal flexion crease of the affected digit. Dissection was carried through the subcutaneous tissue, identifying and protecting the radial and ulnar digital neurovascular bundles.`,
      `The A1 pulley was identified and divided longitudinally under direct vision. The flexor tendons were inspected and glided freely without catching. Active flexion and extension were confirmed intraoperatively.`,
      `Hemostasis was confirmed and the skin closed with 5-0 nylon interrupted sutures. A soft dressing was applied.`,
    ];
  }

  // -- Abdominoplasty / panniculectomy ---------------------------------------
  if (includesAny(name, ["abdominoplasty", "panniculectomy", "tummy tuck"])) {
    return [
      `Preoperative markings were confirmed in the standing position, defining the inferior incision [suprapubic], the umbilical position, and the lateral extent. The patient was placed supine with the hips slightly flexed.`,
      `The lower abdominal incision was made and carried down to the fascia. The pannus was elevated off the anterior abdominal fascia up to the xiphoid and costal margins. The umbilicus was incised circumferentially and preserved on its stalk.`,
      `${includesAny(name, ["abdominoplasty", "tummy tuck"]) ? "Rectus diastasis was plicated in the midline from xiphoid to pubis with interrupted 0 PDS sutures to re-create an aesthetic midline." : "No fascial plication was performed."}`,
      `The flap was redraped inferiorly and excess skin and fat excised. The umbilicus was externalized through a new site and inset with interrupted sutures. Two drains were placed. Closure proceeded in three layers with 2-0 Vicryl Scarpal, 3-0 Vicryl deep dermal, and 4-0 Monocryl subcuticular.`,
    ];
  }

  // -- Cleft lip / palate repair ---------------------------------------------
  if (includesAny(name, ["cleft lip", "cleft palate"])) {
    const isPalate = includesAny(name, ["palate"]);
    if (isPalate) {
      return [
        `The palate was exposed with a Dingman retractor. Markings were placed for a [Furlow double-opposing Z-plasty / two-flap / Veau-Wardill-Kilner] repair.`,
        `Mucoperiosteal flaps were elevated off the hard palate, preserving the greater palatine pedicles. The levator veli palatini muscle was identified and dissected from its abnormal attachments, then reoriented and repaired in the midline to reconstruct the muscular sling.`,
        `The nasal and oral mucosa were closed in layers with 4-0 Vicryl. Hemostasis was confirmed. Tongue stitch was placed for airway safety.`,
      ];
    }
    return [
      `Markings for a Millard rotation-advancement repair were placed. The lip was infiltrated with local anesthetic with epinephrine. Incisions were made along the markings and the muscle, skin, and mucosa were separated into their respective layers.`,
      `The orbicularis oris muscle was dissected and reapproximated in the midline with interrupted 5-0 PDS. The skin was closed with 6-0 nylon interrupted sutures aligning the white roll meticulously. The mucosa was closed with 5-0 chromic.`,
    ];
  }

  // -- Mohs reconstruction / facial flap -------------------------------------
  if (includesAny(name, ["mohs", "facial reconstruction", "cheek flap", "forehead flap", "nasolabial flap"])) {
    return [
      `The Mohs defect was measured and the surrounding tissue assessed for laxity, perfusion, and aesthetic subunit boundaries. A [cervicofacial / bilobed / forehead / nasolabial] flap was designed to recruit tissue from a favorable donor area within the same aesthetic subunit.`,
      `The flap was elevated in the appropriate plane (${includesAny(name, ["forehead"]) ? "above the frontalis" : "subcutaneous"}) with careful preservation of its vascular pedicle. Back-cuts were made to optimize rotation without compromising perfusion.`,
      `The flap was inset in layers: 4-0 Vicryl to the deep dermis and 5-0/6-0 nylon or fast-absorbing gut to the skin, aligning the aesthetic subunit borders. Hemostasis was confirmed. The donor site was closed primarily.`,
    ];
  }

  // Generic plastics fallback
  return [
    `The operative field was prepped and draped in the usual sterile fashion. Local anesthetic with epinephrine was infiltrated. The planned ${c.procedureName} was performed with attention to tension-free closure, preservation of perfusion, and aesthetic subunit alignment. [Expand with procedure-specific technical steps.]`,
    ``,
    `Hemostasis was confirmed throughout. Closure was performed in layers with absorbable deep dermal sutures and appropriate skin closure.`,
  ];
}

export function plasticsBody(c: CaseLog): string[] {
  // Plastics cases are almost always positioning-specific rather than
  // following the laparotomy/lap template. We emit a lightweight preamble
  // and let the case-specific steps carry the technique.
  const preamble = [
    `Description of Procedure: The risks, benefits, and alternatives were discussed with the patient, and informed consent was obtained. The patient was brought to the operating room and positioned appropriately for ${c.procedureName}. After induction of [general / regional / monitored] anesthesia, the operative site was prepped and draped in the usual sterile fashion.`,
    ``,
    `A surgical time-out was completed, confirming patient identity, procedure, site, laterality, consent, antibiotics, and implant/graft availability as applicable.`,
    ``,
  ];
  const closure = [
    ``,
    `Hemostasis was confirmed throughout. All counts were correct. Dressings were applied and the patient was transferred to recovery in stable condition with the operative site in good position.`,
  ];
  return [...preamble, ...plasticsOpSteps(c), ...closure];
}
