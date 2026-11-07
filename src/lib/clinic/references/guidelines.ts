// Hippo Clinic — specialty guideline registry.
//
// A small in-code list of major society guidelines per specialty +
// region. Used by the references add-on to suggest a relevant guideline
// alongside PubMed papers. We do NOT include guideline body text here —
// just citations and links. The LLM uses the title + region to decide
// whether a guideline is contextually appropriate; the clinician opens
// the URL to read the actual content.
//
// To add a guideline:
//   - Pick a stable slug ("aua-bph-2023")
//   - Set region = "US" | "CA" | "EU" | "INT" (international)
//   - List specialty (matches Profile.specialty values)
//   - Tag keywords (lowercase) that the suggestion matcher will use
//   - Note the year — we surface the most recent matching guideline first
//
// SCOPE: This is intentionally small. The point is high-signal coverage
// of the most common specialty topics. A clinician using a long-tail
// guideline will get PubMed hits instead. Premium-tier upgrade: license
// a curated medico-legal guideline database (Clinical Key, UpToDate
// references API) and replace this file.

export type GuidelineRegion = "US" | "CA" | "EU" | "INT";

export interface GuidelineEntry {
  id: string;
  title: string;
  organization: string;     // "AUA", "CUA", "EAU", "ASCO", "CCS", etc.
  region: GuidelineRegion;
  specialty: string;
  topics: string[];         // e.g. ["bph", "luts"]
  year: number;
  url: string;
}

