'use client';

import { useId } from 'react';
import type { SectionView } from '@/lib/pd-meeting/carry-forward';
import { carryBullet } from '@/lib/pd-meeting/carry-forward';
import type { PdBullet, PdGoalOutcome } from '@/lib/pd-meeting/types';

const OUTCOMES: { value: PdGoalOutcome; label: string; tone: string }[] = [
  { value: 'met',     label: 'Met',      tone: 'var(--success)' },
  { value: 'partly',  label: 'Partly',   tone: 'var(--warning)' },
  { value: 'not_met', label: 'Not met',  tone: 'var(--danger)' },
  { value: 'carried', label: 'Carried',  tone: 'var(--text-3)' },
];

function newId(): string {
  return `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * One section of the record, rendered as the previous meeting beside this
 * one. That side-by-side is the whole point of the paper letter, so it is
 * the thing this component has to get right.
 *
 * In the goals section each previous bullet also asks what happened to it.
 * That answer is about the interval just gone and is stored in the section's
 * answers map, NOT as a bullet: writing it as a bullet used to restate every
 * answered goal as a goal for the coming six months, and deleting the
 * restatement silently un-answered it. Only "Carried" adds anything to this
 * meeting's column, because only "Carried" means the goal continues.
 */
export function SectionEditor({
  view,
  isGoals,
  previousDate,
  onChange,
  readOnly = false,
  problem,
}: {
  view: SectionView;
  isGoals: boolean;
  previousDate: string | null;
  onChange: (next: {
    current: PdBullet[];
    answers: Record<string, PdGoalOutcome>;
  }) => void;
  readOnly?: boolean;
  problem?: string;
}) {
  const uid = useId();
  const { previous, current } = view;

  const emit = (
    bullets: PdBullet[],
    answers: Record<string, PdGoalOutcome>,
  ) => !readOnly && onChange({ current: bullets, answers });

  const set = (next: PdBullet[]) => emit(next, view.answers);

  const update = (id: string, text: string) =>
    set(current.map((b) => (b.id === id ? { ...b, text } : b)));

  const remove = (id: string) => set(current.filter((b) => b.id !== id));

  const add = () => set([...current, { id: newId(), text: '' }]);

  const carry = (b: PdBullet) => set([...current, carryBullet(b)]);

  /** Record what happened to a goal the previous meeting set. */
  const setOutcome = (prevBullet: PdBullet, outcome: PdGoalOutcome) => {
    if (readOnly) return;

    const answers = { ...view.answers };
    const clearing = answers[prevBullet.id] === outcome;
    if (clearing) delete answers[prevBullet.id];
    else answers[prevBullet.id] = outcome;

    // "Carried" is the one answer that also says something about the coming
    // interval, so it states the goal in this meeting's column if nothing
    // does yet. Met / Partly / Not met describe the interval just gone and
    // leave the new column alone.
    let bullets = current;
    if (
      !clearing &&
      outcome === 'carried' &&
      !current.some((b) => b.carriedFrom === prevBullet.id)
    ) {
      bullets = [...current, carryBullet(prevBullet)];
    }

    emit(bullets, answers);
  };

  const outcomeOf = (prevId: string): PdGoalOutcome | undefined =>
    view.answers[prevId];

  return (
    <section
      style={{
        border: `1px solid ${problem ? 'var(--warning)' : 'var(--border)'}`,
        borderRadius: 12,
        marginBottom: 14,
        overflow: 'hidden',
        background: 'var(--surface)',
      }}
      id={`section-${view.id}`}
    >
      <header
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
          {view.label}
        </h3>
        {problem && (
          <span style={{ fontSize: 12, color: 'var(--warning)' }}>{problem}</span>
        )}
      </header>

      <div className="pd-cols" style={{ display: 'grid', gap: 0 }}>
        {/* Previous meeting, read-only. */}
        <div
          style={{
            padding: 14,
            borderRight: '1px solid var(--border)',
            background: 'var(--surface2)',
          }}
        >
          <p
            style={{
              margin: '0 0 8px',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-3)',
            }}
          >
            {previousDate
              ? new Date(previousDate).toLocaleDateString('en-CA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'No previous meeting'}
          </p>

          {previous.length === 0 && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>
              {previousDate ? 'Nothing recorded here last time.' : 'This is their first meeting.'}
            </p>
          )}

          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
            {previous.map((b) => (
              <li key={b.id}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1 }}>{b.text}</span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => carry(b)}
                      title="Carry forward to this meeting"
                      aria-label={`Carry forward: ${b.text}`}
                      style={{
                        flexShrink: 0,
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--text-3)',
                        borderRadius: 6,
                        padding: '2px 8px',
                        fontSize: 12,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Carry →
                    </button>
                  )}
                </div>

                {isGoals && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                    {OUTCOMES.map((o) => {
                      const on = outcomeOf(b.id) === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          disabled={readOnly}
                          onClick={() => setOutcome(b, o.value)}
                          aria-pressed={on}
                          style={{
                            border: `1px solid ${on ? o.tone : 'var(--border)'}`,
                            background: on ? o.tone : 'transparent',
                            color: on ? '#fff' : 'var(--text-3)',
                            borderRadius: 999,
                            padding: '2px 10px',
                            fontSize: 11,
                            fontWeight: on ? 600 : 400,
                            cursor: readOnly ? 'default' : 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* This meeting, editable. */}
        <div style={{ padding: 14 }}>
          <p
            style={{
              margin: '0 0 8px',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-3)',
            }}
          >
            This meeting
          </p>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            {current.map((b) => (
              <li key={b.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <textarea
                  value={b.text}
                  readOnly={readOnly}
                  rows={Math.max(1, Math.ceil(b.text.length / 48))}
                  onChange={(e) => update(b.id, e.target.value)}
                  aria-label={`${view.label} point`}
                  id={`${uid}-${b.id}`}
                  style={{
                    flex: 1,
                    resize: 'vertical',
                    minHeight: 34,
                    padding: '7px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: readOnly ? 'transparent' : 'var(--surface2)',
                    color: 'var(--text)',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    lineHeight: 1.45,
                  }}
                />
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => remove(b.id)}
                    aria-label="Remove this point"
                    title="Remove"
                    style={{
                      flexShrink: 0,
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text-3)',
                      borderRadius: 6,
                      width: 28,
                      height: 28,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>

          {!readOnly && (
            <button
              type="button"
              onClick={add}
              style={{
                marginTop: 8,
                border: '1px dashed var(--border)',
                background: 'transparent',
                color: 'var(--text-3)',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              + Add a point
            </button>
          )}

          {current.length === 0 && readOnly && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>Nothing recorded.</p>
          )}
        </div>
      </div>

      {/* Two columns on a desktop; stacked on a phone, where a squeezed
          second column would be unreadable. */}
      <style>{`
        #section-${view.id} .pd-cols { grid-template-columns: 1fr; }
        @media (min-width: 900px) {
          #section-${view.id} .pd-cols { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </section>
  );
}
