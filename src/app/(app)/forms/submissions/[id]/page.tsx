"use client";

// ---------------------------------------------------------------------------
// /forms/submissions/[id] — view + edit + sign-off lifecycle.
//
// Author can edit responses while DRAFT or RETURNED. Owners (PD /
// CHAIR / OWNER) can sign or return a SUBMITTED draft. Status pill +
// transition buttons are wired to PATCH /api/forms/submissions/[id].
// ---------------------------------------------------------------------------

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Save,
  CheckCircle2,
  Send,
  Undo2,
} from "lucide-react";
import { FormRenderer } from "@/components/forms/FormRenderer";
import { parseFormSchema, type FormSchema, type FieldValue } from "@/lib/forms/types";

interface Submission {
  id: string;
  status: "DRAFT" | "SUBMITTED" | "SIGNED" | "RETURNED";
  summary: string | null;
  aggregateScore: number | null;
  signedAt: string | null;
  returnedReason: string | null;
  template: {
    id: string;
    name: string;
    description: string | null;
    schema: unknown;
    programId: string;
  };
  subject: { id: string; name: string | null; email: string };
  author:  { id: string; name: string | null; email: string };
  responses: Array<{ fieldId: string; value: unknown }>;
}

const STATUS_STYLES: Record<Submission["status"], { label: string; bg: string; fg: string }> = {
  DRAFT:     { label: "Draft",     bg: "var(--surface2)",      fg: "var(--text-3)" },
  SUBMITTED: { label: "Submitted", bg: "rgba(245,158,11,0.1)", fg: "#fbbf24" },
  SIGNED:    { label: "Signed",    bg: "rgba(16,185,129,0.1)", fg: "#34d399" },
  RETURNED:  { label: "Returned",  bg: "rgba(239,68,68,0.08)", fg: "#fca5a5" },
};

