'use client';

import type { ChecklistDef } from '@/lib/pd-meeting/types';

export interface ChecklistState {
  completed: boolean;
  completedAt: string | null;
  note: string | null;
}

/**
 * Parse "PGY1" or "PGY 3-5" into the year by which an item is due. Returns
 * the LAST year of a range, so "PGY 3-5" is only overdue after PGY-5.
 * Anything unparseable is never overdue, which is the safe direction.
 */
function dueBy(targetYear?: string): number | null {
  if (!targetYear) return null;
  const nums = targetYear.match(/\d+/g);
  if (!nums || nums.length === 0) return null;
  return Math.max(...nums.map(Number));
}

/**
 * Curriculum and QI ticks. Outstanding rows whose target year has passed are
 * highlighted, which is what the yellow on Practice Management means in the
 * July 2025 letter.
 */
export function ChecklistPanel({
  checklists,
  state,
  pgy,
  readOnly,
  onToggle,
}: {
  checklists: ChecklistDef[];
  state: Record<string, ChecklistState>;
  pgy: number | null;
  readOnly: boolean;
  onToggle: (itemId: string, completed: boolean) => void;
}) {
  return (
    <>
      {checklists.map((c) => {
        const outstanding = c.items.filter((i) => !state[i.id]?.completed).length;
        return (
          <section
            key={c.id}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              marginBottom: 14,
              overflow: 'hidden',
              background: 'var(--surface)',
            }}
          >
            <header
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                {c.title}
              </h3>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                {outstanding === 0
                  ? 'All complete'
                  : `${outstanding} outstanding`}
              </span>
            </header>

            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {c.items.map((i) => {
                const done = state[i.id]?.completed ?? false;
                const by = dueBy(i.targetYear);
                const overdue = !done && by !== null && pgy !== null && pgy > by;
                return (
                  <li
                    key={i.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 14px',
                      borderBottom: '1px solid var(--border)',
                      background: overdue ? 'color-mix(in srgb, var(--warning) 12%, transparent)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={done}
                      disabled={readOnly}
                      onChange={(e) => onToggle(i.id, e.target.checked)}
                      aria-label={i.label}
                      style={{ width: 16, height: 16, flexShrink: 0, accentColor: 'var(--primary)' }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: done ? 'var(--text-3)' : 'var(--text)',
                        textDecoration: done ? 'line-through' : 'none',
                      }}
                    >
                      {i.label}
                    </span>
                    {i.targetYear && (
                      <span
                        style={{
                          fontSize: 11,
                          color: overdue ? 'var(--warning)' : 'var(--text-3)',
                          fontWeight: overdue ? 600 : 400,
                          flexShrink: 0,
                        }}
                      >
                        {i.targetYear}
                        {overdue ? ' · overdue' : ''}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}
