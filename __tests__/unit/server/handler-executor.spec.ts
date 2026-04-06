import { describe, it, expect } from 'vitest';
import { of, EMPTY } from 'rxjs';
import { HandlerExecutor } from '../../../src/server/handler-executor.js';

describe('HandlerExecutor', () => {
  it('track() adds and removes from inflight set', async () => {
    const executor = new HandlerExecutor();
    let resolve: () => void;
    const pending = new Promise<void>((r) => { resolve = r; });

    const tracked = executor.track(async () => {
      await pending;
    });

    expect((executor as any).inflight.size).toBe(1);
    resolve!();
    await tracked;
    expect((executor as any).inflight.size).toBe(0);
  });

  it('executeRpc resolves with first emitted value', async () => {
    const executor = new HandlerExecutor();
    const result = await executor.executeRpc(of('hello'), 5000);
    expect(result).toBe('hello');
  });

  it('executeWithDefault resolves undefined for EMPTY observable', async () => {
    const executor = new HandlerExecutor();
    const result = await executor.executeWithDefault(EMPTY, 5000);
    expect(result).toBeUndefined();
  });

  it('drain() waits for in-flight work to complete', async () => {
    const executor = new HandlerExecutor();
    let resolved = false;

    executor.track(async () => {
      await new Promise<void>((r) => setTimeout(r, 50));
      resolved = true;
    });

    expect((executor as any).inflight.size).toBe(1);
    await executor.drain(5000);
    expect(resolved).toBe(true);
  });

  it('drain() returns immediately when no in-flight work', async () => {
    const executor = new HandlerExecutor();
    const start = Date.now();
    await executor.drain(5000);
    expect(Date.now() - start).toBeLessThan(100);
  });

  it('drain() respects timeout and resolves even if work is slow', async () => {
    const executor = new HandlerExecutor();

    executor.track(async () => {
      await new Promise<void>((r) => setTimeout(r, 10_000));
    });

    const start = Date.now();
    await executor.drain(50);
    expect(Date.now() - start).toBeLessThan(500);
  });
});
