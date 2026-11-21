// In-memory sliding-window rate limiter (one replica, so memory is enough).

export function createRateLimiter({ limit, windowMs }) {
  const hits = new Map(); // key -> array of timestamps

  function prune(now) {
    for (const [key, times] of hits) {
      const fresh = times.filter((t) => now - t < windowMs);
      if (fresh.length) hits.set(key, fresh);
      else hits.delete(key);
    }
  }

  const timer = setInterval(() => prune(Date.now()), Math.min(windowMs, 10 * 60_000));
  timer.unref?.();

  return {
    /** Record a hit for key; returns {ok, retryAfter} (seconds). */
    hit(key) {
      const now = Date.now();
      const times = (hits.get(key) || []).filter((t) => now - t < windowMs);
      if (times.length >= limit) {
        hits.set(key, times);
        return { ok: false, retryAfter: Math.max(1, Math.ceil((times[0] + windowMs - now) / 1000)) };
      }
      times.push(now);
      hits.set(key, times);
      return { ok: true, retryAfter: 0 };
    },
    reset() {
      hits.clear();
    },
    stop() {
      clearInterval(timer);
    },
  };
}
