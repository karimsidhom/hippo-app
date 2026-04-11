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
