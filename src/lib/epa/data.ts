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

// ── Lookup helpers ──────────────────────────────────────────────────────────

const ACGME_MAP: Record<string, SpecialtyEpaData> = {
  "general-surgery": GENERAL_SURGERY_ACGME,
  "general surgery": GENERAL_SURGERY_ACGME,
};

const RCPSC_MAP: Record<string, SpecialtyEpaData> = {
  "general-surgery": GENERAL_SURGERY_RCPSC,
  "general surgery": GENERAL_SURGERY_RCPSC,
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
