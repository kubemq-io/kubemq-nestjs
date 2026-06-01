import { describe, it, expect, vi } from 'vitest';

const {
  KubeMQError,
  ConnectionError,
  AuthenticationError,
  AuthorizationError,
  KubeMQTimeoutError,
  ValidationError,
  KjsConfigurationError,
  TransientError,
  ThrottlingError,
  NotFoundError,
  FatalError,
  CancellationError,
  BufferFullError,
  StreamBrokenError,
  ClientClosedError,
  ConnectionNotReadyError,
  RetryExhaustedError,
  NotImplementedError,
  PartialFailureError,
} = vi.hoisted(() => {
  class KubeMQError extends Error {
    code = '';
    category = '';
    channel?: string;
    constructor(msg: string) { super(msg); this.name = 'KubeMQError'; }
  }
  class ConnectionError extends KubeMQError {
    constructor(msg = 'conn') { super(msg); this.code = 'CONNECTION'; this.category = 'Connection'; }
  }
  class AuthenticationError extends KubeMQError {
    constructor(msg = 'auth') { super(msg); this.code = 'AUTH'; this.category = 'Authentication'; }
  }
  class AuthorizationError extends KubeMQError {
    constructor(msg = 'authz') { super(msg); this.code = 'AUTHZ'; this.category = 'Authorization'; }
  }
  class KubeMQTimeoutError extends KubeMQError {
    constructor(msg = 'timeout') { super(msg); this.code = 'TIMEOUT'; this.category = 'Timeout'; }
  }
  class ValidationError extends KubeMQError {
    constructor(msg = 'validation') { super(msg); this.code = 'VALIDATION'; this.category = 'Validation'; }
  }
  class KjsConfigurationError extends KubeMQError {
    constructor(msg = 'config') { super(msg); this.code = 'CONFIG'; this.category = 'Configuration'; }
  }
  class TransientError extends KubeMQError {
    constructor(msg = 'transient') { super(msg); this.code = 'TRANSIENT'; this.category = 'Transient'; }
  }
  class ThrottlingError extends KubeMQError {
    constructor(msg = 'throttle') { super(msg); this.code = 'THROTTLE'; this.category = 'Throttling'; }
  }
  class NotFoundError extends KubeMQError {
    constructor(msg = 'not found') { super(msg); this.code = 'NOT_FOUND'; this.category = 'NotFound'; }
  }
  class FatalError extends KubeMQError {
    constructor(msg = 'fatal') { super(msg); this.code = 'FATAL'; this.category = 'Fatal'; }
  }
  class CancellationError extends KubeMQError {
    constructor(msg = 'cancel') { super(msg); this.code = 'CANCEL'; this.category = 'Cancellation'; }
  }
  class BufferFullError extends KubeMQError {
    constructor(msg = 'buffer full') { super(msg); this.code = 'BUFFER_FULL'; this.category = 'Buffer'; }
  }
  class StreamBrokenError extends KubeMQError {
    constructor(msg = 'stream broken') { super(msg); this.code = 'STREAM_BROKEN'; this.category = 'Stream'; }
  }
  class ClientClosedError extends KubeMQError {
    constructor(msg = 'closed') { super(msg); this.code = 'CLIENT_CLOSED'; this.category = 'Fatal'; }
  }
  class ConnectionNotReadyError extends KubeMQError {
    constructor(msg = 'not ready') { super(msg); this.code = 'CONN_NOT_READY'; this.category = 'Connection'; }
  }
  class RetryExhaustedError extends KubeMQError {
    constructor(msg = 'retry') { super(msg); this.code = 'RETRY_EXHAUSTED'; this.category = 'Retry'; }
  }
  class NotImplementedError extends KubeMQError {
    constructor(msg = 'not impl') { super(msg); this.code = 'NOT_IMPL'; this.category = 'NotImplemented'; }
  }
  class PartialFailureError extends KubeMQError {
    constructor(msg = 'partial') { super(msg); this.code = 'PARTIAL'; this.category = 'Partial'; }
  }

  return {
    KubeMQError, ConnectionError, AuthenticationError, AuthorizationError,
    KubeMQTimeoutError, ValidationError, KjsConfigurationError, TransientError,
    ThrottlingError, NotFoundError, FatalError, CancellationError,
    BufferFullError, StreamBrokenError, ClientClosedError, ConnectionNotReadyError,
    RetryExhaustedError, NotImplementedError, PartialFailureError,
  };
});

vi.mock('kubemq-js', () => ({
  KubeMQError, ConnectionError, AuthenticationError, AuthorizationError,
  KubeMQTimeoutError, ValidationError, ConfigurationError: KjsConfigurationError,
  TransientError, ThrottlingError, NotFoundError, FatalError, CancellationError,
  BufferFullError, StreamBrokenError, ClientClosedError, ConnectionNotReadyError,
  RetryExhaustedError, NotImplementedError, PartialFailureError,
}));

