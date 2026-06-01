export class CircuitBreakerOpenError extends Error {
  readonly name = 'CircuitBreakerOpenError';
  constructor(public readonly state: 'open' | 'half-open') {
    super(`Circuit breaker is ${state} — request rejected`);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
