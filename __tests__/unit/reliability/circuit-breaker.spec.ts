import { describe, it, expect, vi, afterEach } from 'vitest';
import { CircuitBreaker } from '../../../src/circuit-breaker/circuit-breaker.js';
import { CircuitBreakerOpenError } from '../../../src/errors/circuit-breaker.error.js';

describe('CircuitBreaker', () => {
  let cb: CircuitBreaker;

  afterEach(() => {
    cb?.destroy();
  });

  // CB-1: Failures exceed threshold, circuit opens
  it('opens after failures exceed threshold', () => {
    cb = new CircuitBreaker({ failureThreshold: 3, resetTimeout: 60_000 });

    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getState()).toBe('closed');

    cb.recordFailure();
    expect(cb.getState()).toBe('open');
    expect(cb.getFailures()).toBe(3);
  });

  // CB-2: Send during open state throws CircuitBreakerOpenError
  it('throws CircuitBreakerOpenError when circuit is open', () => {
    cb = new CircuitBreaker({ failureThreshold: 1, resetTimeout: 60_000 });
    cb.recordFailure();
    expect(cb.getState()).toBe('open');

    expect(() => { cb.guard(); }).toThrow(CircuitBreakerOpenError);
    expect(() => { cb.guard(); }).toThrow(/Circuit breaker is open/);
  });

  // CB-3: After resetTimeout, transitions to half-open
  it('transitions to half-open after resetTimeout', async () => {
    vi.useFakeTimers();
    try {
      cb = new CircuitBreaker({ failureThreshold: 1, resetTimeout: 100 });
      cb.recordFailure();
      expect(cb.getState()).toBe('open');

      vi.advanceTimersByTime(100);
      expect(cb.getState()).toBe('half-open');
    } finally {
      vi.useRealTimers();
    }
  });

  // CB-4: Successful probe in half-open closes circuit
  it('closes circuit on successful probe in half-open', () => {
    vi.useFakeTimers();
    try {
      cb = new CircuitBreaker({ failureThreshold: 1, resetTimeout: 100, halfOpenRequests: 1 });
      cb.recordFailure();
      expect(cb.getState()).toBe('open');

      vi.advanceTimersByTime(100);
      expect(cb.getState()).toBe('half-open');

      cb.guard();
      cb.recordSuccess();
      expect(cb.getState()).toBe('closed');
      expect(cb.getFailures()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  // CB-5: Failed probe in half-open re-opens circuit
  it('re-opens circuit on failed probe in half-open', () => {
    vi.useFakeTimers();
    try {
      cb = new CircuitBreaker({ failureThreshold: 1, resetTimeout: 100, halfOpenRequests: 1 });
      cb.recordFailure();
      vi.advanceTimersByTime(100);
      expect(cb.getState()).toBe('half-open');

      cb.guard();
      cb.recordFailure();
      expect(cb.getState()).toBe('open');
    } finally {
      vi.useRealTimers();
    }
  });

  // CB-6: onStateChange callback fires on transitions
  it('emits state changes via callback', () => {
    const onStateChange = vi.fn();
    cb = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 60_000 }, onStateChange);

    cb.recordFailure();
    cb.recordFailure();

    expect(onStateChange).toHaveBeenCalledWith('open', 2);
  });
});
