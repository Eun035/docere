import { apiUrl } from "./apiBase";

const STORAGE_KEY = "verbum_vitae_uid_v1";

/**
 * Returns a stable anonymous identifier for the current browser, persisted in
 * localStorage. This is the key quota counters and day-pass purchases are
 * tracked against on the server. Wiping localStorage forfeits in-flight day
 * passes — acceptable for an anonymous-only model.
 */
export function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "anonymous";
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
  } catch {
    // localStorage may be blocked (private mode, etc.) — fall through.
  }

  const fresh =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `uid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

  try {
    localStorage.setItem(STORAGE_KEY, fresh);
  } catch {
    /* noop */
  }
  return fresh;
}

export interface UsageStatus {
  used: number;
  limit: number;
  hasDayPass: boolean;
  dayPassExpiresAt: string | null;
  dayKey: string;
  blocked: boolean;
}

export async function fetchUsage(userId: string): Promise<UsageStatus | null> {
  try {
    const res = await fetch(apiUrl(`/api/usage?userId=${encodeURIComponent(userId)}`));
    if (!res.ok) return null;
    return (await res.json()) as UsageStatus;
  } catch {
    return null;
  }
}
