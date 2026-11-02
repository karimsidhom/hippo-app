import { redirect } from "next/navigation";
import { PULSE_URL } from "@/lib/pulse";

/**
 * Community lives on Hippo Pulse. Cases keeps private training records only,
 * so old links to the feed, colleague profiles and the leaderboard land there.
 */
export default function CommunityOnPulse() {
  redirect(PULSE_URL);
}
