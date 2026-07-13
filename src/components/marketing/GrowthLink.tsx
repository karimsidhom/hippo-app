"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link> & { placement: string };

export function GrowthLink({ placement, onClick, ...props }: Props) {
  return <Link {...props} onClick={(event) => {
    const payload = JSON.stringify({
      name: "cta_click",
      path: window.location.pathname,
      sessionId: window.localStorage.getItem("hippo_growth_session"),
      metadata: { placement, destination: String(props.href) },
    });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/growth/events", new Blob([payload], { type: "application/json" }));
    else fetch("/api/growth/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
    onClick?.(event);
  }} />;
}
