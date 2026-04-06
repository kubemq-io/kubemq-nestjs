import { describe, it, expect } from 'vitest';
import {
  isModuleNotFoundError,
  isConnectionError,
  toError,
  errorMessage,
} from '../../../src/utils/error-helpers.js';

describe('isModuleNotFoundError', () => {
  it('returns true for code MODULE_NOT_FOUND', () => {
    const err = { code: 'MODULE_NOT_FOUND' };
    expect(isModuleNotFoundError(err)).toBe(true);
  });

  it('returns true for code ERR_MODULE_NOT_FOUND', () => {
    const err = { code: 'ERR_MODULE_NOT_FOUND' };
    expect(isModuleNotFoundError(err)).toBe(true);
  });

  it('returns true for Error with "Cannot find module"', () => {
    expect(isModuleNotFoundError(new Error('Cannot find module "@nestjs/cqrs"'))).toBe(true);
  });

  it('returns true for Error with "Cannot find package"', () => {
    expect(isModuleNotFoundError(new Error('Cannot find package "foo"'))).toBe(true);
  });

  it('returns false for unrelated Error', () => {
    expect(isModuleNotFoundError(new Error('something else'))).toBe(false);
  });

  it('returns false for null', () => {
    expect(isModuleNotFoundError(null)).toBe(false);
  });

  it('returns false for non-object primitives', () => {
    expect(isModuleNotFoundError('string')).toBe(false);
    expect(isModuleNotFoundError(42)).toBe(false);
    expect(isModuleNotFoundError(undefined)).toBe(false);
  });

  it('returns false for object without code or message', () => {
    expect(isModuleNotFoundError({ foo: 'bar' })).toBe(false);
  });
});

describe('isConnectionError', () => {
  it('returns true for ConnectionError constructor name', () => {
    class ConnectionError extends Error {
      constructor() { super('conn'); this.name = 'ConnectionError'; }
    }
    expect(isConnectionError(new ConnectionError())).toBe(true);
  });

  it('returns true for TransientError constructor name', () => {
    class TransientError extends Error {
      constructor() { super('transient'); this.name = 'TransientError'; }
    }
    expect(isConnectionError(new TransientError())).toBe(true);
  });

  it('returns true for BufferFullError constructor name', () => {
    class BufferFullError extends Error {
      constructor() { super('full'); }
    }
    expect(isConnectionError(new BufferFullError())).toBe(true);
  });

  it('returns true for StreamBrokenError constructor name', () => {
    class StreamBrokenError extends Error {
      constructor() { super('broken'); }
    }
    expect(isConnectionError(new StreamBrokenError())).toBe(true);
  });

  it('returns true for RetryExhaustedError constructor name', () => {
    class RetryExhaustedError extends Error {
      constructor() { super('exhausted'); }
    }
    expect(isConnectionError(new RetryExhaustedError())).toBe(true);
  });

  it('returns true for code UNAVAILABLE', () => {
    const err = Object.assign(new Error('unavailable'), { code: 'UNAVAILABLE' });
    expect(isConnectionError(err)).toBe(true);
  });

  it('returns true for code DEADLINE_EXCEEDED', () => {
    const err = Object.assign(new Error('timeout'), { code: 'DEADLINE_EXCEEDED' });
    expect(isConnectionError(err)).toBe(true);
  });

  it('returns true for code RESOURCE_EXHAUSTED', () => {
    const err = Object.assign(new Error('throttled'), { code: 'RESOURCE_EXHAUSTED' });
    expect(isConnectionError(err)).toBe(true);
  });

  it('returns true for message containing ECONNREFUSED', () => {
    expect(isConnectionError(new Error('connect ECONNREFUSED 127.0.0.1:50000'))).toBe(true);
  });

  it('returns true for message containing ENOTFOUND', () => {
    expect(isConnectionError(new Error('getaddrinfo ENOTFOUND broker'))).toBe(true);
  });

  it('returns true for message containing ETIMEDOUT', () => {
    expect(isConnectionError(new Error('connect ETIMEDOUT'))).toBe(true);
  });

  it('returns true for message containing "connection refused" (case-insensitive)', () => {
    expect(isConnectionError(new Error('Connection refused'))).toBe(true);
  });

  it('returns false for null', () => {
    expect(isConnectionError(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isConnectionError('string error')).toBe(false);
    expect(isConnectionError(42)).toBe(false);
  });

  it('returns false for a generic Error with unrelated message', () => {
    expect(isConnectionError(new Error('validation failed'))).toBe(false);
  });

  it('returns false for object with unrelated code', () => {
    const err = Object.assign(new Error('nope'), { code: 'INVALID_ARGUMENT' });
    expect(isConnectionError(err)).toBe(false);
  });
});

describe('toError', () => {
  it('returns the same Error if input is an Error', () => {
    const err = new Error('test');
    expect(toError(err)).toBe(err);
  });

  it('wraps a string into an Error', () => {
    const result = toError('string error');
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('string error');
  });

  it('wraps a number into an Error', () => {
    const result = toError(42);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('42');
  });

  it('wraps null into an Error', () => {
    const result = toError(null);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('null');
  });
});

describe('errorMessage', () => {
  it('returns message from Error', () => {
    expect(errorMessage(new Error('hello'))).toBe('hello');
  });

  it('stringifies non-Error values', () => {
    expect(errorMessage('raw string')).toBe('raw string');
    expect(errorMessage(123)).toBe('123');
    expect(errorMessage(null)).toBe('null');
    expect(errorMessage(undefined)).toBe('undefined');
  });
});
