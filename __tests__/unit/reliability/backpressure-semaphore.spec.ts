import { describe, it, expect } from 'vitest';
import { BackpressureSemaphore } from '../../../src/server/backpressure-semaphore.js';
import { BackpressureOverflowError } from '../../../src/errors/backpressure-overflow.error.js';

describe('BackpressureSemaphore', () => {
  // BP-1: concurrency=2, third message queued
  it('queues messages beyond the concurrency limit', async () => {
    const sem = new BackpressureSemaphore(2, 10, 'test-channel');

    await sem.acquire(false);
    await sem.acquire(false);
    expect(sem.active).toBe(2);

    let thirdResolved = false;
    const thirdPromise = sem.acquire(false).then(() => { thirdResolved = true; });

    expect(sem.pending).toBe(1);
    expect(thirdResolved).toBe(false);

    sem.release();
    await thirdPromise;
    expect(thirdResolved).toBe(true);
  });

  // BP-2: Queued messages processed in FIFO order
  it('processes queued messages in FIFO order', async () => {
    const sem = new BackpressureSemaphore(1, 10, 'test-channel');
    const order: number[] = [];

    await sem.acquire(false);

    const p1 = sem.acquire(false).then(() => { order.push(1); });
    const p2 = sem.acquire(false).then(() => { order.push(2); });

    sem.release();
    await p1;
    sem.release();
    await p2;

    expect(order).toEqual([1, 2]);
  });

  // BP-3: Overflow throws BackpressureOverflowError
  it('throws BackpressureOverflowError when queue exceeds max depth', async () => {
    const sem = new BackpressureSemaphore(1, 1, 'orders');

    await sem.acquire(false);
    // fill the queue
    sem.acquire(false);

    await expect(sem.acquire(true)).rejects.toThrow(BackpressureOverflowError);
    await expect(sem.acquire(false)).rejects.toThrow(/Backpressure queue exceeded max depth/);
  });
});
