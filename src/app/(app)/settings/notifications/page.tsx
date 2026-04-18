"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Bell, Volume2, Vibrate, Smartphone, Mail, Check, AlertTriangle } from "lucide-react";
import { useInteraction } from "@/hooks/useInteraction";
import {
  enablePush,
  disablePush,
  getPushStatus,
  type PushStatus,
} from "@/lib/notifications/client";

// ---------------------------------------------------------------------------
// Settings → Notifications
//
// One page, three sections:
//   1. Push — OS-level alerts to this device. Surfaces the install gate
//      on iOS Safari since push is impossible without the PWA installed.
//   2. Channels — email on/off, in-app on/off. (Push toggle lives in §1.)
//   3. Events — per-event toggles so attendings can silence the EPA
//      flood and keep batch summaries.
//   4. Sound & haptics — client-side. Stored in localStorage (for fast
//      read on every sfx call) AND server-side (so new devices inherit).
//
// Server-side preferences live in user_notification_preferences; we
// upsert them on load so new users auto-get defaults.
// ---------------------------------------------------------------------------

interface Preferences {
  inAppEnabled:          boolean;
  pushEnabled:           boolean;
  emailEnabled:          boolean;
  notifyOnEpaSubmitted:  boolean;
  notifyOnEpaVerified:   boolean;
  notifyOnEpaReturned:   boolean;
  notifyOnBatchSigned:   boolean;
  soundEnabled:          boolean;
  hapticsEnabled:        boolean;
}

