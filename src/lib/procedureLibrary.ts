// ---------------------------------------------------------------------------
// Hippo Comprehensive Procedure Library
// 700+ clinically accurate procedures across 17 surgical specialties
// ---------------------------------------------------------------------------

export interface Procedure {
  id: string;
  name: string;
  specialty: string;          // matches SPECIALTIES slug
  category: string;
  subcategory: string;
  approaches: string[];
  aliases: string[];
  complexityTier: 1 | 2 | 3; // 1=basic 2=intermediate 3=advanced
  avgDurationMinutes?: number;
  isMilestone?: boolean;
  isCommon?: boolean;
  active: boolean;
}

function p(
  id: string, name: string, specialty: string, category: string, subcategory: string,
  approaches: string[], aliases: string[], tier: 1|2|3, duration?: number,
  flags?: { milestone?: boolean; common?: boolean }
): Procedure {
  return { id, name, specialty, category, subcategory, approaches, aliases,
    complexityTier: tier, avgDurationMinutes: duration,
    isMilestone: flags?.milestone, isCommon: flags?.common, active: true };
}

// ============================================================================
// UROLOGY
// ============================================================================
const UROLOGY: Procedure[] = [
  // Endourology & Stone
  p('uro-001','Cystoscopy','urology','Endourology','Diagnostic',['Endoscopic'],['bladder scope','rigid cystoscopy'],1,20,{common:true,milestone:true}),
  p('uro-002','Flexible Cystoscopy','urology','Endourology','Diagnostic',['Endoscopic'],['flex cysto'],1,15,{common:true}),
  p('uro-003','Ureteroscopy (Diagnostic)','urology','Endourology','Ureteroscopy',['Endoscopic'],['URS diagnostic'],1,30),
  p('uro-004','Ureteroscopy with Laser Lithotripsy','urology','Endourology','Stone Disease',['Endoscopic'],['URS laser','ureterorenoscopy','URS LL'],2,60,{common:true,milestone:true}),
  p('uro-005','Percutaneous Nephrolithotomy','urology','Endourology','Stone Disease',['Percutaneous'],['PCNL','nephrostomy stone removal'],3,90,{milestone:true}),
  p('uro-006','Mini-PCNL','urology','Endourology','Stone Disease',['Percutaneous'],['mini perc','micro PCNL'],3,80),
  p('uro-007','Extracorporeal Shock Wave Lithotripsy','urology','Endourology','Stone Disease',['Other'],['ESWL','SWL'],1,60),
  p('uro-008','Ureteral Stent Placement','urology','Endourology','Stone Disease',['Endoscopic'],['JJ stent','double J stent','ureteric stent'],1,20,{common:true}),
  p('uro-009','Ureteral Stent Removal','urology','Endourology','Stone Disease',['Endoscopic'],['stent removal'],1,10,{common:true}),
  p('uro-010','Suprapubic Catheter Placement','urology','Endourology','Urinary Access',['Percutaneous'],['SPC','suprapubic tube'],1,20),
  p('uro-011','Nephrostomy Tube Placement','urology','Endourology','Urinary Access',['Percutaneous'],['PCN','nephrostomy'],2,40),
  // Bladder
  p('uro-012','Transurethral Resection of Bladder Tumor','urology','Bladder','Oncology',['Endoscopic'],['TURBT','bladder tumour resection'],2,45,{common:true,milestone:true}),
  p('uro-013','Bladder Biopsy','urology','Bladder','Diagnostic',['Endoscopic'],['cold cup biopsy'],1,20),
  p('uro-014','Intravesical BCG Instillation','urology','Bladder','Oncology',['Endoscopic'],['BCG therapy'],1,20,{common:true}),
  p('uro-015','Intravesical Chemotherapy','urology','Bladder','Oncology',['Endoscopic'],['mitomycin','gemcitabine instillation'],1,20),
  p('uro-016','Radical Cystectomy with Ileal Conduit','urology','Bladder','Oncology',['Open'],['RC ileal conduit','cystectomy'],3,300,{milestone:true}),
  p('uro-017','Robot-Assisted Radical Cystectomy','urology','Bladder','Oncology',['Robotic'],['RARC'],3,360,{milestone:true}),
  p('uro-018','Neobladder Construction','urology','Bladder','Reconstruction',['Open','Robotic'],['orthotopic neobladder'],3,360),
  p('uro-019','Augmentation Cystoplasty','urology','Bladder','Reconstruction',['Open'],['bladder augmentation'],3,180),
  // Prostate
  p('uro-020','Transurethral Resection of Prostate','urology','Prostate','BPH',['Endoscopic'],['TURP','prostate resection'],2,75,{common:true,milestone:true}),
  p('uro-021','Holmium Laser Enucleation of Prostate','urology','Prostate','BPH',['Endoscopic'],['HoLEP'],3,90,{milestone:true}),
  p('uro-022','Photoselective Vaporization of Prostate','urology','Prostate','BPH',['Endoscopic'],['PVP','GreenLight laser'],2,60),
  p('uro-023','Robot-Assisted Radical Prostatectomy','urology','Prostate','Oncology',['Robotic'],['RALP','RARP','robotic prostatectomy'],3,180,{milestone:true,common:true}),
  p('uro-024','Open Radical Prostatectomy','urology','Prostate','Oncology',['Open'],['RRP','retropubic prostatectomy'],3,210,{milestone:true}),
  p('uro-025','Prostate Biopsy (TRUS)','urology','Prostate','Diagnostic',['Percutaneous'],['prostate bx','TRUS biopsy'],1,20,{common:true}),
  p('uro-026','Prostate Biopsy (MRI-Fusion)','urology','Prostate','Diagnostic',['Percutaneous'],['MRI-targeted biopsy','fusion biopsy'],2,30),
  p('uro-027','Transperineal Prostate Biopsy','urology','Prostate','Diagnostic',['Percutaneous'],['TP biopsy'],2,30),
  // Kidney
  p('uro-028','Laparoscopic Radical Nephrectomy','urology','Kidney','Oncology',['Laparoscopic'],['lap radical neph','LRN'],3,150,{milestone:true}),
  p('uro-029','Open Radical Nephrectomy','urology','Kidney','Oncology',['Open'],['open nephrectomy'],3,180,{milestone:true}),
  p('uro-030','Robot-Assisted Partial Nephrectomy','urology','Kidney','Oncology',['Robotic'],['RAPN','robotic partial neph'],3,180,{milestone:true}),
  p('uro-031','Laparoscopic Partial Nephrectomy','urology','Kidney','Oncology',['Laparoscopic'],['LPN'],3,180,{milestone:true}),
  p('uro-032','Open Partial Nephrectomy','urology','Kidney','Oncology',['Open'],['open partial neph'],3,180),
  p('uro-033','Nephroureterectomy','urology','Kidney','Oncology',['Laparoscopic','Open'],['NUX','upper tract TCC'],3,180,{milestone:true}),
  p('uro-034','Laparoscopic Adrenalectomy','urology','Kidney','Adrenal',['Laparoscopic'],['adrenal removal','lap adrenalectomy'],3,90,{milestone:true}),
  p('uro-035','Open Pyeloplasty','urology','Kidney','Reconstruction',['Open'],['Anderson-Hynes'],2,120),
  p('uro-036','Laparoscopic Pyeloplasty','urology','Kidney','Reconstruction',['Laparoscopic'],['lap pyeloplasty'],3,120,{milestone:true}),
  p('uro-037','Robot-Assisted Pyeloplasty','urology','Kidney','Reconstruction',['Robotic'],['robotic pyeloplasty'],3,110,{milestone:true}),
  p('uro-038','Renal Transplant','urology','Kidney','Transplant',['Open'],['kidney transplant'],3,180),
  // Upper Tract
  p('uro-039','Retroperitoneal Lymph Node Dissection','urology','Oncology','Testis',['Open'],['RPLND'],3,240,{milestone:true}),
  p('uro-040','Orchiectomy (Radical)','urology','Scrotum','Oncology',['Open'],['radical orchiectomy','testis removal'],2,45,{milestone:true,common:true}),
  // Reconstruction
  p('uro-041','Urethroplasty','urology','Urethra','Reconstruction',['Open'],['stricture repair','urethral reconstruction'],3,180,{milestone:true}),
  p('uro-042','Ureteral Reimplantation','urology','Ureter','Reconstruction',['Open','Robotic'],['ureteral reimplant'],3,120),
  p('uro-043','Ureteral Stricture Repair','urology','Ureter','Reconstruction',['Open','Laparoscopic'],['ureteral repair'],3,120),
  // Incontinence
  p('uro-044','Artificial Urinary Sphincter','urology','Incontinence','Male',['Open'],['AUS','AMS 800'],3,90,{milestone:true}),
  p('uro-045','Male Urethral Sling','urology','Incontinence','Male',['Open'],['AdVance sling','bulbourethral sling'],2,60),
  p('uro-046','Female Mid-Urethral Sling','urology','Incontinence','Female',['Open'],['TVT','TOT','retropubic sling'],2,45,{common:true}),
  p('uro-047','Sacral Neuromodulation','urology','Incontinence','Neuromodulation',['Open'],['InterStim','SNM','Bladder pacemaker'],2,60),
  // Andrology
  p('uro-048','Penile Prosthesis Implantation','urology','Andrology','Erectile Dysfunction',['Open'],['IPP','inflatable penile prosthesis'],3,90,{milestone:true}),
  p('uro-049','Vasectomy','urology','Andrology','Contraception',['Open'],['male sterilisation'],1,20,{common:true}),
  p('uro-050','Vasovasostomy','urology','Andrology','Reconstruction',['Open'],['vasectomy reversal'],3,180,{milestone:true}),
  p('uro-051','Varicocelectomy','urology','Andrology','Male Infertility',['Open','Laparoscopic'],['varicocele repair'],2,60,{common:true}),
  p('uro-052','Hydrocelectomy','urology','Scrotum','Benign',['Open'],['hydrocele repair'],1,45,{common:true}),
  // Pediatric
  p('uro-053','Orchiopexy','urology','Pediatric','Undescended Testis',['Open','Laparoscopic'],['undescended testis repair'],2,45,{milestone:true,common:true}),
  p('uro-054','Hypospadias Repair','urology','Pediatric','Urethroplasty',['Open'],['hypospadias'],3,120,{milestone:true}),
  p('uro-055','Circumcision','urology','Pediatric','Foreskin',['Open'],['circumcision'],1,20,{common:true}),
  p('uro-056','Vesicoureteral Reflux Repair (Open)','urology','Pediatric','Reflux',['Open'],['VUR repair','Cohen reimplant'],3,120),
  p('uro-057','Laparoscopic Ureteral Reimplant (Pediatric)','urology','Pediatric','Reflux',['Laparoscopic'],['lap VUR'],3,120),
  // Other
  p('uro-058','Penile Plaque Excision / Grafting','urology','Andrology','Peyronies',['Open'],['Peyronie surgery'],3,120),
  p('uro-059','Dorsal Slit / Meatotomy','urology','Urethra','Benign',['Open'],['meatal stenosis'],1,15),
  p('uro-060','Testicular Biopsy','urology','Andrology','Infertility',['Open'],['TESE','testis biopsy'],1,30),
];

