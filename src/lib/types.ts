export type Role = "USER" | "ADMIN" | "PRO";
export type UserRoleType = "RESIDENT" | "FELLOW" | "STAFF" | "ATTENDING";
export type AutonomyLevel = "OBSERVER" | "ASSISTANT" | "SUPERVISOR_PRESENT" | "INDEPENDENT" | "TEACHING";
export type SurgicalApproach = "OPEN" | "LAPAROSCOPIC" | "ROBOTIC" | "ENDOSCOPIC" | "HYBRID" | "PERCUTANEOUS" | "OTHER";
export type OutcomeCategory = "UNCOMPLICATED" | "MINOR_COMPLICATION" | "MAJOR_COMPLICATION" | "REOPERATION" | "DEATH" | "UNKNOWN";
export type ComplicationCategory = "NONE" | "BLEEDING" | "INFECTION" | "ORGAN_INJURY" | "ANASTOMOTIC_LEAK" | "DVT_PE" | "ILEUS" | "CONVERSION" | "READMISSION" | "OTHER";
export type AgeBin = "UNDER_18" | "AGE_18_30" | "AGE_31_45" | "AGE_46_60" | "AGE_61_75" | "OVER_75" | "UNKNOWN";
export type FriendRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type MilestoneType = "TOTAL_CASES" | "PROCEDURE_COUNT" | "AUTONOMY_UNLOCK" | "STREAK" | "INDEPENDENT_CASES";

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  profile?: Profile | null;
}

