"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Plus,
  Users2,
  CalendarDays,
  Mail,
  X,
  Copy,
  Check,
  Loader2,
  Trash2,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ProgramListItem {
  id: string;
  name: string;
  institution: string | null;
  specialty: string | null;
  description: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  myRole: "OWNER" | "MEMBER";
  memberCount: number;
  eventCount: number;
}

interface ProgramDetail {
  program: {
    id: string;
    name: string;
    institution: string | null;
    specialty: string | null;
    description: string | null;
    createdById: string;
    createdAt: string;
    updatedAt: string;
  };
  myRole: "OWNER" | "MEMBER";
  members: Array<{
    id: string;
    userId: string;
    role: "OWNER" | "MEMBER";
    joinedAt: string;
    name: string | null;
    email: string;
    image: string | null;
    roleType: string | null;
    trainingYearLabel: string | null;
  }>;
  invites: Array<{
    id: string;
    email: string;
    createdAt: string;
    expiresAt: string;
    acceptedAt: string | null;
    revokedAt: string | null;
  }>;
}

export default function ProgramsPage() {
  const { profile } = useAuth();
  const [programs, setPrograms] = useState<ProgramListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const isPD = profile?.roleType === "PROGRAM_DIRECTOR";

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/programs", { credentials: "include" });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setPrograms(data.programs ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={{ animation: "fadeIn .4s cubic-bezier(.16,1,.3,1) forwards" }}>
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
                fontWeight: 800,
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
                background: "var(--primary)",
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
              background: "var(--primary)",
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

      {/* Program list */}
      {!loading && programs.length > 0 && (
        <div>
          {programs.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              style={{
                width: "100%",
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
                  {p.myRole === "OWNER" && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "var(--primary)",
                        background: "rgba(14,165,233,0.12)",
                        padding: "2px 6px",
                        borderRadius: 4,
                        letterSpacing: "0.5px",
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
                  <span style={{ color: "var(--muted)" }}>·</span>
                  <span>
                    {p.eventCount} event{p.eventCount === 1 ? "" : "s"}
                  </span>
                  {p.institution && (
                    <>
                      <span style={{ color: "var(--muted)" }}>·</span>
                      <span>{p.institution}</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {creating && (
        <CreateProgramSheet
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false);
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
            background: saving ? "var(--muted)" : "var(--primary)",
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

interface UserSearchResult {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  roleType: string | null;
  trainingYearLabel: string | null;
  institution: string | null;
}

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
  const [inviteEmails, setInviteEmails] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/programs/${programId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      setDetail(await res.json());
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounced in-app user search — suggests existing Hippo users as the PD types.
  useEffect(() => {
    const last = inviteEmails.split(/[\s,;]+/).pop()?.trim() ?? "";
    // If the last token contains @ + ., we treat it as a real email and skip search.
    const looksLikeEmail = /.+@.+\..+/.test(last);
    if (last.length < 2 || looksLikeEmail) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/programs/${programId}/search-users?q=${encodeURIComponent(last)}`,
          { credentials: "include" },
        );
        if (!res.ok) {
          if (!cancelled) setSearchResults([]);
          return;
        }
        const data = (await res.json()) as { users: UserSearchResult[] };
        if (!cancelled) {
          setSearchResults(data.users ?? []);
          setSearchOpen(true);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [inviteEmails, programId]);

  const pickSearchedUser = (u: UserSearchResult) => {
    // Replace the last token in the input with this user's email, then add a comma for the next one.
    const parts = inviteEmails.split(/([\s,;]+)/);
    if (parts.length > 0) {
      // Drop the trailing partial token, replace with user.email + ", "
      const trailing = parts[parts.length - 1];
      const isSeparator = /^[\s,;]+$/.test(trailing);
      if (!isSeparator) parts.pop();
      parts.push(u.email);
    }
    setInviteEmails(parts.join("") + ", ");
    setSearchOpen(false);
    setSearchResults([]);
  };

  const sendInvites = async () => {
    if (sending) return;
    const emails = inviteEmails
      .split(/[\s,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
    if (emails.length === 0) {
      setSendResult("Enter at least one email.");
      return;
    }
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch(`/api/programs/${programId}/invites`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSendResult(err?.error ?? "Send failed");
      } else {
        const data = await res.json();
        const sent = data.results.filter(
          (r: { status: string }) => r.status === "sent",
        ).length;
        const alreadyMembers = data.results.filter(
          (r: { status: string }) => r.status === "already-member",
        ).length;
        const alreadyInvited = data.results.filter(
          (r: { status: string }) => r.status === "already-invited",
        ).length;
        const parts: string[] = [];
        if (sent) parts.push(`${sent} sent`);
        if (alreadyMembers) parts.push(`${alreadyMembers} already in`);
        if (alreadyInvited) parts.push(`${alreadyInvited} pending`);
        setSendResult(parts.join(", ") || "Done");
        setInviteEmails("");
        load();
      }
    } finally {
      setSending(false);
    }
  };

  const revokeInvite = async (inviteId: string) => {
    await fetch(`/api/programs/${programId}/invites/${inviteId}`, {
      method: "DELETE",
      credentials: "include",
    });
    load();
  };

  const removeMember = async (memberId: string) => {
    if (!confirm("Remove this member from the program?")) return;
    await fetch(`/api/programs/${programId}/members/${memberId}`, {
      method: "DELETE",
      credentials: "include",
    });
    load();
    onChanged();
  };

  const leaveProgram = async (memberId: string) => {
    if (!confirm("Leave this program?")) return;
    const res = await fetch(`/api/programs/${programId}/members/${memberId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      onChanged();
      onClose();
    }
  };

  const deleteProgram = async () => {
    if (!detail) return;
    if (
      !confirm(
        `Permanently delete "${detail.program.name}"? All events and member connections will be lost. This cannot be undone.`,
      )
    )
      return;
    const res = await fetch(`/api/programs/${programId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      onChanged();
      onClose();
    }
  };

  return (
    <SheetShell
      title={detail?.program.name ?? "Loading..."}
      onClose={onClose}
      headerSubtitle={
        detail?.program.institution || detail?.program.specialty
          ? [detail.program.institution, detail.program.specialty]
              .filter(Boolean)
              .join(" · ")
          : undefined
      }
    >
      {loading || !detail ? (
        <div style={{ padding: 32, textAlign: "center", color: "var(--text-3)" }}>
          Loading...
        </div>
      ) : (
        <>
          {/* Invite (owner only) */}
          {detail.myRole === "OWNER" && (
            <div style={{ marginBottom: 20, position: "relative" }}>
              <SectionTitle>Invite members</SectionTitle>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <input
                    type="text"
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) setSearchOpen(true);
                    }}
                    onBlur={() => {
                      // Delay so a click on a suggestion still registers.
                      setTimeout(() => setSearchOpen(false), 150);
                    }}
                    placeholder="Search by name or type an email"
                    style={inputStyle}
                  />
                  {searchOpen && searchResults.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        right: 0,
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                        maxHeight: 240,
                        overflow: "auto",
                        zIndex: 10,
                      }}
                    >
                      {searchResults.map((u) => (
                        <button
                          key={u.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            pickSearchedUser(u);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            width: "100%",
                            padding: "8px 12px",
                            background: "transparent",
                            border: "none",
                            borderBottom: "1px solid var(--border)",
                            cursor: "pointer",
                            textAlign: "left",
                            color: "var(--text)",
                            fontFamily: "inherit",
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: "var(--surface2)",
                              border: "1px solid var(--border)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                              flexShrink: 0,
                            }}
                          >
                            {u.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={u.image}
                                alt=""
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: "var(--text-3)",
                                }}
                              >
                                {(u.name ?? u.email)[0]?.toUpperCase() ?? "?"}
                              </span>
                            )}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: "var(--text)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {u.name ?? u.email}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--text-3)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {[
                                u.trainingYearLabel,
                                u.roleType?.replace(/_/g, " ").toLowerCase(),
                                u.institution,
                              ]
                                .filter(Boolean)
                                .join(" · ") || u.email}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={sendInvites}
                  disabled={sending}
                  style={{
                    padding: "10px 14px",
                    background: sending ? "var(--muted)" : "var(--primary)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: sending ? "wait" : "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {sending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Mail size={13} />
                  )}
                  Send
                </button>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-3)",
                  marginTop: 6,
                  lineHeight: 1.5,
                }}
              >
                {searching
                  ? "Searching Hippo users..."
                  : "Existing Hippo users will see the invite in-app. We also email them so they don't miss it."}
              </div>
              {sendResult && (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-3)",
                    marginTop: 6,
                  }}
                >
                  {sendResult}
                </div>
              )}
            </div>
          )}

          {/* Pending invites */}
          {detail.myRole === "OWNER" && detail.invites.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <SectionTitle>Pending invites ({detail.invites.length})</SectionTitle>
              {detail.invites.map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <Mail
                    size={13}
                    style={{ color: "var(--text-3)", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {inv.email}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                      Expires{" "}
                      {new Date(inv.expiresAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => revokeInvite(inv.id)}
                    aria-label="Revoke"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                      background: "transparent",
                      color: "var(--text-3)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Members */}
          <div style={{ marginBottom: 20 }}>
            <SectionTitle>Members ({detail.members.length})</SectionTitle>
            {detail.members.map((m) => {
              const isSelf = m.userId === detail.members.find((x) => x.role === detail.myRole)?.userId;
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "var(--surface2)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-2)",
                      flexShrink: 0,
                    }}
                  >
                    {(m.name ?? m.email).slice(0, 1).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 1,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--text)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {m.name ?? m.email}
                      </span>
                      {m.role === "OWNER" && (
                        <ShieldCheck
                          size={12}
                          style={{ color: "var(--primary)" }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-3)",
                        display: "flex",
                        gap: 4,
                      }}
                    >
                      <span>
                        {m.roleType?.replace(/_/g, " ").toLowerCase() ?? "member"}
                      </span>
                      {m.trainingYearLabel && (
                        <>
                          <span style={{ color: "var(--muted)" }}>·</span>
                          <span>{m.trainingYearLabel}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {detail.myRole === "OWNER" && m.role !== "OWNER" && !isSelf && (
                    <button
                      onClick={() => removeMember(m.id)}
                      aria-label="Remove"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        border: "1px solid var(--border)",
                        background: "transparent",
                        color: "var(--text-3)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Destructive actions */}
          <div
            style={{
              display: "flex",
              gap: 8,
              paddingTop: 8,
              borderTop: "1px solid var(--border)",
              marginTop: 8,
            }}
          >
            {detail.myRole === "OWNER" ? (
              <button
                onClick={deleteProgram}
                style={{
                  padding: "8px 12px",
                  background: "transparent",
                  border: "1px solid #ef444440",
                  color: "#ef4444",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Trash2 size={12} />
                Delete program
              </button>
            ) : (
              <button
                onClick={() => {
                  const me = detail.members.find(
                    (m) => m.role === detail.myRole,
                  );
                  if (me) leaveProgram(me.id);
                }}
                style={{
                  padding: "8px 12px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-3)",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <LogOut size={12} />
                Leave program
              </button>
            )}
          </div>
        </>
      )}
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
                fontWeight: 700,
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
          fontSize: 10,
          color: "var(--text-3)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        color: "var(--text-3)",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "1px",
        marginBottom: 10,
      }}
    >
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
  background: "var(--primary)",
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
