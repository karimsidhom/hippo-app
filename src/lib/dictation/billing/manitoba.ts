// ---------------------------------------------------------------------------
// Manitoba-specific billing metadata layer for operative dictations
// ---------------------------------------------------------------------------
// Source: Manitoba Physician's Manual 2026
//
// Key Manitoba surgical billing rules this module encodes:
// - Major surgical services include 3 weeks postoperative care
// - Multiple services, same incision: highest at 100%, lesser at 75%
// - Multiple services, separate incisions: same 100% / 75% structure
// - Bilateral same session: first side 100%, second side 75%
// - Additional surgical service within 3 weeks but unrelated: 100%
// - Two surgeons: fee apportionment
// - Surgical assistant: medical necessity must be justifiable
// - Adhesiolysis add-on (3500/3501): must document total case time
//   AND total adhesiolysis time in the operative report
// ---------------------------------------------------------------------------

import type {
  BillingPrompt,
  DictationContext,
  ProcedureBillingCode,
  ProcedureBillingProfile,
  RenderedBillingOverlay,
} from "./types";

// ── Global surgical rules (apply to every Manitoba case) ────────────────────

export const MB_GLOBAL_SURGICAL_RULES: BillingPrompt[] = [
  {
    id: "mb-multiple-same-incision",
    label: "Same-incision multiple procedure rule",
    text: "If multiple distinct surgical services were performed through the same incision, document each procedure clearly so Manitoba billing can apply 100% to the highest-value service and 75% to the lesser service(s).",
    severity: "conditional",
    color: "#F59E0B",
    condition: (ctx) => !!ctx.sameIncisionMultipleProcedures,
  },
  {
    id: "mb-multiple-separate-incisions",
    label: "Separate-incision multiple procedure rule",
    text: "If multiple distinct surgical services were performed through separate incisions under the same anesthetic, document each incision and each procedure clearly for Manitoba multiple-procedure billing.",
    severity: "conditional",
    color: "#F59E0B",
    condition: (ctx) => !!ctx.separateIncisionMultipleProcedures,
  },
  {
    id: "mb-bilateral",
    label: "Bilateral same-session rule",
    text: "If bilateral surgery was performed during the same operative session, explicitly document laterality and that both sides were treated in the same anesthetic session.",
    severity: "conditional",
    color: "#F59E0B",
    condition: (ctx) =>
      ctx.bilateralSameSession === true || ctx.laterality === "bilateral",
  },
  {
    id: "mb-assistant",
    label: "Surgical assistant necessity",
    text: "If a surgical assistant was used, document why assistant participation was medically necessary.",
    severity: "conditional",
    color: "#F97316",
    condition: (ctx) => !!ctx.assistantUsed,
  },
  {
    id: "mb-two-surgeons",
    label: "Two-surgeon apportionment",
    text: "If two surgeons shared the case, document each surgeon's role and responsibility clearly to support fee apportionment.",
    severity: "conditional",
    color: "#F97316",
    condition: (ctx) => !!ctx.twoSurgeons,
  },
  {
    id: "mb-additional-service",
    label: "Additional surgical service within 3 weeks",
    text: "If this was an additional surgical service within 3 weeks of a prior surgery, document why it was unrelated versus due to a complication, since Manitoba billing treats these differently.",
    severity: "conditional",
    color: "#F59E0B",
    condition: (ctx) => !!ctx.additionalProcedureWithin3Weeks,
  },
];

// ── Procedure library ───────────────────────────────────────────────────────

