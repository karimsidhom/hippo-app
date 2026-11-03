"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, File as FileIcon, FileImage, FileSpreadsheet, FileText, Loader2, Plus, Presentation, Trash2, X } from "lucide-react";
import { DOCUMENT_ACCEPT, validateUpload } from "@/lib/program-documents";
import { createClient } from "@/lib/supabase";
import "./program-hub.css";

interface ProgramDocument {
  id: string;
  programId: string;
  uploadedById: string | null;
  title: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploadedBy: { name: string | null } | null;
  canDelete: boolean;
}

function documentIcon(name: string) {
  const extension = name.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg"].includes(extension ?? "")) return FileImage;
  if (["xls", "xlsx", "csv"].includes(extension ?? "")) return FileSpreadsheet;
  if (["ppt", "pptx"].includes(extension ?? "")) return Presentation;
  if (["pdf", "doc", "docx", "txt"].includes(extension ?? "")) return FileText;
  return FileIcon;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProgramDocumentsSection({ programId }: { programId: string }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<ProgramDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/programs/${programId}/documents`, { credentials: "include" });
      const data = (await res.json()) as { documents?: ProgramDocument[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not load documents.");
      setDocuments(data.documents ?? []);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load documents.");
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => { void load(); }, [load]);

  async function upload() {
    if (uploading) return;
    if (!file) { setError("Choose a file to upload."); return; }
    const validation = validateUpload(file.name, file.type, file.size);
    if (!validation.valid) { setError(validation.error ?? "This file cannot be uploaded."); return; }
    setUploading(true);
    setError(null);
    try {
      // Signed upload straight to private storage, then record it here.
      const signRes = await fetch(`/api/programs/${programId}/documents/upload-url`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, type: file.type, size: file.size }),
      });
      const signed = (await signRes.json()) as { path?: string; token?: string; mimeType?: string; error?: string };
      if (!signRes.ok || !signed.path || !signed.token) throw new Error(signed.error ?? "Upload failed. Please try again.");
      const { error: storageError } = await createClient().storage
        .from("program-documents")
        .uploadToSignedUrl(signed.path, signed.token, new Blob([file], { type: signed.mimeType ?? file.type }));
      if (storageError) throw new Error("Upload failed. Check your connection and try again.");
      const res = await fetch(`/api/programs/${programId}/documents`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: signed.path, fileName: file.name, type: file.type, title: title.trim() }),
      });
      const data = (await res.json()) as { document?: ProgramDocument; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Upload failed. Please try again.");
      setFile(null);
      setTitle("");
      setAdding(false);
      if (fileInput.current) fileInput.current.value = "";
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function remove(document: ProgramDocument) {
    if (deleting) return;
    setDeleting(document.id);
    setError(null);
    try {
      const res = await fetch(`/api/programs/${programId}/documents/${document.id}`, {
        method: "DELETE", credentials: "include",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Could not delete the document.");
      }
      setDocuments((current) => current.filter((item) => item.id !== document.id));
      setConfirmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the document.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <section className="program-hub-section" aria-labelledby="program-documents-heading">
      <div className="program-hub-section-heading">
        <h2 id="program-documents-heading"><FileText size={16} /> Documents</h2>
        <button type="button" className="program-hub-button" onClick={() => { setAdding(true); setError(null); }} disabled={uploading}>
          <Plus size={16} /> Add document
        </button>
      </div>
      <p className="program-hub-muted program-documents-privacy">Program documents only. Never upload patient information.</p>

      {adding && (
        <form className="program-document-upload" onSubmit={(event) => { event.preventDefault(); void upload(); }}>
          <label className="program-hub-field">
            File <span className="program-hub-muted">20 MB maximum</span>
            <input ref={fileInput} type="file" accept={DOCUMENT_ACCEPT} disabled={uploading} onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(null); }} />
          </label>
          <label className="program-hub-field">
            Title <span className="program-hub-muted">Optional</span>
            <input type="text" value={title} maxLength={200} disabled={uploading} onChange={(event) => setTitle(event.target.value)} placeholder="Use the file name or add a clear title" />
          </label>
          <div className="program-hub-actions">
            <button type="submit" className="program-hub-button program-hub-button-primary" disabled={uploading || !file}>
              {uploading && <Loader2 size={16} className="animate-spin" />}{uploading ? "Uploading..." : "Upload document"}
            </button>
            <button type="button" className="program-hub-button program-hub-button-quiet" disabled={uploading} onClick={() => { setAdding(false); setError(null); }}>Cancel</button>
          </div>
        </form>
      )}

      {error && <p className="program-hub-error" role="alert">{error}</p>}
      {loading ? <p className="program-hub-muted" role="status">Loading documents...</p> : loadError ? (
        <div className="program-hub-error" role="alert">{loadError} <button type="button" className="program-hub-link-button" onClick={() => { void load(); }}>Try again</button></div>
      ) : documents.length === 0 ? (
        <div className="program-hub-empty">
          <FileText size={24} aria-hidden="true" />
          <h3>Your program&rsquo;s shared reference shelf</h3>
          <p>Add teaching schedules, orientation guides, reading lists or templates. Every program member can contribute.</p>
          <p className="program-hub-muted">PDF, Office documents, images, text and CSV files, up to 20 MB.</p>
        </div>
      ) : (
        <ul className="program-document-list">
          {documents.map((document) => {
            const Icon = documentIcon(document.fileName);
            return (
              <li key={document.id} className="program-document-row">
                <span className="program-hub-icon"><Icon size={20} aria-hidden="true" /></span>
                <div className="program-document-info">
                  <span className="program-document-title">{document.title}</span>
                  <p className="program-hub-muted">{document.uploadedBy?.name ?? "Former member"} · {new Date(document.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} · {formatSize(document.sizeBytes)}</p>
                  {document.fileName !== document.title && <p className="program-document-filename">{document.fileName}</p>}
                </div>
                <div className="program-document-actions">
                  <a className="program-hub-icon-button" href={`/api/programs/${programId}/documents/${document.id}/download`} aria-label={`Download ${document.title}`} title="Download"><Download size={17} /></a>
                  {document.canDelete && <button type="button" className="program-hub-icon-button" onClick={() => setConfirmId(document.id)} disabled={Boolean(deleting)} aria-label={`Delete ${document.title}`} title="Delete"><Trash2 size={16} /></button>}
                </div>
                {confirmId === document.id && (
                  <div className="program-document-confirm" role="group" aria-label={`Confirm deletion of ${document.title}`}>
                    <span>Delete this document for everyone?</span>
                    <button type="button" className="program-hub-button program-hub-button-danger" disabled={Boolean(deleting)} onClick={() => { void remove(document); }}>{deleting === document.id ? "Deleting..." : "Delete"}</button>
                    <button type="button" className="program-hub-icon-button" disabled={Boolean(deleting)} onClick={() => setConfirmId(null)} aria-label="Cancel deletion"><X size={16} /></button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
