/* ── Quote Library Utilities ─────────────────────────────────────────────── */

import { ALL_QUOTES } from "./data";
import {
  CONTEXT_MAP,
  type Quote,
  type QuoteAuthor,
  type QuoteCategory,
  type QuoteContext,
  type QuoteMood,
  type QuoteTheme,
  type QuoteUseCase,
} from "./types";

/* ── Deterministic Quote of the Day ─────────────────────────────────────── */

/**
 * Returns a deterministic quote for a given date.
 * Uses day-of-year cycling so every day maps to exactly one quote,
 * and the full 365-quote set is used before repeating.
 */
export function getQuoteOfTheDay(date: Date = new Date()): Quote {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = dayOfYear % ALL_QUOTES.length;
  return ALL_QUOTES[index];
}

/* ── Random Quote ───────────────────────────────────────────────────────── */

export function getRandomQuote(): Quote {
  return ALL_QUOTES[Math.floor(Math.random() * ALL_QUOTES.length)];
}

/* ── Filter by Theme ────────────────────────────────────────────────────── */

export function getQuotesByTheme(theme: QuoteTheme): Quote[] {
  return ALL_QUOTES.filter((q) => q.themes.includes(theme));
}

/* ── Filter by Mood ─────────────────────────────────────────────────────── */

export function getQuotesByMood(mood: QuoteMood): Quote[] {
  return ALL_QUOTES.filter((q) => q.mood === mood);
}

/* ── Filter by Author ───────────────────────────────────────────────────── */

export function getQuotesByAuthor(author: QuoteAuthor): Quote[] {
  return ALL_QUOTES.filter((q) => q.author === author);
}

/* ── Filter by Category ─────────────────────────────────────────────────── */

export function getQuotesByCategory(category: QuoteCategory): Quote[] {
  return ALL_QUOTES.filter((q) => q.category === category);
}

/* ── Filter by Use Case ─────────────────────────────────────────────────── */

export function getQuotesByUseCase(useCase: QuoteUseCase): Quote[] {
  return ALL_QUOTES.filter((q) => q.use_case.includes(useCase));
}

/* ── Favorites ──────────────────────────────────────────────────────────── */

/**
 * Returns quotes matching the given favorite IDs.
 * In a full app, favoriteIds come from the database.
 */
export function getFavoriteQuotes(favoriteIds: number[]): Quote[] {
  const idSet = new Set(favoriteIds);
  return ALL_QUOTES.filter((q) => idSet.has(q.id));
}

/* ── Contextual Quote ───────────────────────────────────────────────────── */

/**
 * Returns a random quote matching a contextual situation
 * (before surgery, after a hard day, studying, etc.)
 */
export function getContextualQuote(context: QuoteContext): Quote {
  const mapping = CONTEXT_MAP[context];
  const candidates = ALL_QUOTES.filter(
    (q) =>
      q.themes.some((t) => mapping.themes.includes(t)) ||
      mapping.moods.includes(q.mood),
  );
  if (candidates.length === 0) return getRandomQuote();
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Returns multiple contextual quotes (e.g. for a carousel).
 */
export function getContextualQuotes(context: QuoteContext, count: number = 5): Quote[] {
  const mapping = CONTEXT_MAP[context];
  const candidates = ALL_QUOTES.filter(
    (q) =>
      q.themes.some((t) => mapping.themes.includes(t)) ||
      mapping.moods.includes(q.mood),
  );
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/* ── No-Repeat Rotation ─────────────────────────────────────────────────── */

/**
 * Returns the next unused quote for a user.
 * `seenIds` should come from user_quote_history in the database.
 * Once all 365 are seen, the cycle resets.
 */
export function getNextUnusedQuote(seenIds: number[]): Quote {
  const seenSet = new Set(seenIds);

  // If all seen, reset
  if (seenSet.size >= ALL_QUOTES.length) {
    return ALL_QUOTES[Math.floor(Math.random() * ALL_QUOTES.length)];
  }

  const unseen = ALL_QUOTES.filter((q) => !seenSet.has(q.id));
  return unseen[Math.floor(Math.random() * unseen.length)];
}

/**
 * Deterministic no-repeat rotation using a seeded shuffle.
 * Given a cycle number (how many full rotations completed),
 * produces a consistent ordering for that cycle.
 */
export function getRotationOrder(cycle: number = 0): number[] {
  const ids = ALL_QUOTES.map((q) => q.id);
  // Simple seeded shuffle using cycle as seed
  let seed = cycle * 2654435761; // Knuth multiplicative hash
  for (let i = ids.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(seed) % (i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

/* ── Quote by ID ────────────────────────────────────────────────────────── */

export function getQuoteById(id: number): Quote | undefined {
  return ALL_QUOTES.find((q) => q.id === id);
}

/* ── Search Quotes ──────────────────────────────────────────────────────── */

export function searchQuotes(query: string): Quote[] {
  const lower = query.toLowerCase();
  return ALL_QUOTES.filter(
    (q) =>
      q.quote.toLowerCase().includes(lower) ||
      q.author.toLowerCase().includes(lower) ||
      q.themes.some((t) => t.includes(lower)),
  );
}

/* ── Multi-filter ───────────────────────────────────────────────────────── */

export interface QuoteFilters {
  theme?: QuoteTheme;
  mood?: QuoteMood;
  author?: QuoteAuthor;
  category?: QuoteCategory;
  useCase?: QuoteUseCase;
  verified?: boolean;
}

export function filterQuotes(filters: QuoteFilters): Quote[] {
  return ALL_QUOTES.filter((q) => {
    if (filters.theme && !q.themes.includes(filters.theme)) return false;
    if (filters.mood && q.mood !== filters.mood) return false;
    if (filters.author && q.author !== filters.author) return false;
    if (filters.category && q.category !== filters.category) return false;
    if (filters.useCase && !q.use_case.includes(filters.useCase)) return false;
    if (filters.verified !== undefined && q.is_verified !== filters.verified) return false;
    return true;
  });
}

/* ── Stats ──────────────────────────────────────────────────────────────── */

export function getQuoteStats() {
  const byAuthor: Record<string, number> = {};
  const byTheme: Record<string, number> = {};
  const byMood: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  for (const q of ALL_QUOTES) {
    byAuthor[q.author] = (byAuthor[q.author] || 0) + 1;
    byMood[q.mood] = (byMood[q.mood] || 0) + 1;
    byCategory[q.category] = (byCategory[q.category] || 0) + 1;
    for (const t of q.themes) {
      byTheme[t] = (byTheme[t] || 0) + 1;
    }
  }

  return {
    total: ALL_QUOTES.length,
    byAuthor,
    byTheme,
    byMood,
    byCategory,
    verified: ALL_QUOTES.filter((q) => q.is_verified).length,
  };
}
