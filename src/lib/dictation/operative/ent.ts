import type { CaseLog } from "@/lib/types";
import { includesAny } from "../shared/format";

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
