import Link from "next/link";
import "@/app/academic-workspace.css";

// Codex's Progress hub also has Requirements; that page needs the program
// requirement tables, which are not in production yet, so it joins the
// strip when they ship.
export type ProgressView = "analytics" | "notes" | "meetings";
const views: { id: ProgressView; label: string; href: string }[] = [
  { id: "analytics", label: "Overview & assessments", href: "/analytics" },
  { id: "notes", label: "Case notes", href: "/notes" },
  { id: "meetings", label: "Meetings & plans", href: "/profile/meetings" },
];

export function ProgressNav({ active }: { active: ProgressView }) {
  return <nav className="progress-nav" aria-label="Your progress">
    {views.map(view => <Link key={view.id} href={view.href} aria-current={active === view.id ? "page" : undefined}>{view.label}</Link>)}
  </nav>;
}
