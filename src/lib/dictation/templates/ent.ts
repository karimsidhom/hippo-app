// ent specialty stub — templates to be authored using the same
// procedure-specific structure as urology + general surgery. Until then,
// the buildOperativeNote falls back to the existing prose builder for this
// specialty (which is itself procedure-aware at the keyword level — never
// produces a bare-bones note). The empty array here is what allows the
// registry index to import cleanly.
import type { ProcedureTemplate } from "./types";

export const ENT_TEMPLATES: ProcedureTemplate[] = [];
