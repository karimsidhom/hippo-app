"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { ProgramCommandCenter } from "@/components/pd/ProgramCommandCenter";
import type { ProgramCommandCenterData } from "@/lib/pd-command-center/types";

export default function ProgramCommandCenterPage() {
  const [data, setData] = useState<ProgramCommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (programId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const query = programId ? `?programId=${encodeURIComponent(programId)}` : "";
      const response = await fetch(`/api/pd/command-center${query}`, { credentials: "include", cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to load the command center");
      setData(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load the command center");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading && !data) return <div style={{ minHeight: 420, display: "grid", placeItems: "center", color: "var(--text-3)" }}><Loader2 size={18} className="animate-spin" /></div>;
  if (error || !data) return <div style={{ maxWidth: 520, margin: "5rem auto", textAlign: "center" }}><h1 style={{ fontSize: 22, color: "var(--text)" }}>Program command center</h1><p style={{ color: "var(--text-2)", lineHeight: 1.6 }}>{error ?? "No program found."}</p><Link href="/programs" style={{ color: "var(--primary)", fontWeight: 700 }}>Set up a program</Link></div>;

  return <ProgramCommandCenter data={data} onProgramChange={(programId) => void load(programId)} />;
}
