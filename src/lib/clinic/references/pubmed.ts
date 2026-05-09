// Hippo Clinic — PubMed e-utils client.
//
// PubMed's E-utilities API is free, no auth required, with a soft rate
// limit of 3 req/sec without an API key (10 with). We hit two endpoints:
//
//   1. esearch.fcgi → search by query, returns a list of PMIDs
//   2. esummary.fcgi → get title/journal/authors/year by PMID
//
// We never store full abstracts or copyrighted text — just citations
// (PMID + title + journal + first author + year + URL). The clinical
// rewrite that the LLM proposes is generated from the title + journal,
// not from the abstract, so the output stays well within fair-use.

const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

export interface PubmedArticle {
  pmid: string;
  title: string;
  journal: string;
  firstAuthor: string;
  year: string;
  url: string;
}

interface ESearchResult {
  esearchresult?: { idlist?: string[] };
}

interface ESummaryResult {
  result?: Record<string, RawSummary | string[]>;
}
interface RawSummary {
  uid?: string;
  title?: string;
  source?: string;          // journal abbrev
  fulljournalname?: string;
  pubdate?: string;         // "2024 Mar" / "2024 Mar 12" — we just take the year
  authors?: Array<{ name: string; authtype?: string }>;
}

/** Search PubMed; returns up to `limit` articles ranked by best match. */
export async function searchPubmed(query: string, limit = 3): Promise<PubmedArticle[]> {
  if (!query.trim()) return [];

  const apiKey = process.env.PUBMED_API_KEY;
  const apiKeyParam = apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : "";

  const searchUrl =
    `${BASE}/esearch.fcgi?db=pubmed&retmode=json&retmax=${limit}` +
    `&sort=relevance&term=${encodeURIComponent(query)}${apiKeyParam}`;

  let pmids: string[] = [];
  try {
    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = (await res.json()) as ESearchResult;
    pmids = data.esearchresult?.idlist ?? [];
  } catch {
    return [];
  }
  if (pmids.length === 0) return [];

  const summaryUrl =
    `${BASE}/esummary.fcgi?db=pubmed&retmode=json&id=${pmids.join(",")}${apiKeyParam}`;

  let summary: ESummaryResult;
  try {
    const res = await fetch(summaryUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    summary = (await res.json()) as ESummaryResult;
  } catch {
    return [];
  }

  const records = summary.result;
  if (!records) return [];

  const articles: PubmedArticle[] = [];
  for (const pmid of pmids) {
    const raw = records[pmid];
    if (!raw || Array.isArray(raw)) continue;
    const r = raw as RawSummary;
    const yearMatch = r.pubdate?.match(/\b(19|20)\d{2}\b/);
    articles.push({
      pmid,
      title: (r.title ?? "").replace(/\.$/, ""),
      journal: r.fulljournalname || r.source || "",
      firstAuthor: r.authors?.[0]?.name ?? "",
      year: yearMatch?.[0] ?? "",
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    });
  }
  return articles;
}

/** Format a PubMed article as a Vancouver-ish inline citation. */
export function formatPubmedCitation(a: PubmedArticle): string {
  const parts = [
    a.firstAuthor,
    a.firstAuthor ? "et al." : "",
    a.title,
    a.journal,
    a.year,
  ].filter(Boolean);
  return parts.join(". ") + ` (PMID: ${a.pmid})`;
}
