"use client";

// Client wrapper around BulkFinalizeBar that triggers router.refresh()
// after a successful batch — the parent dashboard is a server component
// that re-fetches via the page render path.

import { useRouter } from "next/navigation";
import { BulkFinalizeBar } from "./BulkFinalizeBar";

interface UnsignedEncounter {
  id: string;
  noteType: string;
  patient: { givenName: string; familyName: string } | null;
  visitReason?: string | null;
}

export function BulkFinalizeSection({ encounters }: { encounters: UnsignedEncounter[] }) {
  const router = useRouter();
  // Only show the bulk surface when there are 2+ to finalize. With one,
  // the regular per-encounter finalize is faster.
  if (encounters.length < 2) return null;
  return <BulkFinalizeBar encounters={encounters} onComplete={() => router.refresh()} />;
}