export default function NotificationSettingsPage() {
  const fx = useInteraction();
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [pushStatus, setPushStatus] = useState<PushStatus>({ kind: "idle" });
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const [prefsRes, push] = await Promise.all([
        fetch("/api/notifications/preferences").then(r => (r.ok ? r.json() : null)),
        getPushStatus(),
      ]);
      if (prefsRes?.preferences) {
        const p = prefsRes.preferences;
        setPrefs({
          inAppEnabled: p.inAppEnabled,
          pushEnabled: p.pushEnabled,
          emailEnabled: p.emailEnabled,
          notifyOnEpaSubmitted: p.notifyOnEpaSubmitted,
          notifyOnEpaVerified: p.notifyOnEpaVerified,
          notifyOnEpaReturned: p.notifyOnEpaReturned,
          notifyOnBatchSigned: p.notifyOnBatchSigned,
          soundEnabled: p.soundEnabled,
          hapticsEnabled: p.hapticsEnabled,
        });
        // Mirror to localStorage so sfx/haptics read the latest value.
        try {
          localStorage.setItem("hippo_sfx_enabled", String(p.soundEnabled));
          localStorage.setItem("hippo_haptics_enabled", String(p.hapticsEnabled));
        } catch { /* no-op */ }
      }
      setPushStatus(push);
      setLoading(false);
    })();
  }, []);

  const update = async (patch: Partial<Preferences>) => {
    if (!prefs) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    fx.toggle();
    // Mirror sound/haptics locally first — zero latency for the user.
    try {
      if (patch.soundEnabled !== undefined) {
        localStorage.setItem("hippo_sfx_enabled", String(patch.soundEnabled));
      }
      if (patch.hapticsEnabled !== undefined) {
        localStorage.setItem("hippo_haptics_enabled", String(patch.hapticsEnabled));
      }
    } catch { /* no-op */ }
    // Persist server-side.
    void fetch("/api/notifications/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  };

  const onEnablePush = async () => {
    fx.tap();
    setPushBusy(true);
    const next = await enablePush();
    setPushStatus(next);
    setPushBusy(false);
  };

  const onDisablePush = async () => {
    fx.tap();
    setPushBusy(true);
    await disablePush();
    setPushStatus({ kind: "idle" });
    setPushBusy(false);
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      {/* Back */}
      <Link
        href="/settings"
        className="press"
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          color: "var(--text-2)", fontSize: 12, textDecoration: "none",
          marginBottom: 12,
        }}
      >
        <ChevronLeft size={14} />
        Settings
      </Link>

      <h1 style={{
        fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px",
        color: "var(--text)", margin: "0 0 6px",
      }}>
        Notifications
      </h1>
      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 28 }}>
        Control how Hippo reaches you about EPA reviews, sign-offs, and verification.
      </div>

      {loading || !prefs ? (
        <div className="skeleton" style={{ height: 400, borderRadius: 10 }} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* ── Push ─────────────────────────────────────────────────── */}
          <Section
            icon={<Smartphone size={14} />}
            title="Push notifications"
            body="Wake your device when an EPA needs attention."
          >
            <PushControls
              status={pushStatus}
              busy={pushBusy}
              onEnable={onEnablePush}
              onDisable={onDisablePush}
            />
          </Section>

          {/* ── Channels ────────────────────────────────────────────── */}
          <Section
            icon={<Mail size={14} />}
            title="Channels"
            body="Master toggles for where Hippo reaches you."
          >
            <Toggle
              label="In-app notifications"
              description="Bell icon and notification center"
              checked={prefs.inAppEnabled}
              onChange={v => update({ inAppEnabled: v })}
            />
            <Toggle
              label="Push (this device)"
              description="Also controlled per-device above"
              checked={prefs.pushEnabled}
              onChange={v => update({ pushEnabled: v })}
            />
            <Toggle
              label="Email"
              description="Digest and attending review links"
              checked={prefs.emailEnabled}
              onChange={v => update({ emailEnabled: v })}
            />
          </Section>

          {/* ── Events ──────────────────────────────────────────────── */}
          <Section
            icon={<Bell size={14} />}
            title="Events"
            body="Pick which EPA transitions you want to hear about."
          >
            <Toggle
              label="EPA submitted to me"
              description="Attending: a resident asked for your signature"
              checked={prefs.notifyOnEpaSubmitted}
              onChange={v => update({ notifyOnEpaSubmitted: v })}
            />
            <Toggle
              label="EPA verified"
              description="Resident: an attending signed one of your EPAs"
              checked={prefs.notifyOnEpaVerified}
              onChange={v => update({ notifyOnEpaVerified: v })}
            />
            <Toggle
              label="EPA returned"
              description="Resident: needs edits from your attending"
              checked={prefs.notifyOnEpaReturned}
              onChange={v => update({ notifyOnEpaReturned: v })}
            />
            <Toggle
              label="Batch sign-off completed"
              description="Both sides: confirmation when many EPAs are signed at once"
              checked={prefs.notifyOnBatchSigned}
              onChange={v => update({ notifyOnBatchSigned: v })}
            />
          </Section>

          {/* ── Sound & haptics ─────────────────────────────────────── */}
          <Section
            icon={<Volume2 size={14} />}
            title="Sound & haptics"
            body="Interaction feedback when you tap, log, and sign."
          >
            <Toggle
              label="Sound effects"
              description="Quiet click / chime / sweep on taps and confirmations"
              checked={prefs.soundEnabled}
              onChange={v => update({ soundEnabled: v })}
            />
            <Toggle
              label="Haptics"
              description="Android only — iOS does not support web haptics"
              checked={prefs.hapticsEnabled}
              onChange={v => update({ hapticsEnabled: v })}
            />
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({
  icon, title, body, children,
}: { icon: React.ReactNode; title: string; body: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: "18px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
        <div style={{ color: "var(--primary-hi)", display: "flex" }}>{icon}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{title}</div>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 14 }}>{body}</div>
      <div style={{ display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}

function Toggle({
  label, description, checked, onChange,
}: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      padding: "10px 0",
      borderTop: "1px solid var(--border)",
      cursor: "pointer",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", lineHeight: 1.35 }}>
          {label}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, lineHeight: 1.4 }}>
          {description}
        </div>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </label>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={(e) => { e.preventDefault(); onChange(!checked); }}
      className="press"
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        background: checked ? "var(--primary)" : "var(--border-mid)",
        border: "none",
        padding: 0,
        cursor: "pointer",
        position: "relative",
        transition: "background .18s cubic-bezier(.16,1,.3,1)",
        flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute",
        top: 2,
        left: checked ? 18 : 2,
        width: 16,
        height: 16,
        borderRadius: 8,
        background: "#fff",
        transition: "left .18s cubic-bezier(.16,1,.3,1)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
      }} />
    </button>
  );
}