export default function FormSubmissionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [responses, setResponses] = useState<Record<string, FieldValue>>({});
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [returningOpen, setReturningOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [canSign, setCanSign] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [subRes, meRes] = await Promise.all([
        fetch(`/api/forms/submissions/${id}`),
        fetch("/api/auth/me"),
      ]);
      if (!subRes.ok) throw new Error(`HTTP ${subRes.status}`);
      const subJson = await subRes.json();
      const sub = subJson.submission as Submission;
      setSubmission(sub);

      try {
        const parsed = parseFormSchema(sub.template.schema);
        setSchema(parsed);
        const map: Record<string, FieldValue> = {};
        for (const r of sub.responses) {
          map[r.fieldId] = r.value as FieldValue;
        }
        setResponses(map);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Invalid template schema");
      }

      let myId: string | null = null;
      if (meRes.ok) {
        const j = await meRes.json();
        if (j?.user?.id) {
          myId = j.user.id;
          setMe({ id: j.user.id });
        }
      }

      // Owner check — PD / CHAIR / OWNER on the program owning the
      // template can sign / return.
      if (myId) {
        const detailRes = await fetch(`/api/programs/${sub.template.programId}`);
        if (detailRes.ok) {
          const detail = await detailRes.json();
          const myRole = detail?.myRole as string | undefined;
          setCanSign(myRole === "OWNER" || myRole === "PD" || myRole === "CHAIR");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load submission");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isAuthor = me?.id === submission?.author.id;
  const isEditing =
    isAuthor &&
    (submission?.status === "DRAFT" || submission?.status === "RETURNED");

  async function saveResponses() {
    if (!submission) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/forms/submissions/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function transition(
    status: Submission["status"],
    extra?: { returnedReason?: string },
  ) {
    if (!submission) return;
    setSaving(true);
    setError(null);
    try {
      // If we're in DRAFT/RETURNED and the author hits Submit, save the
      // current responses in the same call.
      const body: Record<string, unknown> = { status };
      if (extra?.returnedReason !== undefined) body.returnedReason = extra.returnedReason;
      if (
        status === "SUBMITTED" &&
        (submission.status === "DRAFT" || submission.status === "RETURNED")
      ) {
        body.responses = responses;
      }
      const res = await fetch(`/api/forms/submissions/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setReturningOpen(false);
      setReturnReason("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not change status");
    } finally {
      setSaving(false);
    }
  }

  async function deleteDraft() {
    if (!submission) return;
    if (submission.status !== "DRAFT") return;
    if (!confirm("Delete this draft? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/forms/submissions/${submission.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      router.push("/forms");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, display: "flex", justifyContent: "center", color: "var(--text-3)" }}>
        <Loader2 size={16} className="animate-spin" />
      </div>
    );
  }
  if (!submission || !schema) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: "var(--text-2)", fontSize: 13 }}>{error ?? "Submission not found"}</p>
        <Link href="/forms" style={{ color: "var(--primary)", fontSize: 13 }}>
          ← Back to forms
        </Link>
      </div>
    );
  }

  const status = STATUS_STYLES[submission.status];

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

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "-0.4px",
              margin: 0,
            }}
          >
            {submission.template.name}
          </h1>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
            For <strong style={{ color: "var(--text-2)" }}>{submission.subject.name ?? submission.subject.email}</strong>
            {" · authored by "}
            <strong style={{ color: "var(--text-2)" }}>{submission.author.name ?? submission.author.email}</strong>
            {submission.aggregateScore !== null
              ? ` · ${Math.round(submission.aggregateScore)}%`
              : ""}
          </div>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "5px 12px",
            fontSize: 11,
            fontWeight: 600,
            background: status.bg,
            color: status.fg,
            border: "1px solid var(--border)",
            borderRadius: 99,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {status.label}
        </span>
      </div>

      {submission.returnedReason && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            padding: "10px 14px",
            marginBottom: 14,
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10,
            fontSize: 13,
            color: "#fca5a5",
          }}
        >
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1, lineHeight: 1.55 }}>
            <strong>Returned:</strong> {submission.returnedReason}
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding: "10px 14px",
            marginBottom: 14,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10,
            fontSize: 13,
            color: "#fca5a5",
          }}
        >
          {error}
        </div>
      )}

      <FormRenderer
        schema={schema}
        values={responses}
        onChange={
          isEditing
            ? (fieldId, value) =>
                setResponses((prev) => ({ ...prev, [fieldId]: value }))
            : undefined
        }
        disabled={!isEditing}
      />

      {/* Action bar */}
      <div
        style={{
          marginTop: 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          {submission.status === "DRAFT" && isAuthor && (
            <button
              onClick={deleteDraft}
              style={{
                padding: "8px 14px",
                fontSize: 12,
                background: "transparent",
                color: "var(--danger)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Delete draft
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {isEditing && (
            <button
              onClick={saveResponses}
              disabled={saving}
              className="press-soft"
              style={{
                padding: "9px 16px",
                fontSize: 12,
                background: "var(--surface)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Save size={12} />
              Save
            </button>
          )}
          {isEditing && (
            <button
              onClick={() => transition("SUBMITTED")}
              disabled={saving}
              className="press-soft"
              style={{
                padding: "9px 16px",
                fontSize: 12,
                fontWeight: 600,
                background: "linear-gradient(135deg, var(--primary-hi), var(--primary-lo))",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                boxShadow: "0 4px 24px -4px rgba(14,165,233,0.35)",
              }}
            >
              <Send size={12} />
              Submit for sign-off
            </button>
          )}
          {submission.status === "SUBMITTED" && canSign && (
            <>
              <button
                onClick={() => setReturningOpen(true)}
                disabled={saving}
                style={{
                  padding: "9px 14px",
                  fontSize: 12,
                  background: "transparent",
                  color: "var(--text-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Undo2 size={12} />
                Return to author
              </button>
              <button
                onClick={() => transition("SIGNED")}
                disabled={saving}
                className="press-soft"
                style={{
                  padding: "9px 16px",
                  fontSize: 12,
                  fontWeight: 600,
                  background: "var(--success)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <CheckCircle2 size={12} />
                Sign
              </button>
            </>
          )}
        </div>
      </div>

      {/* Return-reason modal */}
      {returningOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--modal-scrim, rgba(0,0,0,0.62))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 50,
          }}
          onClick={() => setReturningOpen(false)}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 18,
              width: "100%",
              maxWidth: 460,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
              Return to author
            </div>
            <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.55, margin: "0 0 12px" }}>
              Add a one-line reason. The author will see it on the submission and
              be invited to edit + resubmit.
            </p>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="e.g. Please add the SLNB step to your description."
              rows={3}
              className="st-input"
              style={{ resize: "vertical", marginBottom: 10 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => setReturningOpen(false)}
                style={{
                  padding: "8px 14px",
                  fontSize: 12,
                  background: "transparent",
                  color: "var(--text-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => transition("RETURNED", { returnedReason: returnReason })}
                disabled={!returnReason.trim() || saving}
                style={{
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  background: "var(--danger)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: returnReason.trim() ? "pointer" : "not-allowed",
                  opacity: returnReason.trim() ? 1 : 0.5,
                  fontFamily: "inherit",
                }}
              >
                Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
