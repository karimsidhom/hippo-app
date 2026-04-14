export const SPECIALTIES = [
  { name: "Urology",                    slug: "urology",          color: "#6c7fff", icon: "🫘" },
  { name: "General Surgery",            slug: "general-surgery",  color: "#3ecf8e", icon: "🔪" },
  { name: "Neurosurgery",               slug: "neurosurgery",     color: "#a78bfa", icon: "🧠" },
  { name: "Orthopedic Surgery",         slug: "orthopedic",       color: "#f5a623", icon: "🦴" },
  { name: "Cardiac Surgery",            slug: "cardiac",          color: "#e05c5c", icon: "🫀" },
  { name: "Vascular Surgery",           slug: "vascular",         color: "#06b6d4", icon: "🩸" },
  { name: "Plastic Surgery",            slug: "plastic",          color: "#ec4899", icon: "✨" },
  { name: "ENT / Otolaryngology",       slug: "ent",              color: "#84cc16", icon: "👂" },
  { name: "OB-GYN",                     slug: "obgyn",            color: "#d946ef", icon: "🌸" },
  { name: "Ophthalmology",              slug: "ophthalmology",    color: "#0ea5e9", icon: "👁️" },
  { name: "Pediatric Surgery",          slug: "pediatric",        color: "#f97316", icon: "🧒" },
  { name: "Thoracic Surgery",           slug: "thoracic",         color: "#14b8a6", icon: "🫁" },
  { name: "Colorectal Surgery",         slug: "colorectal",       color: "#a16207", icon: "🟤" },
  { name: "Transplant Surgery",         slug: "transplant",       color: "#059669", icon: "🔄" },
  { name: "Surgical Oncology",          slug: "surg-onc",         color: "#dc2626", icon: "🎗️" },
  { name: "Oral & Maxillofacial",       slug: "omfs",             color: "#7c3aed", icon: "🦷" },
  { name: "Other",                      slug: "other",            color: "#71717a", icon: "➕" },
];

export const USER_ROLE_TYPES = [
  { value: "RESIDENT", label: "Resident", description: "PGY 1-5" },
  { value: "FELLOW", label: "Fellow", description: "Subspecialty training" },
  { value: "STAFF", label: "Staff / Attending", description: "Independent practice" },
  { value: "ATTENDING", label: "Attending Physician", description: "Fully independent practice" },
  { value: "PROGRAM_DIRECTOR", label: "Program Director", description: "Residency/fellowship program leadership" },
];

export const AUTONOMY_LEVELS = [
  { value: "OBSERVER", label: "Observer", description: "Observing the procedure", color: "#64748b", score: 1 },
  { value: "ASSISTANT", label: "Assistant", description: "Assisting the primary surgeon", color: "#94a3b8", score: 2 },
  { value: "SUPERVISOR_PRESENT", label: "Supervisor Present", description: "Performed with attending in room", color: "#f59e0b", score: 3 },
  { value: "INDEPENDENT", label: "Independent", description: "Performed independently", color: "#10b981", score: 4 },
  { value: "TEACHING", label: "Teaching", description: "Teaching a junior trainee", color: "#6366f1", score: 5 },
];

export const SURGICAL_APPROACHES = [
  { value: "OPEN", label: "Open", icon: "✂️" },
  { value: "LAPAROSCOPIC", label: "Laparoscopic", icon: "🔭" },
  { value: "ROBOTIC", label: "Robotic", icon: "🤖" },
  { value: "ENDOSCOPIC", label: "Endoscopic", icon: "🔬" },
  { value: "HYBRID", label: "Hybrid", icon: "⚡" },
  { value: "PERCUTANEOUS", label: "Percutaneous", icon: "💉" },
  { value: "OTHER", label: "Other", icon: "📋" },
];

export const OUTCOME_CATEGORIES = [
  { value: "UNCOMPLICATED", label: "Uncomplicated", color: "#10b981" },
  { value: "MINOR_COMPLICATION", label: "Minor Complication", color: "#f59e0b" },
  { value: "MAJOR_COMPLICATION", label: "Major Complication", color: "#ef4444" },
  { value: "REOPERATION", label: "Reoperation", color: "#dc2626" },
  { value: "DEATH", label: "Death", color: "#7f1d1d" },
  { value: "UNKNOWN", label: "Unknown", color: "#64748b" },
];

