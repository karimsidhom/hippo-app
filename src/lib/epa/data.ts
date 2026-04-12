// ---------------------------------------------------------------------------
// EPA & Milestones Data
// Supports both ACGME (US) and Royal College CBD / CanMEDS (Canada)
// ---------------------------------------------------------------------------

// ── Interfaces ──────────────────────────────────────────────────────────────

export type TrainingSystem = "ACGME" | "RCPSC";

export interface EpaDefinition {
  id: string;
  title: string;
  description: string;
  relatedProcedures: string[];
  relatedMilestones: string[];
  targetCaseCount: number;
}

export interface MilestoneLevelDescription {
  level: number;
  description: string;
}

export interface MilestoneDefinition {
  id: string;
  domain: string;
  title: string;
  levels: MilestoneLevelDescription[];
}

export interface SpecialtyEpaData {
  specialty: string;
  system: TrainingSystem;
  epas: EpaDefinition[];
  milestones: MilestoneDefinition[];
}

// ── ACGME Surgery Milestones (16 sub-competencies) ──────────────────────────

const SURGERY_MILESTONES: MilestoneDefinition[] = [
  // Patient Care
  {
    id: "PC1",
    domain: "Patient Care",
    title: "Patient Evaluation and Decision Making",
    levels: [
      { level: 1, description: "Gathers basic history and performs focused physical exam; identifies obvious surgical conditions" },
      { level: 2, description: "Synthesizes clinical data to develop differential diagnoses; orders appropriate initial workup" },
      { level: 3, description: "Integrates complex data to formulate comprehensive management plans; recognizes indications and contraindications for surgery" },
      { level: 4, description: "Independently evaluates complex, multi-system patients; makes nuanced risk-benefit decisions incorporating patient preferences" },
      { level: 5, description: "Serves as expert consultant; teaches clinical decision-making; develops institutional protocols for patient evaluation" },
    ],
  },
  {
    id: "PC2",
    domain: "Patient Care",
    title: "Intra-Operative Patient Care - Performance of Procedures",
    levels: [
      { level: 1, description: "Identifies key anatomy; assists with basic procedural steps under close supervision" },
      { level: 2, description: "Performs portions of basic procedures with direct supervision; handles tissue appropriately" },
      { level: 3, description: "Performs standard procedures with indirect supervision; manages straightforward intraoperative events" },
      { level: 4, description: "Independently performs complex procedures; adapts technique to anatomic variants and intraoperative findings" },
      { level: 5, description: "Performs advanced and novel procedures; innovates surgical techniques; mentors others in operative management" },
    ],
  },
  {
    id: "PC3",
    domain: "Patient Care",
    title: "Intra-Operative Patient Care - Technical Skills",
    levels: [
      { level: 1, description: "Demonstrates basic instrument handling, knot tying, and tissue respect" },
      { level: 2, description: "Performs basic suturing, dissection, and hemostasis; uses laparoscopic instruments under supervision" },
      { level: 3, description: "Executes intermediate technical skills including intracorporeal suturing and vascular control" },
      { level: 4, description: "Demonstrates advanced technical proficiency with efficient tissue handling and minimal complications" },
      { level: 5, description: "Masters highly complex technical maneuvers; teaches technical skills effectively; performs at expert level consistently" },
    ],
  },
  {
    id: "PC4",
    domain: "Patient Care",
    title: "Post-Operative Patient Care",
    levels: [
      { level: 1, description: "Writes basic post-operative orders; monitors vitals and urine output" },
      { level: 2, description: "Manages routine post-operative care including pain, fluids, and diet advancement; recognizes common complications" },
      { level: 3, description: "Manages complex post-operative issues independently; initiates appropriate workup for complications" },
      { level: 4, description: "Manages critically ill post-surgical patients; makes independent decisions about reoperation and escalation" },
      { level: 5, description: "Leads quality improvement in post-operative care; develops care pathways; teaches post-operative management" },
    ],
  },

  // Medical Knowledge
  {
    id: "MK1",
    domain: "Medical Knowledge",
    title: "Pathophysiology and Treatment",
    levels: [
      { level: 1, description: "Understands basic anatomy and physiology relevant to common surgical conditions" },
      { level: 2, description: "Applies pathophysiological principles to explain common surgical diseases and their treatment" },
      { level: 3, description: "Demonstrates comprehensive knowledge of surgical diseases and evidence-based management" },
      { level: 4, description: "Integrates advanced pathophysiology with current evidence to manage complex and rare conditions" },
      { level: 5, description: "Contributes to surgical knowledge through scholarship; recognized as a knowledge resource for complex problems" },
    ],
  },
  {
    id: "MK2",
    domain: "Medical Knowledge",
    title: "Anatomy",
    levels: [
      { level: 1, description: "Identifies basic surface anatomy and major organ relationships" },
      { level: 2, description: "Describes surgical planes, key vascular structures, and nerve distributions for common procedures" },
      { level: 3, description: "Demonstrates detailed 3D anatomical knowledge; identifies critical structures intraoperatively" },
      { level: 4, description: "Applies advanced anatomical knowledge to complex operative scenarios and anatomic variants" },
      { level: 5, description: "Teaches surgical anatomy expertly; integrates radiologic and intraoperative anatomy at the highest level" },
    ],
  },

  // Systems-Based Practice
  {
    id: "SBP1",
    domain: "Systems-Based Practice",
    title: "Patient Safety and Quality Improvement",
    levels: [
      { level: 1, description: "Identifies patient safety threats in the immediate environment; uses checklists and time-outs" },
      { level: 2, description: "Reports safety events; participates in M&M conferences; follows established safety protocols" },
      { level: 3, description: "Analyzes safety events using root cause analysis; participates in quality improvement projects" },
      { level: 4, description: "Leads quality improvement initiatives; uses data to drive system-level safety improvements" },
      { level: 5, description: "Champions a culture of safety; publishes QI scholarship; serves as institutional safety leader" },
    ],
  },
  {
    id: "SBP2",
    domain: "Systems-Based Practice",
    title: "System Navigation for Patient-Centered Care",
    levels: [
      { level: 1, description: "Understands basic roles of team members; makes appropriate referrals" },
      { level: 2, description: "Coordinates care across basic transitions; utilizes available hospital resources" },
      { level: 3, description: "Navigates complex care systems; coordinates multidisciplinary care effectively" },
      { level: 4, description: "Advocates for system improvements to enhance patient outcomes and reduce disparities" },
      { level: 5, description: "Leads system redesign efforts; mentors others in system navigation; influences policy" },
    ],
  },
  {
    id: "SBP3",
    domain: "Systems-Based Practice",
    title: "Physician Role in Health Care Systems",
    levels: [
      { level: 1, description: "Recognizes cost considerations in patient care; understands basic insurance and reimbursement" },
      { level: 2, description: "Incorporates cost-effectiveness into clinical decisions; understands resource allocation" },
      { level: 3, description: "Practices cost-conscious care without compromising quality; understands value-based care" },
      { level: 4, description: "Advocates for policy changes that improve health care delivery and reduce disparities" },
      { level: 5, description: "Leads efforts to transform health care delivery; influences regional or national health policy" },
    ],
  },

  // Practice-Based Learning and Improvement
  {
    id: "PBLI1",
    domain: "Practice-Based Learning and Improvement",
    title: "Evidence-Based and Informed Practice",
    levels: [
      { level: 1, description: "Identifies knowledge gaps; uses basic resources to find clinical information" },
      { level: 2, description: "Critically appraises published literature; applies evidence to common clinical scenarios" },
      { level: 3, description: "Integrates best available evidence into clinical practice; identifies limitations of studies" },
      { level: 4, description: "Designs practice changes based on evidence; teaches EBM principles" },
      { level: 5, description: "Generates new evidence through research; contributes to practice guidelines; leads EBM education" },
    ],
  },
  {
    id: "PBLI2",
    domain: "Practice-Based Learning and Improvement",
    title: "Reflective Practice and Commitment to Personal Growth",
    levels: [
      { level: 1, description: "Accepts feedback; recognizes personal limitations" },
      { level: 2, description: "Actively seeks feedback; demonstrates improvement based on self-assessment" },
      { level: 3, description: "Systematically analyzes own performance data; develops targeted learning plans" },
      { level: 4, description: "Uses self-reflection to continuously improve; mentors others in reflective practice" },
      { level: 5, description: "Models lifelong learning; leads institutional efforts in reflective practice and professional development" },
    ],
  },

  // Professionalism
  {
    id: "PROF1",
    domain: "Professionalism",
    title: "Ethical Principles",
    levels: [
      { level: 1, description: "Demonstrates honesty and integrity; maintains patient confidentiality" },
      { level: 2, description: "Applies ethical principles to common clinical dilemmas; obtains informed consent" },
      { level: 3, description: "Navigates complex ethical situations including end-of-life care and resource allocation" },
      { level: 4, description: "Serves as a role model for ethical behavior; leads ethics discussions" },
      { level: 5, description: "Contributes to institutional ethics policy; serves on ethics committees; mentors on ethical practice" },
    ],
  },
  {
    id: "PROF2",
    domain: "Professionalism",
    title: "Professional Behavior and Accountability",
    levels: [
      { level: 1, description: "Demonstrates reliability and punctuality; accepts responsibility for own actions" },
      { level: 2, description: "Manages personal stressors; maintains composure under pressure; completes duties reliably" },
      { level: 3, description: "Balances personal and professional responsibilities; demonstrates resilience and self-awareness" },
      { level: 4, description: "Models professional behavior for the team; addresses unprofessional behavior in others" },
      { level: 5, description: "Champions professionalism at institutional level; develops programs addressing burnout and well-being" },
    ],
  },
  {
    id: "PROF3",
    domain: "Professionalism",
    title: "Administrative Tasks",
    levels: [
      { level: 1, description: "Completes required documentation in a timely manner" },
      { level: 2, description: "Manages patient records, operative reports, and discharge summaries efficiently" },
      { level: 3, description: "Handles coding, billing documentation, and administrative duties independently" },
      { level: 4, description: "Manages complex administrative responsibilities; leads scheduling and workflow optimization" },
      { level: 5, description: "Develops administrative systems and protocols; mentors others in practice management" },
    ],
  },

  // Interpersonal and Communication Skills
  {
    id: "ICS1",
    domain: "Interpersonal and Communication Skills",
    title: "Patient- and Family-Centered Communication",
    levels: [
      { level: 1, description: "Communicates basic clinical information to patients and families with empathy" },
      { level: 2, description: "Conducts informed consent discussions; delivers straightforward news sensitively" },
      { level: 3, description: "Navigates difficult conversations including bad news, goals of care, and complications" },
      { level: 4, description: "Excels at shared decision-making with complex patients; adapts communication to diverse populations" },
      { level: 5, description: "Teaches communication skills; develops institutional approaches to patient-centered communication" },
    ],
  },
  {
    id: "ICS2",
    domain: "Interpersonal and Communication Skills",
    title: "Interprofessional and Team Communication",
    levels: [
      { level: 1, description: "Communicates clearly in handoffs and with team members; uses SBAR format" },
      { level: 2, description: "Provides effective intraoperative communication; gives clear orders and sign-outs" },
      { level: 3, description: "Leads team communication in complex situations; manages conflict constructively" },
      { level: 4, description: "Facilitates multidisciplinary collaboration; mentors team communication skills" },
      { level: 5, description: "Designs and implements team communication systems; leads interprofessional education efforts" },
    ],
  },
];

// ── General Surgery EPAs ────────────────────────────────────────────────────