function PushControls({
  status, busy, onEnable, onDisable,
}: {
  status: PushStatus;
  busy: boolean;
  onEnable: () => void;
  onDisable: () => void;
}) {
  if (status.kind === "subscribed") {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, padding: "12px", borderRadius: 8,
        background: "rgba(16,185,129,0.08)",
        border: "1px solid rgba(16,185,129,0.25)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#10b981" }}>
          <Check size={14} strokeWidth={2.5} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>Push enabled on this device</span>
        </div>
        <button
          onClick={onDisable}
          disabled={busy}
          className="press"
          style={{
            background: "transparent",
            border: "1px solid var(--border-mid)",
            borderRadius: 5,
            padding: "5px 10px",
            fontSize: 11,
            fontWeight: 500,
            color: "var(--text-2)",
            cursor: busy ? "wait" : "pointer",
            opacity: busy ? 0.6 : 1,
            fontFamily: "inherit",
          }}
        >
          Disable
        </button>
      </div>
    );
  }

  if (status.kind === "ios-needs-install") {
    return (
      <NotSupportedNotice
        tone="warning"
        title="Install Hippo first"
        body="Apple only lets Hippo send push notifications when the app is on your home screen. Open it there, come back here, and you'll be able to enable."
        cta={{ label: "Install step", href: "/onboarding/install" }}
      />
    );
  }

  if (status.kind === "unsupported") {
    return (
      <NotSupportedNotice
        tone="muted"
        title="Not supported on this browser"
        body="Push notifications need a browser with Service Worker and Push Manager support."
      />
    );
  }

  if (status.kind === "permission-denied") {
    return (
      <NotSupportedNotice
        tone="warning"
        title="Permission blocked"
        body="Push permission was denied. Re-enable it from your browser's site settings, then come back."
      />
    );
  }

  if (status.kind === "unavailable") {
    return (
      <NotSupportedNotice
        tone="muted"
        title="Push not configured"
        body="Our server isn't configured for push yet. We'll notify you when it rolls out."
      />
    );
  }

  // idle | error — offer the enable action
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <button
        onClick={onEnable}
        disabled={busy}
        className="press-key"
        style={{
          background: "var(--primary)",
          color: "#fff",
          border: "none",
          borderRadius: 7,
          padding: "10px 14px",
          fontSize: 13,
          fontWeight: 600,
          cursor: busy ? "wait" : "pointer",
          opacity: busy ? 0.6 : 1,
          fontFamily: "inherit",
          width: "100%",
        }}
      >
        {busy ? "Enabling..." : "Enable push on this device"}
      </button>
      {status.kind === "error" && (
        <div style={{
          fontSize: 11, color: "#ef4444",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <AlertTriangle size={11} />
          {status.message}
        </div>
      )}
    </div>
  );
}

function NotSupportedNotice({
  tone, title, body, cta,
}: {
  tone: "warning" | "muted";
  title: string;
  body: string;
  cta?: { label: string; href: string };
}) {
  const color = tone === "warning" ? "#f59e0b" : "var(--text-2)";
  const bg = tone === "warning"
    ? "rgba(245,158,11,0.06)"
    : "rgba(255,255,255,0.02)";
  const border = tone === "warning"
    ? "rgba(245,158,11,0.25)"
    : "var(--border-mid)";
  return (
    <div style={{
      padding: 12,
      borderRadius: 8,
      background: bg,
      border: `1px solid ${border}`,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        color, fontSize: 12, fontWeight: 600, marginBottom: 4,
      }}>
        <AlertTriangle size={12} />
        {title}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-2)", lineHeight: 1.5 }}>
        {body}
      </div>
      {cta && (
        <Link
          href={cta.href}
          className="press"
          style={{
            display: "inline-block",
            marginTop: 10,
            padding: "6px 12px",
            background: "var(--primary)",
            color: "#fff",
            borderRadius: 5,
            fontSize: 11,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
