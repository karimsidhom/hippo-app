/* ═══════════════════════════════════════════════════════════════════════════
   DESIGN PREVIEW — development-only fixture state
   ───────────────────────────────────────────────────────────────────────────
   Lets the signed-in surfaces (dashboard, cases, analytics, profile …) render
   locally without a Supabase session, so design work can be reviewed at
   390 / 768 / 1280 before it ships.

   Gated twice:
     1. NODE_ENV must not be "production"  — never reachable on a deploy.
     2. NEXT_PUBLIC_DESIGN_PREVIEW === "1" — opt-in per shell session.

   Run it with:  NEXT_PUBLIC_DESIGN_PREVIEW=1 npm run dev

   Content is de-identified and synthetic: no real patient, attending, or
   colleague appears here.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { CaseLog, Milestone, Profile } from '@/lib/types';

export const DESIGN_PREVIEW =
  process.env.NODE_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_DESIGN_PREVIEW === '1';

const UID = 'preview-user';

export const previewUser = {
  id: UID,
  name: 'Alex Mercer',
  email: 'preview@hippomedicine.com',
};

export const previewProfile: Profile = {
  // Not on the Profile type, but the shadow-record gate reads it — set so the
  // first-use disclosure doesn't block every preview page load.
  acknowledgedShadowRecordAt: new Date('2024-01-01').toISOString(),
  id: 'preview-profile',
  userId: UID,
  roleType: 'RESIDENT',
  specialty: 'Urology',
  subspecialty: 'Endourology',
  institution: 'St. Boniface Hospital',
  city: 'Winnipeg',
  trainingCountry: 'Canada',
  pgyYear: 4,
  trainingYearLabel: 'PGY-4',
  publicProfile: true,
  allowFriendRequests: true,
  allowLeaderboardParticipation: true,
  allowBenchmarkSharing: true,
  allowWeeklyDigest: true,
  bio: 'Endourology and andrology. Building a logbook worth reading back.',
  onboardingCompleted: true,
  createdAt: new Date('2023-07-01'),
  updatedAt: new Date(),
} as Profile & { acknowledgedShadowRecordAt: string };

/** n days before today, at a plausible OR start time. */
function daysAgo(n: number, hour = 8): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

type Seed = Partial<CaseLog> & { procedureName: string; day: number };

