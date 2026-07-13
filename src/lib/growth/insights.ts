export type InsightSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type Insight = {
  slug: string;
  title: string;
  description: string;
  audience: "Residents" | "Program leaders";
  publishedAt: string;
  readMinutes: number;
  sections: InsightSection[];
};

export const insights: Insight[] = [
  {
    slug: "surgical-case-log-workflow-residents-keep-using",
    title: "A surgical case-log workflow residents keep using",
    description: "A practical framework for making case logging fast, consistent, and useful throughout residency.",
    audience: "Residents",
    publishedAt: "2026-07-12T12:00:00.000Z",
    readMinutes: 5,
    sections: [
      {
        heading: "The best log is the one completed while the case is still fresh",
        paragraphs: [
          "Case logs become unreliable when residents are expected to reconstruct weeks of activity at once. A durable workflow reduces the entry to the few details that matter, makes it available on a phone, and leaves reflection or portfolio cleanup for a quieter moment.",
          "A useful minimum record includes the procedure, date, operative role, approach, supervisor, and one learning point. Programs can add required fields, but every extra step should earn its place.",
        ],
      },
      {
        heading: "Use the record twice",
        paragraphs: [
          "Residents are more likely to maintain a log when it gives something back. The same entries should power learning curves, identify experience gaps, support EPA requests, and produce an export for meetings or applications.",
        ],
        bullets: [
          "Capture the case in under a minute.",
          "Review procedure volume and autonomy weekly.",
          "Use gaps to guide the next rotation conversation.",
          "Export a clean portfolio without rebuilding a spreadsheet.",
        ],
      },
      {
        heading: "Keep personal ownership clear",
        paragraphs: [
          "A resident should retain access to their own training record. Program reporting can use agreed cohort information without turning the personal logbook into an institutional surveillance tool. Clear boundaries improve trust and adoption.",
        ],
      },
    ],
  },
  {
    slug: "epa-tracking-from-request-to-completion",
    title: "EPA tracking from request to completion",
    description: "How programs can see where EPA observations stall and improve completion without adding coordinator work.",
    audience: "Program leaders",
    publishedAt: "2026-07-12T12:05:00.000Z",
    readMinutes: 6,
    sections: [
      {
        heading: "Track the pathway, not only the final count",
        paragraphs: [
          "A completion percentage hides the operational problem. Programs need to distinguish observations that were never requested, requests awaiting faculty action, submissions returned for revision, and signed observations ready for committee review.",
          "When each stage is visible, the response becomes specific: prompt a resident, rebalance faculty assignments, or clear a sign-off backlog.",
        ],
      },
      {
        heading: "Use a small weekly signal set",
        paragraphs: ["A program director does not need another exhaustive dashboard. A short weekly brief should answer what changed and what needs attention."],
        bullets: [
          "Residents with no recent case or EPA activity.",
          "Observations waiting longest for faculty sign-off.",
          "EPAs with low exposure across the cohort.",
          "Residents approaching a stage review with missing evidence.",
        ],
      },
      {
        heading: "Close the loop at the competence committee",
        paragraphs: [
          "Committee preparation is easier when case volume, EPA status, rotation context, and prior decisions are assembled before the meeting. The outcome should then return to the same record so the next review starts with continuity rather than reconstruction.",
        ],
      },
    ],
  },
  {
    slug: "competence-committee-preparation-checklist",
    title: "A competence committee preparation checklist",
    description: "A repeatable preparation sequence for complete, reviewable resident evidence before each committee meeting.",
    audience: "Program leaders",
    publishedAt: "2026-07-20T12:00:00.000Z",
    readMinutes: 5,
    sections: [
      { heading: "Start with readiness, not documents", paragraphs: ["The first question is whether each resident has enough current evidence to support a decision. Review activity recency, EPA coverage, rotation exposure, outstanding assessments, and previous committee actions before assembling the meeting package."] },
      { heading: "Standardize the packet", paragraphs: ["A consistent packet reduces meeting time and makes decisions easier to audit."], bullets: ["Training stage and rotation context.", "Case volume and autonomy trend.", "EPA coverage, completion, and recency.", "Open gaps or overdue actions.", "Prior committee decision and follow-up."] },
      { heading: "Record the decision where the evidence lives", paragraphs: ["Capture the decision, rationale, follow-up owner, and due date in the same workflow. This protects continuity and creates a reproducible record for the next review."] },
    ],
  },
  {
    slug: "accreditation-evidence-without-spreadsheet-chasing",
    title: "Accreditation evidence without spreadsheet chasing",
    description: "How residency programs can turn routine training activity into organized accreditation evidence.",
    audience: "Program leaders",
    publishedAt: "2026-07-27T12:00:00.000Z",
    readMinutes: 6,
    sections: [
      { heading: "Evidence should be produced by the work", paragraphs: ["Accreditation preparation becomes expensive when evidence is recreated after the fact. Routine case logging, EPA completion, faculty response, committee review, and remediation follow-up should continuously populate a structured evidence trail."] },
      { heading: "Separate operational views from formal exports", paragraphs: ["Leaders need live operational signals during the year and stable, date-bounded exports for review. Both should come from the same source data so figures do not diverge."], bullets: ["Cohort participation and activity.", "EPA coverage and completion.", "Faculty response and outstanding items.", "Committee decisions and action closure.", "Rotation and procedure exposure gaps."] },
      { heading: "Preserve definitions", paragraphs: ["Every report should state its date range, included population, status definitions, and generation time. Those details make a report interpretable when it is revisited months later."] },
    ],
  },
  {
    slug: "residency-software-adoption-first-30-days",
    title: "Residency software adoption in the first 30 days",
    description: "A pilot structure that shows whether residents and faculty will actually use a new training workflow.",
    audience: "Program leaders",
    publishedAt: "2026-08-03T12:00:00.000Z",
    readMinutes: 5,
    sections: [
      { heading: "Define success before onboarding", paragraphs: ["A pilot should begin with a baseline and a few measurable outcomes: resident activation, weekly active use, case volume captured, EPA completion, and time-to-sign-off. Avoid changing the measures halfway through the month."] },
      { heading: "Make week one operational", paragraphs: ["Invite the cohort, confirm roles, map the local EPA framework, and schedule the first weekly review. Residents should be able to log a case immediately; faculty should know exactly how sign-off reaches them."], bullets: ["One accountable program owner.", "A roster with correct roles.", "A short resident launch message.", "A faculty sign-off test.", "A weekly program-director summary."] },
      { heading: "End with a decision-ready report", paragraphs: ["The final report should compare baseline to end state, identify unresolved adoption gaps, summarize value delivered, and recommend whether to continue, expand, or stop."] },
    ],
  },
  {
    slug: "find-training-gaps-before-they-become-surprises",
    title: "Find training gaps before they become surprises",
    description: "Use procedure exposure, autonomy, rotation context, and assessment recency to spot actionable gaps early.",
    audience: "Program leaders",
    publishedAt: "2026-08-10T12:00:00.000Z",
    readMinutes: 5,
    sections: [
      { heading: "Volume alone is incomplete", paragraphs: ["A resident can have high overall case volume and still lack exposure in a required procedure, setting, or level of autonomy. Gap review should combine volume with role, approach, rotation, training stage, and recent assessment evidence."] },
      { heading: "Make gaps assignable", paragraphs: ["A useful alert names the resident, the missing experience, the relevant timeframe, and a next action. Vague red flags create anxiety; assignable gaps create scheduling and supervision decisions."] },
      { heading: "Review trends, not isolated weeks", paragraphs: ["Clinical schedules vary. Use rolling windows and rotation context to avoid treating a quiet service week as a performance concern. Escalate persistent patterns, not ordinary variation."] },
    ],
  },
  {
    slug: "residency-program-pilot-scorecard",
    title: "The residency program pilot scorecard",
    description: "A compact set of measures for deciding whether a residency technology pilot created real program value.",
    audience: "Program leaders",
    publishedAt: "2026-08-17T12:00:00.000Z",
    readMinutes: 5,
    sections: [
      { heading: "Measure adoption, workflow, and outcome", paragraphs: ["A strong pilot scorecard separates whether people used the product, whether a workflow improved, and whether leadership gained a better decision. One metric cannot stand in for all three."], bullets: ["Activated residents and weekly active residents.", "Cases and EPA observations captured.", "Median time from request to sign-off.", "Open evidence gaps at baseline and close.", "Program-director actions generated and completed."] },
      { heading: "Include qualitative evidence", paragraphs: ["Brief resident, faculty, and coordinator feedback explains the numbers. Capture friction, time saved, and missing requirements with named owners for follow-up."] },
      { heading: "Make the commercial decision explicit", paragraphs: ["The end-of-pilot report should state whether success criteria were met, what implementation work remains, and the recommended subscription scope. This keeps procurement tied to demonstrated value."] },
    ],
  },
  {
    slug: "data-governance-for-residency-training-platforms",
    title: "Data governance for residency training platforms",
    description: "Questions programs should answer about ownership, access, retention, reporting, and resident trust.",
    audience: "Program leaders",
    publishedAt: "2026-08-24T12:00:00.000Z",
    readMinutes: 6,
    sections: [
      { heading: "Define the record before collecting it", paragraphs: ["Programs should distinguish a resident-owned learning record, formal assessment evidence, program administration data, and any patient-related information. Each category needs a clear purpose, access boundary, and retention rule."] },
      { heading: "Use role-based access", paragraphs: ["Program directors, coordinators, faculty, committee members, and residents do not need identical views. Access should reflect the task and avoid exposing detailed records merely because someone belongs to the institution."] },
      { heading: "Protect trust through transparency", paragraphs: ["Residents should understand what is private, what can be shared, what the program can see, and how exports work. Clear boundaries are an adoption feature as much as a privacy control."], bullets: ["Document data ownership.", "Limit patient identifiers.", "Audit important access and decisions.", "Provide export and deletion pathways.", "Review subprocessors and incident procedures."] },
    ],
  },
];

export function getPublishedInsights(now = new Date()): Insight[] {
  return insights
    .filter((insight) => new Date(insight.publishedAt) <= now)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getPublishedInsight(slug: string, now = new Date()): Insight | undefined {
  return getPublishedInsights(now).find((insight) => insight.slug === slug);
}