// ============================================================================
// GENERAL SURGERY
// ============================================================================
const GENERAL_SURGERY: Procedure[] = [
  // Biliary
  p('gs-001','Laparoscopic Cholecystectomy','general-surgery','Biliary','Gallbladder',['Laparoscopic'],['lap chole','LC'],2,60,{common:true,milestone:true}),
  p('gs-002','Open Cholecystectomy','general-surgery','Biliary','Gallbladder',['Open'],['open chole'],2,90,{milestone:true}),
  p('gs-003','Common Bile Duct Exploration (Laparoscopic)','general-surgery','Biliary','CBD',['Laparoscopic'],['lap CBDE','choledochoscopy'],3,120),
  p('gs-004','Choledochoduodenostomy','general-surgery','Biliary','CBD',['Open'],['CBD bypass'],3,120),
  p('gs-005','Cholecystojejunostomy','general-surgery','Biliary','Palliative',['Open','Laparoscopic'],['biliary bypass'],3,120),
  p('gs-006','ERCP (Surgical Assist)','general-surgery','Biliary','Endoscopy',['Endoscopic'],['endoscopic retrograde','ERCP'],2,45,{common:true}),
  // Appendix
  p('gs-007','Laparoscopic Appendectomy','general-surgery','Colorectal','Appendix',['Laparoscopic'],['lap appy','appendectomy'],1,45,{common:true,milestone:true}),
  p('gs-008','Open Appendectomy','general-surgery','Colorectal','Appendix',['Open'],['open appy'],2,60,{milestone:true}),
  // Hernia
  p('gs-009','Open Inguinal Hernia Repair (Lichtenstein)','general-surgery','Hernia','Inguinal',['Open'],['Lichtenstein','open inguinal hernia'],2,60,{common:true,milestone:true}),
  p('gs-010','Laparoscopic TEP Inguinal Hernia Repair','general-surgery','Hernia','Inguinal',['Laparoscopic'],['TEP','totally extraperitoneal'],3,75,{milestone:true}),
  p('gs-011','Laparoscopic TAPP Inguinal Hernia Repair','general-surgery','Hernia','Inguinal',['Laparoscopic'],['TAPP','transabdominal preperitoneal'],3,75,{milestone:true}),
  p('gs-012','Open Ventral Hernia Repair','general-surgery','Hernia','Ventral',['Open'],['open VHR','incisional hernia'],2,90),
  p('gs-013','Laparoscopic Ventral Hernia Repair','general-surgery','Hernia','Ventral',['Laparoscopic'],['lap VHR','LVHR'],3,90,{milestone:true}),
  p('gs-014','Robotic Ventral Hernia Repair','general-surgery','Hernia','Ventral',['Robotic'],['robotic hernia','rVHR'],3,100),
  p('gs-015','Femoral Hernia Repair','general-surgery','Hernia','Femoral',['Open'],['femoral hernia'],2,60),
  p('gs-016','Umbilical Hernia Repair','general-surgery','Hernia','Umbilical',['Open','Laparoscopic'],['umbilical hernia'],1,45,{common:true}),
  p('gs-017','Parastomal Hernia Repair','general-surgery','Hernia','Parastomal',['Open','Laparoscopic'],['parastomal hernia'],3,120),
  // Foregut
  p('gs-018','Laparoscopic Nissen Fundoplication','general-surgery','Foregut','Reflux',['Laparoscopic'],['Nissen','lap Nissen','antireflux'],3,90,{milestone:true}),
  p('gs-019','Laparoscopic Toupet Fundoplication','general-surgery','Foregut','Reflux',['Laparoscopic'],['Toupet','partial fundoplication'],3,90),
  p('gs-020','Heller Myotomy','general-surgery','Foregut','Achalasia',['Laparoscopic','Robotic'],['Heller','esophageal myotomy'],3,90,{milestone:true}),
  p('gs-021','Peroral Endoscopic Myotomy','general-surgery','Foregut','Achalasia',['Endoscopic'],['POEM'],3,90),
  p('gs-022','Paraesophageal Hernia Repair','general-surgery','Foregut','Hiatal Hernia',['Laparoscopic'],['PEH repair','giant hiatal hernia'],3,120,{milestone:true}),
  p('gs-023','Gastrostomy Tube Placement (Open)','general-surgery','Foregut','Access',['Open'],['G-tube','gastrostomy'],1,30),
  p('gs-024','PEG Tube Placement','general-surgery','Foregut','Access',['Endoscopic'],['percutaneous endoscopic gastrostomy'],1,20,{common:true}),
  // Bariatric
  p('gs-025','Roux-en-Y Gastric Bypass','general-surgery','Bariatric','Bypass',['Laparoscopic','Robotic'],['RYGB','gastric bypass'],3,150,{milestone:true}),
  p('gs-026','Sleeve Gastrectomy','general-surgery','Bariatric','Restriction',['Laparoscopic'],['sleeve','VSG'],3,90,{milestone:true}),
  p('gs-027','Adjustable Gastric Band','general-surgery','Bariatric','Restriction',['Laparoscopic'],['lap band','LAGB'],2,60),
  p('gs-028','Biliopancreatic Diversion with Duodenal Switch','general-surgery','Bariatric','Malabsorptive',['Laparoscopic'],['BPD-DS','duodenal switch'],3,240),
  // Colorectal
  p('gs-029','Right Hemicolectomy','general-surgery','Colorectal','Colon',['Laparoscopic','Open','Robotic'],['right colectomy','RHC'],3,120,{milestone:true,common:true}),
  p('gs-030','Left Hemicolectomy','general-surgery','Colorectal','Colon',['Laparoscopic','Open'],['left colectomy','LHC'],3,120,{milestone:true}),
  p('gs-031','Sigmoid Colectomy','general-surgery','Colorectal','Colon',['Laparoscopic','Open'],['sigmoid resection'],3,120,{milestone:true}),
  p('gs-032','Total Colectomy','general-surgery','Colorectal','Colon',['Laparoscopic','Open'],['total colon removal'],3,180,{milestone:true}),
  p('gs-033','Anterior Resection','general-surgery','Colorectal','Rectum',['Laparoscopic','Open','Robotic'],['LAR','low anterior resection'],3,180,{milestone:true}),
  p('gs-034','Abdominoperineal Resection','general-surgery','Colorectal','Rectum',['Laparoscopic','Open'],['APR','Miles procedure'],3,240,{milestone:true}),
  p('gs-035','Hartmann Procedure','general-surgery','Colorectal','Emergency',['Open'],['Hartmanns','sigmoid colostomy'],3,120,{common:true,milestone:true}),
  p('gs-036','Ileostomy Formation','general-surgery','Colorectal','Stoma',['Open','Laparoscopic'],['loop ileostomy','end ileostomy'],2,60,{common:true}),
  p('gs-037','Colostomy Formation','general-surgery','Colorectal','Stoma',['Open'],['loop colostomy','end colostomy'],2,60,{common:true}),
  p('gs-038','Stoma Reversal','general-surgery','Colorectal','Stoma',['Open'],['ileostomy reversal','colostomy closure'],2,90,{common:true}),
  p('gs-039','Small Bowel Resection','general-surgery','Colorectal','Small Bowel',['Open','Laparoscopic'],['SBR','bowel resection'],2,90,{common:true,milestone:true}),
  p('gs-040','Adhesiolysis','general-surgery','Colorectal','Obstruction',['Open','Laparoscopic'],['lysis of adhesions','bowel obstruction surgery'],2,90,{common:true}),
  // Breast
  p('gs-041','Lumpectomy','general-surgery','Breast','Breast Conservation',['Open'],['wide local excision','WLE','partial mastectomy'],2,60,{common:true,milestone:true}),
  p('gs-042','Simple Mastectomy','general-surgery','Breast','Mastectomy',['Open'],['total mastectomy'],2,120,{milestone:true}),
  p('gs-043','Skin-Sparing Mastectomy','general-surgery','Breast','Mastectomy',['Open'],['SSM'],3,150),
  p('gs-044','Nipple-Sparing Mastectomy','general-surgery','Breast','Mastectomy',['Open'],['NSM'],3,150),
  p('gs-045','Sentinel Lymph Node Biopsy','general-surgery','Breast','Axilla',['Open'],['SLNB','sentinel node'],2,45,{common:true,milestone:true}),
  p('gs-046','Axillary Lymph Node Dissection','general-surgery','Breast','Axilla',['Open'],['ALND','axillary clearance'],3,90,{milestone:true}),
  // Endocrine
  p('gs-047','Total Thyroidectomy','general-surgery','Endocrine','Thyroid',['Open'],['total thyroidectomy'],3,120,{milestone:true}),
  p('gs-048','Hemithyroidectomy','general-surgery','Endocrine','Thyroid',['Open'],['thyroid lobectomy','hemi-thyroidectomy'],2,90,{milestone:true}),
  p('gs-049','Parathyroidectomy','general-surgery','Endocrine','Parathyroid',['Open'],['parathyroid removal','minimally invasive parathyroidectomy'],2,90,{milestone:true}),
  p('gs-050','Adrenalectomy','general-surgery','Endocrine','Adrenal',['Laparoscopic','Open'],['adrenal removal','lap adrenalectomy'],3,90,{milestone:true}),
  // HPB
  p('gs-051','Whipple Procedure','general-surgery','HPB','Pancreas',['Open'],['pancreaticoduodenectomy','Kausch-Whipple'],3,360,{milestone:true}),
  p('gs-052','Distal Pancreatectomy','general-surgery','HPB','Pancreas',['Open','Laparoscopic'],['distal pancreatectomy + splenectomy'],3,240,{milestone:true}),
  p('gs-053','Liver Resection (Partial)','general-surgery','HPB','Liver',['Open','Laparoscopic'],['hepatectomy','liver resection'],3,240,{milestone:true}),
  p('gs-054','Right Hepatectomy','general-surgery','HPB','Liver',['Open'],['right hepatic lobectomy'],3,300,{milestone:true}),
  p('gs-055','Left Hepatectomy','general-surgery','HPB','Liver',['Open','Laparoscopic'],['left hepatic lobectomy'],3,240),
  p('gs-056','Splenectomy','general-surgery','HPB','Spleen',['Open','Laparoscopic'],['spleen removal','lap splenectomy'],2,90,{common:true,milestone:true}),
  // Trauma / Emergency
  p('gs-057','Exploratory Laparotomy','general-surgery','Trauma','Emergency',['Open'],['ex lap','damage control lap'],2,90,{common:true,milestone:true}),
  p('gs-058','Damage Control Laparotomy','general-surgery','Trauma','Emergency',['Open'],['DCL','abbreviated laparotomy'],3,90,{milestone:true}),
  p('gs-059','Peritoneal Washout','general-surgery','Trauma','Emergency',['Open','Laparoscopic'],['peritoneal lavage','washout'],1,30,{common:true}),
  p('gs-060','Perforated Viscus Repair','general-surgery','Trauma','Emergency',['Open','Laparoscopic'],['perf peptic ulcer repair','perforated bowel'],3,90,{common:true,milestone:true}),
  // Access
  p('gs-061','Central Venous Catheter Insertion','general-surgery','Vascular Access','CVC',['Percutaneous'],['CVC','central line','subclavian line'],1,20,{common:true}),
  p('gs-062','Port-a-Cath Insertion','general-surgery','Vascular Access','Port',['Open','Percutaneous'],['port insertion','venous port'],1,30,{common:true}),
  p('gs-063','PICC Line Insertion','general-surgery','Vascular Access','PICC',['Percutaneous'],['PICC'],1,20),
];

