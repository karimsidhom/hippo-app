"use client";

// ---------------------------------------------------------------------------
// FormRenderer — given a FormSchema and a value/onChange pair, renders
// every field type the form-builder supports. One component for both
// the filler and the viewer (read-only mode disables every input).
//
// Field types supported (see src/lib/forms/types.ts):
//   short_text · long_text · number · boolean · single_choice ·
//   multi_choice · likert · rubric_grid · signature
// ---------------------------------------------------------------------------

import { useMemo } from "react";
import type {
  FormSchema,
  FormField,
  FieldValue,
} from "@/lib/forms/types";

interface Props {
  schema: FormSchema;
  values: Record<string, FieldValue>;
  onChange?: (fieldId: string, value: FieldValue) => void;
  /** Read-only mode disables every control. */
  disabled?: boolean;
}

export function FormRenderer({ schema, values, onChange, disabled }: Props) {
  const handle = (fieldId: string, value: FieldValue) => {
    if (disabled) return;
    onChange?.(fieldId, value);
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {schema.intro && (
        <div
          style={{
            fontSize: 13,
            color: "var(--text-2)",
            lineHeight: 1.55,
            background: "rgba(14,165,233,0.04)",
            border: "1px solid rgba(14,165,233,0.18)",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          {schema.intro}
        </div>
      )}

      {schema.sections.map((section) => (
        <section
          key={section.id}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 16,
          }}
        >
          {section.title && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text)",
                marginBottom: 4,
                letterSpacing: "-0.1px",
              }}
            >
              {section.title}
            </div>
          )}
          {section.description && (
            <div
              style={{
                fontSize: 11,
                color: "var(--text-3)",
                lineHeight: 1.6,
                marginBottom: 12,
              }}
            >
              {section.description}
            </div>
          )}
          <div style={{ display: "grid", gap: 14 }}>
            {section.fields.map((field) => (
              <FieldRow
                key={field.id}
                field={field}
                value={values[field.id]}
                onChange={(v) => handle(field.id, v)}
                disabled={disabled}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function FieldRow({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FormField;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text)",
          marginBottom: 4,
        }}
      >
        {field.label}
        {field.required && (
          <span style={{ color: "var(--danger)", marginLeft: 4 }}>*</span>
        )}
      </label>
      {field.description && (
        <div
          style={{
            fontSize: 11,
            color: "var(--text-3)",
            lineHeight: 1.5,
            marginBottom: 6,
          }}
        >
          {field.description}
        </div>
      )}
      <FieldInput field={field} value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FormField;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
}) {
  const inputCls = {
    width: "100%",
    padding: "9px 12px",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--text)",
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  switch (field.type) {
    case "short_text":
      return (
        <input
          type="text"
          value={(value as string | undefined) ?? ""}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={inputCls}
        />
      );
    case "long_text":
      return (
        <textarea
          value={(value as string | undefined) ?? ""}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          disabled={disabled}
          rows={4}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputCls, resize: "vertical" }}
        />
      );
    case "number":
      return (
        <input
          type="number"
          value={typeof value === "number" ? value : ""}
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          disabled={disabled}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(isNaN(n) ? 0 : n);
          }}
          style={inputCls}
        />
      );
    case "boolean": {
      const checked = value === true;
      return (
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            cursor: disabled ? "not-allowed" : "pointer",
            fontSize: 13,
            color: "var(--text-2)",
          }}
        >
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
          />
          {checked ? "Yes" : "No"}
        </label>
      );
    }
    case "single_choice":
      return (
        <div style={{ display: "grid", gap: 6 }}>
          {field.options.map((opt) => {
            const selected = value === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(opt.id)}
                style={{
                  textAlign: "left",
                  padding: "9px 12px",
                  background: selected ? "rgba(14,165,233,0.1)" : "var(--surface2)",
                  border: `1px solid ${selected ? "var(--primary)" : "var(--border)"}`,
                  borderRadius: 8,
                  color: selected ? "var(--primary)" : "var(--text-2)",
                  fontSize: 13,
                  cursor: disabled ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      );
    case "multi_choice": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div style={{ display: "grid", gap: 6 }}>
          {field.options.map((opt) => {
            const isOn = selected.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange(
                    isOn
                      ? selected.filter((s) => s !== opt.id)
                      : [...selected, opt.id],
                  )
                }
                style={{
                  textAlign: "left",
                  padding: "9px 12px",
                  background: isOn ? "rgba(14,165,233,0.1)" : "var(--surface2)",
                  border: `1px solid ${isOn ? "var(--primary)" : "var(--border)"}`,
                  borderRadius: 8,
                  color: isOn ? "var(--primary)" : "var(--text-2)",
                  fontSize: 13,
                  cursor: disabled ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      );
    }
    case "likert": {
      const scale = field.scale ?? 5;
      const points = Array.from({ length: scale }, (_, i) => i + 1);
      return (
        <div>
          <div style={{ display: "flex", gap: 6 }}>
            {points.map((n) => {
              const selected = value === n;
              return (
                <button
                  key={n}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(n)}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    background: selected ? "var(--primary)" : "var(--surface2)",
                    border: `1px solid ${selected ? "var(--primary)" : "var(--border)"}`,
                    borderRadius: 8,
                    color: selected ? "#fff" : "var(--text-2)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: disabled ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
          {(field.minLabel || field.maxLabel) && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: "var(--text-3)",
                marginTop: 4,
              }}
            >
              <span>{field.minLabel ?? ""}</span>
              <span>{field.maxLabel ?? ""}</span>
            </div>
          )}
        </div>
      );
    }
    case "rubric_grid": {
      const cells = Array.isArray(value)
        ? (value as { rowId: string; columnId: string }[])
        : [];
      return (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ padding: 6, textAlign: "left" }}></th>
                {field.columns.map((c) => (
                  <th
                    key={c.id}
                    style={{
                      padding: 6,
                      fontSize: 10,
                      fontWeight: 600,
                      color: "var(--text-3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      textAlign: "center",
                    }}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {field.rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: 6, fontSize: 12, color: "var(--text-2)" }}>
                    {r.label}
                  </td>
                  {field.columns.map((c) => {
                    const picked = cells.some((x) => x.rowId === r.id && x.columnId === c.id);
                    return (
                      <td key={c.id} style={{ padding: 4, textAlign: "center" }}>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() =>
                            onChange(
                              [
                                ...cells.filter((x) => x.rowId !== r.id),
                                { rowId: r.id, columnId: c.id },
                              ],
                            )
                          }
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            background: picked ? "var(--primary)" : "var(--surface2)",
                            border: `1px solid ${picked ? "var(--primary)" : "var(--border)"}`,
                            cursor: disabled ? "not-allowed" : "pointer",
                          }}
                          aria-label={`${r.label} → ${c.label}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "signature": {
      const signed =
        value && typeof value === "object" && !Array.isArray(value)
          ? (value as { signedAt: string; signedBy: string })
          : null;
      return (
        <div
          style={{
            padding: 14,
            background: "var(--surface2)",
            border: "1px dashed var(--border-mid)",
            borderRadius: 10,
          }}
        >
          {field.attestation && (
            <div
              style={{
                fontSize: 12,
                color: "var(--text-2)",
                lineHeight: 1.55,
                marginBottom: 8,
              }}
            >
              {field.attestation}
            </div>
          )}
          {signed ? (
            <div style={{ fontSize: 12, color: "var(--text-2)" }}>
              Signed by{" "}
              <strong style={{ color: "var(--text)" }}>{signed.signedBy}</strong>{" "}
              on {new Date(signed.signedAt).toLocaleString()}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>
              Not yet signed — submitting the form will record your name and timestamp.
            </div>
          )}
        </div>
      );
    }
    default:
      return null;
  }
}

// ─── Helper: derive an empty-defaults object from a schema ───────────
export function emptyResponses(schema: FormSchema): Record<string, FieldValue> {
  const out: Record<string, FieldValue> = {};
  for (const section of schema.sections) {
    for (const field of section.fields) {
      switch (field.type) {
        case "boolean":
          out[field.id] = false;
          break;
        case "multi_choice":
        case "rubric_grid":
          out[field.id] = [];
          break;
        case "number":
        case "likert":
          // Leave undefined — renderer treats as empty.
          break;
        default:
          out[field.id] = "";
      }
    }
  }
  return out;
}

export const useEmptyResponses = (schema: FormSchema) =>
  useMemo(() => emptyResponses(schema), [schema]);
