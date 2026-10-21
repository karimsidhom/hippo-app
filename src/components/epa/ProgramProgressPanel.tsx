'use client';

import { useEffect, useRef, useState } from 'react';
import { EpaProgressTotals, HistoricalEpaProgress, normalizeHistoricalSpecialty } from './HistoricalEpaProgress';
import type { HistoricalProgressSummary } from '@/lib/epa/progress-summary';
import { historicalEpaSnapshotSchema, type HistoricalEpaSnapshot } from '@/lib/epa/historical-progress';
import styles from './ProgramProgressPanel.module.css';

export interface ProgramProgressResident {
  userId: string; name: string | null; email: string; specialty: string | null;
  historicalProgress?: { summary: HistoricalProgressSummary | null; sourceFilename: string; reviewDate: string; contentHash: string; reconciliationStatus: string; reviewedAt: string | null; specialtySlug?: string } | null;
}
interface Target { id: string; procedureDefinitionId: string; procedureName: string; target: number; version: number; effectiveAt: string; agreedAt: string }
interface Option { id: string; name: string }
interface SourceContext { programId: string; residentId: string; specialty: string; contentHash: string }

export function matchesProgramProgressSource(source: SourceContext | null, context: SourceContext) {
  return source !== null && source.programId === context.programId && source.residentId === context.residentId && source.specialty === context.specialty && source.contentHash === context.contentHash;
}

export function AgreedTargetList({ targets, loading, loaded, now = Date.now() }: { targets: Target[]; loading: boolean; loaded: boolean; now?: number }) {
  if (loading) return <p role="status">Loading agreed targets…</p>;
  if (!loaded) return <p>Agreed targets are unavailable. Refresh to try again.</p>;
  if (!targets.length) return <p>No agreed targets have been recorded.</p>;
  return <ul>{targets.map(target => <li key={target.id}>{target.procedureName}: <strong>{target.target}</strong> · version {target.version} · agreed {target.agreedAt.slice(0, 10)} · effective {target.effectiveAt.slice(0, 10)}{new Date(target.effectiveAt).getTime() > now ? ' · Scheduled' : ''}</li>)}</ul>;
}

