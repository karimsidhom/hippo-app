'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface MeetingRow {
  id: string;
  meetingDate: string;
  cycleLabel: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string | null;
  pgyAtMeeting: number | null;
  acknowledgedAt: string | null;
}

/**
 * The 1:1 meeting history on a resident's page, with the button that starts
 * the next one. Starting reopens an existing draft rather than creating a
 * second, so a director who navigated away mid-meeting picks up where they
 * were instead of splitting the record in two.
 */
export function MeetingsBlock({ residentId }: { residentId: string }) {
  const router = useRouter();
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/pd/meetings?residentId=${encodeURIComponent(residentId)}`, {
        credentials: 'include',
      });
      const d = res.ok ? await res.json() : { meetings: [] };
      setMeetings(d.meetings ?? []);
    } catch {
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, [residentId]);

  useEffect(() => { void load(); }, [load]);

  const start = async () => {
    if (starting) return;
    setStarting(true);
    try {
      const res = await fetch('/api/pd/meetings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ residentId }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        alert(e?.error ?? 'Could not start a meeting.');
        return;
      }
      const d = await res.json();
      router.push(`/pd-dashboard/${residentId}/meetings/${d.meeting.id}`);
    } finally {
      setStarting(false);
    }
  };

  if (loading) return null;

  return (
    <section
      style={{
        border: '1px solid var(--border)',
        borderRadius: 14,
        background: 'var(--surface)',
        marginBottom: 20,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: '12px 16px',
          borderBottom: meetings.length ? '1px solid var(--border)' : 'none',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-3)',
          }}
        >
          Program director 1:1
        </h2>
        <button
            type="button"
            onClick={start}
            disabled={starting}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: '1px solid var(--primary)',
              background: 'var(--primary)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: starting ? 'wait' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
          {starting ? 'Opening...' : 'Start a meeting'}
        </button>
      </header>

      {meetings.length === 0 ? (
        <p style={{ margin: 0, padding: '14px 16px', fontSize: 13, color: 'var(--text-3)' }}>
          No meetings recorded yet.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {meetings.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => router.push(`/pd-dashboard/${residentId}/meetings/${m.id}`)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '11px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: 'transparent',
                  border: 'none',
                  borderTop: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--text)' }}>
                  {new Date(m.meetingDate).toLocaleDateString('en-CA', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                  {m.pgyAtMeeting ? ` · PGY-${m.pgyAtMeeting}` : ''}
                  {m.cycleLabel ? ` · ${m.cycleLabel}` : ''}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '2px 9px',
                    borderRadius: 999,
                    background: m.status === 'PUBLISHED' ? 'var(--surface2)' : 'var(--warning)',
                    color: m.status === 'PUBLISHED' ? 'var(--text-3)' : '#fff',
                  }}
                >
                  {m.status === 'PUBLISHED'
                    ? m.acknowledgedAt ? 'Acknowledged' : 'Published'
                    : 'Draft'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