const GENERAL_SURGERY_EPAS: EpaDefinition[] = [
  {
    id: "EPA1",
    title: "RLQ Pain / Appendicitis",
    description: "Evaluate and manage patients presenting with right lower quadrant pain, including diagnosis and operative management of appendicitis.",
    relatedProcedures: [
      "appendectomy",
      "appendicitis",
      "lap appy",
      "open appy",
      "laparoscopic appendectomy",
      "open appendectomy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 30,
  },
  {
    id: "EPA2",
    title: "Benign or Malignant Breast Disease",
    description: "Evaluate and manage patients with benign and malignant breast conditions, including operative and non-operative approaches.",
    relatedProcedures: [
      "lumpectomy",
      "mastectomy",
      "breast",
      "sentinel lymph node biopsy",
      "axillary lymph node dissection",
      "wide local excision",
      "slnb",
      "alnd",
      "partial mastectomy",
      "skin-sparing mastectomy",
      "nipple-sparing mastectomy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "ICS1"],
    targetCaseCount: 25,
  },
  {
    id: "EPA3",
    title: "Benign or Malignant Colon Disease",
    description: "Evaluate and manage patients with benign and malignant diseases of the colon, including operative resection and diversion.",
    relatedProcedures: [
      "colectomy",
      "hemicolectomy",
      "right hemicolectomy",
      "left hemicolectomy",
      "sigmoid colectomy",
      "total colectomy",
      "anterior resection",
      "abdominoperineal resection",
      "hartmann",
      "colostomy",
      "ileostomy",
      "stoma reversal",
      "colon",
      "colostomy formation",
      "ileostomy formation",
      "apr",
      "low anterior resection",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2", "SBP1"],
    targetCaseCount: 30,
  },
  {
    id: "EPA4",
    title: "Gallbladder Disease",
    description: "Evaluate and manage patients with gallbladder pathology, including acute and chronic cholecystitis and choledocholithiasis.",
    relatedProcedures: [
      "cholecystectomy",
      "gallbladder",
      "lap chole",
      "open chole",
      "laparoscopic cholecystectomy",
      "open cholecystectomy",
      "common bile duct exploration",
      "cbde",
      "ercp",
      "choledochoduodenostomy",
      "cholecystojejunostomy",
      "biliary",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 50,
  },
  {
    id: "EPA5",
    title: "Inguinal Hernia",
    description: "Evaluate and manage patients with inguinal hernias, including open and laparoscopic approaches.",
    relatedProcedures: [
      "inguinal hernia",
      "herniorrhaphy",
      "lichtenstein",
      "tep",
      "tapp",
      "totally extraperitoneal",
      "transabdominal preperitoneal",
      "femoral hernia",
      "open inguinal hernia repair",
      "laparoscopic tep",
      "laparoscopic tapp",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 35,
  },
  {
    id: "EPA6",
    title: "Abdominal Wall Hernia",
    description: "Evaluate and manage patients with ventral, incisional, umbilical, and other abdominal wall hernias.",
    relatedProcedures: [
      "ventral hernia",
      "incisional hernia",
      "umbilical hernia",
      "parastomal hernia",
      "abdominal wall hernia",
      "hernia repair",
      "vhr",
      "open ventral hernia repair",
      "laparoscopic ventral hernia repair",
      "robotic ventral hernia repair",
      "robotic hernia",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 25,
  },
  {
    id: "EPA7",
    title: "Acute Abdomen",
    description: "Evaluate and manage patients presenting with acute abdominal conditions requiring urgent or emergent intervention.",
    relatedProcedures: [
      "exploratory laparotomy",
      "ex lap",
      "damage control",
      "perforated",
      "peritoneal washout",
      "peritoneal lavage",
      "acute abdomen",
      "perforated viscus",
      "damage control laparotomy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2", "ICS2"],
    targetCaseCount: 20,
  },
  {
    id: "EPA8",
    title: "Benign Anorectal Disease",
    description: "Evaluate and manage patients with benign anorectal conditions including hemorrhoids, fissures, fistulae, and abscesses.",
    relatedProcedures: [
      "hemorrhoid",
      "hemorrhoidectomy",
      "fissure",
      "sphincterotomy",
      "fistulotomy",
      "fistula",
      "seton",
      "anorectal",
      "perirectal abscess",
      "perianal abscess",
      "pilonidal",
      "lateral internal sphincterotomy",
      "lift procedure",
      "stapled hemorrhoidopexy",
      "abscess drainage",
      "i&d",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1"],
    targetCaseCount: 20,
  },
  {
    id: "EPA9",
    title: "Small Bowel Obstruction",
    description: "Evaluate and manage patients with small bowel obstruction, including non-operative and operative management.",
    relatedProcedures: [
      "small bowel resection",
      "adhesiolysis",
      "lysis of adhesions",
      "bowel obstruction",
      "small bowel",
      "sbr",
      "bowel resection",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1"],
    targetCaseCount: 20,
  },
  {
    id: "EPA10",
    title: "Thyroid and Parathyroid Disease",
    description: "Evaluate and manage patients with thyroid and parathyroid diseases, including operative intervention.",
    relatedProcedures: [
      "thyroidectomy",
      "hemithyroidectomy",
      "thyroid",
      "parathyroidectomy",
      "parathyroid",
      "thyroid lobectomy",
      "total thyroidectomy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 15,
  },
  {
    id: "EPA11",
    title: "Dialysis Access",
    description: "Evaluate and manage patients requiring vascular access for hemodialysis, including creation and management of AV fistulae and grafts.",
    relatedProcedures: [
      "av fistula",
      "av graft",
      "dialysis",
      "avf",
      "avg",
      "brescia-cimino",
      "brachiocephalic fistula",
      "radiocephalic fistula",
      "ptfe graft",
      "central venous catheter",
      "cvc",
      "port-a-cath",
      "port insertion",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1"],
    targetCaseCount: 15,
  },
  {
    id: "EPA12",
    title: "Soft Tissue Infection",
    description: "Evaluate and manage patients with skin and soft tissue infections requiring surgical intervention.",
    relatedProcedures: [
      "abscess",
      "i&d",
      "incision and drainage",
      "necrotizing fasciitis",
      "debridement",
      "wound",
      "soft tissue infection",
      "abscess drainage",
      "cellulitis",
    ],
    relatedMilestones: ["PC1", "PC2", "PC4", "MK1", "SBP1"],
    targetCaseCount: 15,
  },
  {
    id: "EPA13",
    title: "Cutaneous and Subcutaneous Neoplasms",
    description: "Evaluate and manage patients with skin and subcutaneous tumors, including excision and sentinel lymph node biopsy.",
    relatedProcedures: [
      "skin lesion excision",
      "lesion removal",
      "skin excision",
      "lipoma",
      "melanoma",
      "wide local excision",
      "wle",
      "cutaneous",
      "subcutaneous",
      "neoplasm",
      "sentinel lymph node biopsy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1"],
    targetCaseCount: 15,
  },
  {
    id: "EPA14",
    title: "Severe Acute or Necrotizing Pancreatitis",
    description: "Evaluate and manage patients with severe acute pancreatitis and necrotizing pancreatitis, including operative debridement when needed.",
    relatedProcedures: [
      "pancreatitis",
      "pancreatic",
      "necrosectomy",
      "whipple",
      "pancreaticoduodenectomy",
      "distal pancreatectomy",
      "pancreatic debridement",
      "pancreatic drainage",
    ],
    relatedMilestones: ["PC1", "PC2", "PC4", "MK1", "SBP2", "ICS2"],
    targetCaseCount: 10,
  },
  {
    id: "EPA15",
    title: "Perioperative Care of the Critically Ill Surgery Patient",
    description: "Manage critically ill surgical patients in the perioperative period, including ICU management and multisystem support.",
    relatedProcedures: [
      "central venous catheter",
      "cvc",
      "central line",
      "exploratory laparotomy",
      "damage control",
      "tracheostomy",
      "chest tube",
    ],
    relatedMilestones: ["PC1", "PC4", "MK1", "SBP1", "SBP2", "ICS2", "PROF2"],
    targetCaseCount: 20,
  },
  {
    id: "EPA16",
    title: "Flexible GI Endoscopy",
    description: "Perform and interpret flexible upper and lower GI endoscopy, including EGD and colonoscopy.",
    relatedProcedures: [
      "endoscopy",
      "colonoscopy",
      "egd",
      "esophagogastroduodenoscopy",
      "upper endoscopy",
      "flexible endoscopy",
      "peg tube",
      "percutaneous endoscopic gastrostomy",
      "ercp",
      "poem",
      "endoscopic",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 35,
  },
  {
    id: "EPA17",
    title: "Evaluation / Initial Management of a Trauma Patient",
    description: "Systematically evaluate and manage trauma patients using ATLS principles, including primary and secondary survey.",
    relatedProcedures: [
      "trauma",
      "exploratory laparotomy",
      "damage control",
      "ex lap",
      "chest tube",
      "thoracotomy",
      "splenectomy",
      "liver resection",
      "peritoneal washout",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2", "ICS2", "PROF2"],
    targetCaseCount: 25,
  },
  {
    id: "EPA18",
    title: "Provide General Surgery Consultation",
    description: "Provide timely, thorough surgical consultation for inpatients and ED patients, including assessment and management recommendations.",
    relatedProcedures: [
      "consultation",
      "consult",
      "exploratory laparotomy",
      "appendectomy",
      "cholecystectomy",
      "abscess",
      "small bowel obstruction",
    ],
    relatedMilestones: ["PC1", "MK1", "ICS1", "ICS2", "PROF1", "PROF2"],
    targetCaseCount: 40,
  },
];

// ── Royal College CBD / CanMEDS Milestones ─────────────────────────────────
// CanMEDS Framework: 7 roles used across ALL Royal College specialties.
// Each role maps to competencies assessed through EPAs.

const CANMEDS_MILESTONES: MilestoneDefinition[] = [
  {
    id: "ME",
    domain: "CanMEDS",
    title: "Medical Expert",
    levels: [
      { level: 1, description: "Demonstrates foundational clinical knowledge; performs assessments under close supervision" },
      { level: 2, description: "Applies clinical reasoning to common presentations; formulates basic management plans" },
      { level: 3, description: "Integrates clinical findings to manage complex patients; performs procedures with indirect supervision" },
      { level: 4, description: "Independently manages complex clinical scenarios; adapts plans to patient-specific factors" },
      { level: 5, description: "Practices at consultant level; provides expert opinions; mentors trainees in clinical excellence" },
    ],
  },
  {
    id: "COM",
    domain: "CanMEDS",
    title: "Communicator",
    levels: [
      { level: 1, description: "Establishes rapport; gathers focused history with empathy and active listening" },
      { level: 2, description: "Shares information clearly with patients; documents clinical encounters accurately" },
      { level: 3, description: "Navigates difficult conversations; obtains informed consent for complex procedures" },
      { level: 4, description: "Adapts communication to diverse populations; resolves conflict effectively" },
      { level: 5, description: "Models expert communication; teaches and designs communication curricula" },
    ],
  },
  {
    id: "COL",
    domain: "CanMEDS",
    title: "Collaborator",
    levels: [
      { level: 1, description: "Participates effectively as a member of the health care team" },
      { level: 2, description: "Performs safe handovers; respects roles and responsibilities of team members" },
      { level: 3, description: "Leads interprofessional teams in routine clinical settings" },
      { level: 4, description: "Manages team conflict constructively; coordinates complex multidisciplinary care" },
      { level: 5, description: "Champions collaborative practice; designs interprofessional care models" },
    ],
  },
  {
    id: "L",
    domain: "CanMEDS",
    title: "Leader",
    levels: [
      { level: 1, description: "Manages time and prioritizes tasks; uses resources responsibly" },
      { level: 2, description: "Contributes to quality improvement activities; manages personal practice efficiently" },
      { level: 3, description: "Leads QI initiatives; advocates for safe and effective patient care systems" },
      { level: 4, description: "Drives system-level improvements; manages complex administrative responsibilities" },
      { level: 5, description: "Shapes health care policy; leads organizational change; mentors emerging leaders" },
    ],
  },
  {
    id: "HA",
    domain: "CanMEDS",
    title: "Health Advocate",
    levels: [
      { level: 1, description: "Identifies health needs of individual patients including social determinants" },
      { level: 2, description: "Advocates for individual patient needs within the health care system" },
      { level: 3, description: "Promotes health of patient populations; identifies systemic barriers to care" },
      { level: 4, description: "Engages in community-level advocacy; addresses health inequities" },
      { level: 5, description: "Leads advocacy efforts at institutional or policy level; champions health equity" },
    ],
  },
  {
    id: "S",
    domain: "CanMEDS",
    title: "Scholar",
    levels: [
      { level: 1, description: "Identifies learning needs; engages in self-directed learning" },
      { level: 2, description: "Critically appraises evidence; applies best practices to clinical care" },
      { level: 3, description: "Teaches effectively; contributes to scholarly activity; integrates evidence into practice" },
      { level: 4, description: "Leads educational activities; designs and conducts research" },
      { level: 5, description: "Advances the discipline through scholarship; mentors emerging scholars" },
    ],
  },
  {
    id: "P",
    domain: "CanMEDS",
    title: "Professional",
    levels: [
      { level: 1, description: "Demonstrates ethical behavior, honesty, and integrity; recognizes limits of competence" },
      { level: 2, description: "Manages personal health and well-being; fulfills regulatory requirements" },
      { level: 3, description: "Responds to ethical challenges; demonstrates accountability and reflective practice" },
      { level: 4, description: "Models professional behavior; addresses unprofessionalism; promotes physician wellness" },
      { level: 5, description: "Champions professional standards at institutional level; contributes to profession governance" },
    ],
  },
];

// ── Royal College General Surgery EPAs (CBD stages: Foundations → Core → Transition to Practice) ──

const RCPSC_GENERAL_SURGERY_EPAS: EpaDefinition[] = [
  // Foundations of Discipline (FOD)
  {
    id: "FOD1",
    title: "Assessing and managing acute undifferentiated general surgery patients",
    description: "Perform initial assessment and management of undifferentiated general surgery patients in the emergency department.",
    relatedProcedures: ["appendectomy", "cholecystectomy", "abscess", "bowel obstruction", "hernia", "trauma", "acute abdomen"],
    relatedMilestones: ["ME", "COM", "COL"],
    targetCaseCount: 25,
  },
  {
    id: "FOD2",
    title: "Performing basic laparoscopic procedures",
    description: "Perform basic laparoscopic procedures including diagnostic laparoscopy and laparoscopic cholecystectomy.",
    relatedProcedures: ["cholecystectomy", "lap chole", "laparoscopic cholecystectomy", "diagnostic laparoscopy", "laparoscopic appendectomy"],
    relatedMilestones: ["ME", "P"],
    targetCaseCount: 40,
  },
  {
    id: "FOD3",
    title: "Managing wounds and performing basic skin procedures",
    description: "Manage simple and complex wounds, perform skin lesion excisions and basic soft tissue procedures.",
    relatedProcedures: ["wound", "debridement", "skin lesion excision", "lipoma", "abscess", "i&d", "incision and drainage"],
    relatedMilestones: ["ME", "COM"],
    targetCaseCount: 20,
  },
  {
    id: "FOD4",
    title: "Providing perioperative care",
    description: "Manage patients in the pre-operative, intra-operative, and post-operative periods.",
    relatedProcedures: ["appendectomy", "cholecystectomy", "hernia repair", "colectomy", "small bowel resection"],
    relatedMilestones: ["ME", "COL", "L"],
    targetCaseCount: 30,
  },

  // Core of Discipline (COD)
  {
    id: "COD1",
    title: "Managing patients with diseases of the foregut",
    description: "Assess, investigate, and manage patients with esophageal, gastric, and duodenal pathology.",
    relatedProcedures: ["endoscopy", "egd", "fundoplication", "nissen", "gastrectomy", "gastric", "ulcer", "peg tube", "hiatal hernia"],
    relatedMilestones: ["ME", "COM", "S"],
    targetCaseCount: 20,
  },
  {
    id: "COD2",
    title: "Managing patients with hepatobiliary and pancreatic disease",
    description: "Assess and manage patients with diseases of the liver, biliary tract, and pancreas.",
    relatedProcedures: ["cholecystectomy", "whipple", "pancreaticoduodenectomy", "distal pancreatectomy", "liver resection", "hepatectomy", "biliary", "ercp", "common bile duct exploration"],
    relatedMilestones: ["ME", "S", "L"],
    targetCaseCount: 20,
  },
  {
    id: "COD3",
    title: "Managing patients with colorectal disease",
    description: "Assess and manage patients with benign and malignant diseases of the colon and rectum.",
    relatedProcedures: ["colectomy", "hemicolectomy", "right hemicolectomy", "left hemicolectomy", "sigmoid colectomy", "anterior resection", "low anterior resection", "abdominoperineal resection", "colostomy", "ileostomy", "colonoscopy", "hartmann"],
    relatedMilestones: ["ME", "COM", "HA"],
    targetCaseCount: 30,
  },
  {
    id: "COD4",
    title: "Managing patients with breast disease",
    description: "Assess and manage patients with benign and malignant breast conditions.",
    relatedProcedures: ["lumpectomy", "mastectomy", "breast", "sentinel lymph node biopsy", "axillary lymph node dissection", "slnb", "partial mastectomy", "wide local excision"],
    relatedMilestones: ["ME", "COM", "P"],
    targetCaseCount: 20,
  },
  {
    id: "COD5",
    title: "Managing patients with endocrine surgical disease",
    description: "Assess and manage patients with thyroid, parathyroid, and adrenal pathology.",
    relatedProcedures: ["thyroidectomy", "hemithyroidectomy", "parathyroidectomy", "thyroid", "parathyroid", "adrenalectomy", "thyroid lobectomy", "total thyroidectomy"],
    relatedMilestones: ["ME", "S"],
    targetCaseCount: 15,
  },
  {
    id: "COD6",
    title: "Managing patients with abdominal wall hernias",
    description: "Assess and manage patients with inguinal, ventral, incisional, and complex abdominal wall hernias.",
    relatedProcedures: ["inguinal hernia", "ventral hernia", "incisional hernia", "umbilical hernia", "hernia repair", "tep", "tapp", "lichtenstein", "laparoscopic hernia", "robotic hernia"],
    relatedMilestones: ["ME", "L"],
    targetCaseCount: 35,
  },
  {
    id: "COD7",
    title: "Managing the trauma patient",
    description: "Lead the initial assessment, resuscitation, and definitive management of injured patients.",
    relatedProcedures: ["trauma", "exploratory laparotomy", "ex lap", "damage control", "chest tube", "thoracotomy", "splenectomy", "liver resection", "peritoneal washout"],
    relatedMilestones: ["ME", "COL", "L", "COM"],
    targetCaseCount: 25,
  },
  {
    id: "COD8",
    title: "Managing the critically ill surgical patient",
    description: "Manage critically ill surgical patients in the ICU including resuscitation, organ support, and complex decision-making.",
    relatedProcedures: ["central venous catheter", "cvc", "central line", "tracheostomy", "chest tube", "damage control", "exploratory laparotomy"],
    relatedMilestones: ["ME", "COL", "COM", "P"],
    targetCaseCount: 20,
  },
  {
    id: "COD9",
    title: "Performing flexible and rigid endoscopy",
    description: "Perform diagnostic and therapeutic upper and lower GI endoscopy.",
    relatedProcedures: ["endoscopy", "colonoscopy", "egd", "esophagogastroduodenoscopy", "upper endoscopy", "flexible endoscopy", "peg tube", "ercp", "endoscopic"],
    relatedMilestones: ["ME", "S"],
    targetCaseCount: 35,
  },
  {
    id: "COD10",
    title: "Managing patients with anorectal disease",
    description: "Assess and manage patients with benign and malignant anorectal conditions.",
    relatedProcedures: ["hemorrhoid", "hemorrhoidectomy", "fissure", "sphincterotomy", "fistulotomy", "fistula", "seton", "anorectal", "perirectal abscess", "pilonidal"],
    relatedMilestones: ["ME", "COM"],
    targetCaseCount: 15,
  },

  // Transition to Practice (TTP)
  {
    id: "TTP1",
    title: "Providing comprehensive longitudinal surgical care",
    description: "Independently manage a panel of surgical patients from consultation through follow-up, integrating all CanMEDS roles.",
    relatedProcedures: ["cholecystectomy", "colectomy", "hernia repair", "thyroidectomy", "mastectomy", "appendectomy"],
    relatedMilestones: ["ME", "COM", "COL", "L", "HA", "S", "P"],
    targetCaseCount: 30,
  },
  {
    id: "TTP2",
    title: "Managing a surgical practice",
    description: "Demonstrate readiness for independent practice including OR scheduling, team leadership, and administrative responsibilities.",
    relatedProcedures: ["cholecystectomy", "colectomy", "hernia repair", "appendectomy", "breast", "thyroidectomy"],
    relatedMilestones: ["L", "P", "COM", "COL"],
    targetCaseCount: 20,
  },
];

export const GENERAL_SURGERY_ACGME: SpecialtyEpaData = {
  specialty: "General Surgery",
  system: "ACGME",
  epas: GENERAL_SURGERY_EPAS,
  milestones: SURGERY_MILESTONES,
};

export const GENERAL_SURGERY_RCPSC: SpecialtyEpaData = {
  specialty: "General Surgery",
  system: "RCPSC",
  epas: RCPSC_GENERAL_SURGERY_EPAS,
  milestones: CANMEDS_MILESTONES,
};

// ── ACGME Urology Milestones ──────────────────────────────────────────────

const UROLOGY_MILESTONES: MilestoneDefinition[] = [
  {
    id: "PC1",
    domain: "Patient Care",
    title: "Urologic Patient Evaluation",
    levels: [
      { level: 1, description: "Gathers urologic history; performs focused GU exam under supervision" },
      { level: 2, description: "Synthesizes findings for common urologic conditions; orders appropriate workup" },
      { level: 3, description: "Independently evaluates complex urologic patients; integrates imaging and labs" },
      { level: 4, description: "Manages multi-system urologic patients; makes nuanced surgical decisions" },
      { level: 5, description: "Expert consultant for complex urologic cases; develops evaluation protocols" },
    ],
  },
  {
    id: "PC2",
    domain: "Patient Care",
    title: "Endoscopic Procedures",
    levels: [
      { level: 1, description: "Assists with cystoscopy; identifies basic bladder anatomy" },
      { level: 2, description: "Performs diagnostic cystoscopy; assists with ureteroscopy and TURBT" },
      { level: 3, description: "Independently performs cystoscopy, TURBT, ureteroscopy, and stent placement" },
      { level: 4, description: "Manages complex endoscopic cases including large tumors and difficult anatomy" },
      { level: 5, description: "Performs advanced endoscopy; innovates techniques; teaches endoscopic skills" },
    ],
  },
  {
    id: "PC3",
    domain: "Patient Care",
    title: "Open and Laparoscopic/Robotic Surgery",
    levels: [
      { level: 1, description: "Demonstrates basic surgical skills; assists with open and robotic procedures" },
      { level: 2, description: "Performs portions of straightforward procedures; handles tissue appropriately" },
      { level: 3, description: "Performs standard urologic procedures with indirect supervision" },
      { level: 4, description: "Independently performs complex open, laparoscopic, and robotic procedures" },
      { level: 5, description: "Masters advanced reconstructive and oncologic procedures; innovates approaches" },
    ],
  },
  {
    id: "PC4",
    domain: "Patient Care",
    title: "Perioperative and Emergent Care",
    levels: [
      { level: 1, description: "Writes post-op orders; recognizes common urologic emergencies" },
      { level: 2, description: "Manages routine post-op care; initiates management of urologic emergencies" },
      { level: 3, description: "Independently manages post-operative complications and urologic emergencies" },
      { level: 4, description: "Manages complex perioperative patients; makes independent re-intervention decisions" },
      { level: 5, description: "Leads QI in perioperative care; develops emergency management protocols" },
    ],
  },
  {
    id: "MK1",
    domain: "Medical Knowledge",
    title: "Urologic Knowledge",
    levels: [
      { level: 1, description: "Understands basic GU anatomy, physiology, and common urologic conditions" },
      { level: 2, description: "Applies urologic pathophysiology to clinical management of common conditions" },
      { level: 3, description: "Comprehensive knowledge of urologic diseases and evidence-based treatments" },
      { level: 4, description: "Integrates advanced knowledge for complex and rare urologic conditions" },
      { level: 5, description: "Contributes to urologic knowledge; recognized as expert resource" },
    ],
  },
  {
    id: "MK2",
    domain: "Medical Knowledge",
    title: "Urologic Anatomy and Imaging",
    levels: [
      { level: 1, description: "Identifies basic GU anatomy on imaging and in the OR" },
      { level: 2, description: "Interprets common urologic imaging; identifies key surgical anatomy" },
      { level: 3, description: "Advanced imaging interpretation; applies 3D anatomy to surgical planning" },
      { level: 4, description: "Expert anatomical knowledge for complex reconstruction and oncologic surgery" },
      { level: 5, description: "Teaches surgical anatomy; integrates advanced imaging into surgical innovation" },
    ],
  },
  {
    id: "SBP1",
    domain: "Systems-Based Practice",
    title: "Patient Safety and Quality Improvement",
    levels: [
      { level: 1, description: "Identifies safety threats; uses surgical checklists and time-outs" },
      { level: 2, description: "Reports safety events; participates in M&M; follows safety protocols" },
      { level: 3, description: "Analyzes safety events; participates in QI projects" },
      { level: 4, description: "Leads QI initiatives; uses data to drive safety improvements" },
      { level: 5, description: "Champions safety culture; publishes QI scholarship" },
    ],
  },
  {
    id: "PBLI1",
    domain: "Practice-Based Learning and Improvement",
    title: "Evidence-Based Practice",
    levels: [
      { level: 1, description: "Identifies knowledge gaps; uses resources to find clinical information" },
      { level: 2, description: "Critically appraises urologic literature; applies evidence to clinical care" },
      { level: 3, description: "Integrates evidence into practice; identifies study limitations" },
      { level: 4, description: "Designs practice changes based on evidence; teaches EBM" },
      { level: 5, description: "Generates new evidence; contributes to urologic guidelines" },
    ],
  },
  {
    id: "PROF1",
    domain: "Professionalism",
    title: "Professional Behavior",
    levels: [
      { level: 1, description: "Demonstrates honesty, integrity, and reliability" },
      { level: 2, description: "Manages stress; maintains composure; completes duties reliably" },
      { level: 3, description: "Balances responsibilities; demonstrates resilience and self-awareness" },
      { level: 4, description: "Models professional behavior; addresses unprofessionalism" },
      { level: 5, description: "Champions professionalism; develops wellness programs" },
    ],
  },
  {
    id: "ICS1",
    domain: "Interpersonal and Communication Skills",
    title: "Patient Communication",
    levels: [
      { level: 1, description: "Communicates basic clinical information with empathy" },
      { level: 2, description: "Conducts informed consent; discusses treatment options clearly" },
      { level: 3, description: "Navigates difficult conversations including cancer diagnosis and prognosis" },
      { level: 4, description: "Excels at shared decision-making for complex urologic conditions" },
      { level: 5, description: "Teaches communication skills; develops patient education programs" },
    ],
  },
  {
    id: "ICS2",
    domain: "Interpersonal and Communication Skills",
    title: "Team Communication",
    levels: [
      { level: 1, description: "Communicates clearly in handoffs; uses structured formats" },
      { level: 2, description: "Effective intraoperative communication; clear orders" },
      { level: 3, description: "Leads team communication in complex situations" },
      { level: 4, description: "Facilitates multidisciplinary tumor board and team collaboration" },
      { level: 5, description: "Designs team communication systems; leads interprofessional education" },
    ],
  },
];

// ── ACGME Urology EPAs ────────────────────────────────────────────────────

const UROLOGY_EPAS: EpaDefinition[] = [
  {
    id: "EPA1",
    title: "Kidney Stone Disease",
    description: "Evaluate and manage patients with urolithiasis including medical and surgical management.",
    relatedProcedures: [
      "ureteroscopy", "urs", "laser lithotripsy", "pcnl", "percutaneous nephrolithotomy",
      "stent placement", "ureteral stent", "eswl", "shockwave lithotripsy",
      "stone", "nephrolithiasis", "urolithiasis", "stone extraction",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 50,
  },
  {
    id: "EPA2",
    title: "Bladder Cancer / TURBT",
    description: "Evaluate and manage patients with bladder cancer including transurethral resection.",
    relatedProcedures: [
      "turbt", "transurethral resection", "bladder tumor", "bladder cancer",
      "cystoscopy", "blue light cystoscopy", "bcg", "intravesical",
      "radical cystectomy", "cystectomy", "ileal conduit", "neobladder",
    ],
    relatedMilestones: ["PC1", "PC2", "PC4", "MK1", "ICS1"],
    targetCaseCount: 40,
  },
  {
    id: "EPA3",
    title: "Prostate Cancer",
    description: "Evaluate and manage patients with prostate cancer including biopsy, radical prostatectomy, and active surveillance.",
    relatedProcedures: [
      "prostatectomy", "radical prostatectomy", "robotic prostatectomy", "rarp",
      "prostate biopsy", "transrectal biopsy", "transperineal biopsy",
      "prostate", "mri fusion biopsy",
    ],
    relatedMilestones: ["PC1", "PC3", "MK1", "MK2", "ICS1"],
    targetCaseCount: 30,
  },
  {
    id: "EPA4",
    title: "Kidney Cancer",
    description: "Evaluate and manage patients with renal masses including partial and radical nephrectomy.",
    relatedProcedures: [
      "nephrectomy", "partial nephrectomy", "radical nephrectomy",
      "robotic partial nephrectomy", "renal mass", "kidney cancer",
      "renal cell carcinoma", "cryoablation", "renal biopsy",
    ],
    relatedMilestones: ["PC1", "PC3", "MK1", "MK2"],
    targetCaseCount: 25,
  },
  {
    id: "EPA5",
    title: "BPH / LUTS Management",
    description: "Evaluate and manage patients with benign prostatic hyperplasia and lower urinary tract symptoms.",
    relatedProcedures: [
      "turp", "transurethral resection of prostate", "holep", "rezum",
      "urolift", "greenlight laser", "pvp", "simple prostatectomy",
      "aquablation", "bph", "prostate", "bladder outlet obstruction",
    ],
    relatedMilestones: ["PC1", "PC2", "MK1", "ICS1"],
    targetCaseCount: 35,
  },
  {
    id: "EPA6",
    title: "Female Pelvic Medicine / Incontinence",
    description: "Evaluate and manage female urinary incontinence and pelvic organ prolapse.",
    relatedProcedures: [
      "sling", "mid-urethral sling", "pubovaginal sling", "burch",
      "incontinence", "prolapse", "sacrocolpopexy", "cystocele",
      "urodynamics", "botox bladder", "interstim", "sacral neuromodulation",
    ],
    relatedMilestones: ["PC1", "PC3", "MK1", "ICS1"],
    targetCaseCount: 20,
  },
  {
    id: "EPA7",
    title: "Male Voiding Dysfunction",
    description: "Evaluate and manage male voiding dysfunction including neurogenic bladder and urethral stricture.",
    relatedProcedures: [
      "urethroplasty", "urethral stricture", "dviu", "direct vision internal urethrotomy",
      "suprapubic catheter", "spc", "intermittent catheterization",
      "artificial urinary sphincter", "aus", "male sling",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1"],
    targetCaseCount: 20,
  },
  {
    id: "EPA8",
    title: "Testicular / Scrotal Pathology",
    description: "Evaluate and manage testicular and scrotal conditions including torsion, masses, and hydroceles.",
    relatedProcedures: [
      "orchiectomy", "orchiopexy", "hydrocelectomy", "hydrocele",
      "varicocelectomy", "varicocele", "spermatocelectomy", "testicular torsion",
      "scrotal exploration", "testicular cancer", "testis", "inguinal orchiectomy",
    ],
    relatedMilestones: ["PC1", "PC3", "PC4", "MK1"],
    targetCaseCount: 25,
  },
  {
    id: "EPA9",
    title: "Adrenal Surgery",
    description: "Evaluate and manage adrenal pathology requiring surgical intervention.",
    relatedProcedures: [
      "adrenalectomy", "robotic adrenalectomy", "laparoscopic adrenalectomy",
      "adrenal", "pheochromocytoma", "adrenal mass",
    ],
    relatedMilestones: ["PC1", "PC3", "MK1", "MK2"],
    targetCaseCount: 10,
  },
  {
    id: "EPA10",
    title: "Pediatric Urology",
    description: "Evaluate and manage common pediatric urologic conditions.",
    relatedProcedures: [
      "circumcision", "hypospadias", "orchiopexy", "ureteral reimplant",
      "pyeloplasty", "vesicoureteral reflux", "vur", "pediatric",
    ],
    relatedMilestones: ["PC1", "PC3", "MK1", "ICS1"],
    targetCaseCount: 20,
  },
  {
    id: "EPA11",
    title: "Upper Tract Urothelial Carcinoma",
    description: "Evaluate and manage upper tract urothelial carcinoma including nephroureterectomy.",
    relatedProcedures: [
      "nephroureterectomy", "upper tract", "ureteral cancer",
      "renal pelvis", "diagnostic ureteroscopy", "utuc",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 10,
  },
  {
    id: "EPA12",
    title: "Urologic Trauma and Emergencies",
    description: "Evaluate and manage urologic trauma and emergencies including renal, ureteral, and bladder injuries.",
    relatedProcedures: [
      "trauma", "renal trauma", "bladder repair", "ureteral repair",
      "urethral injury", "penile fracture", "priapism",
      "testicular torsion", "fournier", "necrotizing fasciitis",
    ],
    relatedMilestones: ["PC1", "PC3", "PC4", "MK1", "ICS2"],
    targetCaseCount: 15,
  },
  {
    id: "EPA13",
    title: "Urinary Diversion and Reconstruction",
    description: "Perform complex urinary reconstruction and diversion procedures.",
    relatedProcedures: [
      "ileal conduit", "neobladder", "continent diversion", "indiana pouch",
      "ureteral reimplant", "augmentation cystoplasty", "mitrofanoff",
      "urinary diversion", "reconstruction",
    ],
    relatedMilestones: ["PC3", "MK1", "MK2"],
    targetCaseCount: 15,
  },
  {
    id: "EPA14",
    title: "Male Infertility and Andrology",
    description: "Evaluate and manage male infertility and andrologic conditions.",
    relatedProcedures: [
      "vasectomy", "vasectomy reversal", "vasovasostomy", "varicocelectomy",
      "micro-tese", "tese", "sperm extraction", "penile prosthesis",
      "inflatable penile prosthesis", "ipp",
    ],
    relatedMilestones: ["PC1", "PC3", "MK1", "ICS1"],
    targetCaseCount: 15,
  },
  {
    id: "EPA15",
    title: "Office-Based Urology",
    description: "Perform office-based urologic procedures and evaluations.",
    relatedProcedures: [
      "cystoscopy", "urodynamics", "prostate biopsy",
      "vasectomy", "circumcision", "catheter", "suprapubic catheter",
    ],
    relatedMilestones: ["PC1", "PC2", "MK1", "ICS1", "SBP1"],
    targetCaseCount: 40,
  },
];

export const UROLOGY_ACGME: SpecialtyEpaData = {
  specialty: "Urology",
  system: "ACGME",
  epas: UROLOGY_EPAS,
  milestones: UROLOGY_MILESTONES,
};

// ── Royal College Urology EPAs ────────────────────────────────────────────

const RCPSC_UROLOGY_EPAS: EpaDefinition[] = [
  // Foundations of Discipline
  {
    id: "FOD1",
    title: "Assessing acute urologic patients",
    description: "Perform initial assessment and management of undifferentiated urologic patients in the emergency department.",
    relatedProcedures: ["cystoscopy", "catheter", "stone", "testicular torsion", "urinary retention", "hematuria", "trauma"],
    relatedMilestones: ["ME", "COM", "COL"],
    targetCaseCount: 25,
  },
  {
    id: "FOD2",
    title: "Performing basic endoscopic procedures",
    description: "Perform diagnostic and therapeutic cystoscopy, stent insertion, and basic endourologic procedures.",
    relatedProcedures: ["cystoscopy", "stent placement", "ureteral stent", "catheter", "suprapubic catheter"],
    relatedMilestones: ["ME", "P"],
    targetCaseCount: 40,
  },
  {
    id: "FOD3",
    title: "Providing perioperative urologic care",
    description: "Manage urologic patients through the perioperative period.",
    relatedProcedures: ["turbt", "turp", "ureteroscopy", "circumcision", "orchiectomy", "hydrocelectomy"],
    relatedMilestones: ["ME", "COL", "L"],
    targetCaseCount: 30,
  },

  // Core of Discipline
  {
    id: "COD1",
    title: "Managing urolithiasis",
    description: "Assess and manage patients with kidney and ureteral stones.",
    relatedProcedures: ["ureteroscopy", "urs", "laser lithotripsy", "pcnl", "percutaneous nephrolithotomy", "eswl", "stent placement", "stone"],
    relatedMilestones: ["ME", "S", "L"],
    targetCaseCount: 50,
  },
  {
    id: "COD2",
    title: "Managing bladder cancer",
    description: "Assess and manage patients with non-muscle invasive and muscle-invasive bladder cancer.",
    relatedProcedures: ["turbt", "cystoscopy", "radical cystectomy", "cystectomy", "ileal conduit", "neobladder", "bcg", "bladder cancer"],
    relatedMilestones: ["ME", "COM", "S"],
    targetCaseCount: 35,
  },
  {
    id: "COD3",
    title: "Managing prostate cancer",
    description: "Assess and manage patients with prostate cancer from diagnosis through treatment.",
    relatedProcedures: ["prostatectomy", "radical prostatectomy", "robotic prostatectomy", "rarp", "prostate biopsy", "mri fusion biopsy", "prostate"],
    relatedMilestones: ["ME", "COM", "HA"],
    targetCaseCount: 30,
  },
  {
    id: "COD4",
    title: "Managing renal masses",
    description: "Assess and manage patients with renal masses including surgical and ablative approaches.",
    relatedProcedures: ["nephrectomy", "partial nephrectomy", "radical nephrectomy", "robotic partial nephrectomy", "renal mass", "kidney cancer", "cryoablation"],
    relatedMilestones: ["ME", "S", "L"],
    targetCaseCount: 25,
  },
  {
    id: "COD5",
    title: "Managing BPH and male voiding dysfunction",
    description: "Assess and manage patients with benign prostatic obstruction and voiding dysfunction.",
    relatedProcedures: ["turp", "holep", "rezum", "urolift", "greenlight laser", "pvp", "bph", "urethroplasty", "urethral stricture", "dviu"],
    relatedMilestones: ["ME", "COM"],
    targetCaseCount: 35,
  },
  {
    id: "COD6",
    title: "Managing female pelvic medicine conditions",
    description: "Assess and manage urinary incontinence and pelvic floor disorders.",
    relatedProcedures: ["sling", "mid-urethral sling", "incontinence", "prolapse", "sacrocolpopexy", "urodynamics", "botox bladder", "interstim"],
    relatedMilestones: ["ME", "COM", "P"],
    targetCaseCount: 20,
  },
  {
    id: "COD7",
    title: "Managing scrotal and testicular pathology",
    description: "Assess and manage scrotal and testicular conditions.",
    relatedProcedures: ["orchiectomy", "orchiopexy", "hydrocelectomy", "varicocelectomy", "scrotal exploration", "testicular torsion", "testicular cancer"],
    relatedMilestones: ["ME", "COL"],
    targetCaseCount: 25,
  },
  {
    id: "COD8",
    title: "Managing pediatric urologic conditions",
    description: "Assess and manage common pediatric urologic conditions.",
    relatedProcedures: ["circumcision", "hypospadias", "orchiopexy", "ureteral reimplant", "pyeloplasty", "vesicoureteral reflux", "vur", "pediatric"],
    relatedMilestones: ["ME", "COM", "HA"],
    targetCaseCount: 20,
  },
  {
    id: "COD9",
    title: "Managing urologic trauma and emergencies",
    description: "Lead initial assessment and management of urologic trauma and emergencies.",
    relatedProcedures: ["trauma", "renal trauma", "bladder repair", "ureteral repair", "testicular torsion", "priapism", "fournier"],
    relatedMilestones: ["ME", "COL", "L", "COM"],
    targetCaseCount: 15,
  },

  // Transition to Practice
  {
    id: "TTP1",
    title: "Providing comprehensive urologic care",
    description: "Independently manage a panel of urologic patients integrating all CanMEDS roles.",
    relatedProcedures: ["nephrectomy", "prostatectomy", "turbt", "ureteroscopy", "cystoscopy", "turp", "sling"],
    relatedMilestones: ["ME", "COM", "COL", "L", "HA", "S", "P"],
    targetCaseCount: 30,
  },
  {
    id: "TTP2",
    title: "Managing a urologic practice",
    description: "Demonstrate readiness for independent urologic practice.",
    relatedProcedures: ["cystoscopy", "ureteroscopy", "turbt", "nephrectomy", "prostatectomy"],
    relatedMilestones: ["L", "P", "COM", "COL"],
    targetCaseCount: 20,
  },
];

export const UROLOGY_RCPSC: SpecialtyEpaData = {
  specialty: "Urology",
  system: "RCPSC",
  epas: RCPSC_UROLOGY_EPAS,
  milestones: CANMEDS_MILESTONES,
};

// ── Neurosurgery EPAs ─────────────────────────────────────────────────────

const NEUROSURGERY_EPAS: EpaDefinition[] = [
  {
    id: "EPA1",
    title: "Cranial Trauma",
    description: "Evaluate and manage patients with traumatic brain injuries including craniotomy for evacuation of hematomas.",
    relatedProcedures: [
      "craniotomy", "craniectomy", "decompressive craniectomy", "burr hole",
      "epidural hematoma", "subdural hematoma", "edh", "sdh", "traumatic brain injury",
      "tbi", "icp monitor", "evd", "external ventricular drain", "skull fracture",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2", "ICS2"],
    targetCaseCount: 40,
  },
  {
    id: "EPA2",
    title: "Brain Tumors",
    description: "Evaluate and manage patients with primary and metastatic brain tumors including surgical resection.",
    relatedProcedures: [
      "craniotomy", "craniotomy for tumor", "brain tumor", "glioma", "meningioma",
      "metastasis", "brain biopsy", "stereotactic biopsy", "awake craniotomy",
      "neuronavigation", "fluorescence-guided surgery", "5-ala",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2", "ICS1"],
    targetCaseCount: 40,
  },
  {
    id: "EPA3",
    title: "Cerebrovascular Disease",
    description: "Evaluate and manage patients with cerebrovascular pathology including aneurysms, AVMs, and stroke.",
    relatedProcedures: [
      "aneurysm clipping", "craniotomy", "avm resection", "avm", "aneurysm",
      "subarachnoid hemorrhage", "sah", "cavernoma", "cerebrovascular",
      "ec-ic bypass", "endarterectomy", "carotid endarterectomy", "cea",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 30,
  },
  {
    id: "EPA4",
    title: "Degenerative Spine Disease",
    description: "Evaluate and manage patients with degenerative spinal conditions including herniated discs and stenosis.",
    relatedProcedures: [
      "discectomy", "microdiscectomy", "laminectomy", "laminotomy", "acdf",
      "anterior cervical discectomy", "posterior cervical fusion", "lumbar fusion",
      "plif", "tlif", "alif", "xlif", "lateral fusion", "foraminotomy",
      "spinal stenosis", "herniated disc", "cervical disc", "lumbar disc",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 60,
  },
  {
    id: "EPA5",
    title: "Spinal Trauma",
    description: "Evaluate and manage patients with traumatic spinal injuries including fractures and cord compression.",
    relatedProcedures: [
      "spinal fusion", "spinal fracture", "spine trauma", "vertebral fracture",
      "pedicle screw fixation", "posterior spinal fusion", "anterior corpectomy",
      "spinal cord injury", "sci", "kyphoplasty", "vertebroplasty",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2", "ICS2"],
    targetCaseCount: 25,
  },
  {
    id: "EPA6",
    title: "Hydrocephalus and CSF Disorders",
    description: "Evaluate and manage patients with hydrocephalus and CSF circulation disorders.",
    relatedProcedures: [
      "ventriculoperitoneal shunt", "vp shunt", "shunt", "evd",
      "external ventricular drain", "endoscopic third ventriculostomy", "etv",
      "shunt revision", "hydrocephalus", "csf leak", "lumbar drain",
    ],
    relatedMilestones: ["PC1", "PC2", "PC4", "MK1"],
    targetCaseCount: 30,
  },
  {
    id: "EPA7",
    title: "Spinal Tumors",
    description: "Evaluate and manage patients with intramedullary, intradural, and extradural spinal tumors.",
    relatedProcedures: [
      "spinal tumor", "laminectomy for tumor", "intradural tumor", "schwannoma",
      "meningioma spine", "ependymoma", "spinal metastasis", "corpectomy",
      "en bloc spondylectomy", "intramedullary tumor",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 15,
  },
  {
    id: "EPA8",
    title: "Functional Neurosurgery",
    description: "Evaluate and manage patients requiring functional neurosurgical procedures including epilepsy surgery and DBS.",
    relatedProcedures: [
      "deep brain stimulation", "dbs", "epilepsy surgery", "vagus nerve stimulator",
      "vns", "responsive neurostimulator", "rns", "temporal lobectomy",
      "amygdalohippocampectomy", "stereotactic", "functional neurosurgery",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "ICS1"],
    targetCaseCount: 15,
  },
  {
    id: "EPA9",
    title: "Peripheral Nerve Surgery",
    description: "Evaluate and manage patients with peripheral nerve pathology including entrapment and injury.",
    relatedProcedures: [
      "carpal tunnel release", "ulnar nerve transposition", "nerve repair",
      "nerve graft", "peripheral nerve", "brachial plexus", "nerve decompression",
      "tarsal tunnel", "nerve transfer",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 15,
  },
  {
    id: "EPA10",
    title: "Pediatric Neurosurgery",
    description: "Evaluate and manage pediatric neurosurgical conditions including congenital anomalies.",
    relatedProcedures: [
      "myelomeningocele", "chiari malformation", "chiari decompression",
      "craniosynostosis", "tethered cord", "pediatric brain tumor",
      "pediatric hydrocephalus", "vp shunt pediatric", "encephalocele",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "ICS1"],
    targetCaseCount: 15,
  },
  {
    id: "EPA11",
    title: "Pituitary and Skull Base Surgery",
    description: "Evaluate and manage patients with pituitary and skull base tumors.",
    relatedProcedures: [
      "transsphenoidal", "pituitary", "pituitary adenoma", "endoscopic endonasal",
      "skull base", "acoustic neuroma", "vestibular schwannoma",
      "craniopharyngioma", "anterior skull base", "lateral skull base",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2", "ICS2"],
    targetCaseCount: 20,
  },
];

const RCPSC_NEUROSURGERY_EPAS: EpaDefinition[] = [
  { id: "FOD1", title: "Assessing acute neurosurgical patients", description: "Perform initial assessment of undifferentiated neurosurgical patients in the emergency department.", relatedProcedures: ["craniotomy", "burr hole", "evd", "tbi", "spinal fracture", "sdh", "edh", "hydrocephalus"], relatedMilestones: ["ME", "COM", "COL"], targetCaseCount: 25 },
  { id: "FOD2", title: "Performing basic neurosurgical procedures", description: "Perform EVD placement, ICP monitor insertion, burr holes, and basic wound closures.", relatedProcedures: ["evd", "external ventricular drain", "icp monitor", "burr hole", "wound closure", "lumbar drain"], relatedMilestones: ["ME", "P"], targetCaseCount: 30 },
  { id: "FOD3", title: "Providing perioperative neurosurgical care", description: "Manage neurosurgical patients through the perioperative period including neurological monitoring.", relatedProcedures: ["craniotomy", "laminectomy", "discectomy", "shunt", "spinal fusion"], relatedMilestones: ["ME", "COL", "L"], targetCaseCount: 30 },
  { id: "FOD4", title: "Interpreting neuroimaging", description: "Interpret CT, MRI, and angiographic studies relevant to neurosurgical conditions.", relatedProcedures: ["craniotomy", "brain tumor", "spinal stenosis", "herniated disc", "aneurysm", "sdh", "edh"], relatedMilestones: ["ME", "S"], targetCaseCount: 25 },
  { id: "COD1", title: "Managing cranial trauma", description: "Assess and manage patients with traumatic brain injuries.", relatedProcedures: ["craniotomy", "craniectomy", "decompressive craniectomy", "edh", "sdh", "tbi", "evd", "icp monitor"], relatedMilestones: ["ME", "COL", "L"], targetCaseCount: 35 },
  { id: "COD2", title: "Managing brain tumors", description: "Assess and manage patients with primary and metastatic brain tumors.", relatedProcedures: ["craniotomy for tumor", "brain tumor", "glioma", "meningioma", "stereotactic biopsy", "awake craniotomy", "neuronavigation"], relatedMilestones: ["ME", "COM", "S"], targetCaseCount: 35 },
  { id: "COD3", title: "Managing cerebrovascular disease", description: "Assess and manage patients with cerebrovascular pathology.", relatedProcedures: ["aneurysm clipping", "avm resection", "sah", "carotid endarterectomy", "cea", "cerebrovascular", "ec-ic bypass"], relatedMilestones: ["ME", "S", "L"], targetCaseCount: 25 },
  { id: "COD4", title: "Managing degenerative spine disease", description: "Assess and manage patients with degenerative spinal conditions.", relatedProcedures: ["discectomy", "microdiscectomy", "laminectomy", "acdf", "lumbar fusion", "plif", "tlif", "foraminotomy", "spinal stenosis"], relatedMilestones: ["ME", "COM"], targetCaseCount: 50 },
  { id: "COD5", title: "Managing spinal trauma", description: "Assess and manage patients with traumatic spinal injuries.", relatedProcedures: ["spinal fusion", "spinal fracture", "pedicle screw fixation", "corpectomy", "spinal cord injury", "kyphoplasty"], relatedMilestones: ["ME", "COL", "L", "COM"], targetCaseCount: 25 },
  { id: "COD6", title: "Managing hydrocephalus and CSF disorders", description: "Assess and manage patients with hydrocephalus and CSF circulation disorders.", relatedProcedures: ["vp shunt", "shunt revision", "etv", "evd", "hydrocephalus", "lumbar drain", "csf leak"], relatedMilestones: ["ME", "COM", "P"], targetCaseCount: 25 },
  { id: "COD7", title: "Managing skull base and pituitary pathology", description: "Assess and manage patients with pituitary and skull base tumors.", relatedProcedures: ["transsphenoidal", "pituitary", "endoscopic endonasal", "skull base", "acoustic neuroma", "vestibular schwannoma"], relatedMilestones: ["ME", "COL"], targetCaseCount: 20 },
  { id: "COD8", title: "Managing pediatric neurosurgical conditions", description: "Assess and manage pediatric neurosurgical conditions.", relatedProcedures: ["myelomeningocele", "chiari decompression", "craniosynostosis", "tethered cord", "pediatric hydrocephalus", "pediatric brain tumor"], relatedMilestones: ["ME", "COM", "HA"], targetCaseCount: 15 },
  { id: "TTP1", title: "Providing comprehensive neurosurgical care", description: "Independently manage a panel of neurosurgical patients integrating all CanMEDS roles.", relatedProcedures: ["craniotomy", "laminectomy", "discectomy", "shunt", "spinal fusion", "brain tumor", "aneurysm clipping"], relatedMilestones: ["ME", "COM", "COL", "L", "HA", "S", "P"], targetCaseCount: 30 },
  { id: "TTP2", title: "Managing a neurosurgical practice", description: "Demonstrate readiness for independent neurosurgical practice.", relatedProcedures: ["craniotomy", "laminectomy", "discectomy", "spinal fusion", "vp shunt"], relatedMilestones: ["L", "P", "COM", "COL"], targetCaseCount: 20 },
];

export const NEUROSURGERY_ACGME: SpecialtyEpaData = {
  specialty: "Neurosurgery",
  system: "ACGME",
  epas: NEUROSURGERY_EPAS,
  milestones: SURGERY_MILESTONES,
};

export const NEUROSURGERY_RCPSC: SpecialtyEpaData = {
  specialty: "Neurosurgery",
  system: "RCPSC",
  epas: RCPSC_NEUROSURGERY_EPAS,
  milestones: CANMEDS_MILESTONES,
};

// ── Orthopedic Surgery EPAs ───────────────────────────────────────────────

const ORTHOPEDIC_EPAS: EpaDefinition[] = [
  {
    id: "EPA1",
    title: "Hip Fractures",
    description: "Evaluate and manage patients with hip fractures including operative fixation and arthroplasty.",
    relatedProcedures: [
      "hip fracture", "femoral neck fracture", "intertrochanteric fracture",
      "hip hemiarthroplasty", "hip pinning", "dhs", "dynamic hip screw",
      "intramedullary nail", "imn", "gamma nail", "hip orif",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 40,
  },
  {
    id: "EPA2",
    title: "Total Joint Arthroplasty",
    description: "Evaluate and manage patients requiring total hip and total knee arthroplasty for degenerative disease.",
    relatedProcedures: [
      "total hip arthroplasty", "tha", "total hip replacement", "thr",
      "total knee arthroplasty", "tka", "total knee replacement", "tkr",
      "revision hip", "revision knee", "unicompartmental knee", "uka",
      "hip resurfacing", "arthroplasty",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 50,
  },
  {
    id: "EPA3",
    title: "Upper Extremity Fractures",
    description: "Evaluate and manage fractures of the upper extremity including distal radius, humerus, and forearm.",
    relatedProcedures: [
      "distal radius fracture", "wrist fracture", "orif", "open reduction internal fixation",
      "humerus fracture", "supracondylar fracture", "olecranon fracture",
      "clavicle fracture", "radial head fracture", "forearm fracture",
      "scaphoid fracture", "distal humerus fracture",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 40,
  },
  {
    id: "EPA4",
    title: "Lower Extremity Fractures",
    description: "Evaluate and manage fractures of the lower extremity including tibia, ankle, and femoral shaft.",
    relatedProcedures: [
      "tibial fracture", "tibia fracture", "ankle fracture", "orif ankle",
      "femoral shaft fracture", "femur fracture", "intramedullary nail",
      "tibial nail", "femoral nail", "pilon fracture", "calcaneus fracture",
      "plateau fracture", "tibial plateau",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 40,
  },
  {
    id: "EPA5",
    title: "Shoulder and Elbow Disorders",
    description: "Evaluate and manage patients with shoulder and elbow pathology including rotator cuff and instability.",
    relatedProcedures: [
      "rotator cuff repair", "shoulder arthroscopy", "bankart repair",
      "labral repair", "shoulder replacement", "reverse shoulder arthroplasty",
      "rsa", "total shoulder arthroplasty", "tsa", "acromioplasty",
      "subacromial decompression", "distal clavicle excision",
      "biceps tenodesis", "elbow arthroscopy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 30,
  },
  {
    id: "EPA6",
    title: "Knee Disorders and Arthroscopy",
    description: "Evaluate and manage patients with knee disorders including meniscal tears and ligament injuries.",
    relatedProcedures: [
      "knee arthroscopy", "acl reconstruction", "acl", "meniscectomy",
      "meniscus repair", "pcl reconstruction", "pcl", "multiligament knee",
      "knee scope", "chondroplasty", "osteochondral", "maci",
      "osteotomy", "high tibial osteotomy", "hto",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 40,
  },
  {
    id: "EPA7",
    title: "Spine Disorders",
    description: "Evaluate and manage patients with spinal disorders including degenerative disease, deformity, and fractures.",
    relatedProcedures: [
      "spinal fusion", "discectomy", "laminectomy", "acdf",
      "posterior spinal fusion", "scoliosis correction", "kyphoplasty",
      "vertebroplasty", "lumbar fusion", "cervical fusion",
      "spinal deformity", "spinal fracture",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 30,
  },
  {
    id: "EPA8",
    title: "Hand and Wrist Disorders",
    description: "Evaluate and manage patients with hand and wrist pathology including fractures, tendon injuries, and nerve compression.",
    relatedProcedures: [
      "carpal tunnel release", "trigger finger release", "tendon repair",
      "flexor tendon repair", "extensor tendon repair", "dupuytren",
      "ganglion cyst", "hand fracture", "metacarpal fracture",
      "phalangeal fracture", "wrist arthroscopy", "tfcc repair",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 30,
  },
  {
    id: "EPA9",
    title: "Musculoskeletal Infections",
    description: "Evaluate and manage patients with musculoskeletal infections including septic joints and osteomyelitis.",
    relatedProcedures: [
      "septic joint", "joint aspiration", "i&d", "incision and drainage",
      "washout", "irrigation and debridement", "osteomyelitis",
      "periprosthetic joint infection", "pji", "spacer", "antibiotic spacer",
    ],
    relatedMilestones: ["PC1", "PC2", "PC4", "MK1", "SBP1"],
    targetCaseCount: 20,
  },
  {
    id: "EPA10",
    title: "Orthopedic Trauma - Pelvis and Acetabulum",
    description: "Evaluate and manage patients with pelvic and acetabular fractures.",
    relatedProcedures: [
      "pelvic fracture", "acetabular fracture", "pelvis orif",
      "acetabulum orif", "pelvic ring injury", "sacral fracture",
      "external fixation", "ex fix", "pelvic binder",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2", "ICS2"],
    targetCaseCount: 15,
  },
  {
    id: "EPA11",
    title: "Musculoskeletal Oncology",
    description: "Evaluate and manage patients with benign and malignant musculoskeletal tumors.",
    relatedProcedures: [
      "bone tumor", "soft tissue sarcoma", "wide excision", "limb salvage",
      "tumor resection", "endoprosthesis", "curettage", "bone biopsy",
      "musculoskeletal tumor", "sarcoma",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "ICS1"],
    targetCaseCount: 10,
  },
  {
    id: "EPA12",
    title: "Pediatric Orthopedics",
    description: "Evaluate and manage pediatric musculoskeletal conditions including fractures and developmental disorders.",
    relatedProcedures: [
      "supracondylar fracture", "pediatric fracture", "clubfoot",
      "ddh", "developmental dysplasia", "slipped capital femoral epiphysis",
      "scfe", "flexible nailing", "pediatric orthopedic",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "ICS1"],
    targetCaseCount: 20,
  },
  {
    id: "EPA13",
    title: "Foot and Ankle Disorders",
    description: "Evaluate and manage patients with foot and ankle pathology.",
    relatedProcedures: [
      "ankle arthroscopy", "achilles tendon repair", "bunionectomy",
      "ankle fusion", "ankle arthroplasty", "flatfoot correction",
      "hammertoe", "metatarsal osteotomy", "lisfranc", "ankle ligament repair",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 20,
  },
];

const RCPSC_ORTHOPEDIC_EPAS: EpaDefinition[] = [
  { id: "FOD1", title: "Assessing acute musculoskeletal injuries", description: "Perform initial assessment and management of acute musculoskeletal injuries.", relatedProcedures: ["fracture", "dislocation", "orif", "closed reduction", "splinting", "casting", "hip fracture"], relatedMilestones: ["ME", "COM", "COL"], targetCaseCount: 30 },
  { id: "FOD2", title: "Performing basic orthopedic procedures", description: "Perform fracture reduction, splinting, casting, and basic fixation.", relatedProcedures: ["closed reduction", "splint", "cast", "k-wire", "pin fixation", "joint aspiration", "i&d"], relatedMilestones: ["ME", "P"], targetCaseCount: 35 },
  { id: "FOD3", title: "Providing perioperative orthopedic care", description: "Manage orthopedic patients through the perioperative period.", relatedProcedures: ["orif", "hip fracture", "arthroplasty", "arthroscopy", "spinal fusion"], relatedMilestones: ["ME", "COL", "L"], targetCaseCount: 30 },
  { id: "FOD4", title: "Interpreting musculoskeletal imaging", description: "Interpret radiographs, CT, and MRI for musculoskeletal conditions.", relatedProcedures: ["fracture", "dislocation", "tumor", "arthritis", "ligament injury", "meniscus tear"], relatedMilestones: ["ME", "S"], targetCaseCount: 25 },
  { id: "COD1", title: "Managing hip and knee arthroplasty", description: "Assess and manage patients requiring hip and knee replacement.", relatedProcedures: ["total hip arthroplasty", "tha", "total knee arthroplasty", "tka", "revision hip", "revision knee", "uka", "arthroplasty"], relatedMilestones: ["ME", "COM", "S"], targetCaseCount: 45 },
  { id: "COD2", title: "Managing extremity fractures", description: "Assess and manage upper and lower extremity fractures.", relatedProcedures: ["orif", "intramedullary nail", "distal radius fracture", "ankle fracture", "tibial fracture", "femur fracture", "humerus fracture"], relatedMilestones: ["ME", "S", "L"], targetCaseCount: 50 },
  { id: "COD3", title: "Managing sports medicine conditions", description: "Assess and manage knee and shoulder sports injuries.", relatedProcedures: ["knee arthroscopy", "acl reconstruction", "meniscectomy", "rotator cuff repair", "shoulder arthroscopy", "bankart repair", "labral repair"], relatedMilestones: ["ME", "COM"], targetCaseCount: 35 },
  { id: "COD4", title: "Managing spine disorders", description: "Assess and manage spinal disorders.", relatedProcedures: ["spinal fusion", "discectomy", "laminectomy", "acdf", "scoliosis correction", "kyphoplasty", "spinal fracture"], relatedMilestones: ["ME", "S", "L"], targetCaseCount: 25 },
  { id: "COD5", title: "Managing hand and upper extremity conditions", description: "Assess and manage hand, wrist, and upper extremity pathology.", relatedProcedures: ["carpal tunnel release", "trigger finger release", "tendon repair", "dupuytren", "hand fracture", "wrist arthroscopy"], relatedMilestones: ["ME", "COM", "P"], targetCaseCount: 25 },
  { id: "COD6", title: "Managing pediatric orthopedic conditions", description: "Assess and manage pediatric musculoskeletal conditions.", relatedProcedures: ["supracondylar fracture", "pediatric fracture", "clubfoot", "ddh", "scfe", "pediatric orthopedic"], relatedMilestones: ["ME", "COM", "HA"], targetCaseCount: 20 },
  { id: "COD7", title: "Managing musculoskeletal infections and tumors", description: "Assess and manage musculoskeletal infections and neoplasms.", relatedProcedures: ["septic joint", "osteomyelitis", "pji", "bone tumor", "soft tissue sarcoma", "wide excision", "i&d"], relatedMilestones: ["ME", "COL", "L", "COM"], targetCaseCount: 15 },
  { id: "COD8", title: "Managing pelvic and acetabular trauma", description: "Assess and manage pelvic ring and acetabular injuries.", relatedProcedures: ["pelvic fracture", "acetabular fracture", "pelvis orif", "external fixation", "pelvic ring injury"], relatedMilestones: ["ME", "COL"], targetCaseCount: 15 },
  { id: "TTP1", title: "Providing comprehensive orthopedic care", description: "Independently manage a panel of orthopedic patients integrating all CanMEDS roles.", relatedProcedures: ["arthroplasty", "orif", "arthroscopy", "spinal fusion", "carpal tunnel release", "hip fracture"], relatedMilestones: ["ME", "COM", "COL", "L", "HA", "S", "P"], targetCaseCount: 30 },
  { id: "TTP2", title: "Managing an orthopedic practice", description: "Demonstrate readiness for independent orthopedic practice.", relatedProcedures: ["arthroplasty", "orif", "arthroscopy", "fracture", "spinal fusion"], relatedMilestones: ["L", "P", "COM", "COL"], targetCaseCount: 20 },
];

export const ORTHOPEDIC_ACGME: SpecialtyEpaData = {
  specialty: "Orthopedic Surgery",
  system: "ACGME",
  epas: ORTHOPEDIC_EPAS,
  milestones: SURGERY_MILESTONES,
};

export const ORTHOPEDIC_RCPSC: SpecialtyEpaData = {
  specialty: "Orthopedic Surgery",
  system: "RCPSC",
  epas: RCPSC_ORTHOPEDIC_EPAS,
  milestones: CANMEDS_MILESTONES,
};

// ── Cardiac Surgery EPAs ──────────────────────────────────────────────────

const CARDIAC_EPAS: EpaDefinition[] = [
  {
    id: "EPA1",
    title: "Coronary Artery Bypass Grafting",
    description: "Evaluate and manage patients with coronary artery disease requiring surgical revascularization.",
    relatedProcedures: [
      "cabg", "coronary artery bypass", "coronary bypass", "lima",
      "rima", "svg", "saphenous vein graft", "internal mammary artery",
      "off-pump cabg", "opcab", "on-pump cabg", "coronary",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 50,
  },
  {
    id: "EPA2",
    title: "Aortic Valve Surgery",
    description: "Evaluate and manage patients requiring aortic valve repair or replacement.",
    relatedProcedures: [
      "aortic valve replacement", "avr", "tavr", "tavi", "savr",
      "aortic valve repair", "ross procedure", "bentall", "valve replacement",
      "mechanical valve", "bioprosthetic valve", "aortic valve",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 30,
  },
  {
    id: "EPA3",
    title: "Mitral Valve Surgery",
    description: "Evaluate and manage patients requiring mitral valve repair or replacement.",
    relatedProcedures: [
      "mitral valve repair", "mitral valve replacement", "mvr",
      "mitral annuloplasty", "mitral", "minimally invasive mitral",
      "robotic mitral", "mitraclip",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 25,
  },
  {
    id: "EPA4",
    title: "Aortic Surgery",
    description: "Evaluate and manage patients with aortic pathology including aneurysms and dissections.",
    relatedProcedures: [
      "aortic aneurysm repair", "aortic root replacement", "bentall",
      "ascending aortic replacement", "aortic arch", "hemiarch",
      "total arch replacement", "elephant trunk", "frozen elephant trunk",
      "aortic dissection", "type a dissection", "thoracoabdominal aortic aneurysm",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2", "ICS2"],
    targetCaseCount: 20,
  },
  {
    id: "EPA5",
    title: "Cardiopulmonary Bypass Management",
    description: "Manage cardiopulmonary bypass including cannulation, myocardial protection, and weaning.",
    relatedProcedures: [
      "cardiopulmonary bypass", "cpb", "cannulation", "cross-clamp",
      "cardioplegia", "bypass", "on-pump", "weaning from bypass",
      "decannulation", "protamine",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2", "ICS2"],
    targetCaseCount: 50,
  },
  {
    id: "EPA6",
    title: "Mechanical Circulatory Support",
    description: "Evaluate and manage patients requiring mechanical circulatory support devices.",
    relatedProcedures: [
      "lvad", "left ventricular assist device", "rvad", "ecmo",
      "extracorporeal membrane oxygenation", "iabp", "intra-aortic balloon pump",
      "impella", "vad", "ventricular assist device", "heart transplant",
    ],
    relatedMilestones: ["PC1", "PC2", "PC4", "MK1", "ICS2"],
    targetCaseCount: 15,
  },
  {
    id: "EPA7",
    title: "Congenital Heart Disease",
    description: "Evaluate and manage patients with congenital heart defects requiring surgical correction.",
    relatedProcedures: [
      "asd repair", "atrial septal defect", "vsd repair", "ventricular septal defect",
      "tetralogy of fallot", "tof repair", "fontan", "glenn", "norwood",
      "congenital heart", "patent ductus arteriosus", "pda ligation",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2", "ICS1"],
    targetCaseCount: 15,
  },
  {
    id: "EPA8",
    title: "Pericardial and Cardiac Trauma",
    description: "Evaluate and manage patients with pericardial disease and cardiac trauma.",
    relatedProcedures: [
      "pericardectomy", "pericardial window", "pericardiocentesis",
      "cardiac trauma", "cardiac tamponade", "sternotomy", "thoracotomy",
      "cardiac repair",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "ICS2"],
    targetCaseCount: 10,
  },
  {
    id: "EPA9",
    title: "Postoperative Cardiac ICU Care",
    description: "Manage critically ill post-cardiac surgery patients including hemodynamic optimization and complication management.",
    relatedProcedures: [
      "cabg", "valve replacement", "aortic surgery", "chest tube",
      "mediastinal exploration", "re-exploration for bleeding", "sternal closure",
      "temporary pacing", "cardiac icu",
    ],
    relatedMilestones: ["PC1", "PC4", "MK1", "SBP1", "SBP2", "ICS2", "PROF2"],
    targetCaseCount: 40,
  },
  {
    id: "EPA10",
    title: "Arrhythmia Surgery and Cardiac Devices",
    description: "Evaluate and manage surgical treatment of arrhythmias and cardiac implantable devices.",
    relatedProcedures: [
      "maze procedure", "cox-maze", "surgical ablation", "left atrial appendage",
      "laa closure", "pacemaker", "lead extraction", "atrial fibrillation surgery",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1"],
    targetCaseCount: 10,
  },
];

const RCPSC_CARDIAC_EPAS: EpaDefinition[] = [
  { id: "FOD1", title: "Assessing acute cardiac surgical patients", description: "Perform initial assessment of patients requiring cardiac surgery.", relatedProcedures: ["cabg", "valve replacement", "aortic dissection", "cardiac tamponade", "chest tube"], relatedMilestones: ["ME", "COM", "COL"], targetCaseCount: 25 },
  { id: "FOD2", title: "Performing cardiopulmonary bypass and cannulation", description: "Perform cannulation, manage CPB, and wean from bypass.", relatedProcedures: ["cardiopulmonary bypass", "cpb", "cannulation", "cardioplegia", "bypass", "decannulation"], relatedMilestones: ["ME", "P"], targetCaseCount: 40 },
  { id: "FOD3", title: "Providing perioperative cardiac surgical care", description: "Manage cardiac surgical patients through the perioperative period.", relatedProcedures: ["cabg", "valve replacement", "chest tube", "temporary pacing", "mediastinal drain"], relatedMilestones: ["ME", "COL", "L"], targetCaseCount: 30 },
  { id: "FOD4", title: "Performing median sternotomy and chest closure", description: "Perform sternotomy, internal mammary artery harvest, and sternal closure.", relatedProcedures: ["sternotomy", "lima harvest", "sternal closure", "chest closure", "sternal wiring"], relatedMilestones: ["ME", "S"], targetCaseCount: 30 },
  { id: "COD1", title: "Managing coronary artery disease surgically", description: "Assess and manage patients requiring CABG.", relatedProcedures: ["cabg", "coronary artery bypass", "lima", "svg", "opcab", "on-pump cabg", "coronary"], relatedMilestones: ["ME", "COM", "S"], targetCaseCount: 45 },
  { id: "COD2", title: "Managing valvular heart disease", description: "Assess and manage patients requiring valve repair or replacement.", relatedProcedures: ["avr", "mvr", "aortic valve replacement", "mitral valve repair", "mitral annuloplasty", "valve replacement"], relatedMilestones: ["ME", "S", "L"], targetCaseCount: 35 },
  { id: "COD3", title: "Managing aortic pathology", description: "Assess and manage patients with aortic aneurysms and dissections.", relatedProcedures: ["aortic root replacement", "bentall", "ascending aortic replacement", "aortic arch", "hemiarch", "aortic dissection"], relatedMilestones: ["ME", "COL", "L"], targetCaseCount: 20 },
  { id: "COD4", title: "Managing mechanical circulatory support", description: "Assess and manage patients requiring ECMO, VADs, and transplant.", relatedProcedures: ["lvad", "ecmo", "iabp", "impella", "vad", "heart transplant"], relatedMilestones: ["ME", "COM", "COL"], targetCaseCount: 15 },
  { id: "COD5", title: "Managing congenital heart disease", description: "Assess and manage patients with congenital cardiac defects.", relatedProcedures: ["asd repair", "vsd repair", "tetralogy of fallot", "fontan", "glenn", "norwood", "congenital heart", "pda ligation"], relatedMilestones: ["ME", "COM", "HA"], targetCaseCount: 15 },
  { id: "COD6", title: "Managing the cardiac ICU patient", description: "Manage critically ill post-cardiac surgery patients.", relatedProcedures: ["cabg", "valve replacement", "chest tube", "re-exploration for bleeding", "temporary pacing", "cardiac icu"], relatedMilestones: ["ME", "COL", "L", "COM"], targetCaseCount: 35 },
  { id: "TTP1", title: "Providing comprehensive cardiac surgical care", description: "Independently manage cardiac surgical patients integrating all CanMEDS roles.", relatedProcedures: ["cabg", "avr", "mvr", "aortic surgery", "sternotomy", "cpb"], relatedMilestones: ["ME", "COM", "COL", "L", "HA", "S", "P"], targetCaseCount: 30 },
  { id: "TTP2", title: "Managing a cardiac surgical practice", description: "Demonstrate readiness for independent cardiac surgical practice.", relatedProcedures: ["cabg", "valve replacement", "aortic surgery", "sternotomy"], relatedMilestones: ["L", "P", "COM", "COL"], targetCaseCount: 20 },
];

export const CARDIAC_ACGME: SpecialtyEpaData = {
  specialty: "Cardiac Surgery",
  system: "ACGME",
  epas: CARDIAC_EPAS,
  milestones: SURGERY_MILESTONES,
};

export const CARDIAC_RCPSC: SpecialtyEpaData = {
  specialty: "Cardiac Surgery",
  system: "RCPSC",
  epas: RCPSC_CARDIAC_EPAS,
  milestones: CANMEDS_MILESTONES,
};

// ── Vascular Surgery EPAs ─────────────────────────────────────────────────

const VASCULAR_EPAS: EpaDefinition[] = [
  {
    id: "EPA1",
    title: "Carotid Artery Disease",
    description: "Evaluate and manage patients with extracranial carotid artery disease.",
    relatedProcedures: [
      "carotid endarterectomy", "cea", "carotid stent", "cas",
      "carotid artery", "carotid stenosis", "tia", "carotid body tumor",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 25,
  },
  {
    id: "EPA2",
    title: "Aortic Aneurysm Disease",
    description: "Evaluate and manage patients with abdominal and thoracic aortic aneurysms.",
    relatedProcedures: [
      "aaa repair", "open aaa", "evar", "endovascular aneurysm repair",
      "abdominal aortic aneurysm", "thoracic aortic aneurysm", "tevar",
      "thoracic endovascular aortic repair", "aortic aneurysm",
      "aortobifemoral bypass", "aortic graft",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 30,
  },
  {
    id: "EPA3",
    title: "Peripheral Arterial Disease - Lower Extremity",
    description: "Evaluate and manage patients with lower extremity peripheral arterial disease.",
    relatedProcedures: [
      "femoral popliteal bypass", "fem-pop bypass", "fem-fem bypass",
      "femorotibial bypass", "lower extremity bypass", "angioplasty",
      "pta", "stent", "atherectomy", "peripheral angiogram",
      "claudication", "critical limb ischemia", "cli", "pad",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 40,
  },
  {
    id: "EPA4",
    title: "Acute Limb Ischemia",
    description: "Evaluate and manage patients presenting with acute limb ischemia.",
    relatedProcedures: [
      "embolectomy", "thrombectomy", "fogarty", "fasciotomy",
      "acute limb ischemia", "ali", "thrombolysis", "bypass graft thrombosis",
      "compartment syndrome",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "ICS2"],
    targetCaseCount: 15,
  },
  {
    id: "EPA5",
    title: "Dialysis Access",
    description: "Evaluate and manage patients requiring hemodialysis access creation and maintenance.",
    relatedProcedures: [
      "av fistula", "avf", "av graft", "avg", "dialysis access",
      "brachiocephalic fistula", "radiocephalic fistula", "brescia-cimino",
      "fistulogram", "thrombectomy graft", "ptfe graft",
      "peritoneal dialysis catheter", "permcath",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1"],
    targetCaseCount: 30,
  },
  {
    id: "EPA6",
    title: "Venous Disease",
    description: "Evaluate and manage patients with venous disease including DVT, varicosities, and venous insufficiency.",
    relatedProcedures: [
      "varicose vein", "vein stripping", "endovenous ablation", "evla",
      "radiofrequency ablation", "rfa", "sclerotherapy", "ivc filter",
      "dvt", "deep vein thrombosis", "venous stent", "phlegmasia",
      "venous insufficiency",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1"],
    targetCaseCount: 20,
  },
  {
    id: "EPA7",
    title: "Endovascular Procedures",
    description: "Perform endovascular diagnostic and therapeutic interventions.",
    relatedProcedures: [
      "angiogram", "arteriogram", "angioplasty", "stent", "stent graft",
      "evar", "tevar", "embolization", "coil embolization",
      "thrombolysis", "endovascular", "percutaneous",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 40,
  },
  {
    id: "EPA8",
    title: "Mesenteric and Renal Vascular Disease",
    description: "Evaluate and manage patients with mesenteric and renovascular disease.",
    relatedProcedures: [
      "mesenteric ischemia", "mesenteric bypass", "sma stent",
      "renal artery stenosis", "renal artery stent", "renal artery bypass",
      "mesenteric angiogram", "visceral angiogram",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 10,
  },
  {
    id: "EPA9",
    title: "Vascular Trauma",
    description: "Evaluate and manage patients with vascular injuries.",
    relatedProcedures: [
      "vascular repair", "arterial repair", "vein repair", "interposition graft",
      "vascular trauma", "shunt", "temporary shunt", "fasciotomy",
      "vascular injury", "hemorrhage control",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "ICS2"],
    targetCaseCount: 10,
  },
  {
    id: "EPA10",
    title: "Amputation",
    description: "Evaluate and manage patients requiring major and minor amputations.",
    relatedProcedures: [
      "below knee amputation", "bka", "above knee amputation", "aka",
      "toe amputation", "transmetatarsal amputation", "tma",
      "amputation", "ray amputation", "guillotine amputation",
    ],
    relatedMilestones: ["PC1", "PC2", "PC4", "MK1", "ICS1"],
    targetCaseCount: 15,
  },
  {
    id: "EPA11",
    title: "Thoracic Outlet Syndrome",
    description: "Evaluate and manage patients with thoracic outlet syndrome.",
    relatedProcedures: [
      "thoracic outlet", "tos", "first rib resection", "scalenectomy",
      "thoracic outlet decompression", "cervical rib",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 5,
  },
];

const RCPSC_VASCULAR_EPAS: EpaDefinition[] = [
  { id: "FOD1", title: "Assessing acute vascular patients", description: "Perform initial assessment of undifferentiated vascular patients.", relatedProcedures: ["acute limb ischemia", "aaa", "dvt", "vascular trauma", "embolectomy", "carotid"], relatedMilestones: ["ME", "COM", "COL"], targetCaseCount: 25 },
  { id: "FOD2", title: "Performing basic vascular procedures", description: "Perform vascular access, wound care, and basic vascular exposures.", relatedProcedures: ["av fistula", "avf", "central line", "cutdown", "wound debridement", "amputation"], relatedMilestones: ["ME", "P"], targetCaseCount: 30 },
  { id: "FOD3", title: "Providing perioperative vascular care", description: "Manage vascular patients through the perioperative period.", relatedProcedures: ["carotid endarterectomy", "bypass", "evar", "amputation", "dialysis access"], relatedMilestones: ["ME", "COL", "L"], targetCaseCount: 30 },
  { id: "FOD4", title: "Interpreting vascular imaging", description: "Interpret duplex ultrasound, CTA, MRA, and angiography.", relatedProcedures: ["angiogram", "duplex ultrasound", "cta", "mra", "arteriogram", "venogram"], relatedMilestones: ["ME", "S"], targetCaseCount: 25 },
  { id: "COD1", title: "Managing carotid artery disease", description: "Assess and manage patients with carotid stenosis.", relatedProcedures: ["carotid endarterectomy", "cea", "carotid stent", "cas", "carotid stenosis"], relatedMilestones: ["ME", "COM", "S"], targetCaseCount: 25 },
  { id: "COD2", title: "Managing aortic aneurysm disease", description: "Assess and manage patients with aortic aneurysms.", relatedProcedures: ["aaa repair", "open aaa", "evar", "tevar", "aortic aneurysm", "aortobifemoral bypass"], relatedMilestones: ["ME", "S", "L"], targetCaseCount: 25 },
  { id: "COD3", title: "Managing peripheral arterial disease", description: "Assess and manage patients with lower extremity PAD.", relatedProcedures: ["fem-pop bypass", "lower extremity bypass", "angioplasty", "atherectomy", "stent", "pad", "cli"], relatedMilestones: ["ME", "COM"], targetCaseCount: 35 },
  { id: "COD4", title: "Managing acute limb ischemia", description: "Assess and manage patients with acute limb ischemia.", relatedProcedures: ["embolectomy", "thrombectomy", "fogarty", "fasciotomy", "ali", "thrombolysis"], relatedMilestones: ["ME", "COL", "L", "COM"], targetCaseCount: 15 },
  { id: "COD5", title: "Managing dialysis access", description: "Create and manage hemodialysis access.", relatedProcedures: ["av fistula", "avf", "av graft", "avg", "fistulogram", "permcath", "peritoneal dialysis catheter"], relatedMilestones: ["ME", "COM", "P"], targetCaseCount: 25 },
  { id: "COD6", title: "Managing venous disease", description: "Assess and manage patients with venous pathology.", relatedProcedures: ["varicose vein", "endovenous ablation", "ivc filter", "dvt", "venous stent", "sclerotherapy"], relatedMilestones: ["ME", "COM", "HA"], targetCaseCount: 15 },
  { id: "COD7", title: "Performing endovascular interventions", description: "Perform diagnostic and therapeutic endovascular procedures.", relatedProcedures: ["angiogram", "angioplasty", "stent", "evar", "tevar", "embolization", "endovascular"], relatedMilestones: ["ME", "COL"], targetCaseCount: 35 },
  { id: "COD8", title: "Managing vascular trauma", description: "Assess and manage vascular injuries.", relatedProcedures: ["vascular repair", "arterial repair", "vein repair", "shunt", "fasciotomy", "vascular trauma"], relatedMilestones: ["ME", "COL", "L"], targetCaseCount: 10 },
  { id: "TTP1", title: "Providing comprehensive vascular care", description: "Independently manage a panel of vascular patients integrating all CanMEDS roles.", relatedProcedures: ["carotid endarterectomy", "evar", "bypass", "avf", "amputation", "angioplasty"], relatedMilestones: ["ME", "COM", "COL", "L", "HA", "S", "P"], targetCaseCount: 30 },
  { id: "TTP2", title: "Managing a vascular surgical practice", description: "Demonstrate readiness for independent vascular surgical practice.", relatedProcedures: ["carotid endarterectomy", "evar", "bypass", "avf", "angiogram"], relatedMilestones: ["L", "P", "COM", "COL"], targetCaseCount: 20 },
];

export const VASCULAR_ACGME: SpecialtyEpaData = {
  specialty: "Vascular Surgery",
  system: "ACGME",
  epas: VASCULAR_EPAS,
  milestones: SURGERY_MILESTONES,
};

export const VASCULAR_RCPSC: SpecialtyEpaData = {
  specialty: "Vascular Surgery",
  system: "RCPSC",
  epas: RCPSC_VASCULAR_EPAS,
  milestones: CANMEDS_MILESTONES,
};

// ── Plastic Surgery EPAs ──────────────────────────────────────────────────

const PLASTIC_EPAS: EpaDefinition[] = [
  {
    id: "EPA1",
    title: "Skin and Soft Tissue Reconstruction",
    description: "Evaluate and manage patients requiring skin grafts, local flaps, and soft tissue reconstruction.",
    relatedProcedures: [
      "skin graft", "stsg", "ftsg", "split thickness skin graft",
      "full thickness skin graft", "local flap", "rotation flap",
      "advancement flap", "transposition flap", "z-plasty", "w-plasty",
      "wound closure", "tissue expansion", "tissue expander",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 40,
  },
  {
    id: "EPA2",
    title: "Breast Reconstruction",
    description: "Evaluate and manage patients requiring breast reconstruction after mastectomy.",
    relatedProcedures: [
      "breast reconstruction", "tram flap", "diep flap", "latissimus dorsi flap",
      "tissue expander", "implant reconstruction", "implant exchange",
      "nipple reconstruction", "autologous breast reconstruction",
      "free flap breast", "prophylactic mastectomy reconstruction",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2", "ICS1"],
    targetCaseCount: 30,
  },
  {
    id: "EPA3",
    title: "Hand Surgery",
    description: "Evaluate and manage patients with hand and upper extremity injuries and conditions.",
    relatedProcedures: [
      "flexor tendon repair", "extensor tendon repair", "hand fracture",
      "metacarpal fracture", "phalangeal fracture", "carpal tunnel release",
      "trigger finger release", "dupuytren", "replantation",
      "digital nerve repair", "finger amputation", "hand",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 40,
  },
  {
    id: "EPA4",
    title: "Microsurgery and Free Tissue Transfer",
    description: "Evaluate and perform free tissue transfer for complex reconstruction.",
    relatedProcedures: [
      "free flap", "microvascular", "microsurgery", "free tissue transfer",
      "radial forearm free flap", "anterolateral thigh flap", "alt flap",
      "fibula free flap", "gracilis flap", "anastomosis",
      "flap monitoring", "flap salvage",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 25,
  },
  {
    id: "EPA5",
    title: "Head and Neck Reconstruction",
    description: "Evaluate and manage patients requiring head and neck reconstruction after oncologic or traumatic defects.",
    relatedProcedures: [
      "head and neck reconstruction", "mandible reconstruction",
      "fibula free flap", "radial forearm free flap", "pedicled flap",
      "pectoralis major flap", "scalp reconstruction", "lip reconstruction",
      "nasal reconstruction", "facial reconstruction",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2", "ICS2"],
    targetCaseCount: 20,
  },
  {
    id: "EPA6",
    title: "Craniofacial Surgery",
    description: "Evaluate and manage patients with craniofacial deformities and conditions.",
    relatedProcedures: [
      "craniosynostosis", "cleft lip repair", "cleft palate repair",
      "orthognathic surgery", "le fort", "craniofacial", "facial bipartition",
      "distraction osteogenesis", "cranial vault remodeling",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2", "ICS1"],
    targetCaseCount: 15,
  },
  {
    id: "EPA7",
    title: "Burns",
    description: "Evaluate and manage patients with burn injuries including acute and reconstructive phases.",
    relatedProcedures: [
      "burn", "burn excision", "burn debridement", "escharotomy",
      "skin graft burn", "burn reconstruction", "contracture release",
      "integra", "dermal substitute",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "SBP1"],
    targetCaseCount: 20,
  },
  {
    id: "EPA8",
    title: "Aesthetic Surgery",
    description: "Evaluate and manage patients seeking aesthetic surgical procedures.",
    relatedProcedures: [
      "rhinoplasty", "abdominoplasty", "blepharoplasty", "facelift",
      "rhytidectomy", "liposuction", "breast augmentation",
      "breast reduction", "mastopexy", "brachioplasty", "body contouring",
      "otoplasty", "browlift",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "ICS1", "PROF1"],
    targetCaseCount: 30,
  },
  {
    id: "EPA9",
    title: "Lower Extremity Reconstruction",
    description: "Evaluate and manage patients with lower extremity wounds and reconstruction needs.",
    relatedProcedures: [
      "lower extremity reconstruction", "free flap leg", "sural flap",
      "soleus flap", "gastrocnemius flap", "wound vac", "negative pressure",
      "limb salvage", "fasciotomy", "chronic wound",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 20,
  },
  {
    id: "EPA10",
    title: "Skin Cancer and Melanoma",
    description: "Evaluate and manage patients with skin cancers requiring surgical excision and reconstruction.",
    relatedProcedures: [
      "melanoma", "wide local excision", "wle", "sentinel lymph node biopsy",
      "slnb", "mohs", "basal cell carcinoma", "squamous cell carcinoma",
      "skin cancer", "lymph node dissection", "merkel cell",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "ICS1"],
    targetCaseCount: 25,
  },
  {
    id: "EPA11",
    title: "Peripheral Nerve Surgery",
    description: "Evaluate and manage patients with peripheral nerve injuries and compression neuropathies.",
    relatedProcedures: [
      "nerve repair", "nerve graft", "nerve transfer", "nerve conduit",
      "brachial plexus", "carpal tunnel release", "cubital tunnel release",
      "ulnar nerve transposition", "peripheral nerve",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 15,
  },
];

const RCPSC_PLASTIC_EPAS: EpaDefinition[] = [
  { id: "FOD1", title: "Assessing acute plastic surgery patients", description: "Perform initial assessment of patients with wounds, burns, and hand injuries.", relatedProcedures: ["wound closure", "hand injury", "laceration", "burn", "skin graft", "local flap"], relatedMilestones: ["ME", "COM", "COL"], targetCaseCount: 25 },
  { id: "FOD2", title: "Performing basic wound management and closure", description: "Perform wound debridement, primary closure, and basic skin grafting.", relatedProcedures: ["wound closure", "skin graft", "stsg", "ftsg", "debridement", "local flap", "z-plasty"], relatedMilestones: ["ME", "P"], targetCaseCount: 35 },
  { id: "FOD3", title: "Providing perioperative plastic surgical care", description: "Manage plastic surgery patients through the perioperative period.", relatedProcedures: ["free flap", "breast reconstruction", "hand surgery", "skin graft", "burn"], relatedMilestones: ["ME", "COL", "L"], targetCaseCount: 25 },
  { id: "COD1", title: "Managing breast reconstruction", description: "Assess and manage patients requiring breast reconstruction.", relatedProcedures: ["breast reconstruction", "diep flap", "tram flap", "tissue expander", "implant reconstruction", "latissimus dorsi flap"], relatedMilestones: ["ME", "COM", "S"], targetCaseCount: 25 },
  { id: "COD2", title: "Managing hand and upper extremity conditions", description: "Assess and manage hand injuries, fractures, and tendon/nerve pathology.", relatedProcedures: ["flexor tendon repair", "extensor tendon repair", "hand fracture", "carpal tunnel release", "trigger finger", "dupuytren", "nerve repair"], relatedMilestones: ["ME", "S", "L"], targetCaseCount: 35 },
  { id: "COD3", title: "Performing microsurgical reconstruction", description: "Perform free tissue transfer for complex defects.", relatedProcedures: ["free flap", "microsurgery", "microvascular", "alt flap", "radial forearm free flap", "fibula free flap", "gracilis flap"], relatedMilestones: ["ME", "COM"], targetCaseCount: 20 },
  { id: "COD4", title: "Managing craniofacial conditions", description: "Assess and manage patients with craniofacial anomalies and deformities.", relatedProcedures: ["craniosynostosis", "cleft lip repair", "cleft palate repair", "orthognathic surgery", "craniofacial"], relatedMilestones: ["ME", "COM", "HA"], targetCaseCount: 15 },
  { id: "COD5", title: "Managing skin cancer", description: "Assess and manage skin cancers requiring excision and reconstruction.", relatedProcedures: ["melanoma", "wide local excision", "slnb", "skin cancer", "basal cell carcinoma", "squamous cell carcinoma", "mohs"], relatedMilestones: ["ME", "S", "L"], targetCaseCount: 20 },
  { id: "COD6", title: "Managing burn patients", description: "Assess and manage acute and reconstructive burn care.", relatedProcedures: ["burn", "burn excision", "escharotomy", "skin graft burn", "contracture release", "burn reconstruction"], relatedMilestones: ["ME", "COL", "L", "COM"], targetCaseCount: 15 },
  { id: "COD7", title: "Managing aesthetic surgery patients", description: "Assess and manage patients seeking aesthetic procedures.", relatedProcedures: ["rhinoplasty", "abdominoplasty", "blepharoplasty", "facelift", "liposuction", "breast augmentation", "breast reduction"], relatedMilestones: ["ME", "COM", "P"], targetCaseCount: 25 },
  { id: "COD8", title: "Managing lower extremity reconstruction", description: "Assess and manage complex lower extremity wounds and reconstruction.", relatedProcedures: ["lower extremity reconstruction", "free flap leg", "sural flap", "soleus flap", "wound vac", "limb salvage"], relatedMilestones: ["ME", "COL"], targetCaseCount: 15 },
  { id: "TTP1", title: "Providing comprehensive plastic surgical care", description: "Independently manage plastic surgery patients integrating all CanMEDS roles.", relatedProcedures: ["free flap", "breast reconstruction", "hand surgery", "skin graft", "rhinoplasty", "skin cancer"], relatedMilestones: ["ME", "COM", "COL", "L", "HA", "S", "P"], targetCaseCount: 30 },
  { id: "TTP2", title: "Managing a plastic surgical practice", description: "Demonstrate readiness for independent plastic surgical practice.", relatedProcedures: ["breast reconstruction", "hand surgery", "free flap", "skin cancer", "aesthetic"], relatedMilestones: ["L", "P", "COM", "COL"], targetCaseCount: 20 },
];

export const PLASTIC_ACGME: SpecialtyEpaData = {
  specialty: "Plastic Surgery",
  system: "ACGME",
  epas: PLASTIC_EPAS,
  milestones: SURGERY_MILESTONES,
};

export const PLASTIC_RCPSC: SpecialtyEpaData = {
  specialty: "Plastic Surgery",
  system: "RCPSC",
  epas: RCPSC_PLASTIC_EPAS,
  milestones: CANMEDS_MILESTONES,
};

// ── ENT / Otolaryngology EPAs ─────────────────────────────────────────────

const ENT_EPAS: EpaDefinition[] = [
  {
    id: "EPA1",
    title: "Tonsils and Adenoids",
    description: "Evaluate and manage patients with tonsillar and adenoid disease.",
    relatedProcedures: [
      "tonsillectomy", "adenoidectomy", "tonsil", "adenoid",
      "t&a", "peritonsillar abscess", "pta", "quinsy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1"],
    targetCaseCount: 30,
  },
  {
    id: "EPA2",
    title: "Sinonasal Disease",
    description: "Evaluate and manage patients with acute and chronic sinusitis and nasal pathology.",
    relatedProcedures: [
      "fess", "functional endoscopic sinus surgery", "endoscopic sinus surgery",
      "septoplasty", "turbinate reduction", "sinusitis", "nasal polyp",
      "polypectomy", "maxillary antrostomy", "ethmoidectomy",
      "frontal sinusotomy", "sphenoidotomy", "balloon sinuplasty",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 40,
  },
  {
    id: "EPA3",
    title: "Otologic Disease",
    description: "Evaluate and manage patients with middle ear and hearing pathology.",
    relatedProcedures: [
      "myringotomy", "tympanostomy tubes", "tubes", "pe tubes",
      "tympanoplasty", "mastoidectomy", "ossiculoplasty", "stapedectomy",
      "cholesteatoma", "chronic otitis media", "cochlear implant",
      "baha", "bone anchored hearing aid", "ear tube",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 35,
  },
  {
    id: "EPA4",
    title: "Head and Neck Cancer",
    description: "Evaluate and manage patients with head and neck malignancies.",
    relatedProcedures: [
      "neck dissection", "parotidectomy", "thyroidectomy", "laryngectomy",
      "total laryngectomy", "partial laryngectomy", "glossectomy",
      "mandibulectomy", "maxillectomy", "free flap", "tors",
      "transoral robotic surgery", "head and neck cancer", "squamous cell carcinoma",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2", "ICS1"],
    targetCaseCount: 25,
  },
  {
    id: "EPA5",
    title: "Thyroid and Parathyroid Surgery",
    description: "Evaluate and manage patients with thyroid and parathyroid disease requiring surgery.",
    relatedProcedures: [
      "thyroidectomy", "hemithyroidectomy", "thyroid lobectomy",
      "total thyroidectomy", "parathyroidectomy", "thyroid",
      "parathyroid", "thyroid nodule", "thyroid cancer",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 25,
  },
  {
    id: "EPA6",
    title: "Airway Management",
    description: "Evaluate and manage patients with upper airway obstruction and disorders.",
    relatedProcedures: [
      "tracheostomy", "tracheotomy", "microlaryngoscopy", "mlb",
      "direct laryngoscopy", "bronchoscopy", "airway foreign body",
      "laryngeal papilloma", "subglottic stenosis", "airway dilation",
      "tracheal resection", "laryngotracheal reconstruction",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2", "ICS2"],
    targetCaseCount: 25,
  },
  {
    id: "EPA7",
    title: "Salivary Gland Disease",
    description: "Evaluate and manage patients with salivary gland pathology.",
    relatedProcedures: [
      "parotidectomy", "submandibular gland excision", "sialendoscopy",
      "salivary gland", "parotid", "submandibular", "ranula",
      "salivary stone", "sialolithiasis",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 15,
  },
  {
    id: "EPA8",
    title: "Facial Trauma",
    description: "Evaluate and manage patients with facial fractures and soft tissue injuries.",
    relatedProcedures: [
      "mandible fracture", "orif mandible", "zygomatic fracture",
      "orbital fracture", "orbital floor repair", "nasal fracture",
      "nasal bone reduction", "le fort fracture", "frontal sinus fracture",
      "facial fracture", "facial laceration",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2", "ICS2"],
    targetCaseCount: 15,
  },
  {
    id: "EPA9",
    title: "Pediatric Otolaryngology",
    description: "Evaluate and manage pediatric ENT conditions.",
    relatedProcedures: [
      "tonsillectomy", "adenoidectomy", "myringotomy", "pe tubes",
      "airway foreign body", "laryngomalacia", "supraglottoplasty",
      "choanal atresia", "branchial cleft cyst", "thyroglossal duct cyst",
      "pediatric airway",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "ICS1"],
    targetCaseCount: 25,
  },
  {
    id: "EPA10",
    title: "Rhinology and Skull Base",
    description: "Evaluate and manage patients with advanced sinonasal and skull base pathology.",
    relatedProcedures: [
      "endoscopic skull base", "pituitary", "transsphenoidal",
      "csf leak repair", "anterior skull base", "sinonasal tumor",
      "inverted papilloma", "esthesioneuroblastoma", "nasopharyngeal",
      "orbital decompression",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 15,
  },
  {
    id: "EPA11",
    title: "Sleep Surgery",
    description: "Evaluate and manage patients with sleep-disordered breathing requiring surgical intervention.",
    relatedProcedures: [
      "uvulopalatopharyngoplasty", "uppp", "sleep apnea", "osa",
      "tonsillectomy", "inspire", "hypoglossal nerve stimulator",
      "drug-induced sleep endoscopy", "dise", "tongue base reduction",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "ICS1"],
    targetCaseCount: 10,
  },
  {
    id: "EPA12",
    title: "Facial Plastic and Reconstructive Surgery",
    description: "Evaluate and manage patients requiring facial plastic and reconstructive procedures.",
    relatedProcedures: [
      "rhinoplasty", "septorhinoplasty", "otoplasty", "blepharoplasty",
      "facelift", "local flap face", "skin cancer excision face",
      "mohs reconstruction", "scar revision", "facial reanimation",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2", "ICS1"],
    targetCaseCount: 15,
  },
];

const RCPSC_ENT_EPAS: EpaDefinition[] = [
  { id: "FOD1", title: "Assessing acute otolaryngology patients", description: "Perform initial assessment of undifferentiated ENT patients.", relatedProcedures: ["tonsillectomy", "tracheostomy", "epistaxis", "peritonsillar abscess", "airway foreign body", "facial fracture"], relatedMilestones: ["ME", "COM", "COL"], targetCaseCount: 25 },
  { id: "FOD2", title: "Performing basic ENT procedures", description: "Perform tonsillectomy, adenoidectomy, myringotomy, and basic endoscopy.", relatedProcedures: ["tonsillectomy", "adenoidectomy", "myringotomy", "tubes", "nasal endoscopy", "epistaxis management"], relatedMilestones: ["ME", "P"], targetCaseCount: 35 },
  { id: "FOD3", title: "Providing perioperative ENT care", description: "Manage ENT patients through the perioperative period.", relatedProcedures: ["tonsillectomy", "septoplasty", "fess", "thyroidectomy", "tracheostomy", "neck dissection"], relatedMilestones: ["ME", "COL", "L"], targetCaseCount: 25 },
  { id: "COD1", title: "Managing sinonasal disease", description: "Assess and manage patients with sinusitis and nasal pathology.", relatedProcedures: ["fess", "septoplasty", "turbinate reduction", "nasal polyp", "balloon sinuplasty", "ethmoidectomy", "frontal sinusotomy"], relatedMilestones: ["ME", "COM", "S"], targetCaseCount: 35 },
  { id: "COD2", title: "Managing otologic disease", description: "Assess and manage patients with middle ear and hearing disorders.", relatedProcedures: ["tympanoplasty", "mastoidectomy", "ossiculoplasty", "stapedectomy", "cholesteatoma", "cochlear implant", "myringotomy"], relatedMilestones: ["ME", "S", "L"], targetCaseCount: 30 },
  { id: "COD3", title: "Managing head and neck cancer", description: "Assess and manage patients with head and neck malignancies.", relatedProcedures: ["neck dissection", "laryngectomy", "glossectomy", "mandibulectomy", "parotidectomy", "tors", "free flap", "head and neck cancer"], relatedMilestones: ["ME", "COM", "HA"], targetCaseCount: 25 },
  { id: "COD4", title: "Managing thyroid and parathyroid disease", description: "Assess and manage patients with thyroid and parathyroid conditions.", relatedProcedures: ["thyroidectomy", "hemithyroidectomy", "parathyroidectomy", "thyroid cancer", "thyroid nodule"], relatedMilestones: ["ME", "COM", "P"], targetCaseCount: 20 },
  { id: "COD5", title: "Managing airway disorders", description: "Assess and manage upper airway obstruction and disorders.", relatedProcedures: ["tracheostomy", "microlaryngoscopy", "bronchoscopy", "airway dilation", "subglottic stenosis", "laryngotracheal reconstruction"], relatedMilestones: ["ME", "COL", "L", "COM"], targetCaseCount: 20 },
  { id: "COD6", title: "Managing facial trauma", description: "Assess and manage facial fractures and soft tissue injuries.", relatedProcedures: ["mandible fracture", "orbital fracture", "nasal fracture", "zygomatic fracture", "le fort fracture", "facial fracture"], relatedMilestones: ["ME", "COL"], targetCaseCount: 15 },
  { id: "COD7", title: "Managing pediatric ENT conditions", description: "Assess and manage pediatric otolaryngologic conditions.", relatedProcedures: ["tonsillectomy", "adenoidectomy", "myringotomy", "airway foreign body", "laryngomalacia", "branchial cleft cyst", "thyroglossal duct cyst"], relatedMilestones: ["ME", "COM", "HA"], targetCaseCount: 20 },
  { id: "COD8", title: "Managing facial plastic and reconstructive conditions", description: "Assess and manage patients requiring facial plastic procedures.", relatedProcedures: ["rhinoplasty", "septorhinoplasty", "otoplasty", "mohs reconstruction", "local flap face", "facial reanimation"], relatedMilestones: ["ME", "COM", "S"], targetCaseCount: 15 },
  { id: "TTP1", title: "Providing comprehensive otolaryngologic care", description: "Independently manage ENT patients integrating all CanMEDS roles.", relatedProcedures: ["fess", "tonsillectomy", "thyroidectomy", "neck dissection", "tympanoplasty", "tracheostomy"], relatedMilestones: ["ME", "COM", "COL", "L", "HA", "S", "P"], targetCaseCount: 30 },
  { id: "TTP2", title: "Managing an otolaryngology practice", description: "Demonstrate readiness for independent ENT practice.", relatedProcedures: ["fess", "tonsillectomy", "thyroidectomy", "tympanoplasty", "septoplasty"], relatedMilestones: ["L", "P", "COM", "COL"], targetCaseCount: 20 },
];

export const ENT_ACGME: SpecialtyEpaData = {
  specialty: "Otolaryngology - Head & Neck Surgery",
  system: "ACGME",
  epas: ENT_EPAS,
  milestones: SURGERY_MILESTONES,
};

export const ENT_RCPSC: SpecialtyEpaData = {
  specialty: "Otolaryngology - Head & Neck Surgery",
  system: "RCPSC",
  epas: RCPSC_ENT_EPAS,
  milestones: CANMEDS_MILESTONES,
};

// ── OB-GYN EPAs ───────────────────────────────────────────────────────────

const OBGYN_EPAS: EpaDefinition[] = [
  {
    id: "EPA1",
    title: "Cesarean Delivery",
    description: "Evaluate and manage patients requiring cesarean section delivery.",
    relatedProcedures: [
      "cesarean section", "c-section", "cs", "cesarean", "c section",
      "repeat cesarean", "classical cesarean", "low transverse cesarean",
      "emergency cesarean", "stat cs", "primary cesarean",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 70,
  },
  {
    id: "EPA2",
    title: "Vaginal Delivery and Operative Vaginal Delivery",
    description: "Manage vaginal deliveries including operative vaginal deliveries.",
    relatedProcedures: [
      "vaginal delivery", "spontaneous vaginal delivery", "svd",
      "forceps delivery", "vacuum delivery", "operative vaginal delivery",
      "episiotomy", "perineal repair", "third degree tear", "fourth degree tear",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1"],
    targetCaseCount: 80,
  },
  {
    id: "EPA3",
    title: "Hysterectomy",
    description: "Evaluate and manage patients requiring hysterectomy for benign and malignant indications.",
    relatedProcedures: [
      "hysterectomy", "total abdominal hysterectomy", "tah",
      "total laparoscopic hysterectomy", "tlh", "vaginal hysterectomy",
      "robotic hysterectomy", "supracervical hysterectomy",
      "radical hysterectomy", "laparoscopic hysterectomy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 40,
  },
  {
    id: "EPA4",
    title: "Ectopic Pregnancy",
    description: "Evaluate and manage patients with ectopic pregnancy.",
    relatedProcedures: [
      "ectopic pregnancy", "salpingectomy", "salpingostomy",
      "laparoscopic salpingectomy", "ruptured ectopic",
      "tubal pregnancy", "ectopic",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "ICS2"],
    targetCaseCount: 15,
  },
  {
    id: "EPA5",
    title: "Adnexal Pathology",
    description: "Evaluate and manage patients with ovarian cysts, masses, and adnexal pathology.",
    relatedProcedures: [
      "ovarian cystectomy", "oophorectomy", "salpingo-oophorectomy",
      "bso", "ovarian torsion", "ovarian cyst", "adnexal mass",
      "laparoscopic cystectomy", "adnexal", "dermoid", "endometrioma",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 25,
  },
  {
    id: "EPA6",
    title: "Endometriosis",
    description: "Evaluate and manage patients with endometriosis including surgical treatment.",
    relatedProcedures: [
      "endometriosis", "endometriosis excision", "laparoscopy for endometriosis",
      "deep infiltrating endometriosis", "die", "ablation endometriosis",
      "adhesiolysis", "uterosacral ligament",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "ICS1"],
    targetCaseCount: 20,
  },
  {
    id: "EPA7",
    title: "Abnormal Uterine Bleeding and Fibroids",
    description: "Evaluate and manage patients with abnormal uterine bleeding and uterine fibroids.",
    relatedProcedures: [
      "myomectomy", "hysteroscopy", "hysteroscopic myomectomy",
      "endometrial ablation", "d&c", "dilation and curettage",
      "fibroid", "leiomyoma", "uterine artery embolization", "uae",
      "laparoscopic myomectomy", "abdominal myomectomy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1"],
    targetCaseCount: 30,
  },
  {
    id: "EPA8",
    title: "Pelvic Floor Disorders",
    description: "Evaluate and manage patients with pelvic organ prolapse and urinary incontinence.",
    relatedProcedures: [
      "prolapse repair", "anterior repair", "posterior repair",
      "sacrocolpopexy", "colpocleisis", "sling", "mid-urethral sling",
      "cystocele", "rectocele", "vaginal vault prolapse",
      "uterine prolapse", "pelvic floor repair",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "ICS1"],
    targetCaseCount: 20,
  },
  {
    id: "EPA9",
    title: "Gynecologic Oncology",
    description: "Evaluate and manage patients with gynecologic malignancies.",
    relatedProcedures: [
      "radical hysterectomy", "staging laparotomy", "omentectomy",
      "lymph node dissection", "pelvic lymphadenectomy", "para-aortic lymphadenectomy",
      "debulking", "cytoreduction", "vulvectomy", "cervical conization",
      "cone biopsy", "leep", "endometrial cancer", "ovarian cancer", "cervical cancer",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2", "ICS1"],
    targetCaseCount: 15,
  },
  {
    id: "EPA10",
    title: "Obstetric Emergencies",
    description: "Evaluate and manage obstetric emergencies including hemorrhage and shoulder dystocia.",
    relatedProcedures: [
      "postpartum hemorrhage", "pph", "b-lynch suture", "uterine tamponade",
      "shoulder dystocia", "cord prolapse", "placenta accreta",
      "cesarean hysterectomy", "peripartum hysterectomy",
      "manual removal of placenta", "uterine inversion",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "ICS2", "PROF2"],
    targetCaseCount: 15,
  },
  {
    id: "EPA11",
    title: "Family Planning Procedures",
    description: "Perform surgical family planning procedures including sterilization and pregnancy termination.",
    relatedProcedures: [
      "tubal ligation", "bilateral tubal ligation", "btl", "salpingectomy",
      "dilation and evacuation", "d&e", "d&c", "iud insertion",
      "nexplanon", "implant insertion", "hysteroscopic sterilization",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "ICS1", "PROF1"],
    targetCaseCount: 20,
  },
  {
    id: "EPA12",
    title: "Minimally Invasive Gynecologic Surgery",
    description: "Perform diagnostic and operative laparoscopy and hysteroscopy.",
    relatedProcedures: [
      "diagnostic laparoscopy", "operative laparoscopy", "hysteroscopy",
      "robotic surgery", "single port laparoscopy",
      "laparoscopic hysterectomy", "laparoscopic myomectomy",
      "laparoscopic salpingectomy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 35,
  },
];

const RCPSC_OBGYN_EPAS: EpaDefinition[] = [
  { id: "FOD1", title: "Assessing acute obstetric patients", description: "Perform initial assessment of patients presenting in labor or with obstetric emergencies.", relatedProcedures: ["cesarean section", "vaginal delivery", "ectopic pregnancy", "postpartum hemorrhage", "shoulder dystocia"], relatedMilestones: ["ME", "COM", "COL"], targetCaseCount: 30 },
  { id: "FOD2", title: "Performing basic obstetric procedures", description: "Perform vaginal deliveries, assist cesarean sections, and manage basic obstetric emergencies.", relatedProcedures: ["vaginal delivery", "svd", "cesarean section", "episiotomy", "perineal repair", "manual removal of placenta"], relatedMilestones: ["ME", "P"], targetCaseCount: 50 },
  { id: "FOD3", title: "Performing basic gynecologic procedures", description: "Perform basic gynecologic assessments and procedures.", relatedProcedures: ["d&c", "hysteroscopy", "iud insertion", "colposcopy", "leep", "diagnostic laparoscopy"], relatedMilestones: ["ME", "COM"], targetCaseCount: 30 },
  { id: "FOD4", title: "Providing perioperative obstetric and gynecologic care", description: "Manage OB-GYN patients through the perioperative period.", relatedProcedures: ["cesarean section", "hysterectomy", "myomectomy", "salpingectomy", "oophorectomy"], relatedMilestones: ["ME", "COL", "L"], targetCaseCount: 25 },
  { id: "COD1", title: "Managing cesarean delivery", description: "Assess and manage patients requiring cesarean delivery.", relatedProcedures: ["cesarean section", "c-section", "repeat cesarean", "emergency cesarean", "primary cesarean"], relatedMilestones: ["ME", "COM", "S"], targetCaseCount: 60 },
  { id: "COD2", title: "Managing complex vaginal deliveries", description: "Manage operative vaginal deliveries and labor complications.", relatedProcedures: ["forceps delivery", "vacuum delivery", "shoulder dystocia", "postpartum hemorrhage", "perineal repair", "cord prolapse"], relatedMilestones: ["ME", "COL", "L"], targetCaseCount: 40 },
  { id: "COD3", title: "Managing benign gynecologic conditions", description: "Assess and manage fibroids, endometriosis, and adnexal masses.", relatedProcedures: ["hysterectomy", "myomectomy", "endometriosis excision", "ovarian cystectomy", "oophorectomy", "adnexal mass"], relatedMilestones: ["ME", "COM"], targetCaseCount: 30 },
  { id: "COD4", title: "Managing pelvic floor disorders", description: "Assess and manage pelvic organ prolapse and urinary incontinence.", relatedProcedures: ["prolapse repair", "sacrocolpopexy", "sling", "cystocele", "rectocele", "colpocleisis"], relatedMilestones: ["ME", "COM", "P"], targetCaseCount: 15 },
  { id: "COD5", title: "Managing gynecologic oncology conditions", description: "Assess and manage patients with gynecologic malignancies.", relatedProcedures: ["radical hysterectomy", "staging laparotomy", "debulking", "lymph node dissection", "vulvectomy", "endometrial cancer", "ovarian cancer"], relatedMilestones: ["ME", "COM", "HA"], targetCaseCount: 15 },
  { id: "COD6", title: "Performing minimally invasive gynecologic surgery", description: "Perform operative laparoscopy, hysteroscopy, and robotic procedures.", relatedProcedures: ["laparoscopic hysterectomy", "robotic hysterectomy", "hysteroscopy", "laparoscopic myomectomy", "laparoscopic salpingectomy"], relatedMilestones: ["ME", "S", "L"], targetCaseCount: 30 },
  { id: "COD7", title: "Managing obstetric emergencies", description: "Lead management of obstetric emergencies.", relatedProcedures: ["postpartum hemorrhage", "shoulder dystocia", "cord prolapse", "placenta accreta", "cesarean hysterectomy", "uterine inversion"], relatedMilestones: ["ME", "COL", "L", "COM"], targetCaseCount: 15 },
  { id: "COD8", title: "Managing family planning and early pregnancy complications", description: "Manage family planning procedures and early pregnancy loss.", relatedProcedures: ["tubal ligation", "salpingectomy", "d&c", "d&e", "ectopic pregnancy", "iud insertion"], relatedMilestones: ["ME", "COM", "HA"], targetCaseCount: 20 },
  { id: "TTP1", title: "Providing comprehensive obstetric and gynecologic care", description: "Independently manage OB-GYN patients integrating all CanMEDS roles.", relatedProcedures: ["cesarean section", "hysterectomy", "vaginal delivery", "myomectomy", "salpingectomy"], relatedMilestones: ["ME", "COM", "COL", "L", "HA", "S", "P"], targetCaseCount: 30 },
  { id: "TTP2", title: "Managing an OB-GYN practice", description: "Demonstrate readiness for independent OB-GYN practice.", relatedProcedures: ["cesarean section", "vaginal delivery", "hysterectomy", "laparoscopy"], relatedMilestones: ["L", "P", "COM", "COL"], targetCaseCount: 20 },
];

export const OBGYN_ACGME: SpecialtyEpaData = {
  specialty: "Obstetrics & Gynecology",
  system: "ACGME",
  epas: OBGYN_EPAS,
  milestones: SURGERY_MILESTONES,
};

export const OBGYN_RCPSC: SpecialtyEpaData = {
  specialty: "Obstetrics & Gynecology",
  system: "RCPSC",
  epas: RCPSC_OBGYN_EPAS,
  milestones: CANMEDS_MILESTONES,
};

// ── Ophthalmology EPAs ────────────────────────────────────────────────────

const OPHTHALMOLOGY_EPAS: EpaDefinition[] = [
  {
    id: "EPA1",
    title: "Cataract Surgery",
    description: "Evaluate and manage patients with cataracts requiring phacoemulsification and lens implantation.",
    relatedProcedures: [
      "cataract", "phacoemulsification", "phaco", "iol", "lens implant",
      "cataract extraction", "ecce", "icce", "posterior capsulotomy",
      "yag capsulotomy", "secondary iol", "lens exchange",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 86,
  },
  {
    id: "EPA2",
    title: "Glaucoma",
    description: "Evaluate and manage patients with glaucoma including medical and surgical treatment.",
    relatedProcedures: [
      "trabeculectomy", "glaucoma drainage device", "tube shunt",
      "ahmed valve", "baerveldt", "migs", "istent", "goniotomy",
      "trabectome", "cyclophotocoagulation", "cpc", "slt",
      "selective laser trabeculoplasty", "glaucoma",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 25,
  },
  {
    id: "EPA3",
    title: "Retinal Disease",
    description: "Evaluate and manage patients with retinal pathology including vitreoretinal surgery.",
    relatedProcedures: [
      "vitrectomy", "pars plana vitrectomy", "ppv", "retinal detachment repair",
      "scleral buckle", "membrane peel", "epiretinal membrane",
      "macular hole repair", "intravitreal injection", "anti-vegf",
      "laser photocoagulation", "retinal laser", "pneumatic retinopexy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 20,
  },
  {
    id: "EPA4",
    title: "Corneal Disease",
    description: "Evaluate and manage patients with corneal pathology including transplantation.",
    relatedProcedures: [
      "corneal transplant", "penetrating keratoplasty", "pk", "dsaek",
      "dmek", "dalk", "corneal cross-linking", "cxl", "pterygium excision",
      "pterygium", "corneal laceration", "corneal foreign body",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 15,
  },
  {
    id: "EPA5",
    title: "Strabismus",
    description: "Evaluate and manage patients with strabismus and ocular motility disorders.",
    relatedProcedures: [
      "strabismus surgery", "eye muscle surgery", "recession", "resection",
      "strabismus", "esotropia", "exotropia", "botox injection eye",
      "adjustable suture",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1"],
    targetCaseCount: 15,
  },
  {
    id: "EPA6",
    title: "Oculoplastics",
    description: "Evaluate and manage patients with eyelid, lacrimal, and orbital pathology.",
    relatedProcedures: [
      "blepharoplasty", "ptosis repair", "ectropion repair", "entropion repair",
      "dcr", "dacryocystorhinostomy", "orbital decompression",
      "orbital fracture repair", "eyelid tumor excision", "eyelid laceration",
      "lacrimal", "chalazion excision", "enucleation", "evisceration",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 20,
  },
  {
    id: "EPA7",
    title: "Refractive Surgery",
    description: "Evaluate and manage patients seeking refractive correction procedures.",
    relatedProcedures: [
      "lasik", "prk", "smile", "refractive lens exchange", "rle",
      "iol", "phakic iol", "icl", "refractive surgery",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "ICS1"],
    targetCaseCount: 10,
  },
  {
    id: "EPA8",
    title: "Ocular Trauma",
    description: "Evaluate and manage patients with ocular trauma including open globe injuries.",
    relatedProcedures: [
      "open globe repair", "globe repair", "corneal laceration repair",
      "scleral laceration", "iofb removal", "intraocular foreign body",
      "hyphema", "orbital fracture", "lid laceration repair",
      "ruptured globe", "ocular trauma",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "ICS2"],
    targetCaseCount: 10,
  },
  {
    id: "EPA9",
    title: "Pediatric Ophthalmology",
    description: "Evaluate and manage pediatric ophthalmic conditions.",
    relatedProcedures: [
      "pediatric cataract", "strabismus surgery", "nasolacrimal duct probing",
      "nld probing", "exam under anesthesia", "eua", "retinopathy of prematurity",
      "rop screening", "pediatric glaucoma", "amblyopia",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "ICS1"],
    targetCaseCount: 15,
  },
  {
    id: "EPA10",
    title: "Intravitreal Injections and Office Procedures",
    description: "Perform office-based ophthalmic procedures including injections and laser.",
    relatedProcedures: [
      "intravitreal injection", "anti-vegf", "avastin", "lucentis", "eylea",
      "yag capsulotomy", "yag pi", "slt", "argon laser",
      "fluorescein angiography", "chalazion", "punctal plug",
    ],
    relatedMilestones: ["PC1", "PC2", "MK1", "SBP1"],
    targetCaseCount: 40,
  },
];

const RCPSC_OPHTHALMOLOGY_EPAS: EpaDefinition[] = [
  { id: "FOD1", title: "Assessing acute ophthalmic patients", description: "Perform initial assessment of patients with acute visual loss, red eye, and ocular trauma.", relatedProcedures: ["open globe repair", "corneal foreign body", "ocular trauma", "retinal detachment", "acute glaucoma"], relatedMilestones: ["ME", "COM", "COL"], targetCaseCount: 25 },
  { id: "FOD2", title: "Performing comprehensive eye examination", description: "Perform a complete ophthalmic examination including slit lamp, fundoscopy, and tonometry.", relatedProcedures: ["cataract", "glaucoma", "retinal disease", "strabismus", "corneal disease", "eyelid"], relatedMilestones: ["ME", "P"], targetCaseCount: 40 },
  { id: "FOD3", title: "Providing perioperative ophthalmic care", description: "Manage ophthalmic patients through the perioperative period.", relatedProcedures: ["cataract", "vitrectomy", "trabeculectomy", "strabismus surgery", "corneal transplant"], relatedMilestones: ["ME", "COL", "L"], targetCaseCount: 25 },
  { id: "COD1", title: "Managing cataract disease", description: "Assess and manage patients requiring cataract surgery.", relatedProcedures: ["phacoemulsification", "phaco", "iol", "cataract extraction", "posterior capsulotomy", "secondary iol"], relatedMilestones: ["ME", "COM", "S"], targetCaseCount: 80 },
  { id: "COD2", title: "Managing glaucoma", description: "Assess and manage patients with glaucoma.", relatedProcedures: ["trabeculectomy", "glaucoma drainage device", "migs", "istent", "slt", "cyclophotocoagulation", "glaucoma"], relatedMilestones: ["ME", "S", "L"], targetCaseCount: 20 },
  { id: "COD3", title: "Managing retinal disease", description: "Assess and manage patients with retinal pathology.", relatedProcedures: ["vitrectomy", "ppv", "retinal detachment repair", "scleral buckle", "intravitreal injection", "retinal laser", "epiretinal membrane"], relatedMilestones: ["ME", "COM"], targetCaseCount: 20 },
  { id: "COD4", title: "Managing corneal disease", description: "Assess and manage patients with corneal pathology.", relatedProcedures: ["corneal transplant", "pk", "dsaek", "dmek", "pterygium excision", "corneal cross-linking"], relatedMilestones: ["ME", "S", "L"], targetCaseCount: 15 },
  { id: "COD5", title: "Managing oculoplastic conditions", description: "Assess and manage eyelid, lacrimal, and orbital conditions.", relatedProcedures: ["blepharoplasty", "ptosis repair", "dcr", "orbital decompression", "eyelid tumor excision", "enucleation"], relatedMilestones: ["ME", "COM", "P"], targetCaseCount: 15 },
  { id: "COD6", title: "Managing strabismus and pediatric ophthalmology", description: "Assess and manage strabismus and pediatric ophthalmic conditions.", relatedProcedures: ["strabismus surgery", "pediatric cataract", "nld probing", "eua", "rop screening", "amblyopia"], relatedMilestones: ["ME", "COM", "HA"], targetCaseCount: 15 },
  { id: "COD7", title: "Performing office-based ophthalmic procedures", description: "Perform intravitreal injections, laser procedures, and minor office procedures.", relatedProcedures: ["intravitreal injection", "anti-vegf", "yag capsulotomy", "slt", "argon laser", "chalazion", "punctal plug"], relatedMilestones: ["ME", "COL"], targetCaseCount: 35 },
  { id: "TTP1", title: "Providing comprehensive ophthalmic care", description: "Independently manage ophthalmic patients integrating all CanMEDS roles.", relatedProcedures: ["phacoemulsification", "vitrectomy", "trabeculectomy", "strabismus surgery", "intravitreal injection"], relatedMilestones: ["ME", "COM", "COL", "L", "HA", "S", "P"], targetCaseCount: 30 },
  { id: "TTP2", title: "Managing an ophthalmology practice", description: "Demonstrate readiness for independent ophthalmic practice.", relatedProcedures: ["phacoemulsification", "intravitreal injection", "laser", "glaucoma", "cataract"], relatedMilestones: ["L", "P", "COM", "COL"], targetCaseCount: 20 },
];

export const OPHTHALMOLOGY_ACGME: SpecialtyEpaData = {
  specialty: "Ophthalmology",
  system: "ACGME",
  epas: OPHTHALMOLOGY_EPAS,
  milestones: SURGERY_MILESTONES,
};

export const OPHTHALMOLOGY_RCPSC: SpecialtyEpaData = {
  specialty: "Ophthalmology",
  system: "RCPSC",
  epas: RCPSC_OPHTHALMOLOGY_EPAS,
  milestones: CANMEDS_MILESTONES,
};

// ── Pediatric Surgery EPAs ────────────────────────────────────────────────

const PEDIATRIC_EPAS: EpaDefinition[] = [
  {
    id: "EPA1",
    title: "Neonatal Abdominal Emergencies",
    description: "Evaluate and manage neonates with abdominal emergencies including intestinal obstruction and NEC.",
    relatedProcedures: [
      "neonatal laparotomy", "intestinal atresia", "malrotation",
      "ladd procedure", "meconium ileus", "necrotizing enterocolitis", "nec",
      "hirschsprung", "anorectal malformation", "imperforate anus",
      "gastroschisis", "omphalocele",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 25,
  },
  {
    id: "EPA2",
    title: "Pediatric Appendicitis",
    description: "Evaluate and manage children with appendicitis.",
    relatedProcedures: [
      "pediatric appendectomy", "appendectomy", "laparoscopic appendectomy",
      "appendicitis", "perforated appendicitis", "appendiceal abscess",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1"],
    targetCaseCount: 30,
  },
  {
    id: "EPA3",
    title: "Inguinal Hernia and Hydrocele",
    description: "Evaluate and manage pediatric inguinal hernias and hydroceles.",
    relatedProcedures: [
      "pediatric inguinal hernia", "inguinal hernia repair", "hydrocele",
      "hydrocelectomy", "incarcerated hernia", "hernia",
      "processus vaginalis", "communicating hydrocele",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1"],
    targetCaseCount: 30,
  },
  {
    id: "EPA4",
    title: "Pyloric Stenosis",
    description: "Evaluate and manage infants with hypertrophic pyloric stenosis.",
    relatedProcedures: [
      "pyloromyotomy", "ramstedt", "pyloric stenosis",
      "laparoscopic pyloromyotomy", "open pyloromyotomy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1"],
    targetCaseCount: 10,
  },
  {
    id: "EPA5",
    title: "Pediatric Solid Tumors",
    description: "Evaluate and manage children with solid tumors including Wilms tumor, neuroblastoma, and hepatoblastoma.",
    relatedProcedures: [
      "wilms tumor", "nephrectomy", "neuroblastoma", "hepatoblastoma",
      "liver resection", "tumor resection", "biopsy", "lymph node biopsy",
      "rhabdomyosarcoma", "teratoma", "sacrococcygeal teratoma",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2", "ICS1"],
    targetCaseCount: 15,
  },
  {
    id: "EPA6",
    title: "Congenital Diaphragmatic Hernia",
    description: "Evaluate and manage neonates with congenital diaphragmatic hernia.",
    relatedProcedures: [
      "cdh", "congenital diaphragmatic hernia", "diaphragmatic hernia repair",
      "ecmo", "diaphragm repair", "diaphragm patch",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2", "ICS2"],
    targetCaseCount: 5,
  },
  {
    id: "EPA7",
    title: "Esophageal Atresia and TEF",
    description: "Evaluate and manage neonates with esophageal atresia and tracheoesophageal fistula.",
    relatedProcedures: [
      "esophageal atresia", "tracheoesophageal fistula", "tef",
      "tef repair", "esophageal repair", "thoracotomy neonatal",
      "esophageal replacement", "gastric pull-up",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 5,
  },
  {
    id: "EPA8",
    title: "Pediatric Trauma",
    description: "Evaluate and manage pediatric trauma patients.",
    relatedProcedures: [
      "pediatric trauma", "splenectomy", "liver laceration",
      "exploratory laparotomy", "chest tube", "pediatric fracture",
      "non-operative management", "solid organ injury",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "ICS2"],
    targetCaseCount: 15,
  },
  {
    id: "EPA9",
    title: "Undescended Testis",
    description: "Evaluate and manage children with undescended testes.",
    relatedProcedures: [
      "orchiopexy", "orchidopexy", "undescended testis",
      "laparoscopic orchiopexy", "fowler-stephens", "inguinal orchiopexy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1"],
    targetCaseCount: 15,
  },
  {
    id: "EPA10",
    title: "Pediatric Minimally Invasive Surgery",
    description: "Perform laparoscopic and thoracoscopic procedures in children.",
    relatedProcedures: [
      "laparoscopic", "thoracoscopic", "laparoscopic pyloromyotomy",
      "laparoscopic appendectomy", "laparoscopic cholecystectomy",
      "laparoscopic fundoplication", "nissen", "pediatric laparoscopy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 25,
  },
  {
    id: "EPA11",
    title: "Vascular Access and Central Lines",
    description: "Perform vascular access procedures in pediatric patients.",
    relatedProcedures: [
      "central line", "central venous catheter", "broviac", "hickman",
      "port-a-cath", "picc", "pediatric central line", "tunneled catheter",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1"],
    targetCaseCount: 20,
  },
];

const RCPSC_PEDIATRIC_EPAS: EpaDefinition[] = [
  { id: "FOD1", title: "Assessing acute pediatric surgical patients", description: "Perform initial assessment of children with acute surgical conditions.", relatedProcedures: ["appendectomy", "hernia", "pyloric stenosis", "intussusception", "neonatal emergency"], relatedMilestones: ["ME", "COM", "COL"], targetCaseCount: 25 },
  { id: "FOD2", title: "Performing basic pediatric surgical procedures", description: "Perform appendectomy, hernia repair, and basic procedures in children.", relatedProcedures: ["appendectomy", "inguinal hernia repair", "hydrocelectomy", "circumcision", "central line"], relatedMilestones: ["ME", "P"], targetCaseCount: 30 },
  { id: "FOD3", title: "Providing perioperative care for pediatric patients", description: "Manage children through the perioperative period.", relatedProcedures: ["appendectomy", "pyloromyotomy", "hernia repair", "neonatal surgery", "laparoscopy"], relatedMilestones: ["ME", "COL", "L"], targetCaseCount: 25 },
  { id: "COD1", title: "Managing neonatal surgical emergencies", description: "Assess and manage neonates with abdominal emergencies.", relatedProcedures: ["intestinal atresia", "malrotation", "ladd procedure", "nec", "hirschsprung", "gastroschisis", "omphalocele", "meconium ileus"], relatedMilestones: ["ME", "COM", "S"], targetCaseCount: 20 },
  { id: "COD2", title: "Managing congenital anomalies", description: "Assess and manage congenital diaphragmatic hernia, esophageal atresia, and other anomalies.", relatedProcedures: ["cdh", "esophageal atresia", "tef", "anorectal malformation", "imperforate anus", "diaphragmatic hernia repair"], relatedMilestones: ["ME", "COM", "HA"], targetCaseCount: 10 },
  { id: "COD3", title: "Managing pediatric solid tumors", description: "Assess and manage children with solid malignancies.", relatedProcedures: ["wilms tumor", "neuroblastoma", "hepatoblastoma", "rhabdomyosarcoma", "teratoma", "sacrococcygeal teratoma", "tumor resection"], relatedMilestones: ["ME", "S", "L"], targetCaseCount: 15 },
  { id: "COD4", title: "Managing common pediatric surgical conditions", description: "Assess and manage appendicitis, pyloric stenosis, intussusception, and hernias.", relatedProcedures: ["appendectomy", "pyloromyotomy", "inguinal hernia repair", "hydrocelectomy", "orchiopexy", "umbilical hernia"], relatedMilestones: ["ME", "COM"], targetCaseCount: 35 },
  { id: "COD5", title: "Managing pediatric trauma", description: "Assess and manage injured children.", relatedProcedures: ["pediatric trauma", "splenectomy", "exploratory laparotomy", "chest tube", "solid organ injury", "liver laceration"], relatedMilestones: ["ME", "COL", "L", "COM"], targetCaseCount: 15 },
  { id: "COD6", title: "Performing pediatric minimally invasive surgery", description: "Perform laparoscopic and thoracoscopic procedures in children.", relatedProcedures: ["laparoscopic appendectomy", "laparoscopic pyloromyotomy", "laparoscopic cholecystectomy", "laparoscopic fundoplication", "thoracoscopic"], relatedMilestones: ["ME", "S"], targetCaseCount: 20 },
  { id: "TTP1", title: "Providing comprehensive pediatric surgical care", description: "Independently manage pediatric surgical patients integrating all CanMEDS roles.", relatedProcedures: ["appendectomy", "hernia repair", "pyloromyotomy", "neonatal surgery", "tumor resection", "laparoscopy"], relatedMilestones: ["ME", "COM", "COL", "L", "HA", "S", "P"], targetCaseCount: 30 },
  { id: "TTP2", title: "Managing a pediatric surgical practice", description: "Demonstrate readiness for independent pediatric surgical practice.", relatedProcedures: ["appendectomy", "hernia repair", "neonatal surgery", "laparoscopy"], relatedMilestones: ["L", "P", "COM", "COL"], targetCaseCount: 20 },
];

export const PEDIATRIC_ACGME: SpecialtyEpaData = {
  specialty: "Pediatric Surgery",
  system: "ACGME",
  epas: PEDIATRIC_EPAS,
  milestones: SURGERY_MILESTONES,
};

export const PEDIATRIC_RCPSC: SpecialtyEpaData = {
  specialty: "Pediatric Surgery",
  system: "RCPSC",
  epas: RCPSC_PEDIATRIC_EPAS,
  milestones: CANMEDS_MILESTONES,
};

// ── Thoracic Surgery EPAs ─────────────────────────────────────────────────

const THORACIC_EPAS: EpaDefinition[] = [
  {
    id: "EPA1",
    title: "Lung Cancer - Lobectomy",
    description: "Evaluate and manage patients with lung cancer requiring lobectomy.",
    relatedProcedures: [
      "lobectomy", "vats lobectomy", "robotic lobectomy", "thoracotomy",
      "open lobectomy", "lung cancer", "lung resection", "bilobectomy",
      "sleeve lobectomy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 30,
  },
  {
    id: "EPA2",
    title: "Lung Cancer - Sublobar Resection",
    description: "Evaluate and manage patients with lung nodules and early-stage cancer requiring wedge resection or segmentectomy.",
    relatedProcedures: [
      "wedge resection", "segmentectomy", "vats wedge", "thoracoscopic wedge",
      "lung nodule", "pulmonary nodule", "sublobar resection",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 25,
  },
  {
    id: "EPA3",
    title: "Pneumothorax and Pleural Disease",
    description: "Evaluate and manage patients with pneumothorax and pleural effusions.",
    relatedProcedures: [
      "chest tube", "tube thoracostomy", "vats", "pleurodesis",
      "decortication", "thoracentesis", "pleural biopsy",
      "pneumothorax", "pleural effusion", "empyema", "vats decortication",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1"],
    targetCaseCount: 25,
  },
  {
    id: "EPA4",
    title: "Esophageal Disease",
    description: "Evaluate and manage patients with esophageal pathology including malignancy and benign disease.",
    relatedProcedures: [
      "esophagectomy", "ivor lewis", "mckeown", "transhiatal esophagectomy",
      "esophageal cancer", "esophageal stent", "fundoplication", "nissen",
      "heller myotomy", "poem", "achalasia", "esophageal perforation",
      "esophageal diverticulum",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 15,
  },
  {
    id: "EPA5",
    title: "Mediastinal Disease",
    description: "Evaluate and manage patients with mediastinal masses and pathology.",
    relatedProcedures: [
      "thymectomy", "mediastinal mass", "mediastinoscopy",
      "anterior mediastinotomy", "chamberlain procedure", "thymic tumor",
      "thymoma", "mediastinal lymph node biopsy", "vats thymectomy",
      "robotic thymectomy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 10,
  },
  {
    id: "EPA6",
    title: "Lung Transplantation",
    description: "Evaluate and manage patients requiring lung transplantation.",
    relatedProcedures: [
      "lung transplant", "bilateral lung transplant", "single lung transplant",
      "donor lung procurement", "lung transplantation",
      "ecmo", "primary graft dysfunction",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2", "ICS2"],
    targetCaseCount: 10,
  },
  {
    id: "EPA7",
    title: "Chest Wall and Diaphragm",
    description: "Evaluate and manage patients with chest wall deformities, tumors, and diaphragmatic conditions.",
    relatedProcedures: [
      "chest wall resection", "pectus excavatum", "nuss procedure",
      "ravitch procedure", "diaphragm plication", "diaphragm repair",
      "chest wall reconstruction", "rib fixation", "rib fracture",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 10,
  },
  {
    id: "EPA8",
    title: "Pneumonectomy",
    description: "Evaluate and manage patients requiring pneumonectomy.",
    relatedProcedures: [
      "pneumonectomy", "completion pneumonectomy", "extrapleural pneumonectomy",
      "intrapericardial pneumonectomy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 5,
  },
  {
    id: "EPA9",
    title: "Bronchoscopy and Interventional Pulmonology",
    description: "Perform diagnostic and therapeutic bronchoscopy and interventional procedures.",
    relatedProcedures: [
      "bronchoscopy", "rigid bronchoscopy", "flexible bronchoscopy",
      "ebus", "endobronchial ultrasound", "navigational bronchoscopy",
      "airway stent", "endobronchial", "bal", "transbronchial biopsy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 20,
  },
  {
    id: "EPA10",
    title: "Thoracic Trauma",
    description: "Evaluate and manage patients with thoracic injuries.",
    relatedProcedures: [
      "thoracotomy", "chest tube", "emergency thoracotomy",
      "hemothorax", "cardiac tamponade", "rib fixation",
      "thoracic trauma", "flail chest", "lung laceration",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "ICS2"],
    targetCaseCount: 10,
  },
];

const RCPSC_THORACIC_EPAS: EpaDefinition[] = [
  { id: "FOD1", title: "Assessing acute thoracic surgical patients", description: "Perform initial assessment of patients with thoracic emergencies.", relatedProcedures: ["chest tube", "pneumothorax", "empyema", "thoracic trauma", "hemothorax", "esophageal perforation"], relatedMilestones: ["ME", "COM", "COL"], targetCaseCount: 25 },
  { id: "FOD2", title: "Performing basic thoracic procedures", description: "Perform chest tube insertion, bronchoscopy, and basic VATS procedures.", relatedProcedures: ["chest tube", "bronchoscopy", "vats", "thoracentesis", "mediastinoscopy", "pleural biopsy"], relatedMilestones: ["ME", "P"], targetCaseCount: 30 },
  { id: "FOD3", title: "Providing perioperative thoracic care", description: "Manage thoracic surgical patients through the perioperative period.", relatedProcedures: ["lobectomy", "esophagectomy", "chest tube", "thoracotomy", "vats"], relatedMilestones: ["ME", "COL", "L"], targetCaseCount: 25 },
  { id: "COD1", title: "Managing lung cancer - major resection", description: "Assess and manage patients with lung cancer requiring lobectomy or pneumonectomy.", relatedProcedures: ["lobectomy", "vats lobectomy", "pneumonectomy", "bilobectomy", "sleeve lobectomy", "lung cancer"], relatedMilestones: ["ME", "COM", "S"], targetCaseCount: 30 },
  { id: "COD2", title: "Managing lung cancer - sublobar resection", description: "Assess and manage patients requiring wedge resection or segmentectomy.", relatedProcedures: ["wedge resection", "segmentectomy", "vats wedge", "lung nodule", "sublobar resection"], relatedMilestones: ["ME", "S", "L"], targetCaseCount: 20 },
  { id: "COD3", title: "Managing pleural disease", description: "Assess and manage patients with pneumothorax, effusions, and empyema.", relatedProcedures: ["chest tube", "pleurodesis", "decortication", "vats decortication", "empyema", "pneumothorax", "pleural effusion"], relatedMilestones: ["ME", "COM"], targetCaseCount: 20 },
  { id: "COD4", title: "Managing esophageal disease", description: "Assess and manage patients with esophageal pathology.", relatedProcedures: ["esophagectomy", "ivor lewis", "heller myotomy", "fundoplication", "esophageal cancer", "achalasia", "poem"], relatedMilestones: ["ME", "COM", "HA"], targetCaseCount: 15 },
  { id: "COD5", title: "Managing mediastinal disease", description: "Assess and manage patients with mediastinal masses.", relatedProcedures: ["thymectomy", "mediastinal mass", "mediastinoscopy", "thymoma", "vats thymectomy"], relatedMilestones: ["ME", "S", "L"], targetCaseCount: 10 },
  { id: "COD6", title: "Performing advanced bronchoscopy", description: "Perform diagnostic and therapeutic bronchoscopy.", relatedProcedures: ["bronchoscopy", "rigid bronchoscopy", "ebus", "navigational bronchoscopy", "airway stent", "transbronchial biopsy"], relatedMilestones: ["ME", "COL", "L", "COM"], targetCaseCount: 20 },
  { id: "COD7", title: "Managing chest wall and diaphragm conditions", description: "Assess and manage chest wall deformities and diaphragmatic pathology.", relatedProcedures: ["chest wall resection", "pectus excavatum", "nuss procedure", "diaphragm plication", "rib fixation"], relatedMilestones: ["ME", "COL"], targetCaseCount: 10 },
  { id: "TTP1", title: "Providing comprehensive thoracic surgical care", description: "Independently manage thoracic surgical patients integrating all CanMEDS roles.", relatedProcedures: ["lobectomy", "esophagectomy", "vats", "bronchoscopy", "chest tube", "thymectomy"], relatedMilestones: ["ME", "COM", "COL", "L", "HA", "S", "P"], targetCaseCount: 30 },
  { id: "TTP2", title: "Managing a thoracic surgical practice", description: "Demonstrate readiness for independent thoracic surgical practice.", relatedProcedures: ["lobectomy", "vats", "esophagectomy", "bronchoscopy"], relatedMilestones: ["L", "P", "COM", "COL"], targetCaseCount: 20 },
];

export const THORACIC_ACGME: SpecialtyEpaData = {
  specialty: "Thoracic Surgery",
  system: "ACGME",
  epas: THORACIC_EPAS,
  milestones: SURGERY_MILESTONES,
};

export const THORACIC_RCPSC: SpecialtyEpaData = {
  specialty: "Thoracic Surgery",
  system: "RCPSC",
  epas: RCPSC_THORACIC_EPAS,
  milestones: CANMEDS_MILESTONES,
};

// ── Colorectal Surgery EPAs ───────────────────────────────────────────────

const COLORECTAL_EPAS: EpaDefinition[] = [
  {
    id: "EPA1",
    title: "Colon Cancer",
    description: "Evaluate and manage patients with colon cancer including oncologic resection.",
    relatedProcedures: [
      "right hemicolectomy", "left hemicolectomy", "sigmoid colectomy",
      "transverse colectomy", "total colectomy", "colon cancer",
      "laparoscopic colectomy", "robotic colectomy", "colectomy",
      "extended right hemicolectomy", "cme", "complete mesocolic excision",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 40,
  },
  {
    id: "EPA2",
    title: "Rectal Cancer",
    description: "Evaluate and manage patients with rectal cancer including total mesorectal excision.",
    relatedProcedures: [
      "low anterior resection", "lar", "abdominoperineal resection", "apr",
      "total mesorectal excision", "tme", "transanal tme", "tatme",
      "rectal cancer", "intersphincteric resection", "proctectomy",
      "pelvic exenteration", "neoadjuvant chemoradiation",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2", "ICS1"],
    targetCaseCount: 25,
  },
  {
    id: "EPA3",
    title: "Inflammatory Bowel Disease",
    description: "Evaluate and manage patients with Crohn's disease and ulcerative colitis requiring surgical intervention.",
    relatedProcedures: [
      "total proctocolectomy", "ileal pouch anal anastomosis", "ipaa",
      "j-pouch", "ileostomy", "colectomy for ibd", "stricturoplasty",
      "crohn resection", "ulcerative colitis", "crohn disease",
      "subtotal colectomy", "proctocolectomy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "ICS1"],
    targetCaseCount: 20,
  },
  {
    id: "EPA4",
    title: "Diverticular Disease",
    description: "Evaluate and manage patients with complicated diverticular disease.",
    relatedProcedures: [
      "sigmoid colectomy", "hartmann procedure", "hartmann reversal",
      "diverticulitis", "diverticular abscess", "colovesical fistula",
      "colovaginal fistula", "complicated diverticulitis", "peritoneal washout",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1"],
    targetCaseCount: 20,
  },
  {
    id: "EPA5",
    title: "Benign Anorectal Disease",
    description: "Evaluate and manage patients with hemorrhoids, fissures, fistulae, and anorectal abscesses.",
    relatedProcedures: [
      "hemorrhoidectomy", "hemorrhoid", "anal fissure", "sphincterotomy",
      "lateral internal sphincterotomy", "fistulotomy", "fistula-in-ano",
      "seton", "lift procedure", "perianal abscess", "ischiorectal abscess",
      "pilonidal", "advancement flap", "fistula plug",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1"],
    targetCaseCount: 40,
  },
  {
    id: "EPA6",
    title: "Stoma Creation and Management",
    description: "Create and manage intestinal stomas and perform stoma reversal.",
    relatedProcedures: [
      "ileostomy", "colostomy", "loop ileostomy", "end ileostomy",
      "end colostomy", "stoma", "stoma reversal", "ileostomy reversal",
      "colostomy reversal", "parastomal hernia", "stoma revision",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "ICS1"],
    targetCaseCount: 25,
  },
  {
    id: "EPA7",
    title: "Pelvic Floor Disorders",
    description: "Evaluate and manage patients with functional pelvic floor disorders including fecal incontinence and rectal prolapse.",
    relatedProcedures: [
      "rectopexy", "rectal prolapse repair", "ventral mesh rectopexy",
      "sacral nerve stimulation", "sns", "fecal incontinence",
      "sphincter repair", "sphincteroplasty", "biofeedback",
      "rectocele repair", "perineal proctosigmoidectomy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "ICS1"],
    targetCaseCount: 15,
  },
  {
    id: "EPA8",
    title: "Colorectal Polyposis and Hereditary Syndromes",
    description: "Evaluate and manage patients with familial polyposis syndromes and hereditary colorectal cancer.",
    relatedProcedures: [
      "total colectomy", "proctocolectomy", "ipaa", "polypectomy",
      "fap", "familial adenomatous polyposis", "lynch syndrome",
      "total proctocolectomy", "ileorectal anastomosis",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2", "ICS1"],
    targetCaseCount: 10,
  },
  {
    id: "EPA9",
    title: "Transanal Surgery",
    description: "Perform transanal excision of rectal lesions including TAMIS and TEM.",
    relatedProcedures: [
      "transanal excision", "tems", "transanal endoscopic microsurgery",
      "tamis", "transanal minimally invasive surgery", "rectal polyp",
      "rectal lesion", "local excision rectum",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 15,
  },
  {
    id: "EPA10",
    title: "Colonoscopy",
    description: "Perform diagnostic and therapeutic colonoscopy.",
    relatedProcedures: [
      "colonoscopy", "polypectomy", "endoscopic mucosal resection", "emr",
      "colonic stent", "surveillance colonoscopy", "screening colonoscopy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1"],
    targetCaseCount: 50,
  },
];

const RCPSC_COLORECTAL_EPAS: EpaDefinition[] = [
  { id: "FOD1", title: "Assessing acute colorectal patients", description: "Perform initial assessment of patients with acute colorectal conditions.", relatedProcedures: ["colectomy", "hartmann", "perianal abscess", "bowel obstruction", "diverticulitis", "rectal bleeding"], relatedMilestones: ["ME", "COM", "COL"], targetCaseCount: 25 },
  { id: "FOD2", title: "Performing basic colorectal procedures", description: "Perform hemorrhoidectomy, fistulotomy, abscess drainage, and basic anorectal surgery.", relatedProcedures: ["hemorrhoidectomy", "fistulotomy", "sphincterotomy", "abscess drainage", "seton", "pilonidal"], relatedMilestones: ["ME", "P"], targetCaseCount: 30 },
  { id: "FOD3", title: "Providing perioperative colorectal care", description: "Manage colorectal patients through the perioperative period.", relatedProcedures: ["colectomy", "ileostomy", "colostomy", "low anterior resection", "apr"], relatedMilestones: ["ME", "COL", "L"], targetCaseCount: 25 },
  { id: "COD1", title: "Managing colon cancer", description: "Assess and manage patients with colon cancer.", relatedProcedures: ["right hemicolectomy", "left hemicolectomy", "sigmoid colectomy", "total colectomy", "colon cancer", "laparoscopic colectomy"], relatedMilestones: ["ME", "COM", "S"], targetCaseCount: 35 },
  { id: "COD2", title: "Managing rectal cancer", description: "Assess and manage patients with rectal cancer.", relatedProcedures: ["low anterior resection", "apr", "tme", "tatme", "rectal cancer", "proctectomy", "pelvic exenteration"], relatedMilestones: ["ME", "S", "L"], targetCaseCount: 20 },
  { id: "COD3", title: "Managing inflammatory bowel disease", description: "Assess and manage patients with IBD requiring surgery.", relatedProcedures: ["total proctocolectomy", "ipaa", "j-pouch", "ileostomy", "stricturoplasty", "crohn resection", "subtotal colectomy"], relatedMilestones: ["ME", "COM", "HA"], targetCaseCount: 15 },
  { id: "COD4", title: "Managing complex anorectal disease", description: "Assess and manage complex fistulae, incontinence, and rectal prolapse.", relatedProcedures: ["fistulotomy", "fistula-in-ano", "lift procedure", "advancement flap", "rectopexy", "sphincteroplasty", "sacral nerve stimulation"], relatedMilestones: ["ME", "COM", "P"], targetCaseCount: 20 },
  { id: "COD5", title: "Managing diverticular disease", description: "Assess and manage patients with complicated diverticular disease.", relatedProcedures: ["sigmoid colectomy", "hartmann procedure", "hartmann reversal", "diverticulitis", "colovesical fistula"], relatedMilestones: ["ME", "COL", "L", "COM"], targetCaseCount: 15 },
  { id: "COD6", title: "Managing stomas", description: "Create and manage intestinal stomas.", relatedProcedures: ["ileostomy", "colostomy", "stoma reversal", "parastomal hernia", "stoma revision"], relatedMilestones: ["ME", "COM"], targetCaseCount: 20 },
  { id: "COD7", title: "Performing colonoscopy and transanal procedures", description: "Perform diagnostic and therapeutic colonoscopy and transanal excision.", relatedProcedures: ["colonoscopy", "polypectomy", "emr", "tamis", "tems", "transanal excision"], relatedMilestones: ["ME", "S"], targetCaseCount: 40 },
  { id: "COD8", title: "Managing hereditary colorectal syndromes", description: "Assess and manage patients with familial polyposis and hereditary cancer syndromes.", relatedProcedures: ["total colectomy", "proctocolectomy", "ipaa", "fap", "lynch syndrome"], relatedMilestones: ["ME", "COM", "HA"], targetCaseCount: 10 },
  { id: "TTP1", title: "Providing comprehensive colorectal care", description: "Independently manage colorectal patients integrating all CanMEDS roles.", relatedProcedures: ["colectomy", "low anterior resection", "ileostomy", "hemorrhoidectomy", "colonoscopy", "ipaa"], relatedMilestones: ["ME", "COM", "COL", "L", "HA", "S", "P"], targetCaseCount: 30 },
  { id: "TTP2", title: "Managing a colorectal surgical practice", description: "Demonstrate readiness for independent colorectal surgical practice.", relatedProcedures: ["colectomy", "low anterior resection", "colonoscopy", "hemorrhoidectomy"], relatedMilestones: ["L", "P", "COM", "COL"], targetCaseCount: 20 },
];

export const COLORECTAL_ACGME: SpecialtyEpaData = {
  specialty: "Colorectal Surgery",
  system: "ACGME",
  epas: COLORECTAL_EPAS,
  milestones: SURGERY_MILESTONES,
};

export const COLORECTAL_RCPSC: SpecialtyEpaData = {
  specialty: "Colorectal Surgery",
  system: "RCPSC",
  epas: RCPSC_COLORECTAL_EPAS,
  milestones: CANMEDS_MILESTONES,
};

// ── Transplant Surgery EPAs ───────────────────────────────────────────────

const TRANSPLANT_EPAS: EpaDefinition[] = [
  {
    id: "EPA1",
    title: "Kidney Transplantation",
    description: "Evaluate and manage patients undergoing kidney transplantation.",
    relatedProcedures: [
      "kidney transplant", "renal transplant", "living donor nephrectomy",
      "donor nephrectomy", "kidney transplantation", "transplant nephrectomy",
      "bench preparation", "ureteral reimplant", "deceased donor kidney",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 40,
  },
  {
    id: "EPA2",
    title: "Liver Transplantation",
    description: "Evaluate and manage patients undergoing liver transplantation.",
    relatedProcedures: [
      "liver transplant", "hepatic transplant", "orthotopic liver transplant",
      "living donor hepatectomy", "deceased donor liver", "piggyback technique",
      "caval replacement", "portal vein thrombectomy", "liver transplantation",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 25,
  },
  {
    id: "EPA3",
    title: "Pancreas Transplantation",
    description: "Evaluate and manage patients undergoing pancreas transplantation.",
    relatedProcedures: [
      "pancreas transplant", "simultaneous pancreas kidney", "spk",
      "pancreas after kidney", "pak", "pancreas transplant alone",
      "pta", "islet transplant",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 10,
  },
  {
    id: "EPA4",
    title: "Organ Procurement",
    description: "Perform multi-organ procurement from deceased donors.",
    relatedProcedures: [
      "organ procurement", "donor operation", "organ retrieval",
      "multi-organ procurement", "liver procurement", "kidney procurement",
      "pancreas procurement", "organ harvest", "donor management",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2", "ICS2"],
    targetCaseCount: 25,
  },
  {
    id: "EPA5",
    title: "Transplant Immunosuppression",
    description: "Manage immunosuppressive therapy including induction, maintenance, and treatment of rejection.",
    relatedProcedures: [
      "kidney transplant", "liver transplant", "transplant biopsy",
      "rejection", "immunosuppression", "tacrolimus", "transplant clinic",
    ],
    relatedMilestones: ["PC1", "PC4", "MK1", "SBP1", "ICS1"],
    targetCaseCount: 30,
  },
  {
    id: "EPA6",
    title: "Transplant Complications",
    description: "Evaluate and manage surgical and medical complications after organ transplantation.",
    relatedProcedures: [
      "transplant complication", "vascular thrombosis", "ureteral stricture",
      "bile leak", "biliary stricture", "lymphocele", "wound complication",
      "transplant reoperation", "graft dysfunction",
    ],
    relatedMilestones: ["PC1", "PC2", "PC4", "MK1", "ICS2"],
    targetCaseCount: 20,
  },
  {
    id: "EPA7",
    title: "Dialysis Access for Transplant Patients",
    description: "Create and manage vascular access for transplant candidates and recipients.",
    relatedProcedures: [
      "av fistula", "avf", "av graft", "avg", "peritoneal dialysis catheter",
      "permcath", "tunneled catheter", "dialysis access",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1"],
    targetCaseCount: 20,
  },
  {
    id: "EPA8",
    title: "Living Donor Evaluation and Surgery",
    description: "Evaluate living donors and perform donor operations.",
    relatedProcedures: [
      "living donor nephrectomy", "laparoscopic donor nephrectomy",
      "living donor hepatectomy", "left lateral sectionectomy",
      "right hepatectomy donor", "donor evaluation",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "PROF1", "ICS1"],
    targetCaseCount: 15,
  },
  {
    id: "EPA9",
    title: "Hepatobiliary Surgery for Transplant Surgeons",
    description: "Perform hepatobiliary procedures as part of transplant surgery practice.",
    relatedProcedures: [
      "hepatectomy", "liver resection", "whipple", "pancreaticoduodenectomy",
      "bile duct repair", "hepaticojejunostomy", "cholecystectomy",
      "liver tumor", "liver abscess drainage",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 15,
  },
];

const RCPSC_TRANSPLANT_EPAS: EpaDefinition[] = [
  { id: "FOD1", title: "Assessing transplant candidates", description: "Perform comprehensive assessment of patients being considered for organ transplantation.", relatedProcedures: ["kidney transplant", "liver transplant", "pancreas transplant", "transplant evaluation", "dialysis access"], relatedMilestones: ["ME", "COM", "COL"], targetCaseCount: 25 },
  { id: "FOD2", title: "Providing perioperative transplant care", description: "Manage transplant patients through the perioperative period.", relatedProcedures: ["kidney transplant", "liver transplant", "immunosuppression", "transplant clinic", "dialysis access"], relatedMilestones: ["ME", "COL", "L"], targetCaseCount: 30 },
  { id: "FOD3", title: "Performing organ procurement", description: "Perform multi-organ procurement from deceased donors.", relatedProcedures: ["organ procurement", "donor operation", "liver procurement", "kidney procurement", "pancreas procurement"], relatedMilestones: ["ME", "P"], targetCaseCount: 20 },
  { id: "COD1", title: "Performing kidney transplantation", description: "Perform kidney transplant including vascular anastomosis and ureteral reimplant.", relatedProcedures: ["kidney transplant", "renal transplant", "living donor nephrectomy", "deceased donor kidney", "transplant nephrectomy"], relatedMilestones: ["ME", "COM", "S"], targetCaseCount: 35 },
  { id: "COD2", title: "Performing liver transplantation", description: "Perform liver transplant including hepatectomy and implantation.", relatedProcedures: ["liver transplant", "orthotopic liver transplant", "living donor hepatectomy", "piggyback technique", "liver transplantation"], relatedMilestones: ["ME", "S", "L"], targetCaseCount: 20 },
  { id: "COD3", title: "Managing transplant immunosuppression", description: "Manage immunosuppressive therapy and treat rejection.", relatedProcedures: ["kidney transplant", "liver transplant", "transplant biopsy", "rejection", "immunosuppression"], relatedMilestones: ["ME", "COM", "HA"], targetCaseCount: 25 },
  { id: "COD4", title: "Managing transplant complications", description: "Assess and manage surgical and medical transplant complications.", relatedProcedures: ["transplant complication", "vascular thrombosis", "bile leak", "biliary stricture", "lymphocele", "graft dysfunction"], relatedMilestones: ["ME", "COL", "L", "COM"], targetCaseCount: 20 },
  { id: "COD5", title: "Performing pancreas transplantation", description: "Perform pancreas and simultaneous pancreas-kidney transplant.", relatedProcedures: ["pancreas transplant", "spk", "pak", "islet transplant"], relatedMilestones: ["ME", "S"], targetCaseCount: 10 },
  { id: "COD6", title: "Managing living donors", description: "Evaluate and manage living organ donors.", relatedProcedures: ["living donor nephrectomy", "laparoscopic donor nephrectomy", "living donor hepatectomy", "donor evaluation"], relatedMilestones: ["ME", "COM", "P"], targetCaseCount: 15 },
  { id: "COD7", title: "Performing hepatobiliary surgery", description: "Perform hepatobiliary procedures related to transplant practice.", relatedProcedures: ["hepatectomy", "liver resection", "whipple", "hepaticojejunostomy", "bile duct repair"], relatedMilestones: ["ME", "COL"], targetCaseCount: 15 },
  { id: "TTP1", title: "Providing comprehensive transplant care", description: "Independently manage transplant patients integrating all CanMEDS roles.", relatedProcedures: ["kidney transplant", "liver transplant", "organ procurement", "immunosuppression", "dialysis access"], relatedMilestones: ["ME", "COM", "COL", "L", "HA", "S", "P"], targetCaseCount: 30 },
  { id: "TTP2", title: "Managing a transplant surgical practice", description: "Demonstrate readiness for independent transplant surgical practice.", relatedProcedures: ["kidney transplant", "liver transplant", "organ procurement"], relatedMilestones: ["L", "P", "COM", "COL"], targetCaseCount: 20 },
];

export const TRANSPLANT_ACGME: SpecialtyEpaData = {
  specialty: "Transplant Surgery",
  system: "ACGME",
  epas: TRANSPLANT_EPAS,
  milestones: SURGERY_MILESTONES,
};

export const TRANSPLANT_RCPSC: SpecialtyEpaData = {
  specialty: "Transplant Surgery",
  system: "RCPSC",
  epas: RCPSC_TRANSPLANT_EPAS,
  milestones: CANMEDS_MILESTONES,
};

// ── Surgical Oncology EPAs ────────────────────────────────────────────────

const SURG_ONC_EPAS: EpaDefinition[] = [
  {
    id: "EPA1",
    title: "Melanoma and Complex Skin Cancer",
    description: "Evaluate and manage patients with melanoma and complex cutaneous malignancies.",
    relatedProcedures: [
      "melanoma", "wide local excision", "wle", "sentinel lymph node biopsy",
      "slnb", "completion lymph node dissection", "clnd",
      "inguinal lymph node dissection", "axillary lymph node dissection",
      "merkel cell", "dermatofibrosarcoma",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2", "ICS1"],
    targetCaseCount: 25,
  },
  {
    id: "EPA2",
    title: "Breast Cancer - Surgical Management",
    description: "Evaluate and manage patients with breast cancer including oncoplastic and reconstructive approaches.",
    relatedProcedures: [
      "mastectomy", "lumpectomy", "breast conserving surgery", "bcs",
      "sentinel lymph node biopsy", "slnb", "axillary lymph node dissection",
      "alnd", "skin-sparing mastectomy", "nipple-sparing mastectomy",
      "oncoplastic", "breast reconstruction", "contralateral prophylactic",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "ICS1"],
    targetCaseCount: 40,
  },
  {
    id: "EPA3",
    title: "Gastric Cancer",
    description: "Evaluate and manage patients with gastric cancer including gastrectomy and lymphadenectomy.",
    relatedProcedures: [
      "gastrectomy", "subtotal gastrectomy", "total gastrectomy",
      "gastric cancer", "d2 lymphadenectomy", "roux-en-y",
      "gastrojejunostomy", "staging laparoscopy", "gist", "gastric tumor",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 15,
  },
  {
    id: "EPA4",
    title: "Hepatic Malignancies",
    description: "Evaluate and manage patients with primary and metastatic liver tumors.",
    relatedProcedures: [
      "hepatectomy", "liver resection", "right hepatectomy", "left hepatectomy",
      "segmentectomy", "wedge resection liver", "hepatocellular carcinoma",
      "hcc", "colorectal liver metastases", "ablation liver",
      "radiofrequency ablation", "microwave ablation",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 15,
  },
  {
    id: "EPA5",
    title: "Pancreatic Cancer",
    description: "Evaluate and manage patients with pancreatic malignancies.",
    relatedProcedures: [
      "whipple", "pancreaticoduodenectomy", "distal pancreatectomy",
      "total pancreatectomy", "pancreatic cancer", "ipmn",
      "pancreatic cyst", "palliative bypass", "celiac plexus block",
      "laparoscopic distal pancreatectomy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 15,
  },
  {
    id: "EPA6",
    title: "Sarcoma",
    description: "Evaluate and manage patients with soft tissue and retroperitoneal sarcomas.",
    relatedProcedures: [
      "sarcoma resection", "soft tissue sarcoma", "retroperitoneal sarcoma",
      "wide excision sarcoma", "extremity sarcoma", "limb-sparing surgery",
      "compartmental resection", "desmoid tumor",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2", "ICS1"],
    targetCaseCount: 10,
  },
  {
    id: "EPA7",
    title: "Peritoneal Surface Malignancies",
    description: "Evaluate and manage patients with peritoneal carcinomatosis and pseudomyxoma.",
    relatedProcedures: [
      "cytoreductive surgery", "crs", "hipec",
      "hyperthermic intraperitoneal chemotherapy", "peritonectomy",
      "pseudomyxoma peritonei", "peritoneal mesothelioma",
      "peritoneal carcinomatosis", "appendiceal mucinous neoplasm",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2", "ICS2"],
    targetCaseCount: 10,
  },
  {
    id: "EPA8",
    title: "Endocrine Tumors",
    description: "Evaluate and manage patients with surgical endocrine malignancies.",
    relatedProcedures: [
      "thyroidectomy", "thyroid cancer", "adrenalectomy",
      "parathyroidectomy", "neuroendocrine tumor", "carcinoid",
      "pheochromocytoma", "medullary thyroid cancer", "men syndrome",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 15,
  },
  {
    id: "EPA9",
    title: "Multidisciplinary Cancer Care and Tumor Board",
    description: "Lead and participate in multidisciplinary cancer care including tumor boards.",
    relatedProcedures: [
      "tumor board", "multidisciplinary", "cancer conference",
      "staging laparoscopy", "port-a-cath", "biopsy",
      "neoadjuvant therapy", "palliative surgery",
    ],
    relatedMilestones: ["PC1", "MK1", "ICS1", "ICS2", "SBP2", "PROF1"],
    targetCaseCount: 30,
  },
  {
    id: "EPA10",
    title: "Regional Therapy and Complex Resection",
    description: "Perform complex multi-visceral resections and regional therapeutic procedures.",
    relatedProcedures: [
      "multivisceral resection", "en bloc resection", "vascular resection",
      "portal vein resection", "isolated limb perfusion",
      "hepatic artery infusion pump", "hai pump",
      "intraoperative radiation", "complex resection",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2"],
    targetCaseCount: 10,
  },
];

const RCPSC_SURG_ONC_EPAS: EpaDefinition[] = [
  { id: "FOD1", title: "Assessing oncologic surgical patients", description: "Perform initial assessment of patients with suspected surgical malignancies.", relatedProcedures: ["biopsy", "staging", "melanoma", "breast cancer", "gastric cancer", "pancreatic cancer", "sarcoma"], relatedMilestones: ["ME", "COM", "COL"], targetCaseCount: 25 },
  { id: "FOD2", title: "Performing oncologic tissue sampling", description: "Perform biopsies and sentinel lymph node procedures.", relatedProcedures: ["biopsy", "sentinel lymph node biopsy", "slnb", "core biopsy", "excisional biopsy", "staging laparoscopy"], relatedMilestones: ["ME", "P"], targetCaseCount: 30 },
  { id: "FOD3", title: "Providing perioperative oncologic care", description: "Manage surgical oncology patients through the perioperative period.", relatedProcedures: ["mastectomy", "gastrectomy", "hepatectomy", "whipple", "colectomy", "sarcoma resection"], relatedMilestones: ["ME", "COL", "L"], targetCaseCount: 25 },
  { id: "COD1", title: "Managing melanoma and skin cancer", description: "Assess and manage melanoma and complex cutaneous malignancies.", relatedProcedures: ["melanoma", "wide local excision", "slnb", "completion lymph node dissection", "inguinal lymph node dissection"], relatedMilestones: ["ME", "COM", "S"], targetCaseCount: 20 },
  { id: "COD2", title: "Managing breast cancer surgically", description: "Assess and manage breast cancer including oncoplastic approaches.", relatedProcedures: ["mastectomy", "lumpectomy", "slnb", "alnd", "skin-sparing mastectomy", "oncoplastic", "breast conserving surgery"], relatedMilestones: ["ME", "COM", "HA"], targetCaseCount: 35 },
  { id: "COD3", title: "Managing hepatopancreatobiliary malignancies", description: "Assess and manage patients with HPB cancers.", relatedProcedures: ["hepatectomy", "liver resection", "whipple", "distal pancreatectomy", "pancreatic cancer", "hcc", "colorectal liver metastases"], relatedMilestones: ["ME", "S", "L"], targetCaseCount: 20 },
  { id: "COD4", title: "Managing upper GI malignancies", description: "Assess and manage patients with gastric and esophageal cancers.", relatedProcedures: ["gastrectomy", "total gastrectomy", "subtotal gastrectomy", "gastric cancer", "gist", "esophagectomy"], relatedMilestones: ["ME", "COM"], targetCaseCount: 15 },
  { id: "COD5", title: "Managing sarcoma", description: "Assess and manage patients with soft tissue and retroperitoneal sarcomas.", relatedProcedures: ["sarcoma resection", "soft tissue sarcoma", "retroperitoneal sarcoma", "wide excision sarcoma", "limb-sparing surgery"], relatedMilestones: ["ME", "COM", "P"], targetCaseCount: 10 },
  { id: "COD6", title: "Managing peritoneal surface malignancies", description: "Assess and manage patients with peritoneal carcinomatosis.", relatedProcedures: ["cytoreductive surgery", "crs", "hipec", "peritonectomy", "pseudomyxoma peritonei"], relatedMilestones: ["ME", "COL", "L", "COM"], targetCaseCount: 10 },
  { id: "COD7", title: "Leading multidisciplinary cancer care", description: "Lead tumor boards and coordinate multidisciplinary oncologic care.", relatedProcedures: ["tumor board", "multidisciplinary", "staging", "neoadjuvant therapy", "palliative surgery"], relatedMilestones: ["ME", "COM", "COL", "L"], targetCaseCount: 25 },
  { id: "COD8", title: "Managing endocrine malignancies", description: "Assess and manage surgical endocrine cancers.", relatedProcedures: ["thyroidectomy", "thyroid cancer", "adrenalectomy", "neuroendocrine tumor", "carcinoid", "pheochromocytoma"], relatedMilestones: ["ME", "S"], targetCaseCount: 15 },
  { id: "TTP1", title: "Providing comprehensive surgical oncology care", description: "Independently manage surgical oncology patients integrating all CanMEDS roles.", relatedProcedures: ["mastectomy", "melanoma", "hepatectomy", "whipple", "gastrectomy", "sarcoma resection"], relatedMilestones: ["ME", "COM", "COL", "L", "HA", "S", "P"], targetCaseCount: 30 },
  { id: "TTP2", title: "Managing a surgical oncology practice", description: "Demonstrate readiness for independent surgical oncology practice.", relatedProcedures: ["mastectomy", "melanoma", "hepatectomy", "whipple", "tumor board"], relatedMilestones: ["L", "P", "COM", "COL"], targetCaseCount: 20 },
];

export const SURG_ONC_ACGME: SpecialtyEpaData = {
  specialty: "Surgical Oncology",
  system: "ACGME",
  epas: SURG_ONC_EPAS,
  milestones: SURGERY_MILESTONES,
};

export const SURG_ONC_RCPSC: SpecialtyEpaData = {
  specialty: "Surgical Oncology",
  system: "RCPSC",
  epas: RCPSC_SURG_ONC_EPAS,
  milestones: CANMEDS_MILESTONES,
};

// ── Oral & Maxillofacial Surgery EPAs ─────────────────────────────────────

const OMFS_EPAS: EpaDefinition[] = [
  {
    id: "EPA1",
    title: "Dentoalveolar Surgery",
    description: "Evaluate and manage patients requiring dentoalveolar surgical procedures including extractions.",
    relatedProcedures: [
      "third molar extraction", "wisdom teeth", "surgical extraction",
      "impacted tooth", "dentoalveolar", "alveoloplasty",
      "torus removal", "exostosis removal", "apicoectomy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1"],
    targetCaseCount: 50,
  },
  {
    id: "EPA2",
    title: "Orthognathic Surgery",
    description: "Evaluate and manage patients requiring corrective jaw surgery.",
    relatedProcedures: [
      "orthognathic surgery", "le fort i osteotomy", "bsso",
      "bilateral sagittal split osteotomy", "genioplasty",
      "maxillary osteotomy", "mandibular osteotomy",
      "distraction osteogenesis", "jaw surgery",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 20,
  },
  {
    id: "EPA3",
    title: "Maxillofacial Trauma",
    description: "Evaluate and manage patients with maxillofacial fractures and injuries.",
    relatedProcedures: [
      "mandible fracture", "orif mandible", "maxillary fracture",
      "zygomatic fracture", "zmc fracture", "orbital fracture",
      "orbital floor repair", "noe fracture", "frontal sinus fracture",
      "le fort fracture", "facial fracture", "imf", "mmf",
      "arch bars", "condylar fracture", "panfacial fracture",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "MK2", "ICS2"],
    targetCaseCount: 30,
  },
  {
    id: "EPA4",
    title: "Oral Pathology and Tumor Surgery",
    description: "Evaluate and manage patients with benign and malignant oral and jaw tumors.",
    relatedProcedures: [
      "mandibulectomy", "maxillectomy", "glossectomy", "oral cancer",
      "squamous cell carcinoma oral", "neck dissection",
      "ameloblastoma", "odontogenic keratocyst", "jaw tumor",
      "floor of mouth", "oral biopsy", "jaw resection",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2", "ICS1"],
    targetCaseCount: 15,
  },
  {
    id: "EPA5",
    title: "Dental Implant Surgery",
    description: "Evaluate and manage patients requiring dental implant placement and related procedures.",
    relatedProcedures: [
      "dental implant", "implant placement", "bone graft",
      "sinus lift", "sinus augmentation", "ridge augmentation",
      "alveolar bone graft", "zygomatic implant", "all-on-4",
      "guided bone regeneration", "gbr",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 30,
  },
  {
    id: "EPA6",
    title: "Temporomandibular Joint Disorders",
    description: "Evaluate and manage patients with temporomandibular joint pathology.",
    relatedProcedures: [
      "tmj", "temporomandibular joint", "tmj arthroscopy",
      "tmj arthroplasty", "tmj replacement", "total joint replacement tmj",
      "disc repositioning", "tmj arthrocentesis", "condylectomy",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 15,
  },
  {
    id: "EPA7",
    title: "Cleft and Craniofacial Surgery",
    description: "Evaluate and manage patients with cleft lip, cleft palate, and craniofacial anomalies.",
    relatedProcedures: [
      "cleft lip repair", "cleft palate repair", "alveolar bone graft",
      "pharyngeal flap", "velopharyngeal insufficiency",
      "craniosynostosis", "craniofacial", "distraction osteogenesis",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2", "ICS1"],
    targetCaseCount: 10,
  },
  {
    id: "EPA8",
    title: "Maxillofacial Infections",
    description: "Evaluate and manage patients with odontogenic and maxillofacial infections.",
    relatedProcedures: [
      "i&d", "incision and drainage", "dental abscess", "ludwig angina",
      "odontogenic infection", "submandibular space infection",
      "parapharyngeal abscess", "neck abscess", "osteomyelitis jaw",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "PC4", "MK1", "ICS2"],
    targetCaseCount: 20,
  },
  {
    id: "EPA9",
    title: "Maxillofacial Reconstruction",
    description: "Perform reconstruction of maxillofacial defects including microvascular free tissue transfer.",
    relatedProcedures: [
      "fibula free flap", "mandible reconstruction", "maxillary reconstruction",
      "free flap", "radial forearm free flap", "scapular free flap",
      "iliac crest graft", "reconstruction plate", "microvascular",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "MK2"],
    targetCaseCount: 10,
  },
  {
    id: "EPA10",
    title: "Facial Cosmetic Surgery",
    description: "Evaluate and manage patients seeking facial cosmetic procedures.",
    relatedProcedures: [
      "rhinoplasty", "blepharoplasty", "facelift", "rhytidectomy",
      "chin implant", "genioplasty", "buccal fat removal",
      "facial liposuction", "neck lift", "otoplasty",
    ],
    relatedMilestones: ["PC1", "PC2", "PC3", "MK1", "ICS1", "PROF1"],
    targetCaseCount: 10,
  },
];

const RCPSC_OMFS_EPAS: EpaDefinition[] = [
  { id: "FOD1", title: "Assessing acute maxillofacial patients", description: "Perform initial assessment of patients with maxillofacial trauma and infections.", relatedProcedures: ["facial fracture", "dental abscess", "ludwig angina", "mandible fracture", "facial laceration"], relatedMilestones: ["ME", "COM", "COL"], targetCaseCount: 25 },
  { id: "FOD2", title: "Performing dentoalveolar surgery", description: "Perform surgical extractions and basic dentoalveolar procedures.", relatedProcedures: ["third molar extraction", "surgical extraction", "alveoloplasty", "apicoectomy", "torus removal"], relatedMilestones: ["ME", "P"], targetCaseCount: 40 },
  { id: "FOD3", title: "Providing perioperative maxillofacial care", description: "Manage OMFS patients through the perioperative period.", relatedProcedures: ["orthognathic surgery", "mandible fracture", "maxillectomy", "dental implant", "tmj"], relatedMilestones: ["ME", "COL", "L"], targetCaseCount: 25 },
  { id: "COD1", title: "Managing maxillofacial trauma", description: "Assess and manage patients with facial fractures.", relatedProcedures: ["mandible fracture", "orif mandible", "zygomatic fracture", "orbital fracture", "le fort fracture", "condylar fracture", "panfacial fracture"], relatedMilestones: ["ME", "COM", "S"], targetCaseCount: 25 },
  { id: "COD2", title: "Performing orthognathic surgery", description: "Assess and manage patients requiring corrective jaw surgery.", relatedProcedures: ["orthognathic surgery", "le fort i osteotomy", "bsso", "genioplasty", "distraction osteogenesis"], relatedMilestones: ["ME", "S", "L"], targetCaseCount: 15 },
  { id: "COD3", title: "Managing oral and jaw tumors", description: "Assess and manage benign and malignant oral tumors.", relatedProcedures: ["mandibulectomy", "maxillectomy", "glossectomy", "oral cancer", "neck dissection", "ameloblastoma", "jaw tumor"], relatedMilestones: ["ME", "COM", "HA"], targetCaseCount: 15 },
  { id: "COD4", title: "Performing dental implant surgery", description: "Assess and manage patients requiring dental implants and bone grafting.", relatedProcedures: ["dental implant", "bone graft", "sinus lift", "ridge augmentation", "zygomatic implant", "gbr"], relatedMilestones: ["ME", "COM", "P"], targetCaseCount: 25 },
  { id: "COD5", title: "Managing TMJ disorders", description: "Assess and manage patients with temporomandibular joint pathology.", relatedProcedures: ["tmj", "tmj arthroscopy", "tmj arthroplasty", "tmj replacement", "arthrocentesis", "condylectomy"], relatedMilestones: ["ME", "S", "L"], targetCaseCount: 10 },
  { id: "COD6", title: "Managing maxillofacial infections", description: "Assess and manage odontogenic and deep space infections.", relatedProcedures: ["i&d", "dental abscess", "ludwig angina", "submandibular space infection", "parapharyngeal abscess", "osteomyelitis jaw"], relatedMilestones: ["ME", "COL", "L", "COM"], targetCaseCount: 15 },
  { id: "COD7", title: "Managing cleft and craniofacial conditions", description: "Assess and manage patients with cleft and craniofacial anomalies.", relatedProcedures: ["cleft lip repair", "cleft palate repair", "alveolar bone graft", "craniosynostosis", "distraction osteogenesis"], relatedMilestones: ["ME", "COM", "HA"], targetCaseCount: 10 },
  { id: "COD8", title: "Performing maxillofacial reconstruction", description: "Perform reconstruction of maxillofacial defects.", relatedProcedures: ["fibula free flap", "mandible reconstruction", "free flap", "radial forearm free flap", "reconstruction plate", "microvascular"], relatedMilestones: ["ME", "COL"], targetCaseCount: 10 },
  { id: "TTP1", title: "Providing comprehensive maxillofacial care", description: "Independently manage OMFS patients integrating all CanMEDS roles.", relatedProcedures: ["orthognathic surgery", "mandible fracture", "dental implant", "oral cancer", "tmj", "third molar"], relatedMilestones: ["ME", "COM", "COL", "L", "HA", "S", "P"], targetCaseCount: 30 },
  { id: "TTP2", title: "Managing an OMFS practice", description: "Demonstrate readiness for independent maxillofacial surgical practice.", relatedProcedures: ["third molar extraction", "dental implant", "orthognathic surgery", "mandible fracture"], relatedMilestones: ["L", "P", "COM", "COL"], targetCaseCount: 20 },
];

export const OMFS_ACGME: SpecialtyEpaData = {
  specialty: "Oral & Maxillofacial Surgery",
  system: "ACGME",
  epas: OMFS_EPAS,
  milestones: SURGERY_MILESTONES,
};

export const OMFS_RCPSC: SpecialtyEpaData = {
  specialty: "Oral & Maxillofacial Surgery",
  system: "RCPSC",
  epas: RCPSC_OMFS_EPAS,
  milestones: CANMEDS_MILESTONES,
};

// ── Lookup helpers ──────────────────────────────────────────────────────────

const ACGME_MAP: Record<string, SpecialtyEpaData> = {
  "general-surgery": GENERAL_SURGERY_ACGME,
  "general surgery": GENERAL_SURGERY_ACGME,
  "urology": UROLOGY_ACGME,
  "neurosurgery": NEUROSURGERY_ACGME,
  "orthopedic": ORTHOPEDIC_ACGME,
  "orthopedic surgery": ORTHOPEDIC_ACGME,
  "cardiac": CARDIAC_ACGME,
  "cardiac surgery": CARDIAC_ACGME,
  "vascular": VASCULAR_ACGME,
  "vascular surgery": VASCULAR_ACGME,
  "plastic": PLASTIC_ACGME,
  "plastic surgery": PLASTIC_ACGME,
  "ent": ENT_ACGME,
  "otolaryngology": ENT_ACGME,
  "otolaryngology - head & neck surgery": ENT_ACGME,
  "obgyn": OBGYN_ACGME,
  "ob-gyn": OBGYN_ACGME,
  "obstetrics & gynecology": OBGYN_ACGME,
  "ophthalmology": OPHTHALMOLOGY_ACGME,
  "pediatric": PEDIATRIC_ACGME,
  "pediatric surgery": PEDIATRIC_ACGME,
  "thoracic": THORACIC_ACGME,
  "thoracic surgery": THORACIC_ACGME,
  "colorectal": COLORECTAL_ACGME,
  "colorectal surgery": COLORECTAL_ACGME,
  "transplant": TRANSPLANT_ACGME,
  "transplant surgery": TRANSPLANT_ACGME,
  "surg-onc": SURG_ONC_ACGME,
  "surgical oncology": SURG_ONC_ACGME,
  "omfs": OMFS_ACGME,
  "oral & maxillofacial": OMFS_ACGME,
  "oral & maxillofacial surgery": OMFS_ACGME,
};

const RCPSC_MAP: Record<string, SpecialtyEpaData> = {
  "general-surgery": GENERAL_SURGERY_RCPSC,
  "general surgery": GENERAL_SURGERY_RCPSC,
  "urology": UROLOGY_RCPSC,
  "neurosurgery": NEUROSURGERY_RCPSC,
  "orthopedic": ORTHOPEDIC_RCPSC,
  "orthopedic surgery": ORTHOPEDIC_RCPSC,
  "cardiac": CARDIAC_RCPSC,
  "cardiac surgery": CARDIAC_RCPSC,
  "vascular": VASCULAR_RCPSC,
  "vascular surgery": VASCULAR_RCPSC,
  "plastic": PLASTIC_RCPSC,
  "plastic surgery": PLASTIC_RCPSC,
  "ent": ENT_RCPSC,
  "otolaryngology": ENT_RCPSC,
  "otolaryngology - head & neck surgery": ENT_RCPSC,
  "obgyn": OBGYN_RCPSC,
  "ob-gyn": OBGYN_RCPSC,
  "obstetrics & gynecology": OBGYN_RCPSC,
  "ophthalmology": OPHTHALMOLOGY_RCPSC,
  "pediatric": PEDIATRIC_RCPSC,
  "pediatric surgery": PEDIATRIC_RCPSC,
  "thoracic": THORACIC_RCPSC,
  "thoracic surgery": THORACIC_RCPSC,
  "colorectal": COLORECTAL_RCPSC,
  "colorectal surgery": COLORECTAL_RCPSC,
  "transplant": TRANSPLANT_RCPSC,
  "transplant surgery": TRANSPLANT_RCPSC,
  "surg-onc": SURG_ONC_RCPSC,
  "surgical oncology": SURG_ONC_RCPSC,
  "omfs": OMFS_RCPSC,
  "oral & maxillofacial": OMFS_RCPSC,
  "oral & maxillofacial surgery": OMFS_RCPSC,
};

/**
 * Get EPA data for a specialty+country combination.
 * country: "US" → ACGME, "CA" → Royal College CBD/CanMEDS
 * Defaults to ACGME if country not specified.
 */
export function getSpecialtyEpaData(
  specialtySlug: string,
  country?: string,
): SpecialtyEpaData | undefined {
  const key = specialtySlug.toLowerCase();
  if (country === "CA") {
    return RCPSC_MAP[key];
  }
  return ACGME_MAP[key];
}

/** Get the training system label for display */
export function getSystemLabel(system: TrainingSystem): string {
  return system === "RCPSC" ? "Royal College CBD" : "ACGME Milestones";
}

/** Get the milestone framework name */
export function getMilestoneFramework(system: TrainingSystem): string {
  return system === "RCPSC" ? "CanMEDS" : "ACGME";
}

export function getAllMilestoneIds(data: SpecialtyEpaData): string[] {
  return data.milestones.map((m) => m.id);
}

export function getMilestoneById(
  data: SpecialtyEpaData,
  id: string,
): MilestoneDefinition | undefined {
  return data.milestones.find((m) => m.id === id);
}

export function getEpaById(
  data: SpecialtyEpaData,
  id: string,
): EpaDefinition | undefined {
  return data.epas.find((e) => e.id === id);
}
