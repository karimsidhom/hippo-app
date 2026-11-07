"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProgramMembersSection } from "@/components/programs/ProgramMembersSection";
import { MyProgramStatus } from "@/components/programs/MyProgramStatus";
import { JoinRequestQueue } from "@/components/programs/JoinRequestQueue";
import { ProgramInviteBanner } from "@/components/ProgramInviteBanner";
import { isPdLike, type ProgramDetail, type ProgramListItem } from "@/components/programs/types";
import {
  GraduationCap,
  Plus,
  CalendarDays,
  X,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ProgramsPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [programs, setPrograms] = useState<ProgramListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [explicitCreate, setExplicitCreate] = useState(false);

  const isPD = profile?.roleType === "PROGRAM_DIRECTOR";

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/programs", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { programs: ProgramListItem[] };
      const nextPrograms = data.programs ?? [];
      setPrograms(nextPrograms);
      if (nextPrograms.length !== 1 || new URLSearchParams(window.location.search).get("create") === "1") return;

      // Redirect only after every pending-request source succeeds. A failed
      // request must never hide an invitation or a director's approval queue.
      const [requestRes, inviteRes, queueRes] = await Promise.all([
        fetch("/api/programs/my-requests", { credentials: "include" }),
        fetch("/api/programs/pending-invites", { credentials: "include" }),
        fetch("/api/pd/join-requests", { credentials: "include" }),
      ]);
      if (!requestRes.ok || !inviteRes.ok || !queueRes.ok) return;
      const [requestData, inviteData, queueData] = await Promise.all([
        requestRes.json() as Promise<{ requests: unknown[] }>,
        inviteRes.json() as Promise<{ invites: unknown[] }>,
        queueRes.json() as Promise<{ requests: unknown[] }>,
      ]);
      if (
        Array.isArray(requestData.requests) && requestData.requests.length === 0 &&
        Array.isArray(inviteData.invites) && inviteData.invites.length === 0 &&
        Array.isArray(queueData.requests) && queueData.requests.length === 0
      ) router.replace(`/programs/${nextPrograms[0].id}`);
    } catch {
      // Leave the program list and pending-flow components available on failure.
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isPD && new URLSearchParams(window.location.search).get("create") === "1") {
      setExplicitCreate(true);
      setCreating(true);
    }
  }, [isPD]);

  return (
    <div style={{ animation: "fadeIn .4s cubic-bezier(.16,1,.3,1) backwards" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-3)",
                letterSpacing: ".04em",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <GraduationCap size={11} /> Shared calendar groups
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: "var(--text)",
                letterSpacing: "-1px",
                lineHeight: 1,
              }}
            >
              Programs
            </div>
          </div>
          {isPD && (
            <button
              onClick={() => setCreating(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "var(--primary-solid)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Plus size={14} /> New program
            </button>
          )}
        </div>
      </div>

      {!isPD && programs.length === 0 && !loading && (
        <div
          style={{
            padding: "32px 20px",
            border: "1px solid var(--border)",
            borderRadius: 12,
            textAlign: "center",
            color: "var(--text-3)",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          You&rsquo;re not in any program yet.
          <br />
          Ask your program director to send an invitation.
        </div>
      )}

      {isPD && programs.length === 0 && !loading && !creating && (
        <div
          style={{
            padding: "32px 20px",
            border: "1px dashed var(--border-mid)",
            borderRadius: 12,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: 4,
            }}
          >
            Create your first program
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-3)",
              marginBottom: 16,
              lineHeight: 1.6,
            }}
          >
            A program is a private group with a shared calendar and member
            roster. Residents and attendings join by invitation only.
          </div>
          <button
            onClick={() => setCreating(true)}
            style={{
              padding: "10px 20px",
              background: "var(--primary-solid)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Create program
          </button>
        </div>
      )}

      <ProgramInviteBanner onChanged={load} />
      <MyProgramStatus onChanged={load} />
      <JoinRequestQueue onChanged={load} />

      {/* Program list */}
      {!loading && programs.length > 0 && (
        <div>
          {programs.map((p) => (
            <Link
              key={p.id}
              href={`/programs/${p.id}`}
              style={{
                width: "100%",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 16px",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                cursor: "pointer",
                marginBottom: 10,
                textAlign: "left",
                fontFamily: "inherit",
                transition: "border-color .15s",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--primary)",
                  flexShrink: 0,
                }}
              >
                <CalendarDays size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {p.name}
                  </span>
                  {isPdLike(p.myRole) && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--primary)",
                        background: "rgba(14,165,233,0.12)",
                        padding: "2px 6px",
                        borderRadius: 4,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      Owner
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-3)",
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  <span>
                    {p.memberCount} member{p.memberCount === 1 ? "" : "s"}
                  </span>
                  <span style={{ color: "var(--text-3)" }}>·</span>
                  <span>
                    {p.eventCount} event{p.eventCount === 1 ? "" : "s"}
                  </span>
                  {p.institution && (
                    <>
                      <span style={{ color: "var(--text-3)" }}>·</span>
                      <span>{p.institution}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {creating && (
        <CreateProgramSheet
          onClose={() => {
            setCreating(false);
            if (explicitCreate) {
              setExplicitCreate(false);
              router.replace(programs.length === 1 ? `/programs/${programs[0].id}` : "/programs");
            }
          }}
          onCreated={(id) => {
            setCreating(false);
            if (explicitCreate) {
              setExplicitCreate(false);
              router.replace(`/programs/${id}`);
              return;
            }
            load();
            setSelectedId(id);
          }}
        />
      )}

      {selectedId && (
        <ProgramDetailSheet
          programId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={() => {
            load();
          }}
        />
      )}

      <Link
        href="/dashboard"
        style={{
          display: "inline-block",
          marginTop: 24,
          fontSize: 12,
          color: "var(--text-3)",
          textDecoration: "none",
        }}
      >
        &larr; Back to dashboard
      </Link>
    </div>
  );
}

// ─── Create Program Sheet ───────────────────────────────────────────────────

function CreateProgramSheet({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (saving) return;
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          institution: institution.trim(),
          specialty: specialty.trim(),
          description: description.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err?.error ?? "Create failed");
        setSaving(false);
        return;
      }
      const data = await res.json();
      onCreated(data.id);
    } catch {
      setError("Network error");
      setSaving(false);
    }
  };

  return (
    <SheetShell title="New program" onClose={onClose}>
      <Field label="Name">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. U of T General Surgery"
          style={inputStyle}
        />
      </Field>
      <Field label="Institution (optional)">
        <input
          type="text"
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          style={inputStyle}
        />
      </Field>
      <Field label="Specialty (optional)">
        <input
          type="text"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          style={inputStyle}
        />
      </Field>
      <Field label="Description (optional)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
        />
      </Field>
      {error && (
        <div
          style={{
            padding: "8px 12px",
            background: "#ef444410",
            border: "1px solid #ef444430",
            borderRadius: 6,
            fontSize: 12,
            color: "#ef4444",
            marginTop: 8,
          }}
        >
          {error}
        </div>
      )}
      <SheetFooter>
        <button onClick={onClose} style={footerBtnSecondary}>
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={saving}
          style={{
            ...footerBtnPrimary,
            background: saving ? "var(--text-3)" : "var(--primary-solid)",
            cursor: saving ? "wait" : "pointer",
          }}
        >
          {saving && <Loader2 size={13} className="animate-spin" />}
          {saving ? "Creating..." : "Create"}
        </button>
      </SheetFooter>
    </SheetShell>
  );
}

// ─── Program Detail Sheet ───────────────────────────────────────────────────

function ProgramDetailSheet({
  programId,
  onClose,
  onChanged,
}: {
  programId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/programs/${programId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Could not load this program.");
      setDetail(await res.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this program.");
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => { void load(); }, [load]);

  return (
    <SheetShell
      title={detail?.program.name ?? "Program"}
      onClose={onClose}
      headerSubtitle={detail ? [detail.program.institution, detail.program.specialty].filter(Boolean).join(" · ") : undefined}
    >
      {loading ? <p style={{ color: "var(--text-3)" }}>Loading...</p> : detail ? (
        <ProgramMembersSection detail={detail} onReload={load} onChanged={onChanged} onExited={onClose} />
      ) : <p role="alert" style={{ color: "var(--text-2)" }}>{error}</p>}
    </SheetShell>
  );
}

// ─── Shared sheet chrome ────────────────────────────────────────────────────

function SheetShell({
  title,
  onClose,
  children,
  headerSubtitle,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  headerSubtitle?: string;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface)",
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 16,
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text)",
                letterSpacing: "-0.2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </div>
            {headerSubtitle && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-3)",
                  marginTop: 2,
                }}
              >
                {headerSubtitle}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-2)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: 20, overflow: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

function SheetFooter({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        marginTop: 16,
        paddingTop: 12,
        borderTop: "1px solid var(--border)",
      }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-3)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text)",
  fontSize: 13,
  outline: "none",
  fontFamily: "inherit",
};

const footerBtnSecondary: React.CSSProperties = {
  flex: 1,
  padding: "10px 14px",
  background: "transparent",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text-2)",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
};

const footerBtnPrimary: React.CSSProperties = {
  flex: 1,
  padding: "10px 14px",
  background: "var(--primary-solid)",
  border: "none",
  borderRadius: 8,
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  fontFamily: "inherit",
};
