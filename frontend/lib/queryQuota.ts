export const FREE_LIMIT = 5;

export interface Quota {
  used:      number;
  limit:     number;
  remaining: number;
  isLimited: boolean;
}

function key(email: string) {
  return "brq_q_" + email.toLowerCase().trim();
}

export function getQuota(email: string): Quota {
  if (typeof window === "undefined" || !email) {
    return { used: 0, limit: FREE_LIMIT, remaining: FREE_LIMIT, isLimited: false };
  }
  try {
    const raw  = localStorage.getItem(key(email));
    const used = raw ? (JSON.parse(raw) as { used: number }).used : 0;
    const clamped = Math.max(0, used);
    return {
      used:      clamped,
      limit:     FREE_LIMIT,
      remaining: Math.max(0, FREE_LIMIT - clamped),
      isLimited: clamped >= FREE_LIMIT,
    };
  } catch {
    return { used: 0, limit: FREE_LIMIT, remaining: FREE_LIMIT, isLimited: false };
  }
}

/**
 * Sync quota from backend (source of truth) into localStorage.
 * Call once on dashboard load; the server value wins over localStorage.
 */
export async function syncWithServer(apiToken: string, apiBase: string): Promise<void> {
  try {
    const res = await fetch(`${apiBase}/billing/status`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    const email: string = data.email ?? "";
    if (!email || typeof window === "undefined") return;
    const serverUsed = typeof data.free_queries_used === "number" ? data.free_queries_used : 0;
    localStorage.setItem(key(email), JSON.stringify({ used: serverUsed }));
  } catch {
    // Network failure — keep localStorage value
  }
}

// Returns true if the query is allowed (and records it), false if quota exhausted.
export function consumeQuery(email: string): boolean {
  if (typeof window === "undefined" || !email) return true; // SSR: fail open
  try {
    const { used, isLimited } = getQuota(email);
    if (isLimited) return false;

    const newUsed = used + 1;
    localStorage.setItem(key(email), JSON.stringify({ used: newUsed }));

    if (newUsed >= FREE_LIMIT) {
      // Notify backend — fire and forget
      fetch("/api/quota-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reachedAt: new Date().toISOString() }),
      }).catch(() => {});
    }
    return true;
  } catch {
    return true; // storage unavailable — fail open
  }
}