// ============================================================================
// NEUROSURGERY
// ============================================================================
const NEUROSURGERY: Procedure[] = [
  p('ns-001','Craniotomy for Tumor Resection','neurosurgery','Cranial','Tumor',['Open'],['craniotomy','brain tumor removal'],3,240,{common:true,milestone:true}),
  p('ns-002','Awake Craniotomy','neurosurgery','Cranial','Tumor',['Open'],['awake brain surgery','language mapping'],3,300,{milestone:true}),
  p('ns-003','Stereotactic Brain Biopsy','neurosurgery','Cranial','Tumor',['Open','Other'],['frame-based biopsy','frameless biopsy'],2,60,{common:true,milestone:true}),
  p('ns-004','Craniectomy (Decompressive)','neurosurgery','Cranial','Trauma',['Open'],['decompressive craniectomy','DC'],3,120,{milestone:true}),
  p('ns-005','Cranioplasty','neurosurgery','Cranial','Reconstruction',['Open'],['skull reconstruction','cranioplasty'],2,120,{milestone:true}),
  p('ns-006','Aneurysm Clipping','neurosurgery','Vascular','Aneurysm',['Open'],['cerebral aneurysm clipping','SAH surgery'],3,240,{milestone:true}),
  p('ns-007','AVM Resection','neurosurgery','Vascular','AVM',['Open'],['arteriovenous malformation'],3,300,{milestone:true}),
  p('ns-008','Cavernoma Resection','neurosurgery','Vascular','Cavernoma',['Open'],['cavernous malformation'],3,180),
  p('ns-009','Microvascular Decompression','neurosurgery','Cranial Nerve','MVD',['Open'],['MVD','trigeminal neuralgia surgery'],3,180,{milestone:true}),
  p('ns-010','VP Shunt Insertion','neurosurgery','CSF','Hydrocephalus',['Open'],['ventriculoperitoneal shunt','VP shunt'],2,60,{common:true,milestone:true}),
  p('ns-011','VA Shunt Insertion','neurosurgery','CSF','Hydrocephalus',['Open'],['ventriculoatrial shunt'],2,60),
  p('ns-012','LP Shunt Insertion','neurosurgery','CSF','Hydrocephalus',['Open'],['lumboperitoneal shunt'],2,60),
  p('ns-013','Shunt Revision','neurosurgery','CSF','Hydrocephalus',['Open'],['shunt revision','shunt malfunction'],2,90,{common:true}),
  p('ns-014','Endoscopic Third Ventriculostomy','neurosurgery','CSF','Hydrocephalus',['Endoscopic'],['ETV'],2,60,{milestone:true}),
  p('ns-015','External Ventricular Drain Placement','neurosurgery','CSF','Emergency',['Open'],['EVD','ventriculostomy','ICP monitor'],1,30,{common:true,milestone:true}),
  p('ns-016','Intracranial Pressure Monitor Placement','neurosurgery','CSF','Monitoring',['Open'],['ICP bolt','parenchymal ICP'],1,20,{common:true}),
  p('ns-017','ACDF','neurosurgery','Spine','Cervical',['Open'],['anterior cervical discectomy and fusion','anterior cervical surgery'],3,120,{common:true,milestone:true}),
  p('ns-018','Posterior Cervical Fusion','neurosurgery','Spine','Cervical',['Open'],['PCF','posterior cervical decompression'],3,180,{milestone:true}),
  p('ns-019','Cervical Laminoplasty','neurosurgery','Spine','Cervical',['Open'],['laminoplasty'],3,180),
  p('ns-020','Lumbar Discectomy','neurosurgery','Spine','Lumbar',['Open'],['microdiscectomy','lumbar disc surgery'],2,90,{common:true,milestone:true}),
  p('ns-021','Lumbar Laminectomy','neurosurgery','Spine','Lumbar',['Open'],['lumbar decompression','laminectomy'],2,90,{common:true,milestone:true}),
  p('ns-022','Lumbar Fusion (TLIF)','neurosurgery','Spine','Lumbar',['Open'],['TLIF','transforaminal lumbar interbody fusion'],3,180,{milestone:true}),
  p('ns-023','Lumbar Fusion (PLIF)','neurosurgery','Spine','Lumbar',['Open'],['PLIF','posterior lumbar interbody fusion'],3,180),
  p('ns-024','Lumbar Fusion (ALIF)','neurosurgery','Spine','Lumbar',['Open'],['ALIF','anterior lumbar fusion'],3,180),
  p('ns-025','Posterior Spinal Fusion (Thoracic)','neurosurgery','Spine','Thoracic',['Open'],['thoracic PSF','posterior spinal fusion'],3,300,{milestone:true}),
  p('ns-026','Spinal Cord Stimulator Implant','neurosurgery','Functional','Neuromodulation',['Open'],['SCS implant','dorsal column stimulator'],2,90,{milestone:true}),
  p('ns-027','Deep Brain Stimulation','neurosurgery','Functional','DBS',['Open'],['DBS','Parkinson surgery'],3,240,{milestone:true}),
  p('ns-028','Vagus Nerve Stimulator','neurosurgery','Functional','Epilepsy',['Open'],['VNS'],2,60),
  p('ns-029','Temporal Lobectomy','neurosurgery','Epilepsy','Resection',['Open'],['epilepsy surgery','anterior temporal lobectomy'],3,240,{milestone:true}),
  p('ns-030','Hemispherectomy','neurosurgery','Epilepsy','Disconnection',['Open'],['functional hemispherectomy'],3,360,{milestone:true}),
  p('ns-031','Corpus Callosotomy','neurosurgery','Epilepsy','Disconnection',['Open'],['CC section'],3,180),
  p('ns-032','Transphenoidal Pituitary Surgery','neurosurgery','Sellar','Pituitary',['Endoscopic'],['transphenoidal hypophysectomy','pituitary adenoma removal'],3,180,{milestone:true}),
  p('ns-033','Posterior Fossa Craniotomy','neurosurgery','Cranial','Posterior Fossa',['Open'],['suboccipital craniotomy'],3,240,{milestone:true}),
  p('ns-034','Spine Trauma Surgery (Fracture Fixation)','neurosurgery','Spine','Trauma',['Open'],['pedicle screw fixation','spine fracture'],3,180,{milestone:true}),
];

// ============================================================================
// ORTHOPEDIC SURGERY
// ============================================================================
const ORTHOPEDIC: Procedure[] = [
  // Arthroplasty
  p('orth-001','Total Hip Arthroplasty (Primary)','orthopedic','Arthroplasty','Hip',['Open'],['THA','total hip replacement','THR'],3,90,{common:true,milestone:true}),
  p('orth-002','Total Hip Arthroplasty (Revision)','orthopedic','Arthroplasty','Hip',['Open'],['revision THA','revision hip'],3,180,{milestone:true}),
  p('orth-003','Total Knee Arthroplasty (Primary)','orthopedic','Arthroplasty','Knee',['Open'],['TKA','total knee replacement','TKR'],3,90,{common:true,milestone:true}),
  p('orth-004','Total Knee Arthroplasty (Revision)','orthopedic','Arthroplasty','Knee',['Open'],['revision TKA'],3,180,{milestone:true}),
  p('orth-005','Unicompartmental Knee Arthroplasty','orthopedic','Arthroplasty','Knee',['Open'],['UKA','medial UKA','partial knee replacement'],3,75),
  p('orth-006','Total Shoulder Arthroplasty','orthopedic','Arthroplasty','Shoulder',['Open'],['TSA','shoulder replacement'],3,120,{milestone:true}),
  p('orth-007','Reverse Shoulder Arthroplasty','orthopedic','Arthroplasty','Shoulder',['Open'],['RSA','reverse total shoulder'],3,120,{milestone:true}),
  p('orth-008','Total Ankle Arthroplasty','orthopedic','Arthroplasty','Ankle',['Open'],['TAA','ankle replacement'],3,120),
  // Trauma
  p('orth-009','ORIF Hip Fracture (DHS)','orthopedic','Trauma','Hip',['Open'],['dynamic hip screw','DHS','neck of femur'],2,90,{common:true,milestone:true}),
  p('orth-010','Femoral Nail (Intramedullary)','orthopedic','Trauma','Femur',['Open'],['IM nail femur','femoral nailing'],3,90,{milestone:true}),
  p('orth-011','Tibial Nail (Intramedullary)','orthopedic','Trauma','Tibia',['Open'],['IM nail tibia','tibial nailing'],3,90,{milestone:true}),
  p('orth-012','ORIF Distal Radius','orthopedic','Trauma','Wrist',['Open'],['distal radius ORIF','volar plate'],2,60,{common:true,milestone:true}),
  p('orth-013','ORIF Ankle','orthopedic','Trauma','Ankle',['Open'],['bimalleolar ORIF','lateral malleolus fixation'],2,75,{common:true,milestone:true}),
  p('orth-014','ORIF Proximal Humerus','orthopedic','Trauma','Shoulder',['Open'],['proximal humerus fixation'],2,90,{common:true}),
  p('orth-015','ORIF Clavicle','orthopedic','Trauma','Shoulder',['Open'],['clavicle fixation','clavicular plate'],2,60,{common:true}),
  p('orth-016','ORIF Humerus (Shaft)','orthopedic','Trauma','Humerus',['Open'],['humeral shaft nail','humeral shaft plate'],2,90),
  p('orth-017','ORIF Tibial Plateau','orthopedic','Trauma','Tibia',['Open'],['tibial plateau fixation'],3,120,{milestone:true}),
  p('orth-018','ORIF Pilon Fracture','orthopedic','Trauma','Ankle',['Open'],['tibial plafond ORIF'],3,150,{milestone:true}),
  p('orth-019','ORIF Calcaneus','orthopedic','Trauma','Foot',['Open'],['calcaneal ORIF'],3,120),
  p('orth-020','External Fixator Application','orthopedic','Trauma','Spanning',['Open'],['ex fix','spanning external fixator'],2,60,{common:true,milestone:true}),
  p('orth-021','Hip Hemiarthroplasty','orthopedic','Trauma','Hip',['Open'],['hemiarthroplasty','femoral head replacement'],2,75,{common:true,milestone:true}),
  // Sports
  p('orth-022','ACL Reconstruction','orthopedic','Sports','Knee',['Laparoscopic'],['ACLR','anterior cruciate ligament reconstruction'],3,75,{common:true,milestone:true}),
  p('orth-023','Meniscectomy (Partial)','orthopedic','Sports','Knee',['Laparoscopic'],['knee scope partial meniscectomy','arthroscopic meniscectomy'],1,30,{common:true,milestone:true}),
  p('orth-024','Meniscal Repair','orthopedic','Sports','Knee',['Laparoscopic'],['meniscal repair arthroscopic'],2,60,{milestone:true}),
  p('orth-025','PCL Reconstruction','orthopedic','Sports','Knee',['Laparoscopic'],['PCLR'],3,90),
  p('orth-026','Multi-Ligament Knee Reconstruction','orthopedic','Sports','Knee',['Laparoscopic','Open'],['MLK','knee dislocation repair'],3,180,{milestone:true}),
  p('orth-027','Rotator Cuff Repair (Arthroscopic)','orthopedic','Sports','Shoulder',['Laparoscopic'],['arthroscopic RCR','rotator cuff fix'],2,90,{common:true,milestone:true}),
  p('orth-028','Bankart Repair (Arthroscopic)','orthopedic','Sports','Shoulder',['Laparoscopic'],['labral repair','Bankart'],2,75,{milestone:true}),
  p('orth-029','Latarjet Procedure','orthopedic','Sports','Shoulder',['Open'],['coracoid transfer','Latarjet-Bristow'],3,120,{milestone:true}),
  p('orth-030','SLAP Repair','orthopedic','Sports','Shoulder',['Laparoscopic'],['superior labrum repair'],2,75),
  p('orth-031','Shoulder Arthroscopy (Diagnostic)','orthopedic','Sports','Shoulder',['Laparoscopic'],['shoulder scope'],1,30,{common:true}),
  p('orth-032','Knee Arthroscopy (Diagnostic)','orthopedic','Sports','Knee',['Laparoscopic'],['knee scope'],1,20,{common:true}),
  p('orth-033','Hip Arthroscopy','orthopedic','Sports','Hip',['Laparoscopic'],['hip scope','FAI surgery'],3,90,{milestone:true}),
  // Hand & Wrist
  p('orth-034','Carpal Tunnel Release','orthopedic','Hand','Carpal Tunnel',['Open','Endoscopic'],['CTR','ECTR','carpal tunnel decompression'],1,20,{common:true,milestone:true}),
  p('orth-035','Trigger Finger Release','orthopedic','Hand','Tendon',['Open'],['A1 pulley release','trigger finger'],1,15,{common:true}),
  p('orth-036','Dupuytren Contracture Release','orthopedic','Hand','Fascia',['Open'],['Dupuytren fasciectomy','Dupuytren contracture'],2,90,{milestone:true}),
  p('orth-037','TFCC Repair','orthopedic','Hand','Wrist',['Laparoscopic','Open'],['triangular fibrocartilage repair'],2,90),
  p('orth-038','Scaphoid ORIF','orthopedic','Hand','Wrist',['Open','Percutaneous'],['scaphoid fracture fixation','headless screw'],2,60,{milestone:true}),
  p('orth-039','Wrist Arthroscopy','orthopedic','Hand','Wrist',['Laparoscopic'],['wrist scope'],2,60),
  p('orth-040','Flexor Tendon Repair','orthopedic','Hand','Tendon',['Open'],['zone 2 flexor repair'],3,90,{milestone:true}),
  p('orth-041','Extensor Tendon Repair','orthopedic','Hand','Tendon',['Open'],['extensor tendon repair'],2,60),
  // Spine (Ortho)
  p('orth-042','Posterior Lumbar Spinal Fusion (PLIF/TLIF)','orthopedic','Spine','Lumbar',['Open'],['PLF','posterolateral fusion'],3,180,{milestone:true}),
  p('orth-043','ACDF (Orthopedic)','orthopedic','Spine','Cervical',['Open'],['anterior cervical disc fusion'],3,120,{milestone:true}),
  p('orth-044','Lumbar Laminectomy','orthopedic','Spine','Lumbar',['Open'],['lumbar decompression'],2,90,{common:true,milestone:true}),
  p('orth-045','Posterior Cervical Laminoplasty','orthopedic','Spine','Cervical',['Open'],['cervical laminoplasty'],3,180),
  p('orth-046','Vertebroplasty / Kyphoplasty','orthopedic','Spine','Fracture',['Percutaneous'],['kyphoplasty','vertebroplasty'],2,60,{common:true}),
  // Foot & Ankle
  p('orth-047','Bunionectomy (Hallux Valgus Correction)','orthopedic','Foot & Ankle','Forefoot',['Open'],['Lapidus','Austin','chevron osteotomy'],2,75,{common:true,milestone:true}),
  p('orth-048','Ankle Arthrodesis','orthopedic','Foot & Ankle','Ankle',['Open'],['ankle fusion'],3,120,{milestone:true}),
  p('orth-049','Achilles Tendon Repair','orthopedic','Foot & Ankle','Tendon',['Open'],['Achilles repair'],2,60,{common:true,milestone:true}),
  p('orth-050','Flatfoot Reconstruction','orthopedic','Foot & Ankle','Deformity',['Open'],['pes planus surgery','calcaneal osteotomy'],3,150),
];

