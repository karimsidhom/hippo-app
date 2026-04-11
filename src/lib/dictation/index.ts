// ---------------------------------------------------------------------------
// Dictation system — public API
//
// Consumers should import from "@/lib/dictation", not from internal files.
// ---------------------------------------------------------------------------

import type { NoteContext, NoteType, LengthLevel, ServiceKey, BuildResult } from "./types";
import { generateDictation, buildOperativeNote } from "./operative";
import { buildConsultNote } from "./noteTypes/consult";
import { buildFollowUpNote } from "./noteTypes/followUp";
import { buildDischargeSummary } from "./noteTypes/discharge";
import { buildClinicNote } from "./noteTypes/clinic";
import { buildHandoverNote } from "./noteTypes/handover";
import { buildBedsideProcedureNote } from "./noteTypes/bedsideProcedure";

// Legacy / operative entry points
export { generateDictation, buildOperativeNote };

// Non-operative note builders
export {
  buildConsultNote,
  buildFollowUpNote,
  buildDischargeSummary,
  buildClinicNote,
  buildHandoverNote,
  buildBedsideProcedureNote,
};

// Service playbooks
export { PLAYBOOKS, getPlaybook } from "./services/playbooks";
export type { Playbook } from "./services/playbooks";

// Style profile
export { getStyleProfile, setStyleProfile, mergeStyleProfile, resetStyleProfile } from "./style/store";
export { learnFromCorrection } from "./style/learn";
export { applyStyleProfile } from "./style/apply";
export type { StyleProfile, ServiceStyle, NoteTypeStyle } from "./style/profile";
export { DEFAULT_STYLE_PROFILE } from "./style/profile";

// Revision engine
export { reviseDictation } from "./revise";
export type { ReviseInput, ReviseResult } from "./revise";

// Types
export type { NoteContext, NoteType, LengthLevel, ServiceKey, BuildResult };

// ---------------------------------------------------------------------------
// Unified note builder — dispatches on noteType.
// ---------------------------------------------------------------------------

export interface BuildNoteRequest {
  noteType: NoteType;
  length: LengthLevel;
  context: NoteContext;
}

export function buildNote(req: BuildNoteRequest): BuildResult {
  const { noteType, length, context } = req;
  let text: string;
  switch (noteType) {
    case "consult":
      text = buildConsultNote(context, length);
      break;
    case "follow-up":
      text = buildFollowUpNote(context, length);
      break;
    case "discharge":
      text = buildDischargeSummary(context, length);
      break;
    case "clinic":
      text = buildClinicNote(context, length);
      break;
    case "handover":
      text = buildHandoverNote(context, length);
      break;
    case "bedside-procedure":
      text = buildBedsideProcedureNote(context, length);
      break;
    case "operative":
      // Operative notes require a CaseLog, not a NoteContext — callers should
      // use generateDictation() / buildOperativeNote() directly for those.
      text = "[Operative notes require a CaseLog — call buildOperativeNote(caseLog) instead.]";
      break;
  }

  const missing: string[] = [];
  if (!context.patientOneLiner) missing.push("patient one-liner");
  if (!context.reason) missing.push("reason / chief complaint");
  if (!context.assessment) missing.push("assessment / impression");
  if (!context.plan) missing.push("plan");

  return { text, missing, warnings: [] };
}
