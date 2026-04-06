import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReconnectManager } from '../../../src/server/reconnect-manager.js';

describe('ReconnectManager', () => {
  const mockLogger = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn(),
    fatal: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('startLoop does nothing when closing', () => {
    const mgr = new ReconnectManager(() => undefined, mockLogger);
    mgr.cancelLoop();

    const connectFn = vi.fn().mockResolvedValue(undefined);
    mgr.startLoop(connectFn, vi.fn());

    vi.advanceTimersByTime(60_000);
    expect(connectFn).not.toHaveBeenCalled();
  });

  it('scheduleRetry calls onExhausted when maxAttempts reached', () => {
    const mgr = new ReconnectManager(
      () => ({ maxAttempts: 0, initialDelayMs: 100, maxDelayMs: 1000, multiplier: 2, jitter: 'none' as const }),
      mockLogger,
    );

    const connectFn = vi.fn();
    const onExhausted = vi.fn();
    mgr.startLoop(connectFn, onExhausted);

    expect(onExhausted).toHaveBeenCalledOnce();
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Reconnection attempts exhausted'),
    );
  });

  it('successful connectFn resets attempt counter', async () => {
    const mgr = new ReconnectManager(
      () => ({ maxAttempts: 5, initialDelayMs: 100, maxDelayMs: 1000, multiplier: 2, jitter: 'none' as const }),
      mockLogger,
    );

    const connectFn = vi.fn().mockResolvedValue(undefined);
    mgr.startLoop(connectFn, vi.fn());

    await vi.advanceTimersByTimeAsync(100);

    expect(connectFn).toHaveBeenCalledOnce();
  });

  it('failed connectFn increments attempt and schedules retry', async () => {
    const mgr = new ReconnectManager(
      () => ({ maxAttempts: 3, initialDelayMs: 100, maxDelayMs: 5000, multiplier: 2, jitter: 'none' as const }),
      mockLogger,
    );

    const connectFn = vi.fn().mockRejectedValue(new Error('fail'));
    mgr.startLoop(connectFn, vi.fn());

    await vi.advanceTimersByTimeAsync(100);
    expect(connectFn).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Reconnection attempt 1/3 failed'),
    );

    await vi.advanceTimersByTimeAsync(200);
    expect(connectFn).toHaveBeenCalledTimes(2);
  });

  it('timer callback short-circuits when _closing is true', async () => {
    const mgr = new ReconnectManager(
      () => ({ maxAttempts: -1, initialDelayMs: 100, maxDelayMs: 1000, multiplier: 2, jitter: 'none' as const }),
      mockLogger,
    );

    const connectFn = vi.fn().mockResolvedValue(undefined);
    mgr.startLoop(connectFn, vi.fn());

    mgr.cancelLoop();

    await vi.advanceTimersByTimeAsync(200);
    expect(connectFn).not.toHaveBeenCalled();
  });

  it('cancelLoop clears pending timer', () => {
    const mgr = new ReconnectManager(
      () => ({ maxAttempts: -1, initialDelayMs: 500, maxDelayMs: 5000, multiplier: 2, jitter: 'none' as const }),
      mockLogger,
    );

    mgr.startLoop(vi.fn(), vi.fn());
    mgr.cancelLoop();

    expect(mgr.isClosing).toBe(true);
  });

  it('markClosing sets closing flag', () => {
    const mgr = new ReconnectManager(() => undefined, mockLogger);
    expect(mgr.isClosing).toBe(false);
    mgr.markClosing();
    expect(mgr.isClosing).toBe(true);
  });
});
