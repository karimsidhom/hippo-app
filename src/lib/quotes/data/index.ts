/* ── Combined Quote Dataset ──────────────────────────────────────────────── */

import type { Quote } from "../types";
import { oslerQuotes } from "./osler";
import { hippocratesQuotes } from "./hippocrates";
import { socratesQuotes } from "./socrates";
import { platoQuotes } from "./plato";
import { aristotleQuotes } from "./aristotle";

export { oslerQuotes, hippocratesQuotes, socratesQuotes, platoQuotes, aristotleQuotes };

/** Master array of all 365 quotes */
export const ALL_QUOTES: Quote[] = [
  ...oslerQuotes,
  ...hippocratesQuotes,
  ...socratesQuotes,
  ...platoQuotes,
  ...aristotleQuotes,
];
