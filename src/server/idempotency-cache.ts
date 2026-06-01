interface CacheEntry {
  key: string;
  expiresAt: number;
}

export class IdempotencyCache {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly order: string[] = [];
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(maxSize = 10_000, ttlSeconds = 300) {
    this.maxSize = maxSize;
    this.ttlMs = ttlSeconds * 1000;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  add(key: string): void {
    if (this.cache.has(key)) return;

    while (this.cache.size >= this.maxSize && this.order.length > 0) {
      const oldest = this.order.shift()!;
      this.cache.delete(oldest);
    }

    const entry: CacheEntry = { key, expiresAt: Date.now() + this.ttlMs };
    this.cache.set(key, entry);
    this.order.push(key);
  }

  get size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
    this.order.length = 0;
  }
}
