/**
 * A simple in-memory cache with TTL and size limits.
 * Suitable for catalog data that doesn't change frequently.
 */
export class MemoryCache<K, V> {
  private cache = new Map<K, { value: V; expires: number }>();
  private ttl: number;
  private maxSize: number;

  constructor(ttlMs: number = 600000, maxSize: number = 1000) {
    this.ttl = ttlMs;
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize) {
      // Very naive eviction: clear oldest entries if full
      // In a real LRU this would be more sophisticated
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + this.ttl
    });
  }

  clear(): void {
    this.cache.clear();
  }

  getMany(keys: K[]): { found: Map<K, V>; missing: K[] } {
    const found = new Map<K, V>();
    const missing: K[] = [];

    for (const key of keys) {
      const val = this.get(key);
      if (val !== undefined) {
        found.set(key, val);
      } else {
        missing.push(key);
      }
    }

    return { found, missing };
  }

  setMany(entries: [K, V][]): void {
    for (const [key, value] of entries) {
      this.set(key, value);
    }
  }
}