export function ProgramProgressPanel({ programId, residents, canManage, onRefresh }: { programId: string; residents: ProgramProgressResident[]; canManage: boolean; onRefresh: () => void }) {
  const [residentId, setResidentId] = useState('');
  const [source, setSource] = useState<(SourceContext & { snapshot: HistoricalEpaSnapshot }) | null>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [procedure, setProcedure] = useState('');
  const [target, setTarget] = useState('');
  const [effectiveAt, setEffectiveAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [agreed, setAgreed] = useState(false);
  const [sourceBusy, setSourceBusy] = useState(false);
  const [targetBusy, setTargetBusy] = useState(false);
  const [targetsLoading, setTargetsLoading] = useState(true);
  const [targetsLoaded, setTargetsLoaded] = useState(false);
  const sourceVersion = useRef(0);
  const targetVersion = useRef(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const selected = residents.find(r => r.userId === residentId) ?? residents[0];
  const history = selected?.historicalProgress;
  const specialty = history?.specialtySlug || normalizeHistoricalSpecialty(selected?.specialty ?? '');
  const busy = sourceBusy || targetBusy;
  const sourceMatches = matchesProgramProgressSource(source, { programId, residentId: selected?.userId ?? '', specialty, contentHash: history?.contentHash ?? '' });

  useEffect(() => {
    sourceVersion.current++;
    setSource(null); setMessage(''); setError(''); setSourceBusy(false);
    return () => { sourceVersion.current++; };
  }, [programId, selected?.userId, specialty, history?.contentHash]);
  useEffect(() => {
    const controller = new AbortController();
    const version = ++targetVersion.current;
    setTargets([]); setOptions([]); setProcedure(''); setTarget(''); setAgreed(false);
    setTargetsLoading(true); setTargetsLoaded(false); setTargetBusy(false);
    void fetch(`/api/programs/${encodeURIComponent(programId)}/targets`, { signal: controller.signal, cache: 'no-store' }).then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? 'Could not load program targets.');
      if (controller.signal.aborted || version !== targetVersion.current) return;
      setTargets(data.targets); setOptions(data.options); setTargetsLoaded(true);
    }).catch(e => { if (!controller.signal.aborted && version === targetVersion.current) setError(e instanceof Error ? e.message : 'Could not load program targets.'); })
      .finally(() => { if (!controller.signal.aborted && version === targetVersion.current) setTargetsLoading(false); });
    return () => { controller.abort(); targetVersion.current++; };
  }, [programId]);

  async function reviewSource() {
    if (!selected || !history || busy) return;
    if (!specialty) { setError('No specialty is configured for this progress summary.'); return; }
    const version = ++sourceVersion.current;
    setSourceBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/programs/${encodeURIComponent(programId)}/epa-reconciliation?${new URLSearchParams({ residentId: selected.userId, specialty })}`, { cache: 'no-store' });
      const data = await response.json(); if (!response.ok || !data.snapshot) throw new Error(data.error ?? 'No imported source available.');
      if (version !== sourceVersion.current) return;
      if (data.contentHash !== history.contentHash) { setError('This import changed. Refresh and review its latest version.'); onRefresh(); return; }
      const parsed = historicalEpaSnapshotSchema.safeParse(data.snapshot);
      if (!parsed.success) throw new Error('The imported source could not be read.');
      setSource({ snapshot: parsed.data, programId, specialty, residentId: selected.userId, contentHash: data.contentHash });
    } catch (e) { if (version === sourceVersion.current) setError(e instanceof Error ? e.message : 'Could not load source.'); }
    finally { if (version === sourceVersion.current) setSourceBusy(false); }
  }
  async function recordReview(decision: 'approved' | 'needs_review') {
    if (!canManage || !source || !sourceMatches || busy) return;
    const version = ++sourceVersion.current;
    setSourceBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/programs/${encodeURIComponent(source.programId)}/epa-reconciliation`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ residentId: source.residentId, specialty: source.specialty, contentHash: source.contentHash, decision }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? 'Could not save review.');
      if (version !== sourceVersion.current) return;
      setMessage(decision === 'approved' ? 'This source version is approved for program reporting.' : 'This source version is marked for further review.');
      onRefresh();
    } catch (e) { if (version === sourceVersion.current) setError(e instanceof Error ? e.message : 'Could not save review.'); }
    finally { if (version === sourceVersion.current) setSourceBusy(false); }
  }
  async function saveTarget(event: React.FormEvent) {
    event.preventDefault();
    if (!canManage || !agreed || !targetsLoaded || busy) return;
    const version = ++targetVersion.current;
    setTargetBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/programs/${encodeURIComponent(programId)}/targets`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ procedureDefinitionId: procedure, target: Number(target), effectiveAt, agreed }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? 'Could not save target.');
      if (version !== targetVersion.current) return;
      setTargetsLoaded(false); setTargetsLoading(true);
      const refresh = await fetch(`/api/programs/${encodeURIComponent(programId)}/targets`, { cache: 'no-store' });
      if (!refresh.ok) throw new Error('Target saved; refresh to load it.');
      const refreshed = await refresh.json();
      if (version !== targetVersion.current) return;
      setTargets(refreshed.targets); setTargetsLoaded(true); setTarget(''); setAgreed(false); setMessage('Agreed target saved as a new version.');
    } catch (e) { if (version === targetVersion.current) setError(e instanceof Error ? e.message : 'Could not save target.'); }
    finally { if (version === targetVersion.current) { setTargetBusy(false); setTargetsLoading(false); } }
  }
  return <section className={styles.panel} aria-label="Program EPA progress and agreed targets">
    <h2>EPA progress and program targets</h2>
    <p>Imported history, signed observations and procedure targets retain their own source and review status. Overlapping observations are never added automatically.</p>
    {residents.length ? <>
      <label className={styles.field}>Resident<select disabled={busy} value={selected?.userId ?? ''} onChange={e => setResidentId(e.target.value)}>{residents.map(r => <option key={r.userId} value={r.userId}>{r.name ?? r.email}</option>)}</select></label>
      {history?.summary ? <><EpaProgressTotals summary={history.summary} /><p>Source: {history.sourceFilename} · reviewed {history.reviewDate} · <strong>{history.reconciliationStatus.replaceAll('_', ' ')}</strong></p><button disabled={busy} onClick={reviewSource}>Review imported checklist</button></> : <p>No historical EPA progress imported for this resident. Totals are unknown.</p>}
      {source && sourceMatches ? <details open><summary>Imported source checklist</summary><HistoricalEpaProgress specialty={source.specialty} initialSnapshot={source.snapshot} readOnly />{canManage ? <div className={styles.actions}><button disabled={busy} onClick={() => recordReview('approved')}>Approve this source version</button><button disabled={busy} onClick={() => recordReview('needs_review')}>Needs further review</button></div> : null}</details> : null}
    </> : <p>No residents are currently visible in this program.</p>}
    <h3>Agreed procedure targets</h3>
    <p>Targets apply to the full training log and count matching procedures from Hippo’s procedure list across all roles. Unmatched cases need review. A new agreement preserves earlier versions.</p>
    <AgreedTargetList targets={targets} loading={targetsLoading} loaded={targetsLoaded} />
    {canManage ? <details><summary>Set or update agreed targets</summary><form onSubmit={saveTarget} className={styles.form}>
      <label className={styles.field}>Procedure<select disabled={busy || !targetsLoaded} required value={procedure} onChange={e => setProcedure(e.target.value)}><option value="">Choose a procedure</option>{options.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label className={styles.field}>Required cases<input disabled={busy || !targetsLoaded} required type="number" min="1" max="100000" step="1" value={target} onChange={e => setTarget(e.target.value)} /></label>
      <label className={styles.field}>Effective date<input disabled={busy || !targetsLoaded} required type="date" value={effectiveAt} onChange={e => setEffectiveAt(e.target.value)} /></label>
      <label className={styles.agreement}><input disabled={busy || !targetsLoaded} required type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />I confirm this target is agreed by the program.</label>
      <button disabled={busy || !targetsLoaded || !agreed}>{targetBusy ? 'Saving agreed target…' : 'Save agreed target'}</button>
    </form></details> : null}
    {message ? <p role="status">{message}</p> : null}{error ? <p role="alert">{error}</p> : null}
  </section>;
}
