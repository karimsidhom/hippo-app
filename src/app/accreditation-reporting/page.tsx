import type { Metadata } from "next";
import { SolutionPage } from "@/components/marketing/SolutionPage";
import { solutions } from "@/lib/growth/solutions";
export const metadata: Metadata = { title: "Residency accreditation reporting", description: solutions["accreditation-reporting"].description, alternates: { canonical: "/accreditation-reporting" }, robots: { index: true, follow: true } };
export default function Page(){ return <SolutionPage solution={solutions["accreditation-reporting"]} />; }