const SEEDS: Seed[] = [
  { day: 0,   procedureName: 'Ureteroscopy + Laser Lithotripsy', procedureCategory: 'Stone Disease',       surgicalApproach: 'ENDOSCOPIC',    role: 'Primary Surgeon', autonomyLevel: 'INDEPENDENT',        difficultyScore: 3, operativeDurationMinutes: 54,  attendingLabel: 'Dr. Lindsay', institutionSite: 'Health Sciences Centre', diagnosisCategory: 'Distal ureteric calculus', outcomeCategory: 'UNCOMPLICATED', tags: ['stones', 'laser'], reflection: 'Basketed in one pass. Next time I set the laser to dusting earlier — fragment chasing cost me ten minutes.' },
  { day: 1,   procedureName: 'Robotic Partial Nephrectomy',      procedureCategory: 'Oncology',            surgicalApproach: 'ROBOTIC',       role: 'Console Surgeon', autonomyLevel: 'SUPERVISOR_PRESENT', difficultyScore: 5, operativeDurationMinutes: 186, consoleTimeMinutes: 142, dockingTimeMinutes: 18, attendingLabel: 'Dr. Ruzhynsky', institutionSite: 'Grace Hospital', diagnosisCategory: 'cT1a renal mass', outcomeCategory: 'UNCOMPLICATED', tags: ['renal', 'robotic'], notes: 'Warm ischaemia 17 min. Hilar clamp off before renorrhaphy completed.' },
  { day: 2,   procedureName: 'TURBT',                             procedureCategory: 'Oncology',            surgicalApproach: 'ENDOSCOPIC',    role: 'Primary Surgeon', autonomyLevel: 'INDEPENDENT',        difficultyScore: 2, operativeDurationMinutes: 38,  attendingLabel: 'Dr. Patel',   institutionSite: 'Health Sciences Centre', diagnosisCategory: 'Bladder tumour', outcomeCategory: 'UNCOMPLICATED', tags: ['bladder'] },
  { day: 4,   procedureName: 'HoLEP',                             procedureCategory: 'BPH',                 surgicalApproach: 'ENDOSCOPIC',    role: 'First Assistant', autonomyLevel: 'ASSISTANT',          difficultyScore: 4, operativeDurationMinutes: 121, attendingLabel: 'Dr. Lindsay', institutionSite: 'Grace Hospital', diagnosisCategory: 'BPH, 140 cc', outcomeCategory: 'UNCOMPLICATED', tags: ['bph', 'holep'] },
  { day: 6,   procedureName: 'Inflatable Penile Prosthesis',      procedureCategory: 'Andrology',           surgicalApproach: 'OPEN',          role: 'Primary Surgeon', autonomyLevel: 'SUPERVISOR_PRESENT', difficultyScore: 4, operativeDurationMinutes: 96,  attendingLabel: 'Dr. Flannigan', institutionSite: 'Vancouver General', diagnosisCategory: 'Refractory ED', outcomeCategory: 'UNCOMPLICATED', tags: ['andrology', 'prosthetics'], reflection: 'Penoscrotal exposure was the whole case. Corporal measurement twice before dilating.' },
  { day: 8,   procedureName: 'PCNL',                              procedureCategory: 'Stone Disease',       surgicalApproach: 'PERCUTANEOUS',  role: 'Primary Surgeon', autonomyLevel: 'SUPERVISOR_PRESENT', difficultyScore: 5, operativeDurationMinutes: 148, attendingLabel: 'Dr. Ruzhynsky', institutionSite: 'Health Sciences Centre', diagnosisCategory: 'Staghorn calculus', outcomeCategory: 'MINOR_COMPLICATION', complicationCategory: 'BLEEDING', tags: ['stones', 'pcnl'], notes: 'Upper pole access. Transient haematuria, no transfusion.' },
  { day: 9,   procedureName: 'Cystoscopy + Stent Removal',        procedureCategory: 'Endoscopy',           surgicalApproach: 'ENDOSCOPIC',    role: 'Primary Surgeon', autonomyLevel: 'INDEPENDENT',        difficultyScore: 1, operativeDurationMinutes: 11,  attendingLabel: 'Dr. Patel', institutionSite: 'Health Sciences Centre', outcomeCategory: 'UNCOMPLICATED', tags: ['clinic'] },
  { day: 11,  procedureName: 'Robotic Radical Prostatectomy',     procedureCategory: 'Oncology',            surgicalApproach: 'ROBOTIC',       role: 'Console Surgeon', autonomyLevel: 'SUPERVISOR_PRESENT', difficultyScore: 5, operativeDurationMinutes: 212, consoleTimeMinutes: 168, dockingTimeMinutes: 14, attendingLabel: 'Dr. Ruzhynsky', institutionSite: 'Grace Hospital', diagnosisCategory: 'cT2a prostate cancer', outcomeCategory: 'UNCOMPLICATED', tags: ['prostate', 'robotic'] },
  { day: 13,  procedureName: 'Vasectomy Reversal (VV)',           procedureCategory: 'Andrology',           surgicalApproach: 'OPEN',          role: 'Primary Surgeon', autonomyLevel: 'TEACHING',           difficultyScore: 4, operativeDurationMinutes: 134, attendingLabel: 'Dr. Flannigan', institutionSite: 'Cambie Surgery Centre', diagnosisCategory: 'Post-vasectomy obstruction', outcomeCategory: 'UNCOMPLICATED', tags: ['andrology', 'microsurgery'] },
  { day: 15,  procedureName: 'Laparoscopic Nephrectomy',          procedureCategory: 'Oncology',            surgicalApproach: 'LAPAROSCOPIC',  role: 'First Assistant', autonomyLevel: 'ASSISTANT',          difficultyScore: 4, operativeDurationMinutes: 164, attendingLabel: 'Dr. Patel', institutionSite: 'Health Sciences Centre', diagnosisCategory: 'Non-functioning kidney', outcomeCategory: 'UNCOMPLICATED', tags: ['renal'] },
  { day: 18,  procedureName: 'Ureteroscopy + Laser Lithotripsy',  procedureCategory: 'Stone Disease',       surgicalApproach: 'ENDOSCOPIC',    role: 'Primary Surgeon', autonomyLevel: 'INDEPENDENT',        difficultyScore: 3, operativeDurationMinutes: 61,  attendingLabel: 'Dr. Lindsay', institutionSite: 'Grace Hospital', diagnosisCategory: 'Proximal ureteric calculus', outcomeCategory: 'UNCOMPLICATED', tags: ['stones'] },
  { day: 21,  procedureName: 'Artificial Urinary Sphincter',      procedureCategory: 'Reconstruction',      surgicalApproach: 'OPEN',          role: 'First Assistant', autonomyLevel: 'ASSISTANT',          difficultyScore: 4, operativeDurationMinutes: 108, attendingLabel: 'Dr. Flannigan', institutionSite: 'Vancouver General', diagnosisCategory: 'Post-prostatectomy incontinence', outcomeCategory: 'UNCOMPLICATED', tags: ['reconstruction'] },
  { day: 24,  procedureName: 'TURP',                              procedureCategory: 'BPH',                 surgicalApproach: 'ENDOSCOPIC',    role: 'Primary Surgeon', autonomyLevel: 'INDEPENDENT',        difficultyScore: 3, operativeDurationMinutes: 72,  attendingLabel: 'Dr. Lindsay', institutionSite: 'St. Boniface Hospital', diagnosisCategory: 'BPH with retention', outcomeCategory: 'UNCOMPLICATED', tags: ['bph'] },
  { day: 28,  procedureName: 'Orchiopexy',                        procedureCategory: 'Paediatrics',         surgicalApproach: 'OPEN',          role: 'Primary Surgeon', autonomyLevel: 'SUPERVISOR_PRESENT', difficultyScore: 2, operativeDurationMinutes: 44,  attendingLabel: 'Dr. Patel', institutionSite: 'Health Sciences Centre', diagnosisCategory: 'Undescended testis', outcomeCategory: 'UNCOMPLICATED', tags: ['paeds'] },
  { day: 33,  procedureName: 'Robotic Pyeloplasty',               procedureCategory: 'Reconstruction',      surgicalApproach: 'ROBOTIC',       role: 'Console Surgeon', autonomyLevel: 'SUPERVISOR_PRESENT', difficultyScore: 5, operativeDurationMinutes: 174, consoleTimeMinutes: 131, dockingTimeMinutes: 16, attendingLabel: 'Dr. Ruzhynsky', institutionSite: 'Grace Hospital', diagnosisCategory: 'UPJ obstruction', outcomeCategory: 'UNCOMPLICATED', tags: ['reconstruction', 'robotic'] },
  { day: 39,  procedureName: 'Scrotal Exploration',               procedureCategory: 'Emergency',           surgicalApproach: 'OPEN',          role: 'Primary Surgeon', autonomyLevel: 'INDEPENDENT',        difficultyScore: 3, operativeDurationMinutes: 41,  attendingLabel: 'On call', institutionSite: 'Health Sciences Centre', diagnosisCategory: 'Suspected torsion', outcomeCategory: 'UNCOMPLICATED', tags: ['emergency'] },
  { day: 46,  procedureName: 'Ureteric Stent Insertion',          procedureCategory: 'Emergency',           surgicalApproach: 'ENDOSCOPIC',    role: 'Primary Surgeon', autonomyLevel: 'INDEPENDENT',        difficultyScore: 2, operativeDurationMinutes: 23,  attendingLabel: 'On call', institutionSite: 'St. Boniface Hospital', diagnosisCategory: 'Obstructed infected system', outcomeCategory: 'UNCOMPLICATED', tags: ['emergency', 'stones'] },
  { day: 54,  procedureName: 'Radical Cystectomy + Ileal Conduit', procedureCategory: 'Oncology',           surgicalApproach: 'OPEN',          role: 'First Assistant', autonomyLevel: 'ASSISTANT',          difficultyScore: 5, operativeDurationMinutes: 384, attendingLabel: 'Dr. Patel', institutionSite: 'Health Sciences Centre', diagnosisCategory: 'MIBC', outcomeCategory: 'MINOR_COMPLICATION', complicationCategory: 'ILEUS', tags: ['bladder', 'major'] },
  { day: 61,  procedureName: 'Hydrocelectomy',                    procedureCategory: 'Andrology',           surgicalApproach: 'OPEN',          role: 'Primary Surgeon', autonomyLevel: 'INDEPENDENT',        difficultyScore: 2, operativeDurationMinutes: 47,  attendingLabel: 'Dr. Flannigan', institutionSite: 'Cambie Surgery Centre', outcomeCategory: 'UNCOMPLICATED', tags: ['andrology'] },
  { day: 70,  procedureName: 'Ureteroscopy + Laser Lithotripsy',  procedureCategory: 'Stone Disease',       surgicalApproach: 'ENDOSCOPIC',    role: 'Primary Surgeon', autonomyLevel: 'INDEPENDENT',        difficultyScore: 3, operativeDurationMinutes: 58,  attendingLabel: 'Dr. Lindsay', institutionSite: 'Grace Hospital', outcomeCategory: 'UNCOMPLICATED', tags: ['stones'] },
];

