import { parseStoredReflection } from "@/lib/debrief/types";

export interface NoteCase {
  id: string; userId: string; procedureName: string; specialtyName?: string;
  notes: string | null; reflection: string | null; tags: string[];
  caseDate: Date | string; updatedAt: Date | string;
}
export interface CaseNote {
  id: string; procedure: string; specialty: string;
  caseDate: string; updatedAt: number; year: string;
  sections: { title: string; text: string }[]; tags: string[];
}
const iso = (value: Date | string) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : "";
};

/** Derive a notebook from the signed-in owner's existing private case store.
 * Raw debrief audio transcripts and other users' stale cached rows stay out. */
export function collectCaseNotes(cases: readonly NoteCase[], ownerId: string | undefined): CaseNote[] {
  if (!ownerId) return [];
  return cases.filter(entry => entry.userId === ownerId && !entry.id.startsWith("tmp_")).flatMap(entry => {
    const parsed = parseStoredReflection(entry.reflection);
    const sections = [{ title: "Case notes", text: entry.notes?.trim() ?? "" }];
    if (parsed.structured) sections.push(
      { title: "What went well", text: parsed.structured.wentWell.trim() },
      { title: "What to do differently", text: parsed.structured.doBetter.trim() },
      { title: "Next learning goal", text: parsed.structured.workOn.trim() },
    );
    else if (parsed.freeform) {
      let structuredFallback = false;
      try {
        const value: unknown = JSON.parse(parsed.freeform);
        if (value && typeof value === "object" && !Array.isArray(value) && ("raw" in value || "v" in value)) {
          structuredFallback = true;
          const fields = value as Record<string, unknown>;
          for (const [key, title] of [["wentWell", "What went well"], ["doBetter", "What to do differently"], ["workOn", "Next learning goal"]]) {
            if (typeof fields[key] === "string") sections.push({ title, text: (fields[key] as string).trim() });
          }
        }
      } catch {
        // A truncated stored debrief must not turn its raw field into prose.
        structuredFallback = parsed.freeform.trimStart().startsWith("{") && /"raw"\s*:|"v"\s*:\s*2\b/.test(parsed.freeform);
      }
      if (!structuredFallback) sections.push({ title: "Reflection", text: parsed.freeform });
    }
    const kept = sections.filter(section => section.text);
    if (!kept.length) return [];
    const caseDate = iso(entry.caseDate);
    return [{ id: entry.id, procedure: entry.procedureName, specialty: entry.specialtyName?.trim() || "Unspecified specialty",
      caseDate, updatedAt: new Date(entry.updatedAt).getTime() || 0, year: caseDate.slice(0, 4), sections: kept,
      tags: (entry.tags ?? []).filter(tag => typeof tag === "string" && tag.trim()).map(tag => tag.trim()) }];
  });
}

export function filterCaseNotes(notes: readonly CaseNote[], filters: { search?: string; year?: string; specialty?: string; order?: "case" | "updated" } = {}): CaseNote[] {
  const query = filters.search?.trim().toLocaleLowerCase() || "";
  return notes.filter(note => (!filters.year || note.year === filters.year)
    && (!filters.specialty || note.specialty === filters.specialty)
    && (!query || [note.procedure, note.specialty, ...note.tags, ...note.sections.map(section => section.text)].join(" ").toLocaleLowerCase().includes(query)))
    .sort((a, b) => (filters.order === "updated" ? b.updatedAt - a.updatedAt : b.caseDate.localeCompare(a.caseDate)) || a.id.localeCompare(b.id));
}
