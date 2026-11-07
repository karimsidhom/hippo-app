"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  acceptSafety,
  loadSafetyStatus,
  SAFETY_RETURNS,
  type SafetyAppId,
  type SafetyStatus,
} from "@/lib/safety";
import "./safety.css";
export function SafetyScreen({ app }: { app: SafetyAppId }) {
  const [status, setStatus] = useState<SafetyStatus | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [passing, setPassing] = useState(false);
  const destinationFor = useCallback(async () => {
    let destination = SAFETY_RETURNS[app];
    if (app === "cases") {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok)
        throw new Error("Could not confirm your profile. Please retry.");
      const me = await response.json();
      if (!me.profile?.onboardingCompleted) destination = "/onboarding";
    }
    return destination;
  }, [app]);
  const load = useCallback(async () => {
    try {
      const client = createClient();
      const { data, error: authError } = await client.auth.getUser();
      if (authError || !data.user) {
        window.location.assign(
          "/login?next=" + encodeURIComponent("/safety?app=" + app),
        );
        return;
      }
      const current = await loadSafetyStatus(client, app);
      // Everything already on record: this screen is onboarding, not a toll
      // booth, so a returning account passes straight through to the app.
      if (current.complete) {
        setPassing(true);
        let destination = SAFETY_RETURNS[app];
        try {
          destination = await destinationFor();
        } catch {
          /* The app's own onboarding redirect still applies after entry. */
        }
        window.location.assign(destination);
        return;
      }
      setStatus(current);
      setChecked({});
      setError("");
    } catch {
      setError(
        "Safety requirements could not be loaded. Your completion has not been recorded. Please retry.",
      );
    }
  }, [app, destinationFor]);
  useEffect(() => {
    const task = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(task);
  }, [load]);
  async function complete() {
    if (!status) return;
    setBusy(true);
    setError("");
    try {
      const pending = status.policies.filter((p) => !p.accepted);
      if (pending.some((p) => !checked[p.policyKey]))
        throw new Error("Review and acknowledge each remaining requirement.");
      const result = pending.length
        ? await acceptSafety(
            createClient(),
            app,
            pending.map((p) => ({
              policyKey: p.policyKey,
              version: p.version,
              digest: p.digest,
              accepted: true as const,
            })),
          )
        : await loadSafetyStatus(createClient(), app);
      if (!result.complete)
        throw new Error("Safety setup remains incomplete. Please retry.");
      setStatus(result);
      window.location.assign(await destinationFor());
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not record safety requirements. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="safety-page">
      <header>
        <Link href="/" className="safety-brand">
          Hippo Medicine
        </Link>
        <span>Shared account safety</span>
      </header>
      <section className="safety-card">
        <p className="safety-kicker">ONE HIPPO ACCOUNT · {app.toUpperCase()}</p>
        <h1>A safe start, together.</h1>
        <p>
          Complete the shared requirements once for the current version, then
          review this app’s handling notice. Your team and encounter permissions
          remain separate.
        </p>
        {error && (
          <div role="alert" className="safety-error">
            {error}
            <button type="button" onClick={() => void load()} disabled={busy}>
              Retry loading
            </button>
          </div>
        )}
        {passing && <p role="status">You are all set. Opening the app…</p>}
        {!status && !error && !passing && (
          <p role="status">Loading your current requirements…</p>
        )}
        {status?.policies.map((policy) => (
          <article className="safety-policy" key={policy.policyKey}>
            <h2>{policy.title}</h2>
            <p>{policy.body}</p>
            <small>Version {policy.version}</small>
            {policy.accepted ? (
              <p className="safety-accepted">
                ✓ Already recorded for this version
              </p>
            ) : (
              <label>
                <input
                  type="checkbox"
                  checked={!!checked[policy.policyKey]}
                  onChange={(e) =>
                    setChecked((v) => ({
                      ...v,
                      [policy.policyKey]: e.target.checked,
                    }))
                  }
                />
                <span>I have read and acknowledge this requirement.</span>
              </label>
            )}
          </article>
        ))}
        {!passing && (
          <>
            <p className="safety-note">
              Completion records these acknowledgments. It does not verify
              professional credentials, grant clinical access or certify PHIA
              compliance.
            </p>
            <button
              className="safety-continue"
              onClick={() => void complete()}
              disabled={
                busy ||
                !status ||
                status.policies.some((p) => !p.accepted && !checked[p.policyKey])
              }
            >
              {busy
                ? "Recording…"
                : `Continue to ${app === "cases" ? "Cases" : app.charAt(0).toUpperCase() + app.slice(1)}`}
            </button>
            <Link className="safety-signout" href="/login">
              Use another account
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
