/**
 * Storage abstraction used for quota counters + day-pass records.
 *
 * - In production (Vercel) the @vercel/kv env vars (KV_REST_API_URL +
 *   KV_REST_API_TOKEN, or KV_URL) are auto-injected once a KV instance is
 *   provisioned via the Vercel dashboard → @vercel/kv is used.
 * - Locally (and in any environment without those env vars) we fall back to
 *   an in-memory Map so the dev server still works without external services.
 *   Data is not persistent across restarts — fine for development, but anyone
 *   shipping live should ensure KV (or equivalent) is configured.
 */

type Store = {
  get<T = string>(key: string): Promise<T | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  incr(key: string, ttlSeconds?: number): Promise<number>;
};

const memoryStore = new Map<string, { value: string; expires?: number }>();

function memoryNow() {
  return Math.floor(Date.now() / 1000);
}

function memoryGet(key: string): string | null {
  const hit = memoryStore.get(key);
  if (!hit) return null;
  if (hit.expires && hit.expires < memoryNow()) {
    memoryStore.delete(key);
    return null;
  }
  return hit.value;
}

function memorySet(key: string, value: string, ttl?: number) {
  memoryStore.set(key, {
    value,
    expires: ttl ? memoryNow() + ttl : undefined,
  });
}

const memoryAdapter: Store = {
  async get<T = string>(key: string): Promise<T | null> {
    const raw = memoryGet(key);
    return raw === null ? null : (raw as unknown as T);
  },
  async set(key, value, ttl) {
    memorySet(key, value, ttl);
  },
  async incr(key, ttl) {
    const current = parseInt(memoryGet(key) ?? "0", 10);
    const next = current + 1;
    memorySet(key, String(next), ttl);
    return next;
  },
};

let cached: Store | null = null;

function isKvConfigured() {
  return Boolean(
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  );
}

export async function getStore(): Promise<Store> {
  if (cached) return cached;

  if (!isKvConfigured()) {
    cached = memoryAdapter;
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[storage] KV env vars not set — using in-memory store. " +
          "Provision a Vercel KV database for durable quota + payment tracking."
      );
    }
    return cached;
  }

  // Lazy-load @vercel/kv only when env is present so local dev doesn't error.
  const { kv } = await import("@vercel/kv");

  cached = {
    async get<T = string>(key: string): Promise<T | null> {
      const v = await kv.get<T>(key);
      return v ?? null;
    },
    async set(key, value, ttl) {
      if (ttl) await kv.set(key, value, { ex: ttl });
      else await kv.set(key, value);
    },
    async incr(key, ttl) {
      const next = await kv.incr(key);
      if (ttl && next === 1) await kv.expire(key, ttl);
      return next;
    },
  };
  return cached;
}