export const COMPLICATION_CATEGORIES = [
  { value: "NONE", label: "None" },
  { value: "BLEEDING", label: "Bleeding / Hemorrhage" },
  { value: "INFECTION", label: "Infection / Sepsis" },
  { value: "ORGAN_INJURY", label: "Organ Injury" },
  { value: "ANASTOMOTIC_LEAK", label: "Anastomotic Leak" },
  { value: "DVT_PE", label: "DVT / PE" },
  { value: "ILEUS", label: "Ileus / Bowel Obstruction" },
  { value: "CONVERSION", label: "Conversion to Open" },
  { value: "READMISSION", label: "Readmission" },
  { value: "OTHER", label: "Other" },
];

export const AGE_BINS = [
  { value: "UNDER_18", label: "Under 18" },
  { value: "AGE_18_30", label: "18–30" },
  { value: "AGE_31_45", label: "31–45" },
  { value: "AGE_46_60", label: "46–60" },
  { value: "AGE_61_75", label: "61–75" },
  { value: "OVER_75", label: "Over 75" },
  { value: "UNKNOWN", label: "Unknown" },
];

export const ROLES = [
  { value: "First Surgeon", label: "First Surgeon", description: "Primary operator" },
  { value: "Assist", label: "Assistant", description: "Assisting surgeon" },
  { value: "Observer", label: "Observer", description: "Non-operative observer" },
];

export const PGY_YEARS = [
  { value: 1, label: "PGY-1", description: "Intern year" },
  { value: 2, label: "PGY-2" },
  { value: 3, label: "PGY-3" },
  { value: 4, label: "PGY-4" },
  { value: 5, label: "PGY-5" },
  { value: 6, label: "Fellow Year 1" },
  { value: 7, label: "Fellow Year 2" },
  { value: 8, label: "Staff / Attending" },
];

export const DIFFICULTY_SCORES = [
  { value: 1, label: "Routine", color: "#10b981", description: "Standard procedure, no unexpected challenges" },
  { value: 2, label: "Easy", color: "#84cc16", description: "Minor difficulties overcome easily" },
  { value: 3, label: "Moderate", color: "#f59e0b", description: "Some technical challenge" },
  { value: 4, label: "Difficult", color: "#f97316", description: "Significant technical challenge" },
  { value: 5, label: "Extreme", color: "#ef4444", description: "Exceptional difficulty, complex anatomy" },
];

