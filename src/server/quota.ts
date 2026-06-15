import { getStore } from "./storage";

export const DAILY_FREE_LIMIT = 3;
export const DAY_PASS_PRICE_KRW = 1500;

export interface QuotaStatus {
  used: number;
  limit: number;
  hasDayPass: boolean;
  dayPassExpiresAt: string | null; // ISO timestamp of next KST midnight
  dayKey: string; // YYYY-MM-DD in KST
  /** True if the next analyze call would be blocked (no pass, used >= limit). */
  blocked: boolean;
}

/** Returns YYYY-MM-DD in KST (UTC+9). Day boundary is midnight KST. */
export function kstDayKey(now = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

/** ISO timestamp of the next KST midnight (i.e. end of "today" KST). */
export function kstEndOfDay(now = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setUTCHours(24, 0, 0, 0); // next KST midnight
  // Convert back to UTC for ISO string
  return new Date(kst.getTime() - 9 * 60 * 60 * 1000).toISOString();
}

function usageKey(userId: string, dayKey: string) {
  return `usage:${userId}:${dayKey}`;
}

function dayPassKey(userId: string, dayKey: string) {
  return `daypass:${userId}:${dayKey}`;
}

/** TTL of 48 hours covers the day plus a generous buffer. */
const TTL_SECONDS = 60 * 60 * 48;

export async function getStatus(userId: string): Promise<QuotaStatus> {
  const dayKey = kstDayKey();
  const store = await getStore();
  const [usedRaw, dayPassRaw] = await Promise.all([
    store.get<string | number>(usageKey(userId, dayKey)),
    store.get<string>(dayPassKey(userId, dayKey)),
  ]);
  const used = parseInt(String(usedRaw ?? 0), 10) || 0;
  const hasDayPass = dayPassRaw === "1" || dayPassRaw === "true";
  return {
    used,
    limit: DAILY_FREE_LIMIT,
    hasDayPass,
    dayPassExpiresAt: hasDayPass ? kstEndOfDay() : null,
    dayKey,
    blocked: !hasDayPass && used >= DAILY_FREE_LIMIT,
  };
}

/** Increments the usage counter for the current KST day. Returns new total. */
export async function recordUsage(userId: string): Promise<number> {
  const store = await getStore();
  return store.incr(usageKey(userId, kstDayKey()), TTL_SECONDS);
}

/** Marks the current KST day as paid (day pass). Idempotent. */
export async function grantDayPass(userId: string): Promise<void> {
  const store = await getStore();
  await store.set(dayPassKey(userId, kstDayKey()), "1", TTL_SECONDS);
}

/**
 * Records that a Toss orderId has been processed, so the same payment cannot
 * be confirmed twice (idempotency guard against double-submit, replays).
 * Returns true if this is the first time we've seen the orderId.
 */
export async function claimPaymentOrder(orderId: string): Promise<boolean> {
  const store = await getStore();
  const key = `order:${orderId}`;
  const existing = await store.get<string>(key);
  if (existing) return false;
  await store.set(key, "1", 60 * 60 * 24 * 30); // 30 days
  return true;
}
