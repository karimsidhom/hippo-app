/**
 * Today's Principle — curated quotes for daily surgical reflection.
 * Deterministic rotation: one quote per calendar day, stable across refreshes.
 */

export interface Principle {
  text: string;
  attribution: string;
}

export const PRINCIPLES: Principle[] = [
  // ── Hippocrates (verified / classical) ──────────────────────────────────────
  { text: "Healing is a matter of time, but it is sometimes also a matter of opportunity.", attribution: "Hippocrates" },
  { text: "First, do no harm.", attribution: "Hippocrates" },
  { text: "Make a habit of two things: to help, or at least to do no harm.", attribution: "Hippocrates" },
  { text: "Life is short, and art long; the crisis fleeting, experience perilous, and decision difficult.", attribution: "Hippocrates" },
  { text: "Wherever the art of medicine is loved, there is also a love of humanity.", attribution: "Hippocrates" },
  { text: "The chief virtue that language can have is clearness, and nothing detracts from it so much as the use of unfamiliar words.", attribution: "Hippocrates" },
  { text: "There are in fact two things, science and opinion; the former begets knowledge, the latter ignorance.", attribution: "Hippocrates" },
  { text: "Prayer indeed is good, but while calling on the gods a man should himself lend a hand.", attribution: "Hippocrates" },
  { text: "To do nothing is also a good remedy.", attribution: "Hippocrates" },
  { text: "Everything in excess is opposed to nature.", attribution: "Hippocrates" },
  { text: "It is more important to know what sort of person has a disease than to know what sort of disease a person has.", attribution: "Hippocrates" },
  { text: "The natural healing force within each one of us is the greatest force in getting well.", attribution: "Hippocrates" },
  { text: "A wise man should consider that health is the greatest of human blessings.", attribution: "Hippocrates" },

  // ── Attributed to Hippocrates ───────────────────────────────────────────────
  { text: "Let food be thy medicine and medicine be thy food.", attribution: "Attributed to Hippocrates" },
  { text: "The soul is the same in all living creatures, although the body of each is different.", attribution: "Attributed to Hippocrates" },
  { text: "Cure sometimes, treat often, comfort always.", attribution: "Attributed to Hippocrates" },

  // ── Surgical discipline ─────────────────────────────────────────────────────
  { text: "The operation is the easy part. The judgment of when to operate is the art.", attribution: "William Halsted" },
  { text: "The only weapon with which the unconscious patient can immediately retaliate upon the incompetent surgeon is hemorrhage.", attribution: "William Halsted" },
  { text: "A chance to cut is a chance to cure.", attribution: "Surgical proverb" },
  { text: "In surgery, eyes first and most, fingers next and little, tongue last and least.", attribution: "George Murray Humphry" },
  { text: "See one, do one, teach one.", attribution: "Surgical tradition" },

  // ── Excellence & mastery ────────────────────────────────────────────────────
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", attribution: "Aristotle" },
  { text: "The expert in anything was once a beginner.", attribution: "Helen Hayes" },
  { text: "Perfection is not attainable, but if we chase perfection we can catch excellence.", attribution: "Vince Lombardi" },
  { text: "It is not the strongest of the species that survives, nor the most intelligent, but the one most responsive to change.", attribution: "Charles Darwin" },
  { text: "The best preparation for tomorrow is doing your best today.", attribution: "H. Jackson Brown Jr." },
  { text: "Quality is not an act, it is a habit.", attribution: "Aristotle" },
  { text: "Practice does not make perfect. Only perfect practice makes perfect.", attribution: "Vince Lombardi" },

  // ── Humility & service ──────────────────────────────────────────────────────
  { text: "The good physician treats the disease; the great physician treats the patient who has the disease.", attribution: "William Osler" },
  { text: "One of the essential qualities of the clinician is interest in humanity, for the secret of the care of the patient is in caring for the patient.", attribution: "Francis Peabody" },
  { text: "Listen to your patient; he is telling you the diagnosis.", attribution: "William Osler" },
  { text: "Medicine is a science of uncertainty and an art of probability.", attribution: "William Osler" },
  { text: "The desire to take medicine is perhaps the greatest feature which distinguishes man from animals.", attribution: "William Osler" },
  { text: "Observe, record, tabulate, communicate. Use your five senses.", attribution: "William Osler" },
  { text: "He who studies medicine without books sails an uncharted sea, but he who studies medicine without patients does not go to sea at all.", attribution: "William Osler" },
  { text: "To study the phenomena of disease without books is to sail an uncharted sea; to study books without patients is not to go to sea at all.", attribution: "William Osler" },

  // ── Courage & resilience ────────────────────────────────────────────────────
  { text: "Courage is not the absence of fear, but rather the judgment that something else is more important than fear.", attribution: "Ambrose Redmoon" },
  { text: "The only way to do great work is to love what you do.", attribution: "Steve Jobs" },
  { text: "In the middle of difficulty lies opportunity.", attribution: "Albert Einstein" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", attribution: "Winston Churchill" },

  // ── Patience & learning ─────────────────────────────────────────────────────
  { text: "The art of medicine consists of amusing the patient while nature cures the disease.", attribution: "Voltaire" },
  { text: "Knowing is not enough; we must apply. Willing is not enough; we must do.", attribution: "Goethe" },
  { text: "Every patient you see is a lesson in much more than the malady from which he suffers.", attribution: "William Osler" },
  { text: "The young physician starts life with twenty drugs for each disease, and the old physician ends life with one drug for twenty diseases.", attribution: "William Osler" },
  { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", attribution: "Brian Herbert" },

  // ── Focus & presence ────────────────────────────────────────────────────────
  { text: "Concentration is the secret of strength.", attribution: "Ralph Waldo Emerson" },
  { text: "Simplicity is the ultimate sophistication.", attribution: "Leonardo da Vinci" },
  { text: "The details are not the details. They make the design.", attribution: "Charles Eames" },
  { text: "Mastery is not a function of genius or talent. It is a function of time and intense focus.", attribution: "Robert Greene" },

  // ── Integrity & trust ───────────────────────────────────────────────────────
  { text: "The physician must have at his command a certain ready wit, for a person without humor is not only insupportable as a companion, but incapable of dealing with a patient.", attribution: "Hippocrates" },
  { text: "Wherever a doctor cannot do good, he must be kept from doing harm.", attribution: "Hippocrates" },
  { text: "The physician's highest calling, his only calling, is to make sick people healthy — to heal, as it is termed.", attribution: "Samuel Hahnemann" },

  // ── Craft & precision ───────────────────────────────────────────────────────
  { text: "A surgeon should have the eyes of a hawk, the hands of a woman, and the heart of a lion.", attribution: "Medieval proverb" },
  { text: "Surgery is the red flower that blooms among the leaves and thorns that are the rest of medicine.", attribution: "Richard Selzer" },
  { text: "The knife is dangerous in the hand of the wise, let alone in the hand of the foolish.", attribution: "Arabic proverb" },
  { text: "Anatomy is to physiology as geography is to history; it describes the theatre of events.", attribution: "Jean Fernel" },

  // ── Growth & perseverance ───────────────────────────────────────────────────
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", attribution: "Nelson Mandela" },
  { text: "Do not judge me by my successes, judge me by how many times I fell down and got back up again.", attribution: "Nelson Mandela" },
  { text: "What we know is a drop, what we don't know is an ocean.", attribution: "Isaac Newton" },
  { text: "An investment in knowledge pays the best interest.", attribution: "Benjamin Franklin" },
  { text: "The more you sweat in practice, the less you bleed in combat.", attribution: "Richard Marcinko" },

  // ── Wisdom ──────────────────────────────────────────────────────────────────
  { text: "The beginning of wisdom is the definition of terms.", attribution: "Socrates" },
  { text: "He who has a why to live can bear almost any how.", attribution: "Friedrich Nietzsche" },
  { text: "Not all of us can do great things. But we can do small things with great love.", attribution: "Mother Teresa" },
  { text: "The measure of intelligence is the ability to change.", attribution: "Albert Einstein" },
];

/**
 * Returns today's principle using a deterministic day-of-year seed.
 * The same quote is returned for all calls on the same calendar day.
 */
export function getTodaysPrinciple(): Principle {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return PRINCIPLES[dayOfYear % PRINCIPLES.length];
}
