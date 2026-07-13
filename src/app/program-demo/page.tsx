import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProgramCommandCenter } from "@/components/pd/ProgramCommandCenter";
import { demoProgramCommandCenter } from "@/lib/pd-command-center/demo";
import styles from "./program-demo.module.css";

export const metadata: Metadata = {
  title: "Program Director Demo",
  description: "Explore the Hippo program director command center using safe synthetic residency-program data.",
  alternates: { canonical: "/program-demo" },
  robots: { index: true, follow: true },
};

export default function ProgramDemoPage() {
  return <div className={styles.page}>
    <nav><Link href="/"><ArrowLeft size={15} /> Hippo</Link><div><Link href="/pricing">Program pricing</Link><Link className={styles.primary} href="/pilot?utm_source=program_demo&utm_medium=product&utm_campaign=program_pilot">Request a pilot <ArrowRight size={15} /></Link></div></nav>
    <ProgramCommandCenter data={demoProgramCommandCenter} />
  </div>;
}
