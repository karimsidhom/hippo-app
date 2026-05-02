// ---------------------------------------------------------------------------
// Smart column mapping for case-log imports
//
// Recognises common case-log column names and maps them to Hippo CaseLog
// fields. Unrecognised columns are NEVER discarded — they go into
// imported_metadata so the user can search them later or copy into notes.
// ---------------------------------------------------------------------------

// The canonical Hippo CaseLog fields the importer can populate.
export type HippoField =
  | "caseDate"
  | "procedureName"
  | "specialtyId"
  | "procedureCategory"
  | "role"
  | "autonomyLevel"
  | "attendingLabel"
  | "institutionSite"
  | "surgicalApproach"
  | "diagnosisCategory"
  | "outcomeCategory"
  | "complicationCategory"
  | "notes"
  | "operativeDurationMinutes"
  | "patientAgeBin";

export interface MappingCandidate {
  field: HippoField;
  /** Header patterns (lowercased substring match). First match wins. */
  patterns: string[];
}

const MAPPING_TABLE: MappingCandidate[] = [
  {
    field: "caseDate",
    patterns: [
      "date",
      "case date",
      "operation date",
      "surgery date",
      "op date",
      "date of surgery",
      "dos",
      "performed on",
      "datetime",
    ],
  },
  {
    field: "procedureName",
    patterns: [
      "procedure",
      "procedure name",
      "operation",
      "operation name",
      "case",
      "case name",
      "procedure performed",
      "surgery",
      "surgery name",
    ],
  },
  {
    field: "specialtyId",
    patterns: [
      "specialty",
      "speciality",
      "subspecialty",
      "service",
      "rotation service",
      "department",
    ],
  },
  {
    field: "procedureCategory",
    patterns: ["category", "procedure category", "type", "subspecialty"],
  },
  {
    field: "role",
    patterns: [
      "role",
      "trainee role",
      "level of involvement",
      "level",
      "participation",
      "trainee position",
      "position",
    ],
  },
  {
    field: "autonomyLevel",
    patterns: [
      "autonomy",
      "autonomy level",
      "entrustment",
      "entrustment level",
      "supervision",
      "supervision level",
      "involvement",
      "epa",
      "ebp", // common typo
    ],
  },
  {
    field: "attendingLabel",
    patterns: [
      "attending",
      "supervisor",
      "preceptor",
      "staff",
      "faculty",
      "primary surgeon",
      "consultant",
    ],
  },
  {
    field: "institutionSite",
    patterns: [
      "hospital",
      "site",
      "location",
      "facility",
      "institution",
      "centre",
      "center",
      "or",
      "operating room",
    ],
  },
  {
    field: "surgicalApproach",
    patterns: [
      "approach",
      "surgical approach",
      "technique",
      "method",
      "open vs lap",
      "laparoscopic",
      "laterality and approach",
    ],
  },
  {
    field: "diagnosisCategory",
    patterns: [
      "diagnosis",
      "indication",
      "presenting complaint",
      "preoperative diagnosis",
      "preop diagnosis",
      "indications",
    ],
  },
  {
    field: "outcomeCategory",
    patterns: ["outcome", "result", "case outcome"],
  },
  {
    field: "complicationCategory",
    patterns: [
      "complication",
      "complications",
      "adverse event",
      "intraop complication",
      "intraop complications",
    ],
  },
  {
    field: "notes",
    patterns: [
      "notes",
      "comments",
      "remarks",
      "findings",
      "intraop findings",
      "operative findings",
      "operative note",
      "dictation",
      "narrative",
    ],
  },
  {
    field: "operativeDurationMinutes",
    patterns: [
      "duration",
      "operative duration",
      "operative time",
      "case length",
      "case duration",
      "minutes",
      "time (min)",
      "op time",
    ],
  },
  {
    field: "patientAgeBin",
    patterns: [
      "age",
      "patient age",
      "age (years)",
      "age years",
      "age band",
      "age group",
    ],
  },
];