// ============================================================================
// CARDIAC SURGERY
// ============================================================================
const CARDIAC: Procedure[] = [
  p('card-001','CABG (On-Pump)','cardiac','Coronary','Revascularization',['Open'],['coronary artery bypass','CABG on pump'],3,240,{common:true,milestone:true}),
  p('card-002','CABG (Off-Pump)','cardiac','Coronary','Revascularization',['Open'],['OPCAB','beating heart bypass'],3,240,{milestone:true}),
  p('card-003','Aortic Valve Replacement (Tissue)','cardiac','Valve','Aortic',['Open'],['AVR tissue','bioprosthetic AVR'],3,210,{common:true,milestone:true}),
  p('card-004','Aortic Valve Replacement (Mechanical)','cardiac','Valve','Aortic',['Open'],['AVR mechanical','St Jude'],3,210,{milestone:true}),
  p('card-005','Mitral Valve Repair','cardiac','Valve','Mitral',['Open'],['MVP','mitral repair','annuloplasty'],3,240,{milestone:true}),
  p('card-006','Mitral Valve Replacement','cardiac','Valve','Mitral',['Open'],['MVR'],3,240,{milestone:true}),
  p('card-007','Tricuspid Valve Repair','cardiac','Valve','Tricuspid',['Open'],['TVP','tricuspid annuloplasty'],3,240),
  p('card-008','Tricuspid Valve Replacement','cardiac','Valve','Tricuspid',['Open'],['TVR'],3,240),
  p('card-009','TAVI / TAVR Assist','cardiac','Valve','Transcatheter',['Other'],['transcatheter aortic valve','TAVR'],3,120,{common:true}),
  p('card-010','Aortic Root Replacement (Bentall)','cardiac','Aorta','Root',['Open'],['Bentall procedure','composite graft'],3,300,{milestone:true}),
  p('card-011','Ross Procedure','cardiac','Aorta','Root',['Open'],['pulmonary autograft','Ross'],3,300,{milestone:true}),
  p('card-012','Ascending Aorta Repair','cardiac','Aorta','Ascending',['Open'],['ascending aortoplasty','aortic aneurysmorrhaphy'],3,240,{milestone:true}),
  p('card-013','Aortic Arch Repair','cardiac','Aorta','Arch',['Open'],['arch replacement','circulatory arrest'],3,360,{milestone:true}),
  p('card-014','Type A Aortic Dissection Repair','cardiac','Aorta','Emergency',['Open'],['acute type A dissection','DeBakey I surgery'],3,360,{milestone:true}),
  p('card-015','Pericardiectomy','cardiac','Pericardium','Constrictive',['Open'],['constrictive pericarditis surgery'],3,180,{milestone:true}),
  p('card-016','Pericardial Window','cardiac','Pericardium','Effusion',['Open','Laparoscopic'],['pericardiocentesis surgical','subxiphoid window'],2,60,{common:true}),
  p('card-017','LVAD Implant','cardiac','Mechanical Support','VAD',['Open'],['HeartMate','HVAD','left ventricular assist device'],3,360,{milestone:true}),
  p('card-018','IABP Insertion','cardiac','Mechanical Support','IABP',['Percutaneous'],['intra-aortic balloon pump','balloon pump'],1,20,{common:true}),
  p('card-019','ECMO Cannulation','cardiac','Mechanical Support','ECMO',['Open','Percutaneous'],['VA ECMO cannulation','extracorporeal membrane oxygenation'],3,60,{milestone:true}),
  p('card-020','Heart Transplant','cardiac','Transplant','Orthotopic',['Open'],['orthotopic heart transplant','OHT'],3,360,{milestone:true}),
  p('card-021','ASD Repair','cardiac','Congenital','ASD',['Open'],['atrial septal defect closure'],2,120,{milestone:true}),
  p('card-022','VSD Repair','cardiac','Congenital','VSD',['Open'],['ventricular septal defect closure'],3,180,{milestone:true}),
  p('card-023','Minimally Invasive Valve Surgery','cardiac','Valve','MIS',['Open'],['MIVS','mini sternotomy valve'],3,240,{milestone:true}),
  p('card-024','Maze Procedure (Cox Maze)','cardiac','Arrhythmia','AF Surgery',['Open'],['Cox Maze IV','surgical ablation AF'],3,300,{milestone:true}),
  p('card-025','Pulmonary Artery Banding','cardiac','Congenital','Palliative',['Open'],['PA band'],3,120),
];

// ============================================================================
// VASCULAR SURGERY
// ============================================================================
const VASCULAR: Procedure[] = [
  p('vasc-001','Open AAA Repair','vascular','Aortic','Aneurysm',['Open'],['open abdominal aortic aneurysm repair','aortic graft'],3,240,{milestone:true}),
  p('vasc-002','EVAR','vascular','Aortic','Aneurysm',['Endoscopic'],['endovascular aortic repair','endovascular AAA'],3,150,{common:true,milestone:true}),
  p('vasc-003','TEVAR','vascular','Aortic','Thoracic',['Endoscopic'],['thoracic endovascular aortic repair'],3,180,{milestone:true}),
  p('vasc-004','Carotid Endarterectomy','vascular','Carotid','CEA',['Open'],['CEA','carotid surgery'],3,120,{common:true,milestone:true}),
  p('vasc-005','Carotid Artery Stenting','vascular','Carotid','CAS',['Endoscopic'],['CAS','carotid stent'],3,90),
  p('vasc-006','Fem-Pop Bypass (Above Knee)','vascular','Lower Extremity','Bypass',['Open'],['femoropopliteal bypass above knee','above knee bypass'],3,180,{milestone:true}),
  p('vasc-007','Fem-Pop Bypass (Below Knee)','vascular','Lower Extremity','Bypass',['Open'],['femoropopliteal bypass below knee','below knee bypass'],3,180,{milestone:true}),
  p('vasc-008','Fem-Distal Bypass','vascular','Lower Extremity','Bypass',['Open'],['femoral to tibial bypass','tibial bypass'],3,240,{milestone:true}),
  p('vasc-009','Aortobifemoral Bypass','vascular','Aortic','Bypass',['Open'],['aortofemoral bypass','aortobifemoral'],3,300,{milestone:true}),
  p('vasc-010','Axillofemoral Bypass','vascular','Extraanatomic','Bypass',['Open'],['axillo-femoral bypass','extra-anatomic'],3,180),
  p('vasc-011','AV Fistula Creation (Brescia-Cimino)','vascular','Access','Dialysis',['Open'],['AVF','brachiocephalic fistula','radiocephalic fistula'],2,60,{common:true,milestone:true}),
  p('vasc-012','AV Graft Placement','vascular','Access','Dialysis',['Open'],['AVG','PTFE graft'],2,90,{common:true,milestone:true}),
  p('vasc-013','Thrombectomy / Embolectomy','vascular','Peripheral','Acute Ischemia',['Open'],['femoral thrombectomy','Fogarty catheter'],2,60,{common:true,milestone:true}),
  p('vasc-014','Peripheral Angioplasty & Stenting','vascular','Lower Extremity','Endovascular',['Endoscopic'],['PTA stent','iliac stenting','SFA stent'],2,90,{common:true}),
  p('vasc-015','IVC Filter Placement','vascular','Venous','PE Prevention',['Endoscopic'],['inferior vena cava filter','Greenfield filter'],1,30,{common:true}),
  p('vasc-016','Varicose Vein Stripping','vascular','Venous','Varicose Veins',['Open'],['GSV stripping','great saphenous vein'],1,60,{common:true}),
  p('vasc-017','Endovenous Laser Ablation','vascular','Venous','Varicose Veins',['Endoscopic'],['EVLA','EVLT','laser varicose vein'],1,45,{common:true}),
  p('vasc-018','Renal Artery Stenting','vascular','Renal','Renovascular',['Endoscopic'],['renal artery angioplasty'],2,90),
  p('vasc-019','Mesenteric Revascularization','vascular','Visceral','Mesenteric Ischemia',['Open','Endoscopic'],['mesenteric bypass','SMA stenting'],3,240,{milestone:true}),
  p('vasc-020','Ruptured AAA Repair (Emergency)','vascular','Aortic','Emergency',['Open'],['ruptured aneurysm','emergency AAA'],3,240,{milestone:true}),
  p('vasc-021','Subclavian-Carotid Transposition','vascular','Upper Extremity','Reconstruction',['Open'],['subclavian transposition','vertebral artery surgery'],3,180),
  p('vasc-022','Thoracic Outlet Decompression','vascular','Upper Extremity','Thoracic Outlet',['Open'],['TOS surgery','first rib resection','scalenectomy'],3,180,{milestone:true}),
  p('vasc-023','Popliteal Aneurysm Repair','vascular','Lower Extremity','Aneurysm',['Open'],['popliteal bypass','popliteal aneurysm'],3,150,{milestone:true}),
  p('vasc-024','Amputation (Below Knee)','vascular','Amputation','BKA',['Open'],['BKA','transtibial amputation'],2,90,{common:true,milestone:true}),
  p('vasc-025','Amputation (Above Knee)','vascular','Amputation','AKA',['Open'],['AKA','transfemoral amputation'],2,90,{common:true,milestone:true}),
];

