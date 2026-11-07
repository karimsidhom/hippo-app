// ---------------------------------------------------------------------------
// Recurrence expansion — turn a single recurring event into individual
// instances across a date window.
// ---------------------------------------------------------------------------

type RecurrenceFrequency = 'NONE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export interface RecurringSource {
  id: string;
  startAt: Date;
  endAt: Date | null;
  recurrence: RecurrenceFrequency;
  recurrenceUntil: Date | null;
}

export interface RecurrenceInstance {
  startAt: Date;
  endAt: Date | null;
  isRecurringInstance: boolean;
  /** Original startAt of the master event (used for edit/delete routing). */
  originalStartAt: Date;
}

/**
 * Maximum number of instances we'll expand per event. Prevents runaway if
 * someone stores a daily recurrence with no until-date.
 */
const MAX_INSTANCES = 500;

/**
 * Expand a recurring event into its individual instances within [windowStart,
 * windowEnd). Non-recurring events return a single instance (the event itself
 * if it falls in the window).
 */
export function expandRecurrence(
  evt: RecurringSource,
  windowStart: Date,
  windowEnd: Date,
): RecurrenceInstance[] {
  const baseDurationMs = evt.endAt
    ? evt.endAt.getTime() - evt.startAt.getTime()
    : 0;

  if (evt.recurrence === 'NONE') {
    // Single instance — include it only if it intersects the window.
    const end =
      evt.endAt ?? new Date(evt.startAt.getTime() + 1); // at minimum 1ms
    if (end >= windowStart && evt.startAt < windowEnd) {
      return [
        {
          startAt: evt.startAt,
          endAt: evt.endAt,
          isRecurringInstance: false,
          originalStartAt: evt.startAt,
        },
      ];
    }
    return [];
  }

  const instances: RecurrenceInstance[] = [];
  let cursor = new Date(evt.startAt);
  const until = evt.recurrenceUntil
    ? new Date(Math.min(evt.recurrenceUntil.getTime(), windowEnd.getTime()))
    : windowEnd;

  for (let i = 0; i < MAX_INSTANCES && cursor < until; i++) {
    const cursorEnd =
      baseDurationMs > 0
        ? new Date(cursor.getTime() + baseDurationMs)
        : null;

    const rangeEnd = cursorEnd ?? new Date(cursor.getTime() + 1);
    if (rangeEnd >= windowStart) {
      instances.push({
        startAt: new Date(cursor),
        endAt: cursorEnd,
        isRecurringInstance: i > 0,
        originalStartAt: evt.startAt,
      });
    }

    // Advance cursor by the recurrence step
    cursor = advance(cursor, evt.recurrence);
  }

  return instances;
}

function advance(d: Date, freq: RecurrenceFrequency): Date {
  const n = new Date(d);
  switch (freq) {
    case 'DAILY':
      n.setDate(n.getDate() + 1);
      break;
    case 'WEEKLY':
      n.setDate(n.getDate() + 7);
      break;
    case 'BIWEEKLY':
      n.setDate(n.getDate() + 14);
      break;
    case 'MONTHLY':
      n.setMonth(n.getMonth() + 1);
      break;
    default:
      // NONE — caller should not reach here
      break;
  }
  return n;
}
