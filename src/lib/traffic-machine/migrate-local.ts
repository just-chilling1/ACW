export const LEGACY_COMPLETED_KEY = "cashtap_autopilot_completed";

export function readLegacyCompletedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(LEGACY_COMPLETED_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function markLegacyMigrated(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${LEGACY_COMPLETED_KEY}_migrated`, "1");
  } catch {
    // ignore
  }
}

export function wasLegacyMigrated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${LEGACY_COMPLETED_KEY}_migrated`) === "1";
}