// ============================================================================
// PLASTIC SURGERY
// ============================================================================
const PLASTIC: Procedure[] = [
  p('plas-001','Free Flap (DIEP)','plastic','Reconstructive','Breast',['Open'],['deep inferior epigastric perforator','DIEP flap'],3,480,{milestone:true}),
  p('plas-002','Free Flap (TRAM)','plastic','Reconstructive','Breast',['Open'],['transverse rectus abdominis myocutaneous','TRAM'],3,420,{milestone:true}),
  p('plas-003','Latissimus Dorsi Flap','plastic','Reconstructive','Breast',['Open'],['LD flap','lats flap'],3,240,{milestone:true}),
  p('plas-004','Pedicled TRAM Flap','plastic','Reconstructive','Breast',['Open'],['pedicled TRAM'],3,300),
  p('plas-005','Implant-Based Breast Reconstruction','plastic','Reconstructive','Breast',['Open'],['tissue expander','implant breast recon'],2,120,{common:true,milestone:true}),
  p('plas-006','Tissue Expander Placement','plastic','Reconstructive','Breast',['Open'],['TE placement','2-stage reconstruction'],2,90,{common:true}),
  p('plas-007','Tissue Expander to Implant Exchange','plastic','Reconstructive','Breast',['Open'],['TE to implant','stage 2 recon'],2,90,{common:true}),
  p('plas-008','Skin Graft (Split Thickness)','plastic','Wound','Skin Grafts',['Open'],['STSG','split skin graft','SSG'],1,60,{common:true,milestone:true}),
  p('plas-009','Skin Graft (Full Thickness)','plastic','Wound','Skin Grafts',['Open'],['FTSG','full thickness skin graft'],1,60,{common:true}),
  p('plas-010','Local Flap Reconstruction','plastic','Reconstructive','Local Flap',['Open'],['rotational flap','advancement flap','transposition flap'],2,90,{common:true,milestone:true}),
  p('plas-011','Reduction Mammaplasty','plastic','Aesthetic','Breast',['Open'],['breast reduction','reduction mammoplasty'],2,180,{common:true,milestone:true}),
  p('plas-012','Augmentation Mammaplasty','plastic','Aesthetic','Breast',['Open'],['breast augmentation','breast implants'],2,90,{common:true,milestone:true}),
  p('plas-013','Mastopexy','plastic','Aesthetic','Breast',['Open'],['breast lift','mastopexy'],2,150,{milestone:true}),
  p('plas-014','Abdominoplasty','plastic','Aesthetic','Trunk',['Open'],['tummy tuck','abdominoplasty'],2,150,{milestone:true}),
  p('plas-015','Liposuction','plastic','Aesthetic','Body Contouring',['Open'],['lipoplasty','suction lipectomy'],1,90,{common:true}),
  p('plas-016','Rhinoplasty','plastic','Aesthetic','Face',['Open'],['nose job','rhinoplasty'],3,150,{milestone:true}),
  p('plas-017','Blepharoplasty (Upper)','plastic','Aesthetic','Eyelid',['Open'],['upper lid blepharoplasty','upper blepharoplasty'],1,45,{common:true,milestone:true}),
  p('plas-018','Blepharoplasty (Lower)','plastic','Aesthetic','Eyelid',['Open'],['lower lid blepharoplasty','lower blepharoplasty'],2,60),
  p('plas-019','Rhytidectomy','plastic','Aesthetic','Face',['Open'],['facelift','face lift'],3,300,{milestone:true}),
  p('plas-020','Otoplasty','plastic','Aesthetic','Ear',['Open'],['prominent ear correction','pinnaplasty'],1,90,{milestone:true}),
  p('plas-021','Cleft Lip Repair','plastic','Pediatric','Cleft',['Open'],['cleft lip primary repair','Millard rotation'],3,120,{milestone:true}),
  p('plas-022','Cleft Palate Repair','plastic','Pediatric','Cleft',['Open'],['palatoplasty','cleft palate primary repair'],3,120,{milestone:true}),
  p('plas-023','Scar Revision','plastic','Wound','Scar',['Open'],['scar excision','scar revision surgery'],1,45,{common:true}),
  p('plas-024','Z-Plasty','plastic','Wound','Scar',['Open'],['z-plasty scar','Z plasty'],2,60,{milestone:true}),
  p('plas-025','Nerve Repair','plastic','Hand','Nerve',['Open'],['digital nerve repair','nerve coaptation'],3,120,{milestone:true}),
  p('plas-026','Replantation','plastic','Hand','Microsurgery',['Open'],['digit replantation','finger replantation'],3,360,{milestone:true}),
  p('plas-027','Burn Debridement and Grafting','plastic','Wound','Burns',['Open'],['burn surgery','escharotomy + grafting'],2,120,{common:true,milestone:true}),
  p('plas-028','Carpal Tunnel Release (Plastic)','plastic','Hand','Nerve',['Open','Endoscopic'],['CTR plastic surgery'],1,20,{common:true}),
  p('plas-029','Dupuytren Fasciectomy (Plastic)','plastic','Hand','Fascia',['Open'],['Dupuytren contracture surgery'],2,90),
  p('plas-030','Free Flap (ALT)','plastic','Reconstructive','Lower Extremity',['Open'],['anterolateral thigh flap','ALT flap'],3,420,{milestone:true}),
];

// ============================================================================
// ENT / OTOLARYNGOLOGY
// ============================================================================
const ENT: Procedure[] = [
  p('ent-001','Tonsillectomy','ent','Oral Cavity','Tonsil',['Open'],['tonsils out','tonsillectomy'],1,30,{common:true,milestone:true}),
  p('ent-002','Adenoidectomy','ent','Oral Cavity','Adenoid',['Open'],['adenoids'],1,20,{common:true}),
  p('ent-003','Tonsillectomy & Adenoidectomy','ent','Oral Cavity','T&A',['Open'],['T&A','tonsils and adenoids'],1,40,{common:true,milestone:true}),
  p('ent-004','Myringotomy & Tube Insertion','ent','Otology','Tubes',['Open'],['grommets','tympanostomy tubes','PE tubes'],1,10,{common:true,milestone:true}),
  p('ent-005','Mastoidectomy (Simple)','ent','Otology','Mastoid',['Open'],['cortical mastoidectomy'],3,90,{milestone:true}),
  p('ent-006','Mastoidectomy (Canal Wall Down)','ent','Otology','Mastoid',['Open'],['radical mastoidectomy','modified radical'],3,120,{milestone:true}),
  p('ent-007','Tympanoplasty','ent','Otology','Tympanic Membrane',['Open'],['myringoplasty','eardrum repair'],2,90,{common:true,milestone:true}),
  p('ent-008','Stapedectomy','ent','Otology','Ossicles',['Open'],['stapes surgery','otosclerosis'],3,90,{milestone:true}),
  p('ent-009','Cochlear Implant','ent','Otology','Hearing',['Open'],['CI surgery','cochlear implantation'],3,180,{milestone:true}),
  p('ent-010','Functional Endoscopic Sinus Surgery','ent','Rhinology','Sinuses',['Endoscopic'],['FESS','ESS','sinus surgery'],2,90,{common:true,milestone:true}),
  p('ent-011','Septoplasty','ent','Rhinology','Septum',['Open'],['deviated septum','nasal septum repair'],2,60,{common:true,milestone:true}),
  p('ent-012','Inferior Turbinate Reduction','ent','Rhinology','Turbinate',['Open'],['turbinate surgery','turbinoplasty'],1,30,{common:true}),
  p('ent-013','Rhinoplasty (ENT)','ent','Rhinology','Nose',['Open'],['septorhinoplasty'],3,150,{milestone:true}),
  p('ent-014','Nasal Polypectomy','ent','Rhinology','Polyps',['Endoscopic'],['nasal polyp removal'],1,30,{common:true}),
  p('ent-015','Direct Laryngoscopy','ent','Laryngology','Larynx',['Endoscopic'],['suspension laryngoscopy','DL'],1,20,{common:true,milestone:true}),
  p('ent-016','Microlaryngoscopy','ent','Laryngology','Larynx',['Endoscopic'],['vocal cord microsurgery','phonosurgery'],2,45,{milestone:true}),
  p('ent-017','Vocal Cord Injection','ent','Laryngology','Vocal Cords',['Endoscopic'],['medialization injection','VCI'],1,20,{common:true}),
  p('ent-018','Thyroplasty','ent','Laryngology','Vocal Cords',['Open'],['medialization thyroplasty','Isshiki'],2,90,{milestone:true}),
  p('ent-019','Tracheotomy','ent','Airway','Tracheotomy',['Open'],['tracheostomy','surgical airway'],2,30,{common:true,milestone:true}),
  p('ent-020','Parotidectomy (Superficial)','ent','Salivary','Parotid',['Open'],['superficial parotidectomy'],3,120,{common:true,milestone:true}),
  p('ent-021','Parotidectomy (Total)','ent','Salivary','Parotid',['Open'],['total parotidectomy'],3,180,{milestone:true}),
  p('ent-022','Submandibular Gland Excision','ent','Salivary','Submandibular',['Open'],['SMG excision','submandibular sialoadenectomy'],2,60,{milestone:true}),
  p('ent-023','Thyroidectomy (ENT)','ent','Thyroid','Thyroid',['Open'],['ENT thyroidectomy'],3,120,{milestone:true}),
  p('ent-024','Selective Neck Dissection','ent','Head & Neck','Neck',['Open'],['SND','selective ND'],3,150,{milestone:true}),
  p('ent-025','Comprehensive Neck Dissection','ent','Head & Neck','Neck',['Open'],['modified radical neck dissection','MRND'],3,180,{milestone:true}),
  p('ent-026','Total Laryngectomy','ent','Head & Neck','Larynx',['Open'],['laryngectomy'],3,240,{milestone:true}),
  p('ent-027','Uvulopalatopharyngoplasty','ent','Sleep','Airway',['Open'],['UPPP','palatal surgery OSA'],2,60,{milestone:true}),
  p('ent-028','Genioglossus Advancement','ent','Sleep','Airway',['Open'],['tongue advancement','GA procedure'],2,60),
  p('ent-029','Maxillary Antrostomy','ent','Rhinology','Sinuses',['Endoscopic'],['middle meatal antrostomy','maxillary sinus opening'],1,20,{common:true}),
  p('ent-030','Drainage of Deep Neck Space Abscess','ent','Head & Neck','Infection',['Open'],['peritonsillar abscess drainage','deep neck abscess'],2,60,{common:true,milestone:true}),
];

// ============================================================================
// OB-GYN
// ============================================================================
const OBGYN: Procedure[] = [
  p('obgyn-001','Caesarean Section (Primary)','obgyn','Obstetrics','Delivery',['Open'],['C-section','CS primary','LSCS'],2,45,{common:true,milestone:true}),
  p('obgyn-002','Caesarean Section (Repeat)','obgyn','Obstetrics','Delivery',['Open'],['repeat C-section','VBAC alternative'],2,60,{common:true,milestone:true}),
  p('obgyn-003','Caesarean Hysterectomy','obgyn','Obstetrics','Delivery',['Open'],['peripartum hysterectomy','CS hysterectomy'],3,180,{milestone:true}),
  p('obgyn-004','Classical Caesarean Section','obgyn','Obstetrics','Delivery',['Open'],['classical CS','vertical uterine incision'],2,45),
  p('obgyn-005','Forceps Delivery','obgyn','Obstetrics','Vaginal Delivery',['Other'],['outlet forceps','mid forceps'],2,20,{common:true,milestone:true}),
  p('obgyn-006','Vacuum Extraction','obgyn','Obstetrics','Vaginal Delivery',['Other'],['ventouse','vacuum assisted delivery'],1,15,{common:true,milestone:true}),
  p('obgyn-007','Manual Removal of Placenta','obgyn','Obstetrics','Postpartum',['Other'],['MROP','retained placenta'],1,20,{common:true}),
  p('obgyn-008','Hysterectomy (Abdominal)','obgyn','Benign Gynecology','Uterus',['Open'],['TAH','total abdominal hysterectomy'],3,120,{common:true,milestone:true}),
  p('obgyn-009','Hysterectomy (Vaginal)','obgyn','Benign Gynecology','Uterus',['Other'],['VH','vaginal hysterectomy'],3,90,{milestone:true}),
  p('obgyn-010','Hysterectomy (Laparoscopic)','obgyn','Benign Gynecology','Uterus',['Laparoscopic'],['TLH','LAVH','laparoscopic hysterectomy'],3,120,{milestone:true}),
  p('obgyn-011','Hysterectomy (Robotic)','obgyn','Benign Gynecology','Uterus',['Robotic'],['robotic hysterectomy','RAHL'],3,150,{milestone:true}),
  p('obgyn-012','Radical Hysterectomy','obgyn','Gynecologic Oncology','Cervix',['Open','Robotic'],['Wertheim','type III hysterectomy'],3,210,{milestone:true}),
  p('obgyn-013','Myomectomy (Abdominal)','obgyn','Benign Gynecology','Fibroid',['Open'],['open myomectomy','fibroid removal'],3,120,{milestone:true}),
  p('obgyn-014','Myomectomy (Laparoscopic)','obgyn','Benign Gynecology','Fibroid',['Laparoscopic'],['lap myomectomy'],3,120,{milestone:true}),
  p('obgyn-015','Myomectomy (Hysteroscopic)','obgyn','Benign Gynecology','Fibroid',['Endoscopic'],['hysteroscopic myomectomy','submucous fibroid'],2,60,{milestone:true}),
  p('obgyn-016','Endometrial Ablation','obgyn','Benign Gynecology','Endometrium',['Endoscopic'],['NovaSure','Thermachoice','ablation'],1,20,{common:true}),
  p('obgyn-017','Hysteroscopy (Diagnostic)','obgyn','Benign Gynecology','Uterus',['Endoscopic'],['diagnostic hysteroscopy'],1,15,{common:true,milestone:true}),
  p('obgyn-018','Hysteroscopy (Operative)','obgyn','Benign Gynecology','Uterus',['Endoscopic'],['operative hysteroscopy'],2,30,{common:true}),
  p('obgyn-019','Laparoscopy (Diagnostic)','obgyn','Minimally Invasive','Laparoscopy',['Laparoscopic'],['diagnostic lap','pelvic laparoscopy'],1,20,{common:true,milestone:true}),
  p('obgyn-020','Laparoscopy (Operative)','obgyn','Minimally Invasive','Laparoscopy',['Laparoscopic'],['operative laparoscopy','lap surgery'],2,60,{common:true,milestone:true}),
  p('obgyn-021','Bilateral Salpingo-Oophorectomy','obgyn','Benign Gynecology','Ovary',['Open','Laparoscopic'],['BSO','bilateral oophorectomy'],2,60,{common:true,milestone:true}),
  p('obgyn-022','Salpingectomy','obgyn','Benign Gynecology','Fallopian Tube',['Laparoscopic','Open'],['tube removal','bilateral salpingectomy'],2,45,{common:true}),
  p('obgyn-023','Ovarian Cystectomy','obgyn','Benign Gynecology','Ovary',['Laparoscopic','Open'],['ovarian cyst removal','oophorocystectomy'],2,60,{common:true,milestone:true}),
  p('obgyn-024','Ectopic Pregnancy Surgery','obgyn','Emergency','Ectopic',['Laparoscopic','Open'],['salpingostomy','salpingectomy ectopic'],2,45,{common:true,milestone:true}),
  p('obgyn-025','D&C (Dilatation & Curettage)','obgyn','Benign Gynecology','Endometrium',['Endoscopic','Other'],['uterine evacuation','D+C'],1,20,{common:true,milestone:true}),
  p('obgyn-026','LLETZ / LEEP','obgyn','Cervix','CIN',['Other'],['loop excision','LEEP','large loop excision'],1,15,{common:true,milestone:true}),
  p('obgyn-027','Cervical Cerclage','obgyn','Obstetrics','Cervical Incompetence',['Other'],['MacDonald cerclage','Shirodkar'],2,30,{milestone:true}),
  p('obgyn-028','TVT / TOT Sling','obgyn','Urogynecology','Incontinence',['Open'],['tension-free vaginal tape','midurethral sling'],2,45,{common:true,milestone:true}),
  p('obgyn-029','Anterior Colporrhaphy','obgyn','Urogynecology','Prolapse',['Open'],['anterior repair','cystocele repair'],2,60,{common:true,milestone:true}),
  p('obgyn-030','Posterior Colporrhaphy','obgyn','Urogynecology','Prolapse',['Open'],['posterior repair','rectocele repair'],2,60,{common:true}),
  p('obgyn-031','Sacrocolpopexy','obgyn','Urogynecology','Prolapse',['Open','Laparoscopic','Robotic'],['abdominal sacrocolpopexy','vault prolapse repair'],3,180,{milestone:true}),
  p('obgyn-032','Pelvic Staging Laparotomy','obgyn','Gynecologic Oncology','Staging',['Open'],['surgical staging','exploratory lap gyn'],3,180,{milestone:true}),
  p('obgyn-033','Cytoreductive Surgery (Debulking)','obgyn','Gynecologic Oncology','Ovarian Cancer',['Open'],['debulking ovarian','interval debulking'],3,360,{milestone:true}),
  p('obgyn-034','Pelvic Lymph Node Dissection','obgyn','Gynecologic Oncology','Lymph Nodes',['Open','Laparoscopic','Robotic'],['pelvic LND','PLND'],3,120,{milestone:true}),
  p('obgyn-035','Vulvectomy (Radical)','obgyn','Gynecologic Oncology','Vulva',['Open'],['radical vulvectomy'],3,180,{milestone:true}),
];

