"use client";

// ---------------------------------------------------------------------------
// /forms/[templateId] — fill-out page.
//
// Picks a subject (defaults to self), renders the schema via
// FormRenderer, and POSTs the filled-in responses to
// /api/forms/submissions. On success, navigates the user to
// /forms/submissions/[id] where they can edit / submit / sign.
// ---------------------------------------------------------------------------

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertTriangle, Save } from "lucide-react";
import { FormRenderer, emptyResponses } from "@/components/forms/FormRenderer";
import { parseFormSchema, type FormSchema, type FieldValue } from "@/lib/forms/types";

interface Member {
  id: string;
  userId: string;
  name: string | null;
  email: string;
}

export default function FormFillerPage() {
  const params = useParams<{ templateId: string }>();
  const router = useRouter();
  const templateId = params.templateId;

  const [template, setTemplate] = useState<{
    id: string;
    name: string;
    description: string | null;
    programId: string;
    schema: unknown;
  } | null>(null);
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [subjectId, setSubjectId] = useState<string>("");
  const [responses, setResponses] = useState<Record<string, FieldValue>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<{ id: string; name: string | null; email: string } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const tplRes = await fetch(`/api/forms/templates/${templateId}`);
      if (!tplRes.ok) throw new Error(`HTTP ${tplRes.status}`);
      const tplJson = await tplRes.json();
      const tpl = tplJson.template;
      setTemplate(tpl);

      try {
        const parsed = parseFormSchema(tpl.schema);
        setSchema(parsed);
        setResponses(emptyResponses(parsed));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Invalid form schema");
      }

      // Roster (subjects you can pick).
      const detailRes = await fetch(`/api/programs/${tpl.programId}`);
      if (detailRes.ok) {
        const detail = await detailRes.json();
        const roster: Member[] = (detail.members ?? []).map(
          (m: { id: string; user: { id: string; name: string | null; email: string } }) => ({
            id: m.id,
            userId: m.user.id,
            name: m.user.name,
            email: m.user.email,
          }),
        );
        setMembers(roster);
      }

      // Who am I — to default the subject to self.
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meJson = await meRes.json();
        if (meJson?.user?.id) {
          setMe(meJson.user);
          setSubjectId(meJson.user.id);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load template");
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function saveDraft() {
    if (!template || !schema || !subjectId) {
      setError("Pick who this form is for.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/forms/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          subjectId,
          responses,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      router.push(`/forms/submissions/${json.submission.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, display: "flex", justifyContent: "center", color: "var(--text-3)" }}>
        <Loader2 size={16} className="animate-spin" />
      </div>
    );
  }
  if (!template || !schema) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: "var(--text-2)", fontSize: 13 }}>{error ?? "Template not found"}</p>
        <Link href="/forms" style={{ color: "var(--primary)", fontSize: 13 }}>
          ← Back to forms
        </Link>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn .4s cubic-bezier(.16,1,.3,1) forwards" }}>
      <Link
        href="/forms"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12,
          color: "var(--text-3)",
          textDecoration: "none",
          marginBottom: 14,
        }}
      >
        <ArrowLeft size={12} />
        Back to forms
      </Link>

      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "var(--text)",
          letterSpacing: "-0.4px",
          margin: 0,
        }}
      >
        {template.name}
      </h1>
      {template.description && (
        <p style={{ fontSize: 13, color: "var(--text-3)", margin: "4px 0 18px", lineHeight: 1.55 }}>
          {template.description}
        </p>
      )}

      {/* Subject picker */}
      <div
        style={{
          marginBottom: 14,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 14,
        }}
      >
        <label style={labelStyle}>Who is this form for?</label>
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="st-input"
        >
          <option value="">— Select a member —</option>
          {me && (
            <option value={me.id}>
              {me.name ?? me.email} (myself)
            </option>
          )}
          {members
            .filter((m) => m.userId !== me?.id)
            .map((m) => (
              <option key={m.id} value={m.userId}>
                {m.name ?? m.email}
              </option>
            ))}
        </select>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            padding: "10px 14px",
            marginBottom: 14,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10,
            fontSize: 13,
            color: "#fca5a5",
          }}
        >
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>{error}</div>
        </div>
      )}

      <FormRenderer
        schema={schema}
        values={responses}
        onChange={(fieldId, value) =>
          setResponses((prev) => ({ ...prev, [fieldId]: value }))
        }
      />

      <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button
          onClick={saveDraft}
          disabled={saving || !subjectId}
          className="press-soft"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 18px",
            background: "linear-gradient(135deg, var(--primary-hi), var(--primary-lo))",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving || !subjectId ? 0.6 : 1,
            fontFamily: "inherit",
            boxShadow: "0 4px 24px -4px rgba(14,165,233,0.35)",
          }}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? "Saving…" : "Save draft"}
        </button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 500,
  color: "var(--text-3)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 4,
};
