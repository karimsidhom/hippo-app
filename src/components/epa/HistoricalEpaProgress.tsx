"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import type { HistoricalEpaCriterion, HistoricalEpaParent, HistoricalEpaRecord, HistoricalEpaSnapshot } from "@/lib/epa/historical-progress";
import { historicalEpaSnapshotSchema, MAX_HISTORICAL_EPA_BYTES, parseHistoricalProgressImport } from "@/lib/epa/historical-progress";
import { SPECIALTIES } from "@/lib/constants";
import { summarizeHistoricalProgress } from "@/lib/epa/progress-summary";
import type { HistoricalProgressSummary } from "@/lib/epa/progress-summary";
import styles from "./HistoricalEpaProgress.module.css";

type ProgressResponse = { snapshot: unknown };
type ProgressRow = HistoricalEpaParent & { stage: string; records: HistoricalEpaRecord[] };
type StatusFilter = "outstanding" | "complete" | "all";

const STAGES = ["Transition to Discipline", "Urology Foundations", "Core of Discipline", "Transition to Practice"];

export function normalizeHistoricalSpecialty(value: string) {
  const normalized = value.trim().toLowerCase();
  return SPECIALTIES.find(item => item.name.toLowerCase() === normalized || item.slug === normalized)?.slug ?? normalized;
}

export function parseHistoricalProgressForSpecialty(input: unknown, specialty: string) {
  const specialtySlug = normalizeHistoricalSpecialty(specialty);
  let candidate = input;
  if (input && typeof input === "object" && "snapshot" in input) {
    const wrapper = input as { snapshot: unknown; specialty?: unknown };
    if ("specialty" in wrapper && (typeof wrapper.specialty !== "string" || normalizeHistoricalSpecialty(wrapper.specialty) !== specialtySlug)) {
      throw new Error("This progress file is for a different specialty. Choose a file for your current specialty.");
    }
    candidate = wrapper.snapshot;
  }
  return parseHistoricalProgressImport({ specialty: specialtySlug, snapshot: candidate });
}

function stageFor(code: string) {
  if (code.startsWith("TTP")) return STAGES[3];
  if (code.startsWith("TD")) return STAGES[0];
  if (code.startsWith("F")) return STAGES[1];
  return STAGES[2];
}

function parentCode(code: string) {
  return /^(TTP\d+|TD\d+|F\d+|C\d+)[A-Z]?$/.exec(code)?.[1] ?? null;
}

