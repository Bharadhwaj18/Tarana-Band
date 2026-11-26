// A simple in-memory limiter for the public order-lookup forms. It is per server instance, so it only slows
// down someone hammering one instance; it is not a hard guarantee. Good enough to stop the "email me a link"
// form being used to spam someone, together with the same answer being given whether or not an email has orders.

const hits = new Map<string, number[]>();

/** Returns true if this call is allowed, false once `max` calls happened in the last `windowMs` */
export function allow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    // keep memory bounded: drop everything that has expired
    for (const [k, v] of Array.from(hits.entries())) {
      if (!v.some((t) => now - t < windowMs)) hits.delete(k);
    }
  }
  return true;
}

export function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}
