import type { Metadata } from "next";
import { SolutionPage } from "@/components/marketing/SolutionPage";
import { solutions } from "@/lib/growth/solutions";
export const metadata: Metadata = { title: "EPA tracking for residency programs", description: solutions["epa-tracking"].description, alternates: { canonical: "/epa-tracking" }, robots: { index: true, follow: true } };
export default function Page(){ return <SolutionPage solution={solutions["epa-tracking"]} />; }
