import type { Metadata } from "next";
import { SolutionPage } from "@/components/marketing/SolutionPage";
import { solutions } from "@/lib/growth/solutions";
export const metadata: Metadata = { title: "Residency program dashboard", description: solutions["residency-program-dashboard"].description, alternates: { canonical: "/residency-program-dashboard" }, robots: { index: true, follow: true } };
export default function Page(){ return <SolutionPage solution={solutions["residency-program-dashboard"]} />; }
