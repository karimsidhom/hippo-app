// ---------------------------------------------------------------------------
// Dictation system — public API
//
// Scope: operative notes only. The system takes a CaseLog and produces a
// polished operative dictation, optionally revised by Claude Opus 4.6 and
// pinned to the user's learned StyleProfile.
//
// Consumers should import from "@/lib/dictation", not from internal files.
// ---------------------------------------------------------------------------

import type { NoteType, LengthLevel, ServiceKey, BuildResult } from "./types";

// Operative entry points
export { generateDictation, buildOperativeNote, resolveServiceFromCase } from "./operative";

// Service playbooks
export { PLAYBOOKS, getPlaybook } from "./services/playbooks";
export type { Playbook } from "./services/playbooks";

// Style profile
export {
  getStyleProfile,
  setStyleProfile,
  mergeStyleProfile,
  resetStyleProfile,
} from "./style/store";
export { learnFromCorrection } from "./style/learn";
export { applyStyleProfile } from "./style/apply";
export type { StyleProfile, ServiceStyle, NoteTypeStyle } from "./style/profile";
export { DEFAULT_STYLE_PROFILE } from "./style/profile";

// Revision engine (Claude Opus 4.6)
export { reviseDictation, applyUserCorrection, DICTATION_MODEL } from "./revise";
export type { ReviseInput, ReviseResult, ApplyCorrectionInput } from "./revise";

// Types
export type { NoteType, LengthLevel, ServiceKey, BuildResult };
