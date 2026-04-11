import type { CaseLog } from "@/lib/types";
import { includesAny } from "../shared/format";
import type { TopMatter } from "./types";

// ---------------------------------------------------------------------------
// Plastic & Reconstructive Surgery — procedure-specific operative steps.
//
// Forced fields:
//   - Wound bed quality and viability
//   - Tissue quality (turgor, vascularity, perfusion)
//   - Margins (oncologic margin status)
//   - Coverage plan (primary, STSG, FTSG, flap)
//   - Flap / graft considerations (thickness, inset, pedicle, Doppler)
//   - Dressing plan
//   - Donor site management
// ---------------------------------------------------------------------------

export function plasticsTopMatter(c: CaseLog): TopMatter {
  const name = c.procedureName.toLowerCase();

  if (includesAny(name, ["breast reduction", "reduction mammaplasty"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Approximately 100–300 ml.",
      drains: "15 Fr closed-suction drain to each breast, brought out through separate stab incisions.",
      specimens: "Breast tissue from each side weighed and submitted separately for pathology.",
      disposition: "The patient tolerated the procedure well. Discharged home in a surgical bra. Drain care teaching provided. Follow-up in 1 week for wound check and drain removal when output < 30 ml/day.",
    };
  }

  if (includesAny(name, ["breast augmentation", "augmentation mammaplasty"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Minimal.",
      drains: "None routinely.",
      specimens: "None.",
      disposition: "The patient tolerated the procedure well. Discharge home the same day in a surgical bra. Activity restriction × 4 weeks. Follow-up in 1 week.",
    };
  }

  if (includesAny(name, ["flap", "diep", "tram", "latissimus", "alt", "radial forearm", "fibula free flap"])) {
    return {
      anesthesia: "General endotracheal anesthesia with arterial line and Foley catheter.",
      ebl: "Approximately 200–500 ml.",
      drains: "15 Fr closed-suction drains to recipient and donor sites.",
      specimens: "None routinely.",
      disposition: "The patient tolerated the procedure well. Admitted to a flap-monitoring unit for hourly clinical and Doppler checks × 48–72 hours. Flap warming, hydration, and vasopressor avoidance per standard protocol. Donor site dressed appropriately.",
    };
  }

  if (includesAny(name, ["skin graft", "stsg", "ftsg"])) {
    return {
      anesthesia: "General or monitored anesthesia care depending on wound size.",
      ebl: "Minimal.",
      drains: "None (bolster dressing applied over graft).",
      specimens: "None / wound bed biopsy as indicated.",
      disposition: "The patient tolerated the procedure well. Graft dressing left intact for 5 days. Donor site dressed with Xeroform. Strict immobilization of the grafted region. First dressing change on POD 5.",
    };
  }

  if (includesAny(name, ["carpal tunnel", "trigger finger", "a1 pulley"])) {
    return {
      anesthesia: "Local anesthesia with monitored sedation (or WALANT).",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None.",
      disposition: "The patient tolerated the procedure well. Discharge home the same day in a soft bulky dressing. Begin gentle range of motion immediately. Suture removal at 10–14 days.",
    };
  }

  if (includesAny(name, ["abdominoplasty", "panniculectomy"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Approximately 200–400 ml.",
      drains: "Two 15 Fr closed-suction drains.",
      specimens: "Pannus / abdominal skin and subcutaneous tissue.",
      disposition: "The patient tolerated the procedure well. Admitted overnight in flexed position to reduce tension on closure. Drain care teaching, abdominal binder, early ambulation with flexed posture.",
    };
  }

  if (includesAny(name, ["mohs", "local flap", "rotation flap", "advancement flap"])) {
    return {
      anesthesia: "Local anesthesia with or without sedation.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None (Mohs specimen already processed by Mohs surgeon).",
      disposition: "The patient tolerated the procedure well. Discharge home with wound care instructions. Suture removal at 5–14 days depending on anatomic location.",
    };
  }

  return {
    anesthesia: "General or local anesthesia with sedation.",
    ebl: "Approximately ________ ml.",
    drains: "[Describe drains or 'None'].",
    specimens: "[Specimens or 'None'].",
    disposition: "The patient tolerated the procedure well. Wound care and follow-up per standard plastic surgery protocol.",
  };
}

export function plasticsFindings(c: CaseLog): string {
  const name = c.procedureName.toLowerCase();

  if (includesAny(name, ["breast reduction", "reduction mammaplasty"])) {
    return `Bilateral breast hypertrophy was addressed. Skin and parenchymal tissue were of [normal / attenuated] quality with good turgor. The inferior / superomedial pedicle was designed and confirmed to have reliable perfusion. Nipple-areolar perfusion was excellent at the conclusion of the reduction, confirmed by capillary refill and brisk dermal bleeding. [__] g was resected from the right breast and [__] g from the left.`;
  }

  if (includesAny(name, ["breast augmentation", "augmentation mammaplasty"])) {
    return `Breast anatomy was symmetric with well-defined inframammary folds. Soft tissue thickness over the upper pole was [adequate / thin]. The [subglandular / subpectoral / dual-plane] pocket was developed to precisely match the implant dimensions. [__] mL [smooth / textured] silicone implants were selected bilaterally. Symmetric pocket dimensions and implant position were confirmed with the patient in the seated position.`;
  }

  if (includesAny(name, ["flap", "diep", "tram", "alt", "radial forearm", "latissimus", "fibula free flap"])) {
    return `The recipient wound bed was [healthy with viable tissue / previously irradiated and scarred / contaminated but debrided and granulating]. The defect measured approximately [__] × [__] cm with exposed [vital structure]. The flap pedicle was identified, isolated, and confirmed patent with strong Doppler signal proximally and throughout the course of the flap. After inset, the flap demonstrated [excellent color, turgor, capillary refill / immediate Doppler signal over the pedicle]. Coverage plan achieved with a [pedicled / free] flap with [single venous / double venous] anastomosis. Donor site was closed primarily / required STSG coverage.`;
  }

  if (includesAny(name, ["skin graft", "stsg", "ftsg"])) {
    return `The recipient wound bed was [healthy granulation tissue / freshly debrided] with [no / minimal] contamination and good vascularity confirmed by dermal bleeding. The wound measured approximately [__] × [__] cm. No exposed bone, tendon, or hardware was present. A [0.012-inch split-thickness / full-thickness] skin graft was harvested from the [thigh / post-auricular / groin] donor site with excellent quality. The graft was meshed 1.5:1 and inset with [skin staples / running absorbable sutures].`;
  }

  if (includesAny(name, ["carpal tunnel"])) {
    return `The transverse carpal ligament was identified and was [thickened / normal]. The median nerve was compressed with [hourglass deformity / mild flattening]. After complete release, the nerve regained normal caliber and color. No anomalous thenar motor branch was encountered. The recurrent motor branch was visualized and preserved.`;
  }

  if (includesAny(name, ["trigger finger", "a1 pulley"])) {
    return `The A1 pulley was identified and was thickened and constricting. Triggering of the flexor tendon was reproduced prior to release. After complete release of the A1 pulley, the tendon glided smoothly without any residual catching, and full active range of motion was demonstrated. The A2 pulley was preserved.`;
  }

  if (includesAny(name, ["abdominoplasty", "panniculectomy"])) {
    return `A large abdominal pannus with [striae / stretch marks / a healed prior incision] was identified. The rectus fascia was [diastatic by __ cm / intact]. No ventral hernia was encountered. The umbilicus was preserved on a healthy vascularized stalk. Skin and soft tissue quality was good. Closure was achieved in a tension-free fashion after plication of the midline fascia.`;
  }

  if (includesAny(name, ["mohs", "local flap", "rotation flap", "advancement flap"])) {
    return `The defect measured approximately [__] × [__] cm on the [forehead / cheek / nasal / ear / scalp / lip / extremity] region and was [superficial / deep to fascia / full thickness]. Margins had been confirmed clear by the Mohs surgeon. Adjacent skin was of [good / scarred / actinically damaged] quality with adequate laxity for local coverage. A [rotation / advancement / rhomboid / bilobed] flap was designed and elevated in the subdermal plane with preservation of perforators. Perfusion of the flap was excellent at the conclusion of inset.`;
  }

  return `The wound bed was [healthy / debrided] with viable surrounding tissue. Margins of prior resection were inspected and were [clear on intraoperative assessment]. Adjacent tissue was of adequate quality for the planned coverage. Vascularity was confirmed by capillary refill and dermal bleeding at the wound edges.`;
}

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
