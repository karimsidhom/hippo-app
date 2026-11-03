"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, GraduationCap, MapPin, Plus, ShieldCheck, Users2 } from "lucide-react";
import { ProgramCalendar, type CalendarEvent } from "@/components/ProgramCalendar";
import { ProgramDocumentsSection } from "@/components/programs/ProgramDocumentsSection";
import { ProgramMembersSection } from "@/components/programs/ProgramMembersSection";
import { isPdLike, ROLE_LABELS, type ProgramDetail } from "@/components/programs/types";
import { useAuth } from "@/context/AuthContext";
import "@/components/programs/program-hub.css";

export default function ProgramHubPage() {
  const { id } = useParams<{ id: string }>();
  return <ProgramHub key={id} programId={id} />;
}

function ProgramHub({ programId: id }: { programId: string }) {
  const router = useRouter();
  const { profile } = useAuth();
  const [detail, setDetail] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/programs/${id}`, { credentials: "include" });
      const data = (await res.json()) as ProgramDetail & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not load this program.");
      setDetail(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this program.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadUpcoming = useCallback(async () => {
    const from = new Date();
    const to = new Date(from.getTime() + 365 * 86400_000);
    const query = new URLSearchParams({ programId: id, from: from.toISOString(), to: to.toISOString() });
    try {
      const res = await fetch(`/api/programs/events?${query}`, { credentials: "include" });
      const data = (await res.json()) as { events?: CalendarEvent[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not load upcoming events.");
      setUpcoming((data.events ?? []).filter((event) => new Date(event.endAt ?? event.startAt) >= from).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()).slice(0, 5));
      setEventsError(null);
    } catch (err) {
      setEventsError(err instanceof Error ? err.message : "Could not load upcoming events.");
    } finally {
      setEventsLoading(false);
    }
  }, [id]);

  useEffect(() => { setLoading(true); setDetail(null); setEventsLoading(true); void load(); }, [load]);
  useEffect(() => { if (detail) void loadUpcoming(); }, [detail, loadUpcoming]);

  if (loading) return <div className="program-hub" role="status"><p className="program-hub-muted">Loading program...</p></div>;
  if (!detail) return (
    <div className="program-hub">
      <Link href="/programs" className="program-hub-back"><ArrowLeft size={14} /> Programs</Link>
      <p className="program-hub-error" role="alert">{error ?? "Program not found."}</p>
      <button type="button" className="program-hub-button" onClick={() => { void load(); }}>Try again</button>
    </div>
  );

  return (
    <div className="program-hub">
      <Link href="/programs" className="program-hub-back"><ArrowLeft size={14} /> Programs</Link>
      <header className="program-hub-header">
        <div className="program-hub-header-main">
          <p className="program-hub-eyebrow"><GraduationCap size={13} /> Your program</p>
          <h1>{detail.program.name}</h1>
          {(detail.program.institution || detail.program.specialty) && <p className="program-hub-subtitle">{[detail.program.institution, detail.program.specialty].filter(Boolean).join(" · ")}</p>}
          <div className="program-hub-meta">
            <span><Users2 size={14} /> {detail.members.length} member{detail.members.length === 1 ? "" : "s"}</span>
            <span><ShieldCheck size={14} /> {ROLE_LABELS[detail.myRole]}</span>
          </div>
          {detail.program.description && <p className="program-hub-description">{detail.program.description}</p>}
        </div>
        <div className="program-hub-actions">
          {profile?.roleType === "PROGRAM_DIRECTOR" && <Link href="/programs?create=1" className="program-hub-button"><Plus size={15} /> New program</Link>}
          {isPdLike(detail.myRole) && <Link href="/pd-dashboard" className="program-hub-button program-hub-button-primary">Program dashboard <ArrowUpRight size={15} /></Link>}
        </div>
      </header>

      {error && <p className="program-hub-error" role="alert">{error}</p>}

      <section className="program-hub-section" aria-labelledby="program-upcoming-heading">
        <div className="program-hub-section-heading"><h2 id="program-upcoming-heading"><CalendarDays size={16} /> Coming up</h2><a href="#program-calendar" className="program-hub-subtle-link">View calendar <ArrowUpRight size={13} /></a></div>
        {eventsLoading ? <p className="program-hub-muted" role="status">Loading events...</p> : eventsError ? (
          <div className="program-hub-error" role="alert">{eventsError} <button type="button" className="program-hub-link-button" onClick={() => { void loadUpcoming(); }}>Try again</button></div>
        ) : upcoming.length === 0 ? (
          <div className="program-upcoming-empty"><p>No events scheduled in the coming year.</p><p className="program-hub-muted">Use Add event in the calendar to share rounds, teaching sessions and program dates.</p></div>
        ) : (
          <ol className="program-upcoming-list">{upcoming.map((event) => (
            <li key={`${event.id}-${event.startAt}`}>
              <div className="program-event-date"><span>{new Date(event.startAt).toLocaleDateString(undefined, { month: "short" })}</span><strong>{new Date(event.startAt).getDate()}</strong></div>
              <div className="program-event-info"><h3>{event.title}</h3><p className="program-hub-muted">{new Date(event.startAt).toLocaleDateString(undefined, { weekday: "long" })} · {event.allDay ? "All day" : new Date(event.startAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}{event.location && <span className="program-event-location"><MapPin size={12} />{event.location}</span>}</p></div>
            </li>
          ))}</ol>
        )}
      </section>

      <div id="program-calendar" className="program-hub-section program-hub-calendar"><ProgramCalendar programId={id} onEventsChanged={() => { void loadUpcoming(); }} /></div>

      <ProgramDocumentsSection key={id} programId={id} />

      <section className="program-hub-section" aria-label="Program members">
        <ProgramMembersSection detail={detail} onReload={load} onExited={() => router.push("/programs")} />
      </section>
    </div>
  );
}
