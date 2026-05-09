// ---------------------------------------------------------------------------
// Canonical assessment-form starter templates.
//
// Programs can pick one of these to start with and customise from
// there. They embed the RCPSC O-SCORE-flavoured Likert vocabulary
// and the standard Mini-CEX / DOPS scoring grid so the rubric makes
// sense even without further editing.
// ---------------------------------------------------------------------------

import type { FormSchema } from "./types";

export const PRESET_MINI_CEX: FormSchema = {
  version: 1,
  intro:
    "Mini-CEX — observed clinical encounter. Rate each domain on a 1-9 scale; 1-3 unsatisfactory, 4-6 satisfactory, 7-9 superior.",
  sections: [
    {
      id: "context",
      title: "Encounter context",
      fields: [
        { id: "setting", type: "single_choice", label: "Setting", required: true,
          options: [
            { id: "clinic", label: "Outpatient clinic" },
            { id: "ward",   label: "Ward / inpatient" },
            { id: "ed",     label: "Emergency department" },
            { id: "or",     label: "Operating room" },
            { id: "other",  label: "Other" },
          ] },
        { id: "complexity", type: "single_choice", label: "Case complexity", required: true,
          options: [
            { id: "low", label: "Low" },
            { id: "moderate", label: "Moderate" },
            { id: "high", label: "High" },
          ] },
        { id: "summary", type: "long_text", label: "Brief case summary",
          placeholder: "One paragraph — patient context (no identifiers), focus of the assessment.", maxLength: 1500 },
      ],
    },
    {
      id: "rubric",
      title: "Domain ratings (1-9)",
      description: "Score each domain you observed. Leave blank if not applicable.",
      fields: [
        { id: "history", type: "likert", label: "Medical interviewing skills", scale: 9, minLabel: "Unsat", maxLabel: "Superior" },
        { id: "exam",    type: "likert", label: "Physical examination skills", scale: 9, minLabel: "Unsat", maxLabel: "Superior" },
        { id: "professionalism", type: "likert", label: "Humanism / professionalism", scale: 9, minLabel: "Unsat", maxLabel: "Superior" },
        { id: "judgement", type: "likert", label: "Clinical judgement", scale: 9, minLabel: "Unsat", maxLabel: "Superior" },
        { id: "counselling", type: "likert", label: "Counselling skills", scale: 9, minLabel: "Unsat", maxLabel: "Superior" },
        { id: "organisation", type: "likert", label: "Organisation / efficiency", scale: 9, minLabel: "Unsat", maxLabel: "Superior" },
        { id: "competence", type: "likert", label: "Overall clinical competence", scale: 9, minLabel: "Unsat", maxLabel: "Superior", weight: 2 },
      ],
    },
    {
      id: "narrative",
      title: "Narrative feedback",
      fields: [
        { id: "strengths", type: "long_text", label: "Strengths", required: true, maxLength: 1500 },
        { id: "growth",    type: "long_text", label: "Areas for growth", required: true, maxLength: 1500 },
      ],
    },
    {
      id: "attestation",
      fields: [
        { id: "sign", type: "signature", label: "Assessor attestation",
          attestation: "I observed this encounter directly and have discussed the feedback with the trainee." },
      ],
    },
  ],
};

