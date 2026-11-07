import type { MeetingConfig } from './types';

/**
 * University of Manitoba Urology, transcribed from the signed July 2025
 * letter. Seeded into ProgramMeetingConfig the first time a programme opens
 * a meeting, so Dr. Nayak's first record matches his paper without setup.
 *
 * One deliberate departure: the paper letter lists "Drug Prescribing Safety"
 * twice in the Core Curriculum table, which is a transcription error in the
 * original. It appears once here, because two identical checkboxes cannot be
 * told apart in the UI and cannot have distinct ids.
 */
export const MANITOBA_UROLOGY_CONFIG: MeetingConfig = {
  introText:
    'This letter is to document the content of our semi-annual Program Director ' +
    'and Resident 1:1 meeting. We reviewed your progress in training, including ' +
    'your exam results. We discussed goals moving forward to optimize your ' +
    'training experience as well as areas for improvement. The opportunity to ' +
    'raise concerns of the program was provided. Career planning was reviewed. ' +
    'The following points summarize the main points of our discussion which we ' +
    'will revisit at our next meeting.',

  letterhead: {
    lines: [
      'Max Rady College of Medicine',
      'Department of Surgery',
      'Urology Residency Program',
      'University of Manitoba',
      'AE 105 - 671 William Ave',
      'Winnipeg, Manitoba, Canada',
      'Email: urology@umanitoba.ca',
    ],
  },

  checklists: [
    {
      id: 'core_curriculum',
      title: 'Core Curriculum',
      items: [
        { id: 'conflict_management',     label: 'Conflict Management in Medicine', targetYear: 'PGY1' },
        { id: 'professional_boundaries', label: 'Professional Boundaries in the Physician-Patient Relationship', targetYear: 'PGY1' },
        { id: 'foundations_prof',        label: 'Foundations of Professionalism (formerly RTLE)', targetYear: 'PGY1' },
        { id: 'diversity_care',          label: 'Diversity - Offering Culturally Proficient Care', targetYear: 'PGY1' },
        { id: 'drug_prescribing_safety', label: 'Drug Prescribing Safety', targetYear: 'PGY1' },
        { id: 'teaching_development',    label: 'Teaching Development Program', targetYear: 'PGY1' },
        { id: 'diversity_med_ed',        label: 'Diversity in Medical Education', targetYear: 'PGY1' },
        { id: 'resource_stewardship',    label: 'Resource Stewardship', targetYear: 'PGY1' },
        { id: 'cmpa_seminar',            label: 'CMPA Seminar', targetYear: 'PGY1' },
        { id: 'practice_management',     label: 'Practice Management', targetYear: 'PGY 3-5' },
      ],
    },
    {
      id: 'qi_modules',
      title: 'QI Modules',
      items: [
        { id: 'qi101', label: 'QI 101: Introduction to Health Care Improvement' },
        { id: 'qi102', label: 'QI 102: How to Improve with the Model for Improvement' },
        { id: 'qi103', label: 'QI 103: Testing and Measuring Changes with PDSA Cycles' },
        { id: 'qi104', label: 'QI 104: Interpreting Data: Run Charts, Control Charts, and other Measurement Tools' },
        { id: 'ps101', label: 'PS 101: Introduction to Patient Safety' },
        { id: 'ps102', label: 'PS 102: From Error to Harm' },
        { id: 'ps103', label: 'PS 103: Human Factors and Safety' },
        { id: 'ps104', label: 'PS 104: Teamwork and Communication' },
        { id: 'ps105', label: 'PS 105: Responding to Adverse Events' },
        { id: 'ps201', label: 'PS 201: Root Cause Analyses and Actions' },
      ],
    },
  ],

  scoreTables: [
    {
      id: 'mini_quest',
      title: 'Mini-QUEST Results',
      columns: [
        { id: 'overall', label: 'Overall' },
        { id: 'mcq',     label: 'MCQ' },
        { id: 'osce',    label: 'OSCE' },
        { id: 'vr',      label: 'VR' },
        { id: 'rank',    label: 'Rank' },
      ],
    },
    {
      id: 'aua',
      title: 'AUA In-Service Exam',
      columns: [{ id: 'percentile', label: 'Percentile' }],
    },
  ],

  certifications: [
    { id: 'acls',                  label: 'ACLS' },
    { id: 'atls',                  label: 'ATLS' },
    { id: 'procedural_sedation',   label: 'Procedural Sedation' },
    { id: 'principles_of_surgery', label: 'Principles of Surgery' },
  ],
};
