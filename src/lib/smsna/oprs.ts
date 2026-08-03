// OPRS — Operative Performance Rating System, adapted for SMSNA fellowship
// case grading. Source citation is fixed, exact-text (see OPRS_CITATION).
//
// The OPRS 5-point Likert item bank is DATA, not an EPA/CanMEDS framework —
// it is stored on the existing EpaObservation.criteriaRatings /
// entrustmentScore columns with `trainingSystem = "SMSNA"` so a reader must
// not confuse an SMSNA row's 1-5 rating with the Royal College O-Score.

import type { SmsnaCategoryKey } from "./taxonomy";

export const OPRS_CITATION =
  "Adapted from the Operative Performance Rating System (OPRS) for urology residents. J Urol 2012;188(5):1877-1882.";

export interface OprsItem {
  id: string;
  label: string;
  hint?: string;
}

/** 3-point case-difficulty scale — rated first, before any performance item. */
export const OPRS_DIFFICULTY: { value: 1 | 2 | 3; label: string; description: string }[] = [
  { value: 1, label: "Least difficult third", description: "Least difficult third of cases of this type" },
  { value: 2, label: "Average difficulty", description: "Average difficulty" },
  { value: 3, label: "Most difficult third", description: "Most difficult third of cases of this type" },
];

/**
 * 5-point OPRS performance Likert scale, used for every specific, general,
 * and overall item. Competence anchor is 3 ("Competent"), not 4 like the
 * Royal College O-Score — see `achievement` derivation in OprsObservationForm.
 */
export const OPRS_LIKERT: { value: 1 | 2 | 3 | 4 | 5; label: string; description: string; color: string }[] = [
  { value: 1, label: "Unable to perform", description: "Unable to perform / assessor took over", color: "#ef4444" },
  { value: 2, label: "Frequent guidance", description: "Frequent verbal guidance and hands-on assistance", color: "#f97316" },
  { value: 3, label: "Competent", description: "Competent, completed with minimal guidance", color: "#eab308" },
  { value: 4, label: "Smooth and independent", description: "Smooth and independent, rare prompting", color: "#22c55e" },
  { value: 5, label: "Expert", description: "Expert / exemplary", color: "#10b981" },
];

/** The 3 general items rated on every OPRS instrument, regardless of category. */
export const OPRS_GENERAL_ITEMS: OprsItem[] = [
  { id: "G1", label: "Instrument handling and respect for tissue" },
  { id: "G2", label: "Time and motion: economy and efficiency of movement" },
  { id: "G3", label: "Operative flow and forward planning: anticipates the next step, directs the team" },
];

/** The single overall item rated on every OPRS instrument. */
export const OPRS_OVERALL_ITEM: OprsItem = {
  id: "OV1",
  label: "Overall operative performance for this procedure",
};

/** Category-specific procedure item banks (4-6 items each). */
export const OPRS_ITEMS_BY_CATEGORY: Record<SmsnaCategoryKey, OprsItem[]> = {
  "penile-prosthetics": [
    { id: "PP-S1", label: "Corporal exposure and incision choice" },
    { id: "PP-S2", label: "Corporal dilation, measurement and component sizing" },
    { id: "PP-S3", label: "Reservoir / pump placement, tubing routing and connections" },
    { id: "PP-S4", label: "Infection-prevention technique (no-touch, irrigation, prophylaxis)" },
    { id: "PP-S5", label: "Correction of curvature or deformity (modeling / plication / grafting) where applicable" },
    { id: "PP-S6", label: "Closure and device cycling with final function check" },
  ],
  "male-infertility": [
    { id: "MI-S1", label: "Microsurgical set-up, microscope/loupe use and ergonomics" },
    { id: "MI-S2", label: "Identification and preservation of cord anatomy (arteries, lymphatics, vas)" },
    { id: "MI-S3", label: "Microsuture handling and patency-oriented anastomotic technique" },
    { id: "MI-S4", label: "Testicular tissue handling and sperm-retrieval technique with specimen management" },
    { id: "MI-S5", label: "Use of intraoperative adjuncts (Doppler, andrology-bench confirmation)" },
    { id: "MI-S6", label: "Atraumatic hemostasis and closure" },
  ],
  "male-reconstruction": [
    { id: "MR-S1", label: "Positioning, exposure and correct perineal/penile dissection planes" },
    { id: "MR-S2", label: "Urethral mobilization, stricture assessment and margins" },
    { id: "MR-S3", label: "Anastomosis or graft/flap harvest, inset and fixation" },
    { id: "MR-S4", label: "Device sizing, siting and tensioning (cuff / sling / balloon)" },
    { id: "MR-S5", label: "Catheter management, watertight closure and drainage decisions" },
    { id: "MR-S6", label: "Intraoperative problem-solving when anatomy deviates from plan" },
  ],
  "female-reconstruction": [
    { id: "FR-S1", label: "Positioning, exposure and vestibular/vaginal field preparation" },
    { id: "FR-S2", label: "Dissection in the correct plane with preservation of urethra and bladder" },
    { id: "FR-S3", label: "Sling/mesh or flap placement, tensioning and fixation" },
    { id: "FR-S4", label: "Cystoscopic confirmation of bladder and ureteral integrity" },
    { id: "FR-S5", label: "Fistula tract identification, excision and tension-free multilayer closure" },
    { id: "FR-S6", label: "Hemostasis and packing/drain decisions" },
  ],
  "gender-affirmation": [
    { id: "GA-S1", label: "Preoperative marking, flap design and tissue planning" },
    { id: "GA-S2", label: "Orchiectomy / penile disassembly / clitoral release with neurovascular preservation" },
    { id: "GA-S3", label: "Neovaginal canal creation or urethral lengthening" },
    { id: "GA-S4", label: "Graft or flap harvest, inset, and depth/caliber assessment" },
    { id: "GA-S5", label: "Neo-meatus and neo-scrotal/labial construction and fixation" },
    { id: "GA-S6", label: "Packing, dilator or catheter management and closure" },
  ],
  "general-office": [
    { id: "GO-S1", label: "Positioning, consent/time-out and local anesthesia technique" },
    { id: "GO-S2", label: "Endoscope or probe handling and image optimization" },
    { id: "GO-S3", label: "Energy/device selection appropriate to the tissue (laser, cautery, injectable)" },
    { id: "GO-S4", label: "Accuracy of the diagnostic manoeuvre or measurement (Doppler, sensory testing, injection site)" },
    { id: "GO-S5", label: "Recognition and management of intraprocedural findings or complications" },
    { id: "GO-S6", label: "Post-procedure instructions and documentation-ready assessment" },
  ],
};

export function getOprsInstrument(key: SmsnaCategoryKey): {
  difficulty: typeof OPRS_DIFFICULTY;
  specific: OprsItem[];
  general: OprsItem[];
  overall: OprsItem;
} {
  return {
    difficulty: OPRS_DIFFICULTY,
    specific: OPRS_ITEMS_BY_CATEGORY[key],
    general: OPRS_GENERAL_ITEMS,
    overall: OPRS_OVERALL_ITEM,
  };
}