export const UROLOGY_PROCEDURES = [
  // Oncology
  { name: "Robot-Assisted Radical Prostatectomy", category: "Oncology", approaches: ["ROBOTIC"], avgDuration: 180, difficulty: 5 },
  { name: "Laparoscopic Radical Nephrectomy", category: "Oncology", approaches: ["LAPAROSCOPIC"], avgDuration: 150, difficulty: 4 },
  { name: "Robot-Assisted Partial Nephrectomy", category: "Oncology", approaches: ["ROBOTIC", "LAPAROSCOPIC"], avgDuration: 180, difficulty: 5 },
  { name: "Transurethral Resection of Bladder Tumor", category: "Oncology", approaches: ["ENDOSCOPIC"], avgDuration: 45, difficulty: 3 },
  { name: "Radical Cystectomy with Ileal Conduit", category: "Oncology", approaches: ["OPEN", "ROBOTIC"], avgDuration: 300, difficulty: 5 },
  { name: "Robot-Assisted Radical Cystectomy", category: "Oncology", approaches: ["ROBOTIC"], avgDuration: 360, difficulty: 5 },
  { name: "Nephroureterectomy", category: "Oncology", approaches: ["LAPAROSCOPIC", "OPEN"], avgDuration: 180, difficulty: 4 },
  { name: "Orchiectomy", category: "Oncology", approaches: ["OPEN"], avgDuration: 45, difficulty: 2 },
  { name: "Retroperitoneal Lymph Node Dissection", category: "Oncology", approaches: ["OPEN"], avgDuration: 240, difficulty: 5 },
  { name: "Intravesical BCG Instillation", category: "Oncology", approaches: ["ENDOSCOPIC"], avgDuration: 30, difficulty: 1 },
  // Endourology
  { name: "Ureteroscopy with Laser Lithotripsy", category: "Endourology", approaches: ["ENDOSCOPIC"], avgDuration: 60, difficulty: 3 },
  { name: "Percutaneous Nephrolithotomy", category: "Endourology", approaches: ["PERCUTANEOUS"], avgDuration: 90, difficulty: 4 },
  { name: "Extracorporeal Shock Wave Lithotripsy", category: "Endourology", approaches: ["PERCUTANEOUS"], avgDuration: 60, difficulty: 2 },
  { name: "Cystoscopy with Biopsy", category: "Endourology", approaches: ["ENDOSCOPIC"], avgDuration: 30, difficulty: 2 },
  { name: "Suprapubic Tube Placement", category: "Endourology", approaches: ["PERCUTANEOUS"], avgDuration: 30, difficulty: 2 },
  // BPH
  { name: "Transurethral Resection of Prostate", category: "BPH", approaches: ["ENDOSCOPIC"], avgDuration: 75, difficulty: 3 },
  { name: "Holmium Laser Enucleation of Prostate", category: "BPH", approaches: ["ENDOSCOPIC"], avgDuration: 90, difficulty: 4 },
  // Reconstruction
  { name: "Laparoscopic Pyeloplasty", category: "Reconstruction", approaches: ["LAPAROSCOPIC"], avgDuration: 120, difficulty: 4 },
  { name: "Robot-Assisted Pyeloplasty", category: "Reconstruction", approaches: ["ROBOTIC"], avgDuration: 110, difficulty: 4 },
  { name: "Ureteral Reimplantation", category: "Reconstruction", approaches: ["OPEN"], avgDuration: 120, difficulty: 4 },
  { name: "Urethroplasty", category: "Reconstruction", approaches: ["OPEN"], avgDuration: 180, difficulty: 5 },
  // Male Health
  { name: "Penile Prosthesis Implantation", category: "Male Health", approaches: ["OPEN"], avgDuration: 90, difficulty: 3 },
  { name: "Artificial Urinary Sphincter", category: "Incontinence", approaches: ["OPEN"], avgDuration: 90, difficulty: 4 },
  { name: "Male Urethral Sling", category: "Incontinence", approaches: ["OPEN"], avgDuration: 60, difficulty: 3 },
  { name: "Varicocelectomy", category: "Male Health", approaches: ["OPEN"], avgDuration: 60, difficulty: 3 },
  { name: "Scrotal Exploration / Orchiopexy", category: "Male Health", approaches: ["OPEN"], avgDuration: 45, difficulty: 2 },
  // Adrenal
  { name: "Laparoscopic Adrenalectomy", category: "Adrenal", approaches: ["LAPAROSCOPIC"], avgDuration: 90, difficulty: 4 },
  // Transplant
  { name: "Renal Transplant", category: "Transplant", approaches: ["OPEN"], avgDuration: 180, difficulty: 5 },
  // Pediatric
  { name: "Hypospadias Repair", category: "Pediatric", approaches: ["OPEN"], avgDuration: 120, difficulty: 4 },
  { name: "Laparoscopic Nephroureterectomy", category: "Oncology", approaches: ["LAPAROSCOPIC"], avgDuration: 180, difficulty: 4 },
];

export const GENERAL_SURGERY_PROCEDURES = [
  { name: "Laparoscopic Cholecystectomy", category: "Biliary", approaches: ["LAPAROSCOPIC"], avgDuration: 60, difficulty: 2 },
  { name: "Laparoscopic Appendectomy", category: "Colorectal", approaches: ["LAPAROSCOPIC"], avgDuration: 45, difficulty: 2 },
  { name: "Inguinal Hernia Repair", category: "Hernia", approaches: ["OPEN"], avgDuration: 60, difficulty: 2 },
  { name: "Laparoscopic Inguinal Hernia Repair (TEP)", category: "Hernia", approaches: ["LAPAROSCOPIC"], avgDuration: 75, difficulty: 3 },
  { name: "Laparoscopic Nissen Fundoplication", category: "Upper GI", approaches: ["LAPAROSCOPIC"], avgDuration: 90, difficulty: 4 },
  { name: "Roux-en-Y Gastric Bypass", category: "Bariatric", approaches: ["LAPAROSCOPIC"], avgDuration: 150, difficulty: 5 },
  { name: "Sleeve Gastrectomy", category: "Bariatric", approaches: ["LAPAROSCOPIC"], avgDuration: 90, difficulty: 4 },
  { name: "Right Hemicolectomy", category: "Colorectal", approaches: ["LAPAROSCOPIC", "OPEN"], avgDuration: 120, difficulty: 4 },
  { name: "Hartmann's Procedure", category: "Colorectal", approaches: ["OPEN"], avgDuration: 120, difficulty: 4 },
  { name: "Whipple Procedure", category: "Pancreatic", approaches: ["OPEN"], avgDuration: 360, difficulty: 5 },
  { name: "Thyroidectomy", category: "Endocrine", approaches: ["OPEN"], avgDuration: 120, difficulty: 4 },
  { name: "Parathyroidectomy", category: "Endocrine", approaches: ["OPEN"], avgDuration: 90, difficulty: 4 },
  { name: "Mastectomy", category: "Breast", approaches: ["OPEN"], avgDuration: 120, difficulty: 3 },
];

