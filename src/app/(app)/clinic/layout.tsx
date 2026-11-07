// Hippo Clinic — module layout.
//
// Sits inside the (app) layout (so we inherit auth, header, bottom nav,
// shadow-record + subprocessor banners, and the data-module="clinic" red
// theme attribute set by the parent). We use this layer for clinic-scoped
// concerns:
//
//   - The first-use acknowledgement gate (PHIA / scribe responsibility).
//
// Other clinic-specific universal concerns can be added here later
// without touching the parent (app) layout.

import { AcknowledgementGate } from "@/components/clinic/AcknowledgementGate";

export default function ClinicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AcknowledgementGate />
    </>
  );
}