export const GUIDELINES: GuidelineEntry[] = [
  // ── Urology ────────────────────────────────────────────────────────────
  // PSA + prostate cancer
  { id: "aua-early-detection-prostate-2023", organization: "AUA", region: "US",
    specialty: "Urology", topics: ["psa","prostate cancer screening","early detection","prostate cancer"],
    year: 2023, title: "Early Detection of Prostate Cancer: AUA/SUO Guideline (2023)",
    url: "https://www.auanet.org/guidelines-and-quality/guidelines/early-detection-of-prostate-cancer-(2023)" },
  { id: "cua-prostate-cancer-screening-2022", organization: "CUA", region: "CA",
    specialty: "Urology", topics: ["psa","prostate cancer screening","prostate cancer"],
    year: 2022, title: "CUA Guideline on Prostate Cancer Screening and Early Diagnosis (2022)",
    url: "https://cuaj.ca/index.php/journal/issue/archive" },
  { id: "eau-prostate-cancer-2024", organization: "EAU", region: "EU",
    specialty: "Urology", topics: ["prostate cancer","psa","mri","gleason","grade group","active surveillance"],
    year: 2024, title: "EAU Guidelines on Prostate Cancer (2024)",
    url: "https://uroweb.org/guidelines/prostate-cancer" },

  // BPH / LUTS
  { id: "aua-bph-2023", organization: "AUA", region: "US",
    specialty: "Urology", topics: ["bph","luts","prostatic enlargement","ipss","alpha blocker","5-ari"],
    year: 2023, title: "Management of Lower Urinary Tract Symptoms Attributed to Benign Prostatic Hyperplasia: AUA Guideline (2023)",
    url: "https://www.auanet.org/guidelines-and-quality/guidelines/benign-prostatic-hyperplasia-(2023)" },
  { id: "cua-bph-2018", organization: "CUA", region: "CA",
    specialty: "Urology", topics: ["bph","luts","prostatic enlargement"],
    year: 2018, title: "CUA Guideline on Male Lower Urinary Tract Symptoms / Benign Prostatic Hyperplasia (2018)",
    url: "https://cuaj.ca" },
  { id: "eau-male-luts-2024", organization: "EAU", region: "EU",
    specialty: "Urology", topics: ["bph","luts","prostatic enlargement"],
    year: 2024, title: "EAU Guidelines on the Management of Non-Neurogenic Male LUTS (2024)",
    url: "https://uroweb.org/guidelines/management-of-non-neurogenic-male-luts" },

  // Hematuria
  { id: "aua-hematuria-2020", organization: "AUA", region: "US",
    specialty: "Urology", topics: ["hematuria","microhematuria","gross hematuria","bladder cancer"],
    year: 2020, title: "Microhematuria: AUA/SUFU Guideline (2020)",
    url: "https://www.auanet.org/guidelines-and-quality/guidelines/microhematuria" },
  { id: "cua-hematuria-2021", organization: "CUA", region: "CA",
    specialty: "Urology", topics: ["hematuria","microhematuria","gross hematuria"],
    year: 2021, title: "CUA Guideline on the Investigation of Hematuria (2021)",
    url: "https://cuaj.ca" },

  // Stones
  { id: "aua-stones-medical-2023", organization: "AUA", region: "US",
    specialty: "Urology", topics: ["kidney stones","nephrolithiasis","urolithiasis","metabolic workup","24 hour urine"],
    year: 2023, title: "Medical Management of Kidney Stones: AUA Guideline (2023)",
    url: "https://www.auanet.org/guidelines-and-quality/guidelines/kidney-stones-medical-management-guideline" },
  { id: "aua-stones-surgical-2023", organization: "AUA", region: "US",
    specialty: "Urology", topics: ["kidney stones","nephrolithiasis","urolithiasis","ureteroscopy","pcnl","swl"],
    year: 2023, title: "Surgical Management of Stones: AUA/Endourological Society Guideline (2023)",
    url: "https://www.auanet.org/guidelines-and-quality/guidelines/kidney-stones-surgical-management-guideline" },
  { id: "eau-urolithiasis-2024", organization: "EAU", region: "EU",
    specialty: "Urology", topics: ["kidney stones","nephrolithiasis","urolithiasis"],
    year: 2024, title: "EAU Guidelines on Urolithiasis (2024)",
    url: "https://uroweb.org/guidelines/urolithiasis" },

  // Recurrent UTI
  { id: "aua-rUTI-2022", organization: "AUA", region: "US",
    specialty: "Urology", topics: ["recurrent uti","ruti","urinary tract infection"],
    year: 2022, title: "Recurrent Uncomplicated Urinary Tract Infections in Women: AUA/CUA/SUFU Guideline (2022 amendment)",
    url: "https://www.auanet.org/guidelines-and-quality/guidelines/recurrent-uti" },

  // Bladder cancer / NMIBC
  { id: "aua-nmibc-2024", organization: "AUA", region: "US",
    specialty: "Urology", topics: ["nmibc","bladder cancer","bcg","turbt","cystoscopy"],
    year: 2024, title: "Diagnosis and Treatment of Non-Muscle Invasive Bladder Cancer: AUA/SUO Guideline (2024 amendment)",
    url: "https://www.auanet.org/guidelines-and-quality/guidelines/non-muscle-invasive-bladder-cancer-(nmibc)-guideline" },
  { id: "eau-nmibc-2024", organization: "EAU", region: "EU",
    specialty: "Urology", topics: ["nmibc","bladder cancer","bcg"],
    year: 2024, title: "EAU Guidelines on Non-Muscle-Invasive Bladder Cancer (2024)",
    url: "https://uroweb.org/guidelines/non-muscle-invasive-bladder-cancer" },

  // Renal mass
  { id: "aua-renal-mass-2021", organization: "AUA", region: "US",
    specialty: "Urology", topics: ["renal mass","kidney cancer","rcc","partial nephrectomy"],
    year: 2021, title: "Renal Mass and Localized Renal Cancer: Evaluation, Management, and Follow-up: AUA Guideline (2021)",
    url: "https://www.auanet.org/guidelines-and-quality/guidelines/renal-mass-and-localized-renal-cancer-evaluation-management-and-follow-up" },
  { id: "eau-rcc-2024", organization: "EAU", region: "EU",
    specialty: "Urology", topics: ["renal mass","kidney cancer","rcc"],
    year: 2024, title: "EAU Guidelines on Renal Cell Carcinoma (2024)",
    url: "https://uroweb.org/guidelines/renal-cell-carcinoma" },

  // ED / male sexual health
  { id: "aua-ed-2018", organization: "AUA", region: "US",
    specialty: "Urology", topics: ["erectile dysfunction","ed","pde5","testosterone"],
    year: 2018, title: "Erectile Dysfunction: AUA Guideline (2018)",
    url: "https://www.auanet.org/guidelines-and-quality/guidelines/erectile-dysfunction-(ed)-guideline" },
  { id: "eau-sexual-health-2024", organization: "EAU", region: "EU",
    specialty: "Urology", topics: ["erectile dysfunction","ed","peyronie","ejaculation"],
    year: 2024, title: "EAU Guidelines on Sexual and Reproductive Health (2024)",
    url: "https://uroweb.org/guidelines/sexual-and-reproductive-health" },

  // Incontinence
  { id: "aua-incontinence-2023", organization: "AUA", region: "US",
    specialty: "Urology", topics: ["incontinence","stress incontinence","urge incontinence","oab","sling"],
    year: 2023, title: "Incontinence after Prostate Treatment: AUA/SUFU Guideline (2023)",
    url: "https://www.auanet.org/guidelines-and-quality/guidelines/incontinence-after-prostate-treatment" },

  // Vasectomy
  { id: "aua-vasectomy-2015", organization: "AUA", region: "US",
    specialty: "Urology", topics: ["vasectomy","male sterilization","semen analysis"],
    year: 2015, title: "AUA Vasectomy Guideline (2015, reviewed 2020)",
    url: "https://www.auanet.org/guidelines-and-quality/guidelines/vasectomy-guideline" },

  // Male infertility
  { id: "aua-male-infertility-2024", organization: "AUA", region: "US",
    specialty: "Urology", topics: ["male infertility","semen analysis","varicocele","azoospermia"],
    year: 2024, title: "Diagnosis and Treatment of Infertility in Men: AUA/ASRM Guideline (2024 update)",
    url: "https://www.auanet.org/guidelines-and-quality/guidelines/male-infertility" },

  // ── Family / Internal Medicine — anchor coverage ─────────────────────
  { id: "uspstf-prostate-screening-2018", organization: "USPSTF", region: "US",
    specialty: "Family Medicine", topics: ["psa","prostate cancer screening"],
    year: 2018, title: "USPSTF Recommendation: Screening for Prostate Cancer (2018)",
    url: "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/prostate-cancer-screening" },
  { id: "ctfphc-prostate-2014", organization: "CTFPHC", region: "CA",
    specialty: "Family Medicine", topics: ["psa","prostate cancer screening"],
    year: 2014, title: "Canadian Task Force on Preventive Health Care: Prostate Cancer Screening (2014)",
    url: "https://canadiantaskforce.ca/guidelines/published-guidelines/prostate-cancer/" },
  { id: "ccs-hypertension-2020", organization: "Hypertension Canada", region: "CA",
    specialty: "Family Medicine", topics: ["hypertension","blood pressure","htn"],
    year: 2020, title: "Hypertension Canada's 2020 Comprehensive Guidelines",
    url: "https://hypertension.ca/guidelines/" },
  { id: "esh-hypertension-2023", organization: "ESH", region: "EU",
    specialty: "Internal Medicine", topics: ["hypertension","blood pressure","htn"],
    year: 2023, title: "ESH Guidelines for the Management of Arterial Hypertension (2023)",
    url: "https://www.eshonline.org/guidelines/" },
];

/**
 * Match guidelines to a free-text claim. Returns up to `limit` highest-
 * scoring matches. Scoring is intentionally simple: number of distinct
 * topic keywords that appear in the claim, breaking ties by recency.
 */
export function findGuidelines(opts: {
  claim: string;
  regions: GuidelineRegion[];
  specialty?: string;
  limit?: number;
}): GuidelineEntry[] {
  const lc = opts.claim.toLowerCase();
  const limit = opts.limit ?? 2;
  const allowedRegions = new Set(opts.regions);

  const scored: Array<{ g: GuidelineEntry; score: number }> = [];
  for (const g of GUIDELINES) {
    if (!allowedRegions.has(g.region)) continue;
    if (opts.specialty && g.specialty !== opts.specialty && g.specialty !== "Family Medicine") continue;
    let score = 0;
    for (const topic of g.topics) {
      if (lc.includes(topic)) score += 2;
    }
    // Soft boost when the org name is mentioned (rare but useful).
    if (lc.includes(g.organization.toLowerCase())) score += 1;
    if (score > 0) scored.push({ g, score });
  }
  scored.sort((a, b) => (b.score - a.score) || (b.g.year - a.g.year));
  return scored.slice(0, limit).map((s) => s.g);
}
