import type { CaseLog } from "@/lib/types";
import { includesAny } from "../shared/format";
import type { TopMatter } from "./types";

// ---------------------------------------------------------------------------
// ENT — forced fields:
//   - Airway management (intubation, throat pack)
//   - Facial nerve monitoring and landmarking
//   - Recurrent laryngeal nerve identification and integrity
//   - Parathyroid identification and preservation
//   - Vocal cord / laryngeal exam findings
//   - Nasal packing plan
//   - Tracheostomy tube size and cuff status
// ---------------------------------------------------------------------------

export function entTopMatter(c: CaseLog): TopMatter {
  const name = c.procedureName.toLowerCase();

  if (includesAny(name, ["tonsillectomy", "adenoidectomy", "t&a"])) {
    return {
      anesthesia: "General endotracheal anesthesia with oral RAE tube.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Tonsils right and left, submitted separately.",
      disposition: "The patient tolerated the procedure well. Discharge home the same day on clear liquids advancing as tolerated, scheduled acetaminophen/ibuprofen, return precautions for bleeding or fever.",
    };
  }

  if (includesAny(name, ["myringotomy", "tympanostomy", "m&t", "ear tubes"])) {
    return {
      anesthesia: "Mask general anesthesia.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None.",
      disposition: "The patient tolerated the procedure well. Discharge home the same day. Ear drops for 5 days. Follow-up in 4 weeks.",
    };
  }

  if (includesAny(name, ["septoplasty", "turbinate"])) {
    return {
      anesthesia: "General endotracheal anesthesia with oral RAE tube and throat pack.",
      ebl: "Minimal.",
      drains: "Nasal splints or Doyle splints in place.",
      specimens: "Cartilage / bone fragments to pathology if removed.",
      disposition: "The patient tolerated the procedure well. Discharge home. Saline nasal sprays, head-of-bed elevation. Splints removed in clinic at 1 week.",
    };
  }

  if (includesAny(name, ["fess", "functional endoscopic sinus", "sinus surgery"])) {
    return {
      anesthesia: "General endotracheal anesthesia with throat pack.",
      ebl: "Approximately 50–150 ml.",
      drains: "Bioresorbable packing in place.",
      specimens: "Sinus tissue and polyps submitted to pathology.",
      disposition: "The patient tolerated the procedure well. Discharge home. Saline irrigations starting POD 1, intranasal steroid, no nose-blowing × 1 week. Debridement in clinic at 1 week.",
    };
  }

  if (includesAny(name, ["thyroidectomy"])) {
    return {
      anesthesia: "General endotracheal anesthesia with continuous intraoperative recurrent laryngeal nerve monitoring via NIM tube.",
      ebl: "Minimal.",
      drains: "None routinely (7 Fr JP may be placed for large goiters).",
      specimens: "Thyroid [lobe / gland] oriented for pathology; parathyroid glands identified and preserved on vascular pedicle.",
      disposition: "The patient tolerated the procedure well. Both RLN signals intact at the end of the case. Admitted for overnight observation for airway and serial ionized calcium checks. Discharge home on POD 1 if stable.",
    };
  }

  if (includesAny(name, ["parotidectomy"])) {
    return {
      anesthesia: "General endotracheal anesthesia with facial nerve monitoring; paralysis avoided.",
      ebl: "Approximately 50–150 ml.",
      drains: "10 Fr closed-suction drain in the parotid bed.",
      specimens: "Superficial / total parotid gland oriented for pathology.",
      disposition: "The patient tolerated the procedure well. Facial nerve function preserved with intact monitoring signals throughout. Admitted for overnight observation. Drain removal when output < 30 ml/day.",
    };
  }

  if (includesAny(name, ["neck dissection"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Approximately 200–400 ml.",
      drains: "15 Fr closed-suction drain in the neck.",
      specimens: "Neck lymph node contents by level, oriented for pathology.",
      disposition: "The patient tolerated the procedure well. Admitted to the floor for drain monitoring and pain control. Drain removal when output < 30 ml/day for 48 hours.",
    };
  }

  if (includesAny(name, ["tracheostomy"])) {
    return {
      anesthesia: "General endotracheal anesthesia (converted at the end of the case).",
      ebl: "Minimal.",
      drains: "[__] Shiley cuffed tracheostomy tube in place.",
      specimens: "None.",
      disposition: "The patient tolerated the procedure well with stable airway on the tracheostomy tube. Admitted for trach care, suctioning, and humidification. First trach change at POD 5–7.",
    };
  }

  // REVIEW: ENT attending sign-off needed before residents bill from these.
  if (includesAny(name, ["cochlear implant"])) {
    return {
      anesthesia: "General endotracheal anesthesia with facial nerve monitoring.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well. Admitted overnight. Plan: device activation at 3–4 weeks in audiology clinic, antibiotic ointment to incision, no water exposure × 1 week.",
    };
  }

  if (includesAny(name, ["mastoidectomy", "tympanomastoidectomy"])) {
    return {
      anesthesia: "General endotracheal anesthesia with facial nerve monitoring.",
      ebl: "Minimal.",
      drains: "Penrose × 24h optional.",
      specimens: "Cholesteatoma / granulation tissue / mastoid specimen for pathology and culture.",
      disposition:
        "The patient tolerated the procedure well. Admitted overnight. Plan: postoperative antibiotic drops, dry ear precautions, follow-up in clinic at 1 week.",
    };
  }

  if (includesAny(name, ["laryngectomy", "total laryngectomy"])) {
    return {
      anesthesia: "General endotracheal anesthesia (later trach), arterial line + central access.",
      ebl: "Approximately 200–500 ml.",
      drains: "Two closed-suction drains in the neck.",
      specimens: "Larynx + thyroid + neck nodes oriented for pathology.",
      disposition:
        "The patient tolerated the procedure well. Admitted to the ICU / step-down for airway, NG / J-tube feeds, voice rehabilitation referral. Tracheoesophageal puncture for voice prosthesis at 2 weeks if planned.",
    };
  }

  if (includesAny(name, ["microdirect", "microlaryngoscopy", "vocal cord", "phonosurgery"])) {
    return {
      anesthesia: "General endotracheal anesthesia (small endotracheal tube or jet ventilation).",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Vocal cord lesion / cyst / polyp for pathology.",
      disposition:
        "The patient tolerated the procedure well. Discharge home the same day. Plan: voice rest × 7–14 days, voice therapy referral, follow-up scope at 4 weeks.",
    };
  }

  if (includesAny(name, ["salivary stone", "sialolithiasis", "sialendoscopy", "submandibular gland"])) {
    return {
      anesthesia: "General endotracheal anesthesia with nerve monitoring (for gland excision).",
      ebl: "Minimal.",
      drains: "Penrose drain × 24h for gland excision.",
      specimens: "Stone / gland for pathology + culture.",
      disposition:
        "The patient tolerated the procedure well. Discharge home the same day (sialendoscopy) or next day (gland excision). Plan: warm compresses, hydration, sialagogues.",
    };
  }

  return {
    anesthesia: "General endotracheal anesthesia.",
    ebl: "Minimal.",
    drains: "[Describe drains, packing, or 'None'].",
    specimens: "[Specimens or 'None'].",
    disposition: "The patient tolerated the procedure well. Postoperative plan per standard ENT service protocol.",
  };
}

export function entFindings(c: CaseLog): string {
  const name = c.procedureName.toLowerCase();

  if (includesAny(name, ["tonsillectomy", "adenoidectomy", "t&a"])) {
    return `The tonsils were [markedly hypertrophic / cryptic / chronically inflamed] bilaterally. The adenoids [fully obstructed / partially obstructed] the posterior nasal choanae. No evidence of retained dental hardware or airway compromise. Hemostasis was excellent in the tonsillar fossae and nasopharynx at the completion of the case. The airway was clear.`;
  }

  if (includesAny(name, ["myringotomy", "tympanostomy", "m&t"])) {
    return `Bilateral tympanic membranes were [retracted / effused / bulging] with [serous / mucoid / purulent] middle ear effusions. Myringotomies were made in the antero-inferior quadrants and fluid was suctioned. Pressure-equalization tubes were placed without difficulty bilaterally.`;
  }

  if (includesAny(name, ["septoplasty"])) {
    return `The nasal septum was significantly deviated to the [right / left] with a bony / cartilaginous spur causing airway obstruction. The inferior turbinates were hypertrophied. After septoplasty and turbinate reduction, the nasal airway was markedly improved with a midline septum. Hemostasis was excellent.`;
  }

  if (includesAny(name, ["fess"])) {
    return `Nasal endoscopy confirmed [polyposis / chronic mucosal thickening / purulent secretions] in the [maxillary / ethmoid / frontal / sphenoid] sinuses bilaterally, consistent with preoperative CT. The uncinate, middle turbinate, skull base, and lamina papyracea were identified and preserved. Sinus ostia were widely opened. No CSF leak or orbital injury was encountered.`;
  }

  if (includesAny(name, ["thyroidectomy"])) {
    return `The thyroid was [diffusely enlarged / nodular / contained a [__] cm dominant nodule in the [right / left] lobe]. Both recurrent laryngeal nerves were identified and traced throughout their cervical course, with intact NIM signals at 2 mA stimulation before and after dissection. All four parathyroid glands were identified and preserved on their vascular pedicles with viable color. No evidence of extrathyroidal extension or central compartment lymphadenopathy.`;
  }

  if (includesAny(name, ["parotidectomy"])) {
    return `A [__] cm parotid mass was identified in the [superficial / deep] lobe, consistent with the preoperative imaging. The facial nerve trunk was identified at the tragal pointer / tympanomastoid suture and dissected out to its branches with intact stimulation throughout. All five facial nerve branches had intact function at the conclusion of the case. The tumor was removed en bloc with a rim of normal parotid tissue.`;
  }

  if (includesAny(name, ["neck dissection"])) {
    return `Neck dissection was performed preserving the spinal accessory nerve, internal jugular vein, and sternocleidomastoid muscle where oncologically appropriate. Lymph node contents were harvested from levels [II / III / IV / V] as indicated. No gross extracapsular extension was identified. The carotid sheath was protected throughout.`;
  }

  if (includesAny(name, ["tracheostomy"])) {
    return `The trachea was identified between the second and third tracheal rings. A Bjork flap / vertical tracheal incision was made and a [__] Shiley cuffed tracheostomy tube was placed without difficulty, with immediate capnography confirming airway position and bilateral breath sounds auscultated.`;
  }

  // REVIEW: ENT attending sign-off needed
  if (includesAny(name, ["cochlear implant"])) {
    return `Severe-to-profound bilateral sensorineural hearing loss confirmed preoperatively. ${name.includes("right") ? "Right" : name.includes("left") ? "Left" : "[Right/left]"} ear targeted. Mastoid anatomy was [normal / aberrant facial nerve location]. The facial recess was widely opened and the round window was identified. Electrode array was inserted atraumatically with all [22 / 24] electrodes in scala tympani; impedance and integrity testing post-insertion were within normal limits. Facial nerve function was preserved and confirmed at the conclusion of the case.`;
  }

  if (includesAny(name, ["mastoidectomy", "tympanomastoidectomy"])) {
    return `${name.includes("right") ? "Right" : name.includes("left") ? "Left" : "[Right/left]"} ear demonstrated [chronic otitis media with cholesteatoma / mastoiditis / chronic granulation tissue]. Cholesteatoma sac extended into [attic / antrum / sinus tympani / facial recess]. Ossicular chain was [intact / partially eroded — incus body lost]. Facial nerve was identified along its tympanic and mastoid segments; integrity confirmed. Disease was completely removed and tympanic membrane reconstructed.`;
  }

  if (includesAny(name, ["laryngectomy", "total laryngectomy"])) {
    return `Advanced laryngeal squamous cell carcinoma confirmed pre-operatively (T[__]N[__]). Tumor extended through [supraglottic / glottic / subglottic] subsites with [no / suspected] cartilage invasion. Bilateral neck dissection nodal yield: [__] level II, [__] level III, [__] level IV nodes. Tracheoesophageal puncture for voice prosthesis was [performed primarily / deferred to secondary procedure]. Margins were oriented and submitted to pathology.`;
  }

  if (includesAny(name, ["microdirect", "microlaryngoscopy", "vocal cord", "phonosurgery"])) {
    return `Microlaryngoscopy demonstrated [vocal cord polyp / nodule / cyst / leukoplakia / Reinke's edema / subepithelial lesion] of the [right / left / bilateral] true vocal cord(s). The lesion was [pedunculated / sessile] and [__] mm in size. The contralateral cord was [normal / also affected]. The arytenoids, false cords, and subglottis were normal. Pathology was sent for permanent section.`;
  }

  if (includesAny(name, ["salivary stone", "sialolithiasis", "sialendoscopy", "submandibular gland"])) {
    return `${name.includes("submandibular") ? "Submandibular" : "Parotid"} sialolithiasis on the [right / left] side. Stone burden: [single / multiple] stones, the largest measuring [__] mm at the [proximal / mid / distal] [Wharton's / Stensen's] duct. ${includesAny(name, ["sialendoscopy"]) ? "Sialendoscopy demonstrated the stone in the lumen and was successfully extracted. Distal duct strictures and gland inflammation noted." : "Gland was [chronically inflamed / fibrotic] with normal facial nerve relationship preserved."}`;
  }

  return `Intraoperative findings were consistent with the preoperative diagnosis. The airway was secured and relevant cranial nerves were identified and preserved. Hemostasis was satisfactory at the conclusion of the case.`;
}

// ---------------------------------------------------------------------------
// Otolaryngology — Head and Neck Surgery (ENT) — procedure-specific steps.
//
// Covers the high-volume pediatric airway, sinus, head-and-neck oncologic,
// and laryngology cases residents dictate.
// ---------------------------------------------------------------------------

function entOpSteps(c: CaseLog): string[] {
  const name = c.procedureName.toLowerCase();

  // -- Tonsillectomy ± adenoidectomy -----------------------------------------
  if (includesAny(name, ["tonsillectomy", "adenoidectomy", "t&a"])) {
    const withAdenoids = includesAny(name, ["adenoid", "t&a", "t and a"]);
    return [
      `The patient was positioned supine with a shoulder roll in the Rose position. A McIvor mouth gag was inserted and suspended to expose the oropharynx. The uvula and soft palate were palpated to exclude a submucous cleft.`,
      `The right tonsil was grasped with an Allis clamp and retracted medially. The anterior tonsillar pillar was incised with electrocautery or a coblation wand, and the tonsil was dissected out of its capsular plane in the avascular space. Hemostasis was achieved with suction cautery. The left tonsil was removed in an identical fashion.`,
      withAdenoids
        ? `The adenoid pad was exposed with a palate retractor. The adenoids were removed with an adenoid curette / suction electrocautery / microdebrider under mirror visualization, with preservation of the eustachian tube orifices and torus tubarius.`
        : ``,
      `Both tonsillar fossae and the nasopharynx were inspected and hemostasis was confirmed with suction cautery as needed. The oropharynx was irrigated and suctioned dry. The mouth gag was released and the patient was extubated awake.`,
    ].filter(Boolean);
  }

  // -- Myringotomy + tubes ---------------------------------------------------
  if (includesAny(name, ["myringotomy", "tympanostomy", "pe tubes", "ear tubes"])) {
    return [
      `Under mask anesthesia, the patient was positioned supine with the head turned. The external auditory canal was examined under the operating microscope. Cerumen was removed as needed and the tympanic membrane visualized.`,
      `A radial myringotomy incision was made in the [anterior-inferior] quadrant with a myringotomy knife. Middle ear effusion was suctioned and characterized. A [Sheehy / Armstrong] grommet tube was placed across the incision using alligator forceps and positioned with the flanges flat on the membrane.`,
      `The contralateral ear was approached identically. Floxin drops were instilled bilaterally. The patient was awakened and transferred to recovery in stable condition.`,
    ];
  }

  // -- Septoplasty -----------------------------------------------------------
  if (includesAny(name, ["septoplasty", "septal reconstruction"])) {
    return [
      `The nose was decongested with oxymetazoline pledgets and the septum infiltrated with 1% lidocaine with epinephrine. A hemitransfixion incision was made along the left caudal septum.`,
      `Bilateral mucoperichondrial flaps were elevated sharply off the quadrangular cartilage. Deviated portions of cartilage and bone were identified, and a swinging-door technique was used to relocate the caudal septum to the midline. Deviated bony portions (ethmoid plate, vomer, maxillary crest) were removed with a Jansen-Middleton forceps, taking care to preserve an adequate dorsal and caudal L-strut of at least 1 cm.`,
      `The mucoperichondrial flaps were re-approximated with a quilting stitch of 4-0 plain gut. The hemitransfixion incision was closed with 4-0 chromic. Doyle splints were placed bilaterally and secured with a 3-0 nylon transseptal stitch.`,
    ];
  }

  // -- FESS ------------------------------------------------------------------
  if (includesAny(name, ["fess", "sinus surgery", "ethmoidectomy", "maxillary antrostomy"])) {
    return [
      `The nose was decongested with oxymetazoline pledgets and the lateral nasal wall infiltrated with local anesthetic. Navigation was registered to the preoperative CT.`,
      `A 0° endoscope was used to examine the nasal cavity. The uncinate process was identified and removed with a backbiter and through-cutting forceps. The maxillary sinus ostium was identified and widened into a middle meatal antrostomy.`,
      `Anterior ethmoidectomy was performed, removing the bulla ethmoidalis and opening the anterior ethmoid air cells. Posterior ethmoidectomy and sphenoidotomy were performed as indicated. The frontal recess was addressed with Draf [I / IIa / IIb] as needed based on disease burden.`,
      `Diseased mucosa and polyps were removed with the microdebrider. Specimens were sent for histopathology and culture. Hemostasis was achieved with topical epinephrine pledgets and FloSeal. The nasal cavity was examined and found to be widely patent.`,
    ];
  }

  // -- Thyroidectomy ---------------------------------------------------------
  if (includesAny(name, ["thyroidectomy"])) {
    const isTotal = includesAny(name, ["total thyroidectomy"]);
    return [
      `The patient was positioned supine with the neck extended over a shoulder roll. A [low transverse] cervical incision was made in a natural skin crease approximately 2 fingerbreadths above the sternal notch. Subplatysmal flaps were raised superiorly to the thyroid notch and inferiorly to the sternal notch.`,
      `The strap muscles were separated in the midline and retracted laterally to expose the thyroid gland. The [right] lobe was mobilized by ligating the middle thyroid vein and dissecting the superior pole away from the cricothyroid space, with careful preservation of the external branch of the superior laryngeal nerve.`,
      `The recurrent laryngeal nerve was identified in the tracheoesophageal groove using the tubercle of Zuckerkandl and the inferior thyroid artery as landmarks, and was traced superiorly to its insertion at the cricothyroid joint with the aid of intraoperative nerve monitoring. The superior and inferior parathyroid glands were identified and preserved on their vascular pedicles.`,
      `The [right] lobe was dissected off the trachea with small clips and bipolar energy. The isthmus was divided. ${isTotal ? "The left lobe was mobilized in identical fashion with preservation of the contralateral recurrent laryngeal nerve and parathyroids." : "A near-total ipsilateral lobectomy was completed."}`,
      `Specimens were labeled and sent to pathology. Hemostasis was confirmed. The strap muscles were reapproximated with 3-0 Vicryl, the platysma with 4-0 Vicryl, and the skin closed with 5-0 Monocryl subcuticular.`,
    ];
  }

  // -- Parotidectomy ---------------------------------------------------------
  if (includesAny(name, ["parotidectomy"])) {
    return [
      `A modified Blair incision was made in a preauricular crease, curving around the earlobe and extending into a cervical crease. The skin flap was elevated just superficial to the parotidomasseteric fascia.`,
      `The tragal pointer, tympanomastoid suture, and posterior belly of the digastric were used to identify the facial nerve trunk at its exit from the stylomastoid foramen. The nerve was traced and dissected through the parotid parenchyma with bipolar cautery and a facial nerve monitor, identifying each of its branches.`,
      `A [superficial / total] parotidectomy was performed, preserving the facial nerve intact. The specimen was removed and sent for pathology. Hemostasis was confirmed. A drain was placed and the wound closed in layers.`,
    ];
  }

  // -- Neck dissection -------------------------------------------------------
  if (includesAny(name, ["neck dissection"])) {
    return [
      `The neck was exposed via a [modified Schobinger / apron / MacFee] incision. Subplatysmal flaps were raised superiorly to the mandible and inferiorly to the clavicle, with preservation of the marginal mandibular branch of the facial nerve.`,
      `A [selective / modified radical / radical] neck dissection was performed, clearing lymphatic tissue from levels [I-IV / II-IV / I-V] en bloc, with identification and preservation (or sacrifice where oncologically indicated) of the spinal accessory nerve, internal jugular vein, and sternocleidomastoid muscle.`,
      `The specimen was labeled by level and oriented for pathology. Hemostasis was confirmed. A closed-suction drain was placed and the wound was closed in layers with platysma reapproximation and subcuticular skin closure.`,
    ];
  }

  // -- Tracheostomy ----------------------------------------------------------
  if (includesAny(name, ["tracheostomy", "tracheotomy"])) {
    return [
      `The patient was positioned supine with the neck extended. A vertical or transverse cervical skin incision was made halfway between the cricoid and sternal notch. Dissection was carried through the subcutaneous tissue and platysma. The strap muscles were separated in the midline and retracted laterally.`,
      `The thyroid isthmus was identified and divided between clamps, the ends oversewn with 3-0 Vicryl. The pretracheal fascia was cleared to expose the tracheal rings. Stay sutures of 2-0 silk were placed on either side of the midline between the [2nd and 3rd] tracheal rings.`,
      `A vertical tracheotomy was made between the 2nd and 3rd tracheal rings. Anesthesia withdrew the endotracheal tube under direct vision and a [size 6 Shiley] tracheostomy tube was placed into the airway and secured. Correct placement was confirmed by end-tidal CO2 and bilateral breath sounds.`,
      `The tracheostomy tube was secured with tracheostomy ties and a single 2-0 silk stay suture to the skin. A sterile dressing was applied.`,
    ];
  }

  // -- Direct laryngoscopy / panendoscopy ------------------------------------
  if (includesAny(name, ["direct laryngoscopy", "panendoscopy", "microlaryngoscopy"])) {
    return [
      `After induction of general anesthesia and with the head in the sniffing position, a tooth guard was placed over the upper dentition. A [Dedo / Lindholm] laryngoscope was introduced and suspended on a Mayo stand, exposing the larynx.`,
      `The operating microscope was brought in. A systematic examination of the oropharynx, hypopharynx, supraglottis, glottis, subglottis, and proximal trachea was performed. [Findings: describe.] Biopsies were taken with cup forceps from [locations] and sent for pathology.`,
      `Hemostasis was confirmed. The laryngoscope was removed. The patient was turned back to anesthesia and awakened in the OR.`,
    ];
  }

  // -- Cochlear implant ------------------------------------------------------
  if (includesAny(name, ["cochlear implant"])) {
    return [
      `The patient was positioned supine with the head turned to the contralateral side and stabilised on a horseshoe headrest, with the operative ear vertically uppermost. The ear and surrounding scalp were shaved 4-6 cm posterior to the postauricular crease. The skin was prepped with chlorhexidine and draped to expose the entire postauricular region. Continuous facial nerve monitoring (NIM-3 or equivalent) was established with electrodes in the orbicularis oculi and orbicularis oris ipsilaterally, with the contralateral side serving as control. Baseline tracings were obtained.`,
      `A 6-8 cm postauricular incision was marked approximately 1 cm posterior to the postauricular crease, extending in a gentle C-shape from above the helical root superiorly to below the mastoid tip inferiorly. The incision was infiltrated with 1% lidocaine with 1:100,000 epinephrine for hemostasis. The skin and subcutaneous tissue were incised. A subperiosteal pocket was developed posteriorly using a Lempert elevator to accommodate the receiver/stimulator package — the pocket extended 4-5 cm posterior to the planned receiver bed and was carefully sized to provide a snug fit without skin tension.`,
      `A bony bed for the receiver was drilled into the calvarium using a cutting burr (typically 4 or 5 mm), at a position 4-5 cm posterior to the external auditory canal and slightly superior to the temporal line, ensuring the receiver would lie flush with the surrounding bone. The depth of the bed was adjusted to recess the receiver completely, preventing any palpable contour. Tie-down holes for receiver fixation were drilled using a 1 mm diamond burr at the corners of the bed.`,
      `Cortical mastoidectomy was performed using a 4 mm cutting burr followed by progressively smaller diamond burrs as the dissection deepened toward critical structures. Anatomical landmarks were systematically identified: the linea temporalis superiorly (defining the upper extent of the dissection), the spine of Henle marking the external auditory canal anteriorly, the digastric ridge inferiorly identifying the third genu of the facial nerve, and the sigmoid sinus posteriorly. The mastoid antrum was opened and the lateral semicircular canal identified as a yellow prominence on the medial wall. The short process of the incus was identified in the fossa incudis, providing the medial limit of safe dissection.`,
      `The facial recess was opened — the most critical and technically demanding portion of the procedure. The facial nerve (vertical/mastoid segment) was identified medial to the dissection but was kept covered with a thin shell of bone for protection. The chorda tympani was identified and used as the anterior boundary of the facial recess. Drilling proceeded with diamond burrs and continuous saline irrigation, opening the triangular space bordered by the facial nerve posteriorly, chorda tympani anteriorly, and the fossa incudis (incudal buttress) superiorly. Continuous facial nerve monitoring was checked at frequent intervals; any change in baseline EMG signal triggered immediate cessation of drilling.`,
      `Through the facial recess, the round window niche was visualised in the medial wall of the middle ear. The round window membrane was confirmed by its location relative to the oval window/stapes superior-posteriorly and the promontory anteriorly. Either a round window approach (preferred; preserves residual hearing) was used by removing the bony overhang of the niche to expose the membrane, or a cochleostomy was drilled in the basal turn of the cochlea anterior-inferior to the round window niche, approximately 1.5 mm anterior to the round window using a 1.0-mm diamond burr.`,
      `The electrode array was inserted atraumatically through the round window membrane (after a small incision with a microscalpel) or through the cochleostomy. The array was advanced slowly under continuous direct microscopic visualisation, watching for tactile feedback at first resistance (indicating potential basilar membrane contact). Full insertion was confirmed by all electrodes being within the cochlea, with the marker band at the round window. The electrode entrance was sealed with a small piece of harvested temporalis fascia or muscle to prevent CSF leak (in patients with enlarged vestibular aqueduct or perilymphatic gusher) and to support the electrode position.`,
      `The receiver/stimulator package was placed in the previously prepared bony bed and secured with 2-0 silk tie-down sutures through the previously drilled tie-down holes, ensuring stable fixation. The lead wire was carefully tucked into a previously drilled bony groove crossing the mastoid, with care taken to avoid kinking and to maintain enough lead reserve for skull growth (in pediatric patients) or unanticipated movement.`,
      `Intraoperative neural response telemetry (NRT for Cochlear, NRI for Advanced Bionics, ART for MED-EL) was performed by the audiologist to confirm device function: impedance values were measured for all electrodes (typically 1-25 kΩ in normal ranges), and neural responses to stimulation were obtained. All electrodes were confirmed functional. Facial nerve monitoring confirmed intact baseline at the conclusion. The wound was closed in layers: subcutaneous tissue with 3-0 Vicryl interrupted, dermis with 4-0 Vicryl, and skin with 5-0 Monocryl subcuticular running suture. A pressure dressing was applied to prevent hematoma and seroma.`,
    ];
  }

  // -- Mastoidectomy ---------------------------------------------------------
  if (includesAny(name, ["mastoidectomy", "tympanomastoidectomy"])) {
    return [
      `The patient was positioned supine with the head turned away from the operative side and supported in a horseshoe headrest. The hair was shaved 3-4 cm posterior to the auricle. The face was draped with the operative ear exposed and the contralateral side covered, with continuous facial nerve monitoring established (NIM-3 system) — needle electrodes were placed in the ipsilateral orbicularis oculi and orbicularis oris with contralateral controls, and baseline tracings confirmed.`,
      `A 5-6 cm postauricular C-shaped incision was made approximately 1 cm posterior to the postauricular crease, infiltrated first with 1% lidocaine with epinephrine. The incision was deepened through skin, subcutaneous tissue, and into the temporalis fascia plane. A flap of temporalis fascia (typically 2 × 2 cm) was harvested at this point and pressed flat to dry — this would later be used for tympanic membrane reconstruction. The harvest site was sutured closed.`,
      `A vascular strip was developed in the cartilaginous external auditory canal: incisions were made along the tympanomastoid suture and the tympanosquamous suture, creating a posteriorly-based flap of canal skin. The external auditory canal was entered and the tympanic membrane visualised. The vascular strip was reflected anteriorly. Any cholesteatoma sac extending into the middle ear was identified at this point.`,
      `Cortical mastoidectomy proceeded with a 4 mm cutting burr followed by smaller diamond burrs (3 mm, 2 mm, 1 mm) as anatomically critical structures were approached, with continuous saline irrigation throughout. The systematic landmarks were identified in sequence: linea temporalis superiorly (the upper limit of dissection, separating mastoid from middle cranial fossa), the spine of Henle marking the external auditory canal anteriorly, MacEwen's triangle (suprameatal triangle) defining the entry to the antrum, the tegmen mastoideum (separating mastoid from middle fossa), and the sigmoid sinus posteriorly. The mastoid antrum was opened and Koerner's septum was identified.`,
      `The medial wall of the antrum was carefully drilled to identify the lateral semicircular canal — appearing as a yellowish-white prominence — which served as a critical landmark for the second genu of the facial nerve immediately anterior. The fossa incudis was identified and the short process of the incus protected. The tegmen was followed forward to the epitympanum (attic), and the digastric ridge was followed anteriorly to identify the mastoid (vertical) segment of the facial nerve, which was kept covered by a thin layer of bone (~0.5 mm) for protection.`,
      `${name.includes("canal wall down") || name.includes("modified radical") ? "A canal-wall-down (modified radical) mastoidectomy was performed: the posterior wall of the external auditory canal was systematically taken down to the level of the facial nerve, creating an open mastoid cavity. The cavity was saucerised — high facial ridge lowered to the level of the second genu of the facial nerve, the mastoid tip drilled flush with the digastric ridge, and the cavity rounded smoothly without dependent pockets that could collect debris. A wide meatoplasty (canal opening enlargement) was created with concha-hugging incisions to ensure adequate self-cleaning of the cavity postoperatively." : "An intact canal wall (canal-wall-up) mastoidectomy was performed — the bony external auditory canal was preserved. The facial recess was opened between the chorda tympani anteriorly and the facial nerve posteriorly to gain access to the middle ear from the mastoid for cholesteatoma extraction without removing the canal wall."}`,
      `Cholesteatoma was systematically removed from all sites: the epitympanum (attic) cholesteatoma was extracted from around the head of malleus and body of incus; antral disease was cleared; facial recess and sinus tympani disease (the most difficult to access) was carefully removed under high magnification; and the eustachian tube orifice was inspected. Care was taken to extract the cholesteatoma matrix completely without leaving residual disease, using fine right-angle picks (Hough hoes) and mucous-plug suction.`,
      `The ossicular chain was inspected systematically: the malleus, incus, and stapes were assessed for erosion, fixation, and continuity. Common findings included incus body erosion, long-process of incus erosion, and stapes superstructure erosion. Reconstruction was performed: ${"[for incus erosion: an autologous remodelled incus was placed between malleus and stapes; for absent superstructure: a TORP (Total Ossicular Replacement Prosthesis) of titanium or HAPEX was placed from footplate to malleus handle; for present superstructure with absent incus: a PORP (Partial Ossicular Replacement Prosthesis) was placed from stapes head to drum]"}.`,
      `The tympanic membrane was reconstructed using the previously harvested temporalis fascia in an underlay technique: the tympanic remnant was elevated, the fascia was placed in the middle ear with absorbable Gelfoam packing supporting the fascia from below, and the tympanic membrane edges and vascular strip were redraped over the fascia for full coverage. Antibiotic ointment was placed in the canal. The postauricular wound was closed in layers: temporal fascia with 4-0 Vicryl, subcutaneous tissue with 4-0 Vicryl, skin with 5-0 nylon. A mastoid pressure dressing was applied for 24 hours.`,
    ];
  }

  // -- Total laryngectomy ----------------------------------------------------
  if (includesAny(name, ["laryngectomy", "total laryngectomy"])) {
    return [
      `The patient was positioned supine with the neck slightly extended over a shoulder roll. The head was stabilised on a horseshoe headrest with the neck and upper chest exposed. Continuous neuromonitoring was established for the recurrent laryngeal nerve, hypoglossal nerve, and marginal mandibular nerve. An arterial line and central venous access were placed by anesthesia. A standard horizontal cervical (Gluck-Sorensen apron) incision was marked from mastoid tip to mastoid tip, dipping inferiorly to incorporate the future tracheostoma site approximately 2 cm above the sternal notch.`,
      `The incision was deepened through the platysma. Subplatysmal flaps were elevated superiorly to the level of the hyoid bone and inferiorly to the suprasternal notch and clavicles, exposing the entire anterior neck. Selective neck dissections were performed bilaterally as oncologically indicated — typically levels II, III, and IV (selective lateral neck dissection) for supraglottic and glottic primary tumors with N0 necks; comprehensive levels II-V for clinically positive nodes. Care was taken to preserve the spinal accessory nerve, internal jugular vein, and sternocleidomastoid muscle when oncologically appropriate (functional neck dissection).`,
      `Attention was turned to the larynx. The strap muscles (sternohyoid, sternothyroid, thyrohyoid, omohyoid) were transected approximately 2 cm below their thyroid attachment with electrocautery and tagged for later identification. The thyroid isthmus was divided between vascular clamps and ligated with 2-0 silk; for tumors with thyroid involvement, ipsilateral thyroid lobectomy was performed including the pyramidal lobe with preservation of the contralateral parathyroid glands and contralateral recurrent laryngeal nerve. The trachea was identified.`,
      `The greater cornu of the hyoid bone was identified bilaterally. The suprahyoid muscles were divided sharply along the superior border of the hyoid (digastric, mylohyoid, geniohyoid, hyoglossus, stylohyoid attachments) with electrocautery, taking care to stay close to the bone to avoid injury to the hypoglossal nerve coursing superior and lateral to the hyoid. The hyoid was thus skeletonised. The infrahyoid muscles (already partially detached) were completely released from their hyoid attachments.`,
      `The trachea was entered with a horizontal incision below the level of the cricoid (typically between the second and third tracheal rings). The patient was transitioned to direct intubation through the new tracheostoma, with anaesthesia confirming end-tidal CO2 and bilateral breath sounds. The endotracheal tube from above was removed. The trachea was beveled and sutured with interrupted 2-0 Vicryl to the surrounding skin to mature the permanent stoma.`,
      `The larynx was now mobilised completely from the surrounding tissues. The pharynx was entered most safely from above through the vallecula (in the supraglottic primary) or from below by dividing the trachea above (in the glottic/subglottic primary). The pharyngeal mucosa was incised circumferentially around the larynx, taking the larynx en bloc with surrounding pharyngeal mucosa as oncologically required. The postcricoid mucosa was preserved as much as possible to maintain pharyngeal closure tissue. The specimen was removed and oriented with sutures for the pathologist (right superior, left superior, right inferior).`,
      `Pharyngeal reconstruction was performed in three layers: an inner mucosal layer with running 3-0 Vicryl in inverting Connell-style fashion (T-shaped or vertical-line closure depending on the size of the defect); a middle muscular layer of pharyngeal constrictors with interrupted 3-0 Vicryl; and an outer layer of platysma with 3-0 Vicryl. The closure was tested for water-tightness by infusing 60 mL of normal saline through a nasogastric tube while occluding the upper esophagus — any leak was repaired with additional 3-0 Vicryl.`,
      `${includesAny(name, ["tep", "voice prosthesis"]) ? "A primary tracheoesophageal puncture (TEP) was created using a TEP introducer placed at the 12 o'clock position of the tracheostoma, advancing into the esophagus 1.5 cm above the stoma. A red rubber catheter was placed through the puncture to maintain the tract. " : ""}A nasogastric tube was placed for 7-10 days of enteral feeds while the pharyngeal closure healed. Two large-bore (15 Fr Blake) closed-suction drains were placed bilaterally — one in each radical neck bed and one anterior to the pharyngeal closure — to prevent fistula formation. The wound was closed in layers: platysma with 3-0 Vicryl, dermis with 4-0 Vicryl, skin with 4-0 Monocryl subcuticular. The tracheostoma was matured with interrupted 3-0 Vicryl placed circumferentially. A laryngectomy tube was placed temporarily.`,
    ];
  }

  // -- Microlaryngoscopy / phonosurgery --------------------------------------
  if (includesAny(name, ["microdirect", "microlaryngoscopy", "phonosurgery"])) {
    return [
      `The patient was positioned supine in the "sniffing position" with the head extended over a soft headrest, neck flexed slightly forward, and the operator at the head of the bed. A protective tooth guard (custom-fitted plastic or rolled gauze) was placed over the maxillary teeth to prevent dental injury during laryngoscope insertion. Anaesthesia provided either small-bore endotracheal intubation (typically a 5.0 or 5.5 mm cuffed tube) or jet ventilation (Hunsaker catheter) depending on the specific procedure and need for cordal exposure.`,
      `An anti-fog operating microscope was draped and positioned with a 400 mm focal length objective lens. A binocular 30° viewing arm was set for the operator. The head of the bed was lowered to position the larynx at appropriate height for the microscope. Suction equipment, multiple sizes of laryngoscopes (Dedo, Lindholm, Holinger, Steiner, Lindholm), and microlaryngeal instruments (cup forceps, microscissors, 0° micro-suction, microflap elevators) were prepared.`,
      `A laryngoscope (typically a Dedo for the male larynx, Lindholm for the broader exposure of the female larynx, or anterior commissure scope when accessing the anterior third) was introduced atraumatically into the oropharynx by the surgeon's left hand. The blade was advanced past the base of tongue, posterior to the epiglottis, and into the laryngeal vestibule. The scope was suspended on a Mayo stand-mounted Lewy laryngoscope holder, securing the position once optimal exposure of the glottis was achieved with the operator's hands free.`,
      `Under direct microscopic visualisation at × 16-40 magnification, a systematic examination of the larynx was performed: bilateral aryepiglottic folds, false vocal cords, true vocal cords, anterior commissure, posterior commissure (interarytenoid space), and subglottis. The lesion was identified, photographed, and characterised: anatomic location (membranous vs. cartilaginous cord, epithelium vs. lamina propria depth), size, surface morphology (smooth, irregular, ulcerated), color, and mobility on phonation testing if performed pre-procedure.`,
      `${name.includes("polyp") || name.includes("nodule") || name.includes("cyst") ? "Microflap technique was performed for the benign lesion: a microflap incision was made with a microsickle knife or 11-blade at the lateral edge of the lesion, parallel to the vocal cord free edge. The mucosa was elevated off the lesion using a microflap elevator, working in the superficial layer of the lamina propria (Reinke's space), carefully preserving the vocal ligament beneath. The lesion was bluntly dissected from the underlying tissue and removed using cup forceps. The mucosa was redraped, with no need for suturing — it self-readheres to the underlying tissue." : "The lesion was biopsied (or excised) using cold microsurgical instruments — cup forceps for biopsy specimens (4-6 cores from different positions of the lesion to avoid sampling error), microscissors for excision. CO2 laser or KTP laser was used adjunctively for vascular lesions or hemostasis, with appropriate eye protection and laryngeal protection (wet pledgets and laser-safe ETT). The principle was always to preserve maximal vocal cord function — incisions and excisions were placed on the superior surface or lateral aspect of the cord rather than the medial vibrating edge whenever possible."}`,
      `Hemostasis was achieved with topical pledgets soaked in 1:10,000 epinephrine, applied with cup forceps and held for 30-60 seconds — this was effective for 95%+ of cases. Bipolar cautery on a microsurgical setting was used sparingly for persistent bleeding, taking care to avoid thermal injury to adjacent vocal cord. The cord was re-inspected for symmetry, mucosal integrity, and absence of adhesions. Pathology specimens were placed in saline (for histology) or saline-soaked Telfa (if photodocumentation was required for tumor mapping).`,
      `The laryngoscope was withdrawn under direct vision after final inspection confirmed no foreign bodies left behind. The patient was awakened in the OR with the head of the bed elevated, on humidified oxygen, and was instructed regarding strict voice rest × 7-14 days, throat lozenges or sprays for postoperative pain, and follow-up flexible laryngoscopy in clinic at 4 weeks to assess healing and resume voice therapy.`,
    ];
  }

  // -- Sialendoscopy / submandibular gland excision --------------------------
  if (includesAny(name, ["salivary stone", "sialolithiasis", "sialendoscopy", "submandibular gland"])) {
    if (includesAny(name, ["submandibular gland"])) {
      return [
        `The patient was positioned supine with the neck extended over a shoulder roll, the head turned slightly to the contralateral side. Continuous neuromonitoring was established for the marginal mandibular branch of the facial nerve, the lingual nerve, and the hypoglossal nerve — three critical structures intimately associated with the submandibular gland and at risk during this dissection. Baseline tracings were obtained.`,
        `A 4-5 cm transverse incision was marked in a natural skin crease approximately 2 finger-breadths (3-4 cm) below the inferior border of the mandible — placement well below the mandibular border is critical to avoid injury to the marginal mandibular nerve, which dips below the inferior border of the mandible in approximately 20% of patients (Dingman & Grabb's classic anatomic study). The incision was infiltrated with 1% lidocaine with epinephrine for hemostasis.`,
        `The incision was deepened through skin, subcutaneous tissue, and platysma. Subplatysmal flaps were elevated superiorly to the inferior border of the mandible and inferiorly to expose the gland. Hayes Martin maneuver was performed: the facial vein was identified at the inferior aspect of the dissection, ligated with 3-0 silk, and divided. The proximal end of the facial vein was retracted superiorly with the gland — the marginal mandibular nerve travels superficial to the facial vein and would thus be retracted away from the dissection field, protecting it during gland mobilisation.`,
        `The investing fascia of the gland was incised and the gland was systematically mobilised circumferentially using blunt and sharp dissection. The facial artery, which loops over the superior surface of the gland, was identified entering the gland medially; it was clipped (or in some surgeons' hands, preserved when oncologically not required) with hemoclips or 3-0 silk, doubly ligated, and divided. The mylohyoid muscle was identified deep to the gland and retracted anteriorly, exposing the deep portion of the gland between the mylohyoid and hyoglossus muscles.`,
        `As the gland was rotated anteriorly and superiorly to expose its deep portion, the lingual nerve was identified, dropping down from above to enter the deep portion of the gland and continuing to the floor of mouth — it was meticulously preserved by sharp dissection of the gland off it (the lingual nerve forms a "V" shape with the hypoglossal nerve, with the gland nestled between). The hypoglossal nerve was identified inferiorly running deep to the digastric muscle and was protected. Wharton's duct was identified at the deep medial portion of the gland, ligated distally with 3-0 silk, and divided. The gland was now fully mobilised.`,
        `The submandibular gland was removed intact — it was important to remove the entire gland with all of Wharton's duct to prevent recurrent ranula formation; partial gland removal is incomplete surgery for chronic sialadenitis. The specimen was sent to pathology in formalin with proper orientation. The wound bed was inspected for hemostasis, with attention to the facial artery stump and any small vessels along the lingual nerve. A 7 Fr Penrose drain was placed and brought out through a separate stab incision.`,
        `Closure was performed in layers: platysma was closed with 3-0 Vicryl interrupted sutures; subcutaneous tissue with 4-0 Vicryl; skin with 5-0 Monocryl subcuticular running suture. Steri-Strips were applied. The patient was educated regarding drain output recording, no neck flexion × 1 week, and follow-up at 1 week for drain removal and pathology review.`,
      ];
    }
    return [
      `The patient was positioned supine with the head turned slightly to expose the affected duct. For Wharton's duct (submandibular gland), the patient was placed in slight reverse Trendelenburg with the neck extended; for Stensen's duct (parotid gland), the head was turned and the cheek retracted laterally. Topical anaesthesia (4% lidocaine spray) was applied to the floor of mouth (for Wharton's papilla) or buccal mucosa adjacent to the second maxillary molar (for Stensen's papilla). Submucosal infiltration of 1-2 mL of 1% lidocaine was performed at the papilla site.`,
      `The papilla was identified — Wharton's papilla in the floor of mouth lateral to the lingual frenulum, or Stensen's papilla on the buccal mucosa opposite the second maxillary molar. A papillotomy was performed with a microsickle knife or fine-tip 15 blade making a 2-3 mm incision through the papilla parallel to the duct course, opening the duct lumen for endoscope access. Lacrimal probes (000 to 3) were used to dilate the papillotomy progressively.`,
      `A semi-rigid sialendoscope (1.1 mm Marchal scope or 0.8 mm pediatric scope) with integrated working channel and irrigation was introduced through the papillotomy into the duct. Saline irrigation was used for distension and visualisation throughout the procedure. The duct was systematically inspected from the papilla proximally toward the gland: the duct lumen, mucosa, branching pattern, and any pathology (stones, strictures, mucous plugs, kinks) were documented at each level.`,
      `${includesAny(name, ["sialolithiasis", "salivary stone"]) ? "The salivary stone was identified at [proximal / mid / distal] [duct level]. For mobile stones < 4 mm: a basket retrieval was performed using a wire basket (Dormia basket, Cook Marchal basket) advanced through the working channel of the endoscope, manipulated to capture the stone, and retracted under direct visualisation. For stones 4-8 mm: intracorporeal lithotripsy was performed using a holmium:YAG laser fiber (200 micron) advanced through the working channel, with laser energy of 0.5-1.0 J at 5-10 Hz applied directly to the stone in close-contact mode until fragmentation. Fragments were then basket-retrieved or allowed to wash out. For larger stones > 8 mm or stones in the proximal duct/intraglandular position: a combined endoscopic-transoral / endoscopic-transcutaneous approach was used. " : "The duct stricture was identified and characterised. Hydrostatic dilation was performed with a balloon dilator or progressive instillation of saline at controlled pressure. For tight strictures, a 4 Fr or 5 Fr Fogarty-style balloon catheter was passed beyond the stricture, inflated, and withdrawn to dilate. Multiple passes were performed. "}`,
      `Once the pathology was addressed, distal duct anatomy was re-inspected, all fragments and debris cleared by saline irrigation, and the duct lumen confirmed patent. A self-retaining stent (4 Fr or 5 Fr silicone catheter) was placed through the papilla into the duct and secured with a 5-0 Vicryl suture to the floor of mouth (or buccal mucosa) to maintain duct patency during healing and to prevent papilla re-stenosis. The stent was left in place for 1-2 weeks.`,
      `The patient was instructed regarding warm compresses, generous hydration, sialagogues (citrus candies, lemon-flavored hard sweets), and gland massage 3-4 times daily to promote saliva flow. Stent removal was scheduled at 2 weeks. Follow-up sialography or repeat sialendoscopy at 6 weeks was planned to assess for recurrent stones or stricture re-formation.`,
    ];
  }

  // Generic ENT fallback
  return [
    `The operative site was exposed using appropriate instrumentation and visualization. The ${c.procedureName} was performed in standard fashion with meticulous attention to hemostasis and preservation of adjacent neurovascular structures. [Expand with procedure-specific technical steps.]`,
    ``,
    `Hemostasis was confirmed at the end of the procedure. Wounds were closed in layers as appropriate.`,
  ];
}

export function entBody(c: CaseLog): string[] {
  const preamble = [
    `Description of Procedure: The risks, benefits, and alternatives were discussed with the patient and/or family, and informed consent was obtained. The patient was brought to the operating room and positioned [supine with shoulder roll and neck extension / Rose position for airway work]. After induction of general anesthesia with [orotracheal / nasotracheal] intubation, pre-incision antibiotics were administered as appropriate.`,
    ``,
    `A surgical time-out was completed. The operative site was prepped and draped in the usual sterile fashion.`,
    ``,
  ];
  const closure = [
    ``,
    `At the conclusion of the procedure, hemostasis was confirmed, sponge and instrument counts were correct, and the patient was extubated awake and transferred to recovery in stable condition with the airway intact.`,
  ];
  return [...preamble, ...entOpSteps(c), ...closure];
}
