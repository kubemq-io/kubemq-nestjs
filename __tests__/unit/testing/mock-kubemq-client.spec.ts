import { describe, it, expect } from 'vitest';
import { MockKubeMQClient } from '../../../src/testing/mock-kubemq-client.js';

describe('MockKubeMQClient', () => {
  it('setCircuitBreakerState / getCircuitBreakerState round-trips', () => {
    const mock = new MockKubeMQClient();
    expect(mock.getCircuitBreakerState()).toBe('closed');

    mock.setCircuitBreakerState('open');
    expect(mock.getCircuitBreakerState()).toBe('open');

    mock.setCircuitBreakerState('half-open');
    expect(mock.getCircuitBreakerState()).toBe('half-open');
  });

  it('setCorrelationId / getCorrelationId round-trips', () => {
    const mock = new MockKubeMQClient();
    expect(mock.getCorrelationId()).toBeUndefined();

    mock.setCorrelationId('abc-123');
    expect(mock.getCorrelationId()).toBe('abc-123');
  });

  it('reset clears circuit breaker state and correlation ID', () => {
    const mock = new MockKubeMQClient();
    mock.setCircuitBreakerState('open');
    mock.setCorrelationId('xyz');

    mock.reset();

    expect(mock.getCircuitBreakerState()).toBe('closed');
    expect(mock.getCorrelationId()).toBeUndefined();
  });
});
