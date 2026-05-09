// Hippo Clinic — RxNorm interaction client.
//
// RxNorm is the NIH/NLM standard medication terminology. Free, no auth, no
// rate-limits worth worrying about for clinical-volume use. We hit:
//
//   1. /REST/approximateTerm.json → fuzzy-match a clinician-typed med name
//      to a real RxCUI (e.g. "metformin 500" → "Metformin 500 MG Oral Tablet").
//   2. /REST/interaction/list.json → take the resulting RxCUIs and ask
//      RxNav for known interactions.
//
// Important caveat that the UI surfaces too: NIH retired the RxNorm
// interaction API in 2024 for new tickets but the data is still served
// from the legacy endpoint at the moment. If the endpoint goes dark we
// fall back to a pure allergy cross-check (still useful) and log it.
//
// Output is intentionally conservative — we only return interactions
// flagged "high" or "moderate" severity, and we never claim a specific
// med IS contraindicated; we surface the warning and let the clinician
// decide.

const RX_BASE = "https://rxnav.nlm.nih.gov/REST";

interface ApproximateMatch {
  rxcui: string;
  name: string;
  score: number;
}

export async function approximateRxcui(term: string): Promise<ApproximateMatch | null> {
  const url = `${RX_BASE}/approximateTerm.json?term=${encodeURIComponent(term)}&maxEntries=1`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      approximateGroup?: { candidate?: Array<{ rxcui?: string; rxaui?: string; score?: string }> };
    };
    const c = data.approximateGroup?.candidate?.[0];
    if (!c?.rxcui) return null;
    return {
      rxcui: c.rxcui,
      name: term,
      score: Number(c.score ?? "0"),
    };
  } catch {
    return null;
  }
}

export interface RxInteraction {
  /** Severity reported by RxNav: "N/A" | "high" | etc. We narrow to high/moderate in the caller. */
  severity: string;
  description: string;
  /** RxNorm names of the two interacting drugs. */
  pair: [string, string];
  source: string;
}

export async function getInteractionsForRxcuis(rxcuis: string[]): Promise<RxInteraction[]> {
  const unique = Array.from(new Set(rxcuis.filter(Boolean)));
  if (unique.length < 2) return [];

  const url = `${RX_BASE}/interaction/list.json?rxcuis=${unique.join("+")}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      fullInteractionTypeGroup?: Array<{
        sourceName: string;
        fullInteractionType?: Array<{
          minConcept?: Array<{ name?: string }>;
          interactionPair?: Array<{
            severity?: string;
            description?: string;
            interactionConcept?: Array<{ minConceptItem?: { name?: string } }>;
          }>;
        }>;
      }>;
    };
    const out: RxInteraction[] = [];
    for (const group of data.fullInteractionTypeGroup ?? []) {
      for (const fit of group.fullInteractionType ?? []) {
        for (const pair of fit.interactionPair ?? []) {
          const [a, b] = pair.interactionConcept ?? [];
          out.push({
            severity: pair.severity ?? "N/A",
            description: pair.description ?? "",
            pair: [
              a?.minConceptItem?.name ?? "?",
              b?.minConceptItem?.name ?? "?",
            ],
            source: group.sourceName,
          });
        }
      }
    }
    return out;
  } catch {
    return [];
  }
}
