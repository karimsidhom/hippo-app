import type { Metadata } from "next";
import { SolutionPage } from "@/components/marketing/SolutionPage";
import { solutions } from "@/lib/growth/solutions";
export const metadata: Metadata = { title: "Free surgical case log for residents", description: solutions["surgical-case-log"].description, alternates: { canonical: "/surgical-case-log" }, robots: { index: true, follow: true } };
export default function Page(){ return <SolutionPage solution={solutions["surgical-case-log"]} />; }
