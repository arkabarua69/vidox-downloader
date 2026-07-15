const cache = new Map();
const DEFAULT_TTL = 60 * 60 * 1000; // 1 hour

export function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    cache.delete(key);
    return null;
  }
  return item.value;
}

export function setCache(key, value, ttl = DEFAULT_TTL) {
  // Limit cache size to 500 entries
  if (cache.size > 500) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, { value, expires: Date.now() + ttl });
}

export function getCacheStats() {
  return { size: cache.size, keys: [...cache.keys()].slice(0, 10) };
}
