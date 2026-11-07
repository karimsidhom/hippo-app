"use client";

// ---------------------------------------------------------------------------
// Client-side push subscription helper.
//
// Handles the browser-side dance:
//   1. Read the public VAPID key from NEXT_PUBLIC_VAPID_PUBLIC_KEY.
//   2. Request Notification permission from the browser.
//   3. Ask the service worker to subscribe.
//   4. POST the subscription to /api/notifications/subscribe so the server
//      can push to this device later.
//
// Caveats:
//   - On iOS Safari, this works ONLY when the PWA is installed to the home
//     screen AND iOS 16.4+. In a browser tab the Notification API either
//     doesn't exist or always returns "denied". We detect and surface
//     kind="ios-needs-install" so the UI can direct the user to our
//     install step instead of showing a useless "permission denied" error.
//   - If VAPID isn't configured on the server, we return kind="unavailable"
//     and don't try to subscribe.
// ---------------------------------------------------------------------------

export type PushStatus =
  | { kind: "subscribed"; endpoint: string }
  | { kind: "idle" }
  | { kind: "permission-denied" }
  | { kind: "ios-needs-install" }
  | { kind: "unsupported" }
  | { kind: "unavailable" }  // no VAPID key / server not configured
  | { kind: "error"; message: string };

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    // Legacy iOS Safari flag
    const nav = navigator as Navigator & { standalone?: boolean };
    return nav.standalone === true;
  } catch {
    return false;
  }
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  const isIpadOS =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iphone|ipad|ipod/.test(ua) || isIpadOS;
}

export async function getPushStatus(): Promise<PushStatus> {
  if (typeof window === "undefined") return { kind: "idle" };
  if (!("Notification" in window)) {
    // iOS Safari doesn't expose Notification in browser tabs; check
    // whether we're in a standalone PWA first to give a better message.
    if (isIOS() && !isStandalone()) return { kind: "ios-needs-install" };
    return { kind: "unsupported" };
  }
  if (!("serviceWorker" in navigator)) return { kind: "unsupported" };
  if (!("PushManager" in window)) return { kind: "unsupported" };

  if (isIOS() && !isStandalone()) return { kind: "ios-needs-install" };

  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return { kind: "subscribed", endpoint: existing.endpoint };
  } catch {
    /* fall through */
  }

  if (Notification.permission === "denied") return { kind: "permission-denied" };
  return { kind: "idle" };
}

export async function enablePush(): Promise<PushStatus> {
  const status = await getPushStatus();
  if (status.kind === "subscribed") return status;
  if (status.kind === "ios-needs-install") return status;
  if (status.kind === "unsupported") return status;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return { kind: "unavailable" };
  }

  try {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return { kind: "permission-denied" };

    const reg = await navigator.serviceWorker.ready;
    // Cast to BufferSource — TS DOM lib narrows ArrayBufferLike in recent
    // versions which upsets Uint8Array<ArrayBufferLike>. The spec accepts
    // either BufferSource or a base64url string, so this is safe.
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
    });

    const json = sub.toJSON() as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };

    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { kind: "error", message: "Incomplete subscription from browser" };
    }

    const res = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        userAgent: navigator.userAgent,
      }),
    });
    if (!res.ok) {
      // Roll back the browser-side subscription so the user can retry
      // without the "already subscribed" dead state.
      try { await sub.unsubscribe(); } catch { /* no-op */ }
      return { kind: "error", message: `Server rejected subscription (${res.status})` };
    }

    return { kind: "subscribed", endpoint: json.endpoint };
  } catch (err) {
    return {
      kind: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function disablePush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (!existing) return;

    await fetch("/api/notifications/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: existing.endpoint }),
    }).catch(() => { /* best-effort */ });

    await existing.unsubscribe();
  } catch {
    /* no-op */
  }
}
