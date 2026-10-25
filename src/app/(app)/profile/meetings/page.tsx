'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface MyMeeting {
  id: string;
  meetingDate: string;
  cycleLabel: string | null;
  pgyAtMeeting: number | null;
  publishedAt: string | null;
  acknowledgedAt: string | null;
  directorName: string;
  programName: string;
}

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });

/**
 * The resident's own 1:1 records.
 *
 * Published records only. Confirming you have read one is what replaces
 * printing, signing and scanning the letter back, so the button says what
 * it means and the record shows the date afterwards.
 */
export default function MyMeetingsPage() {
  const [meetings, setMeetings] = useState<MyMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/me/meetings', { credentials: 'include' });
      const d = res.ok ? await res.json() : { meetings: [] };
      setMeetings(d.meetings ?? []);
    } catch {
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const acknowledge = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/me/meetings/${id}/acknowledge`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        alert('Could not record that. Please try again.');
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '20px 16px 60px' }}>
      <Link href="/profile" style={{ fontSize: 13, color: 'var(--text-3)', textDecoration: 'none' }}>
        ← Profile
      </Link>

      <h1 style={{
        margin: '12px 0 6px', fontSize: 26, fontWeight: 700,
        color: 'var(--text)', letterSpacing: '-0.01em',
      }}>
        Program director 1:1
      </h1>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-2)' }}>
        Your meeting records. Open one to read it, then confirm you have seen it.
      </p>

      {loading && <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Loading...</p>}

      {!loading && meetings.length === 0 && (
        <div style={{
          padding: '28px 20px', textAlign: 'center', borderRadius: 14,
          border: '1px solid var(--border)', background: 'var(--surface)',
          color: 'var(--text-3)', fontSize: 14,
        }}>
          No meeting records yet. They appear here once your program director publishes one.
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {meetings.map((m) => {
          const acked = !!m.acknowledgedAt;
          return (
            <section
              key={m.id}
              style={{
                border: '1px solid var(--border)', borderRadius: 14,
                background: 'var(--surface)', padding: 16,
                borderLeft: acked ? '1px solid var(--border)' : '3px solid var(--primary)',
              }}
            >
              <div style={{
                display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
                alignItems: 'baseline', gap: 10,
              }}>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 650, color: 'var(--text)' }}>
                    {longDate(m.meetingDate)}
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
                    {[
                      m.pgyAtMeeting ? `PGY-${m.pgyAtMeeting}` : null,
                      m.cycleLabel,
                      m.programName,
                      m.directorName,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span style={{
                  fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
                  padding: '3px 10px', borderRadius: 999, flexShrink: 0,
                  background: acked ? 'var(--surface2)' : 'var(--primary)',
                  color: acked ? 'var(--text-3)' : '#fff',
                }}>
                  {acked ? 'Confirmed' : 'Needs your confirmation'}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
                <a
                  href={`/api/me/meetings/${m.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: '1px solid var(--border-mid, var(--border))',
                    background: 'transparent', color: 'var(--text)', textDecoration: 'none',
                  }}
                >
                  Open the letter
                </a>

                {acked ? (
                  <span style={{ fontSize: 13, color: 'var(--text-3)', alignSelf: 'center' }}>
                    Confirmed {longDate(m.acknowledgedAt!)}
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busy === m.id}
                    onClick={() => acknowledge(m.id)}
                    style={{
                      padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      border: '1px solid var(--primary)', background: 'var(--primary)',
                      color: '#fff', cursor: busy === m.id ? 'wait' : 'pointer',
                      fontFamily: 'inherit', opacity: busy === m.id ? 0.6 : 1,
                    }}
                  >
                    {busy === m.id ? 'Saving...' : 'I have read this'}
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
