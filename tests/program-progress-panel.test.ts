import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AgreedTargetList, matchesProgramProgressSource, ProgramProgressPanel } from "@/components/epa/ProgramProgressPanel";

describe("program source review stays bound to the displayed import", () => {
  const context = { programId: "program-a", residentId: "resident-a", specialty: "urology", contentHash: "source-version-a" };

  it("accepts only the matching program, resident, specialty and source version", () => {
    expect(matchesProgramProgressSource({ ...context }, context)).toBe(true);
    expect(matchesProgramProgressSource(null, context)).toBe(false);
    for (const change of [{ programId: "program-b" }, { residentId: "resident-b" }, { specialty: "general-surgery" }, { contentHash: "source-version-b" }]) {
      expect(matchesProgramProgressSource({ ...context, ...change }, context)).toBe(false);
    }
  });

  it("keeps target agreement controls unavailable to non-managing members", () => {
    const html = renderToStaticMarkup(createElement(ProgramProgressPanel, { programId: "program-a", residents: [], canManage: false, onRefresh: () => {} }));
    expect(html).toContain("No residents are currently visible in this program");
    expect(html).not.toContain("Save agreed target");
    expect(html).not.toContain("Approve this source version");
  });
});

describe("agreed target availability and provenance", () => {
  it("distinguishes loading and unavailable targets from a confirmed empty list", () => {
    const loading = renderToStaticMarkup(createElement(AgreedTargetList, { targets: [], loading: true, loaded: false }));
    const unavailable = renderToStaticMarkup(createElement(AgreedTargetList, { targets: [], loading: false, loaded: false }));
    const empty = renderToStaticMarkup(createElement(AgreedTargetList, { targets: [], loading: false, loaded: true }));
    expect(loading).toContain("Loading agreed targets");
    expect(loading).not.toContain("No agreed targets");
    expect(unavailable).toContain("Agreed targets are unavailable");
    expect(unavailable).not.toContain("No agreed targets");
    expect(empty).toContain("No agreed targets have been recorded");
  });

  it("shows agreement and effective dates and identifies future targets as scheduled", () => {
    const target = { id: "target-a", procedureDefinitionId: "procedure-a", procedureName: "Example procedure", target: 12, version: 2, agreedAt: "2026-10-01T12:00:00Z", effectiveAt: "2026-11-01T00:00:00Z" };
    const html = renderToStaticMarkup(createElement(AgreedTargetList, { targets: [target], loading: false, loaded: true, now: Date.parse("2026-10-21T12:00:00Z") }));
    expect(html).toContain("agreed 2026-10-01");
    expect(html).toContain("effective 2026-11-01");
    expect(html).toContain("Scheduled");
  });
});
