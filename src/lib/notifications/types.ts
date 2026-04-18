// ---------------------------------------------------------------------------
// Notification type catalogue.
//
// Keep this list as the single source of truth for the `type` column on
// the `notifications` table. The backend uses it when writing; the client
// uses it to pick the right icon, colour, and deep-link label.
//
// Each type must have: what triggered it, who receives it, and where
// tapping should send them. Anything we can't answer here doesn't belong
// as a notification — it belongs in an email or a dashboard card.
// ---------------------------------------------------------------------------

export type NotificationType =
  | "epa.awaiting_review"  // attending: new EPA submitted for them to sign
  | "epa.verified"         // resident: your EPA was signed by the attending
  | "epa.returned"         // resident: your EPA was returned for edits
  | "epa.batch_signed"     // resident: N of your EPAs were signed in a batch
  | "epa.reminder";        // attending: pending EPAs still awaiting your action

export interface NotificationMeta {
  icon: "check" | "clock" | "return" | "inbox" | "bell";
  accent: "teal" | "success" | "warning" | "danger" | "muted";
  label: string;            // short human label for badges / filters
}

/**
 * Lookup table for UI metadata. The server ONLY writes `type`; all visual
 * decisions are made client-side from this map, so we can restyle without
 * touching rows.
 */
export const NOTIFICATION_META: Record<NotificationType, NotificationMeta> = {
  "epa.awaiting_review": { icon: "inbox",  accent: "teal",    label: "Awaiting review" },
  "epa.verified":        { icon: "check",  accent: "success", label: "Verified" },
  "epa.returned":        { icon: "return", accent: "warning", label: "Needs edits" },
  "epa.batch_signed":    { icon: "check",  accent: "success", label: "Batch signed" },
  "epa.reminder":        { icon: "clock",  accent: "muted",   label: "Reminder" },
};
