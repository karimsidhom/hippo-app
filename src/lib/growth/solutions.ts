import { BarChart3, ClipboardCheck, FileCheck2, Gauge, ShieldCheck, Users } from "lucide-react";

export type Solution = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  heroCopy: string;
  asideMetric: string;
  asideCopy: string;
  residentCta: boolean;
  features: { title: string; copy: string; icon: typeof BarChart3 }[];
  faqs: { question: string; answer: string }[];
};

export const solutions: Record<string, Solution> = {
  "surgical-case-log": {
    slug: "surgical-case-log",
    title: "A surgical case log residents can keep current",
    description: "Free surgical case logging for residents and fellows, with procedure volume, operative role, learning curves, EPA tracking, and exportable portfolios.",
    eyebrow: "Free surgical case log",
    heroCopy: "Capture cases quickly, see your operative growth, and export a clean training record without maintaining another spreadsheet. Hippo stays free for individual residents and fellows.",
    asideMetric: "$0 for residents",
    asideCopy: "Unlimited case logging, analytics, milestones, EPA workflows, and portfolio exports without third-party advertising.",
    residentCta: true,
    features: [
      { title: "Fast case capture", copy: "Record the procedure, approach, role, supervisor, and learning point while the case is fresh.", icon: ClipboardCheck },
      { title: "Useful progress views", copy: "See procedure volume, autonomy, activity, and learning curves instead of a flat list of entries.", icon: BarChart3 },
      { title: "Portable evidence", copy: "Create polished PDF and spreadsheet exports for reviews, applications, and your own records.", icon: FileCheck2 },
    ],
    faqs: [
      { question: "Is Hippo really free for residents?", answer: "Yes. Individual residents and fellows can log cases, track progress, and export their records without a subscription. Programs pay only for institutional administration, cohort oversight, and reporting." },
      { question: "Does a program own my personal logbook?", answer: "No. Residents retain their personal account and record. Program visibility is governed by program membership, agreed workflows, roles, and the information the resident shares." },
      { question: "Can I export my cases?", answer: "Yes. Hippo supports resident portfolio exports so your training record remains useful outside the app." },
      { question: "Should patient names be entered?", answer: "No. Hippo's surgical training workflow is designed around de-identified case metadata rather than patient names or direct identifiers." },
    ],
  },
  "epa-tracking": {
    slug: "epa-tracking",
    title: "EPA tracking that shows where completion stalls",
    description: "Track EPA requests, faculty sign-off, completion gaps, resident activity, and competence committee readiness in one residency-program workflow.",
    eyebrow: "Entrustable professional activities",
    heroCopy: "Follow each observation from resident request through faculty feedback and committee evidence. Program leaders see actionable backlogs without chasing separate forms and spreadsheets.",
    asideMetric: "Request to decision",
    asideCopy: "One traceable workflow for residents, faculty, coordinators, program directors, and competence committees.",
    residentCta: false,
    features: [
      { title: "Visible status", copy: "Separate requested, pending, returned, signed, and committee-ready observations so the next action is clear.", icon: Gauge },
      { title: "Faculty workflow", copy: "Route focused sign-off requests to supervisors and surface the oldest outstanding items.", icon: Users },
      { title: "Cohort gaps", copy: "Identify low-exposure EPAs, silent residents, and missing evidence before stage reviews.", icon: BarChart3 },
    ],
    faqs: [
      { question: "Can Hippo support local EPA frameworks?", answer: "Yes. The program workflow can be configured around specialty and program requirements rather than forcing every institution into one generic list." },
      { question: "Do faculty need a complicated dashboard?", answer: "No. Faculty receive a focused sign-off workflow, while program-wide oversight remains with authorized leadership roles." },
      { question: "What does a program director see?", answer: "Program directors see adoption, case activity, EPA completion, gaps, faculty backlogs, alerts, and committee preparation signals in the Pilot Command Center." },
      { question: "Can we test it before procurement?", answer: "Yes. Hippo uses a guided 30-day institutional pilot with agreed measures and an end-of-pilot executive report." },
    ],
  },
  "residency-program-dashboard": {
    slug: "residency-program-dashboard",
    title: "A residency program dashboard built for weekly decisions",
    description: "A program director command center for resident adoption, case volume, EPA completion, training gaps, alerts, committee preparation, and pilot outcomes.",
    eyebrow: "Program director command center",
    heroCopy: "Replace scattered status checks with a concise view of what changed, who needs support, and which program actions are due this week.",
    asideMetric: "One weekly signal",
    asideCopy: "Adoption, case volume, EPA completion, gaps, alerts, committee readiness, and accreditation exports in one place.",
    residentCta: false,
    features: [
      { title: "Adoption", copy: "See invited, activated, and active residents so implementation problems are visible early.", icon: Users },
      { title: "Training signals", copy: "Review volume, autonomy, EPA coverage, activity recency, and persistent cohort gaps.", icon: BarChart3 },
      { title: "Action queue", copy: "Turn silent residents, sign-off backlogs, and upcoming reviews into named program actions.", icon: ClipboardCheck },
    ],
    faqs: [
      { question: "Is this resident surveillance?", answer: "It should not be. Hippo separates the resident-owned record from role-based program reporting and makes the visibility rules explicit during onboarding." },
      { question: "Can coordinators use it without seeing everything?", answer: "Yes. Program roles distinguish roster and scheduling administration from detailed educational oversight." },
      { question: "How quickly can a pilot start?", answer: "Once the roster, roles, framework, and agreement are ready, the guided onboarding workflow establishes a baseline and launch plan for a 30-day pilot." },
      { question: "What happens at the end?", answer: "The program receives an executive report covering adoption, workflow activity, gaps, outcomes, outstanding work, and a clear continuation recommendation." },
    ],
  },
  "accreditation-reporting": {
    slug: "accreditation-reporting",
    title: "Accreditation reporting generated from routine program work",
    description: "Create accreditation-format residency reports for participation, case exposure, EPA coverage, faculty response, competence committee decisions, and action closure.",
    eyebrow: "Accreditation-ready evidence",
    heroCopy: "Build an organized evidence trail throughout the year, then export date-bounded reports with clear definitions instead of reconstructing activity before a review.",
    asideMetric: "Eight report formats",
    asideCopy: "Structured exports for cohort activity, EPA evidence, training gaps, faculty workflow, rotations, and committee decisions.",
    residentCta: false,
    features: [
      { title: "Reproducible evidence", copy: "Each report carries its date range, population, status definitions, and generation time.", icon: FileCheck2 },
      { title: "Role-aware access", copy: "Program leaders, coordinators, committee members, faculty, and residents receive views suited to their work.", icon: ShieldCheck },
      { title: "Live and formal views", copy: "Use operational signals during the year and stable exports for formal review from the same source data.", icon: BarChart3 },
    ],
    faqs: [
      { question: "Does Hippo guarantee accreditation?", answer: "No software can guarantee an accreditation outcome. Hippo organizes program evidence and reporting so leaders can review completeness and address gaps." },
      { question: "Can reports be exported?", answer: "Yes. Hippo provides explicit accreditation-format exports alongside the live command center and pilot report." },
      { question: "Can a report be reproduced later?", answer: "Reports are designed to state the included period, cohort, definitions, and generation timestamp so the result remains interpretable." },
      { question: "How is resident privacy handled?", answer: "The institutional workflow uses role-based access, agreed program scope, and privacy documentation. Patient identifiers should not be entered into the surgical training record." },
    ],
  },
};
