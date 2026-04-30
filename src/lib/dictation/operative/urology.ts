import type { CaseLog } from "@/lib/types";
import { includesAny } from "../shared/format";
import {
  laparotomyPreamble,
  laparoscopicPreamble,
  endoscopicPreamble,
} from "../shared/preamble";
import {
  standardOpenClosure,
  standardLapClosure,
  endoscopicClosure,
} from "../shared/closure";
import type { TopMatter } from "./types";

// ---------------------------------------------------------------------------
// Urology — forced fields:
//   - Laterality (left/right/bilateral)
//   - Stent/catheter details (size, type, balloon volume)
//   - Stone burden / location (for stone cases)
//   - Urine quality at end of case
//   - Drainage plan
//   - Hematuria level
//   - Renal function considerations
//   - Follow-up device plan (when is the catheter/stent coming out)
// ---------------------------------------------------------------------------

function detectLaterality(name: string): string {
  const n = name.toLowerCase();
  if (/\bbilateral\b/.test(n)) return "bilateral";
  if (/\bleft\b/.test(n)) return "left";
  if (/\bright\b/.test(n)) return "right";
  return "[left / right]";
}

export function urologyTopMatter(c: CaseLog): TopMatter {
  const name = c.procedureName.toLowerCase();

  // Stone cases
  if (includesAny(name, ["ureteroscopy", "urs", "laser lithotripsy"])) {
    return {
      anesthesia: "General anesthesia.",
      ebl: "Minimal.",
      drains:
        "6 Fr × 26 cm double-J ureteral stent (proximal coil in renal pelvis, distal coil in bladder) and 16 Fr Foley catheter.",
      specimens: "Stone fragments sent for chemical analysis.",
      disposition:
        "The patient tolerated the procedure well and was awakened from anesthesia uneventfully. All counts were reported as correct prior to closure. The patient was transferred to the recovery area in stable condition. Plan: discharge home the same day on tamsulosin and an oral analgesic regimen. The ureteral stent will be removed in clinic in approximately 1–2 weeks. KUB will be obtained prior to stent removal to assess residual stone burden.",
    };
  }

  if (includesAny(name, ["pcnl", "percutaneous nephrolithotomy"])) {
    return {
      anesthesia: "General anesthesia.",
      ebl: "Approximately 100–200 ml.",
      drains:
        "14 Fr Council-tip nephrostomy tube in the upper-pole access tract and 16 Fr urethral Foley catheter.",
      specimens: "Stone fragments sent for chemical analysis and culture.",
      disposition:
        "The patient tolerated the procedure well and was awakened from anesthesia uneventfully. Admitted for overnight observation. Plan: nephrostogram on postoperative day 1 to confirm antegrade flow, with nephrostomy tube removal thereafter if satisfactory. Continue IV antibiotics until culture results return.",
    };
  }

  if (includesAny(name, ["turbt", "transurethral resection of bladder"])) {
    return {
      anesthesia: "General anesthesia with paralytic to avoid obturator reflex during lateral-wall resection.",
      ebl: "Minimal to approximately 50 ml.",
      drains: "22 Fr three-way Foley catheter on continuous bladder irrigation until the effluent clears.",
      specimens:
        "Tumor chips labeled separately by location, with a distinct deep-muscle specimen submitted to confirm adequacy of staging.",
      disposition:
        "The patient tolerated the procedure well and was awakened from anesthesia uneventfully. Admitted overnight for bladder irrigation. Plan: CBI until the urine clears, then Foley removal on postoperative day 1. Discharge home when voiding adequately. Repeat cystoscopy at 3 months per AUA guidelines.",
    };
  }

  if (
    includesAny(name, [
      "turp",
      "transurethral resection of prostate",
      "greenlight",
      "photovaporization",
      "pvp",
      "holep",
      "holmium enucleation",
    ])
  ) {
    return {
      anesthesia: "General anesthesia.",
      ebl: "Minimal.",
      drains: "22 Fr three-way Foley catheter with 30 cc in the balloon.",
      specimens: "None. / Prostate chips sent for pathology (for TURP only).",
      disposition:
        "The patient tolerated the procedure well and was awakened from anesthesia uneventfully. Admitted for overnight observation on continuous bladder irrigation. Plan: discontinue CBI when the effluent is clear, Foley removal on postoperative day 1 or 2 with voiding trial. Discharge home when voiding adequately.",
    };
  }

  if (includesAny(name, ["radical prostatectomy", "rrp", "rarp", "lrp"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Approximately 200–300 ml.",
      drains: "15 Fr Blake drain in the pelvis and 20 Fr urethral Foley catheter.",
      specimens: "Prostate and seminal vesicles sent en bloc for permanent section; obturator and pelvic lymph nodes submitted separately when dissected.",
      disposition:
        "The patient tolerated the procedure well and was awakened from anesthesia uneventfully. Admitted for standard post-prostatectomy recovery pathway. Plan: advance diet as tolerated, ambulate early, drain removal when output is < 100 ml/day, Foley catheter for 7–10 days with cystogram-guided removal.",
    };
  }

  if (includesAny(name, ["nephroureterectomy"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Approximately 200–300 ml.",
      drains: "15 Fr Blake drain in the renal fossa, 16 Fr urethral Foley catheter.",
      specimens: "Kidney + entire ureter + bladder cuff en bloc, oriented for pathology.",
      disposition:
        "The patient tolerated the procedure well and was awakened from anesthesia uneventfully. Admitted to the surgical floor. Plan: standard post-nephroureterectomy pathway, Foley × 7–10 days with cystogram-guided removal, surveillance per upper-tract urothelial-carcinoma protocol.",
    };
  }

  if (includesAny(name, ["adrenalectomy"])) {
    return {
      anesthesia: "General endotracheal anesthesia. For pheochromocytoma: invasive arterial monitoring + alpha-blockade preoperatively.",
      ebl: "Approximately 100–200 ml.",
      drains: "None routinely (Blake drain only if extensive periadrenal dissection).",
      specimens: "Adrenal gland with peri-adrenal fat, oriented for pathology.",
      disposition:
        "The patient tolerated the procedure well and was awakened from anesthesia uneventfully. Admitted to the surgical floor (HDU/ICU for pheochromocytoma cases). Plan: serial blood pressure and glucose checks, replacement steroids if bilateral or solitary adrenal, advance diet as tolerated.",
    };
  }

  if (includesAny(name, ["pyeloplasty"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Minimal to approximately 50 ml.",
      drains: "6 Fr × 26 cm double-J ureteral stent, 16 Fr Foley catheter, 15 Fr Blake drain in the renal fossa.",
      specimens: "Excised UPJ segment to pathology.",
      disposition:
        "The patient tolerated the procedure well and was awakened from anesthesia uneventfully. Admitted overnight. Plan: Foley out POD 1–2, drain removed when output is low, ureteral stent removed in clinic at 4–6 weeks, MAG3 renogram at 3 months to confirm functional patency.",
    };
  }

  if (includesAny(name, ["ureteroneocystostomy", "ureteric reimplant", "ureteral reimplant"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Approximately 100–200 ml.",
      drains: "6 Fr × 26 cm double-J stent on the affected side, 16 Fr Foley catheter, pelvic Blake drain.",
      specimens: "Distal ureteric segment to pathology if excised.",
      disposition:
        "The patient tolerated the procedure well and was awakened from anesthesia uneventfully. Plan: Foley × 7 days, stent removed in clinic at 4–6 weeks, follow-up renal ultrasound to assess for hydronephrosis.",
    };
  }

  if (includesAny(name, ["urethroplasty"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Approximately 50–100 ml.",
      drains: "16 Fr silicone urethral Foley catheter as a urethral stent.",
      specimens: "Excised stricture segment to pathology.",
      disposition:
        "The patient tolerated the procedure well and was awakened from anesthesia uneventfully. Plan: pericatheter retrograde urethrogram in 3 weeks; if extravasation-free, the catheter is removed.",
    };
  }

  if (includesAny(name, ["hypospadias"])) {
    return {
      anesthesia: "General anesthesia with caudal block.",
      ebl: "Minimal.",
      drains: "6 Fr feeding-tube urethral stent (for distal repair) or 8 Fr silicone catheter (for proximal repair).",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well and was awakened from anesthesia uneventfully. Plan: discharge home with the urethral stent in place; stent removal in clinic at 7–14 days, sponge baths only until then, oxybutynin for bladder spasm.",
    };
  }

  if (includesAny(name, ["mid-urethral sling", "tvt", "tot", "transobturator"])) {
    return {
      anesthesia: "General or spinal anesthesia.",
      ebl: "Minimal.",
      drains: "16 Fr Foley catheter.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well and was awakened from anesthesia uneventfully. Plan: voiding trial prior to discharge; if successful, home the same day with pelvic-rest precautions for 6 weeks.",
    };
  }

  if (includesAny(name, ["artificial urinary sphincter", "aus"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Approximately 50 ml.",
      drains: "16 Fr Foley catheter overnight.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well and was awakened from anesthesia uneventfully. Admitted overnight. Plan: Foley out POD 1, device left deactivated for 6 weeks before activation in clinic.",
    };
  }

  if (includesAny(name, ["sacral neuromodulation", "interstim", "snm"])) {
    return {
      anesthesia: "Local anesthesia with monitored anesthesia care for stage 1; general for stage 2.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well and was awakened from anesthesia uneventfully. Discharge home the same day. Plan: Stage 1 — bladder diary × 14 days to assess > 50% improvement; Stage 2 IPG implantation if responder.",
    };
  }

  if (includesAny(name, ["penile prosthesis"])) {
    return {
      anesthesia: "General or spinal anesthesia.",
      ebl: "Approximately 50 ml.",
      drains: "Penrose drain in the dependent scrotum (removed POD 1).",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well and was awakened from anesthesia uneventfully. Admitted overnight on IV antibiotics. Plan: device cycled to half-deflation by POD 1, full activation at 6 weeks in clinic.",
    };
  }

  if (includesAny(name, ["varicocele", "varicocelectomy"])) {
    return {
      anesthesia: "General anesthesia (microsurgical) or local with sedation (open inguinal).",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well and was awakened from anesthesia uneventfully. Discharge home the same day with scrotal support and ice. Plan: post-op semen analysis at 3 and 6 months for fertility cases.",
    };
  }

  if (includesAny(name, ["orchiopexy", "orchidopexy"])) {
    return {
      anesthesia: "General anesthesia with caudal block.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well and was awakened from anesthesia uneventfully. Discharge home the same day. Plan: scrotal exam at 6 weeks to confirm intrascrotal position; annual follow-up given lifetime testicular cancer risk.",
    };
  }

  if (includesAny(name, ["prostate biopsy", "trus biopsy", "transperineal biopsy"])) {
    return {
      anesthesia: "Local anesthesia (peri-prostatic block) for transrectal; general or spinal for transperineal mapping.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Prostate cores in separately labelled containers by sextant / target.",
      disposition:
        "The patient tolerated the procedure well. Discharge home the same day. Plan: bladder voiding before discharge, return precautions for fevers (sepsis), follow-up in clinic for pathology in 7–10 days.",
    };
  }

  if (includesAny(name, ["spc placement", "suprapubic catheter", "suprapubic cystostomy"])) {
    return {
      anesthesia: "Local anesthesia ± sedation; general for difficult anatomy.",
      ebl: "Minimal.",
      drains: "16 Fr suprapubic Foley catheter.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well. Plan: SPC drainage to bag, first change at 4–6 weeks once a tract is established.",
    };
  }

  if (includesAny(name, ["bladder biopsy"])) {
    return {
      anesthesia: "General anesthesia.",
      ebl: "Minimal.",
      drains: "16 Fr Foley catheter.",
      specimens: "Bladder biopsies labelled by location.",
      disposition:
        "The patient tolerated the procedure well. Discharge home the same day. Plan: pathology follow-up, surveillance per AUA guidelines.",
    };
  }

  if (includesAny(name, ["eswl", "shock wave lithotripsy"])) {
    return {
      anesthesia: "Sedation or general anesthesia.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Stone fragments may be collected post-treatment if available.",
      disposition:
        "The patient tolerated the procedure well. Discharge home the same day on tamsulosin and analgesia. Plan: KUB at 4 weeks to assess clearance.",
    };
  }

  if (includesAny(name, ["stent placement", "stent insertion", "ureteral stent"]) && !includesAny(name, ["removal", "remove"])) {
    return {
      anesthesia: "General anesthesia (or sedation in select cases).",
      ebl: "Minimal.",
      drains: "6 Fr × 26 cm double-J ureteral stent, 16 Fr Foley catheter.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well. Discharge home the same day. Plan: stent removal scheduled in clinic at the appropriate interval (typically 1–6 weeks depending on indication).",
    };
  }

  if (includesAny(name, ["stent removal"])) {
    return {
      anesthesia: "Local anesthesia with intraurethral lidocaine; sedation in selected cases.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Stent retained for inspection only.",
      disposition:
        "The patient tolerated the procedure well. Discharge home the same day with return precautions for fever, persistent flank pain, or gross hematuria.",
    };
  }

  if (includesAny(name, ["cystoscopy"]) && !includesAny(name, ["turbt", "turp"])) {
    return {
      anesthesia: "Local anesthesia (intraurethral lidocaine) for diagnostic; general anesthesia for biopsy or extended evaluation.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Cold-cup or fulguration biopsies labelled by location, when taken.",
      disposition:
        "The patient tolerated the procedure well. Discharge home the same day. Plan: surveillance per indication, pathology follow-up if biopsies obtained.",
    };
  }

  if (includesAny(name, ["nephrectomy", "partial nephrectomy"])) {
    const partial = name.includes("partial");
    return {
      anesthesia: "General endotracheal anesthesia with epidural for open cases.",
      ebl: partial ? "Approximately 150–300 ml." : "Approximately 100–200 ml.",
      drains: partial
        ? "15 Fr Blake drain in the perinephric space and 16 Fr Foley catheter."
        : "16 Fr Foley catheter.",
      specimens: partial
        ? "Renal mass with a rim of normal parenchyma sent fresh for frozen-section margin assessment, then permanent section."
        : "Kidney and surrounding Gerota's fascia en bloc, with ipsilateral adrenal gland [preserved / included] as indicated.",
      disposition:
        "The patient tolerated the procedure well and was awakened from anesthesia uneventfully. Admitted to the surgical floor. Plan: advance diet as tolerated, early ambulation, serial hemoglobin checks, drain removal when output is low.",
    };
  }

  // Generic urology default
  const lat = detectLaterality(name);
  return {
    anesthesia: "General anesthesia.",
    ebl: "Approximately ________ ml.",
    drains: `Foley catheter. [Describe ureteral stent/drain specifics if placed.] Laterality: ${lat}.`,
    specimens: "[Describe specimens or 'None'].",
    disposition:
      "The patient tolerated the procedure well and was awakened from anesthesia uneventfully. Transferred to the recovery area in stable condition. Postoperative plan per standard urology service protocol.",
  };
}

export function urologyFindings(c: CaseLog): string {
  const name = c.procedureName.toLowerCase();
  const lat = detectLaterality(name);

  if (includesAny(name, ["ureteroscopy", "urs", "laser lithotripsy"])) {
    return `A ${lat} ureteral stone was identified at the [proximal / mid / distal] ureter measuring approximately [__] mm. The ureter was patent to the level of the stone with [no / mild / moderate] upstream hydroureter. No evidence of ureteral stricture, tumor, or perforation was appreciated. The renal pelvis and visualized calyces were clear of additional stone burden at the conclusion of the procedure. The urine returned clear at the end of the case, and hemostasis within the ureter was excellent. A double-J stent was positioned with the proximal coil in the renal pelvis and the distal coil in the bladder, confirmed by direct and fluoroscopic visualization. Preoperative renal function was within acceptable limits for contrast and anesthesia.`;
  }

  if (includesAny(name, ["pcnl"])) {
    return `A ${lat} staghorn / large-volume renal stone burden was identified, involving the [renal pelvis and lower / upper pole calyx]. A posterior lower-pole calyceal access was obtained under combined fluoroscopic and ultrasound guidance. Stone fragments were systematically cleared with [ultrasonic / combined pneumatic and ultrasonic] lithotripsy. Residual fragments in inaccessible calyces were addressed with flexible nephroscopy. At the conclusion of the case there was [no / minimal] residual stone burden, the urothelium was intact, and hemostasis at the access tract was satisfactory. Urine returned lightly blood-tinged.`;
  }

  if (includesAny(name, ["turbt", "transurethral resection of bladder"])) {
    return `Cystoscopy demonstrated [single / multiple] bladder tumor(s), the dominant lesion located at the [left lateral / right lateral / posterior / dome / trigone] wall, measuring approximately [__] cm and appearing [papillary / sessile / solid]. No carcinoma in situ was appreciated on inspection. The ureteral orifices were identified bilaterally and were uninvolved. The tumor(s) were completely resected down to and including detrusor muscle, and the base was fulgurated. At the end of the procedure the bladder was well drained, the effluent was clearing, and there was no evidence of perforation.`;
  }

  if (includesAny(name, ["greenlight", "photovaporization", "pvp"])) {
    return `There was a large obstructing median lobe. There was also lateral lobe adenoma, more notable on the ${lat} lateral side. At the end of the procedure there was a widely patent prostatic channel with good hemostasis. Care was taken to keep treatment proximal to the verumontanum to preserve the external urethral sphincter. Minimal hematuria was present at the conclusion of the case. The bladder neck and ureteral orifices were identified and uninvolved. Urine returned clear.`;
  }

  if (includesAny(name, ["turp", "transurethral resection of prostate"])) {
    return `There was a large obstructing prostate with prominent [median / lateral / bilateral] lobe enlargement measuring approximately [__] g by preoperative imaging. The bladder neck was identified and the verumontanum was used as the distal landmark to protect the external urethral sphincter. At the conclusion of the resection there was a widely patent prostatic fossa, the ureteral orifices were preserved and uninvolved, hemostasis was achieved throughout the fossa, and the effluent was clearing with only minimal hematuria.`;
  }

  if (includesAny(name, ["holep", "holmium enucleation"])) {
    return `There was a large obstructing prostatic adenoma enucleated off the surgical capsule along the plane of dissection. The verumontanum was preserved throughout. Each enucleated lobe was morcellated in the bladder, and at the conclusion of the procedure there was a widely patent prostatic fossa with excellent hemostasis, clear effluent, and only minimal residual hematuria.`;
  }

  if (includesAny(name, ["radical prostatectomy", "rrp", "rarp", "lrp"])) {
    return `Intraoperative findings were consistent with the preoperative diagnosis of prostate cancer. The prostate was mobilized from the endopelvic fascia and dorsal venous complex without evidence of extraprostatic extension on visual inspection. The neurovascular bundles were [spared bilaterally / spared on one side only / widely excised for oncologic control] based on preoperative risk. The seminal vesicles were dissected without evidence of gross invasion. A tension-free, watertight vesicourethral anastomosis was achieved and confirmed with bladder irrigation. No gross lymphadenopathy was noted during the pelvic lymph node dissection.`;
  }

  if (includesAny(name, ["radical nephrectomy", "total nephrectomy"])) {
    return `A ${lat} renal mass was identified, consistent with the preoperative imaging and contained within Gerota's fascia. There was no gross invasion into the renal vein, vena cava, adjacent colon, duodenum, pancreatic tail, or adrenal gland. The kidney was removed en bloc within Gerota's fascia. The renal hilum was controlled with vascular staplers without complication. Hemostasis within the renal fossa was satisfactory at the conclusion of the case.`;
  }

  if (includesAny(name, ["partial nephrectomy", "nephron sparing"])) {
    return `A ${lat} renal mass was identified at the [upper / mid / lower] pole, measuring approximately [__] cm on intraoperative ultrasound, consistent with preoperative imaging. The tumor was circumferentially excised with a rim of normal parenchyma. Frozen-section margins were sent and returned [negative]. The collecting system and transected intrarenal vessels were reconstructed. Warm ischemia time was approximately [__] minutes. The renorrhaphy was inspected after clamp release and was hemostatic.`;
  }

  if (includesAny(name, ["radical cystectomy", "cystoprostatectomy"])) {
    return `A bulky, muscle-invasive bladder tumor was identified, consistent with the preoperative diagnosis. There was no gross evidence of invasion into the rectum, vaginal wall, or pelvic sidewall. Bilateral pelvic lymphadenectomy did not demonstrate gross adenopathy. The ureters were patent and mobilized without injury. The specimen was removed en bloc and urinary diversion was performed as described below.`;
  }

  if (includesAny(name, ["vasectomy"])) {
    return `Both vas deferens were identified, isolated, and found to be grossly normal in caliber. Each vas was clearly distinct from surrounding cord structures. Fascial interposition was completed bilaterally. No intraoperative bleeding was encountered.`;
  }

  if (includesAny(name, ["circumcision"])) {
    return `The foreskin was [phimotic / redundant / normal] with [no / mild] adhesions to the glans. The coronal anatomy was normal. No meatal stenosis or chordee was identified. Hemostasis was excellent at the completion of the procedure.`;
  }

  if (includesAny(name, ["orchiectomy"])) {
    return `A ${lat} testicular mass was identified, consistent with the preoperative diagnosis, with normal-appearing contralateral testis and cord structures. There was no evidence of invasion beyond the tunica albuginea or involvement of the spermatic cord up to the internal ring. The specimen was removed intact and hemostasis was achieved.`;
  }

  if (includesAny(name, ["hydrocele", "hydrocelectomy"])) {
    return `A large ${lat} hydrocele was identified with normal underlying testis and epididymis. There was no evidence of testicular mass, varicocele, or inguinal hernia. The sac was opened and drained, then plicated behind the cord in Jaboulay fashion.`;
  }

  if (includesAny(name, ["nephroureterectomy"])) {
    return `A ${lat} upper-tract urothelial tumor was identified, consistent with preoperative imaging. There was no gross extension into the renal vein, vena cava, or adjacent organs. The kidney + entire ureter + bladder cuff were removed en bloc within Gerota's fascia. The ureteric hiatus was closed in two layers and confirmed watertight.`;
  }

  if (includesAny(name, ["adrenalectomy"])) {
    return `A ${lat} adrenal mass measuring approximately [__] cm was identified, consistent with preoperative cross-sectional imaging. There was no gross invasion into the renal vein, vena cava, or adjacent structures. The mass was removed en bloc with peri-adrenal fat. The contralateral adrenal was inspected (left case) / not applicable. Hemostasis at the adrenal vein stump was excellent.`;
  }

  if (includesAny(name, ["pyeloplasty"])) {
    return `A ${lat} ureteropelvic junction obstruction was confirmed, with marked hydronephrosis above and an abrupt narrowing at the UPJ. [A crossing lower-pole vessel was/was not identified.] The renal pelvis was decompressed without injury. The ureter was patent distally to the bladder. The repair was patent and watertight at completion, confirmed by stent placement and gentle saline irrigation.`;
  }

  if (includesAny(name, ["ureteroneocystostomy", "ureteric reimplant", "ureteral reimplant"])) {
    return `A ${lat} distal ureteric stricture / [reflux / vesicoureteric junction obstruction] was identified, consistent with preoperative imaging. The ureter was healthy proximal to the diseased segment. A spatulated, refluxing or non-refluxing reimplantation was completed (psoas hitch / Boari flap as needed). The anastomosis was tension-free and watertight, confirmed with bladder filling.`;
  }

  if (includesAny(name, ["urethroplasty"])) {
    return `A bulbar / pendulous urethral stricture was identified, measuring approximately [__] cm. The corpus spongiosum was healthy proximal and distal to the stricture. The reconstruction was completed with [end-to-end anastomotic / dorsal-onlay buccal mucosal graft / penile-skin flap] technique. The repair was tension-free with healthy proximal and distal mucosal margins.`;
  }

  if (includesAny(name, ["hypospadias"])) {
    return `The meatus was located at the [glanular / coronal / sub-coronal / mid-shaft / penoscrotal] position, consistent with [distal / mid-shaft / proximal] hypospadias. There was [no / mild / moderate] chordee. The urethral plate was [healthy and tubularizable / atretic and required substitution]. The repair was tension-free and the neomeatus was at the tip of the glans.`;
  }

  if (includesAny(name, ["mid-urethral sling", "tvt", "tot", "transobturator"])) {
    return `Stress urinary incontinence was confirmed by preoperative urodynamics. The mid-urethra was identified at approximately the level of the bladder neck minus 1 cm. The sling was placed without tension under the mid-urethra and intraoperative cystoscopy demonstrated no bladder or urethral perforation, with bilateral ureteric jets. Cough stress test confirmed appropriate sling tension.`;
  }

  if (includesAny(name, ["artificial urinary sphincter", "aus"])) {
    return `Severe stress urinary incontinence was confirmed by preoperative testing. The bulbar urethra was healthy and adequate for cuff placement. The cuff (size [__] cm) was placed around the bulbar urethra, the pressure-regulating balloon ([__]–[__] cm H₂O) was placed in the prevesical space, and the control pump was placed in the dependent scrotum. The device cycled appropriately when tested intraoperatively.`;
  }

  if (includesAny(name, ["sacral neuromodulation", "interstim", "snm"])) {
    return `Refractory [overactive bladder / non-obstructive urinary retention / fecal incontinence] was confirmed by preoperative work-up. The S3 foramen was identified bilaterally / unilaterally with characteristic perineal bellows and great-toe plantarflexion responses to test stimulation at < 2 V. The tined lead was advanced into the optimal foramen position with similar responses on each of the four electrodes.`;
  }

  if (includesAny(name, ["penile prosthesis"])) {
    return `Refractory erectile dysfunction unresponsive to medical therapy was confirmed preoperatively. The corpora cavernosa were dilated atraumatically without crossover or perforation. The cylinders ([__] cm length each) were placed without buckling. The pump and reservoir were placed atraumatically. The device cycled appropriately when tested. The patient was counselled regarding cycling at home.`;
  }

  if (includesAny(name, ["varicocele", "varicocelectomy"])) {
    return `A ${lat} grade [II / III] varicocele was identified, consistent with preoperative ultrasound. [No artery / a healthy testicular artery was identified and preserved.] The lymphatic vessels were preserved when possible. There was no testicular pathology. The patient should be advised regarding postoperative scrotal swelling and hydrocele risk.`;
  }

  if (includesAny(name, ["orchiopexy", "orchidopexy"])) {
    return `A ${lat} undescended testis was identified at the [inguinal canal / abdominal / peeping] position. The testis was viable with appropriate cord length after retroperitoneal mobilization. The contralateral testis was [normal / also undescended]. The testis was placed in a dependent dartos pouch without tension on the spermatic cord.`;
  }

  if (includesAny(name, ["prostate biopsy", "trus biopsy", "transperineal biopsy"])) {
    return `The prostate measured approximately [__] g on transrectal ultrasound, [no / a hypoechoic] focus seen at [location]. There was no gross extracapsular extension. [12 / 14 / 24] cores were taken in a systematic pattern [+ targeted cores from MRI ROIs] and labelled separately. There was no immediate complication.`;
  }

  if (includesAny(name, ["spc placement", "suprapubic catheter", "suprapubic cystostomy"])) {
    return `The bladder was confirmed full by ultrasound prior to puncture. The puncture site was approximately 2 fingerbreadths superior to the pubic symphysis. The trocar entered the bladder cleanly and the suprapubic catheter passed atraumatically with prompt return of clear urine.`;
  }

  if (includesAny(name, ["bladder biopsy"]) && !includesAny(name, ["turbt"])) {
    return `Cystoscopy demonstrated [erythematous / nodular / unremarkable] bladder mucosa at [location]. [No / multiple] suspicious areas were identified. Cold-cup biopsies were taken at the dome, anterior, posterior, lateral walls, and trigone in a mapping fashion (when indicated). The ureteral orifices were identified bilaterally and uninvolved. No bleeding or perforation occurred.`;
  }

  if (includesAny(name, ["eswl", "shock wave lithotripsy"])) {
    return `A ${lat} renal / ureteric stone measuring approximately [__] mm at the [location] was targeted under fluoroscopic guidance. [__] shocks were delivered at increasing energy from [11–20] kV. Post-treatment imaging showed [stone fragmentation / no fragmentation requiring repeat session].`;
  }

  if (includesAny(name, ["stent placement", "stent insertion"]) && !includesAny(name, ["removal"])) {
    return `Cystoscopy demonstrated normal bladder anatomy. The ${lat} ureteral orifice was cannulated atraumatically and a 0.038" sensor wire was passed up to the renal pelvis under fluoroscopic confirmation. A 6 Fr × 26 cm double-J stent was deployed with proximal coil in the renal pelvis and distal coil in the bladder. No extravasation or perforation was seen.`;
  }

  if (includesAny(name, ["stent removal"])) {
    return `Cystoscopy demonstrated the distal coil of the ureteral stent in the bladder. The stent was grasped with stent-graspers and removed under direct vision in its entirety. The ureteral orifice was inspected and was patent without bleeding or significant inflammation.`;
  }

  if (includesAny(name, ["cystoscopy"]) && !includesAny(name, ["turbt", "turp"])) {
    return `The urethra was negotiated atraumatically. The bladder was systematically inspected with the dome, anterior wall, lateral walls, posterior wall, and trigone all visualized. The ureteral orifices were identified bilaterally with [bilateral clear / blood-tinged] efflux. [No suspicious mucosal lesions were identified / Findings: ___.]`;
  }

  // Generic urology finding
  return `Intraoperative findings were consistent with the preoperative diagnosis. The ${lat} genitourinary anatomy was identified and inspected. There was no evidence of unanticipated pathology. Hemostasis was satisfactory and the urine returned clear at the conclusion of the case.`;
}

// ---------------------------------------------------------------------------
// Urology — procedure-specific operative steps.
//
// Covers the high-yield oncologic, endoscopic, stone, and reconstructive cases
// residents dictate most frequently. Wording is original — structured after the
// conventions in Armenakas, Fracchia & Golan, "Operative Dictations in Urologic
// Surgery" (Wiley).
// ---------------------------------------------------------------------------

function urologyOpSteps(c: CaseLog): string[] {
  const name = c.procedureName.toLowerCase();
  const open = c.surgicalApproach === "OPEN";

  // -- Prostatectomy ---------------------------------------------------------
  if (includesAny(name, ["radical prostatectomy", "rrp", "rarp", "lrp"])) {
    return [
      `The retropubic space was developed bluntly, sweeping the peritoneum cephalad. The endopelvic fascia was incised bilaterally and the puboprostatic ligaments were sharply divided. The dorsal venous complex was ligated and divided with a running 0 Vicryl suture.`,
      `The bladder neck was identified by palpation of the Foley balloon and incised anteriorly, then circumferentially, taking care to preserve the ureteral orifices. The vas deferens were identified, ligated, and divided. The seminal vesicles were mobilized and preserved on their vascular pedicles.`,
      `The prostatic pedicles were controlled with clips or an energy device. The neurovascular bundles were [preserved in a nerve-sparing fashion / widely excised for oncologic control] based on preoperative risk stratification.`,
      `The apex of the prostate was dissected sharply from the urethra, and the specimen was removed en bloc, inspected for gross capsular integrity, and sent fresh to pathology for margin assessment.`,
      `A vesicourethral anastomosis was fashioned over a [18/20] Fr urethral catheter using [6 interrupted 3-0 Monocryl sutures / a running 3-0 V-Loc suture], ensuring a watertight, tension-free repair. The anastomosis was tested with gentle bladder irrigation and was watertight.`,
      `[A pelvic lymph node dissection was performed sending standard / extended templates.] A 15 Fr Blake drain was left in the pelvis.`,
    ];
  }

  // -- Radical nephrectomy ---------------------------------------------------
  if (includesAny(name, ["radical nephrectomy", "total nephrectomy"])) {
    return [
      `The colon was mobilized medially along the line of Toldt to expose the retroperitoneum. Gerota's fascia was left intact around the kidney. The ureter was identified, ligated, and divided at the level of the iliac vessels.`,
      `The renal hilum was approached posteriorly. The renal artery was identified, skeletonized, and controlled with a vascular stapler. The renal vein was similarly controlled and divided with a second stapler load.`,
      `The kidney and surrounding perinephric fat were mobilized en bloc within Gerota's fascia. [The ipsilateral adrenal gland was taken / preserved based on tumor location and imaging.] The specimen was placed in an Endo Catch bag and removed intact.`,
      `The renal fossa was inspected for hemostasis. The adjacent colon, duodenum, spleen, and pancreatic tail (on the left side) were inspected and found to be intact.`,
    ];
  }

  // -- Partial nephrectomy ---------------------------------------------------
  if (includesAny(name, ["partial nephrectomy", "nephron sparing"])) {
    return [
      `The kidney was exposed within Gerota's fascia and the tumor was identified. The hilar vessels were dissected and isolated in preparation for clamping. Intraoperative ultrasound was used to delineate the tumor margins.`,
      `The patient was given mannitol and IV furosemide. The renal artery was cross-clamped with a bulldog clamp, initiating warm ischemia (timer started). The tumor was circumferentially excised with a sharp cold technique, maintaining a rim of normal parenchyma.`,
      `The tumor base was inspected and frozen section margins were sent. Transected intrarenal vessels and the collecting system were oversewn with 3-0 Vicryl in figure-of-eight stitches. A renorrhaphy was performed using 0 Vicryl sliding-clip bolsters over Surgicel.`,
      `The hilar clamp was released (total warm ischemia time [___] minutes). The repair was inspected and was hemostatic. A perinephric drain was placed.`,
    ];
  }

  // -- Radical cystectomy ----------------------------------------------------
  if (includesAny(name, ["radical cystectomy", "cystoprostatectomy"])) {
    return [
      `A midline laparotomy was made and the peritoneal cavity was entered and explored. A self-retaining retractor was placed. The small bowel was packed out of the pelvis.`,
      `A bilateral standard/extended pelvic lymph node dissection was performed, harvesting nodes from the obturator, external iliac, internal iliac, and common iliac stations. The ureters were identified, mobilized, and divided at the level of the ureterovesical junction; distal margins were sent for frozen section.`,
      `The peritoneum was incised at the pouch of Douglas and the posterior bladder was mobilized off the rectum. Lateral bladder pedicles were controlled with an energy device. The endopelvic fascia was opened, the dorsal venous complex ligated and divided, and the urethra transected (in men, including the prostate; in women, with anterior vaginal wall as indicated).`,
      `The specimen was removed en bloc. A urinary diversion was then performed: [ileal conduit / orthotopic neobladder / continent cutaneous reservoir] as described separately.`,
    ];
  }

  // -- TURBT -----------------------------------------------------------------
  if (includesAny(name, ["turbt", "transurethral resection of bladder"])) {
    return [
      `A 26 Fr continuous-flow resectoscope was assembled and introduced per urethra into the bladder under direct vision. A systematic cystoscopic survey was performed identifying [single / multiple] bladder tumor(s) at [location, size, configuration].`,
      `Each tumor was resected using monopolar / bipolar loop electrocautery, including the underlying detrusor muscle to obtain adequate depth for staging. Resected chips were evacuated via Ellik evacuator and sent for pathology, labeled separately if from different locations.`,
      `The tumor base was fulgurated and the bladder wall re-inspected. [Single-dose intravesical mitomycin C / gemcitabine was instilled within 6 hours of resection per institutional protocol.]`,
      `Hemostasis was confirmed and a [22 Fr three-way] Foley catheter was placed and connected to continuous bladder irrigation.`,
    ];
  }

  // -- TURP ------------------------------------------------------------------
  if (includesAny(name, ["turp", "transurethral resection of prostate"])) {
    return [
      `A 26 Fr continuous-flow resectoscope was introduced per urethra. The bladder, trigone, and ureteral orifices were inspected and noted. The prostatic fossa was then inspected, with attention to the verumontanum as the distal landmark.`,
      `Bipolar loop resection was begun at the bladder neck and carried distally, systematically resecting [median lobe / lateral lobes / anterior tissue] down to the surgical capsule and stopping proximal to the verumontanum to preserve the external sphincter. Chips were evacuated periodically via Ellik evacuator.`,
      `Hemostasis was achieved with the loop and coagulation. The prostatic fossa was re-inspected and was hemostatic. A [22 Fr three-way] Foley catheter was placed with the balloon inflated to [30–50] mL in the bladder and placed on gentle traction and continuous bladder irrigation.`,
    ];
  }

  // -- Ureteroscopy + laser lithotripsy --------------------------------------
  if (includesAny(name, ["ureteroscopy", "urs", "laser lithotripsy"])) {
    return [
      `Cystoscopy was performed and the [affected] ureteral orifice was identified. A 0.038" sensor guidewire was passed up the ureter under fluoroscopic guidance to the renal pelvis and its intrarenal position confirmed.`,
      `A [semi-rigid / flexible] ureteroscope was passed alongside the guidewire (or through a ureteral access sheath) up the ureter. The stone was identified at [location]. Holmium:YAG laser lithotripsy was performed at [0.8 J × 10 Hz] until fragments were sufficiently small. Fragments were either basketed and sent for stone analysis or allowed to pass spontaneously.`,
      `The ureter and renal pelvis were re-inspected and no residual stones or perforation were identified. A [6 Fr × 26 cm] double-J ureteral stent was placed over the guidewire, with the proximal coil in the renal pelvis and distal coil in the bladder confirmed fluoroscopically. A Foley catheter was placed.`,
    ];
  }

  // -- PCNL ------------------------------------------------------------------
  if (includesAny(name, ["pcnl", "percutaneous nephrolithotomy"])) {
    return [
      `Cystoscopy was performed and a 6 Fr open-ended ureteral catheter was placed up to the renal pelvis and secured to a Foley. The patient was repositioned prone with appropriate padding.`,
      `Under combined fluoroscopic and ultrasound guidance, a posterior [lower / mid] pole calyx was accessed with an 18 Ga diamond-tip needle. Contrast opacification of the collecting system confirmed correct entry. A 0.038" stiff guidewire was passed down the ureter into the bladder.`,
      `The tract was dilated to 30 Fr with sequential Amplatz dilators and a 30 Fr Amplatz sheath was placed. A rigid nephroscope was introduced and the stone burden visualized. Stones were fragmented using [ultrasonic / combined ultrasonic and pneumatic] lithotripsy and fragments extracted with graspers. Flexible nephroscopy was used to clear residual fragments in inaccessible calyces.`,
      `Fluoroscopic and endoscopic re-inspection confirmed clearance. A [nephrostomy tube / antegrade ureteral stent / tubeless exit] was placed per surgeon preference. The access site was closed with a single stitch.`,
    ];
  }

  // -- Vasectomy -------------------------------------------------------------
  if (includesAny(name, ["vasectomy"])) {
    return [
      `Under local anesthesia with lidocaine, each vas deferens was identified and isolated subcutaneously through a small [no-scalpel] scrotal incision using a ringed clamp. A segment of each vas was exteriorized, isolated from the vasal sheath, and a ~1 cm segment was excised and sent for pathology.`,
      `Each vasal end was cauterized / ligated with 3-0 chromic, and fascial interposition was performed by suturing the vasal sheath between the two ends to reduce recanalization risk. Hemostasis was confirmed.`,
      `The scrotal skin was closed with absorbable suture. The patient was advised to continue contraception until azoospermia is documented.`,
    ];
  }

  // -- Circumcision ----------------------------------------------------------
  if (includesAny(name, ["circumcision"])) {
    return [
      `After dorsal penile nerve block (and/or general anesthesia), the foreskin was retracted and any phimotic adhesions bluntly divided. The coronal margin was marked circumferentially with a surgical pen.`,
      `A sleeve resection technique was performed: the inner and outer preputial layers were incised along the marked lines and the intervening skin was removed. Hemostasis was achieved with bipolar electrocautery, avoiding monopolar energy near the shaft.`,
      `The skin edges were re-approximated with interrupted 5-0 chromic sutures. A petroleum gauze dressing was applied.`,
    ];
  }

  // -- Orchiectomy -----------------------------------------------------------
  if (includesAny(name, ["radical orchiectomy", "orchiectomy"])) {
    const radical = name.includes("radical");
    if (radical) {
      return [
        `A transverse inguinal incision was made and carried down through Scarpa's fascia to the external oblique aponeurosis. The external oblique was opened in the line of its fibers and the spermatic cord isolated at the internal ring.`,
        `The cord was cross-clamped at the internal ring to minimize venous embolization of tumor cells. The testis was delivered into the wound by gentle traction on the cord and blunt dissection of the gubernaculum.`,
        `The cord was divided in two pedicles (vascular and vasal), doubly ligated with 0 silk, and the specimen removed. A permanent non-absorbable suture was tagged on the cord stump. The external oblique was re-approximated with 2-0 Vicryl and the skin closed in layers.`,
      ];
    }
    return [
      `A scrotal incision was made and the tunica vaginalis opened to deliver the testis. The spermatic cord was divided in two pedicles and ligated with 2-0 silk. The specimen was removed.`,
      `Hemostasis was confirmed. The scrotum was closed in layers with absorbable suture.`,
    ];
  }

  // -- Hydrocelectomy --------------------------------------------------------
  if (includesAny(name, ["hydrocele", "hydrocelectomy"])) {
    return [
      `A transverse scrotal incision was made and carried down through the dartos. The hydrocele sac was identified and delivered into the wound. The sac was opened and drained, and the testis and epididymis were inspected and found to be normal.`,
      `The redundant sac was trimmed and either everted and sutured behind the cord (Jaboulay) or plicated with 3-0 Vicryl (Lord). Hemostasis was confirmed. The dartos and scrotal skin were closed in layers with absorbable suture.`,
    ];
  }

  // -- Nephroureterectomy ----------------------------------------------------
  if (includesAny(name, ["nephroureterectomy"])) {
    return [
      `The patient was positioned in modified flank for the upper-tract portion. Either a [laparoscopic / robotic / open subcostal] approach was used. The colon was reflected medially along the line of Toldt, exposing Gerota's fascia.`,
      `The renal hilum was approached: the renal artery was skeletonised and divided with a vascular stapler, followed by the renal vein. The kidney was mobilised within Gerota's fascia. The ureter was followed distally to the bladder.`,
      `The patient was repositioned and a [Pfannenstiel / lower midline] incision was made. The bladder was distended via a pre-placed Foley. A bladder cuff was excised circumferentially around the ipsilateral ureteral orifice and the specimen (kidney + ureter + bladder cuff) was removed en bloc.`,
      `The bladder was closed in two layers (3-0 Vicryl mucosa + 2-0 Vicryl detrusor) and tested watertight with bladder filling. A 16 Fr Foley was left in place for 7–10 days. A pelvic Blake drain was placed. The renal fossa was inspected and hemostatic.`,
    ];
  }

  // -- Adrenalectomy ---------------------------------------------------------
  if (includesAny(name, ["adrenalectomy"])) {
    return [
      `Pneumoperitoneum was established (laparoscopic/robotic) or a posterior or anterior open approach was used. The retroperitoneum was entered. For a left adrenal: the splenocolic ligament was taken down and the spleen, splenic flexure, and pancreatic tail were retracted medially. For a right adrenal: the right triangular ligament was incised and the liver retracted superiorly to expose the IVC.`,
      `The adrenal gland was identified and dissected from peri-adrenal fat. The adrenal vein was identified — short and entering the IVC directly on the right; longer and entering the left renal vein on the left — clipped with two clips on the patient side and divided.`,
      `Small adrenal arterial branches from the inferior phrenic, aorta, and renal artery were systematically controlled with bipolar energy or clips. The gland was mobilised in its entirety and placed in an Endo Catch bag.`,
      `The specimen was extracted through the camera port (extended as needed). Hemostasis at the adrenal vein stump and bed was inspected and confirmed. A drain was placed only if oozing or extensive dissection.`,
    ];
  }

  // -- Pyeloplasty -----------------------------------------------------------
  if (includesAny(name, ["pyeloplasty"])) {
    return [
      `Pneumoperitoneum was established (or a flank incision made for open). The colon was reflected medially. The renal pelvis and proximal ureter were identified. The UPJ was isolated, and any crossing vessels were noted and preserved.`,
      `An Anderson-Hynes dismembered pyeloplasty was performed: the redundant pelvis was excised and the proximal ureter was spatulated laterally. A tension-free, watertight ureteropelvic anastomosis was fashioned with 4-0 Vicryl interrupted (or running V-Loc) over a pre-placed 6 Fr × 26 cm double-J stent.`,
      `The repair was inspected after stent placement and gentle bladder filling demonstrated no extravasation. A perinephric Blake drain was placed. Ports were closed.`,
    ];
  }

  // -- Ureteroneocystostomy --------------------------------------------------
  if (includesAny(name, ["ureteroneocystostomy", "ureteric reimplant", "ureteral reimplant"])) {
    return [
      `A Pfannenstiel or lower midline incision was made (or laparoscopic ports placed). The bladder was identified and mobilised. The affected ureter was traced to its diseased distal segment, which was excised and the proximal end spatulated.`,
      `A psoas hitch was performed by mobilising the contralateral bladder dome, fixing it to the ipsilateral psoas tendon with two interrupted 0 Vicryl sutures (taking care to avoid the genitofemoral nerve). [If insufficient length: a Boari flap was raised from the bladder.]`,
      `A submucosal tunnel was created (anti-reflux) and the ureter was anastomosed end-to-side to the bladder mucosa with interrupted 4-0 Vicryl over a 6 Fr × 26 cm double-J stent. The detrusor was closed over the tunneled ureter.`,
      `The bladder closure was tested watertight with bladder filling. A 16 Fr Foley was left in place. A pelvic Blake drain was placed.`,
    ];
  }

  // -- Urethroplasty ---------------------------------------------------------
  if (includesAny(name, ["urethroplasty"])) {
    return [
      `The patient was placed in lithotomy. A perineal incision was made over the bulbar urethra (for bulbar stricture). The bulbocavernosus muscle was split in the midline and the bulbar urethra was mobilised circumferentially around the strictured segment.`,
      `For a short (< 2 cm) stricture: an excision and primary anastomotic urethroplasty was performed — the strictured segment was excised, the spatulated urethral ends were re-approximated with 5-0 Monocryl interrupted sutures over a 16 Fr silicone catheter.`,
      `For a longer stricture: a dorsal-onlay buccal mucosal graft was harvested from the inner cheek (Steven's stitch left for orientation), defatted, and quilted onto the dorsal urethrotomy with 5-0 Vicryl interrupted sutures.`,
      `The repair was inspected for water-tightness with retrograde saline injection. The bulbocavernosus muscle was re-approximated and the perineum was closed in layers.`,
    ];
  }

  // -- Hypospadias repair ----------------------------------------------------
  if (includesAny(name, ["hypospadias"])) {
    return [
      `A holding 4-0 Prolene stitch was placed in the glans for traction. An artificial erection with saline confirmed the degree of chordee. A circumferential subcoronal incision was made and the penile shaft was degloved to the penopubic junction.`,
      `Any chordee was released by complete dorsal mobilisation (and Nesbit plication if persistent). The urethral plate was assessed: if healthy and tubularizable, a Snodgrass tubularised incised plate (TIP) repair was performed by incising the urethral plate longitudinally, then tubularising over an 8 Fr stent with running 7-0 Vicryl.`,
      `A dartos flap was harvested from the dorsal preputial skin and rotated ventrally as a second layer over the neourethra to reduce fistula risk. The glans wings were rotated medially over the neourethra and approximated with 6-0 Vicryl. The skin was closed with interrupted 6-0 chromic.`,
      `A petroleum-gauze dressing and a Tegaderm with the catheter exiting were applied.`,
    ];
  }

  // -- Mid-urethral sling ----------------------------------------------------
  if (includesAny(name, ["mid-urethral sling", "tvt", "tot", "transobturator"])) {
    return [
      `The patient was placed in dorsal lithotomy. The vagina, perineum, and lower abdomen (TVT) or thighs (TOT) were prepped and draped. A 16 Fr Foley was placed.`,
      `A small (~1.5 cm) anterior vaginal wall incision was made over the mid-urethra. Periurethral tunnels were created bilaterally with curved Metzenbaum scissors towards the [retropubic space (TVT) / obturator foramen (TOT)].`,
      `[For TVT: stab incisions made just superior to the pubic symphysis bilaterally; the helical needles were passed from the vaginal incision through the retropubic space and out through the abdominal stab incisions.] [For TOT: stab incisions made at the genitofemoral fold bilaterally; the helical needles were passed from outside-in through the obturator foramen.]`,
      `Cystoscopy was performed to confirm no bladder or urethral perforation and bilateral ureteric jets were visualised.`,
      `The polypropylene mesh was tensioned with a Mayo scissor between the urethra and the sling (no tension at rest), and the trocar arms were trimmed flush. The vaginal incision was closed with running 2-0 Vicryl. The skin stab incisions were closed with Steri-strips.`,
    ];
  }

  // -- AUS -------------------------------------------------------------------
  if (includesAny(name, ["artificial urinary sphincter", "aus"])) {
    return [
      `A perineal incision was made over the bulbar urethra. The bulbocavernosus muscle was split and the bulbar urethra was dissected circumferentially over a length adequate for cuff placement (typically 2 cm).`,
      `The urethra was measured circumferentially with the AUS sizing tape. A cuff one size larger (typically [4.0–4.5] cm) was selected and placed around the bulbar urethra without strangulation.`,
      `Through a small Pfannenstiel incision, the prevesical space was developed and the pressure-regulating balloon ([__] cm H₂O) was placed. The control pump was placed in a dependent scrotal pouch via the same Pfannenstiel incision.`,
      `Tubing was connected with a quick-connector under saline; the device was tested by cycling and was confirmed to be functional. The device was deactivated for 6 weeks. The wounds were closed in layers.`,
    ];
  }

  // -- Sacral neuromodulation (Stage 1 + Stage 2) ----------------------------
  if (includesAny(name, ["sacral neuromodulation", "interstim", "snm"])) {
    return [
      `STAGE 1 (lead placement / trial): Under sterile prep, the S3 foramen was identified using surface anatomy and confirmed under fluoroscopy. A 16-gauge insulated foramen needle was advanced into the foramen.`,
      `Test stimulation produced characteristic responses: bellows-like contraction of the perineum and plantarflexion of the great toe at < 2 V. A guidewire was inserted through the needle and the needle was removed. A 4-electrode tined lead (Medtronic 3889) was advanced over the wire into the optimal foramen position.`,
      `Each of the four electrodes was tested for similar responses at low thresholds. The lead was deployed by retracting the introducer over the tines. A second incision was made laterally for tunneling, and the lead was tunneled subcutaneously to the gluteal pocket (or externalised for a percutaneous nerve evaluation trial).`,
      `STAGE 2 (IPG implantation, if responder): The previously externalised lead was retrieved through the gluteal incision. An IPG pocket was developed in the upper buttock subcutaneous tissue. The lead was connected to the IPG and impedances were checked. The pocket was closed in layers.`,
    ];
  }

  // -- Penile prosthesis -----------------------------------------------------
  if (includesAny(name, ["penile prosthesis"])) {
    return [
      `A penoscrotal incision was made. The dartos was opened and the corpora cavernosa were exposed. Stay sutures of 2-0 PDS were placed in the tunica albuginea on each corpus.`,
      `A corporotomy was made over each stay suture and the corpora were dilated proximally and distally with Brooks dilators or sequential Hegar dilators, taking care to avoid crossover. The corpora were measured for cylinder length.`,
      `Cylinders ([__] cm length) were inserted into each corpus and the rear tips were positioned at the crus. The corporotomies were closed with running 2-0 PDS.`,
      `The pump was placed in a dependent scrotal pouch via the same incision. Through a small ipsilateral inguinal incision the prevesical space was opened and the reservoir ([100 mL]) was placed. Tubing was connected with quick-connectors under saline. The device was cycled three times to confirm function and left half-deflated.`,
      `A Penrose drain was placed in the dependent scrotum. The skin was closed with absorbable suture. A penile compressive dressing was applied.`,
    ];
  }

  // -- Varicocelectomy -------------------------------------------------------
  if (includesAny(name, ["varicocele", "varicocelectomy"])) {
    return [
      `A small (~3 cm) sub-inguinal incision was made just below the external ring (microsurgical sub-inguinal approach). The spermatic cord was delivered and placed over a Penrose drain.`,
      `Under operating microscope (×6 to ×10 magnification), the cord was opened. The testicular artery was identified by visible pulsations and Doppler confirmation and was preserved. Lymphatic vessels were identified and preserved when possible.`,
      `All internal spermatic veins (typically 4–8) and external spermatic veins were ligated with 4-0 silk and divided. The vas deferens and vasal vessels were preserved. The cord was inspected to confirm complete ligation.`,
      `The wound was closed in layers with absorbable suture.`,
    ];
  }

  // -- Orchiopexy ------------------------------------------------------------
  if (includesAny(name, ["orchiopexy", "orchidopexy"])) {
    return [
      `An inguinal incision was made and carried down through Scarpa's fascia to the external oblique aponeurosis. The external oblique was opened in the line of its fibres, exposing the spermatic cord.`,
      `The testis was identified within the inguinal canal and delivered into the wound. The processus vaginalis (a patent processus is universal) was identified, dissected free from the cord structures, ligated at the internal ring with 2-0 Vicryl, and divided. The cord was mobilised retroperitoneally as needed for length.`,
      `A scrotal incision was made and a dartos pouch was developed between the scrotal skin and dartos. The testis was passed through into the dartos pouch and fixed with 4-0 Vicryl tacking the tunica vaginalis to the dartos.`,
      `The external oblique was re-approximated with 3-0 Vicryl. The wound was closed in layers.`,
    ];
  }

  // -- Prostate biopsy -------------------------------------------------------
  if (includesAny(name, ["prostate biopsy", "trus biopsy", "transperineal biopsy"])) {
    if (includesAny(name, ["transperineal"])) {
      return [
        `Under general or spinal anesthesia, the patient was placed in dorsal lithotomy. A peri-perineal block was performed. The transrectal ultrasound probe was inserted and the prostate was measured and inspected.`,
        `A grid template (or freehand) was used to systematically biopsy the prostate via the perineum. [__] cores were taken from a standard sextant + targeted MRI ROIs. Each core was placed in a separate labelled container.`,
        `Hemostasis was confirmed. A small dressing was applied to the perineum.`,
      ];
    }
    return [
      `The patient was placed in left lateral decubitus. A peri-prostatic block was administered with 1% lidocaine via an 18 Ga spinal needle under TRUS guidance.`,
      `A standard 12-core systematic biopsy was performed, [+ 2 targeted cores from each MRI ROI], with each sextant labeled separately for pathology.`,
      `Hemostasis was confirmed. The patient was discharged home with return precautions for fevers, persistent hematochezia, or hematuria.`,
    ];
  }

  // -- SPC placement ---------------------------------------------------------
  if (includesAny(name, ["spc placement", "suprapubic catheter", "suprapubic cystostomy"])) {
    return [
      `The bladder was confirmed full by ultrasound. The puncture site was marked approximately 2 fingerbreadths superior to the pubic symphysis in the midline.`,
      `Under local anesthesia, a 1 cm skin incision was made and a Cope-Loop or trocar suprapubic kit was advanced into the bladder under ultrasound guidance. Brisk return of urine confirmed intraluminal position.`,
      `A 16 Fr suprapubic Foley was advanced over the trocar / through the introducer, and the balloon was inflated with 10 cc sterile water. The catheter was secured to the abdominal wall.`,
    ];
  }

  // -- Bladder biopsy (cystoscopic, no resection) ----------------------------
  if (includesAny(name, ["bladder biopsy"]) && !includesAny(name, ["turbt"])) {
    return [
      `A 22 Fr cystoscope was introduced per urethra into the bladder. A systematic survey of the bladder was performed, identifying the dome, anterior wall, lateral walls, posterior wall, and trigone.`,
      `Cold-cup biopsies were taken from [target locations]. [Random mapping biopsies were also taken from each wall and the trigone if indicated.] Hemostasis was achieved with bugbee fulguration as needed.`,
      `A Foley catheter was placed.`,
    ];
  }

  // -- ESWL ------------------------------------------------------------------
  if (includesAny(name, ["eswl", "shock wave lithotripsy"])) {
    return [
      `The patient was placed supine on the lithotripter table. The stone was localised under fluoroscopy and the focal point of the lithotripter was aligned to the stone.`,
      `Approximately [__] shocks were delivered, starting at low energy ([11 kV]) and ramping up to [20 kV] as tolerated. The stone was re-imaged periodically to assess fragmentation.`,
      `At the conclusion of treatment, post-treatment imaging documented [stone fragmentation / no significant fragmentation, recommend repeat session].`,
    ];
  }

  // -- Stent placement -------------------------------------------------------
  if (includesAny(name, ["stent placement", "stent insertion"]) && !includesAny(name, ["removal"])) {
    return [
      `Cystoscopy was performed and the affected ureteral orifice was identified. A 0.038" sensor wire was passed up the ureter under fluoroscopic guidance to the renal pelvis. Intrarenal position was confirmed by the wire curling.`,
      `A 6 Fr × 26 cm double-J stent was advanced over the wire and deployed using a stent pusher. The proximal coil was confirmed in the renal pelvis and the distal coil in the bladder by direct cystoscopic and fluoroscopic visualisation.`,
      `A Foley catheter was placed.`,
    ];
  }

  // -- Stent removal ---------------------------------------------------------
  if (includesAny(name, ["stent removal"])) {
    return [
      `Topical lidocaine jelly was instilled per urethra. A flexible cystoscope was introduced and the distal coil of the ureteral stent was identified in the bladder.`,
      `The stent was grasped with stent-grasping forceps and removed under direct vision. The ureteral orifice was inspected: it was patent without bleeding or significant inflammation. The full length of the stent was confirmed.`,
    ];
  }

  // -- Cystoscopy (diagnostic, may include biopsy) ---------------------------
  if (includesAny(name, ["cystoscopy"]) && !includesAny(name, ["turbt", "turp"])) {
    return [
      `Topical lidocaine jelly was instilled. A [flexible / rigid] cystoscope was introduced per urethra under direct vision. The urethra was inspected en route, including the prostatic urethra (if male).`,
      `The bladder was systematically inspected: dome, anterior wall, both lateral walls, posterior wall, and trigone. The ureteral orifices were identified bilaterally and clear efflux was noted.`,
      `[Cold-cup biopsies were taken at suspicious areas if identified.] The cystoscope was withdrawn under direct vision.`,
    ];
  }

  // Generic urology fallback — still better than a bare placeholder
  return [
    `The genitourinary anatomy was identified and the ${c.procedureName} was performed in standard fashion, with attention to preservation of the ureters, urethra, neurovascular bundles, and continence mechanism as applicable. [Expand with procedure-specific technical steps.] Hemostasis was confirmed throughout.`,
    ``,
  ];
}

export function urologyBody(c: CaseLog): string[] {
  const name = c.procedureName.toLowerCase();
  const open = c.surgicalApproach === "OPEN";
  const isEndoscopic =
    c.surgicalApproach === "ENDOSCOPIC" ||
    includesAny(name, ["turbt", "turp", "ureteroscopy", "urs", "cystoscopy"]);
  const isPercutaneous =
    c.surgicalApproach === "PERCUTANEOUS" || includesAny(name, ["pcnl"]);
  const isLap =
    c.surgicalApproach === "LAPAROSCOPIC" || c.surgicalApproach === "ROBOTIC";

  let preamble: string[];
  let closure: string[];

  if (isEndoscopic) {
    preamble = endoscopicPreamble();
    const leaveCatheter = includesAny(name, ["turbt", "turp"]);
    closure = endoscopicClosure(leaveCatheter);
  } else if (isPercutaneous) {
    preamble = [
      `Description of Procedure: Informed consent was obtained. The patient was brought to the operating room and placed initially in dorsal lithotomy for cystoscopy and retrograde ureteral catheter placement, then repositioned prone with all pressure points padded. Antibiotics were administered.`,
      ``,
      `A surgical time-out was completed.`,
      ``,
    ];
    closure = [
      `The patient was repositioned supine. Hemostasis was confirmed. Sterile dressings were applied over the access site.`,
    ];
  } else if (isLap) {
    preamble = laparoscopicPreamble(c, {
      foley: true,
      ports: [
        "8 mm robotic port at [right pararectal]",
        "8 mm robotic port at [left pararectal]",
        "8 mm robotic port at [left lateral]",
        "12 mm assistant port at [right upper quadrant]",
      ],
    });
    closure = standardLapClosure();
  } else if (open) {
    preamble = laparotomyPreamble(c, "midline");
    closure = standardOpenClosure();
  } else {
    preamble = [
      `Description of Procedure: Informed consent was obtained. The patient was positioned supine and prepped and draped in the usual sterile fashion. A time-out was performed.`,
      ``,
    ];
    closure = [
      `Hemostasis was confirmed. The wound was closed in layers with absorbable suture.`,
    ];
  }

  const steps = urologyOpSteps(c);
  return [...preamble, ...steps, ...closure];
}
