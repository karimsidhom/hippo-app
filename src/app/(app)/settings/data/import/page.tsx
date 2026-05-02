"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  AlertTriangle,
  Check,
  FileSpreadsheet,
  Shield,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// /settings/data/import — Import Existing Case Log
// ---------------------------------------------------------------------------

type HippoField =
  | "caseDate"
  | "procedureName"
  | "specialtyId"
  | "procedureCategory"
  | "role"
  | "autonomyLevel"
  | "attendingLabel"
  | "institutionSite"
  | "surgicalApproach"
  | "diagnosisCategory"
  | "outcomeCategory"
  | "complicationCategory"
  | "notes"
  | "operativeDurationMinutes"
  | "patientAgeBin";

const HIPPO_FIELD_LABELS: Record<HippoField, string> = {
  caseDate: "Case date",
  procedureName: "Procedure name",
  specialtyId: "Specialty",
  procedureCategory: "Category",
  role: "Role",
  autonomyLevel: "Autonomy / entrustment",
  attendingLabel: "Attending",
  institutionSite: "Hospital / site",
  surgicalApproach: "Approach",
  diagnosisCategory: "Diagnosis / indication",
  outcomeCategory: "Outcome",
  complicationCategory: "Complication",
  notes: "Notes / findings",
  operativeDurationMinutes: "Operative duration (min)",
  patientAgeBin: "Patient age",
};

interface PreviewResponse {
  batchId: string;
  fileType: string;
  sheets: Array<{ name: string; rows: number }>;
  sheetName?: string;
  headers: string[];
  mapping: Partial<Record<HippoField, string>>;
  unmappedColumns: string[];
  previewRows: Array<Record<string, unknown>>;
  totalRows: number;
  piiFlags: Array<{ kind: string; column?: string; example?: string; rowNumber?: number }>;
  warnings: string[];
}

interface CommitSummary {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  duplicateCount: number;
  missingFieldCount: number;
  rowOutcomes: Array<{
    rowNumber: number;
    status: "IMPORTED" | "SKIPPED" | "DUPLICATE" | "FAILED";
    caseId?: string;
    warnings: string[];
  }>;
}