export function buildHistoricalProgressView(snapshot: HistoricalEpaSnapshot) {
  const recordsByParent = new Map<string, HistoricalEpaRecord[]>();
  const sharedRecords: HistoricalEpaRecord[] = [];
  for (const record of snapshot.records) {
    const parent = parentCode(record.code);
    if (parent === null) {
      sharedRecords.push(record);
    } else {
      const records = recordsByParent.get(parent) ?? [];
      records.push(record);
      recordsByParent.set(parent, records);
    }
  }

  // An explicit parent inventory preserves completed EPAs whose assessment counts
  // are unknown. Never infer extra completed EPAs from missing observations.
  const parents = [...(snapshot.all_parent_epas ?? [])];
  const knownParents = new Set(parents.map(parent => parent.code));
  for (const [code, records] of recordsByParent) {
    if (knownParents.has(code)) continue;
    parents.push({ code, title: records[0].title, completion_status: records.every(record => record.completion_status === "complete") ? "complete" : "outstanding", actual_completed_count: null });
  }
  const rows: ProgressRow[] = parents.map(parent => ({
    ...parent,
    stage: stageFor(parent.code),
    records: recordsByParent.get(parent.code) ?? [],
  }));
  return {
    rows,
    sharedRecords,
    completed: rows.filter(row => row.completion_status === "complete").length,
    outstanding: rows.filter(row => row.completion_status !== "complete").length,
  };
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

function CriterionRow({ criterion }: { criterion: HistoricalEpaCriterion }) {
  const complete = criterion.completion_status === "complete";
  const unit = criterion.unit || "observations";
  return (
    <li className={styles.criterion} style={criterion.depth ? { paddingLeft: Math.min(criterion.depth, 10) * 14 } : undefined}>
      <span className={complete ? styles.check : styles.dot} aria-hidden="true">{complete ? "✓" : "•"}</span>
      <div className={styles.criterionContent}>
        <span className={styles.criterionName}>{criterion.criterion}{criterion.criterion_kind === "category" ? <span className={styles.categoryLabel}>Category total</span> : null}</span>
        <div className={styles.criterionCounts}>
          {criterion.done !== null ? <span>{criterion.done} / {criterion.required} {unit}</span> : <span>Required: {criterion.required} {unit} · actual count not recorded</span>}
          {complete ? <span className={styles.completeText}>Complete</span> : <span className={styles.remainingText}>{criterion.remaining === null ? "Remaining count not recorded" : `${criterion.remaining} ${unit} remaining`}</span>}
        </div>
        {criterion.source_note ? <p className={styles.sourceNote}>{criterion.source_note}</p> : null}
      </div>
    </li>
  );
}

function RecordRequirements({ record }: { record: HistoricalEpaRecord }) {
  return (
    <section className={styles.component} aria-label={`${record.code} requirements`}>
      <h4><span className={styles.componentCode}>{record.code}</span>{record.title}</h4>
      <ul className={styles.criteria}>{record.criteria.map((criterion, index) => <CriterionRow key={`${criterion.criterion}-${index}`} criterion={criterion} />)}</ul>
      {record.reviewer_notes ? <p className={styles.reviewerNote}><strong>Reviewer note:</strong> {record.reviewer_notes}</p> : null}
      {record.method ? <p className={styles.sourceNote}><strong>Assessment method:</strong> {record.method}</p> : null}
      {record.source_pages ? <p className={styles.sourceNote}>Source page{String(record.source_pages).includes("–") ? "s" : ""}: {record.source_pages}</p> : null}
    </section>
  );
}

function ProgressEpaRow({ row }: { row: ProgressRow }) {
  const complete = row.completion_status === "complete";
  return (
    <details className={styles.epaRow}>
      <summary className={styles.epaSummary}>
        <span className={styles.epaCode}>{row.code}</span>
        <span className={styles.epaTitle}>{row.title}<span className={styles.rowStage}>{row.stage}</span></span>
        <span className={complete ? styles.completeBadge : styles.remainingBadge}>{complete ? "Complete" : "Remaining"}</span>
        <span className={styles.chevron} aria-hidden="true">›</span>
      </summary>
      <div className={styles.epaDetails}>
        {complete ? <p className={styles.completionNote}>Marked complete in the imported progress. {row.actual_completed_count === null ? "The actual assessment count was not recorded." : `Recorded assessment count: ${row.actual_completed_count}.`} This historical status is separate from signed assessments.</p> : null}
        {row.records.map(record => <RecordRequirements key={record.code} record={record} />)}
        {!complete && row.records.length === 0 ? <p className={styles.completionNote}>This EPA remains outstanding. Detailed requirements were not included in this import.</p> : null}
      </div>
    </details>
  );
}

export function EpaProgressTotals({ summary }: { summary: HistoricalProgressSummary }) {
  const { categories, individual } = summary;
  const completedCredits = individual.creditedMinimum;
  const remainingCredits = individual.remainingMaximum;
  const requiredCredits = individual.requiredMinimum;
  return (
    <div>
      <div className={styles.scorecard} aria-label="EPA category and individual progress totals">
        <div className={styles.stat}><span className={styles.completeNumber}>{categories.completed}</span><div><strong>EPA categories completed</strong><span>of {categories.total} categories</span></div></div>
        <div className={styles.stat}><span className={styles.remainingNumber}>{categories.remaining}</span><div><strong>EPA categories remaining</strong><span>Still have requirements</span></div></div>
        <div className={styles.stat}><span className={styles.completeNumber} aria-label={completedCredits === null ? "Individual EPA completion total unavailable" : `At least ${completedCredits} individual EPA minimum credits completed`}>{completedCredits === null ? "—" : `≥${completedCredits}`}</span><div><strong>Individual EPAs completed</strong><span>{requiredCredits === null ? "Required totals unavailable" : `At least · of ${requiredCredits} required minimums`}</span></div></div>
        <div className={styles.stat}><span className={styles.remainingNumber} aria-label={remainingCredits === null ? "Individual EPA remaining total unavailable" : `At most ${remainingCredits} individual EPA baseline credits remaining`}>{remainingCredits === null ? "—" : `≤${remainingCredits}`}</span><div><strong>Individual EPAs remaining</strong><span>{remainingCredits === null ? "Required totals unavailable" : "At most · to the baseline minimum"}</span></div></div>
        <div className={styles.progressSummary}><span>{categories.total ? Math.round(categories.completed / categories.total * 100) : 0}% of categories completed</span><progress aria-label="EPA categories completed" value={categories.completed} max={categories.total || 1} /></div>
      </div>
      <p className={styles.totalsExplanation}>{requiredCredits === null ? "Individual totals are unavailable for this framework. " : "Individual totals count credits toward required minimums. Completed categories are credited at their required minimums; actual submission totals are unavailable. "}Extra observations may still be needed to meet case and assessor requirements.{categories.unknown > 0 ? ` ${categories.unknown} category statuses are unknown.` : ""}</p>
    </div>
  );
}

export function HistoricalEpaProgress({ specialty: specialtyInput = "urology", onSnapshotLoaded, initialSnapshot, readOnly = false }: { specialty?: string; onSnapshotLoaded?: (exists: boolean) => void; initialSnapshot?: HistoricalEpaSnapshot | null; readOnly?: boolean }) {
  const specialty = normalizeHistoricalSpecialty(specialtyInput);
  const [snapshot, setSnapshot] = useState<HistoricalEpaSnapshot | null>(() => initialSnapshot ?? null);
  const [loading, setLoading] = useState(initialSnapshot === undefined);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [pending, setPending] = useState<HistoricalEpaSnapshot | null>(null);
  const [importError, setImportError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("outstanding");
  const inputId = useId();

  useEffect(() => {
    if (readOnly) {
      setSnapshot(initialSnapshot ?? null);
      setLoading(false);
      onSnapshotLoaded?.(initialSnapshot != null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    void (async () => {
      try {
        const response = await fetch(`/api/epa/progress-snapshot?specialty=${encodeURIComponent(specialty)}`, { credentials: "include", cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error(response.status === 401 ? "Sign in to load your private EPA progress." : "Could not load your saved EPA progress. Please try again.");
        const data = await response.json() as ProgressResponse;
        const parsed = data.snapshot === null ? null : historicalEpaSnapshotSchema.safeParse(data.snapshot);
        if (parsed && !parsed.success) throw new Error("The saved progress could not be read. Please import your progress again.");
        setSnapshot(parsed?.success ? parsed.data : null);
        onSnapshotLoaded?.(parsed?.success === true);
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error instanceof Error ? error.message : "Could not load your saved EPA progress.");
          onSnapshotLoaded?.(false);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [specialty, reload, onSnapshotLoaded, initialSnapshot, readOnly]);

  const view = useMemo(() => snapshot ? buildHistoricalProgressView(snapshot) : null, [snapshot]);
  const summary = useMemo(() => snapshot ? summarizeHistoricalProgress(snapshot, specialty) : null, [snapshot, specialty]);
  const pendingSummary = useMemo(() => pending ? summarizeHistoricalProgress(pending, specialty) : null, [pending, specialty]);
  const query = search.trim().toLocaleLowerCase();
  const filteredRows = view?.rows.filter(row => (status === "all" || (status === "outstanding" ? row.completion_status !== "complete" : row.completion_status === "complete"))
    && (stage === "all" || row.stage === stage)
    && (!query || `${row.code} ${row.title} ${row.records.map(record => `${record.code} ${record.title} ${record.criteria.map(criterion => criterion.criterion).join(" ")}`).join(" ")}`.toLocaleLowerCase().includes(query))) ?? [];
  const sharedRecords = view?.sharedRecords.filter(record => (status === "all" || (status === "outstanding" ? record.completion_status !== "complete" : record.completion_status === "complete"))
    && (stage === "all" || stageFor(record.code) === stage)
    && (!query || `${record.code} ${record.title} ${record.criteria.map(criterion => criterion.criterion).join(" ")}`.toLocaleLowerCase().includes(query))) ?? [];

  const reviewImport = useCallback((text: string) => {
    setPending(null);
    setImportError("");
    setSavedMessage("");
    try {
      const parsed: unknown = JSON.parse(text);
      const result = parseHistoricalProgressForSpecialty(parsed, specialty);
      setPending(result.snapshot);
    } catch (error) {
      setImportError(error instanceof SyntaxError ? "This is not valid JSON. Choose your prepared progress JSON file or check the pasted text." : error instanceof Error ? error.message : "Could not read this progress file.");
    }
  }, [specialty]);

  async function saveImport() {
    if (!pending || saving) return;
    setSaving(true);
    setImportError("");
    try {
      const response = await fetch("/api/epa/progress-snapshot", {
        method: "PUT", credentials: "include", headers: { "content-type": "application/json" },
        body: JSON.stringify({ specialty, snapshot: pending }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not save your progress. Please try again.");
      const parsed = historicalEpaSnapshotSchema.safeParse(data.snapshot);
      if (!parsed.success) throw new Error("The server could not confirm the saved progress. Reload to check your account.");
      setSnapshot(parsed.data);
      setPending(null);
      setImportText("");
      setShowImport(false);
      setLoadError("");
      setStatus("outstanding");
      setSavedMessage("Your EPA progress is saved to your account.");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Could not save your progress.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.heading}>
        <div><h2>{readOnly ? "EPA progress" : "My EPA progress"}</h2><p>{snapshot ? `Reviewed ${formatDate(snapshot.source.review_date)} · ${snapshot.source.filename}` : readOnly ? "No imported progress summary is available." : "Bring your existing completion record and remaining requirements into Hippo."}</p></div>
        {!readOnly ? <button className={styles.secondaryButton} type="button" onClick={() => { setShowImport(current => !current); setImportError(""); }}>{showImport ? "Close import" : snapshot ? "Update progress" : "Import progress"}</button> : null}
      </div>
      {savedMessage ? <p className={styles.success} role="status">{savedMessage}</p> : null}
      {loadError ? <div className={styles.error} role="alert">{loadError} <button type="button" onClick={() => setReload(current => current + 1)}>Retry</button></div> : null}
      {!readOnly && showImport ? (
        <section className={styles.importPanel} aria-label="Import existing EPA progress">
          <h3>Import your existing progress</h3>
          <p>Choose a prepared progress JSON file or paste its contents. Review the summary before saving. Saving replaces your previous progress snapshot.</p>
          <label className={styles.fileLabel} htmlFor={`${inputId}-file`}>Progress JSON file</label>
          <input id={`${inputId}-file`} className={styles.fileInput} type="file" accept=".json,application/json" disabled={saving} onChange={async event => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (file.size > MAX_HISTORICAL_EPA_BYTES) { setImportError("Choose a JSON file of 256 KiB or smaller."); return; }
            try { const text = await file.text(); setImportText(text); reviewImport(text); } catch { setImportError("Could not read this file. Try selecting it again."); }
          }} />
          <label className={styles.fileLabel} htmlFor={`${inputId}-json`}>Or paste progress JSON</label>
          <textarea id={`${inputId}-json`} className={styles.textarea} value={importText} spellCheck={false} placeholder="Paste the prepared progress JSON here" disabled={saving} onChange={event => { setImportText(event.target.value); setPending(null); setImportError(""); }} />
          <button type="button" className={styles.secondaryButton} disabled={!importText.trim() || saving} onClick={() => reviewImport(importText)}>Review import</button>
          {pending && pendingSummary ? <div className={styles.importReview}>
            <strong>Ready to save: {pending.source.filename}</strong>
            <p>Reviewed {formatDate(pending.source.review_date)}</p>
            <EpaProgressTotals summary={pendingSummary} />
            <p>{pending.records.length} requirement components. Existing case logs and individual assessments stay separate.</p>
            <button type="button" className={styles.primaryButton} disabled={saving} onClick={() => void saveImport()}>{saving ? "Saving progress…" : "Save progress to my account"}</button>
          </div> : null}
          {importError ? <p className={styles.error} role="alert">{importError}</p> : null}
        </section>
      ) : null}
      {loading ? <p className={styles.loading} role="status">Loading your progress…</p> : snapshot && view && summary ? (
        <>
          <EpaProgressTotals summary={summary} />
          <p className={styles.explanation}>{snapshot.interpretation?.unlisted_epa_status === "complete" ? `EPA categories${snapshot.interpretation?.unlisted_criterion_status === "complete" ? " and criteria" : ""} omitted from ${readOnly ? "the" : "your"} source are marked complete${readOnly ? " under the resident’s stated interpretation" : ", as you confirmed"}. ` : `Completion follows ${readOnly ? "the" : "your"} imported record. `}Actual counts remain unknown where the source does not give them. {readOnly ? "Source record shown for program review." : "This progress is private to your account."}</p>
          <div className={styles.filters}>
            <label className={styles.searchLabel}>Search EPAs and requirements<input type="search" placeholder="Search code, procedure or requirement" value={search} onChange={event => setSearch(event.target.value)} /></label>
            <label>Category status<select value={status} onChange={event => setStatus(event.target.value as StatusFilter)}><option value="outstanding">Remaining ({view.outstanding})</option><option value="complete">Completed ({view.completed})</option><option value="all">All categories ({view.rows.length})</option></select></label>
            <label>Stage<select value={stage} onChange={event => setStage(event.target.value)}><option value="all">All stages</option>{STAGES.filter(item => view.rows.some(row => row.stage === item)).map(item => <option key={item} value={item}>{item}</option>)}</select></label>
          </div>
          <div className={styles.listHeading}><h3>{status === "complete" ? "Completed EPA categories" : status === "all" ? "All EPA categories" : readOnly ? "Remaining requirements" : "What you have left"}</h3><span>{filteredRows.length} {filteredRows.length === 1 ? "category" : "categories"}</span></div>
          <p className={styles.checklistHint}>Expand an EPA for its checklist. Requirements can overlap; remaining counts are not added together.</p>
          <div className={styles.epaList}>{filteredRows.map(row => <ProgressEpaRow key={row.code} row={row} />)}</div>
          {sharedRecords.length ? <section className={styles.sharedSection} aria-label="Shared requirements"><h3>Shared requirements</h3><p>This shared logbook is shown separately from the category checklist.</p>{sharedRecords.map(record => <details key={record.code} className={styles.epaRow}><summary className={styles.epaSummary}><span className={styles.epaCode}>{record.code}</span><span className={styles.epaTitle}>{record.title}</span><span className={styles.chevron} aria-hidden="true">›</span></summary><div className={styles.epaDetails}><RecordRequirements record={record} /></div></details>)}</section> : null}
          {!filteredRows.length && !sharedRecords.length ? <div className={styles.empty}><p>No EPAs match these filters.</p><button className={styles.secondaryButton} type="button" onClick={() => { setSearch(""); setStage("all"); setStatus("all"); }}>Show all EPAs</button></div> : null}
        </>
      ) : !loadError ? <div className={styles.empty}>{readOnly ? <p>No imported EPA progress is available.</p> : <><h3>Your existing progress belongs here</h3><p>Import a progress summary to see finished EPAs and the exact requirements you have left. Individual observations are available in the Observations tab.</p><button type="button" className={styles.primaryButton} onClick={() => setShowImport(true)}>Import progress</button></>}</div> : null}
    </div>
  );
}
