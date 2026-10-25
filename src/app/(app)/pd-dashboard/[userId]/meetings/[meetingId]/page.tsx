'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SectionEditor } from '@/components/pd-meeting/SectionEditor';
import { ScoreTables, type ScoreRow } from '@/components/pd-meeting/ScoreTables';
import { ChecklistPanel, type ChecklistState } from '@/components/pd-meeting/ChecklistPanel';
import type { SectionView } from '@/lib/pd-meeting/carry-forward';
import {
  GOALS_SECTION_ID,
  type PdBullet,
  type PdGoalOutcome,
  type PdSections,
} from '@/lib/pd-meeting/types';
import type { ChecklistDef, ScoreTableDef } from '@/lib/pd-meeting/types';

interface MeetingHead {
  id: string;
  programId: string;
  residentId: string;
  meetingDate: string;
  cycleLabel: string | null;
  pgyAtMeeting: number | null;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string | null;
  acknowledgedAt: string | null;
  previousMeetingDate: string | null;
  resident: { id: string; name: string | null; email: string };
}

interface Config {
  checklists: ChecklistDef[];
  scoreTables: ScoreTableDef[];
  introText: string | null;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function MeetingPage() {
  const { userId, meetingId } = useParams<{ userId: string; meetingId: string }>();
  const router = useRouter();

  const [meeting, setMeeting] = useState<MeetingHead | null>(null);
  const [view, setView] = useState<SectionView[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [scores, setScores] = useState<Record<string, ScoreRow[]>>({});
  const [checklist, setChecklist] = useState<Record<string, ChecklistState>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [save, setSave] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [problems, setProblems] = useState<Record<string, string>>({});
  const [publishing, setPublishing] = useState(false);
  // Publishing freezes the record and notifies the resident, so it asks once.
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [reopening, setReopening] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readOnly = meeting?.status === 'PUBLISHED';

  const load = useCallback(async () => {
    const res = await fetch(`/api/pd/meetings/${meetingId}`, { credentials: 'include' });
    if (!res.ok) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const d = await res.json();
    setMeeting(d.meeting);
    setView(d.view);
    setConfig(d.config);
    setScores(d.scores ?? {});
    setChecklist(d.checklist ?? {});
    setLoading(false);
  }, [meetingId]);

  useEffect(() => { void load(); }, [load]);

  /** Turn the eight rows back into the stored shape. */
  const toSections = (rows: SectionView[]): PdSections => {
    const out: PdSections = {};
    for (const r of rows) {
      out[r.id] =
        r.id === GOALS_SECTION_ID
          ? { bullets: r.current, answers: r.answers }
          : { bullets: r.current };
    }
    return out;
  };

  const persist = useCallback(
    async (rows: SectionView[]) => {
      setSave('saving');
      try {
        const res = await fetch(`/api/pd/meetings/${meetingId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sections: toSections(rows) }),
        });
        if (!res.ok) throw new Error('save failed');
        setSave('saved');
        setSavedAt(new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' }));
      } catch {
        setSave('error');
      }
    },
    [meetingId],
  );

  /** Autosave on a 2 second debounce. Meetings are filled live, in front of
   *  the resident, so losing what was just typed would be bad. */
  const onSectionChange = (
    sectionId: string,
    patch: { current: PdBullet[]; answers: Record<string, PdGoalOutcome> },
  ) => {
    const next = view.map((s) =>
      s.id === sectionId ? { ...s, current: patch.current, answers: patch.answers } : s,
    );
    setView(next);
    setProblems({});
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(next), 2000);
  };

  /**
   * The letter's own date and cycle label. PATCH has always accepted both;
   * nothing in the UI ever sent them, so every record was stamped with the
   * instant "Start a meeting" was clicked and could never say "PGY-3 mid-year".
   */
  const saveMeta = async (patch: { meetingDate?: string; cycleLabel?: string }) => {
    setSave('saving');
    try {
      const res = await fetch(`/api/pd/meetings/${meetingId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('save failed');
      setMeeting((m) =>
        m
          ? {
              ...m,
              ...(patch.meetingDate ? { meetingDate: patch.meetingDate } : {}),
              ...(patch.cycleLabel !== undefined ? { cycleLabel: patch.cycleLabel || null } : {}),
            }
          : m,
      );
      setSave('saved');
      setSavedAt(new Date().toISOString());
    } catch {
      setSave('error');
    }
  };

  /** Send a published record back to draft so a mistake can be corrected. */
  const reopen = async () => {
    if (reopening) return;
    setReopening(true);
    try {
      const res = await fetch(`/api/pd/meetings/${meetingId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DRAFT' }),
      });
      if (res.ok) await load();
    } finally {
      setReopening(false);
    }
  };

  const flush = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
      void persist(view);
    }
  };

  const publish = async () => {
    flush();
    setPublishing(true);
    setProblems({});
    try {
      // Make sure the last keystrokes are in before validating.
      await persist(view);
      const res = await fetch(`/api/pd/meetings/${meetingId}/publish`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.status === 409) {
        const d = await res.json();
        const map: Record<string, string> = {};
        for (const p of d.problems ?? []) map[p.sectionId] = p.message;
        setProblems(map);
        const first = (d.problems ?? [])[0];
        if (first) {
          document.getElementById(`section-${first.sectionId}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      if (!res.ok) throw new Error('publish failed');
      await load();
    } catch {
      setProblems({ _: 'Could not publish. Please try again.' });
    } finally {
      setPublishing(false);
    }
  };

  const addScore = async (tableId: string, sittingAt: string, values: Record<string, string>) => {
    if (!meeting) return;
    await fetch(`/api/pd/residents/${meeting.residentId}/scores`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programId: meeting.programId, tableId, sittingAt, values }),
    });
    await load();
  };

  const deleteScore = async (id: string) => {
    if (!meeting) return;
    await fetch(`/api/pd/residents/${meeting.residentId}/scores?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await load();
  };

  const toggleItem = async (itemId: string, completed: boolean) => {
    if (!meeting) return;
    setChecklist((c) => ({ ...c, [itemId]: { completed, completedAt: null, note: null } }));
    await fetch(`/api/pd/residents/${meeting.residentId}/checklist`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programId: meeting.programId, itemId, completed }),
    });
  };

  if (loading) {
    return <p style={{ padding: 24, color: 'var(--text-3)' }}>Loading the record...</p>;
  }
  if (notFound || !meeting || !config) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: 'var(--text-3)' }}>This record is not available.</p>
        <Link href="/pd-dashboard" style={{ color: 'var(--primary)' }}>Back to the dashboard</Link>
      </div>
    );
  }

  const saveLabel =
    save === 'saving' ? 'Saving' :
    save === 'error' ? 'Not saved' :
    savedAt ? `Saved ${savedAt}` : 'No changes yet';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px 80px' }}>
      <Link
        href={`/pd-dashboard/${userId}`}
        style={{ fontSize: 13, color: 'var(--text-3)', textDecoration: 'none' }}
      >
        ← {meeting.resident.name ?? meeting.resident.email}
      </Link>

      <header style={{ margin: '12px 0 20px' }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
          Program Director 1:1
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-2)' }}>
          {meeting.resident.name ?? meeting.resident.email}
          {meeting.pgyAtMeeting ? ` · PGY-${meeting.pgyAtMeeting}` : ''}
          {' · '}
          {new Date(meeting.meetingDate).toLocaleDateString('en-CA', {
            year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
          })}
          {meeting.cycleLabel ? ` · ${meeting.cycleLabel}` : ''}
        </p>

        {!readOnly && (
          <div
            style={{
              display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 10,
              alignItems: 'flex-end',
            }}
          >
            <label style={{ display: 'grid', gap: 4 }}>
              <span style={metaLabel}>Date of this meeting</span>
              <input
                type="date"
                defaultValue={meeting.meetingDate.slice(0, 10)}
                onBlur={(e) =>
                  e.target.value &&
                  e.target.value !== meeting.meetingDate.slice(0, 10) &&
                  void saveMeta({ meetingDate: e.target.value })
                }
                style={metaInput}
              />
            </label>
            <label style={{ display: 'grid', gap: 4, flex: '1 1 220px' }}>
              <span style={metaLabel}>Cycle</span>
              <input
                type="text"
                placeholder="e.g. PGY-3 mid-year"
                defaultValue={meeting.cycleLabel ?? ''}
                onBlur={(e) =>
                  e.target.value !== (meeting.cycleLabel ?? '') &&
                  void saveMeta({ cycleLabel: e.target.value })
                }
                style={metaInput}
              />
            </label>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <span
            style={{
              fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
              padding: '3px 10px', borderRadius: 999,
              background: readOnly ? 'var(--success)' : 'var(--surface2)',
              color: readOnly ? '#fff' : 'var(--text-3)',
            }}
          >
            {readOnly ? 'Published' : 'Draft'}
          </span>
          {!readOnly && (
            <span style={{ fontSize: 12, color: save === 'error' ? 'var(--danger)' : 'var(--text-3)' }}>
              {saveLabel}
            </span>
          )}
          {readOnly && (
            <>
              <a
                href={`/api/pd/meetings/${meetingId}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  border: '1px solid var(--primary)', color: 'var(--primary)',
                  textDecoration: 'none',
                }}
              >
                Open the letter
              </a>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                {meeting.acknowledgedAt
                  ? `Confirmed by the resident on ${new Date(meeting.acknowledgedAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}`
                  : 'Sent to the resident, awaiting their confirmation.'}
              </span>
              <button
                type="button"
                onClick={() => void reopen()}
                disabled={reopening}
                title="Send this record back to draft so it can be corrected"
                style={{
                  padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  border: '1px solid var(--border-mid)', background: 'var(--surface)',
                  color: 'var(--text-2)', cursor: reopening ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {reopening ? 'Reopening...' : 'Reopen for editing'}
              </button>
            </>
          )}
        </div>
      </header>

      {problems._ && (
        <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{problems._}</p>
      )}

      <div onBlur={flush}>
        {view.map((s) => (
          <SectionEditor
            key={s.id}
            view={s}
            isGoals={s.id === GOALS_SECTION_ID}
            previousDate={meeting.previousMeetingDate}
            readOnly={readOnly}
            problem={problems[s.id]}
            onChange={(next) => onSectionChange(s.id, next)}
          />
        ))}
      </div>

      <h2 style={sectionHeading}>Exam results</h2>
      <ScoreTables
        tables={config.scoreTables}
        scores={scores}
        readOnly={readOnly}
        onAdd={addScore}
        onDelete={deleteScore}
      />

      <h2 style={sectionHeading}>Curriculum</h2>
      <ChecklistPanel
        checklists={config.checklists}
        state={checklist}
        pgy={meeting.pgyAtMeeting}
        readOnly={readOnly}
        onToggle={toggleItem}
      />

      {!readOnly && (
        <div
          style={{
            position: 'sticky', bottom: 0, marginTop: 20, padding: '12px 0',
            background: 'linear-gradient(to top, var(--bg, #0a0a0f) 70%, transparent)',
            display: 'flex', justifyContent: 'flex-end', gap: 10,
          }}
        >
          <button
            type="button"
            onClick={() => router.push(`/pd-dashboard/${userId}`)}
            style={{
              padding: '10px 18px', borderRadius: 9, border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text-2)', fontSize: 14,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Finish later
          </button>
          <button
            type="button"
            onClick={() => {
              if (!confirmPublish) {
                setConfirmPublish(true);
                return;
              }
              setConfirmPublish(false);
              void publish();
            }}
            disabled={publishing}
            style={{
              padding: '10px 22px', borderRadius: 9, border: '1px solid var(--primary)',
              background: 'var(--primary)', color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: publishing ? 'wait' : 'pointer', fontFamily: 'inherit',
              opacity: publishing ? 0.6 : 1,
            }}
          >
            {publishing
              ? 'Publishing...'
              : confirmPublish
                ? 'Yes, publish it'
                : 'Publish this record'}
          </button>
          {confirmPublish && !publishing && (
            <button
              type="button"
              onClick={() => setConfirmPublish(false)}
              style={{
                padding: '10px 16px', borderRadius: 9,
                border: '1px solid var(--border-mid)', background: 'var(--surface)',
                color: 'var(--text-2)', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', marginLeft: 8,
              }}
            >
              Not yet
            </button>
          )}
          {confirmPublish && !publishing && (
            <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--text-2)' }}>
              This locks the record, sends it to the resident and freezes the
              exam tables and checklist as they stand. You can reopen it
              afterwards, which clears their confirmation.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const metaLabel: React.CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: 'var(--text-3)',
  fontWeight: 600,
};

const metaInput: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 8,
  border: '1px solid var(--border-mid)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: 13,
  fontFamily: 'inherit',
  width: '100%',
};

const sectionHeading: React.CSSProperties = {
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-3)',
  margin: '26px 0 10px',
  fontWeight: 700,
};
