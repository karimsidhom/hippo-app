import type { Metadata } from "next";
import { InstitutionalAgreementDocument } from "@/components/legal/InstitutionalAgreementDocument";

export const metadata: Metadata = {
  title: "Institutional Pilot Agreement",
  description: "Hippo Medicine institutional pilot, services, and data-processing terms.",
  robots: { index: true, follow: true },
};

export default function InstitutionalAgreementPage() {
  return <InstitutionalAgreementDocument />;
}
