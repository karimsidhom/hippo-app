# Manitoba Billing Code Audit — April 2026 manual

**Status:** The tariff codes in `src/lib/dictation/billing/manitoba.ts` were
compiled during early development and are mostly WRONG. Initial spot
check found the 5700-series urology codes in Hippo don't exist as
urology codes at all — real code 5730 in the Manitoba manual is an
**ophthalmology entropion repair** ($345.19). A resident billing from
Hippo's current data would submit wrong codes.

Source of truth for this audit:
https://www.gov.mb.ca/health/documents/physmanual.pdf (April 1, 2026)

Local text extract: `/tmp/hippo-manual/manual.txt` (26k lines, layout-preserved via pdftotext).

## Immediate mitigation (shipped)

- `src/components/dictation/BillingOverlayPanel.tsx` now renders a red
  warning above every billing code ("Codes pending audit — do not
  submit without verifying").
- Code chips render **amber + dashed border** instead of green + solid
  — visual cue that these are suggestions, not billing authority.
- Section header relabelled "Suggested codes (unverified)".
- **No automatic code replacement has been made.** Stale codes stay in
  the file until each line is verified against the table below and
  swapped intentionally.

## How to use this document

For each row in the tables below, the **code** and **fee** columns come
directly from the April 2026 Manitoba manual. When replacing the
`billingCodes` array in `src/lib/dictation/billing/manitoba.ts`:

1. Find the procedure in Hippo's file.
2. Find the matching row(s) here.
3. Replace the code number, label, and fee.
4. Re-verify against the PDF — quote "trust but verify" — because the
   label wording here is my summary, not the manual's verbatim text.
5. Once a whole specialty is done, remove the "pending audit" warning
   in `BillingOverlayPanel.tsx` and flip chips back to green for that
   specialty.

Do this in small batches by specialty, not in one sweep. Commit each
specialty separately so a bad code is reviewable in isolation.

---

## Confirmed correct (do NOT change)

| Procedure | Hippo code | Real code | Fee | Source line |
|---|---|---|---|---|
| Lysis of Adhesions, first 30 min | 3500 | **3500** | **$227.63** | 12442 |
| Lysis of Adhesions, each addt'l 15 min | 3501 | **3501** | **$113.82** | 12443 |

---

## UROLOGY — real codes (replace Hippo's 5700-series)

### Prostate

| Procedure | Real code | Fee | Line |
|---|---|---|---|
| Radical prostatectomy, perineal | **4313** | $1,507.13 | 21511 |
| Simple prostatectomy, retropubic | **4318** | $730.82 | 21512 |
| Radical prostatectomy, retropubic | **4319** | $1,521.45 | 21513 |
| Combined radical prostatectomy + staging lymphadenectomy | **4320** | $1,923.50 | 21514 |
| Simple prostatectomy, suprapubic | **4316** | $730.82 | 21517 |
| **TURP** (transurethral, incl. postop bleeding control) | **4321** | $609.60 | 21518 |
| TURP revision within 12 months | **4324** | $379.96 | 21519 |
| Transurethral sphincterotomy, male | **4325** | $379.80 | 21520 |
| Prostate cryosurgery | **4310** | $1,339.78 | 21500 |
| Prostatic abscess, external drainage | **4301** | $178.89 | 21497 |
| Brachytherapy seed implantation (urologic component) | **4302** | $753.65 | line ~21501 |

**HoLEP note:** Manitoba does not have a distinct tariff for Holmium
Laser Enucleation of Prostate. It is billed under **4321** (transurethral
prostatectomy) regardless of energy source.

### Bladder

| Procedure | Real code | Fee | Line |
|---|---|---|---|
| **TURBT, small** (Tumor bladder, excision) | **3922** | $459.54 | 21134 |
| **TURBT, large** (transurethral resection) | **3924** | $543.73 | 21150 |
| Cystoscopy, diagnostic initial | **3931** | $97.85 | 20934 |
| Cystoscopy with biopsy | **3933** | $130.98 | 20936 |
| Cystoscopy with manometry | **3926** | $82.95 | 20937 |
| Cystoscopy with needle biopsy of prostate | **3927** | $142.61 | 20938 |
| Cystoscopy with ureteral catheterization / retrograde | **3928** | $133.34 | 20939/21017 |
| Cystoscopy with differential renal function | **3929** | $117.64 | 20942 |
| Cystoscopy + urethroscopy | **3930** | $97.85 | 20946 |
| Female bladder neck, transurethral resection | **3918** | $376.26 | 21103 |
| Bladder aspiration by needle | **3900** | $38.84 | 21066 |
| Suprapubic catheter by trocar | **3902** | $124.33 | 21066 |
| Diverticulum of bladder, transurethral roller ball | **3914** | $275.12 | 21117 |
| Diverticulum of bladder, excision | **3920** | $655.69 | 21116 |
| Intravesical Botulinum Toxin injection | **3950** | $281.54 | 21141 |
| Litholapaxy (bladder calculus) | **3951** | $364.48 | 21156 |
| Ileal loop (without cystectomy) | **3952** | $1,538.61 | 21157 |
| Bladder augmentation with intestine/stomach | **3953** | $1,309.55 | 21138 |
| Collagen injection periurethral/ureteral | **3954** | $317.73 | 21154 |
| Urachal cyst + umbilical hernia repair | **3960** | $414.91 | 21101 |
| Bladder injury / cystorrhaphy | **3961** | $563.51 | 21102 |
| Cutaneous vesicostomy | **3966** | $497.27 | 21104 |
| Cystoplasty (YV-plasty) | **3967** | $715.22 | 21105 |
| Vesicourethroplasty (Tanagho) | **3968** | $729.74 | 21106 |
| Hydraulic urinary sphincter, insertion | **3969** | $1,003.92 | 21112 |
| **Radical cystectomy** | **3995** | $2,064.05 | 21163 |
| Cystectomy + ileal conduit (add to 3995) | **3996** | $535.91 | 21164 |

### Kidney (open + laparoscopic)

| Procedure | Real code | Fee | Line |
|---|---|---|---|
| Biopsy of kidney, add-on at time of other op | **3818** | $33.28 | 20955 |
| Biopsy, kidney needle | **3820** | $145.18 | 20956 |
| Biopsy, open renal (independent) | **3819** | $415.50 | 20960 |
| Cyst of kidney, aspiration or injection | **3829** | $71.49 | 20957 |
| Cyst of kidney, excision | **3827** | $511.81 | 20961 |
| Perirenal abscess drainage | **3802** | $475.62 | 20997 |
| Perirenal insufflation | **3830** | $117.74 | 20958 |
| Aberrant renal vessels division (independent) | **3813** | $1,001.29 | 20959 |
| Nephrectomy + partial ureterectomy same incision | **3821** | $1,208.00 | 20965 |
| Nephrectomy + total ureterectomy WITH UVJ resection | **3822** | $1,514.27 | 20966 |
| Nephrectomy + total ureterectomy WITHOUT UVJ | **3825** | $1,199.42 | 20967 |
| **Radical nephrectomy** (thoracic approach, perinephric fat, etc.) | **3823** | — (confirm in PDF) | 20968 |
| Radical nephrectomy (alt) | **3810** | — | 20980 |
| Radical nephrectomy (alt) | **3814** | — | 20983 |
| Partial nephrectomy, complete vascular dissection | **3815** | — | 20986 |
| **Laparoscopic radical nephrectomy** | **3809** | — | 20988 |
| **Laparoscopic partial nephrectomy** | **3816** | — | 20990 |
| **Heminephrectomy** | **3824** | $1,585.76 | 20963 |
| Nephrolithotomy incl. staghorn | **3811** | $988.87 | 20992 |
| Renal fillet for staghorn | **3812** | $1,092.79 | 20993 |
| Pyeloplasty, open | **3831** | — (confirm) | 20998 |
| **Laparoscopic pyeloplasty** ± stent / cystoscopy | **3833** | — (confirm) | 21000 |
| Pyelotomy / pyelolithotomy | **3817** | $828.63 | 21002 |
| Fistula closure (pyelo/nephro-stomy) | **3845** | $718.96 | 20962 |

**Fees marked — (confirm)** mean the line in the PDF wraps and the
number wasn't on the extracted line. Pull it from the manual directly.

### PCNL (percutaneous transrenal, stones)

| Procedure | Real code | Fee | Line |
|---|---|---|---|
| Percutaneous nephrostomy for stone removal | **3872** | $308.90 | 21065 |
| Single stone removal, no lithotripsy, ± antegrade stent + tract dilation + nephroscopy | **3873** | $513.03 | 21065 |
| Above + nephrostomy at same sitting | **3875** | $929.54 | 21065 |
| With EH/US lithotripsy | **3878** | $815.70 | 21065 |
| Above + nephrostomy | **3879** | $835.42 | 21065 |
| Multiple stone removal, no lithotripsy | **3882** | $873.80 | 21070 |
| Above + nephrostomy | **3883** | $1,138.75 | 21070 |
| Multiple + lithotripsy | **3887** | $936.18 | 21070 |
| Above + nephrostomy | **3888** | $1,134.46 | 21070 |
| Repeat stone removal through original access | **3890** | $413.88 | 21070 |
| Repeat through new access (by same or different surgeon) | **3891/3892** | By Report | 21070 |

### Ureter

| Procedure | Real code | Fee | Line |
|---|---|---|---|
| Ureterolithotomy, upper ¾ | **3857** | $597.37 | 21047 |
| Ureterolithotomy, lower ¼ | **3858** | $624.97 | 21048 |
| Ureterectomy with bladder cuff (independent) | **3861** | $596.04 | 21038 |
| **Endoscopic ureteral stent insertion** | **3865** | $243.62 | 21033 |
| Bilateral stent insertion same sitting | **3866** | $355.32 | 21034 |
| **Endoscopic stent removal** | **3867** | $102.08 | 21037 |
| Ureteral tapering with neoureterocystostomy (add-on) | **3870** | $232.05 | 21042 |
| Ureteroplasty | **3871** | $859.87 | 21050 |
| Ureteropyelostomy | **3874** | $939.12 | 21050 |
| Ureteroneocystostomy, unilateral | **3876** | $804.68 | 21040 |
| Bilateral | **3877** | $1,256.39 | 21041 |
| Ureteroenterostomy, unilateral | **3880** | $638.53 | 21043 |
| Bilateral | **3881** | $722.31 | 21044 |
| Ureterostomy (transplant ureter to skin), unilateral | **3885** | $464.05 | 21045 |
| Bilateral | **3886** | $695.02 | 21046 |
| Ureteral fistula closure | **3895** | By Report | 21009 |
| Ureterocele open excision + reimplant | **3936** | $974.93 | 21039 |
| Ureteral calculus manipulation (incl. ureteroscopy) | **3937** | $235.05 | 21031 |
| Cystoscopy with ureteral meatotomy | **3939** | $201.40 | 20941 |
| Ureterocele fulguration or resection | **3945** | $293.84 | 21020 |

### Ureteroscopy (URS) / stones

| Procedure | Real code | Fee | Line |
|---|---|---|---|
| **Cystoscopy + diagnostic URS** (rigid or flexible) | **3958** | $329.75 | 21010 |
| Above + post-procedure ureteric stenting | **3956** | $477.88 | 21012 |
| **URS with calculus manipulation + removal** | **3959** | $566.83 | 21013 |
| **URS with EH or ultrasonic lithotripsy** | **3957** | $551.13 | 21015 |

### Urethra

| Procedure | Real code | Fee | Line |
|---|---|---|---|
| External urethrotomy, anterior | **3971** | $236.56 | 21217 |
| External urethrotomy, perineal | **3973** | $236.56 | 21218 |
| Collagen injection w/ fascial harvesting | **3974** | $580.06 | 21108 |
| Sling with fascia | **3970** | $675.73 | 21110 |
| Sling with prosthesis | **3972** | $611.31 | 21111 |
| Male meatotomy | **3977** | $103.97 | 21192 |
| Female meatotomy/meatoplasty | **3976** | $77.92 | 21193 |
| Periurethral abscess drainage | **3978** | $77.09 | 21186 |
| Urethral caruncle excision | **3981** | $126.25 | 21187 |
| Urethral fistula closure (generic) | **3982** | By Report | 21233 |
| Urethrovaginal fistula closure | **3983** | $417.36 | 21234 |
| Urethral diverticulum excision | **3991** | $408.91 | 21229 |
| Urethral polyps excision (with/without urethroscopy) | **3994** | $133.60 | 21219 |
| **Urethroplasty** | **4011** | By Report | 21209 |
| Urethral suspension, suprapubic (Marshall-Marchetti) | **4444** | $435.75 | 21728 |
| **Urethral sling for incontinence (TVT/TOT) ± cystocele repair** | **4485** | $587.09 | 21737 |
| Combined abdominovaginal 2-team urethral sling after failed sling | **4483** | (confirm) | 21707 |
| Abdominal vault suspension (sacrocolpopexy) ± mesh | **4498** | $571.28 | 21731 |

### Penis / scrotum / testis / vas

| Procedure | Real code | Fee | Line |
|---|---|---|---|
| **Circumcision, newborn** | **4122** | $258.32 | 21374 |
| **Circumcision, any other age (surgical excision)** | **4123** | $267.95 | 21375 |
| Prepuce dorsal/lateral split | **4101** | $92.95 | 21373 |
| Penis biopsy | **4111** | $63.13 | 21371 |
| Penile skin lesion excision | **4120** | $92.01 | 21371 |
| Partial amputation of penis | **4114** | $443.09 | ~21398 |
| Complete amputation of penis | **4115** | $696.84 | ~21398 |
| Nesbitt procedure (penile curvature) | **4133** | $353.81 | 21398 |
| Penile injection (ED, 2 claimable per course) | **4103** | $40.78 | 21383 |
| Hypospadias, one-stage | **4125** | $805.26 | 21393 |
| Release of chordee only | **4126** | $330.66 | 21393 |
| Hypospadias 2nd stage, penile | **4127** | $640.52 | 21394 |
| Scrotal hypospadias repair | **4128** | $543.52 | 21395 |
| Perineal hypospadias repair | **4129** | $604.50 | 21396 |
| Urethrocutaneous fistula closure | **4130** | $472.45 | 21397 |
| **Orchiectomy, simple, unilateral** | **4144** | $203.00 | 21420 |
| Inguinal approach testicular mass ± orchiectomy | **4148** | $324.35 | 21425 |
| **Orchiopexy** (any type ± hernia repair) | **4156** | $562.44 | 21426 |
| Testicular prosthesis | **4155** | $402.11 | 21423 |
| Epididymis abscess drainage | **4161** | $119.99 | 21435 |
| Epididymis exploration ± biopsy | **4163** | $150.65 | 21437 |
| Spermatocele excision ± epididymectomy | **4174** | $326.90 | 21440 |
| Epididymectomy, unilateral | **4176** | $332.27 | 21436 |
| Epididymovasostomy, unilateral | **4181** | $440.90 | 21438 |
| Hydrocele puncture aspiration | **4191** | $34.66 | 21446 |
| **Vasectomy**, partial/complete, uni or bilateral | **4241** | $212.97 | 21472 |
| Vasovasostomy, unilateral | **4251** | $292.44 | 21474 |
| Vasovasostomy, bilateral | **4252** | $775.94 | 21475 |
| **Hydrocele of spermatic cord, excision, unilateral** | **4271** | $277.29 | 21480 |
| **Varicocele excision, unilateral (independent)** | **4275** | $296.14 | 21481 |
| With hernia + hydrocele + varicocele | **4278** | $310.51 | 21482 |

### Urology — not in Manitoba's fee schedule (handle carefully)

- **ESWL** (extracorporeal shock wave lithotripsy): no distinct Manitoba
  tariff found in a text search of the 2026 manual. Likely billed under
  a diagnostic / by-report code — verify with your physician billing
  contact before claiming.
- **Sacral neuromodulation**: no distinct tariff found. Likely "By
  Report" under an unlisted urinary system code.
- **HoLEP** as noted — use **4321** (transurethral prostatectomy).
- **Laser BPH** variants (GreenLight, Thulium): same as HoLEP — **4321**.

Residents should flag any procedure not listed here for manual lookup.

---

## OB/GYN — real codes

| Procedure | Real code | Fee | Line |
|---|---|---|---|
| **Caesarean section** with or without sterilization | **4800** | $728.14 | 21958 |
| Caesarean hysterectomy | **4803** | $1,052.53 | 21957 |
| **Vaginal delivery after prior C-section** (add-on) | **4841** | $144.11 | 22058 |
| Lower cavity assisted delivery with forceps/vacuum (add-on) | **4848** | $49.31 | ~22068 |
| Shoulder dystocia (add-on) | **4810** | $141.71 | ~22070 |
| Incompetent cervix, suture | **4809** | $207.02 | ~22075 |
| Postpartum sterilization any method | **4562** | $243.32 | ~22076 |
| **D&C** (dilatation and curettage) | **4646** | $125.19 | 21644 |
| Curettage, aspiration technique (professional only) | **4613** | $45.44 | 21686 |
| D&C for hydatidiform mole | **4815** | $132.79 | ~21827 |
| Therapeutic abortion by D&C / suction | **4860** | $162.86 | 21679 |
| Therapeutic D&E | **4862** | $287.16 | 21682 |
| Abdominal hysterotomy (mole / previable fetus) | **4829** | $329.86 | 21829 |
| **Hysterectomy, vaginal** (± repair) | **4631** | $780.29 | 21691/21730 |
| **Hysterectomy, total (abdominal), ± adnexal** | **4617** | $622.73 | 21832 |
| **Hysterectomy, subtotal, ± adnexal** | **4621** | $617.44 | 21831 |
| **Hysterectomy, radical + pelvic lymphadenectomy** | **4627** | $1,074.34 | 21830 |
| **Obesity (BMI > 35) OR Stage 3-4 endometriosis, add to hysterectomy** | **4620** | $132.24 | 21834 |
| **LAVH** (laparoscopic assisted vaginal hysterectomy) add-on to 4631 or 4621 | **4607** | $249.86 | 21782 |
| **Laparoscopic radical hysterectomy + bilat pelvic LND** | **4609** | $1,819.89 | 21787 |
| **Myomectomy** | **4614** | $446.64 | 21856 |
| Intraoperative morcellation of fibroids (≥30 min add-on) | **4691** | $241.95 | ~21788 |
| **Oophorectomy**, unilateral or bilateral | **4583** | $406.97 | 21857 |
| Torsion of ovary, surgical reduction | **4582** | $468.62 | 21860 |
| **Salpingectomy or salpingo-oophorectomy**, total, uni or bilateral | **4545** | (see line 21863) | 21863 |
| Salpingo-oophorectomy with hysterectomy | **4586** | $994.83 | 21878 |
| **Treatment of endometriosis, first 30 min** | **4605** | $227.63 | ~21760 |
| **Treatment of endometriosis, each addt'l 15 min** | **4606** | $113.82 | ~21765 |
| Tuboplasty (salpingostomy) for infertility | **4551** | $467.26 | 21794 |
| Hysterosalpingostomy / midtubal anastomosis | **4694** | $690.41 | ~21851 |
| Salpingolysis / fimbrioplasty for infertility | **4608** | $366.77 | 21784 |
| Ectopic pregnancy, laparotomy removal | **4811** | $494.42 | 21814 |
| Sterilization any method | **4561** | $248.19 | ~21810 |
| **Diagnostic laparoscopy** | **3572** | $201.34 | ~21804 |
| Diagnostic lap followed by open op (add) | **3574** | $196.25 | ~21805 |
| Converted lap → open (add) | **3579** | $196.25 | ~21807 |
| Hysteroscopically-guided endometrial ablation | **4648** | $365.74 | 21693 |
| Botulinum injection for pelvic floor pain | **4670** | $281.54 | ~21790 |

### Important OBGYN rules (from the manual notes)

- Tariffs **4605 / 4606** (endometriosis treatment time): *lysis of
  adhesions (3500/3501) may NOT be claimed in addition*. Lysis is
  considered included in endometriosis tariffs.
- Tariffs **4605 / 4606** paid at 100% when claimed with additional
  surgical services (not the usual 50% multi-procedure reduction).
- Tariff **4608** (salpingolysis for infertility): *lysis of adhesions
  may NOT be claimed in addition*.
- Tariff **4691** (morcellation ≥30 min): claimable in addition to lap
  or vaginal hysterectomy, or laparoscopic myomectomy.
- **4620** (obesity / endometriosis hysterectomy add-on) requires BMI
  and weight documented in the claim; stage 3-4 endometriosis requires
  pathology documentation.

---

## GENERAL SURGERY — real codes (spot-checked, not exhaustive)

| Procedure | Real code | Fee | Line |
|---|---|---|---|
| **Appendectomy** | **3261** | $497.06 | 20607 |
| Appendectomy, perforated | **3262** | $497.06 | ~20608 |
| Appendectomy with abscess drainage | **3263** | $518.81 | ~20609 |
| **Colectomy, partial** ± anastomosis/colostomy | **3179** | $1,060.19 | 20613 |
| Total colectomy ± ileostomy | **3180** | $1,467.27 | ~20614 |
| Total colectomy + proctectomy, one surgeon | **3181** | $2,017.41 | 20615 |
| Mucosal proctectomy, ileal-anal pouch + ileostomy (J-pouch) | **3184** | $2,599.87 | ~20618 |
| **Cholecystectomy** | **3515** | $636.92 | 20787 |
| Gastrectomy, subtotal (<2/3) | **3115** | $1,249.53 | 20505 |
| Pancreaticoduodenectomy (Whipple) | **3551** | $3,423.60 | 20875 |
| Total pancreatectomy ± splenectomy | **3552** | $2,302.78 | 20876 |
| Distal pancreatectomy ± splenectomy | **3550** | $1,769.25 | 20874 |
| Splenectomy, as add-on | **3584** | $852.64 | 19691 |

### Hernia

| Procedure | Real code | Fee | Line |
|---|---|---|---|
| Inguinal hernia, initial | **3631** | $448.07 | 20064 |
| Femoral hernia, initial | **3646** | $448.07 | 20062 |
| Epigastric hernia, initial | **3663** | $350.59 | 20045 |
| Umbilical hernia | **3666** | $404.19 | 20047 |
| Incarcerated hernia, no bowel resection | **3633** | $556.83 | 20068 |
| Ventral (incisional) hernia repair ± prosthesis | **3661** | (confirm) | 20058 |
| Ventral massive incisional hernia | **3660** | (confirm) | 20060 |

### Breast

| Procedure | Real code | Fee | Line |
|---|---|---|---|
| Subcutaneous mastectomy, male or female | **0449** | $442.07 | 16410 |
| Partial mastectomy (lumpectomy), malignancy | **0442** | $315.86 | 16414 |
| Partial mastectomy + axillary node dissection | **0443** | $870.11 | 16415 |
| Simple complete mastectomy | **0457** | $478.78 | 16416 |
| Modified radical mastectomy (MRM) | **0471** | $919.36 | 16417 |
| Radical mastectomy | **0470** | $943.26 | 16418 |

### Endoscopy

| Procedure | Real code | Fee | Line |
|---|---|---|---|
| ERCP (endoscopic retrograde cholangio-pancreatography) | **3505** | $284.24 | 20748 |
| Cholangioscopy/Pancreatoscopy add-on to 3505/3506 | **3531** | $133.99 | 20760 |
| All biopsies via cholangioscope/pancreatoscope (max 1) | **3533** | (confirm) | 20762 |

### Thyroid

| Procedure | Real code | Fee | Line |
|---|---|---|---|
| Thyroidectomy, adenoma or cyst excision | **4911** | $696.36 | 22107 |

---

## Audit phase — recommended sequence

1. **Urology** first — it's the user's primary specialty and the
   highest-risk section (biggest fee differences + most currently
   wrong). Work through `manitoba.ts` procedure-by-procedure using
   the tables above, swap codes, swap fees, re-label. Commit per
   sub-section (prostate → bladder → kidney → URS → etc.) so each
   diff is reviewable. When the specialty is done: remove the
   warning banner gate for urology-keyed procedures.

2. **OBGYN** next, because the user has OBGYN dictation templates
   that benefit from matching codes.

3. **General surgery** last, because there are fewer Hippo-to-real
   discrepancies (cholecystectomy, appendectomy, hernia codes look
   plausible) and the stakes are lower — attendings typically handle
   billing here.

## Rules of Application to wire into the UI

The billing panel currently surfaces procedure-specific documentation
prompts. Once codes are verified, add these *system-level* rules so
the UI can warn when they apply:

- **Bilateral:** "100% first side, 75% second side, same sitting"
  applies to many urology codes (e.g., "Bilateral treatment of calculi
  is to be claimed at 100% for the first side and 75% for the second,
  at the same sitting" — manual line ~21060).
- **Multi-procedure discount:** multiple procedures in one operative
  session typically bill at 100% for the largest + 50% for subsequent
  (with noted exceptions like 4605/4606).
- **After-hours / weekend / holiday premiums:** captured in tables at
  manual line 15300-15497 (25% evening premium, 50% weekend/holiday,
  75% overnight — percentages are on the anesthesia/surgical unit
  basic values).
- **Assistant tariffs:** 20-27% of the primary surgical tariff
  depending on the unit-value column (visible in each code's line, in
  the right column — e.g., "22.750" for cholecystectomy assist
  eligibility).

## Don't / never

- Do NOT auto-replace codes programmatically. Every replacement is a
  human review.
- Do NOT scrape the manual from Hippo in production — it's a ~3MB PDF
  that changes once a year. Keep this as a static build-time artifact.
- Do NOT remove the unverified warning banner until a whole specialty
  section has been audited end-to-end.
- Do NOT ship code suggestions that expose fee amounts residents
  might treat as contractual without signing off on their
  up-to-date-ness. Consider removing the fee column from the UI
  entirely until legal reviews what's OK to display.

## Re-audit cadence

The Manitoba Physician's Manual is revised April 1 each year. Set a
calendar reminder for March to re-extract and re-diff:

```bash
curl -L -o ~/Desktop/physmanual-$(date +%Y).pdf \
  https://www.gov.mb.ca/health/documents/physmanual.pdf
pdftotext -layout ~/Desktop/physmanual-$(date +%Y).pdf \
  ~/Desktop/physmanual-$(date +%Y).txt
diff /tmp/hippo-manual/manual.txt ~/Desktop/physmanual-$(date +%Y).txt
```

Any non-trivial diff means codes may have shifted — re-check every
affected line in `manitoba.ts` before the new fee year starts.
