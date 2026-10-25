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
  const [error, setError] = useState<string | null>(null);
  // Set when the start failed because this resident is not on the roster of
  // any program the caller directs. That is the one failure with a cure the
  // director can apply right here, so we offer it instead of a dead end.
  const [offRoster, setOffRoster] = useState(false);
  const [myPrograms, setMyPrograms] = useState<{ id: string; name: string }[]>([]);
  // Until the lookup resolves we know nothing about the caller's programs, and
  // an empty list must not be read as "directs none" — that sentence would be
  // shown to an actual program director while his own programs were loading.
  const [programsLoaded, setProgramsLoaded] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [invitedTo, setInvitedTo] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

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

  /** Programs the caller can actually invite into (OWNER or PD). */
  const loadMyPrograms = useCallback(async () => {
    try {
      const res = await fetch('/api/programs', { credentials: 'include' });
      if (!res.ok) return;
      const d = await res.json();
      const mine = (d.programs ?? []).filter(
        (p: { myRole?: string }) => p.myRole === 'OWNER' || p.myRole === 'PD',
      );
      setMyPrograms(mine.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
    } catch {
      /* leave the list empty; programsLoaded still flips so the panel settles */
    } finally {
      setProgramsLoaded(true);
    }
  }, []);

  const start = async () => {
    if (starting) return;
    setStarting(true);
    setError(null);
    setOffRoster(false);
    setInviteError(null);
    setInvitedTo(null);
    try {
      const res = await fetch('/api/pd/meetings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ residentId }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        const msg = typeof e?.error === 'string' ? e.error : 'Could not start a meeting.';
        setError(msg);
        if (/not in a program you direct/i.test(msg)) {
          setOffRoster(true);
          setProgramsLoaded(false);
          void loadMyPrograms();
        }
        return;
      }
      const d = await res.json();
      router.push(`/pd-dashboard/${residentId}/meetings/${d.meeting.id}`);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setStarting(false);
    }
  };

  const invite = async (programId: string, programName: string) => {
    if (inviting) return;
    setInviting(true);
    setInviteError(null);
    try {
      const res = await fetch(`/api/programs/${programId}/join-requests/invite`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: residentId }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Keep offRoster set so the buttons stay on screen; show the real
        // reason rather than repeating the generic roster sentence.
        setInviteError(
          typeof d?.error === 'string' ? d.error : 'Could not send the invitation.',
        );
        return;
      }
      setError(null);
      setOffRoster(false);
      setInvitedTo(programName);
    } catch {
      setInviteError('Could not reach the server. Check your connection and try again.');
    } finally {
      setInviting(false);
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

      {invitedTo && (
        <p
          role="status"
          style={{
            margin: 0,
            padding: '12px 16px',
            fontSize: 13,
            lineHeight: 1.5,
            color: 'var(--text-2)',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface2)',
          }}
        >
          Invitation sent. They join {invitedTo} by accepting it on their own
          dashboard, and the 1:1 can start once they have.
        </p>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface2)',
          }}
        >
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--text-2)' }}>
            {offRoster
              ? 'This resident is not on the roster of a program you direct, so there is no program to file the meeting under.'
              : error}
          </p>

          {inviteError && (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-2)' }}>
              {inviteError}
            </p>
          )}

          {offRoster && !programsLoaded && (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-3)' }}>
              Checking your programs...
            </p>
          )}

          {offRoster && programsLoaded && myPrograms.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {myPrograms.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => void invite(p.id, p.name)}
                  disabled={inviting}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-mid)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: inviting ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {inviting
                    ? 'Sending...'
                    : myPrograms.length === 1
                      ? 'Invite them to your program'
                      : `Invite to ${p.name}`}
                </button>
              ))}
            </div>
          )}

          {offRoster && programsLoaded && myPrograms.length === 0 && (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-3)' }}>
              You do not direct a program yet. Create one under Programs, then
              invite this resident to it.
            </p>
          )}
        </div>
      )}

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
                    timeZone: 'UTC',
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
