import type { NoteType, ServiceKey } from "../types";
import { mergeStyleProfile } from "./store";

// ---------------------------------------------------------------------------
// Learn style preferences from a corrected dictation.
//
// The basic approach: compare the generated draft to the user's corrected
// version, extract phrases that the user removed (→ avoidPhrases) and
// phrases the user added that weren't in the draft (→ preferredPhrases).
//
// This is a deliberately-simple first implementation. It gives an immediate
// signal without requiring an LLM call. We will layer on a smarter
// phrase-clustering and section-ordering pass in a later iteration.
// ---------------------------------------------------------------------------

interface LearnInput {
  noteType: NoteType;
  service: ServiceKey;
  draft: string;
  corrected: string;
  saveAsExample?: boolean;
}

/** Sentence-level split that keeps punctuation and trims whitespace. */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z])/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Crude but useful: phrases unique to a set. */
function diffSentences(a: string[], b: string[]): string[] {
  const setB = new Set(b.map((s) => s.toLowerCase()));
  return a.filter((s) => !setB.has(s.toLowerCase()));
}

export function learnFromCorrection(input: LearnInput) {
  const draftSentences = splitSentences(input.draft);
  const correctedSentences = splitSentences(input.corrected);

  const removed = diffSentences(draftSentences, correctedSentences);
  const added = diffSentences(correctedSentences, draftSentences);

  // Normalize — keep short, generic-looking phrasing patterns; drop long
  // sentences that are too context-specific to reuse.
  const tooSpecific = (s: string) => s.length > 160;

  const avoidPhrases = removed.filter((s) => !tooSpecific(s)).slice(0, 20);
  const preferredPhrases = added.filter((s) => !tooSpecific(s)).slice(0, 20);

  const patch: Parameters<typeof mergeStyleProfile>[0] = {
    global: {
      brevity: "standard",
      headerStyle: "upper",
      preferredPhrases,
      avoidPhrases,
    },
  };

  if (input.saveAsExample) {
    patch.examples = [
      {
        noteType: input.noteType,
        service: input.service,
        excerpt: input.corrected.slice(0, 800),
        savedAt: new Date().toISOString(),
      },
    ];
  }

  return mergeStyleProfile(patch);
}