export const ORTHOPEDIC_PROCEDURES = [
  { name: "Total Knee Arthroplasty", category: "Arthroplasty", approaches: ["OPEN"], avgDuration: 90, difficulty: 4 },
  { name: "Total Hip Arthroplasty", category: "Arthroplasty", approaches: ["OPEN"], avgDuration: 90, difficulty: 4 },
  { name: "Arthroscopic ACL Reconstruction", category: "Sports", approaches: ["ENDOSCOPIC"], avgDuration: 75, difficulty: 3 },
  { name: "Spine Fusion (TLIF)", category: "Spine", approaches: ["OPEN"], avgDuration: 180, difficulty: 5 },
  { name: "ORIF Distal Radius", category: "Trauma", approaches: ["OPEN"], avgDuration: 60, difficulty: 3 },
  { name: "Hip Fracture ORIF", category: "Trauma", approaches: ["OPEN"], avgDuration: 90, difficulty: 4 },
];

export const CARDIOTHORACIC_PROCEDURES = [
  { name: "Coronary Artery Bypass Grafting", category: "Cardiac", approaches: ["OPEN"], avgDuration: 240, difficulty: 5 },
  { name: "Aortic Valve Replacement", category: "Valve", approaches: ["OPEN"], avgDuration: 210, difficulty: 5 },
  { name: "VATS Lobectomy", category: "Thoracic", approaches: ["LAPAROSCOPIC"], avgDuration: 150, difficulty: 4 },
  { name: "Thoracoscopic Wedge Resection", category: "Thoracic", approaches: ["LAPAROSCOPIC"], avgDuration: 90, difficulty: 3 },
];

export const NEUROSURGERY_PROCEDURES = [
  { name: "Craniotomy for Tumor Resection", category: "Oncology", approaches: ["OPEN"], avgDuration: 240, difficulty: 5 },
  { name: "Lumbar Discectomy", category: "Spine", approaches: ["OPEN"], avgDuration: 90, difficulty: 3 },
  { name: "Anterior Cervical Discectomy & Fusion", category: "Spine", approaches: ["OPEN"], avgDuration: 120, difficulty: 4 },
  { name: "VP Shunt Insertion", category: "CSF", approaches: ["OPEN"], avgDuration: 60, difficulty: 3 },
  { name: "Endoscopic Third Ventriculostomy", category: "CSF", approaches: ["ENDOSCOPIC"], avgDuration: 60, difficulty: 4 },
];

export const GYNECOLOGY_PROCEDURES = [
  { name: "Robot-Assisted Hysterectomy", category: "Oncology", approaches: ["ROBOTIC"], avgDuration: 180, difficulty: 4 },
  { name: "Laparoscopic Salpingo-Oophorectomy", category: "Oncology", approaches: ["LAPAROSCOPIC"], avgDuration: 90, difficulty: 3 },
  { name: "Radical Hysterectomy", category: "Oncology", approaches: ["OPEN"], avgDuration: 210, difficulty: 5 },
  { name: "Pelvic Lymph Node Dissection", category: "Oncology", approaches: ["LAPAROSCOPIC", "ROBOTIC"], avgDuration: 120, difficulty: 4 },
];

export const VASCULAR_PROCEDURES = [
  { name: "Carotid Endarterectomy", category: "Cerebrovascular", approaches: ["OPEN"], avgDuration: 120, difficulty: 4 },
  { name: "EVAR (Endovascular Aortic Repair)", category: "Aortic", approaches: ["ENDOSCOPIC"], avgDuration: 150, difficulty: 5 },
  { name: "Femoral-Popliteal Bypass", category: "Peripheral", approaches: ["OPEN"], avgDuration: 180, difficulty: 4 },
  { name: "AV Fistula Creation", category: "Dialysis", approaches: ["OPEN"], avgDuration: 90, difficulty: 3 },
];

