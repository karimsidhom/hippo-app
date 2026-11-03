"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, X, Trash2, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { initialsOf } from "@/lib/hippo-id";
import { isPdLike, ROLE_LABELS, ROLE_OPTIONS, type ProgramDetail, type ProgramRole } from "./types";
import "./program-hub.css";

interface UserSearchResult {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  roleType: string | null;
  trainingYearLabel: string | null;
  institution: string | null;
}

export function ProgramMembersSection({
  detail,
  onReload,
  onChanged,
  onExited,
}: {
  detail: ProgramDetail;
  onReload: () => Promise<void>;
  onChanged?: () => void;
  onExited: () => void;
}) {
  const { user } = useAuth();
  const programId = detail.program.id;
  const load = onReload;
  const onClose = onExited;
  const [inviteEmails, setInviteEmails] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
      } catch {
        if (!cancelled) setSearchResults([]);
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
        await load();
      }
    } catch {
      setSendResult("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const mutate = async (path: string, method: "DELETE" | "PATCH", body?: { role: ProgramRole }, exit = false) => {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(path, {
        method,
        credentials: "include",
        ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Could not update this program.");
      }
      if (exit) {
        onChanged?.();
        onClose();
      } else {
        await load();
        onChanged?.();
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const revokeInvite = (inviteId: string) => mutate(`/api/programs/${programId}/invites/${inviteId}`, "DELETE");

  const removeMember = (memberId: string) => {
    if (!confirm("Remove this member from the program?")) return;
    void mutate(`/api/programs/${programId}/members/${memberId}`, "DELETE");
  };

  const updateMemberRole = (memberId: string, role: ProgramRole) => mutate(`/api/programs/${programId}/members/${memberId}`, "PATCH", { role });

  const leaveProgram = (memberId: string) => {
    if (!confirm("Leave this program?")) return;
    void mutate(`/api/programs/${programId}/members/${memberId}`, "DELETE", undefined, true);
  };

  const deleteProgram = () => {
    if (!confirm(`Permanently delete "${detail.program.name}"? All events and member connections will be lost. This cannot be undone.`)) return;
    void mutate(`/api/programs/${programId}`, "DELETE", undefined, true);
  };

  return (
    <div className="program-members" aria-busy={busy}>
      {actionError && <p className="program-hub-error" role="alert">{actionError}</p>}
          {/* Invite (owner only) */}
          {isPdLike(detail.myRole) && (
            <div style={{ marginBottom: 20, position: "relative" }}>
              <SectionTitle>Invite members</SectionTitle>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <input
                    type="text"
                    aria-label="Invite members by name or email"
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
                                  fontSize: "var(--fs-11)",
                                  fontWeight: 600,
                                  color: "var(--text-3)",
                                }}
                              >
                                {initialsOf(u.name, u.email)}
                              </span>
                            )}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontSize: "var(--fs-13)",
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
                                fontSize: "var(--fs-11)",
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
                    background: sending ? "var(--text-3)" : "var(--primary-solid)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: "var(--fs-13)",
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
                  fontSize: "var(--fs-11)",
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
                    fontSize: "var(--fs-12)",
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
          {isPdLike(detail.myRole) && detail.invites.length > 0 && (
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
                  <div style={{ flex: "1 1 160px", minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "var(--fs-13)",
                        color: "var(--text)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {inv.email}
                    </div>
                    <div style={{ fontSize: "var(--fs-11)", color: "var(--text-3)" }}>
                      Expires{" "}
                      {new Date(inv.expiresAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => revokeInvite(inv.id)}
                    aria-label={`Revoke invitation for ${inv.email}`}
                    disabled={busy}
                    style={{
                      width: 44,
                      height: 44,
                      flexShrink: 0,
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
              const isSelf = m.userId === user?.id;
              return (
                <div
                  key={m.id}
                  className="program-member-row"
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
                      fontSize: "var(--fs-12)",
                      fontWeight: 600,
                      color: "var(--text-2)",
                      flexShrink: 0,
                    }}
                  >
                    {initialsOf(m.name, m.email)}
                  </div>
                  <div style={{ flex: "1 1 160px", minWidth: 0 }}>
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
                          fontSize: "var(--fs-13)",
                          fontWeight: 500,
                          color: "var(--text)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {m.name ?? m.email}
                      </span>
                      {isPdLike(m.role) && (
                        <ShieldCheck
                          size={12}
                          style={{ color: "var(--primary)" }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "var(--fs-11)",
                        color: "var(--text-3)",
                        display: "flex",
                        gap: 4,
                        flexWrap: "wrap",
                      }}
                    >
                      {(() => {
                        // A training year belongs to trainees only; a program
                        // director's stale PGY from sign-up must not show.
                        const trainee = m.roleType === "RESIDENT" || m.roleType === "FELLOW";
                        const kind = m.roleType
                          ? m.roleType.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
                          : "Member";
                        const programRole = ROLE_LABELS[m.role];
                        const parts = [
                          kind,
                          trainee ? m.trainingYearLabel : null,
                          programRole && programRole.toLowerCase() !== kind.toLowerCase() ? programRole : null,
                        ].filter(Boolean) as string[];
                        return parts.map((part, i) => (
                          <span key={part} style={{ display: "inline-flex", gap: 4 }}>
                            {i > 0 && <span style={{ color: "var(--text-3)" }}>·</span>}
                            <span style={{ color: i === parts.length - 1 && isPdLike(m.role) && part === programRole ? "var(--primary)" : "var(--text-3)" }}>{part}</span>
                          </span>
                        ));
                      })()}
                    </div>
                  </div>
                  {/* PD-only role dropdown — change a member's permissions */}
                  {isPdLike(detail.myRole) && !isSelf && (
                    <select
                      className="program-member-role"
                      disabled={busy}
                      value={m.role}
                      onChange={(e) => updateMemberRole(m.id, e.target.value as ProgramRole)}
                      title="Change role"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--text-2)",
                        borderRadius: 6,
                        padding: "4px 8px",
                        fontSize: "var(--fs-11)",
                        fontFamily: "inherit",
                        cursor: "pointer",
                      }}
                    >
                      {/* Keep OWNER as a non-selectable option only when
                          the user already holds it — discourages
                          casually demoting/transferring ownership.    */}
                      {m.role === "OWNER" && (
                        <option value="OWNER">{ROLE_LABELS.OWNER}</option>
                      )}
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                      {m.role === "MEMBER" && (
                        <option value="MEMBER">{ROLE_LABELS.MEMBER}</option>
                      )}
                    </select>
                  )}
                  {isPdLike(detail.myRole) && !isPdLike(m.role) && !isSelf && (
                    <button
                      onClick={() => removeMember(m.id)}
                      aria-label={`Remove ${m.name ?? m.email}`}
                      disabled={busy}
                      style={{
                        width: 44,
                        height: 44,
                        flexShrink: 0,
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
            {isPdLike(detail.myRole) ? (
              <button
                onClick={deleteProgram}
                disabled={busy}
                style={{
                  padding: "8px 12px",
                  background: "transparent",
                  border: "1px solid #ef444440",
                  color: "#ef4444",
                  borderRadius: 8,
                  fontSize: "var(--fs-12)",
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
                    (m) => m.userId === user?.id,
                  );
                  if (me) leaveProgram(me.id);
                }}
                disabled={busy}
                style={{
                  padding: "8px 12px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-3)",
                  borderRadius: 8,
                  fontSize: "var(--fs-12)",
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
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "var(--fs-11)",
        color: "var(--text-3)",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
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
  fontSize: "var(--fs-13)",
  outline: "none",
  fontFamily: "inherit",
};