/**
 * Best-effort auto-mapping of a list of source column headers onto Hippo
 * CaseLog fields. Returns:
 *  - mapping[hippoField] = sourceColumn (only when a match was found)
 *  - unmappedColumns = source columns that didn't match any field
 */
export function autoMapColumns(headers: string[]): {
  mapping: Partial<Record<HippoField, string>>;
  unmappedColumns: string[];
} {
  const mapping: Partial<Record<HippoField, string>> = {};
  const unmapped: string[] = [];
  const used = new Set<string>();

  // First pass: exact + substring matches by priority order.
  for (const header of headers) {
    const lower = header.trim().toLowerCase();
    if (!lower) {
      continue;
    }
    let matched: HippoField | null = null;
    for (const cand of MAPPING_TABLE) {
      if (mapping[cand.field]) continue; // already mapped
      // Exact match first, then substring.
      if (cand.patterns.some((p) => p === lower)) {
        matched = cand.field;
        break;
      }
    }
    if (matched) {
      mapping[matched] = header;
      used.add(header);
    }
  }

  for (const header of headers) {
    if (used.has(header)) continue;
    const lower = header.trim().toLowerCase();
    if (!lower) continue;
    let matched: HippoField | null = null;
    for (const cand of MAPPING_TABLE) {
      if (mapping[cand.field]) continue;
      if (cand.patterns.some((p) => lower.includes(p))) {
        matched = cand.field;
        break;
      }
    }
    if (matched) {
      mapping[matched] = header;
      used.add(header);
    } else {
      unmapped.push(header);
    }
  }

  return { mapping, unmappedColumns: unmapped };
}

// ---------------------------------------------------------------------------
// Value coercion helpers
// ---------------------------------------------------------------------------

const APPROACH_MAP: Record<string, string> = {
  open: "OPEN",
  laparoscopic: "LAPAROSCOPIC",
  lap: "LAPAROSCOPIC",
  robotic: "ROBOTIC",
  "robot-assisted": "ROBOTIC",
  rals: "ROBOTIC",
  davinci: "ROBOTIC",
  endoscopic: "ENDOSCOPIC",
  endo: "ENDOSCOPIC",
  cystoscopic: "ENDOSCOPIC",
  percutaneous: "PERCUTANEOUS",
  perc: "PERCUTANEOUS",
  hybrid: "HYBRID",
};

export function coerceApproach(v: unknown): string {
  if (typeof v !== "string") return "OPEN";
  const lower = v.trim().toLowerCase();
  for (const [k, val] of Object.entries(APPROACH_MAP)) {
    if (lower.includes(k)) return val;
  }
  return "OPEN";
}

const AUTONOMY_MAP: Record<string, string> = {
  observer: "OBSERVER",
  observed: "OBSERVER",
  assistant: "ASSISTANT",
  assist: "ASSISTANT",
  helped: "ASSISTANT",
  "supervisor present": "SUPERVISOR_PRESENT",
  supervised: "SUPERVISOR_PRESENT",
  "scrubbed in": "SUPERVISOR_PRESENT",
  primary: "SUPERVISOR_PRESENT",
  independent: "INDEPENDENT",
  alone: "INDEPENDENT",
  unsupervised: "INDEPENDENT",
  teaching: "TEACHING",
  taught: "TEACHING",
  // EPA-style numeric autonomy levels (1=observer .. 5=teaching).
  "1": "OBSERVER",
  "2": "ASSISTANT",
  "3": "SUPERVISOR_PRESENT",
  "4": "INDEPENDENT",
  "5": "TEACHING",
};

export function coerceAutonomy(v: unknown): string {
  if (v === null || v === undefined) return "SUPERVISOR_PRESENT";
  const lower = String(v).trim().toLowerCase();
  if (!lower) return "SUPERVISOR_PRESENT";
  for (const [k, val] of Object.entries(AUTONOMY_MAP)) {
    if (lower === k || lower.includes(k)) return val;
  }
  return "SUPERVISOR_PRESENT";
}

