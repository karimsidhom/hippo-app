import { safetyApp } from "@/lib/safety";
import { SafetyScreen } from "./SafetyScreen";
export const dynamic = "force-dynamic";
export default async function SafetyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  return <SafetyScreen app={safetyApp(p.app) ?? "cases"} />;
}
