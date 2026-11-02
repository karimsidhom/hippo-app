"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, LockKeyhole, Search, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { collectCaseNotes, filterCaseNotes } from "@/lib/case-notes";
import "../../academic-workspace.css";

const dateLabel = (value: string) => value ? new Date(value).toLocaleDateString(undefined, { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }) : "Date not recorded";

export default function CaseNotesPage() {
  const { user, cases, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [order, setOrder] = useState<"case" | "updated">("case");
  const [limit, setLimit] = useState(30);
  const query = useDeferredValue(search);
  const notes = useMemo(() => collectCaseNotes(cases, user?.id), [cases, user?.id]);
  const years = useMemo(() => [...new Set(notes.map(note => note.year).filter(Boolean))].sort().reverse(), [notes]);
  const specialties = useMemo(() => [...new Set(notes.map(note => note.specialty))].sort(), [notes]);
  const filtered = useMemo(() => filterCaseNotes(notes, { search: query, year, specialty, order }), [notes, query, year, specialty, order]);
  const refined = !!search || !!year || !!specialty;
  const clear = () => { setSearch(""); setYear(""); setSpecialty(""); setLimit(30); };

  return <div className="academic-workspace notebook">
    <header className="academic-heading">
      <div><p className="academic-eyebrow">Your private learning record</p><h1>Case notes</h1><p>What you noticed, what you learned, and what to carry into the next case.</p></div>
      <span className="academic-private"><LockKeyhole size={15} /> Only you</span>
    </header>
    <div className="notebook-toolbar">
      <label className="notebook-search"><Search size={18} /><span className="sr-only">Search your case notes</span><input type="search" value={search} onChange={event => { setSearch(event.target.value); setLimit(30); }} placeholder="Search a procedure, note or learning goal" />{search && <button aria-label="Clear search" onClick={() => setSearch("")}><X size={16} /></button>}</label>
      <label><span className="sr-only">Filter by year</span><select value={year} onChange={event => { setYear(event.target.value); setLimit(30); }}><option value="">All years</option>{years.map(value => <option key={value}>{value}</option>)}</select></label>
      {specialties.length > 1 && <label><span className="sr-only">Filter by specialty</span><select value={specialty} onChange={event => { setSpecialty(event.target.value); setLimit(30); }}><option value="">All specialties</option>{specialties.map(value => <option key={value}>{value}</option>)}</select></label>}
      <label><span className="sr-only">Sort notes</span><select value={order} onChange={event => setOrder(event.target.value as "case" | "updated")}><option value="case">Newest cases</option><option value="updated">Recently edited</option></select></label>
    </div>
    <div className="notebook-summary"><span role="status" aria-live="polite">{filtered.length} {filtered.length === 1 ? "case with notes" : "cases with notes"}{refined ? ` of ${notes.length}` : ""}</span>{refined && <button onClick={clear}>Clear filters</button>}</div>
    {loading ? <p className="academic-empty" role="status">Loading your notes…</p> : filtered.length ? <>
      <div className="notebook-grid">{filtered.slice(0, limit).map(note => <article className="notebook-card" key={note.id}>
        <header><div><time dateTime={note.caseDate || undefined}>{dateLabel(note.caseDate)}</time><h2>{note.procedure}</h2><p>{note.specialty}</p></div><Link href={`/cases?case=${encodeURIComponent(note.id)}`} aria-label={`Open case: ${note.procedure}`} className="notebook-source"><ArrowUpRight size={20} /></Link></header>
        {note.sections.map(section => <section key={section.title}><h3>{section.title}</h3>{section.text.length > 550 ? <details><summary><span className="note-preview">{section.text.slice(0, 300).trimEnd()}…</span><span className="note-expand">Read full note</span><span className="note-collapse">Close full note</span></summary><p>{section.text}</p></details> : <p>{section.text}</p>}</section>)}
        {!!note.tags.length && <footer>{note.tags.map((tag, index) => <span key={`${tag}-${index}`}>{tag}</span>)}</footer>}
      </article>)}</div>
      {filtered.length > limit && <button className="academic-button notebook-more" onClick={() => setLimit(count => count + 30)}>Show more notes</button>}
    </> : <div className="academic-empty"><BookOpen size={30} /><h2>{refined ? "No notes match these filters" : "Your learning, gathered in one place"}</h2><p>{refined ? "Try another term or clear your filters." : "Notes and reflections saved on your cases appear here, linked to their original case. No extra entry needed."}</p>{refined ? <button className="academic-button" onClick={clear}>Clear filters</button> : <Link className="academic-button" href="/cases">Open your cases</Link>}</div>}
    <p className="academic-footnote">These are your original case notes and reflections. Nothing is posted to Pulse from this page.</p>
  </div>;
}
