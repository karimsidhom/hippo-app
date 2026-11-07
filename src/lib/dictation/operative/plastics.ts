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

  // REVIEW: plastics attending sign-off needed before residents bill from these.
  if (includesAny(name, ["cleft lip", "cleft palate", "cleft repair"])) {
    return {
      anesthesia: "General endotracheal anesthesia with oral RAE tube.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well. Admitted overnight for airway and pain monitoring. Plan: arm restraints, soft diet/cup feeding, follow-up in clinic at 1 week.",
    };
  }

  if (includesAny(name, ["dupuytren", "fasciectomy"]) && !includesAny(name, ["palmar"])) {
    return {
      anesthesia: "Regional (Bier or supraclavicular) ± sedation; general for extensive cases.",
      ebl: "Minimal.",
      drains: "Penrose drain × 24h.",
      specimens: "Resected fascia to pathology.",
      disposition:
        "The patient tolerated the procedure well. Discharge home in plaster splint. Plan: hand therapy at 1 week, night extension splint × 6 months.",
    };
  }

  if (includesAny(name, ["lipoma excision"])) {
    return {
      anesthesia: "Local anesthesia ± sedation.",
      ebl: "Minimal.",
      drains: "None routinely (Penrose for large excisions).",
      specimens: "Lipoma to pathology.",
      disposition:
        "The patient tolerated the procedure well. Discharge home the same day with wound care instructions. Suture removal at 7–14 days.",
    };
  }

  if (includesAny(name, ["facial trauma", "le fort", "zygomatic", "mandible fracture"])) {
    return {
      anesthesia: "General endotracheal anesthesia (nasal RAE for mandible).",
      ebl: "Approximately 100–300 ml.",
      drains: "None routinely.",
      specimens: "Tooth fragments / bone fragments to pathology if indicated.",
      disposition:
        "The patient tolerated the procedure well. Admitted overnight for airway monitoring (especially for mandibular fixation). Plan: soft / pureed diet, antibiotics, MMF as indicated, follow-up at 1 week.",
    };
  }

  if (includesAny(name, ["nasal reconstruction", "rhinoplasty", "septorhinoplasty"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Minimal.",
      drains: "Nasal packing for 24–48h.",
      specimens: "Cartilage / bone for pathology if structural changes made.",
      disposition:
        "The patient tolerated the procedure well. Discharge home the same day with nasal cast × 1 week, head elevation, no nose blowing × 4 weeks.",
    };
  }

  if (includesAny(name, ["scar revision", "z-plasty", "w-plasty"])) {
    return {
      anesthesia: "Local with sedation; general for large/multiple revisions.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Excised scar to pathology.",
      disposition:
        "The patient tolerated the procedure well. Discharge home the same day. Plan: scar massage starting at 2 weeks, silicone-gel sheets, sun protection × 6 months.",
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

  // REVIEW: plastics attending sign-off needed
  if (includesAny(name, ["cleft lip", "cleft palate", "cleft repair"])) {
    return `${includesAny(name, ["palate"]) ? "Cleft palate (Veau type [I/II/III/IV])" : "Unilateral / bilateral cleft lip and primary nasal deformity"} was confirmed. The ${includesAny(name, ["palate"]) ? "soft and hard palate clefts were marked. Surrounding tissues were of good quality with adequate flaps for two-layer closure (oral and nasal mucosa, with palatal muscle reconstruction)." : "skin, vermilion, white roll, philtral column, and Cupid's bow were marked according to Millard rotation-advancement / Fisher anatomic principles. The orbicularis oris muscle was identified for repair."} Hemostasis was achieved with bipolar cautery. The neonate tolerated the procedure well.`;
  }

  if (includesAny(name, ["dupuytren", "fasciectomy"]) && !includesAny(name, ["palmar"])) {
    return `Dupuytren contracture (Tubiana stage [__]) of the [ring/small/middle] finger with MCP and PIP contractures of [__]° and [__]° respectively. Pretendinous, central, and spiral cords were identified. Digital nerves and arteries were identified and protected throughout the dissection — spiral cord course was carefully traced with the bundles always protected. Following fasciectomy, full passive extension was restored at the MCP and substantially improved at the PIP.`;
  }

  if (includesAny(name, ["lipoma excision"])) {
    return `A subcutaneous lipoma measuring approximately [__] cm at the [location] was identified. The lesion was [encapsulated / lobular] and dissected sharply / bluntly from surrounding subcutaneous tissue without violating its capsule. Adjacent neurovascular structures were preserved. Hemostasis was achieved with bipolar cautery.`;
  }

  if (includesAny(name, ["facial trauma", "le fort", "zygomatic", "mandible fracture"])) {
    return `[Mandible / zygomatic / Le Fort I/II/III / orbital floor / nasoorbitoethmoid] fracture was confirmed by CT and intraoperative inspection. Fracture displacement / comminution was [__]. Reduction was achieved by direct visualization and manual manipulation. Anatomic restoration of pre-injury facial proportions and dental occlusion was confirmed. Hardware applied: [titanium miniplates / lag screws / mandibular reconstruction plates] with [__] screws per side. Post-fixation occlusion was [class I / matched preoperative occlusion].`;
  }

  if (includesAny(name, ["rhinoplasty", "septorhinoplasty", "nasal reconstruction"])) {
    return `Nasal deformity confirmed: [dorsal hump / bulbous tip / over-projection / under-projection / asymmetric nostrils / deviated septum]. ${includesAny(name, ["septo"]) ? "Septal deviation [__] degrees with [obstruction at the valve / mid-septum]." : ""} Lower lateral cartilages, upper lateral cartilages, and dorsal aesthetic lines were addressed. Final nasal shape was assessed for symmetric brow-tip aesthetic line, supratip break, and tip-defining points before final closure.`;
  }

  if (includesAny(name, ["scar revision", "z-plasty", "w-plasty"])) {
    return `Hypertrophic / contracted / aesthetically poor scar at [location] measuring [__] cm in length, oriented [against / along] relaxed skin tension lines. The scar was excised with a [__] mm margin of healthy tissue. Surrounding tissue was healthy and of adequate quality for re-approximation in a Z-plasty / W-plasty / direct elliptical closure pattern.`;
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
  // -- Dupuytren fasciectomy (plastics-side) ---------------------------------
  if (includesAny(name, ["dupuytren", "fasciectomy"]) && !includesAny(name, ["palmar"])) {
    return [
      `The hand was exsanguinated using an Esmarch wrap from the fingertips to the upper arm, and the pneumatic tourniquet inflated to 250 mmHg (or 100 mmHg above systolic blood pressure). The arm was placed on a hand table, palm up. Brunner zigzag incisions were marked extending from the proximal palm distally along each affected ray, with apex angles placed at the volar flexion creases at the level of the MCP, PIP, and DIP joints — this geometry prevents linear scar contracture and places the eventual scar transverse to skin tension lines (Langer's lines). For severe contracture, planned V-Y advancement or Z-plasty modifications were marked at the most contracted joints to permit additional length on closure.`,
      `Skin flaps were elevated with tenotomy scissors in a meticulous lifting-spreading fashion, maintaining a thick subdermal flap to preserve dermal blood supply — Dupuytren disease creates pathologic adherence between the diseased fascia and overlying dermis (the "skin pit" sign), and aggressive elevation in this plane risks devascularising the flap and producing skin necrosis. Flaps were elevated radially and ulnarly from each digital ray to the level of the midaxial line.`,
      `The diseased fascial cords were systematically identified by their characteristic dense, white, glistening appearance distinct from normal palmar fascia. The pretendinous cord was isolated first running longitudinally over the flexor tendon sheath. Most importantly, the digital neurovascular bundles were identified and traced before any cord excision: starting from the proximal palm where the common digital nerves and arteries are radial to the cords, the bundles were traced distally with magnifying loupes (× 3.5–4.5) into the digit, looking for and protecting the spiral cord — which uniquely forces the digital nerve and artery to corkscrew superficially, laterally, and distally around it (Strickland's spiral cord pathway). Both bundles were dissected free over their entire course before any cord was excised in that zone.`,
      `Once both digital neurovascular bundles were fully visualised and protected, the diseased fascia was excised systematically from proximal to distal. The pretendinous cord (Tubiana zone I) was excised first, then the central cord, the natatory cord at the web spaces, the lateral cord (most associated with PIP contracture), and the spiral cord (the most dangerous given proximity to nerves). After each portion of cord was excised, passive joint extension was tested at the MCP and PIP joints. Additional cord excision was undertaken until full or maximal passive extension was achieved.`,
      `Particular attention was paid to PIP joint contracture, which often persists after pretendinous cord excision due to capsular contracture, central slip pathology, or volar plate adhesion (Watson criteria). Capsulotomy of the volar plate was avoided when possible; if performed, the patient was counselled about the higher recurrence risk. Skin shortage at the PIP joint was assessed: if skin was inadequate to allow flat extension, a McCash open-palm technique was used (palmar incision left open, healing by secondary intention over 4–6 weeks), or full-thickness skin grafts harvested from the volar wrist were applied as delayed reconstruction.`,
      `The tourniquet was released and hemostasis was meticulously achieved with bipolar cautery before final closure — postoperative hematoma is the most common cause of skin necrosis in Dupuytren surgery and must be aggressively prevented. Skin was closed loosely with 5-0 nylon interrupted sutures, ensuring no tension; pre-marked Z-plasty flaps were transposed at all flexion creases to prevent recurrent web contracture and to lengthen the longitudinal scar. A bulky dressing with cotton balls between digits was applied, followed by a volar plaster splint immobilising the wrist in 30° extension and the digits in maximum comfortable extension. The patient was educated regarding edema management, hand therapy starting at 3–5 days, night extension splinting × 6 months, and the 30–50% lifetime recurrence risk requiring ongoing follow-up.`,
    ];
  }

  // -- Lipoma excision -------------------------------------------------------
  if (includesAny(name, ["lipoma excision"])) {
    return [
      `The patient was positioned to provide optimal exposure of the lesion, with the affected area prepped from at least 5 cm beyond the palpable margins of the lipoma in all directions. The lipoma was re-examined under sterile conditions: size, mobility, depth (subcutaneous vs. submuscular vs. intramuscular), and consistency (soft vs. firm) were noted. The skin overlying the lipoma was infiltrated with 10–20 mL of 1% lidocaine with 1:100,000 epinephrine, performed with the needle bevel up in the deep dermis to provide both anesthesia and hemostatic vasoconstriction. A 5–10 minute pause was allowed for epinephrine effect.`,
      `An incision was planned and marked along the relaxed skin tension lines (RSTL, Borges' lines) overlying the long axis of the lipoma — typically a fusiform ellipse with a 3:1 length-to-width ratio to allow tension-free closure without dog-ears. For larger lipomas (> 5 cm), the incision was placed slightly off the apex of the lesion to enable controlled delivery without skin compromise. The incision was made with a #15 blade, deepened sharply through the dermis to the level of the subcutaneous fat.`,
      `Dissection was carried down to the lipoma capsule using sharp + blunt technique. The lipoma capsule was identified as a smooth, glistening, easily distinguishable plane from surrounding subcutaneous fat. The lesion was carefully circumferentially mobilised using small Senn retractors and tenotomy scissors, working systematically around the periphery. Adjacent neurovascular structures (peripheral cutaneous nerves, branches of named arteries when in the head/neck or digits) were identified and protected. Particular attention was paid to the spinal accessory nerve in posterior neck lipomas and the marginal mandibular nerve in submandibular lipomas. For deeper lesions involving fascia or muscle, blunt dissection within the muscle fibres was performed to avoid major neurovascular structures.`,
      `The lipoma was delivered intact through the skin incision, with care taken to preserve the capsule for histologic margin assessment if any concern for atypical lipomatous tumor existed. The deep cavity was inspected and palpated to ensure no satellite lesions were left behind. Hemostasis was meticulously achieved with bipolar cautery, particularly at any small feeder vessels.`,
      `The cavity was obliterated to prevent hematoma and seroma: deep absorbable sutures (3-0 or 4-0 Vicryl) were placed in figure-of-eight fashion through the deep fat to abolish dead space. The deep dermis was approximated with 4-0 Monocryl interrupted inverted sutures, taking care to evert the wound edges. The skin was closed with 5-0 Monocryl subcuticular running suture, reinforced with Steri-Strips. The specimen was sent to pathology in formalin with proper orientation. A pressure dressing was applied for 24 hours to minimise hematoma risk.`,
    ];
  }

  // -- Facial trauma ORIF ----------------------------------------------------
  if (includesAny(name, ["facial trauma", "le fort", "zygomatic", "mandible fracture"])) {
    return [
      `${includesAny(name, ["mandible"]) ? "Erich arch bars or IMF screws were placed first to establish pre-injury dental occlusion as the foundation for accurate fracture reduction — this is the most critical principle of mandibular ORIF. Maxillomandibular fixation was applied with #25 stainless steel wires or bone-screw retained elastics, restoring the patient's pre-injury Class I (or known pre-existing) occlusion. Inter-incisal opening was confirmed at 0 mm." : ""}The surgical approach was selected based on fracture location: ${includesAny(name, ["le fort"]) ? "Le Fort I — circumvestibular maxillary degloving incision; Le Fort II — gingivobuccal sulcus incision with bilateral lower-eyelid incisions for orbital rim access; Le Fort III — bicoronal flap with bilateral lower-eyelid and gingivobuccal incisions providing access to all three frontonasal, frontozygomatic, and zygomaticomaxillary buttresses." : includesAny(name, ["zygomatic"]) ? "the gingivobuccal sulcus approach for the zygomaticomaxillary buttress, the lateral brow or upper-blepharoplasty incision for the frontozygomatic suture, and an infraorbital subciliary or transconjunctival approach for the orbital floor and rim." : includesAny(name, ["mandible"]) ? "the intraoral gingivobuccal sulcus approach (low-profile, no external scar) for symphysis, parasymphysis, body, and angle fractures; or a transcervical Risdon approach for condylar and ramus fractures requiring better access." : "an approach matched to the fracture location — gingivobuccal, transconjunctival, subciliary, lateral brow, coronal, pre-auricular, or transcervical."} The incision was infiltrated with 1% lidocaine with 1:100,000 epinephrine for hemostasis prior to incision.`,
      `Soft tissue dissection was carried down through the planned anatomic plane to expose the fracture, with explicit identification and protection of named neurovascular structures: ${includesAny(name, ["le fort"]) ? "the infraorbital nerve emerging from the infraorbital foramen (preserved with subperiosteal dissection); the lacrimal apparatus (medial canthal tendon attachment); and the frontal branches of the facial nerve in coronal flap elevation (deep to the temporoparietal fascia in the danger zone of Pitanguy)." : includesAny(name, ["mandible"]) ? "the mental nerve at the mental foramen (visualised and gently retracted before any plate placement in body fractures); the inferior alveolar nerve coursing through the mandibular canal (avoided with monocortical screw placement at the body and angle); and the marginal mandibular nerve branch (deep to the SMAS in transcervical approaches)." : includesAny(name, ["zygomatic"]) ? "the infraorbital nerve, the supraorbital nerve, and the frontal branch of the facial nerve as appropriate to the approach." : "the cranial nerve branches (V1, V2, V3 sensory; VII motor) and major vessels appropriate to the surgical zone."} Subperiosteal dissection was used for bony exposure to protect overlying soft tissue and nerve branches.`,
      `Fracture reduction was achieved by direct visualisation, manual manipulation, and sequential stabilisation of facial buttresses. ${includesAny(name, ["le fort"]) ? "For Le Fort fractures, the reduction was performed against the established maxillomandibular fixation, restoring the four facial buttresses in sequence: nasomaxillary (medial), zygomaticomaxillary (lateral), pterygomaxillary (posterior), and frontomaxillary (vertical). Each buttress was reduced and provisionally stabilised with K-wires before plating." : includesAny(name, ["mandible"]) ? "For mandibular fractures, reduction was achieved against the established occlusion, with the fracture site visualised and aligned. Champy's lines of osteosynthesis were respected — superior border tension band and inferior border compression for body and parasymphyseal fractures." : includesAny(name, ["zygomatic"]) ? "For zygomatic complex fractures, three-point fixation principles guided reduction: zygomaticofrontal suture, zygomaticomaxillary buttress (infraorbital rim), and zygomaticosphenoid suture (best assessed visually through the lateral orbital wall). Reduction was confirmed by alignment at all three landmarks before fixation." : "Reduction was confirmed by direct visualisation of fracture line alignment, palpation of restored anatomy, and intraoperative imaging if available."} Anatomic restoration of facial proportions, occlusion, and orbital volume was confirmed before fixation.`,
      `Titanium miniplate or microplate fixation was applied across each fracture line. ${includesAny(name, ["mandible"]) ? "For mandibular body and parasymphysis fractures: a 2.0 mm tension band miniplate was placed at the superior border with monocortical screws to avoid the inferior alveolar nerve; load-bearing reconstruction plates (2.4 mm) were used for comminuted, atrophic, or unstable fractures with bicortical screws. Champy plates (2.0 mm) were used for non-comminuted fractures along Champy's ideal lines." : includesAny(name, ["le fort"]) ? "For Le Fort I and II fractures: 1.5–2.0 mm L-shaped or Y-shaped miniplates were placed at the nasomaxillary and zygomaticomaxillary buttresses with monocortical screws. For Le Fort III: additional 2.0 mm plates at the frontonasal and frontozygomatic sutures." : includesAny(name, ["zygomatic"]) ? "Three-point fixation was performed: 1.5 mm miniplate at the zygomaticofrontal suture, 1.5 mm miniplate at the infraorbital rim, and 1.5–2.0 mm miniplate at the zygomaticomaxillary buttress. The orbital floor was inspected and reconstructed with titanium mesh or porous polyethylene if a defect > 1 cm² was identified." : "Plate selection was matched to the load-bearing requirements at each fracture site, with plates contoured to the anatomic surface before screw placement."} Plate position and screw lengths were verified to avoid intra-articular, intra-orbital, and intra-canal hardware penetration.`,
      `${includesAny(name, ["mandible"]) ? "After fixation, MMF was released and active range-of-motion testing confirmed restored occlusion. Bite registration was checked: the patient was instructed to bite firmly, and equal contact was confirmed. Any premature contact or open bite indicated reduction error and required revision." : ""}Final intraoperative imaging (if available) confirmed anatomic reduction. The wound was irrigated copiously with normal saline. Closure was performed in anatomic layers with attention to muscle approximation (preserving facial expression), water-tight mucosal closure (preventing oral-cutaneous fistula in intraoral approaches), and meticulous skin closure to optimise aesthetic outcome.`,
      `${includesAny(name, ["mandible"]) ? "Intraoral closure: gingivobuccal sulcus with 3-0 chromic running, frequently checking water-tight integrity. " : ""}${includesAny(name, ["le fort", "zygomatic"]) || name.includes("orbital") ? "Subciliary or transconjunctival closure: orbicularis with 5-0 chromic, skin with 6-0 nylon (subciliary) or no skin closure (transconjunctival). " : ""}Coronal flap (if used): galea with 3-0 Vicryl, skin with staples. The patient was placed on perioperative antibiotics covering oral flora${includesAny(name, ["mandible"]) ? " and instructed regarding soft mechanical diet × 6 weeks, oral hygiene with chlorhexidine rinses, and pureed diet if MMF was maintained postoperatively" : ""}. Postoperative imaging (panorex for mandible, CT facial bones for midface) was obtained to confirm final reduction and hardware position.`,
    ];
  }

  // -- Rhinoplasty / septorhinoplasty ----------------------------------------
  if (includesAny(name, ["rhinoplasty", "septorhinoplasty"])) {
    return [
      `The patient was positioned supine with the head of the bed elevated 15°, the head supported in a horseshoe headrest, and the eyes protected with corneal shields after instillation of erythromycin ointment. Pre-operative photographs (frontal, lateral bilateral, oblique bilateral, basal worm's-eye, and animation) were reviewed in the OR. The preoperative analysis was reconfirmed: dorsal aesthetic lines, brow-tip aesthetic line continuity, tip rotation and projection (Goode's ratio target ~0.55–0.6), nasolabial angle (90–95° in males, 95–105° in females), nasal width at the alar base (intercanthal distance), and any septal deviation. The proposed plan was reconfirmed.`,
      `Local infiltration was performed with 1% lidocaine with 1:100,000 epinephrine in standard injection points: the membranous columella (transcolumellar approach), the marginal incision sites bilaterally, the dorsum (subcutaneously over the periosteum and perichondrium), the radix, the lateral osteotomy lines, and the nasal septum bilaterally (submucoperichondrially). Approximately 8–10 mL was used, with a 5-minute pause for vasoconstriction. Cocaine 4% pledgets were placed intranasally for additional vasoconstriction and topical anesthesia of the mucosa.`,
      `${includesAny(name, ["septo"]) ? "The septoplasty component was performed first: a hemitransfixion or Killian incision was made on the convex side of the deviated cartilaginous septum. A submucoperichondrial flap was elevated using a Cottle elevator, then a submucoperiosteal flap was developed over the bony septum (perpendicular plate of ethmoid and vomer) without violating the intervening mucosa. The flap was elevated on the contralateral side using a swing-door technique through a small posterior tunnel. The deviated cartilaginous and bony septum was resected with Jansen-Middleton forceps, preserving an L-strut of at least 1 cm of dorsal cartilage and 1 cm of caudal cartilage to maintain nasal tip support and dorsal contour. The septum was re-approximated with quilting sutures of 4-0 plain gut to obliterate dead space and prevent septal hematoma. " : ""}An open rhinoplasty approach was selected for optimal visualisation: a transcolumellar inverted-V (gull-wing) incision was made at the narrowest portion of the columella, connecting bilaterally to marginal (rim) incisions along the caudal edge of the lower lateral cartilages. The skin and soft tissue envelope (S-STE) was elevated meticulously in the supraperichondrial plane over the lower lateral cartilages, transitioning to the subperichondrial plane over the upper lateral cartilages and the subperiosteal plane over the bony dorsum.`,
      `Tip refinement was performed first to establish the tip position before dorsal modification. Cephalic trim of the lower lateral cartilages was performed conservatively (preserving at least 6 mm of caudal LLC to prevent alar collapse and pinching). Tip-defining points were established with intradomal sutures (4-0 PDS) to refine each dome, followed by interdomal sutures to bring the domes together symmetrically. A columellar strut graft was harvested from septal cartilage and placed in a precise pocket between the medial crura, providing tip support and projection. Lateral crural strut grafts were placed if alar margin retraction or external valve incompetence was present.`,
      `Dorsal modifications were performed next. For the bony dorsum: a hump reduction was performed with a guarded osteotome (taking down the bone in incremental 1-mm strikes) followed by rasping with a Cottle rasp to refine the contour. The cartilaginous dorsum was reduced incrementally with a #11 blade, taking care to preserve the keystone area (where the upper laterals join the bony dorsum). After dorsal reduction, an "open roof" deformity typically resulted; this was closed by lateral osteotomies using a 2 mm or 3 mm guarded osteotome — the low-to-low or low-to-high pattern was selected based on width. Spreader grafts (harvested from septum) were placed between the dorsal septum and upper lateral cartilages to preserve internal valve function and dorsal aesthetic lines.`,
      `Septal cartilage grafts were harvested as needed and inset precisely: alar batten grafts for external valve support, alar contour grafts for alar margin retraction, shield grafts (Sheen) for tip refinement, and onlay grafts for dorsal contour. Grafts were secured with 5-0 PDS interrupted sutures. The soft tissue envelope was redraped over the modified framework. The columellar incision was closed with 6-0 Prolene interrupted sutures; the marginal incisions were closed with 5-0 chromic. Doyle silicone splints were placed intranasally bilaterally to support the septum during healing. An external nasal cast (Aquaplast or plaster of Paris) was applied. The patient was placed on head-of-bed elevation × 1 week, ice to the face, and saline nasal spray.`,
    ];
  }

  // -- Scar revision ---------------------------------------------------------
  if (includesAny(name, ["scar revision", "z-plasty", "w-plasty"])) {
    return [
      `The existing scar was carefully analysed and marked. Three principles were assessed: (1) orientation relative to relaxed skin tension lines (Borges/Langer's lines) — scars perpendicular to RSTL benefit from Z-plasty reorientation; (2) length and configuration — short straight scars in non-cosmetic units may be revised by simple elliptical excision, while longer scars may require multiple Z-plasties or W-plasty to break up the line; (3) cosmetic unit boundaries — the scar was assessed against facial aesthetic subunits (forehead, nasal subunits per Burget and Menick, cheek, chin, etc.) with the goal of placing revised incisions along subunit boundaries when possible.`,
      `The planned revision geometry was marked precisely with a fine-tip surgical marker. ${includesAny(name, ["z-plasty"]) ? "For Z-plasty: the central limb was placed along the existing scar; two limbs were drawn at 60° angles (the optimal trade-off between length gain ~75% and skin redundancy availability — 30° gives 25% length gain, 45° gives 50%, 60° gives 75%, 75° gives 100% but with marked redundancy). Multiple Z-plasties were marked along longer scars to reorient incrementally without extreme tension." : includesAny(name, ["w-plasty"]) ? "For W-plasty: triangles of equal 60° angles and 5-7 mm sides were marked along the scar in a continuous interlocking pattern, breaking up the scar into multiple shorter randomised segments — the eye perceives the line discontinuity as less noticeable than a continuous straight scar." : "For elliptical excision: an elliptical incision was marked with a 4:1 length-to-width ratio (preventing dog-ear formation) and oriented along RSTL. The width of excision was matched to the scar width with at least a 1-mm margin of healthy tissue."} Local anesthesia was infiltrated with 1% lidocaine with 1:100,000 epinephrine, with sufficient time for vasoconstrictive effect.`,
      `The scar was excised sharply with a #15 blade, including the full thickness of the dermis and the underlying subcutaneous fibrosis. ${includesAny(name, ["z-plasty"]) ? "Z-plasty flaps were elevated as full-thickness skin and subcutaneous flaps using sharp tenotomy scissors. The flaps were elevated 1-2 cm beyond the marked margin to ensure tension-free transposition." : "Surrounding tissue was undermined for 1-2 cm circumferentially in the subcutaneous plane to permit tension-free wound advancement and closure."} Hemostasis was achieved with bipolar cautery, taking care to avoid charring of the wound edges.`,
      `${includesAny(name, ["z-plasty"]) ? "Z-plasty flaps were transposed at 60°: each triangular flap was rotated and inset into the position of the contralateral flap. The result was lengthening of the central scar axis by approximately 75% and reorientation of the resulting scar line by 90°, ideally bringing the new central scar parallel to RSTL. Each flap tip was secured with a 5-0 nylon corner stitch (3-point or 4-point) to preserve flap perfusion at the apex." : includesAny(name, ["w-plasty"]) ? "W-plasty triangles were inset to interlock with the corresponding contralateral triangles, recreating the broken-line geometry. Each apex was secured with corner stitches." : "The wound edges were re-approximated in layers."} Tension was assessed at multiple points along the closure to ensure even distribution; any focal tension would lead to spread or hypertrophic scar.`,
      `Closure was performed in anatomic layers. The deep dermis was closed with 5-0 Monocryl (face) or 4-0 Monocryl (body) interrupted inverted sutures, taking the bulk of the wound tension at this layer to allow tension-free skin closure. The skin was then closed with: 6-0 nylon interrupted (face), 5-0 nylon (extremity), or 5-0 Monocryl subcuticular (body). Steri-Strips were applied for additional support. The wound was dressed with bacitracin ointment and a non-adherent dressing.`,
      `The patient was educated regarding wound care: gentle cleansing, ointment × 2 weeks, sun protection (SPF 50+ × 6 months) to prevent post-inflammatory hyperpigmentation, scar massage starting at 2-3 weeks, and silicone gel sheets or topical silicone × 3-6 months to optimise final scar appearance. Suture removal was scheduled at 5-7 days for facial sutures, 10-14 days for extremity sutures.`,
    ];
  }

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