export const MB_PROCEDURE_LIBRARY: Record<string, ProcedureBillingProfile> = {
  // ── Adhesiolysis add-on ──────────────────────────────────────────────────
  adhesiolysis_add_on: {
    procedureKey: "adhesiolysis_add_on",
    displayName: "Intra-operative Lysis of Adhesions",
    province: "MB",
    codes: [
      {
        code: "3500",
        label: "Lysis of Adhesions, first full 30 minutes",
        fee: "227.63",
        notes: [
          "Claimable with surgical services in sections I, J, K, M, N, and O.",
          "Operative report must clearly state total surgical case time and total lysis-of-adhesions time.",
        ],
      },
      {
        code: "3501",
        label:
          "Lysis of Adhesions, each additional 15 minutes or major portion thereof",
        fee: "113.82",
        notes: [
          "Use only when time thresholds are met and documented clearly in the operative report.",
        ],
      },
    ],
    prompts: [
      {
        id: "mb-adhesiolysis-case-time",
        label: "Billing-critical case time",
        text: "Billing-critical: state the TOTAL surgical case time explicitly.",
        severity: "required",
        color: "#DC2626",
        requiredForCodes: ["3500", "3501"],
        condition: (ctx) => !!ctx.performedLysisOfAdhesions,
      },
      {
        id: "mb-adhesiolysis-lysis-time",
        label: "Billing-critical adhesiolysis time",
        text: "Billing-critical: state the TOTAL time spent performing lysis of adhesions explicitly.",
        severity: "required",
        color: "#DC2626",
        requiredForCodes: ["3500", "3501"],
        condition: (ctx) => !!ctx.performedLysisOfAdhesions,
      },
      {
        id: "mb-adhesiolysis-extent",
        label: "Recommended operative detail",
        text: "Recommended: describe density/extent/location of adhesions and why adhesiolysis was required to safely complete the primary operation.",
        severity: "recommended",
        color: "#F59E0B",
        requiredForCodes: ["3500", "3501"],
        condition: (ctx) => !!ctx.performedLysisOfAdhesions,
      },
    ],
    footerRules: [
      "Append Manitoba tariff codes at end of draft dictation.",
      "If lysis time is missing, do not suggest 3500/3501 as billable-ready.",
    ],
  },

  // ── Urology procedures ───────────────────────────────────────────────────
  turbt: {
    procedureKey: "turbt",
    displayName: "Transurethral Resection of Bladder Tumour (TURBT)",
    province: "MB",
    codes: [
      {
        code: "5797",
        label: "Resection of bladder tumour, transurethral",
        fee: "403.30",
      },
    ],
    prompts: [
      {
        id: "mb-turbt-tumour-details",
        label: "Tumour documentation",
        text: "Document number, size, location, and appearance of tumour(s). Note whether muscle was visible in resection base.",
        severity: "recommended",
        color: "#F59E0B",
      },
      {
        id: "mb-turbt-bimanual",
        label: "Bimanual exam",
        text: "Document bimanual examination findings before and after resection (mobile vs. fixed).",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [
      "If multiple tumours at different sites, document each site for potential add-on codes.",
    ],
  },

  cystoscopy: {
    procedureKey: "cystoscopy",
    displayName: "Cystoscopy",
    province: "MB",
    codes: [
      {
        code: "5770",
        label: "Cystoscopy, diagnostic",
        fee: "101.55",
      },
    ],
    prompts: [
      {
        id: "mb-cysto-findings",
        label: "Cystoscopy findings",
        text: "Document urethra, prostate (if male), bladder mucosa, ureteral orifices, and any pathology seen.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [],
  },

  radical_prostatectomy: {
    procedureKey: "radical_prostatectomy",
    displayName: "Radical Prostatectomy",
    province: "MB",
    codes: [
      {
        code: "5764",
        label: "Radical prostatectomy",
        fee: "1150.95",
      },
    ],
    prompts: [
      {
        id: "mb-rp-nerve-sparing",
        label: "Nerve-sparing documentation",
        text: "Document whether nerve-sparing was performed, laterality, and technique used.",
        severity: "recommended",
        color: "#F59E0B",
      },
      {
        id: "mb-rp-lymph-nodes",
        label: "Lymph node dissection",
        text: "If pelvic lymph node dissection performed, document extent (standard vs. extended) and laterality for separate billing.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [
      "Pelvic lymph node dissection may be billed separately if documented as distinct procedure.",
    ],
  },

  nephrectomy: {
    procedureKey: "nephrectomy",
    displayName: "Nephrectomy (Partial or Radical)",
    province: "MB",
    codes: [
      {
        code: "5730",
        label: "Nephrectomy, radical",
        fee: "866.25",
      },
      {
        code: "5731",
        label: "Nephrectomy, partial",
        fee: "1039.50",
      },
    ],
    prompts: [
      {
        id: "mb-neph-laterality",
        label: "Laterality",
        text: "Document laterality (left/right) explicitly.",
        severity: "required",
        color: "#DC2626",
      },
      {
        id: "mb-neph-approach",
        label: "Surgical approach",
        text: "Document approach clearly (open, laparoscopic, robotic-assisted). If conversion occurred, document reason.",
        severity: "recommended",
        color: "#F59E0B",
      },
      {
        id: "mb-neph-ischemia",
        label: "Ischemia time (partial)",
        text: "For partial nephrectomy: document warm ischemia time, clamping technique, and method of renorrhaphy.",
        severity: "required",
        color: "#DC2626",
        condition: (ctx) =>
          ctx.procedureKey === "nephrectomy" ||
          ctx.procedureKey.includes("partial"),
      },
    ],
    footerRules: [],
  },

  ureteroscopy: {
    procedureKey: "ureteroscopy",
    displayName: "Ureteroscopy with Laser Lithotripsy",
    province: "MB",
    codes: [
      {
        code: "5785",
        label: "Ureteroscopy",
        fee: "262.40",
      },
      {
        code: "5786",
        label: "Ureteroscopy with lithotripsy/extraction",
        fee: "392.10",
      },
    ],
    prompts: [
      {
        id: "mb-urs-stone-details",
        label: "Stone documentation",
        text: "Document stone size, location, composition if known, and number of fragments. State whether stone-free or residual fragments remain.",
        severity: "recommended",
        color: "#F59E0B",
      },
      {
        id: "mb-urs-stent",
        label: "Stent placement",
        text: "If ureteral stent placed, document size, length, and planned removal date. Stent insertion may be billed separately.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [
      "Stent insertion/removal may be billed as separate tariff if documented.",
    ],
  },

  circumcision: {
    procedureKey: "circumcision",
    displayName: "Circumcision",
    province: "MB",
    codes: [
      {
        code: "5800",
        label: "Circumcision, adult",
        fee: "195.80",
      },
    ],
    prompts: [
      {
        id: "mb-circ-indication",
        label: "Medical indication",
        text: "Document the medical indication for circumcision (phimosis, paraphimosis, recurrent balanitis, etc.).",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [],
  },

  // ── General surgery procedures ────────────────────────────────────────────
  cholecystectomy: {
    procedureKey: "cholecystectomy",
    displayName: "Cholecystectomy",
    province: "MB",
    codes: [
      {
        code: "4353",
        label: "Cholecystectomy, laparoscopic",
        fee: "510.20",
      },
      {
        code: "4350",
        label: "Cholecystectomy, open",
        fee: "510.20",
      },
    ],
    prompts: [
      {
        id: "mb-chole-critical-view",
        label: "Critical View of Safety",
        text: "Document achievement of Critical View of Safety (CVS) with two structures entering the gallbladder and hepatocystic triangle cleared.",
        severity: "required",
        color: "#DC2626",
      },
      {
        id: "mb-chole-cholangiogram",
        label: "Intraoperative cholangiogram",
        text: "If intraoperative cholangiogram performed, document findings. This may support a separate billing code.",
        severity: "conditional",
        color: "#F59E0B",
        condition: () => true, // always show as reminder
      },
    ],
    footerRules: [
      "If converted from laparoscopic to open, document reason for conversion clearly.",
    ],
  },

  appendectomy: {
    procedureKey: "appendectomy",
    displayName: "Appendectomy",
    province: "MB",
    codes: [
      {
        code: "4312",
        label: "Appendectomy, laparoscopic",
        fee: "347.75",
      },
      {
        code: "4310",
        label: "Appendectomy, open",
        fee: "347.75",
      },
    ],
    prompts: [
      {
        id: "mb-appy-findings",
        label: "Appendix findings",
        text: "Document gross appearance of appendix (inflamed, perforated, gangrenous, normal). Document state of peritoneal cavity.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [],
  },

  hernia_repair: {
    procedureKey: "hernia_repair",
    displayName: "Hernia Repair (Inguinal/Umbilical/Ventral)",
    province: "MB",
    codes: [
      {
        code: "4220",
        label: "Inguinal hernia repair, unilateral",
        fee: "347.50",
      },
      {
        code: "4224",
        label: "Inguinal hernia repair, laparoscopic, unilateral",
        fee: "451.75",
      },
      {
        code: "4240",
        label: "Umbilical/ventral hernia repair",
        fee: "347.50",
      },
    ],
    prompts: [
      {
        id: "mb-hernia-laterality",
        label: "Laterality (inguinal)",
        text: "For inguinal hernia: document laterality explicitly (left/right/bilateral). Bilateral = separate billing at reduced rate for second side.",
        severity: "required",
        color: "#DC2626",
      },
      {
        id: "mb-hernia-mesh",
        label: "Mesh documentation",
        text: "If mesh used, document type, size, and fixation method. Mesh placement may affect billing.",
        severity: "recommended",
        color: "#F59E0B",
      },
      {
        id: "mb-hernia-recurrent",
        label: "Recurrent hernia",
        text: "If recurrent hernia repair, document clearly as recurrent — Manitoba may allow a higher tariff.",
        severity: "conditional",
        color: "#F59E0B",
        condition: () => true,
      },
    ],
    footerRules: [
      "Bilateral inguinal hernia: first side 100%, second side 75%.",
    ],
  },

  colectomy: {
    procedureKey: "colectomy",
    displayName: "Colectomy (Partial or Total)",
    province: "MB",
    codes: [
      {
        code: "4320",
        label: "Colectomy, partial (hemicolectomy)",
        fee: "749.25",
      },
      {
        code: "4325",
        label: "Colectomy, total",
        fee: "1039.50",
      },
    ],
    prompts: [
      {
        id: "mb-colectomy-extent",
        label: "Resection extent",
        text: "Document extent of resection (right hemicolectomy, left hemicolectomy, sigmoid, total). Include proximal and distal margins.",
        severity: "required",
        color: "#DC2626",
      },
      {
        id: "mb-colectomy-anastomosis",
        label: "Anastomosis details",
        text: "Document anastomosis type (stapled vs. hand-sewn, end-to-end vs. side-to-side) and leak test if performed.",
        severity: "recommended",
        color: "#F59E0B",
      },
    ],
    footerRules: [
      "If combined with adhesiolysis >= 30 minutes, add tariff 3500.",
    ],
  },

  // ── Scaffold for future procedures ────────────────────────────────────────
  open_lysis_example_primary: {
    procedureKey: "open_lysis_example_primary",
    displayName:
      "Open abdominal procedure with possible adhesiolysis add-on",
    province: "MB",
    codes: [],
    prompts: [],
    footerRules: [
      "This primary procedure should have its own Manitoba tariff(s) mapped separately.",
      "Add tariff 3500/3501 only when documented criteria are met.",
    ],
  },
};

// ── Procedure name → billing key resolver ───────────────────────────────────

const PROCEDURE_NAME_PATTERNS: [RegExp, string][] = [
  [/\bturbt\b/i, "turbt"],
  [/\btransurethral.+bladder\b/i, "turbt"],
  [/\bcystoscop/i, "cystoscopy"],
  [/\bradical\s+prostatectom/i, "radical_prostatectomy"],
  [/\bnephrectom/i, "nephrectomy"],
  [/\bureteroscop/i, "ureteroscopy"],
  [/\blithotrips/i, "ureteroscopy"],
  [/\bcircumcis/i, "circumcision"],
  [/\bcholecystectom/i, "cholecystectomy"],
  [/\bappendectom/i, "appendectomy"],
  [/\bhernia\s+repair/i, "hernia_repair"],
  [/\binguinal\s+hernia/i, "hernia_repair"],
  [/\bumbilical\s+hernia/i, "hernia_repair"],
  [/\bventral\s+hernia/i, "hernia_repair"],
  [/\bcolectom/i, "colectomy"],
  [/\bhemicolectom/i, "colectomy"],
  [/\badhesiolysis\b/i, "adhesiolysis_add_on"],
  [/\blysis\s+of\s+adhesion/i, "adhesiolysis_add_on"],
];

/**
 * Resolve a free-text procedure name to zero or more billing profile keys.
 * Returns the primary procedure key plus any detected add-ons.
 */
export function resolveBillingKeys(procedureName: string): string[] {
  if (!procedureName) return [];
  const keys: string[] = [];
  for (const [pattern, key] of PROCEDURE_NAME_PATTERNS) {
    if (pattern.test(procedureName) && !keys.includes(key)) {
      keys.push(key);
    }
  }
  return keys;
}

// ── Billing overlay builder ─────────────────────────────────────────────────

/**
 * Evaluate all applicable billing rules for a set of procedures and context.
 * Returns the prompts, codes, warnings, and footer text for the dictation UI.
 */
export function getBillingOverlay(
  procedureKeys: string[],
  ctx: DictationContext,
): RenderedBillingOverlay {
  const visiblePrompts: BillingPrompt[] = [];
  const billableCodes: ProcedureBillingCode[] = [];
  const warnings: string[] = [];

  // 1. Evaluate global Manitoba surgical rules
  for (const globalPrompt of MB_GLOBAL_SURGICAL_RULES) {
    if (!globalPrompt.condition || globalPrompt.condition(ctx)) {
      visiblePrompts.push(globalPrompt);
    }
  }

  // 2. Evaluate per-procedure rules and codes
  for (const key of procedureKeys) {
    const profile = MB_PROCEDURE_LIBRARY[key];
    if (!profile) continue;

    for (const prompt of profile.prompts) {
      if (!prompt.condition || prompt.condition(ctx)) {
        visiblePrompts.push(prompt);
      }
    }

    for (const code of profile.codes) {
      // ── Adhesiolysis-specific gating ──
      if (code.code === "3500") {
        if (
          ctx.performedLysisOfAdhesions &&
          (ctx.lysisMinutes ?? 0) >= 30
        ) {
          billableCodes.push(code);
        }
        continue;
      }

      if (code.code === "3501") {
        if (
          ctx.performedLysisOfAdhesions &&
          (ctx.lysisMinutes ?? 0) > 30
        ) {
          billableCodes.push(code);
        }
        continue;
      }

      // ── Default: include all non-gated codes for the procedure ──
      billableCodes.push(code);
    }
  }

  // 3. Emit warnings for missing adhesiolysis documentation
  if (ctx.performedLysisOfAdhesions) {
    if (!ctx.totalCaseMinutes) {
      warnings.push(
        "Missing total surgical case time for adhesiolysis billing support.",
      );
    }
    if (!ctx.lysisMinutes) {
      warnings.push(
        "Missing total time spent performing lysis of adhesions.",
      );
    }
  }

  const footerText = buildBillingFooter(billableCodes, warnings);
  return { visiblePrompts, footerText, billableCodes, warnings };
}

// ── Footer builder ──────────────────────────────────────────────────────────

function buildBillingFooter(
  codes: ProcedureBillingCode[],
  warnings: string[],
): string {
  const codeLines = codes.length
    ? codes
        .map(
          (c) =>
            `- ${c.code}: ${c.label}${c.fee ? ` ($${c.fee})` : ""}`,
        )
        .join("\n")
    : "- No Manitoba tariff codes auto-attached yet.";

  const warningLines = warnings.length
    ? "\n\nBilling review warnings:\n" +
      warnings.map((w) => `- ${w}`).join("\n")
    : "";

  return `Manitoba Billing Codes\n${codeLines}${warningLines}`;
}

/**
 * Build the billing footer text that gets appended to the operative report.
 * Only includes codes that passed gating. Designed for copy/paste into
 * the hospital dictation system.
 */
export function buildDictationBillingSection(
  procedureKeys: string[],
  ctx: DictationContext,
): string {
  const overlay = getBillingOverlay(procedureKeys, ctx);

  if (overlay.billableCodes.length === 0 && overlay.warnings.length === 0) {
    return "";
  }

  const lines: string[] = [];
  lines.push("");
  lines.push("--- MANITOBA BILLING CODES ---");

  for (const code of overlay.billableCodes) {
    lines.push(`Tariff ${code.code}: ${code.label}${code.fee ? ` ($${code.fee})` : ""}`);
    if (code.notes) {
      for (const note of code.notes) {
        lines.push(`  Note: ${note}`);
      }
    }
  }

  if (overlay.warnings.length > 0) {
    lines.push("");
    lines.push("BILLING REVIEW WARNINGS:");
    for (const w of overlay.warnings) {
      lines.push(`* ${w}`);
    }
  }

  return lines.join("\n");
}
