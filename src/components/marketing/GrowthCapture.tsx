"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const PUBLIC_PREFIXES = ["/surgical-case-log", "/epa-tracking", "/residency-program-dashboard", "/accreditation-reporting", "/insights", "/pilot", "/program-demo", "/pricing"];

export function GrowthCapture() {
  const pathname = usePathname();

  useEffect(() => {
    const isPublic = pathname === "/" || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (!isPublic) return;

    let sessionId = window.localStorage.getItem("hippo_growth_session");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      window.localStorage.setItem("hippo_growth_session", sessionId);
    }
    const params = new URLSearchParams(window.location.search);
    fetch("/api/growth/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "page_view",
        path: pathname,
        sessionId,
        source: params.get("utm_source"),
        medium: params.get("utm_medium"),
        campaign: params.get("utm_campaign"),
        content: params.get("utm_content"),
        referrer: document.referrer || null,
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