export function coerceDate(v: unknown): Date | null {
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  if (typeof v === "number") {
    // Excel serial date (days since 1899-12-30).
    if (v > 25569 && v < 100000) {
      const ms = (v - 25569) * 86400 * 1000;
      const d = new Date(ms);
      if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
    return null;
  }
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (!trimmed) return null;
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
    return null;
  }
  return null;
}

export function coerceMinutes(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number" && !isNaN(v)) return Math.round(v);
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (!trimmed) return null;
    // "01:23" or "1h 23m" forms
    const hm = /^(\d+):(\d+)$/.exec(trimmed);
    if (hm) return parseInt(hm[1]) * 60 + parseInt(hm[2]);
    const hMatch = /(\d+)\s*h/i.exec(trimmed);
    const mMatch = /(\d+)\s*m/i.exec(trimmed);
    if (hMatch || mMatch) {
      return (hMatch ? parseInt(hMatch[1]) * 60 : 0) + (mMatch ? parseInt(mMatch[1]) : 0);
    }
    const n = parseFloat(trimmed);
    if (!isNaN(n)) return Math.round(n);
  }
  return null;
}

const AGE_BIN_MAP: Record<string, string> = {
  pediatric: "PEDIATRIC",
  paediatric: "PEDIATRIC",
  child: "PEDIATRIC",
  infant: "INFANT",
  neonate: "NEONATE",
  newborn: "NEONATE",
  adult: "ADULT",
  adolescent: "ADOLESCENT",
  geriatric: "GERIATRIC",
  elderly: "GERIATRIC",
  unknown: "UNKNOWN",
};

export function coerceAgeBin(v: unknown): string {
  if (v === null || v === undefined) return "UNKNOWN";
  if (typeof v === "number") {
    if (v < 1) return "INFANT";
    if (v < 18) return "PEDIATRIC";
    if (v < 65) return "ADULT";
    return "GERIATRIC";
  }
  if (typeof v === "string") {
    const lower = v.trim().toLowerCase();
    for (const [k, val] of Object.entries(AGE_BIN_MAP)) {
      if (lower.includes(k)) return val;
    }
    const n = parseFloat(lower);
    if (!isNaN(n)) {
      return coerceAgeBin(n);
    }
  }
  return "UNKNOWN";
}

const COMPLICATION_MAP: Record<string, string> = {
  none: "NONE",
  "no complication": "NONE",
  "no complications": "NONE",
  bleeding: "BLEEDING",
  hemorrhage: "BLEEDING",
  infection: "INFECTION",
  ssi: "INFECTION",
  injury: "INJURY",
  "organ injury": "INJURY",
  conversion: "OTHER",
  other: "OTHER",
  death: "DEATH",
  mortality: "DEATH",
};

export function coerceComplication(v: unknown): string {
  if (v === null || v === undefined || v === "") return "NONE";
  const lower = String(v).trim().toLowerCase();
  for (const [k, val] of Object.entries(COMPLICATION_MAP)) {
    if (lower === k || lower.includes(k)) return val;
  }
  return "OTHER";
}

const OUTCOME_MAP: Record<string, string> = {
  uncomplicated: "UNCOMPLICATED",
  successful: "UNCOMPLICATED",
  routine: "UNCOMPLICATED",
  complicated: "COMPLICATED",
  difficult: "COMPLICATED",
  death: "MORTALITY",
  mortality: "MORTALITY",
  died: "MORTALITY",
};

export function coerceOutcome(v: unknown): string {
  if (v === null || v === undefined || v === "") return "UNCOMPLICATED";
  const lower = String(v).trim().toLowerCase();
  for (const [k, val] of Object.entries(OUTCOME_MAP)) {
    if (lower === k || lower.includes(k)) return val;
  }
  return "UNCOMPLICATED";
}
