import { describe, it, expect } from 'vitest';
import { ConfigurationError } from '../../../src/errors/configuration.error.js';
import { DuplicateMessageError } from '../../../src/errors/idempotency.error.js';
import { DeadLetterError } from '../../../src/errors/dlq.error.js';
import { CircuitBreakerOpenError } from '../../../src/errors/circuit-breaker.error.js';
import { BackpressureOverflowError } from '../../../src/errors/backpressure-overflow.error.js';
import { MessageValidationError } from '../../../src/errors/validation.error.js';

describe('Error Types', () => {
  describe('ConfigurationError', () => {
    it('sets name and preserves message', () => {
      const err = new ConfigurationError('host is required');
      expect(err.name).toBe('ConfigurationError');
      expect(err.message).toBe('host is required');
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('DuplicateMessageError', () => {
    it('formats message with channel and idempotency key', () => {
      const err = new DuplicateMessageError('orders.create', 'key-abc');
      expect(err.name).toBe('DuplicateMessageError');
      expect(err.message).toBe(
        'Duplicate message on "orders.create" with idempotency key "key-abc"',
      );
      expect(err.channel).toBe('orders.create');
      expect(err.idempotencyKey).toBe('key-abc');
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('DeadLetterError', () => {
    it('sets name, message, and exposes properties', () => {
      const cause = new Error('handler crashed');
      const err = new DeadLetterError('src-ch', 'dlq-ch', 3, cause);
      expect(err.name).toBe('DeadLetterError');
      expect(err.message).toBe(
        'Message routed to DLQ "dlq-ch" after 3 retries on "src-ch"',
      );
      expect(err.sourceChannel).toBe('src-ch');
      expect(err.dlqChannel).toBe('dlq-ch');
      expect(err.retryCount).toBe(3);
      expect(err.originalError).toBe(cause);
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('CircuitBreakerOpenError', () => {
    it('constructs with open state', () => {
      const err = new CircuitBreakerOpenError('open');
      expect(err.name).toBe('CircuitBreakerOpenError');
      expect(err.message).toBe('Circuit breaker is open — request rejected');
      expect(err.state).toBe('open');
      expect(err).toBeInstanceOf(Error);
    });

    it('constructs with half-open state', () => {
      const err = new CircuitBreakerOpenError('half-open');
      expect(err.name).toBe('CircuitBreakerOpenError');
      expect(err.message).toBe('Circuit breaker is half-open — request rejected');
      expect(err.state).toBe('half-open');
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('BackpressureOverflowError', () => {
    it('sets name, message, and exposes properties', () => {
      const err = new BackpressureOverflowError('events.high', 500);
      expect(err.name).toBe('BackpressureOverflowError');
      expect(err.message).toBe(
        'Backpressure queue exceeded max depth (500) on "events.high" ' +
          '(queue: nack/requeue; non-queue: dropped)',
      );
      expect(err.channel).toBe('events.high');
      expect(err.maxQueueDepth).toBe(500);
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('MessageValidationError', () => {
    it('sets name, message, and exposes violations array', () => {
      const violations = [
        { property: 'amount', constraints: { isPositive: 'amount must be positive' } },
        { property: 'email', constraints: { isEmail: 'email must be valid' } },
      ];
      const err = new MessageValidationError('orders.create', violations);
      expect(err.name).toBe('MessageValidationError');
      expect(err.message).toBe(
        'Message validation failed on "orders.create": 2 violation(s)',
      );
      expect(err.channel).toBe('orders.create');
      expect(err.violations).toBe(violations);
      expect(err.violations).toHaveLength(2);
      expect(err).toBeInstanceOf(Error);
    });
  });
});