export const previewCases: CaseLog[] = SEEDS.map((s, i) => ({
  id: `preview-case-${i}`,
  userId: UID,
  specialtyId: 'urology',
  specialtyName: 'Urology',
  procedureDefinitionId: null,
  procedureName: s.procedureName,
  procedureCategory: s.procedureCategory ?? null,
  surgicalApproach: s.surgicalApproach ?? 'OPEN',
  role: s.role ?? 'Primary Surgeon',
  autonomyLevel: s.autonomyLevel ?? 'INDEPENDENT',
  difficultyScore: s.difficultyScore ?? 3,
  operativeDurationMinutes: s.operativeDurationMinutes ?? null,
  consoleTimeMinutes: s.consoleTimeMinutes ?? null,
  dockingTimeMinutes: s.dockingTimeMinutes ?? null,
  attendingLabel: s.attendingLabel ?? null,
  institutionSite: s.institutionSite ?? null,
  patientAgeBin: s.patientAgeBin ?? 'AGE_46_60',
  diagnosisCategory: s.diagnosisCategory ?? null,
  outcomeCategory: s.outcomeCategory ?? 'UNCOMPLICATED',
  complicationCategory: s.complicationCategory ?? 'NONE',
  conversionOccurred: false,
  notes: s.notes ?? null,
  tags: s.tags ?? [],
  reflection: s.reflection ?? null,
  isPublic: false,
  benchmarkOptIn: true,
  caseDate: daysAgo(s.day),
  createdAt: daysAgo(s.day, 18),
  updatedAt: daysAgo(s.day, 18),
}));

export const previewMilestones: Milestone[] = [
  { id: 'pm-1', userId: UID, type: 'TOTAL_CASES',       procedureName: null,                                value: 20,  achievedAt: daysAgo(0),  badgeKey: 'total_10' },
  { id: 'pm-2', userId: UID, type: 'INDEPENDENT_CASES', procedureName: null,                                value: 10,  achievedAt: daysAgo(9),  badgeKey: 'first_independent' },
  { id: 'pm-3', userId: UID, type: 'PROCEDURE_COUNT',   procedureName: 'Ureteroscopy + Laser Lithotripsy',  value: 4,   achievedAt: daysAgo(18), badgeKey: 'proc_ureteroscopy_5' },
  { id: 'pm-4', userId: UID, type: 'STREAK',            procedureName: null,                                value: 6,   achievedAt: daysAgo(2),  badgeKey: 'streak_7' },
];
