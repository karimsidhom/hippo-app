// Hippo Clinic — Reference suggestion orchestrator.
//
// Pipeline:
//   1. Take the rendered note (4 paragraphs).
//   2. Ask the LLM to identify "evidence-backable claims" — sentences
//      where the clinician makes a clinical statement that a published
//      paper or specialty guideline could support. The model emits a
//      compact JSON array; no rewriting yet.
//   3. For each claim, run a PubMed search and a guideline lookup.
//   4. Hand the results back to the LLM ONCE more to write a one-line
//      "augmentation suggestion" — the actual text that would appear in
//      the note alongside the citation. Keep this conservative: a
//      reference next to the existing claim, not a new claim.
//   5. Return suggestions to the client, which displays them in a
//      separate panel below the editor (light-red font). Nothing is
//      auto-inserted into the note.

import crypto from "node:crypto";
import { chatJson, ClinicLlmError } from "@/lib/clinic/llm";
import { searchPubmed, formatPubmedCitation, type PubmedArticle } from "./pubmed";
import { findGuidelines, type GuidelineEntry, type GuidelineRegion } from "./guidelines";

export type NoteSection = "p1" | "p2" | "p3" | "p4" | "letter" | "patientInstructions";

export interface ClaimExtraction {
  section: NoteSection;
  claim: string;       // verbatim sentence from the note
  searchQuery: string; // a 4-7 word PubMed search string
}

export interface ReferenceSuggestion {
  /** Stable ID so the UI can reconcile dismissals across regenerations. */
  id: string;
  section: NoteSection;
  /** The exact claim sentence we matched against. */
  claim: string;
  /** A one-sentence rewrite that incorporates the citation. */
  augmentation: string;
  pubmed: PubmedArticle[];
  guidelines: GuidelineEntry[];
}

interface SuggestInput {
  paragraphs: { p1: string; p2: string; p3: string; p4: string };
  letter?: string | null;
  patientInstructions?: string | null;
  regions: GuidelineRegion[];
  specialty?: string;
  /** Cap suggestions per call so PubMed quota stays reasonable. */
  maxSuggestions?: number;
}

const CLAIM_EXTRACTION_SYSTEM = `
You read a draft clinic note and identify claims that could be supported
by a peer-reviewed paper or a specialty guideline (AUA / CUA / EAU / EBM).

Strict rules:
- Only flag claims that are clinical statements (e.g. "PSA above 4 raises
  prostate-cancer risk", "BCG is first-line for high-risk NMIBC").
- DO NOT flag patient-specific facts ("the patient is 62 years old",
  "PSA was 7.2"). DO NOT flag plan items ("we will repeat PSA in 6 months").
- Skip patient demographics, allergy lists, medication lists, vitals.
- Output at most 4 high-value claims, ordered by how clinically meaningful
  a citation would be.

Return STRICT JSON only:
{
  "claims": [
    {
      "section": "p1"|"p2"|"p3"|"p4"|"letter"|"patientInstructions",
      "claim": string,            // verbatim sentence from the note
      "searchQuery": string       // 4-7 words optimal for PubMed
    }
  ]
}
No prose, no markdown.
`.trim();

const AUGMENTATION_SYSTEM = `
You are a careful clinical writer. Given a clinical claim and a list of
real published references, write a SINGLE additional sentence the
clinician could append to the note that cites the strongest reference.

Hard rules:
- Do NOT change or restate the original claim. Add ONE sentence after it.
- Use Vancouver-style inline citation: "(Author et al., Journal Year;
  PMID: 12345678)" — keep it tight.
- Prefer guidelines over individual papers when both are present.
- If the references are weak or off-topic, return an empty string.

Output STRICT JSON: { "augmentation": string }. No prose.
`.trim();

export async function suggestReferences(input: SuggestInput): Promise<ReferenceSuggestion[]> {
  const noteText = renderNoteForAnalysis(input);
  if (!noteText.trim()) return [];

  // ── Step 1: extract claims ──────────────────────────────────────────────
  let claims: ClaimExtraction[];
  try {
    const r = await chatJson<{ claims?: ClaimExtraction[] }>({
      system: CLAIM_EXTRACTION_SYSTEM,
      user: noteText,
      temperature: 0.1,
      maxTokens: 600,
    });
    claims = (r.json.claims ?? []).filter((c) => c.claim && c.searchQuery);
  } catch (err) {
    if (err instanceof ClinicLlmError) throw err;
    throw new ClinicLlmError("Reference claim extraction failed", 502, "REFS_EXTRACT");
  }

  const cap = input.maxSuggestions ?? 4;
  claims = claims.slice(0, cap);
  if (claims.length === 0) return [];

  // ── Step 2: PubMed + guideline lookup, in parallel ──────────────────────
  const lookups = await Promise.all(
    claims.map(async (c) => {
      const [pubmed, guidelines] = await Promise.all([
        searchPubmed(c.searchQuery, 2).catch(() => []),
        Promise.resolve(findGuidelines({
          claim: c.claim,
          regions: input.regions,
          specialty: input.specialty,
          limit: 2,
        })),
      ]);
      return { claim: c, pubmed, guidelines };
    }),
  );

  // ── Step 3: write the augmentation sentence per claim ───────────────────
  const suggestions: ReferenceSuggestion[] = [];
  for (const lookup of lookups) {
    const { claim, pubmed, guidelines } = lookup;
    if (pubmed.length === 0 && guidelines.length === 0) continue;

    const refList = [
      ...guidelines.map((g) => `Guideline: ${g.organization} ${g.region} ${g.year} — ${g.title} [${g.url}]`),
      ...pubmed.map((p) => `Paper: ${formatPubmedCitation(p)}`),
    ].join("\n");

    let augmentation = "";
    try {
      const r = await chatJson<{ augmentation?: string }>({
        system: AUGMENTATION_SYSTEM,
        user: `Original claim:\n${claim.claim}\n\nAvailable references:\n${refList}`,
        temperature: 0.2,
        maxTokens: 240,
      });
      augmentation = (r.json.augmentation ?? "").trim();
    } catch {
      // Soft-fail: keep the references, drop the augmentation. The UI
      // still shows the citation list so the clinician can paste in
      // their own wording.
      augmentation = "";
    }

    suggestions.push({
      id: hashId(claim.section + ":" + claim.claim),
      section: claim.section,
      claim: claim.claim,
      augmentation,
      pubmed,
      guidelines,
    });
  }
  return suggestions;
}

function renderNoteForAnalysis(input: SuggestInput): string {
  const parts = [
    `[p1]\n${input.paragraphs.p1}`,
    `[p2]\n${input.paragraphs.p2}`,
    `[p3]\n${input.paragraphs.p3}`,
    `[p4]\n${input.paragraphs.p4}`,
  ];
  if (input.letter) parts.push(`[letter]\n${input.letter}`);
  if (input.patientInstructions) parts.push(`[patientInstructions]\n${input.patientInstructions}`);
  return parts.join("\n\n");
}

function hashId(s: string): string {
  return crypto.createHash("sha1").update(s).digest("hex").slice(0, 12);
}
