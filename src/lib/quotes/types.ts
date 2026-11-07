/* ── Quote Library Types ─────────────────────────────────────────────────── */

export type QuoteTheme =
  | "medicine"
  | "excellence"
  | "discipline"
  | "ethics"
  | "humility"
  | "leadership"
  | "learning"
  | "resilience"
  | "mastery"
  | "service"
  | "philosophy"
  | "truth"
  | "virtue"
  | "courage"
  | "focus";

export type QuoteCategory =
  | "clinical_wisdom"
  | "surgeon_mindset"
  | "leadership"
  | "patient_care"
  | "philosophy"
  | "resilience"
  | "excellence"
  | "teaching"
  | "reflection"
  | "founder_vision";

export type QuoteMood =
  | "stoic"
  | "calm"
  | "elite"
  | "visionary"
  | "disciplined"
  | "reflective"
  | "relentless"
  | "compassionate";

export type QuoteUseCase =
  | "dashboard_daily_quote"
  | "onboarding"
  | "pre_op_mindset"
  | "post_op_reflection"
  | "study_motivation"
  | "leadership_prompt"
  | "teaching_rounds"
  | "founder_mode"
  | "push_notification"
  | "share_card";

export type QuoteContext =
  | "before_surgery"
  | "after_hard_day"
  | "studying"
  | "leadership"
  | "resilience"
  | "bedside_care"
  | "discipline"
  | "deep_reflection";

export type SourceConfidence = "high" | "medium" | "low";

export type QuoteAuthor =
  | "William Osler"
  | "Hippocrates"
  | "Socrates"
  | "Plato"
  | "Aristotle";

export interface Quote {
  id: number;
  quote: string;
  short_quote: string | null;
  author: QuoteAuthor;
  era: string;
  source: string | null;
  source_confidence: SourceConfidence;
  themes: QuoteTheme[];
  category: QuoteCategory;
  mood: QuoteMood;
  use_case: QuoteUseCase[];
  is_verified: boolean;
}

export interface UserFavoriteQuote {
  userId: string;
  quoteId: number;
  favoritedAt: Date;
}

export interface UserQuoteHistory {
  userId: string;
  quoteId: number;
  shownAt: Date;
}

export interface ShareableQuoteMeta {
  quote: Quote;
  backgroundTheme: "dark" | "light" | "surgical";
  fontStyle: "serif" | "sans" | "mono";
  layout: "centered" | "left_aligned" | "minimal";
  brandWatermark: boolean;
  dimensions: { width: number; height: number };
}

/** Maps QuoteContext to themes/moods for contextual retrieval */
export const CONTEXT_MAP: Record<QuoteContext, { themes: QuoteTheme[]; moods: QuoteMood[] }> = {
  before_surgery:  { themes: ["courage", "focus", "discipline", "mastery"], moods: ["stoic", "calm", "disciplined"] },
  after_hard_day:  { themes: ["resilience", "humility", "virtue", "philosophy"], moods: ["reflective", "compassionate", "stoic"] },
  studying:        { themes: ["learning", "mastery", "discipline", "excellence"], moods: ["disciplined", "relentless", "elite"] },
  leadership:      { themes: ["leadership", "ethics", "service", "excellence"], moods: ["visionary", "elite", "calm"] },
  resilience:      { themes: ["resilience", "courage", "virtue", "discipline"], moods: ["stoic", "relentless", "disciplined"] },
  bedside_care:    { themes: ["medicine", "service", "ethics", "humility"], moods: ["compassionate", "calm", "reflective"] },
  discipline:      { themes: ["discipline", "focus", "mastery", "excellence"], moods: ["disciplined", "stoic", "relentless"] },
  deep_reflection: { themes: ["philosophy", "truth", "virtue", "humility"], moods: ["reflective", "calm", "visionary"] },
};
