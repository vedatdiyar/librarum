/**
 * A simple in-memory LRU cache with TTL and size limits.
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

    // Refresh TTL and move to end (most recently used)
    entry.expires = Date.now() + this.ttl;
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key: K, value: V): void {
    // Evict least recently used entries if cache is full
    while (this.cache.size >= this.maxSize) {
      // Map preserves insertion order; first key is the LRU
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      } else {
        break;
      }
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
