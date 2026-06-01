import { CircuitBreakerOpenError } from '../errors/circuit-breaker.error.js';
import type { CircuitBreakerOptions } from '../interfaces/kubemq-client-options.interface.js';

export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private state: CircuitBreakerState = 'closed';
  private failures = 0;
  private halfOpenAllowed = 0;
  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly halfOpenRequests: number;
  private readonly onStateChange?: (state: CircuitBreakerState, failures: number) => void;

  constructor(
    options: CircuitBreakerOptions,
    onStateChange?: (state: CircuitBreakerState, failures: number) => void,
  ) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 30_000;
    this.halfOpenRequests = options.halfOpenRequests ?? 1;
    this.onStateChange = onStateChange;
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }

  guard(): void {
    if (this.state === 'open') {
      throw new CircuitBreakerOpenError('open');
    }
    if (this.state === 'half-open') {
      if (this.halfOpenAllowed <= 0) {
        throw new CircuitBreakerOpenError('half-open');
      }
      this.halfOpenAllowed--;
    }
  }

  recordSuccess(): void {
    if (this.state === 'half-open') {
      this.transitionTo('closed');
    }
    this.failures = 0;
  }

  recordFailure(): void {
    this.failures++;
    if (this.state === 'half-open') {
      this.transitionTo('open');
      return;
    }
    if (this.state === 'closed' && this.failures >= this.failureThreshold) {
      this.transitionTo('open');
    }
  }

  destroy(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  private transitionTo(newState: CircuitBreakerState): void {
    if (this.state === newState) return;
    this.state = newState;

    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }

    if (newState === 'open') {
      this.resetTimer = setTimeout(() => {
        this.halfOpenAllowed = this.halfOpenRequests;
        this.transitionTo('half-open');
      }, this.resetTimeout);
      this.resetTimer.unref();
    }

    if (newState === 'closed') {
      this.failures = 0;
    }

    this.onStateChange?.(newState, this.failures);
  }
}