export const PRESET_DOPS: FormSchema = {
  version: 1,
  intro:
    "DOPS — Direct Observation of Procedural Skills. Rate the trainee's performance on each step using the O-SCORE 1-5 entrustment scale.",
  sections: [
    {
      id: "context",
      title: "Procedure context",
      fields: [
        { id: "procedureName", type: "short_text", label: "Procedure", required: true,
          placeholder: "e.g. Ureteric stent insertion" },
        { id: "setting", type: "single_choice", label: "Setting", required: true,
          options: [
            { id: "or", label: "Operating room" },
            { id: "endo", label: "Endoscopy / cysto suite" },
            { id: "bedside", label: "Bedside" },
            { id: "sim", label: "Simulation" },
          ] },
        { id: "complexity", type: "single_choice", label: "Case complexity",
          options: [
            { id: "low", label: "Low" },
            { id: "moderate", label: "Moderate" },
            { id: "high", label: "High" },
          ] },
      ],
    },
    {
      id: "oscore",
      title: "O-SCORE entrustment (1-5)",
      description: "1 — I had to do; 2 — I had to talk through; 3 — I had to prompt; 4 — Needed only minimal supervision; 5 — Independent.",
      fields: [
        { id: "preop", type: "likert", label: "Pre-procedural planning", scale: 5, minLabel: "I had to do", maxLabel: "Independent" },
        { id: "consent", type: "likert", label: "Informed consent + counselling", scale: 5, minLabel: "I had to do", maxLabel: "Independent" },
        { id: "prep", type: "likert", label: "Patient prep + positioning", scale: 5, minLabel: "I had to do", maxLabel: "Independent" },
        { id: "technical", type: "likert", label: "Technical conduct of the procedure", scale: 5, minLabel: "I had to do", maxLabel: "Independent", weight: 3 },
        { id: "decisions", type: "likert", label: "Intraoperative decision-making", scale: 5, minLabel: "I had to do", maxLabel: "Independent", weight: 2 },
        { id: "team", type: "likert", label: "Team communication + safety", scale: 5, minLabel: "I had to do", maxLabel: "Independent" },
        { id: "postop", type: "likert", label: "Post-procedure care", scale: 5, minLabel: "I had to do", maxLabel: "Independent" },
      ],
    },
    {
      id: "narrative",
      title: "Narrative feedback",
      fields: [
        { id: "strengths", type: "long_text", label: "What went well", required: true, maxLength: 1500 },
        { id: "growth", type: "long_text", label: "Areas for growth", required: true, maxLength: 1500 },
        { id: "ready", type: "single_choice", label: "Ready for next entrustment level?",
          options: [
            { id: "yes", label: "Yes — escalate", score: 1 },
            { id: "soon", label: "Likely soon", score: 0.5 },
            { id: "not-yet", label: "Not yet — repeat at this level" },
          ] },
      ],
    },
    {
      id: "attestation",
      fields: [
        { id: "sign", type: "signature", label: "Assessor attestation",
          attestation: "I directly observed this procedure and discussed feedback with the trainee." },
      ],
    },
  ],
};

export const PRESET_COACHING: FormSchema = {
  version: 1,
  intro:
    "Longitudinal coaching note — captures a coaching conversation rather than a procedural observation.",
  sections: [
    {
      id: "topic",
      title: "Coaching topic",
      fields: [
        { id: "topic", type: "short_text", label: "Topic / theme", required: true,
          placeholder: "e.g. OR efficiency, communication with families" },
        { id: "trigger", type: "long_text", label: "What triggered this conversation?", maxLength: 1500 },
      ],
    },
    {
      id: "goals",
      title: "Goals + plan",
      fields: [
        { id: "goal", type: "long_text", label: "Trainee goal", required: true, maxLength: 1500 },
        { id: "plan", type: "long_text", label: "Plan to get there", required: true, maxLength: 1500,
          description: "Specific, observable, time-bound." },
        { id: "checkin", type: "short_text", label: "Next check-in date", placeholder: "e.g. 2 weeks" },
      ],
    },
    {
      id: "wellness",
      title: "Wellness check (optional)",
      fields: [
        { id: "wellness", type: "single_choice", label: "How is the trainee doing overall?",
          options: [
            { id: "thriving",  label: "Thriving" },
            { id: "ok",        label: "Doing OK" },
            { id: "stretched", label: "Stretched but coping" },
            { id: "concerned", label: "I'm concerned" },
          ] },
      ],
    },
    {
      id: "attestation",
      fields: [
        { id: "sign", type: "signature", label: "Coach attestation" },
      ],
    },
  ],
};

export const PRESETS = [
  { id: "mini-cex",  name: "Mini-CEX",                category: "MINI_CEX" as const,  schema: PRESET_MINI_CEX  },
  { id: "dops",      name: "DOPS — Procedural skills", category: "DOPS"     as const,  schema: PRESET_DOPS      },
  { id: "coaching",  name: "Longitudinal coaching",   category: "COACHING" as const,  schema: PRESET_COACHING  },
];
