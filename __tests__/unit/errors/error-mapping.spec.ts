import { describe, it, expect, vi } from 'vitest';

// Use vi.hoisted() so error classes are available inside the hoisted vi.mock() factory
const {
  KubeMQError,
  ConnectionError,
  AuthenticationError,
  AuthorizationError,
  KubeMQTimeoutError,
  ValidationError,
  ConfigurationError,
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
  HandlerError,
} = vi.hoisted(() => {
  // Build a proper class hierarchy so instanceof checks work correctly
  class KubeMQError extends Error {
    code = '';
    category = '';
    channel?: string;
    constructor(msg: string, opts?: { code?: string; category?: string; channel?: string }) {
      super(msg);
      this.name = 'KubeMQError';
      if (opts?.code) this.code = opts.code;
      if (opts?.category) this.category = opts.category;
      if (opts?.channel) this.channel = opts.channel;
    }
  }
  class ConnectionError extends KubeMQError { constructor(m = 'conn') { super(m); this.name = 'ConnectionError'; this.code = 'CONNECTION'; this.category = 'Connection'; } }
  class AuthenticationError extends KubeMQError { constructor(m = 'auth') { super(m); this.name = 'AuthenticationError'; this.code = 'AUTH'; this.category = 'Authentication'; } }
  class AuthorizationError extends KubeMQError { constructor(m = 'authz') { super(m); this.name = 'AuthorizationError'; this.code = 'AUTHZ'; this.category = 'Authorization'; } }
  class KubeMQTimeoutError extends KubeMQError { constructor(m = 'timeout') { super(m); this.name = 'KubeMQTimeoutError'; this.code = 'TIMEOUT'; this.category = 'Timeout'; } }
  class ValidationError extends KubeMQError { constructor(m = 'validation') { super(m); this.name = 'ValidationError'; this.code = 'VALIDATION'; this.category = 'Validation'; } }
  class ConfigurationError extends KubeMQError { constructor(m = 'config') { super(m); this.name = 'ConfigurationError'; this.code = 'CONFIG'; this.category = 'Configuration'; } }
  class TransientError extends KubeMQError { constructor(m = 'transient') { super(m); this.name = 'TransientError'; this.code = 'TRANSIENT'; this.category = 'Transient'; } }
  class ThrottlingError extends KubeMQError { constructor(m = 'throttle') { super(m); this.name = 'ThrottlingError'; this.code = 'THROTTLE'; this.category = 'Throttling'; } }
  class NotFoundError extends KubeMQError { constructor(m = 'not found') { super(m); this.name = 'NotFoundError'; this.code = 'NOT_FOUND'; this.category = 'NotFound'; } }
  class FatalError extends KubeMQError { constructor(m = 'fatal') { super(m); this.name = 'FatalError'; this.code = 'FATAL'; this.category = 'Fatal'; } }
  class CancellationError extends KubeMQError { constructor(m = 'cancel') { super(m); this.name = 'CancellationError'; this.code = 'CANCEL'; this.category = 'Cancellation'; } }
  class BufferFullError extends KubeMQError { constructor(m = 'buffer') { super(m); this.name = 'BufferFullError'; this.code = 'BUFFER_FULL'; this.category = 'Buffer'; } }
  class StreamBrokenError extends KubeMQError { constructor(m = 'stream') { super(m); this.name = 'StreamBrokenError'; this.code = 'STREAM_BROKEN'; this.category = 'Stream'; } }
  class ClientClosedError extends KubeMQError { constructor(m = 'closed') { super(m); this.name = 'ClientClosedError'; this.code = 'CLIENT_CLOSED'; this.category = 'Fatal'; } }
  class ConnectionNotReadyError extends KubeMQError { constructor(m = 'not ready') { super(m); this.name = 'ConnectionNotReadyError'; this.code = 'CONN_NOT_READY'; this.category = 'Connection'; } }
  class RetryExhaustedError extends KubeMQError { constructor(m = 'retry') { super(m); this.name = 'RetryExhaustedError'; this.code = 'RETRY_EXHAUSTED'; this.category = 'Retry'; } }
  class NotImplementedError extends KubeMQError { constructor(m = 'not impl') { super(m); this.name = 'NotImplementedError'; this.code = 'NOT_IMPL'; this.category = 'NotImplemented'; } }
  class PartialFailureError extends KubeMQError { constructor(m = 'partial') { super(m); this.name = 'PartialFailureError'; this.code = 'PARTIAL'; this.category = 'Partial'; } }
  class HandlerError extends KubeMQError { constructor(m = 'handler') { super(m); this.name = 'HandlerError'; this.code = 'HANDLER'; this.category = 'Handler'; } }

  return {
    KubeMQError,
    ConnectionError,
    AuthenticationError,
    AuthorizationError,
    KubeMQTimeoutError,
    ValidationError,
    ConfigurationError,
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
    HandlerError,
  };
});

