"use client";

// ---------------------------------------------------------------------------
// /forms — assessment-form hub.
//
// Two columns:
//   • Active templates the caller's program(s) have published — tap one
//     to start a new submission.
//   • The caller's recent submissions across all programs — drafts at
//     the top, then submitted/signed.
//
// Program owners see a "+ New form" button to design templates from
// scratch (linked off to /forms/builder); all other roles can only
// fill out forms.
// ---------------------------------------------------------------------------

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Plus,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  active: boolean;
  programId: string;
  updatedAt: string;
}

interface Submission {
  id: string;
  status: "DRAFT" | "SUBMITTED" | "SIGNED" | "RETURNED";
  aggregateScore: number | null;
  updatedAt: string;
  template: { id: string; name: string; category: string };
  subject: { id: string; name: string | null; email: string };
  author: { id: string; name: string | null; email: string };
}

const STATUS_STYLES: Record<Submission["status"], { label: string; bg: string; fg: string }> = {
  DRAFT:     { label: "Draft",     bg: "var(--surface2)",                 fg: "var(--text-3)" },
  SUBMITTED: { label: "Submitted", bg: "rgba(245,158,11,0.1)",            fg: "#fbbf24" },
  SIGNED:    { label: "Signed",    bg: "rgba(16,185,129,0.1)",            fg: "#34d399" },
  RETURNED:  { label: "Returned",  bg: "rgba(239,68,68,0.08)",            fg: "#fca5a5" },
};

const CATEGORY_LABELS: Record<string, string> = {
  MINI_CEX: "Mini-CEX",
  DOPS: "DOPS",
  MSF: "Multi-source feedback",
  COACHING: "Coaching",
  IN_TRAINING: "In-training exam",
  PROFESSIONALISM: "Professionalism",
  CUSTOM: "Custom",
};

export default function FormsHubPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [mine, setMine] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [t, s] = await Promise.all([
        fetch("/api/forms/templates").then((r) => (r.ok ? r.json() : { templates: [] })),
        fetch("/api/forms/submissions").then((r) => (r.ok ? r.json() : { submissions: [] })),
      ]);
      setTemplates((t.templates ?? []).filter((tpl: Template) => tpl.active));
      setMine(s.submissions ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <div style={{ padding: 60, display: "flex", justifyContent: "center", color: "var(--text-3)" }}>
        <Loader2 size={16} className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn .4s cubic-bezier(.16,1,.3,1) forwards" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 18,
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "-0.4px",
              margin: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <ClipboardList size={18} color="var(--primary)" />
            Forms
          </h1>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
            Mini-CEX, DOPS, MSF, coaching — beyond EPAs and O-SCOREs.
          </div>
        </div>
        <Link
          href="/forms/builder"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: "var(--primary)",
            color: "#fff",
            border: "1px solid var(--primary)",
            borderRadius: 8,
            padding: "7px 14px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            textDecoration: "none",
          }}
        >
          <Plus size={13} />
          New template
        </Link>
      </div>

      {/* Active templates */}
      <Section title="Available forms" empty="No active templates yet. Program owners can publish one above.">
        {templates.map((t) => (
          <Link
            key={t.id}
            href={`/forms/${t.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: 14,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              textDecoration: "none",
              color: "var(--text)",
              transition: "border-color .15s",
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>
                {t.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                {CATEGORY_LABELS[t.category] ?? t.category}
                {t.description ? ` · ${t.description}` : ""}
              </div>
            </div>
            <ArrowRight size={14} color="var(--text-3)" />
          </Link>
        ))}
      </Section>

      {/* My submissions */}
      <Section title="My recent submissions" empty="No submissions yet — fill out a template above to start.">
        {mine.map((s) => {
          const style = STATUS_STYLES[s.status];
          return (
            <Link
              key={s.id}
              href={`/forms/submissions/${s.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: 14,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                textDecoration: "none",
                color: "var(--text)",
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>
                  {s.template.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                  {s.subject.name ?? s.subject.email} ·{" "}
                  {new Date(s.updatedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {s.aggregateScore !== null
                    ? ` · ${Math.round(s.aggregateScore)}%`
                    : ""}
                </div>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  background: style.bg,
                  color: style.fg,
                  border: "1px solid var(--border)",
                  borderRadius: 99,
                  padding: "3px 8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {s.status === "SIGNED" && <CheckCircle2 size={10} />}
                {s.status === "SUBMITTED" && <Clock size={10} />}
                {s.status === "RETURNED" && <AlertCircle size={10} />}
                {style.label}
              </span>
            </Link>
          );
        })}
      </Section>
    </div>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.flat().filter(Boolean).length > 0;
  return (
    <section style={{ marginBottom: 22 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "var(--text-3)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {hasItems ? (
        <div style={{ display: "grid", gap: 8 }}>{children}</div>
      ) : (
        <div
          style={{
            padding: 18,
            background: "var(--surface)",
            border: "1px dashed var(--border-mid)",
            borderRadius: 12,
            fontSize: 13,
            color: "var(--text-3)",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          {empty}
        </div>
      )}
    </section>
  );
}
