'use client';

import { useState } from 'react';
import type { ScoreTableDef } from '@/lib/pd-meeting/types';

export interface ScoreRow {
  id: string;
  sittingAt: string;
  values: Record<string, string>;
  note: string | null;
}

const cell: React.CSSProperties = {
  padding: '7px 10px',
  fontSize: 13,
  color: 'var(--text)',
  borderBottom: '1px solid var(--border)',
  textAlign: 'left',
};

const head: React.CSSProperties = {
  ...cell,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-3)',
  fontWeight: 600,
};

/**
 * The accumulating exam tables. Values are free text on purpose: the paper
 * letter records "Away" and "Post call" in the same column as 60.8, and
 * forcing numbers would lose that.
 */
export function ScoreTables({
  tables,
  scores,
  readOnly,
  onAdd,
  onDelete,
}: {
  tables: ScoreTableDef[];
  scores: Record<string, ScoreRow[]>;
  readOnly: boolean;
  onAdd: (tableId: string, sittingAt: string, values: Record<string, string>) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Record<string, Record<string, string>>>({});
  const [dates, setDates] = useState<Record<string, string>>({});

  return (
    <>
      {tables.map((t) => {
        const rows = scores[t.id] ?? [];
        const d = draft[t.id] ?? {};
        return (
          <section
            key={t.id}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              marginBottom: 14,
              overflow: 'hidden',
              background: 'var(--surface)',
            }}
          >
            <header style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                {t.title}
              </h3>
            </header>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 460 }}>
                <thead>
                  <tr>
                    <th style={head}>Date</th>
                    {t.columns.map((c) => (
                      <th key={c.id} style={head}>{c.label}</th>
                    ))}
                    {!readOnly && <th style={{ ...head, width: 40 }} aria-label="Actions" />}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td style={{ ...cell, color: 'var(--text-3)' }} colSpan={t.columns.length + 2}>
                        No sittings recorded yet.
                      </td>
                    </tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td style={cell}>
                        {new Date(r.sittingAt).toLocaleDateString('en-CA', {
                          timeZone: 'UTC',
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </td>
                      {t.columns.map((c) => (
                        <td key={c.id} style={cell}>{r.values?.[c.id] ?? ''}</td>
                      ))}
                      {!readOnly && (
                        <td style={cell}>
                          <button
                            type="button"
                            onClick={() => onDelete(r.id)}
                            aria-label="Delete this sitting"
                            title="Delete"
                            style={{
                              border: '1px solid var(--border)', background: 'transparent',
                              color: 'var(--text-3)', borderRadius: 6, width: 26, height: 26,
                              cursor: 'pointer', fontFamily: 'inherit',
                            }}
                          >
                            ×
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}

                  {!readOnly && (
                    <tr>
                      <td style={cell}>
                        <input
                          type="date"
                          value={dates[t.id] ?? ''}
                          onChange={(e) => setDates({ ...dates, [t.id]: e.target.value })}
                          aria-label={`${t.title} sitting date`}
                          style={inputStyle}
                        />
                      </td>
                      {t.columns.map((c) => (
                        <td key={c.id} style={cell}>
                          <input
                            type="text"
                            value={d[c.id] ?? ''}
                            placeholder={c.label}
                            aria-label={`${t.title} ${c.label}`}
                            onChange={(e) =>
                              setDraft({ ...draft, [t.id]: { ...d, [c.id]: e.target.value } })
                            }
                            style={inputStyle}
                          />
                        </td>
                      ))}
                      <td style={cell}>
                        <button
                          type="button"
                          disabled={!dates[t.id]}
                          onClick={() => {
                            onAdd(t.id, dates[t.id], d);
                            setDraft({ ...draft, [t.id]: {} });
                            setDates({ ...dates, [t.id]: '' });
                          }}
                          title={dates[t.id] ? 'Add this sitting' : 'Pick a date first'}
                          style={{
                            border: '1px solid var(--primary)',
                            background: dates[t.id] ? 'var(--primary)' : 'transparent',
                            color: dates[t.id] ? '#fff' : 'var(--text-3)',
                            borderRadius: 6, width: 26, height: 26,
                            cursor: dates[t.id] ? 'pointer' : 'default',
                            fontFamily: 'inherit',
                          }}
                        >
                          +
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  minWidth: 70,
  padding: '5px 8px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--surface2)',
  color: 'var(--text)',
  fontSize: 13,
  fontFamily: 'inherit',
};
