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

  // Acute torsion / scrotal exploration top-matter — distinct from
  // pediatric cryptorchidism orchiopexy. Matched FIRST so torsion cases
  // get the urgent-emergency framing instead of the elective dispostion.
  if (
    includesAny(name, [
      "torsion",
      "scrotal exploration",
      "testicular torsion",
      "spermatic cord torsion",
    ])
  ) {
    return {
      anesthesia: "General endotracheal anesthesia (urgent — expedited consent given suspected testicular torsion).",
      ebl: "Minimal.",
      drains: "None.",
      specimens: name.includes("orchiectom") ? "Non-viable testis to pathology." : "None.",
      disposition:
        "The patient tolerated the procedure well and was transferred to the recovery area in stable condition. Plan: overnight observation with discharge in the morning if clinically well, scrotal support × 1 week, ice over the first 48 hours, NSAIDs for pain control. The salvaged testis will be followed by ultrasound at 6–12 weeks to assess for atrophy. Return precautions for fever, increasing scrotal pain, or wound concerns.",
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

  // Torsion findings come BEFORE the elective orchiopexy findings so a
  // case named "scrotal exploration" / "torsion" gets the right narrative.
  if (
    includesAny(name, [
      "torsion",
      "scrotal exploration",
      "testicular torsion",
      "spermatic cord torsion",
    ])
  ) {
    return `${lat} testis noted to be torsed approximately [360° / 540° / 720°]. The testis was markedly edematous, firm, and [purple / dusky / black] in colour, extending proximally toward the spermatic cord. Following detorsion and warm saline-soaked gauze application, there was [gradual / rapid / no] return of perfusion with [improvement in colour, particularly of the spermatic cord, and partial improvement in testicular appearance / no return of viable colour despite reperfusion]. The contralateral testis appeared normal. ${lat === "right" ? "The right" : lat === "left" ? "The left" : "The"} hydrocele fluid was [serous / serosanguinous / dark] and reactive in character.`;
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
      `Patient positioning: dorsal lithotomy with the legs in candy-cane stirrups, all pressure points padded carefully (avoid lateral peroneal nerve compression at the fibular head — common pitfall). General anesthesia was induced with non-depolarising paralytic for any tumor on the lateral or posterolateral wall (paralysis abolishes the obturator reflex which can cause violent leg jerk + bladder perforation when monopolar cautery stimulates the obturator nerve coursing along the lateral pelvic wall — bipolar resection alone reduces but does not eliminate this risk). Antibiotic prophylaxis (cefazolin 2 g IV per AUA prior-to-instrumentation guidelines) was administered. The genitalia and perineum were prepped with chlorhexidine and draped to expose the operative field.`,
      `A 26-27 Fr continuous-flow resectoscope (Storz or Olympus) with rotary working element was assembled. Distending media was selected based on energy: bipolar resection (TURis or Plasmakinetic) used isotonic 0.9% saline (preferred — eliminates TUR syndrome from hyponatremic hyperammonemia); monopolar resection used 1.5% glycine or 5% mannitol (limited by 1500 mL fluid deficit before electrolyte risk). The scope was introduced per urethra under direct vision through the irrigation flow.`,
      `A systematic cystoscopic survey was performed in standard sequence (bladder neck → trigone → bilateral ureteric orifices with confirmation of clear efflux → posterior wall → bilateral lateral walls → dome → anterior wall using a 70° lens for the dome and anterior wall). Each tumor was characterised by location (clock-face nomenclature), size, configuration (papillary / sessile / flat / nodular), surface, and surrounding mucosa.${name.includes("blue light") || name.includes("hexvix") ? " Blue-light cystoscopy with hexaminolevulinate (Hexvix/Cysview) was performed after the standard white-light survey, with the bladder pre-instilled 60 minutes preoperatively — improves carcinoma in situ detection by 30-40% over white light alone." : ""}`,
      `Each tumor was resected using bipolar loop electrocautery (preferred — saline media + reduced obturator-reflex risk + better hemostasis) or monopolar (older standard). Resection technique: the tumor was systematically grasped at its base with the loop, and resected in standardised passes — first the exophytic component, then the underlying mucosa, then the submucosa, and finally a deliberate deep specimen of detrusor muscle (ESSENTIAL for adequate staging — pT1 vs pT2 distinction depends on muscle being present; failure to include muscle is the most common cause of inadequate TURBT). For lateral-wall tumors, the obturator-reflex risk was managed with paralysis and shorter loop activations. Chips were evacuated periodically via Ellik evacuator (or Iglesias if very vascular).`,
      `Specimens were submitted in separately labelled formalin containers by anatomic location: tumor chips per location (allows pathologic mapping), and a separate "deep muscle" specimen from the tumor base. ${name.includes("re-turbt") || name.includes("restaging") ? "For re-TURBT (restaging in 4-6 weeks per AUA NMIBC guidelines for high-grade T1 or absent muscle on initial): re-resect the original tumor bed PLUS biopsies from any concerning areas — finds residual disease in 30-50% of high-grade T1 cases." : ""} Random mapping biopsies (cold-cup) were performed only if positive cytology with negative visible disease (search for occult CIS).`,
      `The tumor base was fulgurated with the roller-ball electrode at coagulation setting (40-60 W), with care to avoid deep transmural cautery especially at the dome (peritoneal extravasation risk) or near ureteric orifices (stricture risk — fulgurate parallel to orifice, not directly through). The bladder was systematically reinspected and any residual tumor edges or new lesions were resected. Hemostasis was confirmed by direct visualisation with the bladder partially filled.`,
      `${name.includes("intravesical") || name.includes("mitomycin") || name.includes("post-turbt chemotherapy") ? "Single-dose intravesical chemotherapy (mitomycin C 40 mg in 40 mL water, OR gemcitabine 2 g in 100 mL — equivalent efficacy per SWOG S0337) was instilled via the Foley within 6 hours of resection (per AUA + EAU guidelines for low- and intermediate-risk NMIBC) and retained for 1 hour with patient rotation every 15 minutes. Single-dose post-TURBT chemotherapy reduces 1-year recurrence by 35-40% (level A evidence). Contraindicated for: confirmed perforation (extravesical extravasation causes severe chemical peritonitis), extensive resection > 50% bladder, gross hematuria. " : ""}A 22 Fr three-way Foley catheter was placed and connected to continuous bladder irrigation (CBI) with 0.9% saline at a rate sufficient to maintain clear effluent. CBI was discontinued when the urine cleared (typically 12-24 h). Foley removed POD 1-2 with voiding trial.`,
      `Postoperative pathway: admit overnight on CBI; D/C home POD 1-2 once voiding adequately. AUA NMIBC risk stratification at pathology results (low / intermediate / high-risk based on stage, grade, size, multiplicity, recurrence pattern). Adjuvant intravesical therapy (BCG induction + maintenance for high-risk; intravesical chemotherapy for intermediate). Surveillance cystoscopy schedule: q3 months × 2 years for high-risk, q3 months × 1 year then q6 months for intermediate, q3-6 months × 1 year for low-risk. Re-TURBT in 4-6 weeks for high-grade T1 or absent muscle on initial pathology.`,
    ];
  }

  // -- TURP ------------------------------------------------------------------
  if (includesAny(name, ["turp", "transurethral resection of prostate"])) {
    return [
      `Indication confirmed: BPH with bothersome LUTS refractory to medical therapy (alpha-blocker + 5-ARI tried), recurrent urinary retention, recurrent UTI from BPH, bladder stones from outlet obstruction, recurrent gross hematuria from BPH, or upper-tract decompensation. Preoperative workup reviewed: prostate volume by TRUS or MRI (TURP optimal for 30-80 g; HoLEP/PVP preferred for > 80 g; small glands < 30 g often respond to medical or PVP), uroflowmetry + post-void residual, IPSS score, urinalysis to exclude UTI, urodynamics if mixed picture. Anticoagulation managed per institutional protocol (warfarin held to INR < 1.5; DOACs held 48 h; antiplatelet decision per cardiac risk).`,
      `Patient positioning: dorsal lithotomy with all pressure points padded. Spinal anesthesia preferred (allows immediate postoperative neuro exam ruling out TUR syndrome with hypotonic media; reduces blood loss vs general — though bipolar saline TURP eliminates TUR syndrome risk). Antibiotic prophylaxis (cefazolin 2 g IV or per culture-directed regimen if positive urine culture). The genitalia and perineum were prepped with chlorhexidine and draped.`,
      `A 26-27 Fr continuous-flow resectoscope (Storz or Olympus) was assembled with bipolar loop (TURis Olympus or Plasmakinetic Karl Storz — preferred over monopolar; isotonic saline irrigation eliminates TUR syndrome) and 30° optics. The scope was introduced per urethra under direct vision. Initial cystoscopic survey was performed: bladder neck (assessed for elevation by median lobe), trigone, bilateral ureteric orifices (efflux confirmed; orifices marked relative to the planned bladder-neck resection), posterior wall, lateral walls, dome, anterior wall.`,
      `Prostatic anatomy was inspected with the resectoscope withdrawn distally: the verumontanum was identified at the prostatic apex (the critical distal landmark — the external urethral sphincter sits immediately distal to the verumontanum; resecting beyond the verumontanum risks stress incontinence). Lateral lobe enlargement, median lobe enlargement, and any obstructing anterior tissue were characterised. Prostatic urethral length was estimated.`,
      `Resection was begun at the bladder neck (12 o'clock), with the loop activated at cutting current 120-150 W (bipolar) or 80-100 W cut + 60-80 W coag (monopolar). Bipolar saline irrigation maintained continuous flow throughout. The first chips were taken from the median lobe (when present) using a "Nesbit" technique — the loop systematically resects the lobe down to the surgical capsule (recognised as smooth white fibrous tissue, with the underlying capsular fibers running circumferentially). Lateral lobe resection then proceeded systematically, alternating sides, with the surgeon orienting by the verumontanum + external sphincter distally and the bladder neck + ureteric orifices proximally.`,
      `Resection depth was kept superficial to the surgical capsule — capsule perforation causes extravasation and bleeding from veins on the capsular surface. Chips were evacuated periodically via Ellik evacuator and sent for pathology (incidentally finds prostate cancer in 5-10% of TURP specimens). Total resection time was kept < 60 minutes when possible to minimise irrigant absorption (bipolar saline reduces this concern but operative time still impacts blood loss and OR utilisation).`,
      `Hemostasis was achieved progressively during resection by coagulating arterial bleeders with the loop deactivated then reactivated at coag setting, and by roller-ball fulguration at the end. The prostatic fossa was systematically inspected at the end of resection, with focus on the bladder neck (often a major venous bleeder), the lateral capsular surfaces, and the apex (most difficult area to fulgurate due to proximity to the external sphincter). All bleeders were controlled before catheter placement.`,
      `A 22 Fr three-way Foley catheter was placed with the balloon inflated to 30-50 mL of sterile water, positioned in the bladder under direct vision. Gentle traction was applied for 30-60 minutes when needed for tamponade of bladder-neck bleeders. Continuous bladder irrigation (CBI) with 0.9% saline was started at a rate sufficient to maintain clear pink effluent. Foley was traction-released once effluent cleared.`,
      `Postoperative pathway: admit overnight on CBI. CBI discontinued when effluent is clear (typically 12-24 h). Foley removal POD 1-2 with voiding trial — discharge home when voiding adequately. Discharge medications: alpha-blocker (tamsulosin 0.4 mg daily) for 4-6 weeks, antibiotic prophylaxis (oral fluoroquinolone or based on culture × 7 days), oral hydration. Common postop counseling: expect 1-2 weeks of intermittent hematuria and urgency; return precautions for inability to void after Foley out, fever, heavy persistent gross hematuria with clots. Long-term outcomes: 80-90% improvement in IPSS score, 15-30% retrograde ejaculation (counsel preoperatively), 1-2% bladder neck contracture requiring later DVIU, 0.5-2% stress incontinence (risk increases with apical over-resection), 0.5% TUR syndrome (eliminated with bipolar saline).`,
    ];
  }

  // -- Ureteroscopy + laser lithotripsy --------------------------------------
  if (includesAny(name, ["ureteroscopy", "urs", "laser lithotripsy"])) {
    return [
      `Indication and stone characteristics reviewed: stone size, location, density (Hounsfield units > 1000 predicts dense cystine/brushite/COM resistant to fragmentation; < 800 favorable), composition (if known), bilateral status, prior intervention, urgency (urgent — obstructing infected stone requires drainage first via stent or PCN before definitive ureteroscopy), patient anatomy (distal ureteral access challenging in bladder reconstructions, prior cystectomy with ileal conduit, ureteric stricture). Anticoagulation managed per institutional protocol. Antibiotic prophylaxis (cefazolin 2 g IV per AUA pre-instrumentation; broader spectrum based on prior culture if known).`,
      `Patient positioning: dorsal lithotomy with all pressure points padded carefully (lateral peroneal nerve protected at the fibular head). Padding prevented dorsal hand and arm pressure. ${name.includes("flexible") || name.includes("upper tract") ? "Slight Trendelenburg facilitated stone passage to the renal pelvis on flexible ureteroscopy." : ""} Spinal or general anesthesia was administered. The genitalia and perineum were prepped with chlorhexidine and draped to expose the operative field.`,
      `A 22 Fr cystoscope (Storz or Olympus) with 30° lens was introduced per urethra under direct vision. The bladder was systematically inspected. The affected ureteric orifice was identified at the trigone and characterised. A 5 Fr open-tip ureteric catheter (Cook) was advanced through the cystoscope working channel and engaged at the orifice. ${name.includes("retrograde") || name.includes("rpg") ? "A retrograde ureteropyelogram was performed: 5-10 mL of contrast was injected through the catheter under fluoroscopic guidance to delineate the entire ureter and renal collecting system, characterise the stone position, identify any unsuspected anatomy (duplex system, ureteric stricture), and confirm absence of perforation. " : ""}A 0.038" sensor or hybrid guidewire (Boston Scientific Sensor PTFE-coated, or hydrophilic Glidewire if difficulty negotiating the orifice or stricture) was advanced through the catheter under fluoroscopic guidance up the ureter to the renal pelvis. Wire curling in the renal pelvis was confirmed on AP fluoroscopic imaging.`,
      `${name.includes("access sheath") || name.includes("uas") ? "A ureteric access sheath (10-14 Fr × 35 cm or 12-14 Fr × 45 cm Cook Flexor or Boston Scientific Navigator) was advanced over the wire to the proximal ureter (typically up to L3-L4 vertebral level). Sheath placement: (1) reduces intrarenal pressure during irrigation (prevents pyelovenous backflow + sepsis), (2) facilitates passage of multiple flexible scope passes for fragment extraction, (3) protects the ureter from scope-related trauma. Tight-fitting sheaths (12-13 Fr) cause more ureteric injury (Hayes classification of post-UAS ureteric injury — 5-15% incidence with conservative impact, but extensive injury recommends staged stone treatment). " : ""}${name.includes("semi-rigid") || name.includes("rigid urs") ? "A semi-rigid ureteroscope (Karl Storz 6.4-7.5 Fr or Olympus URF-V) was passed alongside the guidewire up the ureter under fluoroscopic guidance. Semi-rigid scopes are limited to the distal and mid-ureter (cannot navigate the iliac vessel kink reliably); for upper-ureter or intrarenal stones, transition to flexible. " : ""}${name.includes("flexible") || name.includes("digital") || name.includes("furs") ? "A flexible (digital) ureteroscope (Olympus URF-V3, Storz Flex-Xc 9.5 Fr, or single-use LithoVue) was advanced through the access sheath (or alongside the wire if no sheath) to the renal pelvis. Continuous-flow irrigation maintained visualisation; pressure was monitored to avoid intrarenal hypertension. " : ""}The stone was identified at [location], measured, and characterised: color (uric acid yellow-orange, calcium oxalate blue-grey, struvite pale white), surface (smooth COM vs spiculated COD vs amorphous), and accessibility.`,
      `Holmium:YAG laser lithotripsy was performed using a 200-272 micron laser fibre (smaller fibres for flexible scope tip-deflection preservation; 272 micron for higher-power dusting). Settings selected per stone characteristics and treatment goal: dusting (low energy 0.2-0.5 J × high frequency 30-80 Hz — produces fine dust passable spontaneously, reduces basketing time, popular in modern Moses-technology systems); fragmenting (higher energy 0.8-1.2 J × low frequency 5-10 Hz — produces 2-4 mm fragments amenable to basket retrieval); popcorn (after main fragmentation, 0.5 J × 30 Hz with the laser stationary in the renal pelvis for residual fragment polishing). Modern thulium fibre lasers (Quanta Cyber TFL or Olympus SOLTIVE Premium) provide higher dusting efficiency and reduced retropulsion.`,
      `Stone fragments were managed by combination: dust passed spontaneously through the access sheath; clinically significant fragments (≥ 2 mm) were basketed with a 1.5-1.9 Fr Nitinol basket (Cook NCircle or Boston Scientific Zero-Tip) and retrieved through the access sheath. ${name.includes("stone analysis") ? "Fragments were collected in a Stone-Trap and submitted for stone composition analysis (FT-IR or X-ray diffraction) to guide metabolic workup and prevention strategy." : ""} The collecting system was systematically inspected for residual stones — pyelocaliceal system, both ureters at the relevant levels, and the bladder.`,
      `The ureter was inspected during scope withdrawal under low-pressure irrigation: any mucosal injury (ureteric perforation, intussusception, avulsion), residual stone, or concerning ureteric stricture was documented. Ureteric perforation > 50% requires diversion (immediate stent + delayed reconstruction). A 6 Fr × 26 cm double-J ureteric stent (Boston Scientific Polaris Loop, sized to patient height: < 5'6" — 22-24 cm; 5'6"-6' — 24-26 cm; > 6' — 26-28 cm) was placed over the wire under fluoroscopic and cystoscopic guidance, with the proximal coil confirmed in the renal pelvis (curling on AP fluoroscopy) and distal coil in the bladder (cystoscopic visualisation).`,
      `Ureteric access sheath (when used) was carefully withdrawn over the wire under fluoroscopy to detect any embedded ureteric injury. The wire was then withdrawn. A 14 Fr Foley catheter was placed and connected to drainage. Voiding trial was performed in PACU after 4-6 h.`,
      `Postoperative pathway: discharge home same-day if voiding adequately. Discharge medications: alpha-blocker (tamsulosin 0.4 mg) for stent symptom relief × 2-4 weeks, NSAIDs/acetaminophen for pain (avoid with renal compromise), antibiotic prophylaxis × 5-7 days based on local resistance + culture. Stent symptom counselling — expect frequency, urgency, suprapubic discomfort, occasional flank pain, mild hematuria. Stent removal at 1-2 weeks via flexible cystoscopy (longer for ureteric injury, post-pyeloplasty, etc.). KUB at 4 weeks to assess residual fragment status. Metabolic stone evaluation (24-h urine collection, serum chemistry) for recurrent stone formers, single kidney, bilateral disease, or family history.`,
    ];
  }

  // -- PCNL ------------------------------------------------------------------
  if (includesAny(name, ["pcnl", "percutaneous nephrolithotomy"])) {
    return [
      `Indication: large stone burden (> 2 cm renal stones, or staghorn calculi — partial or complete), failed ESWL/URS, lower-pole stones > 1.5 cm where ureteroscopy yields suboptimal stone-free rates (gravity-dependent dependent calyx fragment retention), cystine or other ESWL-resistant stones, complex calyceal anatomy. Preoperative workup: contrast CT urogram (delineates stone burden, calyceal anatomy, ureteric path, retrorenal colon — critical for safe access — present in 5-10% of patients especially obese), urine culture with culture-directed antibiotics started 1-2 weeks preop for infected stones (struvite), coagulation status, anesthesia clearance. Antibiotic prophylaxis: cefazolin 2 g IV + tailored to culture if positive (struvite + complicated stones often need broader coverage including aminoglycoside).`,
      `Phase 1 — Cystoscopy and retrograde access (in dorsal lithotomy): a 22 Fr cystoscope was advanced per urethra. The affected ureteric orifice was identified. A 5-6 Fr open-tip ureteric catheter was advanced under fluoroscopy up to the renal pelvis and a retrograde pyelogram performed to opacify the entire collecting system — this map guides the percutaneous access trajectory. The catheter was secured to a 14 Fr Foley catheter with silk suture. The patient was repositioned.`,
      `Phase 2 — Patient positioning for percutaneous access: ${name.includes("supine") || name.includes("vidal") ? "Galdakao-modified supine Valdivia position (preferred in modern centers — single-position case, avoids prone-related ventilation/hemodynamic risks, allows simultaneous retrograde ureteroscopy) — patient supine with the operative side elevated 30° on a wedge bolster, ipsilateral leg extended in stirrup, contralateral leg flexed in candy-cane stirrup" : "prone position (standard, preserves the largest range of access angles, allows access to all calyces) — anesthesia briefly disconnected the vent for repositioning, with all pressure points padded, axillary roll, padding of bony prominences, and gel pads under the chest and pelvis to allow the abdomen to hang free"}. Pressure points were padded carefully. The flank was prepped with chlorhexidine and draped widely.`,
      `Phase 3 — Access tract creation: under combined fluoroscopic AND ultrasound guidance (modern best practice — ultrasound localises retrorenal colon + lung pleura + adjacent organs and avoids them; fluoroscopy confirms calyceal entry trajectory), a posterior calyx was selected for access (lower-pole most common — provides longest scope working distance and least intracaliceal angulation; mid- or upper-pole access for staghorn stones extending into upper tract — requires supracostal approach above the 11th or 12th rib with pneumothorax risk 2-5%). An 18-gauge diamond-tip needle was advanced through the access target with fluoroscopic verification of entry into the targeted posterior calyx (NOT anterior calyx — anterior calyx puncture causes extensive parenchymal traversal + arterial injury risk). Contrast injection through the needle confirmed intraluminal position by opacification of the surrounding calyceal system.`,
      `A 0.038" stiff guidewire (Bentson or Amplatz Super Stiff) was passed down the ureter into the bladder under fluoroscopic guidance — having the wire as a "safety" through the entire collecting system + ureter prevents inadvertent loss of access during dilation. A safety wire alongside the working wire was placed in many centers.`,
      `Phase 4 — Tract dilation: the tract was dilated to 30 Fr using sequential Amplatz dilators (mechanical dilation — preferred for fast progression in healthy patients) or balloon dilator (Boston Scientific Nephromax 30 Fr × 16 cm — single-step dilation, preferred for second-look or scarred tracts, or in patients with bleeding diathesis). Care was taken to advance the dilator under fluoroscopy with constant tactile feedback, with the working wire maintained throughout. A 30 Fr Amplatz sheath was placed over the dilator with its tip seated in the targeted calyx (NOT advanced into the renal pelvis — sheath at the calyx allows scope manipulation while preventing pelvic perforation).`,
      `Phase 5 — Stone clearance: a rigid 24 Fr nephroscope (Storz or Olympus) was introduced through the Amplatz sheath. The collecting system was systematically inspected, with attention to the renal pelvis, the calyx of access, adjacent calyces, and ureteric orifice. The stone was characterised (size, fragility, location, branching). Lithotripsy modality selected: ${name.includes("ultrasonic") || name.includes("ems") ? "ultrasonic lithotripsy (LithoClast Ultra or EMS LithoClast Trilogy) for soft-to-medium stones — provides simultaneous fragmentation + suction-aspiration of fragments through the probe (faster clearance)" : ""}${name.includes("pneumatic") || name.includes("ballistic") ? "pneumatic/ballistic lithotripsy (LithoClast Master) for hard stones — provides aggressive fragmentation but requires manual fragment retrieval" : ""}${name.includes("holmium") || name.includes("laser") ? "holmium:YAG laser via flexible nephroscope for accessible-but-non-rigid-line calyces (lower or upper-pole satellite calyces requiring scope flexion)" : ""}${name.includes("trilogy") ? "combined ultrasonic + ballistic (Trilogy or ShockPulse) — current state-of-the-art for staghorn stones" : ""} or combined approach with multiple modalities. Fragments were extracted with stone graspers (Cook Stone Cone or graspers) and Ellik evacuator.`,
      `Flexible nephroscopy (Storz 14.5 Fr Flex or Olympus URF-V3) was used to inspect calyces inaccessible to the rigid scope and to extract fragments from peripheral calyces — this is essential for stone-free outcomes (rigid-only PCNL leaves residual fragments in 30-40% of staghorn stones, vs < 10% with combined rigid + flexible). Fluoroscopic and endoscopic re-inspection at the end of clearance documented stone-free status (or quantified residual fragments). Antegrade nephrostogram confirmed: (1) collecting system integrity (no extravasation = no major perforation); (2) ureteric patency to the bladder; (3) absence of unrecognised stones.`,
      `Phase 6 — Tract closure: ${name.includes("tubeless") ? "tubeless PCNL — no nephrostomy tube placed; the tract was dilated tightly to seal at the kidney level, with hemostatic agent (Surgicel or FloSeal) plug placed in the working sheath; suitable for selected uncomplicated cases with single tract, no significant bleeding, no significant residual stones, no concerning ureteric anatomy. Faster recovery, less pain, shorter LOS" : name.includes("totally tubeless") ? "totally tubeless — neither nephrostomy nor antegrade stent — reserved for very-low-complexity case with all clearance criteria met" : "standard tubed PCNL: a 14 Fr Council-tip catheter or Cope-loop nephrostomy tube was placed in the calyx of access through the Amplatz sheath as the sheath was withdrawn over a guidewire. Tube secured to the skin with 2-0 silk anchor stitch + tegaderm dressing"}. ${name.includes("antegrade stent") || !name.includes("tubeless") ? "An antegrade 6 Fr × 26 cm double-J ureteric stent was placed during the case to maintain ureteric patency for fragment passage." : ""}`,
      `Postoperative pathway: admit overnight; observe for hematuria + hemodynamic stability + flank/perirenal hematoma signs; serum hemoglobin trend at 6 h and 12 h post-op (transfusion required in 3-7%; major hemorrhage requiring angio-embolisation in 0.5-1% — selective renal artery embolisation by IR for delayed bleeding which presents as gross hematuria + hemodynamic compromise). Antegrade nephrostogram POD 1 to confirm: (1) drainage to bladder; (2) absence of leak. Tube removal POD 1-2 if successful nephrostogram + clear urine. Stent removal at 1-2 weeks via cystoscopy. KUB or low-dose CT at 4-6 weeks for residual stone assessment. Metabolic stone evaluation initiated. Long-term outcomes: stone-free rate 70-85% single procedure, 90-95% with second-look procedure for residual fragments, 1-3% sepsis rate, < 1% mortality in modern hands.`,
    ];
  }

  // -- Vasectomy -------------------------------------------------------------
  if (includesAny(name, ["vasectomy"])) {
    return [
      `Pre-operative counseling reviewed: vasectomy is a permanent sterilization procedure (regret rate 5-10%, request for reversal 6-7% — counsel thoroughly preoperatively). Failure rate < 1% lifetime when done properly. Backup contraception required until post-vasectomy semen analysis confirms azoospermia (typically 8-16 weeks postop, 20+ ejaculations or a 3-month wait — AUA guideline). The patient was positioned supine with the scrotum exposed. Local anesthesia using 1% lidocaine (no epinephrine in scrotum due to terminal artery supply) — total 5-10 mL infiltrated subcutaneously over each vas after they were palpated through the scrotum and held in position with a vasal-fixation ring clamp. Antibiotic prophylaxis is NOT routinely indicated for vasectomy.`,
      `${name.includes("no-scalpel") || name.includes("nsv") ? "No-scalpel vasectomy technique (NSV — preferred per AUA + international urology guidelines, 90% lower complication rate than incisional, smaller wound, faster recovery): a single midline 5-10 mm puncture was made through the scrotum at the point of vas isolation using a sharp pointed dissecting forceps. The vas was delivered into the wound with a vasal-fixation ring clamp engaging through the skin." : "Conventional incisional vasectomy: bilateral 5-10 mm transverse scrotal incisions were made over each vas (or single midline incision). The vas was identified within the spermatic cord by palpation (firm cord-like structure 2-3 mm in diameter, distinguishable from spermatic vessels by the lack of pulsation)."}`,
      `The vas deferens was isolated subcutaneously, separating it from surrounding cord structures (vasal artery + vein; spermatic artery + vein; processus vaginalis remnant). The vasal sheath was opened and a clean segment of the vas (1-2 cm) was exteriorised. Two ringed clamps were applied 2-3 cm apart to define the segment for excision.`,
      `A 1-1.5 cm segment of vas was sharply excised between the clamps and submitted to pathology (mandatory — confirms vasal tissue + medico-legal documentation; failure to confirm tissue is the most common cause of "post-vasectomy pregnancy" lawsuits). The two cut ends of the vas were then secured by ${name.includes("cautery") || name.includes("luminal") ? "luminal cautery (preferred per AUA — 0.5% failure rate, lowest of any technique): a fine-tip electrocautery probe was passed 1-2 cm into the lumen of each vasal end and the mucosa was thermally ablated. This forms a fibrotic plug at the vasal lumen" : "ligation with 3-0 chromic absorbable suture × 2 ties on each cut end, then folded back on itself"} . The vasal end facing the testis (testicular end) was clipped with a hemoclip per surgeon preference. Importantly, fascial interposition was performed: the testicular end of the vas was secured INSIDE the vasal sheath, while the abdominal end of the vas was left OUTSIDE the sheath (separated tissue planes between the cut ends — reduces recanalization rate from ~1% to < 0.5%). The contralateral vas was treated identically.`,
      `Hemostasis was confirmed (small subcutaneous bleeders are common — bipolar cautery or compression). The skin incision (NSV) was closed with skin glue (Dermabond) or left open to heal by secondary intention; conventional incisions were closed with single interrupted 4-0 chromic suture. A scrotal supporter was applied. Discharge home immediately.`,
      `Postoperative care: ice packs to scrotum × 24-48 h to reduce swelling + pain. Avoid heavy lifting, exercise, sexual intercourse × 1 week. Resume normal activity at 1 week. Common complications discussed: scrotal hematoma 1-5%, infection 1-3%, persistent pain or post-vasectomy pain syndrome 1-3% (most resolve; chronic in < 1%). Post-vasectomy semen analysis at 8-16 weeks (or after 20 ejaculations) — confirms azoospermia or rare residual non-motile sperm (< 100,000/mL non-motile = success per AUA). Backup contraception MANDATORY until success confirmed. Counsel that the procedure does not protect against STIs, and does not affect testosterone levels, sex drive, or erectile function.`,
    ];
  }

  // -- Circumcision ----------------------------------------------------------
  if (includesAny(name, ["circumcision"])) {
    return [
      `Indication confirmed: phimosis (foreskin retraction limited — primary or secondary), recurrent balanitis or balanoposthitis, recurrent UTI in select pediatric cases, paraphimosis, lichen sclerosus / BXO, malignancy concern (penile cancer risk reduction discussed), elective religious / cultural / cosmetic indication. ${name.includes("pediatric") || name.includes("infant") || name.includes("neonatal") ? "Pediatric/neonatal circumcision: parental informed consent confirmed; AAP 2012 statement reviewed (potential health benefits — reduced UTI, HIV/HSV-2 transmission, penile cancer; outweigh risks but not strong enough to recommend routine; family decision). Anesthesia: dorsal penile nerve block (DPNB) with 1% lidocaine 0.5-1 mL each side at the 10 and 2 o'clock positions at the base of the penis, OR ring block, OR EMLA topical for neonates. Sucrose oral swab and oral acetaminophen for adjunctive analgesia." : "Adult circumcision: dorsal penile nerve block with 1% lidocaine 5-10 mL bilaterally at the 10 and 2 o'clock penile-base positions, supplemented with circumferential subcutaneous infiltration of the penile shaft. General anesthesia option for severe phimosis or anxious patients."} The patient was positioned supine. The penis and scrotum were prepped with chlorhexidine (or povidone-iodine in pediatric) and draped to expose the penis only.`,
      `The foreskin was retracted (or cleaved if phimotic — gentle progressive retraction; for tight phimosis, dorsal slit may be needed to expose the glans; for lichen sclerosus / BXO, plan for excision of all affected skin). Adhesions between the foreskin and glans were identified and bluntly divided with a small probe (Mosquito hemostat or blunt-tip dissector) — taking care to avoid traumatising the urethral meatus or ventral glans. The corona was identified circumferentially. A surgical skin marker delineated the planned proximal incision line approximately 1 cm proximal to the corona on the outer (skin) layer (this distance accounts for inner-layer mucosal closure and maintains 0.5-1.5 cm of remaining inner mucosa per cosmetic preference).`,
      `${name.includes("sleeve") || !name.includes("plastibell") && !name.includes("gomco") && !name.includes("mogen") ? "Sleeve resection technique (preferred adult/older pediatric — provides excellent cosmesis + best hemostasis): the outer (skin) layer was incised circumferentially along the marked line. The inner (mucosal) layer was incised circumferentially 0.5-1 cm proximal to the corona. The intervening cylinder of preputial skin was excised by sharp dissection in the avascular plane between Buck's fascia and the dartos." : ""}${name.includes("plastibell") || name.includes("gomco") || name.includes("mogen") ? "Pediatric/neonatal device technique: the foreskin was retracted, adhesions divided. " + (name.includes("plastibell") ? "Plastibell device — appropriately-sized bell placed over the glans, foreskin pulled over the bell, ligature tied around the foreskin at the bell's groove producing ischemic necrosis. Excess foreskin trimmed flush with the ligature. The bell remains attached for 3-7 days while necrosis completes, falling off spontaneously." : name.includes("gomco") ? "Gomco clamp — bell placed over glans, foreskin pulled over, clamp tightened around the bell to crush+coagulate the foreskin against the bell. Foreskin sharply excised distal to the clamp. Clamp left for 5 minutes for hemostasis." : "Mogen clamp — preputial slit made, foreskin pulled through clamp slot, foreskin sharply excised distal to clamp. Quick technique (< 1 minute) but blind cut risks glans injury (rare but reported).") : ""}`,
      `Hemostasis was achieved — vessels at the frenulum (frenular artery) and along the dorsal incision (typically 2-3 small arterial bleeders) were controlled with bipolar cautery (avoid monopolar near shaft skin/glans). The frenular artery was specifically identified and ligated/cauterised at the ventral frenulum.`,
      `Skin re-approximation was performed: the inner (mucosal) and outer (skin) layers were re-approximated with interrupted absorbable sutures — typical 5-0 chromic gut for adults (absorbs in 7-14 days, excellent cosmesis) or 6-0 chromic for pediatric. Sutures were placed at the 12 o'clock position first (dorsal, to set length), then 6 o'clock (ventral, frenular reconstruction), then four cardinal points filling in (3, 9, 1:30, 4:30, 7:30, 10:30 — typically 8 sutures total). The skin should be smooth without dog-ears; trim any excess skin. The frenulum was reconstructed precisely to avoid painful traction.`,
      `A petroleum gauze (Vaseline gauze) dressing was applied snugly around the shaft, secured with a small piece of tegaderm (avoid encircling — risks ischemia). The dressing was changed in 24-48 h or per surgeon preference; sponge baths until sutures dissolved; full bathing/showering after 1-2 weeks. Post-procedure analgesia: scheduled acetaminophen / ibuprofen × 5-7 days; topical anesthetic (EMLA or lidocaine gel) for diaper changes in pediatric. Sexual activity / heavy exercise withheld × 4-6 weeks for adults. Common complications counseled: bleeding 1-3%, infection 1-2%, scarring or unsatisfactory cosmesis 1-3%, meatal stenosis 0.5-1% (delayed; rare), iatrogenic glans/urethral injury < 0.1%. Long-term outcomes: phimosis cured; reduced UTI risk in pediatric; reduced HSV-2/HPV transmission in adult; cosmesis high satisfaction.`,
    ];
  }

  // -- Orchiectomy -----------------------------------------------------------
  if (includesAny(name, ["radical orchiectomy", "orchiectomy"])) {
    const radical = name.includes("radical");
    if (radical) {
      return [
        `Indication: testicular mass with high suspicion for malignancy on physical exam + scrotal ultrasound (intratesticular, hypervascular, solid mass) — urgent (within 1-2 weeks of suspicion) for staging and treatment. Preoperative workup: serum tumor markers (AFP, beta-hCG, LDH — pre-orchiectomy levels essential for staging + monitoring; AFP elevation rules out pure seminoma; beta-hCG elevation seen in seminoma 5-10% and NSGCT 25-50%; LDH correlates with tumor burden), staging CT chest/abdomen/pelvis (assess for retroperitoneal lymphadenopathy + pulmonary metastases). Sperm cryopreservation discussed BEFORE surgery (recommended for any patient who may want future fertility — orchiectomy alone does not significantly affect fertility, but adjuvant chemo/radiation does). Antibiotic prophylaxis (cefazolin 2 g IV).`,
        `Patient positioning: supine. The lower abdomen, genitalia, and ipsilateral inguinal region were prepped with chlorhexidine and draped widely. The contralateral testis was confirmed normal on examination intraoperatively. A transverse 5-7 cm inguinal incision was made over the inguinal canal, in line with the natural skin crease, approximately 2 cm above the pubic tubercle. The incision was deepened through subcutaneous tissue (Camper's + Scarpa's fascia) to the external oblique aponeurosis.`,
        `The external oblique was incised in the line of its fibers with a #15 blade, with care to identify and PRESERVE the ilioinguinal nerve coursing along the anterior surface of the spermatic cord (sacrifice causes chronic groin pain in 10-15%). The cord was identified and carefully encircled with a Penrose drain at the level of the internal ring — this is the critical anatomic landmark for radical orchiectomy: the cord is cross-clamped HIGH (at the internal ring) to minimise venous embolisation of tumor cells during testis manipulation (DOMINANT oncologic principle of radical orchiectomy distinguishing it from scrotal/transvaginal orchiectomy).`,
        `The cord was clamped at the internal ring with a soft vascular clamp (Penrose/non-crushing) before any manipulation of the testis. The testis was then delivered into the wound by gentle traction on the cord and blunt finger dissection of the gubernaculum at the inferior testicular pole. The scrotal wall was bluntly mobilised to permit testis delivery. The testis was inspected — gross findings (mass size, capsular involvement, paratesticular extension) noted.`,
        `${name.includes("frozen section") ? "If diagnostic uncertainty existed (small lesion, possible benign etiology, fertility preservation desired): frozen section of the lesion was obtained — testis was opened on a separate sterile field with sharp dissection through tunica albuginea, the lesion biopsied with non-crushing technique, and submitted for frozen pathology. Benign lesion (Leydig cell tumor, epidermoid cyst, simple cyst) supports testis-sparing surgery (lesionectomy + tunica closure). Malignant lesion proceeds to radical orchiectomy. " : ""}The cord was systematically dissected and divided in two pedicles at the internal ring level: vascular pedicle (testicular artery + venous plexus) and vasal pedicle (vas deferens + vasal vessels). Each pedicle was doubly ligated with 0 silk on the proximal side (a non-absorbable suture is preferred — permanent radio-opaque marker on the cord stump aids future surveillance imaging and surgical planning for retroperitoneal lymph node dissection if required). The cord was sharply transected and the specimen (testis + entire spermatic cord up to internal ring + tunica vaginalis) removed en bloc.`,
        `The cord stump was tagged with a permanent non-absorbable suture or surgical clip for radiologic identification. Hemostasis was confirmed at the cord stump and within the inguinal canal. ${name.includes("testicular prosthesis") ? "A testicular prosthesis (silicone-filled, sized to the contralateral testis) was placed into the empty hemiscrotum through the inguinal incision: the scrotum was bluntly mobilised, the prosthesis introduced through the inguinal canal, dependent in the scrotum, and secured with 3-0 Vicryl suture to the dartos at the dependent scrotum to prevent migration. Counseled that prosthesis placement is irreversible without further surgery." : "No prosthesis placed (delayed prosthesis placement is an option later if patient desires)."}`,
        `Closure: external oblique aponeurosis re-approximated with running 2-0 Vicryl (avoid suture entrapment of the ilioinguinal nerve — primary cause of chronic groin pain post-orchiectomy). Scarpa's fascia closed with 3-0 Vicryl. Skin closed with 4-0 Monocryl subcuticular running suture. Sterile dressing applied.`,
        `Postoperative pathway: discharge same-day or after observation. Resume normal activity at 1 week, no heavy lifting × 4-6 weeks. Pathology review at 7-10 days — definitive histology (seminoma vs NSGCT — embryonal carcinoma, yolk sac tumor, choriocarcinoma, teratoma; mixed tumor; rare other types — Sertoli cell, Leydig cell, lymphoma in elderly), pT stage, lymphovascular invasion, rete testis invasion. Post-orchiectomy tumor markers at 4-6 weeks (AFP, hCG normalize per t1/2 of 5-7 days for AFP, 1-3 days for hCG; persistent elevation suggests metastatic disease). Multidisciplinary tumor board review for staging + adjuvant therapy planning per AUA + EAU + NCCN guidelines: stage I seminoma (active surveillance preferred over adjuvant carboplatin or paraaortic radiotherapy); stage I NSGCT (active surveillance vs primary RPLND vs BEP × 1 cycle based on risk); stage II/III disease (BEP chemotherapy ± consolidation surgery). Long-term follow-up per AUA — surveillance imaging + tumor markers q3-6 months × 5 years then annually; cure rates for stage I 95-99%, advanced disease 70-90% with combination therapy.`,
      ];
    }
    return [
      `Simple orchiectomy is performed for non-oncologic indications: irreversible testicular ischemia following untwisted testicular torsion + non-viable testis, advanced testicular trauma, end-stage chronic testicular pain refractory to other intervention, or castration for prostate cancer (medical castration with GnRH agonists has largely replaced surgical castration in modern practice but surgical option exists for cost or patient preference reasons). Preoperative counseling emphasised the irreversibility and discussed prosthesis options + sperm cryopreservation if relevant.`,
      `Patient positioning: supine. The genitalia were prepped with chlorhexidine and draped widely. Antibiotic prophylaxis (cefazolin 2 g IV). A transverse scrotal incision was made over the affected hemiscrotum at the level of the lower testis. The dartos was incised. The tunica vaginalis was identified and opened to deliver the testis into the wound. The testis and epididymis were inspected and any abnormality documented.`,
      `The spermatic cord was identified and divided in two pedicles (vascular and vasal). Each pedicle was doubly ligated with 2-0 silk and sharply transected. The testis specimen was removed.`,
      `Hemostasis was confirmed. ${name.includes("testicular prosthesis") ? "A testicular prosthesis was placed in the hemiscrotum and secured with 3-0 Vicryl. " : ""}The dartos was re-approximated with 3-0 Vicryl interrupted. The scrotal skin was closed with 4-0 Vicryl Rapide subcuticular (rapidly absorbing — eliminates need for suture removal). A scrotal supporter was applied.`,
      `Postoperative care: ice + scrotal elevation × 24-48 h. Resume normal activity at 1 week. No heavy lifting × 4 weeks. Counsel regarding: hormonal effects (unilateral orchiectomy preserves contralateral testicular function in 95% — testosterone usually normal; bilateral orchiectomy causes immediate hypogonadism requiring testosterone replacement therapy unless contraindicated by prostate cancer). Common complications: scrotal hematoma 2-5%, infection 1-3%. Long-term: discuss psychosocial implications + body image; testicular prosthesis can be placed delayed if not done at index surgery.`,
    ];
  }

  // -- Hydrocelectomy --------------------------------------------------------
  if (includesAny(name, ["hydrocele", "hydrocelectomy"])) {
    return [
      `Indication: symptomatic hydrocele (size, pain, discomfort, cosmetic concern) refractory to observation. Preoperative workup: scrotal ultrasound confirmed simple hydrocele (anechoic fluid surrounding a normal-appearing testis with no associated mass — hydrocele due to testicular tumor occurs in 5-10% of men presenting with new hydrocele, must be excluded). Communicating hydrocele in pediatric patients is treated by inguinal repair (with patent processus vaginalis ligation), not scrotal hydrocelectomy. Anticoagulation managed; antibiotic prophylaxis (cefazolin 2 g IV).`,
      `Patient positioning: supine. The genitalia and lower abdomen were prepped with chlorhexidine and draped to expose the entire scrotum. A transverse scrotal incision (3-5 cm) was made over the most prominent point of the hydrocele, with the incision carefully placed to lie within natural skin creases for cosmesis. The incision was deepened through the dartos with electrocautery. The dartos was carefully separated from the underlying tunica vaginalis (the parietal layer of the hydrocele sac).`,
      `The hydrocele sac (tunica vaginalis) was identified — recognised by its glistening, fluid-distended surface. It was carefully grasped at the most superior aspect with Allis clamps and delivered into the wound by progressive blunt dissection from the surrounding cord and scrotal attachments. The sac was then opened with a #15 blade or scissors at the most superior aspect, and the hydrocele fluid was suctioned and quantified (typical 100-500 mL of clear straw-coloured fluid; turbid or blood-tinged fluid raises concern for testicular pathology — sample for cytology).`,
      `The testis and epididymis were systematically inspected — both must be inspected to rule out a testicular tumor (the dominant occult finding when a hydrocele is opened, hence the emphasis on preoperative ultrasound). Any concerning finding (intratesticular mass, irregular epididymis, testicular cyst) was documented; if a tumor was found unexpectedly, the surgeon transitioned to oncologic radical orchiectomy through an inguinal incision (do NOT close the testis back into the scrotal incision — risk of tumor seeding).`,
      `Hydrocele technique selected based on sac size + thickness: ${name.includes("jaboulay") || !name.includes("lord") && !name.includes("plication") ? "Jaboulay technique (eversion of the sac — preferred for large or thick-walled sacs): the redundant sac was trimmed (leaving a 1-2 cm cuff at the testis), then the remaining sac was everted behind the testis and the cut edges sutured to themselves with running 3-0 Vicryl. This eliminates the closed cavity and prevents fluid recurrence" : ""}${name.includes("lord") || name.includes("plication") ? "Lord plication (preferred for thin-walled sacs): the sac is plicated by placing 4-6 radial 3-0 Vicryl interrupted sutures around the testis, gathering the sac into a ring around the cord without excising any tissue. Less dissection + less hematoma risk than Jaboulay, but only suitable for thin sacs" : ""}${name.includes("excision") ? "Sac excision (modified): the redundant sac was sharply excised, leaving 1-2 cm cuff at the testis; the cut edges were oversewn with running 3-0 Vicryl for hemostasis" : ""}.`,
      `Hemostasis was meticulously confirmed (the redundant sac is a frequent source of postoperative hematoma — careful attention to small bleeders prevents the most common complication of hydrocelectomy: scrotal hematoma 5-10%). Bipolar cautery on small bleeders, suture-ligation on larger vessels. ${name.includes("drain") ? "A small Penrose drain was placed in the dependent scrotum and brought out through a separate stab incision, removed in 24-48 h." : "Routine drainage was not performed for typical cases; reserved for very large sacs, anticipated oozing bed, or hemostasis concerns."}`,
      `Closure: dartos re-approximated with 3-0 Vicryl interrupted. Scrotal skin closed with 4-0 Vicryl Rapide subcuticular running (rapidly absorbing — no suture removal). A bulky pressure dressing + scrotal supporter were applied to prevent hematoma formation. Discharge home same-day.`,
      `Postoperative pathway: ice + scrotal elevation × 48 h. Continue scrotal supporter × 1-2 weeks. NSAIDs/acetaminophen for pain. Resume normal activity at 1 week, no heavy lifting / sexual activity × 4 weeks. Common complications: scrotal hematoma 5-10% (most resolve spontaneously; large or expanding hematoma may require evacuation), infection 1-3%, recurrence 3-5% (more common with Lord plication for thick sacs vs Jaboulay), persistent post-op edema common × 4-6 weeks before final cosmesis. Long-term outcomes: > 95% durable resolution.`,
    ];
  }

  // -- Nephroureterectomy ----------------------------------------------------
  if (includesAny(name, ["nephroureterectomy"])) {
    return [
      `The patient was positioned for a two-position approach: initial modified lateral flank position with a 30-45° tilt for the upper tract dissection, then repositioned to dorsal supine for the bladder cuff excision. Alternatively, single-position approaches (full lateral or dorsal supine) with robotic platform are gaining favor. The kidney bridge was elevated and the operative table flexed at the costo-iliac angle. All pressure points were padded carefully (axillary roll, padding under knees and ankles). The abdomen was prepped from xiphoid to mid-thigh, including the contralateral side for potential repositioning.`,
      `${c.surgicalApproach === "OPEN" ? "An open thoracoabdominal incision was made through the 10th or 11th interspace, with extension to the iliac fossa as needed. The retroperitoneum was entered." : "Pneumoperitoneum was established via Veress needle or Hasson technique at the umbilicus. Five ports were placed for robotic technique: 12 mm camera port at the umbilicus, 8 mm robotic ports at the right paramedian and right lateral abdomen (cephalad and caudad to the umbilicus), 8 mm robotic third arm port, and a 12 mm assistant port. The DaVinci Xi system was docked and aligned to the kidney long axis."} The colon was reflected medially along the white line of Toldt to expose the retroperitoneum.`,
      `The kidney and surrounding Gerota's fascia were mobilised circumferentially, with care taken not to violate Gerota's fascia (preserving the oncologic envelope around the upper-tract tumor). The renal hilum was approached: the renal artery was identified, skeletonised, isolated, and ligated/divided with a vascular stapler (typically EndoGIA 60 mm with white load) or three large clips, followed by the renal vein with a similar vascular stapler. The kidney was completely mobilised within Gerota's fascia.`,
      `The ureter was followed distally toward the bladder, identifying and protecting the gonadal vessels and the contralateral ureter. Periureteric tissue was preserved en bloc with the ureter to avoid tumor seeding. The ureter was traced to the level of the ureterovesical junction (UVJ).`,
      `For the bladder cuff excision: ${name.includes("intussusception") ? "an intussusception (pluck) technique was used: the ureter was pulled into the bladder transurethrally and a bladder cuff excised endoscopically." : name.includes("transurethral") ? "a transurethral pre-cut technique was used: under cystoscopy, a circumferential incision was made around the ipsilateral ureteric orifice with a Collins knife, excising a bladder cuff. " : "an open extravesical technique was used (oncologically preferred): a Pfannenstiel or lower midline incision was made, the bladder was distended via the pre-placed Foley, and the dome and ipsilateral wall were exposed. The retroperitoneum was entered laterally, the ureter was traced down to the UVJ, and a circumferential bladder cuff approximately 1 cm of bladder mucosa around the ureteric orifice was excised with electrocautery or a stapler."}`,
      `The specimen (kidney + Gerota's fascia + entire ureter + bladder cuff en bloc) was removed without violating the oncologic envelope, placed in an Endo Catch bag for laparoscopic/robotic cases, and extracted through the assistant port site or a separate Pfannenstiel extraction incision. The bladder defect was closed in two layers: inner running 3-0 Vicryl on the mucosa, outer interrupted 2-0 Vicryl on the detrusor, ensuring water-tightness confirmed by gentle bladder filling with 250 mL of saline.`,
      `A pelvic 15 Fr Blake drain was placed in the perivesical space and brought out through a separate stab incision. The retroperitoneum was inspected and hemostatic. ${c.surgicalApproach === "OPEN" ? "Closure was performed in standard fashion: muscle layers approximated with 0 Vicryl interrupted, fascia with running 1 PDS or Vicryl, subcutaneous tissue with 3-0 Vicryl, skin with 4-0 Monocryl subcuticular." : "Pneumoperitoneum was released. Robotic ports removed under direct vision. The 12 mm port sites were closed with 0 Vicryl figure-of-eight. Skin closed with 4-0 Monocryl subcuticular."}`,
      `The Foley was retained for 7-10 days postoperatively to allow bladder cuff healing without distension. A cystogram or KUB was obtained on POD 7 to confirm no extravasation before Foley removal. The drain was removed when output was < 30 mL/day. Surveillance per upper-tract urothelial-carcinoma guidelines (NCCN/EAU) was instituted: cystoscopy + urine cytology + cross-sectional imaging at 3-month intervals for the first 2 years, with consideration of single-dose intravesical chemotherapy (mitomycin C) within 24 hours of catheter removal to reduce bladder recurrence risk (the ODMIT-C / POUT trial evidence).`,
    ];
  }

  // -- Adrenalectomy ---------------------------------------------------------
  if (includesAny(name, ["adrenalectomy"])) {
    const isPosterior = name.includes("posterior") || name.includes("retroperitoneal");
    return [
      `Preoperative workup was reviewed: dedicated adrenal-protocol CT or MRI characterised the lesion (size, Hounsfield units < 10 for benign adenoma, washout characteristics — > 60% absolute or > 40% relative washout at 15 minutes favours adenoma); biochemical workup included plasma metanephrines (pheochromocytoma), aldosterone-renin ratio (Conn syndrome), low-dose dexamethasone suppression test (Cushing syndrome), and DHEA-S/testosterone (androgen-secreting tumor). For confirmed pheochromocytoma, alpha-blockade was instituted 7-14 days preoperatively (phenoxybenzamine 10 mg PO BID titrated, with beta-blockade added only after adequate alpha-blockade). The patient was positioned ${isPosterior ? "in the prone jack-knife position with the operative side at 90° table-flexion (Walz technique for posterior retroperitoneoscopic approach), with the costal margin at the table break" : "in modified flank position at 60-90° with the operative side up, kidney bridge elevated, table flexed at the costo-iliac angle"}; all pressure points were padded carefully (axillary roll, padding under knees, ankles, and dependent arm). The abdomen was prepped from xiphoid to mid-thigh.`,
      `${isPosterior ? "For the posterior retroperitoneoscopic approach (Walz): a 1.5 cm incision was made just below the tip of the 12th rib. The retroperitoneal space was entered bluntly with the surgeon's finger, balloon dissection was performed, and the working space was developed with CO2 insufflation to 20-25 mmHg (higher than transabdominal to compress retroperitoneal veins and minimize bleeding). Three ports were placed: 12 mm camera at the original incision, 5 mm working port medially below the costal margin, 5 mm port laterally above the iliac crest." : c.surgicalApproach === "OPEN" ? "An open subcostal or thoracoabdominal incision was made on the affected side. The peritoneal cavity was entered." : "Pneumoperitoneum was established via Veress needle or Hasson technique at the umbilicus. Four ports were placed for transabdominal laparoscopic / robotic technique: 12 mm camera port lateral to the umbilicus on the operative side, two 8 mm robotic ports along the costal margin (cephalad and caudad to camera), 8 mm robotic third arm laterally, and 12 mm assistant port. The DaVinci Xi was docked aligned to the renal long axis."}`,
      `For a right adrenal: the right triangular ligament was incised and the liver retracted superiorly with a fan retractor or self-retaining retractor (Nathanson). The IVC was identified — the critical landmark for right adrenalectomy. The peritoneum was incised along the lateral edge of the IVC and the adrenal gland was approached from medial to lateral. The short, fragile right adrenal vein (typically 0.5-1.0 cm in length) was identified entering the IVC directly on its right posterolateral aspect; this vein was carefully skeletonised, clipped with two Hem-o-lok clips on the IVC side and one clip on the specimen side, then divided sharply with cold scissors (avoid energy at the IVC junction to prevent thermal injury and delayed bleeding).`,
      `For a left adrenal: the splenocolic and lienorenal ligaments were taken down (the spleen, splenic flexure, and pancreatic tail were rotated medially en bloc, exposing the retroperitoneum and the upper pole of the kidney). The renal hilum was identified, with the left renal vein traced laterally. The left adrenal vein was identified entering the superior aspect of the left renal vein (typically 1-3 cm in length, longer than the right), skeletonised, doubly clipped on the renal vein side, and divided. The inferior phrenic vein (which often shares a common trunk with the left adrenal vein) was identified and preserved or ligated as necessary.`,
      `With the central adrenal vein controlled, the adrenal gland was mobilised circumferentially within the perirenal fat. Small arterial branches from the inferior phrenic artery (superiorly), the aorta (medially), and the renal artery (inferiorly) were systematically controlled with bipolar energy (LigaSure or harmonic scalpel) or clipped, taking the dissection as a peri-adrenal fat-bearing envelope to avoid violating the gland capsule (essential for malignant lesions to prevent intraoperative seeding). For pheochromocytoma cases, communication with anesthesia was maintained throughout — hypertensive surges were anticipated during gland manipulation (treated with sodium nitroprusside or phentolamine boluses) and hypotension after adrenal vein ligation was anticipated (treated with volume + vasopressors as the catecholamine surge ceased).`,
      `The fully mobilised gland was placed in a 10 mm Endo Catch retrieval bag. The specimen was extracted through the camera port (extended as needed for larger tumors > 5 cm) or through a separate Pfannenstiel extraction incision for very large or oncologically-suspicious lesions. The bed was thoroughly inspected for hemostasis (with insufflation pressure briefly reduced to 8-10 mmHg to identify any low-pressure bleeding masked by elevated pneumoperitoneum). A 15 Fr Blake drain was placed only for oozing beds, very large tumors, or pheochromocytomas; routine drainage was not required for small adenomas.`,
      `${c.surgicalApproach === "OPEN" ? "The peritoneum and abdominal wall were closed in standard fashion." : "Ports were removed under direct vision; 12 mm fascia closed with 0 Vicryl figure-of-eight; skin with 4-0 Monocryl subcuticular."} The patient was extubated and transferred to PACU. For pheochromocytoma cases, the patient was monitored in a step-down or ICU bed for 24 hours due to risk of postoperative hypotension (catecholamine surge cessation) and hypoglycemia (rebound insulin secretion); hydrocortisone replacement was given for bilateral adrenalectomy or for unilateral adrenalectomy in known Cushing syndrome (hypothalamic-pituitary-adrenal axis suppression with risk of postoperative adrenal insufficiency for 6-12 months requires daily hydrocortisone with tapering schedule). Pathology was reviewed at 7-10 days; postoperative biochemical re-assessment confirmed cure for functional tumors at 2-4 weeks.`,
    ];
  }

  // -- Pyeloplasty -----------------------------------------------------------
  if (includesAny(name, ["pyeloplasty"])) {
    const isLap = c.surgicalApproach === "LAPAROSCOPIC" || c.surgicalApproach === "ROBOTIC";
    return [
      `The patient was positioned in modified flank with the operative side up at 45–60° using a vacuum bean bag, with the kidney bridge elevated and an axillary roll placed. All pressure points were padded carefully. ${isLap ? "For the robotic / laparoscopic approach: the patient was secured to the table to permit table tilt during ureteroureteric anastomosis. A nasogastric tube and Foley were placed by anesthesia. The abdomen was prepped from xiphoid to mid-thigh." : "For the open approach via a flank or anterior subcostal incision: the kidney rest was elevated and the table flexed to widen the costo-iliac angle and improve access to the retroperitoneum."} Time-out was performed.`,
      `${isLap ? "Pneumoperitoneum was established via Veress needle or Hasson technique at the umbilicus. Four ports were placed: 12 mm camera port at the umbilicus, 8 mm robotic ports at the lateral border of the rectus muscle (cephalad and caudad to the umbilicus), 8 mm robotic third-arm port in the lateral abdomen, and a 12 mm assistant port. The DaVinci Xi system was docked and the camera arm aligned along the kidney long axis." : "A flank incision was made between the 11th and 12th ribs (or anterior subcostal for an anterior approach). The latissimus dorsi and external oblique were divided in line with their fibres. The internal oblique and transversus abdominis were split. The Gerota's fascia was identified and entered."}`,
      `The colon was reflected medially along the white line of Toldt to expose the retroperitoneum. The renal hilum was identified, with the renal artery and vein noted. The dilated renal pelvis was identified and the proximal ureter traced distally to the ureteropelvic junction (UPJ). The UPJ obstruction was characterised: intrinsic stenosis, extrinsic compression by a crossing vessel (lower-pole accessory artery in 30-40% of cases — Friedland's classic anatomic study), or high insertion of the ureter on the pelvis.`,
      `The redundant renal pelvis was mobilised and any crossing lower-pole vessel was identified, mobilised, and preserved (it would later be transposed posterior to the anastomosis if pyeloplasty was performed). The UPJ was sharply transected. The redundant pelvis was excised, leaving sufficient pelvis for a tension-free anastomosis. The proximal ureter was spatulated laterally for approximately 1.5 cm using fine Stevens scissors, providing a wide ureteric mouth for the anastomosis.`,
      `An Anderson-Hynes dismembered pyeloplasty was performed: the spatulated ureter was anastomosed to the most dependent point of the renal pelvis using 4-0 Monocryl interrupted sutures (or running 4-0 V-Loc barbed suture for laparoscopic technique). The posterior anastomosis was completed first, then a 6 Fr × 26 cm double-J ureteric stent was placed antegrade across the anastomosis with the proximal coil in the upper pole calyx and distal coil verified by pre-placed cystoscopic technique. The anterior anastomosis was then completed. The stent was confirmed in good position. ${name.includes("crossing vessel") ? "The crossing lower-pole vessel was transposed posterior to the anastomosis to prevent recurrent obstruction (Hellström maneuver)." : ""}`,
      `Once the anastomosis was completed, a leak test was performed by gentle saline injection into the renal pelvis through a small angiocatheter — no extravasation was confirmed. The renal pelvis fat was redraped over the anastomosis. A 15 Fr Blake drain was placed in the perinephric space, brought out through a separate stab incision, and secured. ${isLap ? "The robot was undocked. Pneumoperitoneum was released, ports were removed under direct vision. Fascial closure of the 12 mm port sites with 0 Vicryl. Skin closed with 4-0 Monocryl subcuticular." : "Closure was performed in standard fashion: muscle layers approximated with 0 Vicryl interrupted, fascia with running 1 PDS, subcutaneous tissue with 3-0 Vicryl, skin with 4-0 Monocryl subcuticular."}`,
      `The patient was returned to the post-anesthesia care unit. The Foley was retained for 24-48 hours. The drain was removed when output was < 30 mL/day (typically POD 1-2). The ureteric stent was retained for 4-6 weeks and removed in clinic via flexible cystoscopy. A renal MAG3 diuretic renogram was scheduled at 3 months postoperatively to confirm functional improvement (T1/2 < 10 min indicates successful drainage; the standard for surgical success).`,
    ];
  }

  // -- Ureteroneocystostomy --------------------------------------------------
  if (includesAny(name, ["ureteroneocystostomy", "ureteric reimplant", "ureteral reimplant"])) {
    return [
      `The patient was positioned supine with appropriate padding. The abdomen was prepped from xiphoid to mid-thigh and draped to allow access to the entire abdomen and the femoral region for potential leg adjustments. A 16 Fr Foley was placed and connected to drainage. The indication for reimplantation was confirmed: distal ureteric stricture (most common — iatrogenic from gynecologic surgery, or from radiation), vesicoureteric reflux requiring surgical management, distal ureteric injury, congenital UVJ obstruction, or distal ureteric tumor.`,
      `${c.surgicalApproach === "OPEN" ? "A Pfannenstiel or lower midline incision was made and carried down into the peritoneal cavity. The bladder was identified and the peritoneum overlying the affected ureter was incised lateral to the bladder." : "Pneumoperitoneum was established and four ports placed for laparoscopic / robotic technique: 12 mm camera port at umbilicus, 8 mm robotic ports at right paramedian and left paramedian, 8 mm robotic third arm, and 12 mm assistant port. The DaVinci Xi was docked."} The bladder was identified and partially mobilised by dividing the medial umbilical ligament and the lateral peritoneal attachments.`,
      `The affected ureter was identified and traced from healthy proximal bowel to its distal diseased segment. The ureter was carefully dissected free, preserving the periureteric blood supply and adventitia (the ureter is fragile and depends on segmental adventitial blood supply — handle by the periureteric fat, not the ureter itself, to maintain vascularity). The diseased distal segment was excised back to healthy, well-vascularized ureter. The proximal end was spatulated longitudinally for 1.5 cm using fine Stevens scissors to widen the lumen for anastomosis.`,
      `Length to reach the bladder without tension was assessed. If the spatulated end could not reach the bladder dome without tension, a psoas hitch was performed: the contralateral bladder dome was mobilised by dividing the contralateral medial umbilical ligament, and the ipsilateral bladder dome was elevated and secured to the ipsilateral psoas tendon with 2-3 interrupted 0 Vicryl sutures placed parallel to the psoas fibres (not perpendicular, to avoid genitofemoral nerve entrapment which courses on the surface of the psoas). This added 4-6 cm of effective length.`,
      `If the psoas hitch alone was inadequate, a Boari flap was raised: a U-shaped or trapezoidal flap was developed from the anterolateral bladder wall, with the base 2-3 cm wide at the bladder dome (preserving inferior vesical and superior vesical arterial supply) and tapering distally. The flap was tubularised over a 16 Fr catheter with interrupted 3-0 Vicryl, providing 8-12 cm of additional length.`,
      `The new bladder site for the ureter was selected. An anti-reflux submucosal tunnel was created using the Lich-Gregoir extravesical technique: the bladder muscle was incised longitudinally for 3-5 cm without entering the mucosa, the mucosa was elevated to create a submucosal bed, and the ureter was placed in this bed. The ureter was then anastomosed end-to-side to the bladder mucosa via a small mucosal opening at the distal end of the tunnel, with interrupted 4-0 Vicryl sutures placed circumferentially around the spatulated end. A 6 Fr × 26 cm double-J ureteric stent was placed across the anastomosis with the proximal coil in the renal pelvis (confirmed by stent length and intraoperative cystoscopy if needed) and the distal coil in the bladder.`,
      `The detrusor muscle was re-approximated over the tunneled ureter with interrupted 3-0 Vicryl, completing the anti-reflux mechanism (4:1 tunnel-length-to-ureter-diameter ratio is the classical Paquin criterion to prevent reflux). The bladder closure was tested for water-tightness with 250 mL of saline filling, and any small leaks were repaired with 3-0 Vicryl. A 16 Fr Foley was left in place.`,
      `A 15 Fr Blake drain was placed in the perivesical space and brought out through a separate stab incision. ${c.surgicalApproach === "OPEN" ? "Wound closure was performed in standard fashion." : "Robotic ports were removed, fascia closed at 12 mm sites with 0 Vicryl figure-of-eight, skin with 4-0 Monocryl subcuticular."} The Foley was retained for 7 days. The ureteric stent was removed in clinic at 4-6 weeks via flexible cystoscopy. A renal ultrasound at 1 month assessed for hydronephrosis (resolution indicates successful repair). Long-term follow-up included MAG3 renogram at 6-12 months for functional assessment.`,
    ];
  }

  // -- Urethroplasty ---------------------------------------------------------
  if (includesAny(name, ["urethroplasty"])) {
    return [
      `The patient was positioned in dorsal lithotomy with the legs in candy-cane stirrups, ensuring no pressure on the lateral peroneal nerves at the fibular head. The perineum and lower abdomen were prepped with chlorhexidine and draped to expose the entire surgical field. A 16 Fr silicone Foley catheter was advanced gently to the level of the stricture (it would not pass beyond) — this confirmed the stricture location and permitted bladder drainage. Antibiotic prophylaxis (per culture-directed regimen if positive urine culture, or empiric broad-spectrum) was administered.`,
      `Preoperative urethrography (RUG and VCUG) was reviewed in the OR to confirm stricture length, location, and density. The stricture was characterised: bulbar (most common, 80% of strictures and the most amenable to repair), pendulous, panurethral (involving multiple segments), or stricture of the membranous urethra (post-prostatectomy or post-radiation, with high failure rates). The repair technique was selected: excision and primary anastomosis (EPA) for short bulbar strictures < 2 cm; substitution urethroplasty (graft or flap) for longer strictures.`,
      `A vertical perineal incision was made over the bulbar urethra (or over the strictured segment for pendulous strictures, with circumcising or penile-shaft incision). The incision was deepened through the subcutaneous tissue and the central tendon of the perineum was identified. The bulbocavernosus (bulbospongiosus) muscle was split in the midline using sharp dissection with a #15 blade, with the muscle preserved for later coverage of the repair. The corpus spongiosum was identified, and the bulbar urethra was sharply dissected circumferentially around the strictured segment, with proximal and distal margins identified by passing a 16 Fr silicone bougie from above and below.`,
      `${name.includes("epa") || name.includes("excision") || name.includes("anastomotic") ? "Excision and primary anastomosis (EPA) was performed for the short bulbar stricture: the strictured segment was sharply excised back to healthy spongiosal margins on each side, confirmed by passing a 24 Fr or 26 Fr bougie. The proximal and distal urethral ends were each spatulated longitudinally for 1 cm to maximize the anastomotic circumference. A tension-free, watertight end-to-end anastomosis was created with 12-16 interrupted 5-0 Monocryl sutures placed circumferentially around a 16 Fr silicone catheter, ensuring mucosa-to-mucosa apposition." : "Substitution urethroplasty with buccal mucosa graft was performed for the longer stricture (Barbagli or Kulkarni technique): a buccal mucosa graft was harvested from the right or left inner cheek, with attention to avoiding Stensen's papilla (parotid duct opening). A 'Steven's stitch' was placed at one end of the graft for orientation. The graft was harvested at 5-7 cm length and 1.5-2 cm width, defatted on the back table by sharp removal of submucosal tissue with Stevens scissors, and kept moist in saline. The strictured urethra was opened longitudinally over the entire stricture length (dorsal urethrotomy for the dorsal-onlay technique, ventral urethrotomy for the ventral-onlay technique). The graft was quilted onto the dorsal corpora cavernosa exposed by mobilising the spongiosum dorsally (Asopa technique), or laid as a ventral onlay reinforced by spongiosum, with 5-0 Vicryl interrupted sutures securing the graft to surrounding urethral mucosa. The 16 Fr silicone catheter was placed across the repair."}`,
      `A retrograde injection of saline (or methylene blue solution) into the urethra distal to the repair confirmed water-tightness without extravasation. Hemostasis was meticulously achieved with bipolar cautery. The bulbocavernosus muscle was re-approximated over the repair with interrupted 3-0 Vicryl, providing a vascularised second layer to support the urethral closure and reduce fistula risk.`,
      `The perineal wound was closed in layers: subcutaneous tissue with 3-0 Vicryl interrupted, dermis with 4-0 Monocryl, skin with 4-0 Monocryl subcuticular running suture. A pressure dressing was applied. The Foley catheter was retained for 3 weeks postoperatively (the standard urethroplasty protocol), with a pericatheter retrograde urethrogram performed at 3 weeks to confirm absence of extravasation before catheter removal. The patient was educated regarding scrotal/perineal swelling expectations, return precautions for sudden onset of urethral bleeding or signs of infection, and timing of long-term follow-up uroflowmetry at 3, 6, and 12 months to assess functional outcome.`,
    ];
  }

  // -- Hypospadias repair ----------------------------------------------------
  if (includesAny(name, ["hypospadias"])) {
    return [
      `The pediatric patient was positioned supine on a warming blanket with the genitalia exposed. After induction of general anesthesia, a caudal block was placed for postoperative analgesia. The lower abdomen, genitalia, and upper thighs were prepped with chlorhexidine and draped to provide a small but adequate operative field. A holding 4-0 Prolene stitch was placed transversely through the glans (avoiding the urethra) for atraumatic traction throughout the procedure. The patient's hypospadias was classified by meatal location: glanular, coronal, distal-shaft, mid-shaft, proximal-shaft, penoscrotal, or perineal — the location dictates the repair technique.`,
      `An artificial erection with saline injected into the corpora via a 25-gauge needle at the dorsal penis was performed to assess the degree of ventral chordee (curvature). Mild chordee (< 30°) was confirmed without need for corporotomy. Severe chordee (> 30°) would have required dorsal Nesbit plication, ventral corporotomy with grafting, or staged repair. The native meatus was identified, sized, and the quality of the urethral plate distal to the meatus assessed for tubularisation potential.`,
      `A subcoronal circumferential incision was made distal to the corona. The penile shaft was degloved by sharp and blunt dissection in the avascular plane between Buck's fascia and the dartos to the level of the penopubic junction, providing exposure of the entire shaft. Any tethering ventral skin was released. A second artificial erection confirmed correction of any superficial chordee from skin tethering alone.`,
      `For distal hypospadias with a robust urethral plate (the most common indication, ~70% of cases): a Snodgrass tubularised incised plate (TIP) urethroplasty was performed. Two parallel longitudinal incisions were marked alongside the urethral plate, defining the lateral edges of the tubularised neourethra. A central relaxing incision was made down the midline of the urethral plate using a #15 blade, splitting the plate without crossing into the deeper spongiosum — this widens the plate to permit tension-free tubularisation. The plate was tubularised over a 6 or 8 Fr feeding tube stent using running 7-0 Monocryl in two layers (mucosa and outer dartos).`,
      `For proximal hypospadias or hypospadias with poor plate quality requiring substitution urethroplasty: a buccal mucosa graft (BMG) was harvested from the inner cheek (avoiding Stensen's papilla) and used as a single-stage onlay graft, or a two-stage repair was elected (first stage: chordee correction + BMG placement; second stage: tubularisation 6 months later). Other techniques included Mathieu flap (for distal hypospadias), Duckett tubularised preputial flap, or Onlay Island Flap.`,
      `A vascularised dartos flap was harvested from the dorsal preputial skin (Whitten technique): the dartos pedicle was developed by separating dartos from skin, with the pedicle based superiorly. The flap was buttonholed through a small opening, rotated ventrally, and inset over the neourethra as a watertight second layer with interrupted 6-0 Vicryl — this critical second layer reduces the fistula rate from 15-20% to < 5%.`,
      `The glans wings were rotated medially over the neourethra and approximated in two layers (deep dartos and superficial dermis) with 6-0 Vicryl interrupted sutures, recreating a conical glans with a slit-shaped neomeatus at the tip. The penile shaft skin was redraped, with excess preputial skin trimmed. The skin was closed with interrupted 6-0 chromic suture circumferentially. A petrolatum-gauze dressing and a Tegaderm pressure dressing were applied with the urethral stent exiting through a small opening, secured to a cap on the dressing for drainage. The patient was discharged home with the stent for 7-10 days; sponge baths only until stent removal in clinic.`,
    ];
  }

  // -- Mid-urethral sling ----------------------------------------------------
  if (includesAny(name, ["mid-urethral sling", "tvt", "tot", "transobturator"])) {
    const isTVT = includesAny(name, ["tvt", "retropubic"]);
    return [
      `The patient was placed in dorsal lithotomy with the legs in candy-cane stirrups, ensuring no pressure on the lateral peroneal nerves at the fibular head. The bladder was emptied with a straight catheter. The vagina, perineum, and ${isTVT ? "lower abdomen up to the umbilicus" : "medial thighs to the genitofemoral folds"} were prepped with chlorhexidine and draped to expose the entire surgical field. Antibiotic prophylaxis (cefazolin 2 g IV) was administered within 60 minutes of incision. A 16 Fr Foley was placed and the bladder drained completely — empty bladder is critical for ${isTVT ? "retropubic" : "transobturator"} sling placement to prevent bladder injury.`,
      `An incision in the anterior vaginal wall was marked over the mid-urethra (approximately 1 cm distal to the bladder neck — palpated as the proximal extent of the Foley balloon when retracted). The mark was approximately 1.5 cm long and centered on the mid-urethra. The vaginal mucosa was infiltrated with 10 mL of 0.5% bupivacaine with epinephrine submucosally and into the periurethral tissues for hydrodissection and hemostasis. A 5-minute pause was observed for vasoconstrictive effect.`,
      `The vaginal mucosa was incised sharply with a #15 blade. The vaginal wall was elevated off the underlying periurethral fascia using sharp tenotomy scissors, creating a plane in the avascular space between the vaginal mucosa and the periurethral fascia. Bilateral periurethral tunnels were developed with curved Metzenbaum scissors directed ${isTVT ? "cephalad and lateral toward the ipsilateral pubic ramus, hugging the back of the symphysis to enter the retropubic space (Cave of Retzius)" : "laterally toward the ischiopubic ramus to enter the obturator foramen between the obturator membrane and the obturator internus muscle"}. Tunnels were 2-3 cm in length and just deep enough to permit safe trocar passage.`,
      `${isTVT ? "Two small (5 mm) suprapubic stab incisions were made bilaterally just above the pubic symphysis, approximately 2 fingerbreadths lateral to the midline. The TVT helical trocars (Gynecare TVT or equivalent) were passed from the vaginal incision through the retropubic space and out through the suprapubic stab incisions in a controlled fashion, hugging the back of the symphysis pubis at all times to avoid bladder injury. After trocar passage on each side, but before pulling the sling through, cystoscopy was performed using a 70-degree lens — this is the critical safety step. The bladder was systematically inspected with attention to the lateral walls (where TVT trocars course): no perforation was seen and bilateral ureteric jets were visualised confirming ureteric integrity. If perforation had been seen, the trocar would have been withdrawn and re-passed in the correct plane." : "Two small stab incisions were made at the level of the genitofemoral folds bilaterally, approximately 2 cm lateral to the labial fold and at the level of the clitoris. The TOT helical trocars (Monarc, ARC, or equivalent) were passed outside-in from the thigh stab incisions through the obturator foramen, with the surgeon's index finger placed in the periurethral tunnel from the vaginal incision to guide the trocar tip safely past the urethra into the vaginal field. After trocar passage on each side, cystoscopy was performed (although ureteric/bladder injury is rare with TOT, it is not zero). No perforation was seen."}`,
      `The polypropylene mesh sling (Prolene Soft, monofilament, large-pore type 1 mesh per Amid classification — chosen for low infection risk) was attached to the trocar tips and pulled through to lie flat under the mid-urethra without tension. The plastic sheath covering the mesh was retained at this point. With the sheath still in place, the mesh was tensioned: a curved Mayo scissor or 8 Fr Hegar dilator was placed between the mesh and the urethra to set the appropriate tension — the sling should be flat against the urethra with no compression at rest, allowing the instrument to pass freely. ${isTVT ? "Cough stress test was performed (in awake or lightly sedated patients) and tension was adjusted to achieve continence with minimal urethral compression." : "Tension was set conservatively to avoid postoperative voiding dysfunction — TOT slings tend to cause less obstruction than TVT, but obstruction is the most common complication."}`,
      `Once tension was finalized, the plastic sheaths were removed. The mesh trocar arms were trimmed flush with the skin at each external exit point. The vaginal incision was closed with running 2-0 Vicryl in a single layer, ensuring no mesh exposure. The suprapubic / thigh stab incisions were closed with Steri-strips (or 5-0 nylon if hemostasis required). A vaginal pack with petroleum gauze was placed for 24 hours. The Foley was retained for 24 hours.`,
      `The patient was returned to the recovery area. Voiding trial was performed prior to discharge: the Foley was removed, the patient was instructed to void, and post-void residual was checked by bladder scan. PVR > 100-150 mL or inability to void warranted Foley re-insertion and clean intermittent self-catheterization teaching, with weekly voiding trials until successful — this occurs in 5-10% of patients postoperatively. The patient was instructed regarding pelvic rest × 6 weeks (no intercourse, no tampons, no heavy lifting), with follow-up at 2 weeks for vaginal exam and 6 weeks for outcome assessment.`,
    ];
  }

  // -- AUS -------------------------------------------------------------------
  if (includesAny(name, ["artificial urinary sphincter", "aus"])) {
    return [
      `The patient was positioned in dorsal lithotomy with the legs in candy-cane stirrups, allowing simultaneous access to the perineum and lower abdomen. The perineum, scrotum, and lower abdomen were prepped with chlorhexidine and draped to expose the entire surgical field. Antibiotic prophylaxis (vancomycin + gentamicin, given prosthetic implant) was administered within 60 minutes of incision. The bladder was emptied via a 16 Fr Foley catheter, which was retained for the procedure to facilitate identification of the urethra.`,
      `A 4-5 cm vertical perineal incision was made in the midline, centered approximately 2 cm anterior to the anus. The incision was deepened through subcutaneous tissue and the central tendon of the perineum was identified. The bulbocavernosus (bulbospongiosus) muscle was identified and split in the midline, exposing the underlying corpus spongiosum and bulbar urethra. The urethra was sharply dissected circumferentially from the surrounding corpus spongiosum over a 2-3 cm segment in the proximal bulbar urethra (this site selected for optimal cuff function — sufficient distance from the membranous urethra to avoid sphincteric mechanism, sufficient cuff coverage of the urethra).`,
      `The urethra was sized circumferentially using the AMS sizing tape (or Boston Scientific equivalent for the AUS 800 or AdVance series). The minimum sizing was determined by snug but non-compressive contact. A cuff one size larger than the smallest comfortable measurement was selected — typically 4.0 cm or 4.5 cm in adults — to avoid urethral atrophy (the most common cause of AUS failure at 5+ years). The cuff was placed around the bulbar urethra in the prepared cuff bed and locked in position.`,
      `Through a small (3-4 cm) Pfannenstiel incision two fingerbreadths above the pubic symphysis, the prevesical (Retzius) space was developed. The pressure-regulating balloon (PRB) was placed in this space. The PRB pressure (cm H2O) was selected based on the patient's intra-abdominal pressure: 51-60 cm H2O for typical patients, 61-70 cm H2O for obese or active patients, lower (41-50) for patients with bladder dysfunction or radiation. Higher pressures provide better continence but greater urethral atrophy risk.`,
      `The control pump was placed through the Pfannenstiel incision into a dependent scrotal pouch (or labia majora in females), in a position that the patient could reliably reach and operate. The tubing from the cuff, balloon, and pump was prepared. All air was evacuated from the connections by submerging the components in sterile saline and using vacuum technique to fill the system.`,
      `Tubing was connected using the AMS quick-connector pieces, with each connection submerged in saline to avoid air entry. The device was activated and tested intraoperatively: the cuff cycle (deflation when the pump was depressed, slow refill over 60-90 seconds) was confirmed at three test cycles. The system was then deactivated by depressing the deactivation button on the pump — this would prevent the patient from cycling the device for the 6 weeks needed for tissue healing around the cuff before activation.`,
      `Hemostasis was confirmed at all three sites (perineum, prevesical space, scrotum). The bulbocavernosus muscle was approximated over the cuff with 2-0 Vicryl interrupted to provide soft tissue coverage. Closure was performed in layers: subcutaneous with 3-0 Vicryl, dermis with 4-0 Monocryl, skin with 4-0 Monocryl subcuticular. The Foley was retained for 24 hours. The patient was instructed regarding device deactivation × 6 weeks, return at 6 weeks for activation in clinic, and lifetime expectations including possible revision surgery (5-year reoperation rate ~25% for cuff atrophy or device malfunction).`,
    ];
  }

  // -- Sacral neuromodulation (Stage 1 + Stage 2) ----------------------------
  if (includesAny(name, ["sacral neuromodulation", "interstim", "snm"])) {
    return [
      `The patient was positioned prone on the operating table with two firm chest rolls (one under the upper chest, one under the iliac crests) to allow the abdomen to hang free and minimize lordosis (which would close the sacral foramina). The face was supported in a prone pillow with neutral cervical alignment. The lower back, sacrum, and bilateral buttocks were prepped with chlorhexidine and draped widely to expose the sacrum from L5 to the gluteal cleft, including both buttocks for IPG pocket access. Surface anatomy landmarks were identified: the sciatic notch (S2 level), the iliac crests (L4-5 level), the sacral hiatus, and the midline. A grounding pad for stimulation was placed on the upper back.`,
      `STAGE 1 (lead placement / staged trial — InterStim II Medtronic, or Axonics rechargeable system): The S3 foramen was localised using the cross-table fluoroscopic technique — the C-arm was positioned for true lateral imaging of the sacrum, and the level of the medial edge of the sciatic notch corresponded to S3 (the target foramen, which provides the most reliable bladder-and-pelvic-floor innervation via the pelvic splanchnic nerves). The skin entry point was marked 2 cm lateral to the midline at the S3 level (approximately 9-11 cm cephalad to the tip of the coccyx, just above the upper edge of the sciatic notch). A 1% lidocaine subcutaneous infiltration was placed at the entry point.`,
      `A 16-gauge × 9 cm insulated foramen needle (Medtronic 041828) was advanced through the skin at a 60° caudal angle (parallel to the sacral plate, perpendicular to the curve of the sacrum), under intermittent fluoroscopic AP and lateral guidance to confirm trajectory. The needle was advanced through the dorsal sacral plate and into the S3 foramen, with the tip positioned just at the ventral cortex (not penetrated). Test stimulation was applied through the foramen needle using the external test stimulator at 0.5-2 V. Characteristic S3 motor response was elicited and confirmed: bellows-like contraction of the perineal levator ani (visible as inward retraction of the anus) and ipsilateral plantarflexion of the great toe (great-toe flexion alone, not the smaller toes — confirming S3 rather than S2 stimulation).`,
      `Sensory response was also confirmed in awake patients (vibration or pulling sensation in the rectum, vagina, or scrotum at threshold). Threshold was documented at < 2 V for low-amplitude motor + sensory response — confirming optimal lead position. A guidewire was inserted through the needle and the needle was removed. A dilator-introducer assembly was passed over the wire and into the foramen, then the dilator was removed leaving the sheath in place.`,
      `A 4-electrode tined lead (Medtronic Model 3889 or Axonics quadripolar lead) was advanced through the introducer sheath into the S3 foramen, with each of the four electrodes (E0 distal through E3 proximal) positioned along the S3 nerve root path within the bony foramen. Each electrode was sequentially tested for similar bellows + great-toe responses at low threshold (ideally < 2 V on all four contacts) — this confirms appropriate lead-nerve apposition along the entire active span of the lead. Lead position was further confirmed under AP and lateral fluoroscopy: AP shows the lead curving along the S3 nerve root, lateral confirms depth at the ventral cortex.`,
      `The lead was deployed by retracting the introducer sheath while holding the lead stylet stable — this releases the four self-anchoring tines that secure the lead within the soft tissue surrounding the foramen, providing chronic mechanical stability. A second 1 cm incision was made laterally over the upper buttock at the planned IPG site (typically 7-10 cm lateral to the midline at the level of the iliac crest, in a position the patient can comfortably reach for charging the Axonics system). The lead was tunneled subcutaneously from the foraminal incision to the IPG pocket using the lead tunneling tool.`,
      `${name.includes("stage 2") || name.includes("ipg") || name.includes("permanent") ? "STAGE 2 (IPG implantation, performed 7-14 days after Stage 1 in a patient who demonstrated > 50% improvement in symptom diary during the trial period — typically frequency, urgency, urge incontinence episodes, or chronic urinary retention with reduced catheterization volumes): The previously placed lead extension was disconnected and removed. The lead end (now in the IPG pocket position) was connected to the IPG (Medtronic InterStim II non-rechargeable, InterStim Micro recharge-free, or Axonics rechargeable). Impedance values were checked on all four electrodes (target 200-1500 ohms — out-of-range values suggest lead damage, fibrosis, or migration). A trial stimulation through the IPG confirmed appropriate response on the chosen optimal contact." : "The lead was externalised through a separate small incision lateral to the IPG pocket for a percutaneous nerve evaluation (PNE) trial — the lead was secured at skin level with a small bolster. The patient was discharged with a programmer for trial stimulation over 7-14 days, with symptom diary documentation."}`,
      `The IPG pocket / lead exit site was closed in layers: subcutaneous tissue with 3-0 Vicryl interrupted, dermis with 4-0 Monocryl, skin with 4-0 Monocryl subcuticular and Steri-Strips. A pressure dressing was applied. The patient was instructed regarding wound care, restrictions on bending and lifting > 10 lbs × 6 weeks (to allow tined-lead ingrowth and prevent displacement), and follow-up at 2 weeks for programming optimization. Long-term follow-up at 6 weeks, 6 months, and annually thereafter assessed symptom control, battery life (5-7 years for non-rechargeable; 15+ years for rechargeable Axonics), and possible programming adjustments. Common revision indications include lead migration (5-10% at 5 years), IPG pocket pain, and battery depletion.`,
    ];
  }

  // -- Penile prosthesis -----------------------------------------------------
  if (includesAny(name, ["penile prosthesis"])) {
    const isMalleable = name.includes("malleable") || name.includes("semirigid");
    return [
      `The patient was positioned supine with the legs slightly abducted. Hair was clipped (not shaved) immediately preoperatively to reduce surgical site infection. A pre-operative chlorhexidine shower the night before and morning of surgery was confirmed. The patient was prepped with a 10-minute scrub using chlorhexidine-alcohol solution from umbilicus to mid-thigh, including the entire genitalia and perineum, with attention to the scrotum and inguinal regions. Sterile drapes were applied with a "no-touch" technique to the genitalia. Antibiotic prophylaxis covered both Gram-positive and Gram-negative organisms (vancomycin 1 g + gentamicin 80 mg IV, or per institutional protocol) — penile prosthesis infection rates are 1-3% in primary cases and 7-10% in revisions, making aseptic technique paramount.`,
      `A 16 Fr Foley catheter was placed to identify the urethra during corporal dilation. ${name.includes("infrapubic") ? "An infrapubic transverse incision was made just superior to the symphysis pubis, with subcutaneous tissue dissected to expose the corpora cavernosa proximally — this approach permits direct placement of the reservoir under vision (avoiding the blind retropubic placement of the penoscrotal approach) but gives less optimal pump positioning." : "A penoscrotal vertical incision was made in the median raphe extending from the penoscrotal junction inferiorly for 4-5 cm. This incision was deepened through the dartos fascia. A self-retaining ring retractor (Lone Star) was placed to maintain exposure. This approach permits a single incision for cylinder, pump, and reservoir placement and provides optimal pump positioning in the dependent scrotum."}`,
      `The corpora cavernosa were exposed bilaterally by retracting the corpus spongiosum and urethra to one side (with palpation of the Foley catheter to confirm urethral location). Stay sutures of 2-0 PDS were placed in the tunica albuginea on each corpus, in a longitudinal orientation, marking the planned 2-3 cm corporotomy site. The stay sutures were tagged for later closure. A 2 cm longitudinal corporotomy was made between the stay sutures using a #15 blade, opening into the corporal sinusoid.`,
      `The corpora were sequentially dilated using Brooks dilators (8 mm to 14 mm) or Hegar dilators in 1 mm increments, with very gentle pressure proximally toward the crus and distally toward the glans. Crossover (the dilator inadvertently passing into the contralateral corpus through the septum) was avoided by always dilating one side completely before starting the other. Distal dilation was felt to engage at the corona — overly aggressive distal dilation risks distal urethral perforation, whereas inadequate dilation results in distal cylinder buckling. Total corporal length was measured proximally and distally with the Furlow inserter or Banner sounds: typical adult corporal length is 18-23 cm total (proximal + distal from corporotomy site).`,
      `${isMalleable ? "Malleable cylinders (AMS 600M Spectra or Coloplast Genesis) of appropriate length were inserted into each corpus, with the rear tips seated against the crus and the distal tip positioned just below the glans. No reservoir or pump is required for malleable prostheses." : `An inflatable 3-piece prosthesis was selected (AMS 700 LGX with InhibiZone antibiotic coating, or Coloplast Titan with hydrophilic coating soaked in rifampin-gentamicin solution per Mulcahy protocol — both reduce infection risk). Cylinders of appropriate length (typically 18-21 cm including the rear tip extender) were inserted into each corpus using the Furlow inserter and traction sutures. Rear tip extenders (1, 2, or 3 cm) were added to ensure the cylinders extended fully into the crus. The cylinders were verified to lie flat with the seam oriented dorsally.`}`,
      `The corporotomies were closed with running 2-0 PDS or interrupted 3-0 Maxon, with care to avoid puncturing the cylinders (the suture needle was angled away from the cylinder and the cylinder was depressed into the corpus during suture passage). After closure, the prosthesis was test-cycled to confirm cylinder integrity (no leaks at the corporotomy line).${isMalleable ? "" : ` The pump was placed in a dependent scrotal pouch via blunt finger dissection through the dartos, in a position that the patient could reliably operate (typically the dependent right or left dependent scrotum). Through the same penoscrotal incision (no separate inguinal incision needed), the prevesical (Retzius) space was developed by sharply dividing the floor of the inguinal canal at the external ring (or via a small separate inguinal incision for the infrapubic approach). The reservoir (100 mL standard, or 65-75 mL low-profile) was placed in the prevesical space. The reservoir was filled with isotonic saline (NOT contrast — contrast can crystalize and damage the device).`}`,
      `${isMalleable ? "" : "Tubing from the cylinders, pump, and reservoir was prepared. All air was meticulously evacuated from the connections by submerging components in sterile saline and using vacuum technique. Connections were made using AMS quick-connector pieces (each connection submerged in saline to prevent air entry). The device was activated and cycled three times to confirm full inflation and complete deflation. The pump was left fully deflated at the end of cycling. Final saline volume was documented for postoperative reference."}`,
      `Hemostasis was confirmed at all sites. ${isMalleable ? "" : "A small Penrose drain was placed in the dependent scrotum and brought out laterally to drain any postoperative hematoma — removed on POD 1 to minimize ascending infection risk. "}The wound was closed in layers: dartos with 3-0 Vicryl interrupted, dermis with 4-0 Monocryl, skin with 4-0 Monocryl subcuticular running suture. A penile compressive dressing was applied with the penis taped to the lower abdomen in a "Mickey Mouse" position to maintain the cylinders straight during the first 24 hours. The Foley was retained for 24 hours. The patient was instructed regarding device deactivation × 4-6 weeks (to allow tissue healing), return at 4-6 weeks for activation and patient education on cycling, and lifetime follow-up. Patient counselling included expected outcomes (long-term satisfaction 85-95%), revision rates (10-15% at 5 years for mechanical failure or infection), and the irreversibility of the operation (the corporal sinusoidal tissue is replaced by fibrous tissue postoperatively, eliminating the option of natural erection if the device is removed without replacement).`,
    ];
  }

  // -- Varicocelectomy -------------------------------------------------------
  if (includesAny(name, ["varicocele", "varicocelectomy"])) {
    return [
      `The patient was positioned supine. ${name.includes("subinguinal") || name.includes("microsurgical") ? "A microsurgical sub-inguinal approach (Marmar-Goldstein technique) was selected as the gold standard for varicocelectomy — meta-analyses demonstrate the lowest recurrence rate (1-2%) and lowest hydrocele rate (<1%) compared to high-ligation Palomo or laparoscopic techniques." : "An inguinal approach (Ivanissevich) at the level of the external ring was selected."} The scrotum and ipsilateral lower abdomen were prepped with chlorhexidine and draped to expose the operative field including the inguinal canal. Sequential compression devices were placed.`,
      `A 3-4 cm transverse skin incision was made just below the external inguinal ring (sub-inguinal approach), or just above and parallel to the inguinal ligament for the inguinal approach. The incision was deepened through the subcutaneous tissue (Camper's fascia) and Scarpa's fascia. The external oblique aponeurosis was identified but, in the subinguinal approach, NOT opened — preservation of the external oblique avoids opening the inguinal canal and reduces postoperative pain and ilioinguinal nerve injury risk.`,
      `The spermatic cord was delivered through the wound by gentle traction, with the testis brought up briefly to verify cord identification. The cord was placed over a Penrose drain or rubber dam for stability. The operating microscope was brought in at × 6-15 magnification (Mitaka MM-50 or Leica M525), or surgical loupes at × 4.5-6 were used as alternative magnification.`,
      `Under microscopic visualisation, the cremasteric muscle and external spermatic fascia were carefully opened along the cord's anterior surface using fine bipolar cautery (low setting, 5-10 W) and Westcott scissors. The internal spermatic fascia was then opened, exposing the contents of the cord: testicular artery (singular or duplicated in 30%), vas deferens with vasal artery, lymphatic vessels (typically 4-8 per cord), and internal spermatic veins (typically 4-8 dilated veins forming the pampiniform plexus).`,
      `The testicular artery was identified by visible pulsations under the microscope, supplemented by intraoperative Doppler ultrasound (20 MHz vascular probe, "MIZUHO Vascular Doppler" or similar) when needed — particularly important if multiple arteries were found (anatomic variation). The artery was carefully dissected free from surrounding veins on a vessel loop and protected throughout the procedure. Preservation of the testicular artery is critical to avoid testicular atrophy.`,
      `The lymphatic vessels were systematically identified (small, thin-walled, transparent vessels distinguishable from veins by absence of blood and fragility) and preserved when possible — preservation reduces the postoperative hydrocele rate (the most common complication after high-ligation varicocelectomy). The vas deferens with its accompanying vasal vessels (these supply collateral arterial flow to the testis and were preserved) was identified and protected.`,
      `Each internal spermatic vein was sequentially dissected, ligated with two clips of 4-0 silk or 5-0 Prolene, and divided between the ligatures. All veins of the pampiniform plexus were addressed (typically 4-8 internal spermatic veins, plus 1-2 cremasteric/external spermatic veins coursing along the floor of the inguinal canal). The vas was inspected for any small vasal collateral veins, which were also ligated to ensure complete venous decompression.`,
      `The cord was inspected systematically to confirm complete vein ligation: no residual filling on Valsalva, all veins identified and ligated, testicular artery and lymphatics preserved, vas deferens intact. The cord was returned to the inguinal canal. Closure was performed in layers: Scarpa's fascia with 3-0 Vicryl interrupted, dermis with 4-0 Monocryl, skin with 5-0 Monocryl subcuticular running suture. Steri-Strips applied. The patient was instructed regarding scrotal support × 1 week, ice × 48 hours, and follow-up semen analysis at 3 and 6 months for fertility cases.`,
    ];
  }

  // -- Orchiopexy ------------------------------------------------------------
  if (includesAny(name, ["orchiopexy", "orchidopexy"])) {
    // Acute torsion / scrotal exploration variant — distinct technique
    // (midline scrotal incision, manual detorsion, warm saline reperfusion,
    // 3-point fixation BILATERALLY, no inguinal canal opening). The pattern
    // matches first because urgent torsion is the operative emergency and
    // any case named "torsion" or "scrotal exploration" should never fall
    // through to the cryptorchidism block.
    if (
      includesAny(name, [
        "torsion",
        "scrotal exploration",
        "testicular torsion",
        "spermatic cord torsion",
      ])
    ) {
      return [
        `The patient was brought to the operating room and placed in the supine position. After induction of general endotracheal anesthesia, the genitalia were prepped with chlorhexidine and draped in the usual sterile fashion. Antibiotic prophylaxis (cefazolin 2 g IV) was administered within 60 minutes of incision. Given the urgency of suspected testicular torsion — every additional hour of warm ischemia drops salvage rates by ~10% (Visser series), with > 80% salvage at < 6 h vs < 20% at > 24 h — the case was expedited from consent to incision.`,
        `A midline scrotal raphe incision was made with a #15 blade and carried down through the dartos muscle layer to expose the [left / right] hemiscrotum. The tunica vaginalis was identified, opened, and a small amount of [serous / serosanguinous / dark] reactive hydrocele fluid was released. The testis was delivered into the wound by gentle traction.`,
        `The affected testis was confirmed to be torsed approximately [360° / 540° / 720°] in the [counterclockwise (most common, on the left) / clockwise (more common on the right)] direction. The testis was [significantly dusky and firm / purple and edematous / black-mottled with no surface bleed], with the spermatic cord twisted at the level of the [internal ring / mid-cord / scrotal entry]. Manual detorsion was performed by rotating the testis in the opposite direction (typically "open like a book" — outward for both sides), and the cord was confirmed to be untwisted by visual inspection.`,
        `The testis was wrapped in warm-saline-soaked gauze and left in situ to reperfuse for 5–10 minutes. ${name.includes("right") ? "Attention was then turned to the contralateral (left) testis" : "Attention was then turned to the contralateral (right) testis"} for prophylactic orchiopexy — bell-clapper deformity is bilateral in 80% of patients and contralateral fixation is mandatory at any torsion exploration regardless of presenting laterality.`,
        `A subdartos pouch was developed on the contralateral side by elevating scrotal skin off the dartos with sharp dissection, creating a subdermal pocket. The contralateral testis was delivered, inspected, and secured with a 3-point orchiopexy using 4-0 PDS interrupted sutures placed through the tunica albuginea at the medial, lateral, and inferior aspects of the testis, and anchored to the dartos within the subdartos pouch. This technique secures the testis against future torsion without compromising arterial supply through the spermatic cord.`,
        `Attention was returned to the originally torsed testis and reassessed after the [5–10 minute] reperfusion interval. ${name.includes("orchiectom") ? "The testis remained black, firm, with no return of pink color or surface bleed despite warm saline application — non-viable. The decision was made to proceed with orchiectomy: the spermatic cord was double-clamped, divided sharply between the clamps, and triple suture-ligated with 0 silk on the proximal stump. The non-viable testis was removed and submitted to pathology." : "Significant improvement in the appearance of the spermatic cord was noted with return of healthy pink color, and the testis itself, while [slightly dusky / partially improved], demonstrated clear improvement compared to the initial presentation. Given this improvement, the decision was made to proceed with orchiopexy rather than orchiectomy. A subdartos pouch was developed on this side, and a 3-point orchiopexy was performed using 4-0 PDS sutures in the medial, lateral, and inferior positions, securing the testis to the dartos within the pouch."}`,
        `The dartos layer was closed with running 3-0 Vicryl, approximating from the lateral aspects toward the midline to ensure hemostasis along the closure. The skin was closed with interrupted 5-0 Monocryl sutures. A scrotal support was applied with a scrotal weight for approximately 2 hours postoperatively for compression hemostasis.`,
        `The patient tolerated the procedure well and was transferred to the recovery area in stable condition. Plan: overnight observation with discharge in the morning if clinically well, scrotal support × 1 week, ice over the first 48 hours, NSAIDs for pain control, return precautions for fever > 38.5°C, increasing scrotal pain or swelling, or any concern for wound dehiscence. ${name.includes("orchiectom") ? "Counselling regarding hormonal status (the contralateral testis is sufficient for normal testosterone production) and prosthesis discussion deferred to a clinic visit." : "The salvaged testis will be followed by ultrasound at 6–12 weeks to assess for atrophy (atrophy rate after late presentation > 6 h ranges 30–50%). Future fertility counselling deferred to clinic."}`,
      ];
    }
    return [
      `The pediatric patient was placed supine on the operating table with appropriate warming measures (forced-air warmer, warming mattress) given the high surface-area-to-mass ratio of pediatric patients. After induction of general anesthesia with caudal block (or local infiltration), the abdomen and ipsilateral scrotum were prepped with chlorhexidine. The contralateral testicular position was first confirmed under anesthesia (when the patient was relaxed) — this examination is critical, as up to 30% of clinically suspected undescended testes will be found to be retractile (descending into the scrotum) under anesthesia and would not require surgery.`,
      `A 2-3 cm transverse incision was made over the inguinal canal, in line with a natural skin crease, just superior to the pubic tubercle and lateral. The incision was deepened through the subcutaneous tissue (Camper's fascia and Scarpa's fascia in the pediatric patient — these layers are robust enough to identify clearly). The external oblique aponeurosis was identified and incised in the line of its fibres, taking care to preserve the ilioinguinal nerve which runs along the anterior surface of the cord.`,
      `The spermatic cord was identified within the inguinal canal. The testis was located: in 80% of cases the testis is found within the inguinal canal or just inside the internal ring (palpable preoperatively); in 15% the testis is intra-abdominal (impalpable, requiring laparoscopic exploration); in 5% the testis is absent (vanishing testis syndrome). The testis was delivered into the operative field by gentle traction.`,
      `The patent processus vaginalis was identified — this is universal in cryptorchid patients and is the embryologic remnant of the peritoneum that should normally have closed by birth. The processus was carefully dissected free from the cord structures (vas deferens medially, testicular vessels laterally) using fine Stevens scissors and bipolar cautery. The processus was traced cephalad to the level of the internal ring, where it was ligated with 3-0 Vicryl interrupted suture and divided. This high ligation closes the patent processus and prevents future inguinal hernia.`,
      `The cord was assessed for length: if the testis would not reach the dependent scrotum without tension, retroperitoneal mobilisation of the cord (Prentiss maneuver) was performed. The lateral spermatic fascial bands were divided, the cord was mobilised away from the inferior epigastric vessels (which can be ligated and divided if needed), and additional cord length was gained by progressing the dissection toward the kidney along the gonadal vessels. For very high testes requiring extreme length, the Fowler-Stephens technique (testicular artery division with reliance on collateral flow from the vasal and cremasteric arteries) was reserved as a backup.`,
      `A 1-2 cm scrotal incision was made through which a dartos pouch was developed: the scrotal skin was elevated off the underlying dartos muscle layer using a hemostat to develop a subdermal pouch dependent enough to provide a stable, dependent position for the testis. The pouch was sized to comfortably accommodate the testis without tension.`,
      `The testis was passed through the inguinal canal and into the dartos pouch through a small opening made in the dartos. The neck of the pouch was tightened around the cord with a 4-0 Vicryl suture, sized to permit cord passage but prevent re-ascent. The testis was secured in the pouch with 1-2 sutures of 4-0 Vicryl tacking the tunica vaginalis to the dartos at the most dependent point. The scrotal skin was approximated with 5-0 chromic interrupted sutures.`,
      `The external oblique aponeurosis was re-approximated with 3-0 Vicryl interrupted sutures, ensuring the inguinal canal was reconstructed without compromising the cord. Scarpa's fascia closed with 4-0 Vicryl, dermis with 5-0 Monocryl subcuticular, skin with skin glue or Steri-Strips. The patient was discharged the same day with instructions for follow-up at 6 weeks to confirm intrascrotal testicular position. Annual follow-up was recommended given the lifetime testicular cancer risk (4-7× baseline) and importance of self-exam education starting at puberty.`,
    ];
  }

  // -- Prostate biopsy -------------------------------------------------------
  if (includesAny(name, ["prostate biopsy", "trus biopsy", "transperineal biopsy"])) {
    if (includesAny(name, ["transperineal"])) {
      return [
        `The patient was positioned in dorsal lithotomy under general or spinal anesthesia. The perineum and scrotum were prepped with chlorhexidine and draped to expose the perineum from the scrotum to the anus. A bi-planar (transrectal) ultrasound probe (BK Medical or equivalent, 5-10 MHz) was inserted into the rectum and the prostate was visualised in axial and sagittal planes. Prostate volume was calculated using the prolate ellipsoid formula (length × width × height × 0.52).`,
        `A peri-perineal anesthetic block was performed with 20 mL of 1% lidocaine infiltrated bilaterally at the levator ani muscles using a long 22-gauge spinal needle, under ultrasound guidance to confirm correct placement adjacent to the prostatic apex. The transperineal access grid (PrecisionPoint or similar) was attached to the ultrasound probe stepper at the perineum.`,
        `A systematic 24-core biopsy was performed via the perineum: 12 cores from each sextant of the prostate (apex, mid, base — bilateral) using a 18-gauge biopsy gun with 22-cm needle length. Targeted cores (2-4 per ROI) were taken from any MRI-identified PI-RADS 3-5 lesions registered to ultrasound (cognitive registration or fusion software such as UroNav). Each core was placed in a separate labelled container in formalin, with sextant location and core number documented.`,
        `Hemostasis was confirmed by direct pressure at each puncture site with sterile gauze for 2-3 minutes. The transrectal ultrasound probe was removed atraumatically. The perineum was inspected for hematoma. A small adhesive dressing was applied. The patient was instructed regarding return precautions for fevers (post-biopsy sepsis 1-3% incidence even with transperineal approach), urinary retention (5-10% incidence), persistent hematuria, or perineal hematoma.`,
      ];
    }
    return [
      `The patient was positioned in left lateral decubitus with knees and hips flexed at 90°. A digital rectal examination was performed to confirm prostate size and rule out a fixed lesion or fluctuant abscess. The patient had received fluoroquinolone or fosfomycin prophylaxis 1-2 hours prior to biopsy (per AUA guidelines, given resistant E. coli concerns; institutional protocols may also include rectal swab cultures pre-biopsy with culture-directed prophylaxis).`,
      `A 5-10 MHz endfire transrectal ultrasound probe (BK Pro Focus 2202 or equivalent) was inserted into the rectum after digital evacuation of stool. The probe was advanced and the prostate visualised in transverse and sagittal planes. Prostate volume was calculated using the prolate ellipsoid formula. A systematic survey identified hypoechoic, hyperechoic, or heterogenous areas, the seminal vesicles, and the periprostatic fat planes.`,
      `Peri-prostatic anesthetic block was administered using 1% lidocaine 10-15 mL via an 18-gauge spinal needle introduced through the biopsy guide channel. The needle was advanced to the angle between the seminal vesicle and the prostatic base bilaterally — the "Mt. Everest" position on ultrasound — where the neurovascular bundles enter the prostate. Anesthetic was deposited in the peri-prostatic fat. A 5-minute pause was observed for anesthetic effect.`,
      `A standard 12-core systematic transrectal biopsy was performed using an 18-gauge spring-loaded biopsy gun (Bard Magnum or similar, 22-cm length): bilateral cores at base, mid, and apex of each lobe, with samples taken from the lateral peripheral zone (where most cancers arise) rather than the medial transition zone. ${name.includes("mri") || name.includes("targeted") ? "Targeted cores (2 per ROI) were also taken from MRI-identified PI-RADS 3-5 lesions using cognitive registration with the ultrasound-visualised landmarks, or with MRI-ultrasound fusion (UroNav, Artemis) when available." : ""}`,
      `Each core was approximately 17 mm long and submitted in a separate, individually labelled formalin container with sextant location identified (RT-Apex, RT-Mid, RT-Base, LT-Apex, LT-Mid, LT-Base, plus targeted cores) for accurate pathologic mapping. Hemostasis at the rectum was confirmed by direct visualisation as the probe was withdrawn. The patient was returned to the recovery area.`,
      `The patient was monitored for 30-60 minutes for hemodynamic stability and absence of acute bleeding. Discharge home was permitted with thorough verbal and written instructions: expect 1-2 weeks of mild hematuria, hematospermia (4-6 weeks), and occasional hematochezia (24-48 hours); return precautions for fever > 38.5°C (post-biopsy sepsis 1-2%), inability to void (urinary retention 1-2%), heavy persistent rectal bleeding, or worsening pain. Pathology follow-up was scheduled at 7-10 days.`,
    ];
  }

  // -- SPC placement ---------------------------------------------------------
  if (includesAny(name, ["spc placement", "suprapubic catheter", "suprapubic cystostomy"])) {
    return [
      `The patient was positioned supine. The bladder was confirmed to be full by bedside ultrasound — at least 300 mL is necessary for safe percutaneous puncture and direct visualisation of the bladder distal to the symphysis pubis. If the bladder was not adequately full, retrograde filling via Foley catheter was attempted first (in patients without obstructive uropathy) or open cystostomy was elected.`,
      `The puncture site was identified at the midline approximately 2 fingerbreadths (3-4 cm) cephalad to the pubic symphysis. This site was deliberately above the pubis to avoid prostate (in men) and below the typical peritoneal reflection. The skin was prepped with chlorhexidine and draped sterilely. Local anesthetic (1% lidocaine 5-10 mL) was infiltrated subcutaneously and tracked down toward the bladder using a 22-gauge needle under ultrasound guidance, with intermittent aspiration to confirm urine return — confirming the trajectory and bladder location.`,
      `A small (1 cm) midline skin incision was made over the planned puncture site. ${name.includes("trocar") || !name.includes("seldinger") ? "Trocar technique was used: a 16 Fr Cope-Loop suprapubic catheter set or Stamey trocar kit was advanced through the rectus sheath and into the bladder under continuous ultrasound visualisation (linear high-frequency probe in transverse plane), at a 60° angle to the abdominal wall directed inferiorly toward the bladder. Brisk return of urine through the cannula confirmed intraluminal position." : "Seldinger technique was used: a 16 Fr Cope-Loop catheter was placed over a guidewire that had been advanced into the bladder via a needle. The dilator-sheath assembly was passed over the wire, then the catheter was advanced over the dilator into the bladder."} The catheter balloon was inflated with 10 mL of sterile water to retain it within the bladder.`,
      `The catheter was secured to the abdominal wall with a 2-0 silk anchor stitch through the catheter wing. Drainage to a collection bag was confirmed. Sterile dressing was applied. The patient was instructed regarding catheter care, anchor stitch removal at 1 week, and the first catheter exchange at 4-6 weeks (allowing a tract to mature before changing).`,
    ];
  }

  // -- Bladder biopsy (cystoscopic, no resection) ----------------------------
  if (includesAny(name, ["bladder biopsy"]) && !includesAny(name, ["turbt"])) {
    return [
      `The patient was positioned in dorsal lithotomy with the legs in candy-cane stirrups, ensuring no pressure on the lateral peroneal nerves at the fibular head. The genitalia and perineum were prepped with chlorhexidine and draped to expose the operative field. Antibiotic prophylaxis (cefazolin 2 g IV or per institutional protocol — bladder biopsy is a Class II clean-contaminated procedure with a 1-3% UTI rate without prophylaxis) was administered. The indication for biopsy was reviewed: surveillance for non-muscle-invasive bladder cancer (mapping biopsies after positive cytology with negative cystoscopy — "occult disease" workup), suspicious flat lesion (carcinoma in situ), prostatic urethral biopsy in known bladder cancer (10-15% involvement), or evaluation of a non-tumor lesion (interstitial cystitis Hunner ulcer biopsy, suspected eosinophilic cystitis, suspected schistosomiasis).`,
      `A 22 Fr rigid cystoscope (Storz or Olympus) with a 30° lens was introduced per urethra under direct vision. The urethra was inspected en route — anterior urethra, membranous urethra, prostatic urethra (with attention to the verumontanum, ejaculatory ducts, and prostatic fossa) in male patients; entire urethra in female patients. The bladder was filled with 200-300 mL of sterile saline irrigation to allow systematic inspection. A 70° lens was used to inspect the dome and anterior wall, which are otherwise difficult to visualise with the 30° lens.`,
      `A systematic survey of the bladder was performed in a standardized sequence: bladder neck, trigone, both ureteric orifices (with confirmation of clear efflux from each, and assessment of orifice morphology — golf-hole orifice suggests reflux), posterior wall, both lateral walls (right and left), dome, and anterior wall. ${name.includes("blue light") || name.includes("hexvix") || name.includes("cysview") ? "Blue-light cystoscopy with hexaminolevulinate (Hexvix/Cysview) was performed: the bladder had been instilled with 50 mL of hexaminolevulinate solution 60 minutes preoperatively. White-light inspection identified all visible lesions; the system was then switched to blue light (D-light system, Storz), which causes porphyrin-laden tumor cells to fluoresce pink-red against a blue background. This technique improves carcinoma in situ detection by 30-40% over white light alone." : "White-light cystoscopy was used throughout."} All abnormal findings were documented by location (using the bladder clock-face nomenclature with 12 o'clock at the bladder neck) and described (size, configuration — papillary, sessile, flat — color, surrounding mucosa).`,
      `Cold-cup biopsies were taken from [target locations] using the cold-cup biopsy forceps (avoiding cautery for these specimens to preserve tissue architecture for pathologic evaluation, particularly important for distinguishing CIS from reactive atypia). For mapping biopsies (when cytology is positive but no visible lesion is found): biopsies were taken from each of the 6 standard mapping sites — bladder dome, anterior wall, right lateral wall, left lateral wall, posterior wall, and trigone — with each biopsy submitted in a separate, labelled formalin container. ${name.includes("prostatic urethra") ? "An additional cold-cup biopsy was taken from the prostatic urethra to assess for prostatic urethral involvement of urothelial carcinoma." : ""}`,
      `Hemostasis was achieved at each biopsy site using a bugbee electrode at low cautery setting (15-20 W coagulation), with care to avoid deep transmural cautery (especially at the dome where it abuts the peritoneum, with risk of intraperitoneal extravasation). All biopsy sites were inspected and confirmed hemostatic. The bladder was emptied via the cystoscope. A 16 Fr Foley catheter was placed for postoperative drainage and to monitor for hematuria. The catheter was removed before discharge if urine was clear.`,
      `The patient was returned to the recovery area. ${name.includes("immediate intravesical") || name.includes("mitomycin") ? "Single-dose intravesical mitomycin C (40 mg in 40 mL sterile water) was instilled via the Foley after biopsy completion (per AUA/EAU guideline for intermediate-risk non-muscle-invasive disease) and retained for 1 hour, with the patient rotated 15° every 15 minutes — this single instillation reduces the 1-year recurrence risk by 35-40%." : ""} Discharge instructions: expect mild hematuria for 24-48 hours, increase fluid intake, avoid heavy lifting × 1 week. Return precautions: heavy persistent bleeding with clots, inability to void, fever > 38.5°C (post-procedural sepsis 1-2%). Pathology was scheduled for review at 7-10 days; surveillance cystoscopy was planned per AUA non-muscle-invasive bladder cancer risk stratification (every 3 months for high-risk, every 3-6 months for intermediate-risk, every 6-12 months for low-risk).`,
    ];
  }

  // -- ESWL ------------------------------------------------------------------
  if (includesAny(name, ["eswl", "shock wave lithotripsy"])) {
    return [
      `Stone characteristics were reviewed: location (renal vs ureteral; upper-pole vs lower-pole renal stones — lower-pole stone-free rate after ESWL is poor, ~30-50%, due to gravity-dependent fragment retention in the dependent calyx); size (ESWL most effective < 10 mm renal stones and < 10 mm proximal ureteral stones); composition (cystine, brushite, and calcium oxalate monohydrate stones are ESWL-resistant; calcium oxalate dihydrate, struvite, and uric acid stones fragment well; HU > 1000 on CT predicts poor fragmentation, while HU < 800 predicts good fragmentation); skin-to-stone distance (> 10 cm correlates with poor outcomes, particularly in obese patients); presence of obstruction (a pre-existing stent for solitary kidney or compromised renal function may be in place). Contraindications were excluded: pregnancy, untreated coagulopathy, active UTI, distal obstruction, AAA in the shock-wave path, severe skeletal deformity preventing positioning.`,
      `The patient was placed supine on the Storz Modulith SLX-F2 (or Dornier Compact Sigma, or Siemens Lithoskop) lithotripter table. ${name.includes("general") ? "General anesthesia was administered with controlled apneic ventilation during shock-wave delivery to minimize stone movement." : "Conscious sedation with fentanyl 50-100 mcg IV and midazolam 1-2 mg IV titrated to comfort was used."} The kidney rest was elevated under the affected side and the patient repositioned to align the stone with the lithotripter focal point.`,
      `The stone was localised using a combination of biplanar fluoroscopy and integrated ultrasound. The C-arm was used to confirm stone position on AP and lateral imaging, with the focal-point cross-hairs aligned to the stone in both planes. Patient position was iteratively adjusted using table movement (X, Y, Z axis fine adjustment) until the stone was at the F2 focal point of the lithotripter. Coupling between the lithotripter water-cushion or membrane and the patient's skin was achieved with copious ultrasound gel, with care to eliminate air bubbles (which dramatically attenuate shock-wave energy — up to 99% reduction with > 2% air coverage at the coupling interface) by gentle rotation of the cushion.`,
      `Shock-wave delivery was begun at low rate (60 SW/minute) to allow protective renal vasoconstriction (the "stepwise voltage ramping" protocol — slower rates have been shown in the Pace meta-analysis to improve stone-free rates by ~10% over 120 SW/min and reduce renal injury). Voltage was started low (typically 11-14 kV, level 1-2 on Storz Modulith) for the first 100 shocks to allow renal protective adaptation, then gradually ramped to therapeutic energy (18-20 kV, level 4-6) over the next 200-300 shocks. A typical full session delivered 2500-3000 shock waves at frequencies of 60-90 SW/minute. The stone was periodically re-imaged under fluoroscopy to confirm continued focal-point alignment (the stone may shift with respiration) and to assess fragmentation in real time.`,
      `Hemodynamic monitoring throughout the procedure noted any tachycardia (suggesting pain or volume issues) or arrhythmias (rare; ECG-gated shock delivery may be activated for patients with cardiac history). The session was concluded after the maximum number of shocks for the session was reached (institutional protocol typically 3000-4000 maximum), the stone was deemed adequately fragmented (loss of the dense focal-point shadow, replaced by a "snowstorm" of fine fragments), or the patient could no longer tolerate the procedure.`,
      `At the conclusion of treatment, post-treatment imaging (KUB or low-dose CT) documented [stone fragmentation status — well-fragmented with sand-like material; partial fragmentation requiring repeat session at 2-3 weeks; no significant fragmentation suggesting alternative treatment with ureteroscopy or PCNL]. The patient was monitored in recovery for hematuria, pain, and hemodynamic stability. Discharge instructions included: expect colicky pain as fragments pass, alpha-blocker (tamsulosin 0.4 mg daily) for medical expulsive therapy of ureteral fragments, strain urine and submit any retrieved stones for analysis, increase oral fluid intake to 2-3 L/day, follow-up KUB at 2-4 weeks to confirm stone clearance. Repeat ESWL session was planned if residual fragments > 4 mm at follow-up.`,
    ];
  }

  // -- Stent exchange through ileal conduit ----------------------------------
  // Distinct workflow from cystoscopic stent placement: the conduit stoma
  // gives direct access so we skip cystoscopy entirely. Pattern matched
  // before the generic stent placement so it wins.
  if (
    includesAny(name, [
      "stent exchange",
      "ureteral stent exchange",
      "ureteric stent exchange",
    ]) ||
    (includesAny(name, ["ileal conduit"]) && includesAny(name, ["stent"]))
  ) {
    return [
      `The patient was brought into the procedure suite and positioned supine, with the ileal conduit site prepped and draped in normal sterile fashion. Antibiotic prophylaxis was administered per institutional protocol. The indwelling ureteric stent was identified protruding from the stoma approximately 1 cm beyond the conduit edge, and was therefore directly graspable without the need for cystoscopy.`,
      `Under fluoroscopic guidance, a Sensor (PTFE-coated, 0.038\") guidewire was passed retrograde alongside the existing stent up the ureter and confirmed within the right renal pelvis. A retrograde pyelogram was performed with [5 mL] of Omnipaque diluted contrast injected through a 5 Fr open-tip ureteric catheter to confirm wire position within the renal pelvis and document upper-tract anatomy.`,
      `Once intrarenal wire position was confirmed, the existing indwelling stent was removed, leaving the Sensor wire in place. A new ${name.includes("8") ? "8 Fr × 20 cm" : "[size] Fr × [length] cm"} double-J ureteric stent (Boston Scientific Polaris Loop or institution-equivalent) was then advanced over the Sensor wire under fluoroscopic guidance and deployed with the proximal coil within the renal pelvis and the distal coil exteriorised through the conduit stoma. Final fluoroscopic imaging confirmed appropriate proximal coil position within the renal pelvis.`,
      `The patient tolerated the procedure well, with no concerns. Plan: clinic follow-up in approximately 6 months for a repeat stent exchange. Return precautions: fevers > 38.5°C, flank pain suggesting obstruction, gross hematuria persisting > 48 h, or change in conduit output character.`,
    ];
  }

  // -- Stent placement (cystoscopic, retrograde) -----------------------------
  if (includesAny(name, ["stent placement", "stent insertion"]) && !includesAny(name, ["removal"])) {
    return [
      `The patient was brought to the endoscopy suite and placed in the dorsal lithotomy position with the legs in well-padded candy-cane stirrups. ${name.includes("ga") || name.includes("general") ? "General endotracheal anesthesia was administered." : "IV sedation was administered."} The genitalia and perineum were prepped with chlorhexidine and draped in the usual sterile fashion. Antibiotic prophylaxis (cefazolin 2 g IV or per culture-directed regimen) was administered within 60 minutes per AUA pre-instrumentation guidelines.`,
      `A 17 Fr flexible cystoscope was advanced per meatus into the urethra under direct vision. The urethra was inspected en route, including the prostatic urethra in male patients. The bladder was systematically inspected, and the [right / left] ureteric orifice was identified at the trigone. Attention was then turned to the affected ureteric orifice.`,
      `A Sensor (PTFE-coated, 0.038") guidewire was advanced through the cystoscope working channel and engaged in the ureteric orifice, then passed up the ureter under fluoroscopic guidance. Intrarenal position was confirmed by visualisation of the wire curling within the renal pelvis on AP fluoroscopy. ${name.includes("malrotation") || name.includes("ectopic") ? "Note was made of the malrotated and inferiorly-positioned kidney with anteriorly-directed renal pelvis — wire trajectory was adjusted accordingly." : ""}`,
      `The cystoscope was de-instrumented, leaving the Sensor wire in place. A 5 Fr open-tip ureteric catheter was then advanced over the wire. A retrograde pyelogram was performed with [5 mL] of Omnipaque diluted contrast injected through the catheter (with the Sensor wire withdrawn for the pyelogram and replaced afterwards), and fluoroscopic imaging confirmed appropriate intrarenal position with no extravasation. The Sensor wire was then re-advanced and the 5 Fr ureteric catheter was withdrawn, the wire remaining in place throughout.`,
      `A 6 Fr × ${name.includes("long") ? "30" : name.includes("22") ? "22" : "26"} cm double-J ureteric stent (Boston Scientific Polaris Loop or institution-equivalent) was advanced over the Sensor wire and deployed with the proximal coil seated in the renal pelvis (confirmed by fluoroscopic visualisation of the curled coil) and the distal coil seated in the bladder under direct cystoscopic vision. Final fluoroscopic and cystoscopic imaging confirmed appropriate proximal and distal coil position. The wire was withdrawn.`,
      `${name.includes("foley") ? "A 16 Fr Foley catheter was placed for postoperative drainage." : "The bladder was emptied and the cystoscope withdrawn under direct vision. A Foley catheter was not placed; voiding trial was deferred to recovery."} The patient tolerated the procedure well. Plan: continue current antibiotic regimen as appropriate (e.g., amoxicillin/clavulanic acid for febrile UTI), with future definitive management of the underlying pathology to be coordinated with the responsible attending. Patient counselled regarding expected stent symptoms (frequency, urgency, suprapubic discomfort, mild hematuria, occasional flank pain on voiding from reflux up the stent), tamsulosin 0.4 mg daily for symptomatic relief, hydration, and clinic follow-up for stent removal at the appropriate interval (typically 1–6 weeks depending on indication).`,
    ];
  }

  // -- Stent removal ---------------------------------------------------------
  if (includesAny(name, ["stent removal"])) {
    return [
      `The indication for stent removal was reviewed: completion of post-ureteroscopy stenting period (typically 1-2 weeks), completion of post-pyeloplasty/reimplant stenting (4-6 weeks), or scheduled exchange. The duration of stent placement was confirmed (forgotten stents > 3 months may require ureteroscopic removal under anesthesia due to encrustation). The patient was positioned in dorsal lithotomy in the cystoscopy suite with the genitalia prepped and draped.`,
      `Topical 2% lidocaine hydrochloride jelly (UroJet 10 mL) was instilled per urethra and held for 5-10 minutes for anesthetic effect. A 16-17 Fr flexible cystoscope (Olympus CYF-V or Storz FLEXOR) was lubricated and introduced per urethra under direct vision through the irrigation flow. The urethra was inspected en route — anterior urethra, membranous urethra, and prostatic urethra (in male patients) — and any incidental findings were documented.`,
      `The bladder was filled with 100-150 mL of sterile saline irrigation to allow systematic inspection. A complete cystoscopic survey was performed: bladder neck, trigone, both ureteric orifices, posterior wall, both lateral walls, dome, and anterior wall. Any incidental findings (mucosal abnormality, bladder stones from stent encrustation, suspicious lesions) were documented. The distal coil of the ureteral stent was identified in the bladder, typically at the ipsilateral trigone or floating in the bladder lumen.`,
      `The stent was grasped at the distal coil with stent-grasping forceps (Olympus 3 Fr or 5 Fr "alligator" forceps passed through the cystoscope working channel) and gently removed under direct vision through the urethra, with the cystoscope withdrawn alongside the stent. The stent was inspected to confirm full-length removal: both proximal and distal coils intact, no fragmentation. Total stent length was measured against the original placement record (typically 24-28 cm). If the stent appeared encrusted, fragmented, or shorter than expected, fluoroscopic imaging was obtained to rule out retained fragments.`,
      `The ureteral orifice was inspected post-removal: it was patent without active bleeding or significant edema, and clear ureteric efflux was visualised. The cystoscope was withdrawn under direct vision. The patient was discharged from the cystoscopy suite immediately after the procedure with instructions: expect mild hematuria and dysuria for 24-48 hours, increase fluid intake, return precautions for fevers, persistent flank pain (suggesting recurrent obstruction), or inability to void. Follow-up was scheduled per the underlying diagnosis: for post-stone-treatment stents, no further follow-up was needed if symptoms resolved; for post-reconstructive stents (pyeloplasty, reimplant), renal ultrasound or MAG3 was obtained at 4-6 weeks to confirm absence of obstruction.`,
    ];
  }

  // -- Cystoscopy (diagnostic, may include biopsy) ---------------------------
  if (includesAny(name, ["cystoscopy"]) && !includesAny(name, ["turbt", "turp"])) {
    const isFlex = !name.includes("rigid");
    return [
      `The indication for cystoscopy was reviewed: hematuria workup (microscopic or gross), surveillance for non-muscle-invasive bladder cancer, evaluation of irritative voiding symptoms, evaluation of recurrent UTI, post-procedure assessment, or evaluation of voiding dysfunction. The patient was positioned ${isFlex ? "supine for flexible cystoscopy in the office or cystoscopy suite" : "in dorsal lithotomy with the legs in candy-cane stirrups"}, with the genitalia and perineum prepped with chlorhexidine and draped to expose the operative field.`,
      `Topical 2% lidocaine hydrochloride jelly (UroJet 10 mL or PlainJet) was instilled per urethra and held for 5-10 minutes for anesthetic effect. A penile clamp was applied for 2-3 minutes in male patients to retain the jelly within the urethra during the anesthetic dwell time. ${isFlex ? "A 16-17 Fr flexible cystoscope (Olympus CYF-V or Storz FLEXOR) was selected — preferred for office cystoscopy, male patients, and surveillance, with the advantage of comfortable navigation through the male urethra without the need for general anesthesia." : "A 22 Fr rigid cystoscope (Storz) with 30° lens was selected for diagnostic-with-biopsy or for female patients, providing superior optics and a working channel for instruments."} The scope was lubricated with sterile water-based lubricant.`,
      `The cystoscope was introduced per urethra under direct vision with continuous irrigation flow at low pressure to gently dilate the urethra. The urethra was inspected en route from distal to proximal: anterior (penile and bulbar) urethra (assessed for stricture, false passage, fistula, or condylomata), membranous urethra (assessed for sphincter contraction and external sphincter spasm), prostatic urethra (assessed for occlusion, lateral and median lobe enlargement, prostatic urethral length [normally 2.5-3.5 cm], verumontanum visualisation, ejaculatory ducts, and quality of the prostatic mucosa) in male patients; or the entire short female urethra in female patients.`,
      `The bladder was filled with 200-300 mL of sterile saline irrigation to allow systematic inspection without overdistention (which causes mucosal blanching and obscures lesions). A complete bladder survey was performed in a standardized clockwise pattern: bladder neck (assessed for trabeculation, stones, or tumor extension from prostate), trigone (assessed for tumor or chronic cystitis cystica), right ureteric orifice (location, morphology — normal slit-like vs golf-hole indicating reflux, efflux), left ureteric orifice (same assessment), posterior wall (most common tumor location), right lateral wall, left lateral wall, dome (rotated using a 70° lens or by deflection of flexible scope), and anterior wall. ${name.includes("blue light") ? "Blue-light (Hexvix/Cysview) inspection was added to white-light examination, with the bladder pre-instilled with hexaminolevulinate 60 minutes preoperatively, improving CIS detection by 30-40%." : ""}`,
      `Findings were documented by location using bladder clock-face nomenclature (12 o'clock at the bladder neck, 6 o'clock at the trigone). Each finding was characterised by: location, size, configuration (papillary vs sessile vs flat), surface (smooth vs nodular vs ulcerated), color, and surrounding mucosa. ${name.includes("biopsy") ? "Cold-cup biopsies were taken from suspicious areas using cold-cup biopsy forceps (preserving tissue architecture without cautery distortion). Each biopsy was placed in a separately labelled formalin container with site documentation." : "[No biopsies were indicated — proceed to scope withdrawal.]"}`,
      `${name.includes("biopsy") ? "Hemostasis was achieved at biopsy sites using a bugbee electrode at 15-20 W coagulation under direct vision. " : ""}The bladder was emptied through the cystoscope. The cystoscope was withdrawn under direct vision with re-inspection of the urethra. The patient was returned to the recovery area or discharged immediately from the office. Discharge instructions: expect mild hematuria and dysuria for 24-48 hours, increase oral fluid intake, return precautions for heavy persistent hematuria, inability to void, or fever > 38.5°C (post-procedural UTI ~1-2%). Pathology (if biopsies obtained) was scheduled for follow-up at 7-10 days. Surveillance interval was set per the underlying indication and AUA guidelines (every 3-6 months for high-risk NMIBC, annually for low-risk NMIBC, no further surveillance for negative microscopic hematuria workup with negative imaging and cytology).`,
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