export interface Profile {
  id: string;
  userId: string;
  roleType: UserRoleType;
  specialty: string | null;
  subspecialty: string | null;
  institution: string | null;
  city: string | null;
  trainingCountry: string | null;
  pgyYear: number | null;
  trainingYearLabel: string | null;
  publicProfile: boolean;
  allowFriendRequests: boolean;
  allowLeaderboardParticipation: boolean;
  allowBenchmarkSharing: boolean;
  bio: string | null;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Specialty {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ProcedureDefinition {
  id: string;
  specialtyId: string;
  name: string;
  category: string;
  defaultApproach: SurgicalApproach;
  cptCode: string | null;
  avgDurationMinutes: number | null;
  difficultyBase: number;
  isActive: boolean;
}

export interface CaseLog {
  id: string;
  userId: string;
  specialtyId: string | null;
  specialtyName?: string;
  procedureDefinitionId: string | null;
  procedureName: string;
  procedureCategory: string | null;
  surgicalApproach: SurgicalApproach;
  role: string;
  autonomyLevel: AutonomyLevel;
  difficultyScore: number;
  operativeDurationMinutes: number | null;
  consoleTimeMinutes: number | null;
  dockingTimeMinutes: number | null;
  attendingLabel: string | null;
  institutionSite: string | null;
  patientAgeBin: AgeBin;
  diagnosisCategory: string | null;
  outcomeCategory: OutcomeCategory;
  complicationCategory: ComplicationCategory;
  conversionOccurred: boolean;
  notes: string | null;
  tags: string[];
  reflection: string | null;
  isPublic: boolean;
  benchmarkOptIn: boolean;
  caseDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseLogInput {
  specialtyId?: string;
  specialtyName?: string;
  procedureDefinitionId?: string;
  procedureName: string;
  procedureCategory?: string;
  surgicalApproach: SurgicalApproach;
  role: string;
  autonomyLevel: AutonomyLevel;
  difficultyScore: number;
  operativeDurationMinutes?: number;
  consoleTimeMinutes?: number;
  dockingTimeMinutes?: number;
  attendingLabel?: string;
  institutionSite?: string;
  patientAgeBin?: AgeBin;
  diagnosisCategory?: string;
  outcomeCategory: OutcomeCategory;
  complicationCategory: ComplicationCategory;
  conversionOccurred?: boolean;
  notes?: string;
  tags?: string[];
  reflection?: string;
  isPublic?: boolean;
  benchmarkOptIn?: boolean;
  caseDate: Date;
}

export interface Milestone {
  id: string;
  userId: string;
  type: MilestoneType;
  procedureName: string | null;
  value: number;
  achievedAt: Date;
  badgeKey: string;
}

export interface PersonalRecord {
  id: string;
  userId: string;
  procedureName: string;
  recordType: string;
  value: number;
  previousValue: number | null;
  achievedAt: Date;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  createdAt: Date;
  fromUser?: User;
  toUser?: User;
}

export interface Friendship {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: Date;
  friend?: User;
}

export interface FeedEvent {
  id: string;
  userId: string;
  eventType: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  user?: User;
}

// Stats types
export interface CaseStats {
  total: number;
  thisMonth: number;
  thisYear: number;
  thisWeek: number;
  bySpecialty: Record<string, number>;
  byProcedure: Record<string, number>;
  byRole: Record<string, number>;
  byAutonomy: Record<string, number>;
  byApproach: Record<string, number>;
  byOutcome: Record<string, number>;
  firstSurgeonRate: number;
  independentRate: number;
  avgDifficultyScore: number;
}

export interface OperativeTimeStats {
  median: number;
  mean: number;
  min: number;
  max: number;
  byProcedure: Record<string, { median: number; mean: number; count: number; trend: number[] }>;
}

export interface LearningCurvePoint {
  caseNumber: number;
  duration: number;
  date: Date;
  autonomyLevel: AutonomyLevel;
  difficultyScore: number;
}

export interface MonthlyVolume {
  month: string;
  year: number;
  count: number;
  label: string;
}

export interface WeeklyHeatmapDay {
  date: Date;
  count: number;
  dateString: string;
}

export interface RoleProgressionPoint {
  month: string;
  OBSERVER: number;
  ASSISTANT: number;
  SUPERVISOR_PRESENT: number;
  INDEPENDENT: number;
  TEACHING: number;
}

export interface BenchmarkData {
  procedureName: string;
  specialty: string;
  pgyYear?: number;
  approach?: SurgicalApproach;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  sampleSize: number;
  userValue?: number;
  userPercentile?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  specialty: string;
  pgyYear: number | null;
  trainingYearLabel: string | null;
  value: number;
  badge?: string;
  isCurrentUser?: boolean;
}

export interface FriendWithStats {
  id: string;
  userId: string;
  name: string;
  specialty: string | null;
  institution: string | null;
  pgyYear: number | null;
  trainingYearLabel: string | null;
  image: string | null;
  totalCases: number;
  thisMonthCases: number;
  topProcedure: string | null;
  recentMilestone: string | null;
}

export interface PhiaValidationResult {
  safe: boolean;
  warnings: string[];
  scrubbed: string;
}

export interface MilestoneCheck {
  unlocked: Milestone[];
  newPRs: PersonalRecord[];
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastLogDate: Date | null;
}

export interface ExportOptions {
  type: "full" | "annual" | "milestones" | "benchmarks" | "complete";
  year?: number;
  caseIds?: string[];
  includeNotes?: boolean;
  includeSensitive?: boolean;
}

export interface QuickAddForm {
  specialtySlug: string;
  procedureName: string;
  role: string;
  autonomyLevel: AutonomyLevel;
  operativeDurationMinutes: number;
  caseDate: Date;
  surgicalApproach: SurgicalApproach;
}

export interface OnboardingStep {
  step: number;
  title: string;
  description: string;
}

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
  proOnly?: boolean;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
  duration?: number;
}

// ── Social Profile Types ─────────────────────────────────────────────────────

export type PearlCategory = "Anatomy Tip" | "Technical Pearl" | "Pitfall" | "Decision Point" | "Equipment" | "Post-Op" | "Other";

export interface Pearl {
  id: string;
  authorId: string;
  procedureName: string;
  category: PearlCategory | string | null;
  title: string;
  content: string;
  tags: string[];
  likeCount: number;
  saveCount: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: string;
    name: string | null;
    image: string | null;
    profile?: { specialty: string | null; trainingYearLabel: string | null } | null;
  };
  liked?: boolean;
  saved?: boolean;
}

export interface PortfolioCase {
  id: string;
  userId: string;
  caseLogId: string;
  title: string;
  description: string | null;
  isFeatured: boolean;
  isMilestone: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  caseLog?: {
    procedureName: string;
    surgicalApproach: SurgicalApproach;
    autonomyLevel: AutonomyLevel;
    operativeDurationMinutes: number | null;
    outcomeCategory: OutcomeCategory;
    caseDate: Date;
  };
}

export interface PublicProfile {
  id: string;
  name: string | null;
  image: string | null;
  profile: {
    roleType: UserRoleType;
    specialty: string | null;
    subspecialty: string | null;
    institution: string | null;
    city: string | null;
    pgyYear: number | null;
    trainingYearLabel: string | null;
    bio: string | null;
    publicProfile: boolean;
  } | null;
  stats: {
    totalCases: number;
    streak: number;
    avgORMinutes: number;
    independentRate: number;
    topProcedures: Array<{ name: string; count: number }>;
  };
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
}

// ── EPA Observation Types ───────────────────────────────────────────────────

export type EpaAchievementLevel = "NOT_ACHIEVED" | "ACHIEVED";
export type EpaObservationStatus = "DRAFT" | "SUBMITTED" | "PENDING_REVIEW" | "SIGNED" | "RETURNED";

export interface CriterionRating {
  criterionId: string;
  label: string;
  /** Entrustment rating for this criterion: 0=Not observed, 1-5=O-score */
  entrustmentRating: number | null;
  comment?: string;
}

// Royal College O-Score / Entrustment Scale
export type EntrustmentScore = 1 | 2 | 3 | 4 | 5;

export const ENTRUSTMENT_LABELS: Record<number, { short: string; long: string }> = {
  0: { short: "Not observed", long: "Not observed" },
  1: { short: "I had to do", long: "I had to do" },
  2: { short: "I had to talk them through", long: "I had to talk them through" },
  3: { short: "I had to prompt them from time to time", long: "I had to prompt them from time to time" },
  4: { short: "I needed to be there in the room just in case", long: "I needed to be there in the room just in case" },
  5: { short: "I did not need to be there", long: "I did not need to be there" },
};

export interface CanmedsRating {
  roleId: string;
  roleTitle: string;
  rating: number | null; // 1-5 or null if not rated
}

export interface SafetyConcernData {
  safetyConcern: boolean;
  professionalismConcern: boolean;
  concernDetails?: string;
}

export interface EpaObservation {
  id: string;
  userId: string;
  caseLogId: string | null;
  epaId: string;
  epaTitle: string;
  specialtySlug: string;
  trainingSystem: string;
  observationDate: Date;
  setting: string | null;
  complexity: string | null;
  assessorName: string;
  assessorRole: string | null;
  assessorEmail: string | null;
  achievement: EpaAchievementLevel;
  entrustmentScore: number | null;
  canmedsRatings: CanmedsRating[] | null;
  observationNotes: string | null;
  strengthsNotes: string | null;
  improvementNotes: string | null;
  criteriaRatings: CriterionRating[] | null;
  safetyConcern: boolean;
  professionalismConcern: boolean;
  concernDetails: string | null;
  status: EpaObservationStatus;
  signedAt: Date | null;
  signedByName: string | null;
  returnedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  caseLog?: {
    procedureName: string;
    caseDate: Date;
    surgicalApproach: SurgicalApproach;
  };
}

export interface EpaObservationInput {
  caseLogId?: string;
  epaId: string;
  epaTitle: string;
  specialtySlug: string;
  trainingSystem: string;
  observationDate: Date;
  setting?: string;
  complexity?: string;
  assessorName: string;
  assessorRole?: string;
  assessorEmail?: string;
  achievement?: EpaAchievementLevel;
  entrustmentScore?: number;
  canmedsRatings?: CanmedsRating[];
  observationNotes?: string;
  strengthsNotes?: string;
  improvementNotes?: string;
  criteriaRatings?: CriterionRating[];
  safetyConcern?: boolean;
  professionalismConcern?: boolean;
  concernDetails?: string;
}

export interface EpaSuggestion {
  epaId: string;
  epaTitle: string;
  confidence: "high" | "medium" | "low";
  score: number;
  matchReasons: string[];
  currentProgress: { observations: number; targetCount: number };
}