export const HEPATOBILIARY_PROCEDURES = [
  { name: "Laparoscopic Liver Resection", category: "Liver", approaches: ["LAPAROSCOPIC"], avgDuration: 240, difficulty: 5 },
  { name: "Open Hepatectomy", category: "Liver", approaches: ["OPEN"], avgDuration: 300, difficulty: 5 },
  { name: "Laparoscopic Common Bile Duct Exploration", category: "Biliary", approaches: ["LAPAROSCOPIC"], avgDuration: 120, difficulty: 4 },
  { name: "Pancreaticoduodenectomy", category: "Pancreatic", approaches: ["OPEN"], avgDuration: 360, difficulty: 5 },
];

export const COLORECTAL_PROCEDURES = [
  { name: "Laparoscopic Anterior Resection", category: "Colorectal", approaches: ["LAPAROSCOPIC"], avgDuration: 180, difficulty: 4 },
  { name: "Abdominoperineal Resection", category: "Colorectal", approaches: ["OPEN", "LAPAROSCOPIC"], avgDuration: 240, difficulty: 5 },
  { name: "Total Colectomy", category: "Colorectal", approaches: ["LAPAROSCOPIC"], avgDuration: 180, difficulty: 4 },
  { name: "Hemorrhoidectomy", category: "Anorectal", approaches: ["OPEN"], avgDuration: 45, difficulty: 2 },
];

export const TRANSPLANT_PROCEDURES = [
  { name: "Kidney Transplant", category: "Kidney", approaches: ["OPEN"], avgDuration: 180, difficulty: 5 },
  { name: "Liver Transplant", category: "Liver", approaches: ["OPEN"], avgDuration: 480, difficulty: 5 },
  { name: "Donor Nephrectomy (Laparoscopic)", category: "Kidney", approaches: ["LAPAROSCOPIC"], avgDuration: 150, difficulty: 4 },
];

export const ALL_PROCEDURES_BY_SPECIALTY: Record<string, typeof UROLOGY_PROCEDURES> = {
  urology: UROLOGY_PROCEDURES,
  "general-surgery": GENERAL_SURGERY_PROCEDURES,
  orthopedic: ORTHOPEDIC_PROCEDURES,
  cardiothoracic: CARDIOTHORACIC_PROCEDURES,
  neurosurgery: NEUROSURGERY_PROCEDURES,
  gynecology: GYNECOLOGY_PROCEDURES,
  vascular: VASCULAR_PROCEDURES,
  hepatobiliary: HEPATOBILIARY_PROCEDURES,
  colorectal: COLORECTAL_PROCEDURES,
  transplant: TRANSPLANT_PROCEDURES,
};

export const FREE_TIER_WEEKLY_LIMIT = 5;
export const FREE_TIER_EXPORT_LOCKED = true;
export const FREE_TIER_PERCENTILE_LOCKED = true;

export const MILESTONE_THRESHOLDS = {
  TOTAL_CASES: [1, 5, 10, 25, 50, 100, 200, 500],
  PROCEDURE_COUNT: [1, 5, 10, 25, 50],
  STREAK_DAYS: [7, 14, 30, 60, 90],
  INDEPENDENT_CASES: [1, 5, 10, 25, 50],
};

export const BADGE_KEYS: Record<string, { label: string; color: string; emoji: string }> = {
  total_1: { label: "First Case", color: "#6366f1", emoji: "🎯" },
  total_5: { label: "Getting Started", color: "#6366f1", emoji: "⭐" },
  total_10: { label: "Hitting Stride", color: "#2563eb", emoji: "🚀" },
  total_25: { label: "Quarter Century", color: "#2563eb", emoji: "🏆" },
  total_50: { label: "Half Century", color: "#f59e0b", emoji: "🌟" },
  total_100: { label: "Centurion", color: "#f59e0b", emoji: "💎" },
  total_200: { label: "Elite Surgeon", color: "#10b981", emoji: "👑" },
  total_500: { label: "Legendary", color: "#ef4444", emoji: "🔥" },
  rarp_10: { label: "RARP Expert", color: "#2563eb", emoji: "🤖" },
  rarp_20: { label: "RARP Master", color: "#6366f1", emoji: "⚡" },
  rarp_independent: { label: "RARP Independent", color: "#10b981", emoji: "🎖️" },
  streak_7: { label: "7-Day Streak", color: "#f59e0b", emoji: "🔥" },
  streak_30: { label: "30-Day Streak", color: "#ef4444", emoji: "🔥" },
  streak_90: { label: "90-Day Streak", color: "#dc2626", emoji: "🌋" },
};