vi.mock('kubemq-js', () => ({
  KubeMQError,
  ConnectionError,
  AuthenticationError,
  AuthorizationError,
  KubeMQTimeoutError,
  ValidationError,
  ConfigurationError,
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
  HandlerError,
}));

// Import the mapper after mocking
import { mapErrorToRpcException, mapToRpcException } from '../../../src/errors/error-mapper.js';
import { KubeMQRpcException } from '../../../src/errors/kubemq-rpc.exception.js';

describe('Error Mapping', () => {
  // 16.66: ConnectionError -> 503
  it('maps ConnectionError to 503 (Service Unavailable)', () => {
    const err = new ConnectionError('connection failed');
    const result = mapErrorToRpcException(err, undefined, true);
    const error = result.getError() as any;
    expect(error.statusCode).toBe(503);
    expect(error.message).toBe('connection failed');
  });

  // 16.67: AuthenticationError -> 401
  it('maps AuthenticationError to 401 (Unauthorized)', () => {
    const err = new AuthenticationError('bad creds');
    const result = mapErrorToRpcException(err, undefined, true);
    const error = result.getError() as any;
    expect(error.statusCode).toBe(401);
  });

  // 16.68: AuthorizationError -> 403
  it('maps AuthorizationError to 403 (Forbidden)', () => {
    const err = new AuthorizationError('forbidden');
    const result = mapErrorToRpcException(err, undefined, true);
    const error = result.getError() as any;
    expect(error.statusCode).toBe(403);
  });

  // 16.69: KubeMQTimeoutError -> 408
  it('maps KubeMQTimeoutError to 408 (Request Timeout)', () => {
    const err = new KubeMQTimeoutError('timed out');
    const result = mapErrorToRpcException(err, undefined, true);
    const error = result.getError() as any;
    expect(error.statusCode).toBe(408);
  });

  // 16.70: ValidationError -> 400
  it('maps ValidationError to 400 (Bad Request)', () => {
    const err = new ValidationError('invalid data');
    const result = mapErrorToRpcException(err, undefined, true);
    const error = result.getError() as any;
    expect(error.statusCode).toBe(400);
  });

  // 16.71: ConfigurationError -> 400
  it('maps ConfigurationError to 400 (Bad Request)', () => {
    const err = new ConfigurationError('bad config');
    const result = mapErrorToRpcException(err, undefined, true);
    const error = result.getError() as any;
    expect(error.statusCode).toBe(400);
  });

  // 16.72: TransientError -> 503
  it('maps TransientError to 503 (Service Unavailable)', () => {
    const err = new TransientError('transient issue');
    const result = mapErrorToRpcException(err, undefined, true);
    const error = result.getError() as any;
    expect(error.statusCode).toBe(503);
  });

  // 16.73: ThrottlingError -> 429
  it('maps ThrottlingError to 429 (Too Many Requests)', () => {
    const err = new ThrottlingError('rate limited');
    const result = mapErrorToRpcException(err, undefined, true);
    const error = result.getError() as any;
    expect(error.statusCode).toBe(429);
  });

  // 16.74: NotFoundError -> 404
  it('maps NotFoundError to 404 (Not Found)', () => {
    const err = new NotFoundError('not found');
    const result = mapErrorToRpcException(err, undefined, true);
    const error = result.getError() as any;
    expect(error.statusCode).toBe(404);
  });

  // 16.75: FatalError -> 500
  it('maps FatalError to 500 (Internal Server Error)', () => {
    const err = new FatalError('fatal crash');
    const result = mapErrorToRpcException(err, undefined, true);
    const error = result.getError() as any;
    expect(error.statusCode).toBe(500);
  });

  // 16.76: CancellationError -> 499
  it('maps CancellationError to 499 (Client Closed Request)', () => {
    const err = new CancellationError('cancelled');
    const result = mapErrorToRpcException(err, undefined, true);
    const error = result.getError() as any;
    expect(error.statusCode).toBe(499);
  });

  // 16.77: BufferFullError -> 503
  it('maps BufferFullError to 503 (Service Unavailable)', () => {
    const err = new BufferFullError('buffer full');
    const result = mapErrorToRpcException(err, undefined, true);
    const error = result.getError() as any;
    expect(error.statusCode).toBe(503);
  });

  // 16.78: StreamBrokenError -> 503
  it('maps StreamBrokenError to 503 (Service Unavailable)', () => {
    const err = new StreamBrokenError('stream broken');
    const result = mapErrorToRpcException(err, undefined, true);
    const error = result.getError() as any;
    expect(error.statusCode).toBe(503);
  });

  // 16.79: ClientClosedError -> 500
  it('maps ClientClosedError to 500 (Internal Server Error)', () => {
    const err = new ClientClosedError('client closed');
    const result = mapErrorToRpcException(err, undefined, true);
    const error = result.getError() as any;
    expect(error.statusCode).toBe(500);
  });

  // 16.80: ConnectionNotReadyError -> 503
  it('maps ConnectionNotReadyError to 503 (Service Unavailable)', () => {
    const err = new ConnectionNotReadyError('not ready');
    const result = mapErrorToRpcException(err, undefined, true);
    const error = result.getError() as any;
    expect(error.statusCode).toBe(503);
  });

  // 16.81: RetryExhaustedError -> 503
  it('maps RetryExhaustedError to 503 (Service Unavailable)', () => {
    const err = new RetryExhaustedError('retries exhausted');
    const result = mapErrorToRpcException(err, undefined, true);
    const error = result.getError() as any;
    expect(error.statusCode).toBe(503);
  });

  // 16.82: NotImplementedError -> 501
  it('maps NotImplementedError to 501 (Not Implemented)', () => {
    const err = new NotImplementedError('not implemented');
    const result = mapErrorToRpcException(err, undefined, true);
    const error = result.getError() as any;
    expect(error.statusCode).toBe(501);
  });

  // 16.83: PartialFailureError -> 207
  it('maps PartialFailureError to 207 (Multi-Status)', () => {
    const err = new PartialFailureError('partial failure');
    const result = mapErrorToRpcException(err, undefined, true);
    const error = result.getError() as any;
    expect(error.statusCode).toBe(207);
  });

  // 16.84: HandlerError -> 500 (via default KubeMQError fallback)
  it('maps HandlerError to 500 (Internal Server Error) via default', () => {
    const err = new HandlerError('handler error');
    const result = mapErrorToRpcException(err, undefined, true);
    const error = result.getError() as any;
    expect(error.statusCode).toBe(500);
  });

  // 16.85: Unknown error (non-KubeMQError) -> 500 UNKNOWN
  it('maps unknown non-KubeMQError to 500 with kubemqCode UNKNOWN', () => {
    const err = new Error('something unexpected');
    const result = mapErrorToRpcException(err);
    const error = result.getError() as any;
    expect(error.statusCode).toBe(500);
    expect(error.kubemqCode).toBe('UNKNOWN');
    expect(error.kubemqCategory).toBe('Fatal');
    expect(error.message).toBe('Transport operation failed');
  });

  // 16.86: Non-executed command/query response -> 500 via mapToRpcException
  it('maps non-executed response to KubeMQRpcException(500)', () => {
    const result = mapToRpcException('command', 'orders.create', 'handler failed', true);
    expect(result).toBeInstanceOf(KubeMQRpcException);
    const error = result.getError() as any;
    expect(error.statusCode).toBe(500);
    expect(error.kubemqCode).toBe('HANDLER_ERROR');
    expect(error.message).toBe('handler failed');
    expect(error.channel).toBe('orders.create');
  });

  // 16.87: Error includes kubemqCode, category, channel fields
  it('includes kubemqCode, kubemqCategory, channel in the error', () => {
    const err = new ConnectionError('conn failed');
    err.channel = 'test-channel';
    const result = mapErrorToRpcException(err, 'fallback-channel', true);
    const error = result.getError() as any;
    expect(error.kubemqCode).toBe('CONNECTION');
    expect(error.kubemqCategory).toBe('Connection');
    expect(error.channel).toBe('test-channel');
  });

  // 16.88: Parent-class fallback: unknown KubeMQError subclass -> 500
  it('falls back to 500 for unknown KubeMQError subclass', () => {
    // Create a subclass that doesn't match any known error mapping
    class UnknownKubeMQSubclass extends KubeMQError {
      constructor() {
        super('unknown subclass');
        this.code = 'UNKNOWN_SUB';
        this.category = 'Unknown';
      }
    }
    const err = new UnknownKubeMQSubclass();
    const result = mapErrorToRpcException(err, undefined, true);
    const error = result.getError() as any;
    expect(error.statusCode).toBe(500);
  });
});
