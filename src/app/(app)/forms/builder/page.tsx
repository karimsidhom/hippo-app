"use client";

// ---------------------------------------------------------------------------
// /forms/builder — program-owner template designer (v1).
//
// v1 keeps things simple: pick a starter (Mini-CEX / DOPS / Coaching)
// or paste a JSON schema, name the form, pick a program, publish.
// The starter previews live below the form so the owner can see what
// residents will fill before saving. Visual drag-and-drop field
// editing is a v2 enhancement.
// ---------------------------------------------------------------------------

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Save,
  Sparkles,
  Code,
} from "lucide-react";
import { FormRenderer, emptyResponses } from "@/components/forms/FormRenderer";
import { PRESETS } from "@/lib/forms/presets";
import { parseFormSchema } from "@/lib/forms/types";
import type { FormSchema, FieldValue } from "@/lib/forms/types";

interface OwnedProgram {
  id: string;
  name: string;
  myRole: string;
}

export default function FormBuilderPage() {
  const router = useRouter();

  const [programs, setPrograms] = useState<OwnedProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [presetId, setPresetId] = useState<string>(PRESETS[0].id);
  const [programId, setProgramId] = useState<string>("");
  const [name, setName] = useState<string>("Mini-CEX");
  const [description, setDescription] = useState<string>("");
  const [schema, setSchema] = useState<FormSchema>(PRESETS[0].schema);
  const [previewValues, setPreviewValues] = useState<Record<string, FieldValue>>(
    emptyResponses(PRESETS[0].schema),
  );
  const [showJson, setShowJson] = useState(false);
  const [jsonText, setJsonText] = useState<string>(
    JSON.stringify(PRESETS[0].schema, null, 2),
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/programs");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const owned = (json.programs ?? []).filter(
          (p: OwnedProgram) => p.myRole === "OWNER" || p.myRole === "PD",
        );
        setPrograms(owned);
        if (owned[0]) setProgramId(owned[0].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load programs");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const switchPreset = useCallback((id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPresetId(p.id);
    setName(p.name);
    setSchema(p.schema);
    setPreviewValues(emptyResponses(p.schema));
    setJsonText(JSON.stringify(p.schema, null, 2));
    setJsonError(null);
  }, []);

  function applyJson() {
    try {
      const obj = JSON.parse(jsonText);
      const parsed = parseFormSchema(obj);
      setSchema(parsed);
      setPreviewValues(emptyResponses(parsed));
      setJsonError(null);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }

  async function publish() {
    if (!programId || !name.trim()) {
      setError("Pick a program and a form name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Apply any pending JSON edits before saving.
      if (showJson) applyJson();

      const preset = PRESETS.find((p) => p.id === presetId);
      const category = preset?.category ?? "CUSTOM";

      const res = await fetch("/api/forms/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId,
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          schema,
          active: true,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      router.push(`/forms/${json.template.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not publish");
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
  if (programs.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 20, color: "var(--text)", margin: "0 0 8px" }}>
          Build a form
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
          You need to be a program owner (OWNER or PD) to design forms. Set
          one up from <Link href="/programs" style={{ color: "var(--primary)" }}>/programs</Link>.
        </p>
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
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Sparkles size={18} color="var(--primary)" />
        Build a form
      </h1>
      <p style={{ fontSize: 13, color: "var(--text-3)", margin: "4px 0 18px" }}>
        Pick a starter or paste your own JSON schema. Preview below before publishing.
      </p>

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

      {/* Top-of-form metadata */}
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 16,
          marginBottom: 18,
        }}
      >
        <div style={{ display: "grid", gap: 12 }}>
          {programs.length > 1 && (
            <div>
              <label style={labelStyle}>Program</label>
              <select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                className="st-input"
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label style={labelStyle}>Form name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="st-input"
              placeholder="e.g. Endourology Mini-CEX"
            />
          </div>
          <div>
            <label style={labelStyle}>Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="st-input"
              style={{ resize: "vertical" }}
              placeholder="One line shown to whoever fills this out."
            />
          </div>
          <div>
            <label style={labelStyle}>Starter</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {PRESETS.map((p) => {
                const active = presetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => switchPreset(p.id)}
                    style={{
                      padding: "7px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      borderRadius: 99,
                      border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
                      background: active ? "rgba(14,165,233,0.1)" : "var(--surface2)",
                      color: active ? "var(--primary)" : "var(--text-3)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <button
              type="button"
              onClick={() => {
                setShowJson((v) => !v);
                if (!showJson) setJsonText(JSON.stringify(schema, null, 2));
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 12px",
                fontSize: 11,
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text-2)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Code size={11} />
              {showJson ? "Hide JSON" : "Edit raw JSON schema"}
            </button>
          </div>
          {showJson && (
            <div>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={14}
                className="st-input"
                style={{
                  resize: "vertical",
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 12,
                  lineHeight: 1.55,
                }}
                spellCheck={false}
              />
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                <button
                  type="button"
                  onClick={applyJson}
                  style={{
                    padding: "7px 12px",
                    fontSize: 11,
                    background: "var(--primary)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Apply JSON
                </button>
                {jsonError && (
                  <span style={{ fontSize: 11, color: "#fca5a5" }}>{jsonError}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Preview */}
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
        Preview
      </div>
      <FormRenderer
        schema={schema}
        values={previewValues}
        onChange={(fieldId, value) =>
          setPreviewValues((prev) => ({ ...prev, [fieldId]: value }))
        }
      />

      {/* Publish */}
      <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button
          onClick={publish}
          disabled={saving}
          className="press-soft"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "11px 20px",
            background: "linear-gradient(135deg, var(--primary-hi), var(--primary-lo))",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            opacity: saving ? 0.6 : 1,
            boxShadow: "0 4px 24px -4px rgba(14,165,233,0.35)",
          }}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? "Publishing…" : "Publish form"}
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
