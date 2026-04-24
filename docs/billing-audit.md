# Manitoba Billing Code Audit — IN PROGRESS

**Status:** The tariff codes in `src/lib/dictation/billing/manitoba.ts` were
compiled during early development and have NOT been verified against the
current Manitoba Physician's Manual (April 2026 edition). Initial spot
check found that **every code sampled is wrong** — wrong code numbers,
wrong fees, and in at least one case a code that maps to an entirely
different specialty.

Source of truth for this audit:
https://www.gov.mb.ca/health/documents/physmanual.pdf (April 2026)

## Immediate mitigation (shipped)

- `src/components/dictation/BillingOverlayPanel.tsx` now renders a red
  warning above any code ("Codes pending audit — do not submit without
  verifying"), and the code chips render amber + dashed border instead
  of green + solid (subtle visual cue that these are suggestions, not
  authority).
- Section header changed from "Tariff Codes" to "Suggested codes
  (unverified)".
- No automatic code replacement has been made — the stale codes stay in
  the file until each line is verified.

## Sampled discrepancies (confirmed wrong)

| Procedure | Hippo code | Hippo fee | Real code | Real fee | Source line |
|---|---|---|---|---|---|
| Resection bladder tumour (TURBT, small) | 5797 | $403.30 | **3922** | **$459.54** | manual line 21134 |
| Resection bladder tumour (TURBT, large) | 5797 | $403.30 | **3924** | **$543.73** | manual line 21150 |
| Radical prostatectomy (perineal) | 5764 | $1,150.95 | **4313** | **$1,507.13** | manual line 21511 |
| Combined radical prostatectomy + staging LND | 5764 | $1,150.95 | **4320** | **$1,923.50** | manual line 21514 |
| Radical nephrectomy (thoracic approach, open) | 5730 | $866.25 | **3823** | (see manual) | manual line 20968 |
| Nephrectomy, with partial ureterectomy | 5730 | $866.25 | **3821** | **$1,208.00** | manual line 20965 |
| Heminephrectomy | — | — | **3824** | **$1,585.76** | manual line 20963 |
| Laparoscopic radical nephrectomy | — | — | **3809** | (see manual) | manual line 20988 |
| Laparoscopic partial nephrectomy | — | — | **3816** | (see manual) | manual line 20990 |
| Radical cystectomy | — | — | **3995** | **$2,064.05** | manual line 21163 |
| Cystoscopy, diagnostic (initial) | (not clearly sized) | — | **3931** | **$97.85** | manual line 20934 |
| Cystoscopy with biopsy | — | — | **3933** | **$130.98** | manual line 20936 |
| Cystoscopy with needle biopsy of prostate | — | — | **3927** | **$142.61** | manual line 20938 |
| Cystoscopy with ureteral catheterization ± retrograde | — | — | **3928** | — | manual line 20939 |
| Biopsy, open renal (independent) | — | — | **3819** | **$415.50** | manual line 20960 |
| Biopsy, kidney needle | — | — | **3820** | **$145.18** | manual line 20956 |
| Cyst of kidney, excision | — | — | **3827** | **$511.81** | manual line 20961 |
| Nephrolithotomy (incl. staghorn) | — | — | **3811** | **$988.87** | manual line 20992 |
| Cystoplasty (YV-plasty etc.) | — | — | **3967** | **$715.22** | manual line 21105 |
| Vesicourethroplasty (Tanagho) | — | — | **3968** | **$729.74** | manual line 21106 |
| Hydraulic urinary sphincter, insertion | — | — | **3969** | **$1,003.92** | manual line 21112 |
| Ileal loop (without cystectomy) | — | — | **3952** | **$1,538.61** | manual line 21157 |
| Bladder augmentation with intestine/stomach | — | — | **3953** | **$1,309.55** | manual line 21138 |
| Intravesical Botulinum toxin injection | — | — | **3950** | **$281.54** | manual line 21141 |
| Collagen injection periurethral/ureteral | — | — | **3954** | **$317.73** | manual line 21154 |
| Litholapaxy (bladder calculus) | — | — | **3951** | **$364.48** | manual line 21156 |
| Female bladder neck, TU resection | — | — | **3918** | **$376.26** | manual line 21103 |

## Sampled match (looks correct)

| Procedure | Hippo code | Hippo fee | Real code | Real fee | Status |
|---|---|---|---|---|---|
| Lysis of Adhesions, first 30 min | 3500 | $227.63 | **3500** | **$227.63** | ✓ matches |
| Lysis of Adhesions, each addt'l 15 min | 3501 | $113.82 | **3501** | **$113.82** | ✓ matches |

## Sections not yet audited

- All OB/GYN codes in Hippo (manitoba.ts lines for hysterectomy /
  cesarean / D&C / salpingectomy etc.)
- All General Surgery codes in Hippo (cholecystectomy, appendectomy,
  hernia repair, colectomy, mastectomy, thyroidectomy, etc.)
- All transurethral prostate codes (TURP variations, HoLEP)
- Ureteroscopy codes (URS with biopsy / stone / stent)
- PCNL codes
- ESWL codes
- Vasectomy / circumcision / orchiectomy
- Sacral neuromodulation
- Mid-urethral sling / Kelly plication / artificial urinary sphincter
- Pyeloplasty
- Urethroplasty

## Recommended path forward

1. **Immediate (shipped):** warning banner on every billing panel render;
   no automatic code replacement. Residents are told not to bill from
   these codes.

2. **Audit phase (manual review required):**
   - Use the extracted real codes in `/tmp/hippo-manual/manual.txt`
     (from pdftotext on the April 2026 manual) as the source of truth.
   - For each procedure in `src/lib/dictation/billing/manitoba.ts`,
     replace the `billingCodes` array with the verified code number,
     verified label, and verified fee.
   - Commit in small batches by specialty so changes are reviewable.
   - Re-enable the green "tariff codes" pill and remove the warning
     banner ONLY when a full specialty is verified.

3. **Rule documentation:** extract the "Rules of Application" from the
   manual (cross-billing, multi-procedure discounts, assistant tariffs,
   laterality, emergency premiums, after-hours, critical-care add-ons)
   and wire them into the billing prompt context so the UI surfaces
   the right modifiers.

4. **Re-audit cadence:** the manual is revised annually (April 1 each
   year). Add a calendar reminder to re-run this audit every April.

## How to continue this audit

The PDF has been extracted to `/tmp/hippo-manual/manual.txt` (26k lines,
layout-preserved). To find specific procedures:

```bash
# search by procedure name
grep -niE "hysterectomy|colectomy|cholecystectomy" /tmp/hippo-manual/manual.txt | head -30

# search by code range (e.g., 3800-3999 for urology surgical)
grep -nE "^[[:space:]]+3[89][0-9]{2}\*?[[:space:]]" /tmp/hippo-manual/manual.txt

# section by line number (e.g., urology surgical codes)
awk 'NR>=20930 && NR<=21230' /tmp/hippo-manual/manual.txt
```

The PDF is also saved at
`/Users/karimsidhom/.claude/projects/-Users-karimsidhom-Desktop-ClaudeStuff/<session>/tool-results/webfetch-*.pdf`
if re-extraction is needed.

## Do NOT

- Auto-replace codes from this audit without a second-pair review. A
  wrong code submission is a fraud risk, not just a billing inconvenience.
- Ship "fixes" that change numbers but not the underlying display UI
  trust treatment. The warning banner stays until a specialty is fully
  verified end-to-end.
- Scrape the manual directly from Hippo in production. It's a ~3MB PDF;
  fetching it at request time would be slow and fragile. The audit is
  a human-reviewed, build-time artifact.