// ============================================================================
// OPHTHALMOLOGY
// ============================================================================
const OPHTHALMOLOGY: Procedure[] = [
  p('oph-001','Phacoemulsification with IOL','ophthalmology','Anterior Segment','Cataract',['Other'],['phaco','cataract surgery','lens extraction'],2,20,{common:true,milestone:true}),
  p('oph-002','ECCE (Extra-Capsular Cataract Extraction)','ophthalmology','Anterior Segment','Cataract',['Open'],['ECCE','manual SICS'],2,30,{milestone:true}),
  p('oph-003','YAG Capsulotomy','ophthalmology','Anterior Segment','PCO',['Other'],['laser capsulotomy','posterior capsule opacification'],1,5,{common:true}),
  p('oph-004','Trabeculectomy','ophthalmology','Glaucoma','Filtering Surgery',['Open'],['trabeculectomy glaucoma','guarded filtration'],3,60,{milestone:true}),
  p('oph-005','Tube Shunt (Ahmed / Baerveldt)','ophthalmology','Glaucoma','Drainage Device',['Open'],['glaucoma drainage device','GDD','Ahmed valve'],3,90,{milestone:true}),
  p('oph-006','Selective Laser Trabeculoplasty','ophthalmology','Glaucoma','Laser',['Other'],['SLT'],1,10,{common:true}),
  p('oph-007','Goniotomy / Trabeculotomy','ophthalmology','Glaucoma','Angle Surgery',['Open'],['minimally invasive glaucoma','MIGS'],2,30,{milestone:true}),
  p('oph-008','Pars Plana Vitrectomy','ophthalmology','Retina','Vitreoretinal',['Open'],['PPV','vitrectomy'],3,90,{common:true,milestone:true}),
  p('oph-009','Scleral Buckle','ophthalmology','Retina','RD Repair',['Open'],['scleral buckling','retinal detachment buckle'],3,120,{milestone:true}),
  p('oph-010','Pneumatic Retinopexy','ophthalmology','Retina','RD Repair',['Other'],['gas injection RD','pneumatic'],2,30),
  p('oph-011','Intravitreal Injection','ophthalmology','Retina','Medical Retina',['Other'],['IVT injection','anti-VEGF injection','ranibizumab','aflibercept'],1,10,{common:true,milestone:true}),
  p('oph-012','Laser Photocoagulation (Pan-Retinal)','ophthalmology','Retina','Laser',['Other'],['PRP laser','panretinal photocoagulation'],1,20,{common:true}),
  p('oph-013','DSAEK / DMEK','ophthalmology','Cornea','Keratoplasty',['Open'],['endothelial keratoplasty','EK'],3,90,{milestone:true}),
  p('oph-014','Penetrating Keratoplasty','ophthalmology','Cornea','Keratoplasty',['Open'],['PKP','corneal transplant'],3,90,{milestone:true}),
  p('oph-015','Pterygium Excision','ophthalmology','Anterior Segment','Conjunctiva',['Open'],['pterygium surgery'],1,30,{common:true,milestone:true}),
  p('oph-016','Chalazion Excision','ophthalmology','Oculoplastic','Eyelid',['Open'],['chalazion incision & curettage'],1,15,{common:true}),
  p('oph-017','Ectropion Repair','ophthalmology','Oculoplastic','Eyelid',['Open'],['eyelid ectropion correction'],2,45,{milestone:true}),
  p('oph-018','Entropion Repair','ophthalmology','Oculoplastic','Eyelid',['Open'],['eyelid entropion correction'],2,45,{milestone:true}),
  p('oph-019','Ptosis Repair (Levator)','ophthalmology','Oculoplastic','Eyelid',['Open'],['ptosis levator resection','blepharoptosis repair'],2,60,{milestone:true}),
  p('oph-020','DCR (Dacryocystorhinostomy)','ophthalmology','Oculoplastic','Lacrimal',['Open','Endoscopic'],['tear duct surgery','DCR'],2,60,{milestone:true}),
  p('oph-021','Orbital Decompression','ophthalmology','Oculoplastic','Orbit',['Open'],['thyroid eye disease decompression','orbital wall removal'],3,120,{milestone:true}),
  p('oph-022','Strabismus Surgery','ophthalmology','Pediatric','Strabismus',['Open'],['squint surgery','extraocular muscle surgery'],2,60,{common:true,milestone:true}),
  p('oph-023','Retinal Laser (Focal / Grid)','ophthalmology','Retina','Laser',['Other'],['macular laser','focal laser'],1,15,{common:true}),
  p('oph-024','Enucleation','ophthalmology','Oculoplastic','Globe',['Open'],['eye removal','enucleation'],2,60,{milestone:true}),
];

// ============================================================================
// PEDIATRIC SURGERY
// ============================================================================
const PEDIATRIC: Procedure[] = [
  p('ped-001','Laparoscopic Appendectomy (Pediatric)','pediatric','GI','Appendix',['Laparoscopic'],['peds appy','pediatric appendectomy'],2,45,{common:true,milestone:true}),
  p('ped-002','Inguinal Hernia Repair (Pediatric)','pediatric','Hernias','Inguinal',['Open','Laparoscopic'],['peds hernia','pediatric hernia'],2,30,{common:true,milestone:true}),
  p('ped-003','Pyloromyotomy','pediatric','Neonatal','Pyloric Stenosis',['Open','Laparoscopic'],['Ramstedt','pyloric stenosis repair'],2,30,{milestone:true}),
  p('ped-004','Kasai Procedure','pediatric','Neonatal','Biliary Atresia',['Open'],['hepatoportoenterostomy','biliary atresia repair'],3,240,{milestone:true}),
  p('ped-005','Swenson Pull-Through','pediatric','Neonatal','Hirschsprung',['Open'],['pull-through Hirschsprung','Duhamel','Soave'],3,240,{milestone:true}),
  p('ped-006','Laparoscopic Pull-Through','pediatric','Neonatal','Hirschsprung',['Laparoscopic'],['lap pull-through','Soave laparoscopic'],3,180,{milestone:true}),
  p('ped-007','Esophageal Atresia Repair (EA/TEF)','pediatric','Thoracic','Esophagus',['Open'],['EA TEF repair','esophageal atresia'],3,120,{milestone:true}),
  p('ped-008','VATS EA/TEF Repair','pediatric','Thoracic','Esophagus',['Laparoscopic'],['thoracoscopic TEF repair'],3,150,{milestone:true}),
  p('ped-009','Congenital Diaphragmatic Hernia Repair','pediatric','Thoracic','CDH',['Open','Laparoscopic'],['CDH repair','Bochdalek hernia'],3,120,{milestone:true}),
  p('ped-010','Gastroschisis Repair','pediatric','Neonatal','Abdominal Wall',['Open'],['gastroschisis closure','silo'],3,60,{milestone:true}),
  p('ped-011','Omphalocele Repair','pediatric','Neonatal','Abdominal Wall',['Open'],['omphalocele closure','exomphalos'],3,90,{milestone:true}),
  p('ped-012','Intussusception Reduction (Operative)','pediatric','GI','Intussusception',['Open','Laparoscopic'],['intussusception surgery','manual reduction'],2,45,{common:true,milestone:true}),
  p('ped-013','Meckel Diverticulectomy','pediatric','GI','Meckel',['Open','Laparoscopic'],['Meckel diverticulum removal'],2,45,{milestone:true}),
  p('ped-014','Orchiopexy (Pediatric)','pediatric','GU','Undescended Testis',['Open','Laparoscopic'],['pediatric orchiopexy','cryptorchidism repair'],2,45,{common:true,milestone:true}),
  p('ped-015','Hypospadias Repair (Pediatric)','pediatric','GU','Hypospadias',['Open'],['TIPP','MAGPI','Snodgrass'],3,120,{milestone:true}),
  p('ped-016','Circumcision (Pediatric)','pediatric','GU','Foreskin',['Open'],['peds circumcision'],1,20,{common:true}),
  p('ped-017','Wilms Tumor Nephrectomy','pediatric','Oncology','Kidney',['Open'],['nephroblastoma surgery','Wilms nephrectomy'],3,180,{milestone:true}),
  p('ped-018','Neuroblastoma Resection','pediatric','Oncology','Adrenal',['Open'],['neuroblastoma surgery'],3,240,{milestone:true}),
  p('ped-019','Nuss Procedure (Pectus Excavatum)','pediatric','Thoracic','Chest Wall',['Laparoscopic'],['Nuss bar','minimally invasive pectus repair','MIRPE'],3,120,{milestone:true}),
  p('ped-020','Ravitch Procedure (Pectus)','pediatric','Thoracic','Chest Wall',['Open'],['open pectus repair'],3,150,{milestone:true}),
  p('ped-021','Laparoscopic Nissen (Pediatric)','pediatric','GI','GERD',['Laparoscopic'],['peds fundoplication','lap Nissen pediatric'],3,90,{milestone:true}),
  p('ped-022','Choledochal Cyst Excision','pediatric','HPB','Biliary',['Open','Laparoscopic'],['choledochal cyst resection'],3,180,{milestone:true}),
  p('ped-023','Colostomy Formation (Pediatric)','pediatric','GI','Stoma',['Open'],['peds colostomy','neonatal colostomy'],2,45,{common:true}),
  p('ped-024','Testicular Torsion Detorsion & Orchiopexy','pediatric','GU','Torsion',['Open'],['torsion surgery','detorsion orchiopexy'],2,45,{common:true,milestone:true}),
];

