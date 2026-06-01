import { describe, it, expect, vi, afterEach } from 'vitest';
import { IdempotencyCache } from '../../../src/server/idempotency-cache.js';

describe('IdempotencyCache', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // ID-1: Duplicate key within TTL auto-acks without handler
  it('detects duplicate key within TTL', () => {
    const cache = new IdempotencyCache(100, 60);
    cache.add('key-1');

    expect(cache.has('key-1')).toBe(true);
    expect(cache.size).toBe(1);
  });

  // ID-2: Different key processes normally
  it('returns false for unseen keys', () => {
    const cache = new IdempotencyCache(100, 60);
    cache.add('key-1');

    expect(cache.has('key-2')).toBe(false);
  });

  // ID-3: Key expires after TTL, re-processing allowed
  it('expires keys after TTL', () => {
    vi.useFakeTimers();
    const cache = new IdempotencyCache(100, 1); // 1 second TTL
    cache.add('key-1');
    expect(cache.has('key-1')).toBe(true);

    vi.advanceTimersByTime(1_100);
    expect(cache.has('key-1')).toBe(false);
  });

  // ID-5: clear() removes all entries
  it('clear() removes all entries and resets size to 0', () => {
    const cache = new IdempotencyCache(100, 60);
    cache.add('key-1');
    cache.add('key-2');
    cache.add('key-3');
    expect(cache.size).toBe(3);

    cache.clear();

    expect(cache.size).toBe(0);
    expect(cache.has('key-1')).toBe(false);
    expect(cache.has('key-2')).toBe(false);
    expect(cache.has('key-3')).toBe(false);
  });

  // ID-6: Adding entries after clear() works normally
  it('accepts new entries after clear()', () => {
    const cache = new IdempotencyCache(100, 60);
    cache.add('before');
    cache.clear();

    cache.add('after');
    expect(cache.has('after')).toBe(true);
    expect(cache.size).toBe(1);
  });

  // ID-4: Cache evicts oldest entries at maxCacheSize
  it('evicts oldest entries when reaching maxCacheSize', () => {
    const cache = new IdempotencyCache(3, 300);
    cache.add('a');
    cache.add('b');
    cache.add('c');
    expect(cache.size).toBe(3);

    cache.add('d');
    expect(cache.size).toBe(3);
    expect(cache.has('a')).toBe(false);
    expect(cache.has('b')).toBe(true);
    expect(cache.has('c')).toBe(true);
    expect(cache.has('d')).toBe(true);
  });
});
