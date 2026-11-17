/**
 * Very small in-memory rate limiter.
 *
 * It only protects a single Node process, which is enough for local use and
 * small deployments. If the app is scaled horizontally, swap this for a
 * shared store (Redis, Upstash, ...).
 */
const buckets = new Map();

const MAX_BUCKETS = 5000;

function prune(now) {
  if (buckets.size < MAX_BUCKETS) {
    return;
  }

  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function rateLimit(key, { limit = 10, windowMs = 60_000 } = {}) {
  const now = Date.now();
  prune(now);

  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;

  return { allowed: true, remaining: limit - entry.count };
}

export function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") || "unknown";
}