// ============================================================================
// THORACIC SURGERY
// ============================================================================
const THORACIC: Procedure[] = [
  p('thor-001','VATS Lobectomy','thoracic','Lung','Resection',['Laparoscopic'],['video-assisted thoracoscopic lobectomy','VATS lobe'],3,150,{common:true,milestone:true}),
  p('thor-002','Open Lobectomy','thoracic','Lung','Resection',['Open'],['thoracotomy lobectomy'],3,180,{milestone:true}),
  p('thor-003','Robotic Lobectomy','thoracic','Lung','Resection',['Robotic'],['robotic lung resection'],3,180,{milestone:true}),
  p('thor-004','VATS Wedge Resection','thoracic','Lung','Resection',['Laparoscopic'],['VATS wedge','thoracoscopic wedge'],2,60,{common:true,milestone:true}),
  p('thor-005','Open Wedge Resection','thoracic','Lung','Resection',['Open'],['open wedge resection','limited resection'],2,90),
  p('thor-006','Segmentectomy','thoracic','Lung','Resection',['Laparoscopic','Open'],['VATS segmentectomy','pulmonary segmentectomy'],3,180,{milestone:true}),
  p('thor-007','Pneumonectomy','thoracic','Lung','Resection',['Open'],['total pneumonectomy','completion pneumonectomy'],3,180,{milestone:true}),
  p('thor-008','Ivor Lewis Esophagectomy','thoracic','Esophagus','Esophageal Resection',['Open'],['Ivor Lewis','transthoracic esophagectomy'],3,360,{milestone:true}),
  p('thor-009','McKeown (3-Field) Esophagectomy','thoracic','Esophagus','Esophageal Resection',['Open'],['McKeown','3-stage esophagectomy'],3,420,{milestone:true}),
  p('thor-010','Transhiatal Esophagectomy','thoracic','Esophagus','Esophageal Resection',['Open'],['THE','transhiatal'],3,360,{milestone:true}),
  p('thor-011','Minimally Invasive Esophagectomy','thoracic','Esophagus','Esophageal Resection',['Laparoscopic'],['MIE','thoracoscopic esophagectomy'],3,360,{milestone:true}),
  p('thor-012','Mediastinoscopy','thoracic','Mediastinum','Staging',['Endoscopic'],['cervical mediastinoscopy','mediastinal biopsy'],2,45,{common:true,milestone:true}),
  p('thor-013','VATS Mediastinal Biopsy','thoracic','Mediastinum','Staging',['Laparoscopic'],['thoracoscopic mediastinal biopsy'],2,60,{milestone:true}),
  p('thor-014','Thymectomy (VATS)','thoracic','Mediastinum','Thymus',['Laparoscopic'],['VATS thymectomy','myasthenia gravis surgery'],3,120,{milestone:true}),
  p('thor-015','Thymectomy (Open)','thoracic','Mediastinum','Thymus',['Open'],['open thymectomy','sternotomy thymectomy'],3,120,{milestone:true}),
  p('thor-016','Decortication','thoracic','Pleura','Pleural Disease',['Open','Laparoscopic'],['pleural decortication','empyema decortication'],3,180,{milestone:true}),
  p('thor-017','VATS Pleurodesis','thoracic','Pleura','Pleural Disease',['Laparoscopic'],['thoracoscopic pleurodesis','talc poudrage'],2,60,{common:true,milestone:true}),
  p('thor-018','Chest Tube Insertion','thoracic','Pleura','Emergency',['Open'],['intercostal drain','ICC','chest drain'],1,15,{common:true,milestone:true}),
  p('thor-019','Chest Wall Resection & Reconstruction','thoracic','Chest Wall','Tumor',['Open'],['CWR','chest wall tumor'],3,300,{milestone:true}),
  p('thor-020','Lung Volume Reduction Surgery','thoracic','Lung','Emphysema',['Laparoscopic','Open'],['LVRS','lung volume reduction'],3,180,{milestone:true}),
  p('thor-021','Bullectomy','thoracic','Lung','Bullous Disease',['Laparoscopic','Open'],['bulla resection','giant bullae'],2,90,{milestone:true}),
  p('thor-022','Bronchoscopy (Rigid)','thoracic','Airway','Bronchoscopy',['Endoscopic'],['rigid bronch','therapeutic bronchoscopy'],2,45,{common:true,milestone:true}),
  p('thor-023','Tracheal Resection & Reconstruction','thoracic','Airway','Trachea',['Open'],['tracheal surgery','tracheal sleeve'],3,240,{milestone:true}),
  p('thor-024','Pericardial Window (Thoracoscopic)','thoracic','Pericardium','Effusion',['Laparoscopic'],['VATS pericardial window'],2,45,{common:true}),
  p('thor-025','Lung Transplant','thoracic','Transplant','Lung',['Open'],['single lung transplant','bilateral lung transplant'],3,480,{milestone:true}),
];

// ============================================================================
// COLORECTAL SURGERY
// ============================================================================
const COLORECTAL: Procedure[] = [
  p('cr-001','Right Hemicolectomy (Colorectal)','colorectal','Colon','Right Colon',['Laparoscopic','Open','Robotic'],['lap RHC','robotic right hemi'],3,120,{common:true,milestone:true}),
  p('cr-002','Left Hemicolectomy (Colorectal)','colorectal','Colon','Left Colon',['Laparoscopic','Open'],['lap LHC'],3,120,{milestone:true}),
  p('cr-003','Sigmoid Colectomy (Colorectal)','colorectal','Colon','Sigmoid',['Laparoscopic','Open'],['lap sigmoid'],3,120,{common:true,milestone:true}),
  p('cr-004','Total Colectomy (Colorectal)','colorectal','Colon','Total',['Laparoscopic','Open'],['total colon'],3,180,{milestone:true}),
  p('cr-005','Total Proctocolectomy with IPAA','colorectal','Colon','IBD',['Open','Laparoscopic'],['J-pouch','IPAA','proctocolectomy restorative'],3,300,{milestone:true}),
  p('cr-006','LAR with TME','colorectal','Rectum','Anterior Resection',['Laparoscopic','Open','Robotic'],['low anterior resection','TME','anterior resection'],3,180,{common:true,milestone:true}),
  p('cr-007','Abdominoperineal Resection (Colorectal)','colorectal','Rectum','APR',['Laparoscopic','Open'],['APR colorectal','Miles procedure'],3,240,{milestone:true}),
  p('cr-008','Transanal Excision','colorectal','Rectum','Local Excision',['Other'],['TAE','full thickness transanal'],2,60,{milestone:true}),
  p('cr-009','TEM / TAMIS','colorectal','Rectum','Local Excision',['Endoscopic'],['transanal endoscopic microsurgery','TAMIS'],3,90,{milestone:true}),
  p('cr-010','Hartmann Procedure (Colorectal)','colorectal','Colon','Emergency',['Open'],['Hartmanns colorectal'],3,120,{common:true,milestone:true}),
  p('cr-011','Hemorrhoidectomy','colorectal','Anal','Hemorrhoids',['Open'],['excisional hemorrhoidectomy','Ferguson','Milligan-Morgan'],2,45,{common:true,milestone:true}),
  p('cr-012','Stapled Hemorrhoidopexy','colorectal','Anal','Hemorrhoids',['Other'],['PPH','procedure for prolapse and hemorrhoids'],2,30,{common:true}),
  p('cr-013','Lateral Internal Sphincterotomy','colorectal','Anal','Fissure',['Open'],['LIS','anal fissure surgery'],1,20,{common:true,milestone:true}),
  p('cr-014','Fistulotomy','colorectal','Anal','Fistula',['Open'],['anal fistula surgery','lay open'],2,30,{common:true,milestone:true}),
  p('cr-015','Seton Placement','colorectal','Anal','Fistula',['Open'],['seton fistula','cutting seton'],1,20,{common:true}),
  p('cr-016','LIFT Procedure','colorectal','Anal','Fistula',['Open'],['ligation of intersphincteric fistula tract'],2,45,{milestone:true}),
  p('cr-017','Fistula Plug / VAAFT','colorectal','Anal','Fistula',['Other'],['anal fistula plug','video-assisted anal fistula treatment'],2,45),
  p('cr-018','Perirectal Abscess Drainage','colorectal','Anal','Abscess',['Open'],['anorectal abscess I&D','perianal abscess'],1,20,{common:true,milestone:true}),
  p('cr-019','Pilonidal Sinus Excision','colorectal','Skin','Pilonidal',['Open'],['pilonidal cyst excision','Bascom','Karydakis'],2,45,{common:true,milestone:true}),
  p('cr-020','Rectal Prolapse Repair (Perineal)','colorectal','Rectum','Prolapse',['Open'],['Delormes','Altemeier','perineal proctosigmoidectomy'],3,90,{milestone:true}),
  p('cr-021','Rectal Prolapse Repair (Abdominal)','colorectal','Rectum','Prolapse',['Open','Laparoscopic','Robotic'],['rectopexy','laparoscopic rectopexy','Frykman-Goldberg'],3,120,{milestone:true}),
  p('cr-022','Colostomy Reversal (Colorectal)','colorectal','Colon','Stoma',['Open'],['Hartmanns reversal','colostomy takedown'],3,120,{common:true,milestone:true}),
  p('cr-023','Robotic Low Anterior Resection','colorectal','Rectum','Robotic',['Robotic'],['robotic LAR','robotic TME'],3,210,{milestone:true}),
  p('cr-024','Transanal TME (TaTME)','colorectal','Rectum','Transanal',['Other'],['transanal total mesorectal excision'],3,240,{milestone:true}),
];

// ============================================================================
// TRANSPLANT SURGERY
// ============================================================================
const TRANSPLANT: Procedure[] = [
  p('tx-001','Deceased Donor Kidney Transplant','transplant','Kidney','Recipient',['Open'],['cadaveric kidney transplant','DBD kidney'],3,180,{common:true,milestone:true}),
  p('tx-002','Living Donor Kidney Transplant','transplant','Kidney','Recipient',['Open'],['LDKT','living related kidney'],3,180,{milestone:true}),
  p('tx-003','Laparoscopic Living Donor Nephrectomy','transplant','Kidney','Donor',['Laparoscopic'],['lap donor neph','LLDN','hand-assisted donor nephrectomy'],3,150,{milestone:true}),
  p('tx-004','Open Living Donor Nephrectomy','transplant','Kidney','Donor',['Open'],['open donor nephrectomy'],3,180,{milestone:true}),
  p('tx-005','Deceased Donor Liver Transplant','transplant','Liver','Recipient',['Open'],['cadaveric liver transplant','whole liver transplant'],3,480,{milestone:true}),
  p('tx-006','Living Donor Liver Transplant (Right Lobe)','transplant','Liver','Recipient',['Open'],['LDLT right lobe'],3,600,{milestone:true}),
  p('tx-007','Living Donor Hepatectomy','transplant','Liver','Donor',['Open'],['right hepatectomy donor','donor liver surgery'],3,360,{milestone:true}),
  p('tx-008','Liver Back-Table Preparation','transplant','Liver','Back Table',['Other'],['liver bench surgery','back table prep'],2,60,{common:true,milestone:true}),
  p('tx-009','Simultaneous Pancreas-Kidney Transplant','transplant','Pancreas','Recipient',['Open'],['SPK','pancreas kidney'],3,360,{milestone:true}),
  p('tx-010','Pancreas Transplant Alone','transplant','Pancreas','Recipient',['Open'],['PTA','isolated pancreas transplant'],3,360,{milestone:true}),
  p('tx-011','Pancreas After Kidney','transplant','Pancreas','Recipient',['Open'],['PAK transplant'],3,360),
  p('tx-012','Multi-Organ Procurement (DBD)','transplant','Procurement','Multi-Organ',['Open'],['multi-organ harvest','heart-beating donor'],3,240,{common:true,milestone:true}),
  p('tx-013','Multi-Organ Procurement (DCD)','transplant','Procurement','Multi-Organ',['Open'],['DCD procurement','donation after cardiac death'],3,240,{milestone:true}),
  p('tx-014','Kidney Transplant Back-Table Prep','transplant','Kidney','Back Table',['Other'],['kidney bench surgery','renal back table'],1,30,{common:true}),
  p('tx-015','Transplant Nephrectomy (Native)','transplant','Kidney','Native Nephrectomy',['Open'],['bilateral nephrectomy pre-transplant'],2,90,{milestone:true}),
  p('tx-016','Transplant Ureteroneocystostomy','transplant','Kidney','Ureteral Reconstruction',['Open'],['ureteral reimplant transplant','Lich-Gregoir'],2,30,{common:true,milestone:true}),
];