import { ConfigurationError } from '../../../src/errors/configuration.error.js';
import { DuplicateMessageError } from '../../../src/errors/idempotency.error.js';
import { CircuitBreakerOpenError } from '../../../src/errors/circuit-breaker.error.js';
import { mapErrorToRpcException, mapToRpcException } from '../../../src/errors/error-mapper.js';

describe('Error Classes & Mapping', () => {
  describe('ConfigurationError', () => {
    it('sets name to ConfigurationError and preserves message', () => {
      const err = new ConfigurationError('missing host option');
      expect(err.name).toBe('ConfigurationError');
      expect(err.message).toBe('missing host option');
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('DuplicateMessageError', () => {
    it('formats message with channel and idempotency key', () => {
      const err = new DuplicateMessageError('orders.create', 'idem-key-123');
      expect(err.name).toBe('DuplicateMessageError');
      expect(err.message).toBe(
        'Duplicate message on "orders.create" with idempotency key "idem-key-123"',
      );
      expect(err.channel).toBe('orders.create');
      expect(err.idempotencyKey).toBe('idem-key-123');
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('mapErrorToRpcException — CircuitBreakerOpenError', () => {
    it('maps to status 503 with full message when verbose=true', () => {
      const cbErr = new CircuitBreakerOpenError('open');
      const exc = mapErrorToRpcException(cbErr, 'test-channel', true);
      const detail = exc.getError() as Record<string, unknown>;
      expect(detail.statusCode).toBe(503);
      expect(detail.message).toBe('Circuit breaker is open — request rejected');
      expect(detail.kubemqCode).toBe('CIRCUIT_BREAKER_OPEN');
      expect(detail.kubemqCategory).toBe('Transient');
      expect(detail.channel).toBe('test-channel');
    });

    it('maps to status 503 with sanitized message when verbose=false', () => {
      const cbErr = new CircuitBreakerOpenError('open');
      const exc = mapErrorToRpcException(cbErr, 'test-channel', false);
      const detail = exc.getError() as Record<string, unknown>;
      expect(detail.statusCode).toBe(503);
      expect(detail.message).toBe('Transport operation failed');
      expect(detail.kubemqCode).toBe('CIRCUIT_BREAKER_OPEN');
    });

    it('maps half-open state to status 503', () => {
      const cbErr = new CircuitBreakerOpenError('half-open');
      const exc = mapErrorToRpcException(cbErr, 'ch', true);
      const detail = exc.getError() as Record<string, unknown>;
      expect(detail.statusCode).toBe(503);
      expect(detail.message).toBe('Circuit breaker is half-open — request rejected');
      expect(detail.kubemqCode).toBe('CIRCUIT_BREAKER_OPEN');
      expect(detail.kubemqCategory).toBe('Transient');
    });
  });

  describe('mapErrorToRpcException — kubemq-js error types', () => {
    const statusCodeMappings = [
      { name: 'AuthenticationError', error: new AuthenticationError(), status: 401 },
      { name: 'AuthorizationError', error: new AuthorizationError(), status: 403 },
      { name: 'KubeMQTimeoutError', error: new KubeMQTimeoutError(), status: 408 },
      { name: 'ValidationError', error: new ValidationError(), status: 400 },
      { name: 'ConfigurationError(kubemq)', error: new KjsConfigurationError(), status: 400 },
      { name: 'ThrottlingError', error: new ThrottlingError(), status: 429 },
      { name: 'NotFoundError', error: new NotFoundError(), status: 404 },
      { name: 'CancellationError', error: new CancellationError(), status: 499 },
      { name: 'NotImplementedError', error: new NotImplementedError(), status: 501 },
      { name: 'PartialFailureError', error: new PartialFailureError(), status: 207 },
      { name: 'ConnectionError', error: new ConnectionError(), status: 503 },
      { name: 'TransientError', error: new TransientError(), status: 503 },
      { name: 'BufferFullError', error: new BufferFullError(), status: 503 },
      { name: 'StreamBrokenError', error: new StreamBrokenError(), status: 503 },
      { name: 'ConnectionNotReadyError', error: new ConnectionNotReadyError(), status: 503 },
      { name: 'RetryExhaustedError', error: new RetryExhaustedError(), status: 503 },
      { name: 'ClientClosedError', error: new ClientClosedError(), status: 500 },
      { name: 'FatalError', error: new FatalError(), status: 500 },
    ];

    it.each(statusCodeMappings)('$name maps to status $status', ({ error, status }) => {
      const exc = mapErrorToRpcException(error, 'test-ch');
      const detail = exc.getError() as Record<string, unknown>;
      expect(detail.statusCode).toBe(status);
    });

    it('generic KubeMQError (fallback branch) maps to 500', () => {
      const err = new KubeMQError('generic');
      err.code = 'GENERIC';
      err.category = 'Unknown';
      const exc = mapErrorToRpcException(err, 'test-ch');
      const detail = exc.getError() as Record<string, unknown>;
      expect(detail.statusCode).toBe(500);
      expect(detail.kubemqCode).toBe('GENERIC');
      expect(detail.kubemqCategory).toBe('Unknown');
    });

    it('non-KubeMQError maps to 500 with UNKNOWN code', () => {
      const err = new Error('plain error');
      const exc = mapErrorToRpcException(err, 'test-ch');
      const detail = exc.getError() as Record<string, unknown>;
      expect(detail.statusCode).toBe(500);
      expect(detail.kubemqCode).toBe('UNKNOWN');
      expect(detail.kubemqCategory).toBe('Fatal');
    });
  });

  describe('mapErrorToRpcException — verbose flag', () => {
    it('verbose=true uses error message for KubeMQError subclass', () => {
      const err = new AuthenticationError('specific auth failure');
      const exc = mapErrorToRpcException(err, 'ch', true);
      expect((exc.getError() as Record<string, unknown>).message).toBe('specific auth failure');
    });

    it('verbose=false sanitizes KubeMQError message', () => {
      const err = new AuthenticationError('specific auth failure');
      const exc = mapErrorToRpcException(err, 'ch', false);
      expect((exc.getError() as Record<string, unknown>).message).toBe('Transport operation failed');
    });

    it('verbose defaults to false', () => {
      const err = new AuthenticationError('specific auth failure');
      const exc = mapErrorToRpcException(err, 'ch');
      expect((exc.getError() as Record<string, unknown>).message).toBe('Transport operation failed');
    });

    it('verbose=true uses message for non-KubeMQError', () => {
      const err = new Error('plain detail');
      const exc = mapErrorToRpcException(err, 'ch', true);
      expect((exc.getError() as Record<string, unknown>).message).toBe('plain detail');
    });

    it('verbose=false sanitizes non-KubeMQError', () => {
      const err = new Error('plain detail');
      const exc = mapErrorToRpcException(err, 'ch', false);
      expect((exc.getError() as Record<string, unknown>).message).toBe('Transport operation failed');
    });
  });

  describe('mapErrorToRpcException — channel handling', () => {
    it('uses error.channel when set on KubeMQError', () => {
      const err = new AuthenticationError();
      err.channel = 'error-channel';
      const exc = mapErrorToRpcException(err, 'passed-channel');
      expect((exc.getError() as Record<string, unknown>).channel).toBe('error-channel');
    });

    it('falls back to passed channel when error.channel is undefined', () => {
      const err = new AuthenticationError();
      const exc = mapErrorToRpcException(err, 'passed-channel');
      expect((exc.getError() as Record<string, unknown>).channel).toBe('passed-channel');
    });

    it('uses passed channel for non-KubeMQError', () => {
      const err = new Error('plain');
      const exc = mapErrorToRpcException(err, 'passed-channel');
      expect((exc.getError() as Record<string, unknown>).channel).toBe('passed-channel');
    });

    it('preserves code and category from KubeMQError', () => {
      const err = new ThrottlingError();
      const exc = mapErrorToRpcException(err, 'ch');
      const detail = exc.getError() as Record<string, unknown>;
      expect(detail.kubemqCode).toBe('THROTTLE');
      expect(detail.kubemqCategory).toBe('Throttling');
    });
  });

  describe('mapToRpcException', () => {
    it('command type with error message and verbose=true', () => {
      const exc = mapToRpcException('command', 'orders.create', 'handler crashed', true);
      const detail = exc.getError() as Record<string, unknown>;
      expect(detail.statusCode).toBe(500);
      expect(detail.message).toBe('handler crashed');
      expect(detail.kubemqCode).toBe('HANDLER_ERROR');
      expect(detail.kubemqCategory).toBe('Fatal');
      expect(detail.channel).toBe('orders.create');
    });

    it('command type without error message uses default', () => {
      const exc = mapToRpcException('command', 'orders.create', undefined, true);
      const detail = exc.getError() as Record<string, unknown>;
      expect(detail.message).toBe('command execution failed on channel orders.create');
    });

    it('query type with error message and verbose=true', () => {
      const exc = mapToRpcException('query', 'orders.get', 'query failed', true);
      const detail = exc.getError() as Record<string, unknown>;
      expect(detail.message).toBe('query failed');
      expect(detail.kubemqCode).toBe('HANDLER_ERROR');
    });

    it('query type without error message uses default', () => {
      const exc = mapToRpcException('query', 'orders.get', undefined, true);
      const detail = exc.getError() as Record<string, unknown>;
      expect(detail.message).toBe('query execution failed on channel orders.get');
    });

    it('verbose=false uses sanitized message', () => {
      const exc = mapToRpcException('command', 'ch', 'handler error', false);
      expect((exc.getError() as Record<string, unknown>).message).toBe('Transport operation failed');
    });

    it('verbose defaults to false', () => {
      const exc = mapToRpcException('command', 'ch', 'handler error');
      expect((exc.getError() as Record<string, unknown>).message).toBe('Transport operation failed');
    });
  });
});
