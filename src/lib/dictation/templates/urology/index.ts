// All urology procedure templates — order matters (most-specific first).
import type { ProcedureTemplate } from "../types";
import { ENDOUROLOGY_TEMPLATES } from "./endourology";
import { SCROTAL_TEMPLATES } from "./scrotal";
import { ONCOLOGY_TEMPLATES } from "./oncology";
import { REMAINING_UROLOGY_TEMPLATES } from "./remaining";

export const UROLOGY_TEMPLATES: ProcedureTemplate[] = [
  // 1. Endourology (rich) — most specific patterns first
  ...ENDOUROLOGY_TEMPLATES,
  // 2. Scrotal procedures
  ...SCROTAL_TEMPLATES,
  // 3. Oncology + reconstructive
  ...ONCOLOGY_TEMPLATES,
  // 4. Remaining (covers every procedure on the user's list)
  ...REMAINING_UROLOGY_TEMPLATES,
];