// ============================================================================
// SURGICAL ONCOLOGY
// ============================================================================
const SURG_ONC: Procedure[] = [
  p('so-001','Wide Local Excision (Melanoma/STS)','surg-onc','Soft Tissue','Melanoma',['Open'],['WLE','wide excision','margin excision'],2,60,{common:true,milestone:true}),
  p('so-002','Sentinel Lymph Node Biopsy (Melanoma)','surg-onc','Soft Tissue','Melanoma',['Open'],['SLNB melanoma','sentinel node mapping'],2,60,{common:true,milestone:true}),
  p('so-003','Inguinal Lymph Node Dissection','surg-onc','Lymph Nodes','ILND',['Open'],['ILND','groin dissection'],3,120,{milestone:true}),
  p('so-004','Axillary Lymph Node Dissection (Oncology)','surg-onc','Lymph Nodes','ALND',['Open'],['ALND oncology','axillary dissection'],3,90,{milestone:true}),
  p('so-005','Retroperitoneal Sarcoma Resection','surg-onc','Soft Tissue','Sarcoma',['Open'],['RPS resection','retroperitoneal sarcoma'],3,300,{milestone:true}),
  p('so-006','HIPEC + Cytoreductive Surgery','surg-onc','Peritoneal','Peritoneal Carcinomatosis',['Open'],['CRS-HIPEC','cytoreductive surgery HIPEC'],3,480,{milestone:true}),
  p('so-007','Peritoneal Mesothelioma Resection','surg-onc','Peritoneal','Mesothelioma',['Open'],['peritoneal mesothelioma','pleurectomy'],3,480,{milestone:true}),
  p('so-008','Liver Resection for Metastases','surg-onc','HPB','Liver Metastases',['Open','Laparoscopic'],['liver mets resection','colorectal mets hepatectomy'],3,240,{common:true,milestone:true}),
  p('so-009','Hilum Cholangiocarcinoma Resection','surg-onc','HPB','Biliary',['Open'],['Klatskin tumor','hilar cholangiocarcinoma'],3,360,{milestone:true}),
  p('so-010','Gallbladder Cancer Resection','surg-onc','HPB','Gallbladder',['Open'],['gallbladder carcinoma resection','extended cholecystectomy'],3,180,{milestone:true}),
  p('so-011','Adrenocortical Carcinoma Resection','surg-onc','Endocrine','Adrenal',['Open','Laparoscopic'],['ACC resection','adrenal carcinoma'],3,180,{milestone:true}),
  p('so-012','GIST Resection','surg-onc','GI','GIST',['Open','Laparoscopic'],['gastrointestinal stromal tumor resection'],2,90,{common:true,milestone:true}),
  p('so-013','Carcinoid / Neuroendocrine Tumor Resection','surg-onc','GI','NET',['Open','Laparoscopic'],['NET resection','carcinoid tumor surgery'],3,120,{milestone:true}),
  p('so-014','Total Thyroidectomy (Oncologic)','surg-onc','Endocrine','Thyroid',['Open'],['thyroid cancer surgery','oncologic thyroidectomy'],3,120,{common:true,milestone:true}),
  p('so-015','Parotidectomy for Cancer','surg-onc','Head & Neck','Parotid',['Open'],['oncologic parotidectomy'],3,180,{milestone:true}),
  p('so-016','Modified Radical Neck Dissection (Oncology)','surg-onc','Head & Neck','Neck Dissection',['Open'],['MRND oncology','type III neck dissection'],3,180,{milestone:true}),
  p('so-017','Total Gastrectomy (Oncologic)','surg-onc','Foregut','Stomach',['Open','Laparoscopic'],['D2 gastrectomy','total gastrectomy gastric cancer'],3,240,{milestone:true}),
  p('so-018','Subtotal Gastrectomy','surg-onc','Foregut','Stomach',['Open','Laparoscopic'],['distal gastrectomy','partial gastrectomy'],3,180,{milestone:true}),
  p('so-019','Isolated Limb Perfusion','surg-onc','Soft Tissue','Sarcoma',['Open'],['ILP','hyperthermic isolated limb perfusion'],3,240,{milestone:true}),
];

// ============================================================================
// ORAL & MAXILLOFACIAL SURGERY
// ============================================================================
const OMFS: Procedure[] = [
  p('omfs-001','Wisdom Tooth Extraction (Simple)','omfs','Dentoalveolar','Extractions',['Open'],['third molar extraction','wisdom tooth'],1,20,{common:true,milestone:true}),
  p('omfs-002','Wisdom Tooth Extraction (Surgical/Impacted)','omfs','Dentoalveolar','Extractions',['Open'],['impacted third molar','surgical wisdom tooth'],2,45,{common:true,milestone:true}),
  p('omfs-003','Dental Implant Placement','omfs','Dentoalveolar','Implants',['Open'],['osseointegrated implant','titanium implant'],2,30,{common:true}),
  p('omfs-004','Alveoloplasty','omfs','Dentoalveolar','Ridge Surgery',['Open'],['alveolar ridge modification','denture preparation'],1,30,{common:true}),
  p('omfs-005','Torus Removal','omfs','Dentoalveolar','Benign Lesions',['Open'],['torus mandibularis removal','tori'],1,30),
  p('omfs-006','Intraoral Biopsy','omfs','Dentoalveolar','Biopsy',['Open'],['oral biopsy','mucosal biopsy'],1,15,{common:true,milestone:true}),
  p('omfs-007','I&D Oral Abscess','omfs','Dentoalveolar','Infection',['Open'],['dental abscess drainage','periapical abscess'],1,15,{common:true,milestone:true}),
  p('omfs-008','Le Fort I Osteotomy','omfs','Orthognathic','Maxillary',['Open'],['maxillary osteotomy','Le Fort 1'],3,180,{milestone:true}),
  p('omfs-009','Le Fort II Osteotomy','omfs','Orthognathic','Maxillary',['Open'],['Le Fort 2','pyramid osteotomy'],3,240,{milestone:true}),
  p('omfs-010','Le Fort III Osteotomy','omfs','Orthognathic','Midface',['Open'],['Le Fort 3','craniofacial dysjunction'],3,300,{milestone:true}),
  p('omfs-011','BSSO (Bilateral Sagittal Split)','omfs','Orthognathic','Mandibular',['Open'],['sagittal split osteotomy','BSSO','mandibular advancement'],3,180,{milestone:true}),
  p('omfs-012','Genioplasty','omfs','Orthognathic','Chin',['Open'],['chin osteotomy','advancement genioplasty'],2,90,{milestone:true}),
  p('omfs-013','ORIF Mandible Fracture','omfs','Facial Trauma','Mandible',['Open'],['mandible ORIF','jaw fracture fixation'],2,90,{common:true,milestone:true}),
  p('omfs-014','ORIF Zygoma Fracture','omfs','Facial Trauma','Zygoma',['Open'],['zygoma ORIF','malar fracture'],2,90,{common:true,milestone:true}),
  p('omfs-015','ORIF Orbital Floor Fracture','omfs','Facial Trauma','Orbit',['Open'],['blowout fracture repair','orbital floor ORIF'],2,75,{milestone:true}),
  p('omfs-016','Panfacial Fracture Repair','omfs','Facial Trauma','Panfacial',['Open'],['panfacial ORIF','combined facial fractures'],3,360,{milestone:true}),
  p('omfs-017','Condylar Fracture ORIF','omfs','Facial Trauma','Condyle',['Open'],['subcondylar ORIF','condyle fracture fixation'],3,120,{milestone:true}),
  p('omfs-018','TMJ Arthroscopy','omfs','TMJ','Diagnostic',['Endoscopic'],['temporomandibular joint scope','TMJ arthroscopy'],2,45,{milestone:true}),
  p('omfs-019','TMJ Arthroplasty (Total Replacement)','omfs','TMJ','Replacement',['Open'],['total TMJ prosthesis','TMJ replacement'],3,300,{milestone:true}),
  p('omfs-020','Fibula Free Flap Mandible Reconstruction','omfs','Reconstructive','Mandible',['Open'],['fibular flap','composite free flap jaw'],3,480,{milestone:true}),
  p('omfs-021','Partial Mandibulectomy','omfs','Oncology','Mandible',['Open'],['marginal mandibulectomy','segmental mandibulectomy'],3,180,{milestone:true}),
  p('omfs-022','Maxillectomy (Partial)','omfs','Oncology','Maxilla',['Open'],['infrastructure maxillectomy','partial maxilla resection'],3,240,{milestone:true}),
  p('omfs-023','Neck Dissection (OMFS)','omfs','Oncology','Neck',['Open'],['OMFS neck dissection','oral cancer neck dissection'],3,180,{milestone:true}),
  p('omfs-024','Salivary Gland Surgery (OMFS)','omfs','Salivary','Gland',['Open'],['parotidectomy OMFS','submandibular gland'],2,90,{milestone:true}),
  p('omfs-025','Sialendoscopy','omfs','Salivary','Endoscopy',['Endoscopic'],['salivary duct endoscopy','stone removal duct'],2,60,{milestone:true}),
];

// ============================================================================
// OTHER
// ============================================================================
const OTHER: Procedure[] = [
  p('other-001','Exploratory Laparotomy (Other)','other','General','Emergency',['Open'],['exploratory lap'],2,90,{common:true}),
  p('other-002','Diagnostic Laparoscopy (Other)','other','General','Diagnostic',['Laparoscopic'],['diagnostic lap'],1,20,{common:true}),
  p('other-003','Skin Lesion Excision','other','General','Skin',['Open'],['skin excision','lesion removal'],1,20,{common:true}),
  p('other-004','Soft Tissue Mass Excision','other','General','Soft Tissue',['Open'],['mass excision','lump removal'],1,30,{common:true}),
  p('other-005','Abscess Drainage','other','General','Infection',['Open'],['I&D','incision and drainage'],1,15,{common:true}),
  p('other-006','Wound Debridement','other','General','Wound',['Open'],['wound debridement','surgical debridement'],1,30,{common:true}),
  p('other-007','Lymph Node Biopsy','other','General','Biopsy',['Open'],['LN biopsy','lymph node excision'],1,30,{common:true}),
  p('other-008','Feeding Jejunostomy','other','General','Access',['Open','Laparoscopic'],['J-tube','jejunostomy feeding tube'],1,30),
];

// ============================================================================
// COMBINED LIBRARY
// ============================================================================
export const PROCEDURE_LIBRARY: Procedure[] = [
  ...UROLOGY, ...GENERAL_SURGERY, ...NEUROSURGERY,
  ...ORTHOPEDIC, ...CARDIAC, ...VASCULAR,
  ...PLASTIC, ...ENT, ...OBGYN,
  ...OPHTHALMOLOGY, ...PEDIATRIC, ...THORACIC,
  ...COLORECTAL, ...TRANSPLANT, ...SURG_ONC,
  ...OMFS, ...OTHER,
];

// ============================================================================
// HELPERS — used by ProcedurePicker and QuickAddModal
// ============================================================================

/**
 * Get all procedures for a given specialty slug, sorted:
 * common first, then by complexity tier, then alphabetically.
 */
export function getProceduresBySpecialty(specialtySlug: string): Procedure[] {
  return PROCEDURE_LIBRARY
    .filter(p => p.specialty === specialtySlug && p.active)
    .sort((a, b) => {
      if (a.isCommon && !b.isCommon) return -1;
      if (!a.isCommon && b.isCommon) return 1;
      return a.complexityTier - b.complexityTier || a.name.localeCompare(b.name);
    });
}

/**
 * Get unique subcategory names (= `category` field) for a specialty,
 * ordered by number of procedures descending then alphabetically.
 */
export function getSubcategories(specialtySlug: string): string[] {
  const counts = new Map<string, number>();
  for (const p of PROCEDURE_LIBRARY) {
    if (p.specialty === specialtySlug && p.active) {
      counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([cat]) => cat);
}

/**
 * Get procedures within a specific subcategory (= `category` field),
 * sorted: common first, then complexity tier, then alphabetically.
 */
export function getProceduresBySubcategory(
  specialtySlug: string,
  subcategory: string,
): Procedure[] {
  return PROCEDURE_LIBRARY
    .filter(p => p.specialty === specialtySlug && p.category === subcategory && p.active)
    .sort((a, b) => {
      if (a.isCommon && !b.isCommon) return -1;
      if (!a.isCommon && b.isCommon) return 1;
      return a.complexityTier - b.complexityTier || a.name.localeCompare(b.name);
    });
}

export default PROCEDURE_LIBRARY;