export default function ImportLogPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [mapping, setMapping] = useState<Partial<Record<HippoField, string>>>({});
  const [redact, setRedact] = useState<Set<string>>(new Set());
  const [acknowledgePii, setAcknowledgePii] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CommitSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!file) return;
    setParsing(true);
    setError(null);
    setSummary(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("filename", file.name);
      const res = await fetch("/api/case-import/preview", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "Preview failed");
        setParsing(false);
        return;
      }
      const data = json as PreviewResponse;
      setPreview(data);
      setMapping(data.mapping);
      setRedact(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setParsing(false);
    }
  }

  async function handleCommit() {
    if (!preview || !file) return;
    setCommitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("batchId", preview.batchId);
      fd.append("mapping", JSON.stringify(mapping));
      if (preview.sheetName) fd.append("sheetName", preview.sheetName);
      fd.append("redactColumns", JSON.stringify(Array.from(redact)));
      fd.append("rowDecisions", JSON.stringify({}));
      const res = await fetch("/api/case-import/commit", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "Commit failed");
        setCommitting(false);
        return;
      }
      setSummary(json.summary as CommitSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Commit failed");
    } finally {
      setCommitting(false);
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setMapping({});
    setRedact(new Set());
    setSummary(null);
    setError(null);
    setAcknowledgePii(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function toggleRedact(col: string) {
    setRedact((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  }

  function setMap(field: HippoField, sourceCol: string | null) {
    setMapping((prev) => {
      const next = { ...prev };
      if (sourceCol) next[field] = sourceCol;
      else delete next[field];
      return next;
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-xs text-[#64748b] hover:text-[#94a3b8] transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Settings
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#f1f5f9] flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#3b82f6]" />
            Import Existing Case Log
          </h1>
          <p className="text-[#94a3b8] text-sm mt-0.5">
            Upload your existing Excel, CSV, or text file. Hippo will auto-map
            columns, flag possible duplicates, and merge it into your log.
          </p>
        </div>
      </div>

      {/* PII warning banner — always visible */}
      <div className="p-4 bg-[#1a1500] border border-[#f59e0b]/30 rounded-xl flex items-start gap-3">
        <Shield className="w-4 h-4 text-[#f59e0b] mt-0.5 flex-shrink-0" />
        <div className="text-xs text-[#cbd5e1] leading-relaxed">
          <p className="font-semibold text-[#f1f5f9] mb-0.5">
            Patient privacy notice
          </p>
          <p>
            Please do not upload patient identifiers (MRN, PHIN, DOB, full
            name, health card number) unless your institution permits it.
            Hippo will flag possible identifiers before import and offer
            de-identification. Imported cases stay private by default and
            are never auto-shared to community feeds.
          </p>
        </div>
      </div>

      {/* Step 1: Upload */}
      {!preview && !summary && (
        <section className="bg-[#111118] border border-[#1e2130] rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#f1f5f9]">1. Upload your file</h2>
          <p className="text-xs text-[#94a3b8]">
            Supported: Excel (.xlsx, .xls), CSV, plain text. Max 25 MB.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.xlsm,.csv,.txt,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-[#94a3b8] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#2563eb] file:text-white hover:file:bg-[#1d4ed8] file:cursor-pointer"
          />
          {file && (
            <p className="text-xs text-[#94a3b8]">
              Selected: <span className="text-[#f1f5f9] font-medium">{file.name}</span>{" "}
              ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
          <button
            onClick={handleUpload}
            disabled={!file || parsing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {parsing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Parsing…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Parse & Preview
              </>
            )}
          </button>
          {error && (
            <p className="text-xs text-[#ef4444] flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {error}
            </p>
          )}
        </section>
      )}

      {/* Step 2: Preview + mapping */}
      {preview && !summary && (
        <>
          <section className="bg-[#111118] border border-[#1e2130] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#f1f5f9]">
                2. Preview &amp; column mapping
              </h2>
              <span className="text-xs text-[#94a3b8]">
                {preview.totalRows} rows · {preview.headers.length} columns
              </span>
            </div>

            {preview.warnings.length > 0 && (
              <div className="text-xs text-[#f59e0b] space-y-1">
                {preview.warnings.map((w) => (
                  <p key={w}>⚠ {w}</p>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(HIPPO_FIELD_LABELS) as HippoField[]).map((field) => (
                <div key={field} className="space-y-1">
                  <label className="text-[10px] text-[#64748b] uppercase tracking-wider">
                    {HIPPO_FIELD_LABELS[field]}
                  </label>
                  <select
                    value={mapping[field] ?? ""}
                    onChange={(e) =>
                      setMap(field, e.target.value === "" ? null : e.target.value)
                    }
                    className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  >
                    <option value="">— Not mapped —</option>
                    {preview.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {preview.unmappedColumns.length > 0 && (
              <div className="pt-2 border-t border-[#1e2130]">
                <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-1">
                  Extra columns (will be saved to notes / metadata)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {preview.unmappedColumns.map((col) => (
                    <span
                      key={col}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1a1a2e] text-[10px] text-[#94a3b8] rounded-full border border-[#1e2130]"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* PII section */}
          {preview.piiFlags.length > 0 && (
            <section className="bg-[#1a1500] border border-[#f59e0b]/30 rounded-xl p-6 space-y-3">
              <h2 className="text-base font-semibold text-[#f59e0b] flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Possible patient identifiers detected
              </h2>
              <p className="text-xs text-[#cbd5e1]">
                The following columns or values look like they might contain
                patient identifiers. Check any column to redact (replace with
                &quot;[redacted by Hippo import]&quot;) before merging.
              </p>
              <ul className="space-y-1.5">
                {Array.from(
                  new Map(
                    preview.piiFlags
                      .filter((f) => f.column)
                      .map((f) => [f.column!, f]),
                  ).values(),
                ).map((flag) => (
                  <li
                    key={flag.column}
                    className="flex items-center justify-between gap-3 px-3 py-2 bg-[#16161f] border border-[#1e2130] rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#f1f5f9]">{flag.column}</p>
                      <p className="text-[10px] text-[#94a3b8]">
                        Looks like: {flag.kind}
                        {flag.example && ` · e.g. "${flag.example}"`}
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-[#cbd5e1]">
                      <input
                        type="checkbox"
                        checked={redact.has(flag.column!)}
                        onChange={() => toggleRedact(flag.column!)}
                      />
                      Redact
                    </label>
                  </li>
                ))}
              </ul>
              <label className="flex items-start gap-2 text-xs text-[#cbd5e1] pt-2">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={acknowledgePii}
                  onChange={(e) => setAcknowledgePii(e.target.checked)}
                />
                I confirm uploading this file is permitted by my institution and
                acknowledge Hippo&apos;s privacy guidance.
              </label>
            </section>
          )}

          {/* Preview rows */}
          <section className="bg-[#111118] border border-[#1e2130] rounded-xl p-4 overflow-auto">
            <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider mb-2 px-2">
              Preview (first 10 rows)
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[#64748b]">
                  {preview.headers.map((h) => (
                    <th key={h} className="px-2 py-1 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.previewRows.slice(0, 10).map((row, i) => (
                  <tr key={i} className="text-[#cbd5e1] border-t border-[#1e2130]">
                    {preview.headers.map((h) => (
                      <td
                        key={h}
                        className="px-2 py-1 max-w-[200px] truncate"
                        title={String(row[h] ?? "")}
                      >
                        {row[h] === null || row[h] === undefined
                          ? ""
                          : String(row[h])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Commit */}
          <section className="flex items-center justify-end gap-2">
            <button
              onClick={reset}
              className="px-3 py-2 bg-[#16161f] border border-[#1e2130] text-[#94a3b8] rounded-lg text-xs hover:border-[#2563eb]/40"
            >
              Start over
            </button>
            <button
              onClick={handleCommit}
              disabled={
                committing ||
                (preview.piiFlags.length > 0 && !acknowledgePii)
              }
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#10b981] hover:bg-[#059669] disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {committing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Merging…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Merge into Hippo
                </>
              )}
            </button>
          </section>
          {error && (
            <p className="text-xs text-[#ef4444] flex items-center gap-1 justify-end">
              <AlertTriangle className="w-3 h-3" />
              {error}
            </p>
          )}
        </>
      )}

      {/* Step 3: Summary */}
      {summary && (
        <section className="bg-[#111118] border border-[#10b981]/30 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#10b981] flex items-center gap-2">
            <Check className="w-5 h-5" />
            Import complete
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
            <Stat label="Total rows" value={summary.totalRows} />
            <Stat label="Imported" value={summary.importedCount} accent="#10b981" />
            <Stat label="Duplicates" value={summary.duplicateCount} accent="#f59e0b" />
            <Stat label="Skipped" value={summary.skippedCount} />
            <Stat
              label="Missing fields"
              value={summary.missingFieldCount}
              accent="#ef4444"
            />
          </div>
          {summary.duplicateCount > 0 && (
            <p className="text-xs text-[#94a3b8]">
              {summary.duplicateCount} row(s) appeared to duplicate existing
              cases and were not imported. Re-upload with explicit
              &quot;import anyway&quot; or &quot;merge&quot; decisions if you want them brought in.
            </p>
          )}
          <div className="flex items-center gap-2 pt-3 border-t border-[#1e2130]">
            <Link
              href="/cases"
              className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg text-sm font-medium"
            >
              View imported cases
            </Link>
            <button
              onClick={reset}
              className="px-3 py-2 bg-[#16161f] border border-[#1e2130] text-[#94a3b8] rounded-lg text-xs hover:border-[#2563eb]/40"
            >
              Import another file
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="bg-[#16161f] border border-[#1e2130] rounded-lg p-3">
      <p className="text-[10px] text-[#64748b] uppercase tracking-wider">{label}</p>
      <p
        className="text-2xl font-bold mt-0.5"
        style={{ color: accent ?? "#f1f5f9" }}
      >
        {value}
      </p>
    </div>
  );
}
