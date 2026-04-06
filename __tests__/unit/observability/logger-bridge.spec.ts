import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @nestjs/common Logger
const mockLoggerInstance = {
  debug: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

vi.mock('@nestjs/common', () => ({
  Logger: vi.fn().mockImplementation(() => mockLoggerInstance),
}));

import { createNestKubeMQLogger } from '../../../src/observability/logger-bridge.js';

describe('createNestKubeMQLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Group 10, T5: maps all log levels correctly
  it('maps all log levels to NestJS logger methods', () => {
    const logger = createNestKubeMQLogger('TestContext');

    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    expect(mockLoggerInstance.debug).toHaveBeenCalledWith('debug message');
    expect(mockLoggerInstance.log).toHaveBeenCalledWith('info message');
    expect(mockLoggerInstance.warn).toHaveBeenCalledWith('warn message');
    expect(mockLoggerInstance.error).toHaveBeenCalledWith('error message');
  });

  // Group 10, T6: handles fields with circular references
  it('handles fields with circular references via safeStringify', () => {
    const logger = createNestKubeMQLogger('TestContext');

    // Create circular reference
    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;

    // Should not throw
    expect(() => { logger.info('test', circular); }).not.toThrow();

    // Should have been called with a stringified version containing [Circular]
    expect(mockLoggerInstance.log).toHaveBeenCalledOnce();
    const callArg = mockLoggerInstance.log.mock.calls[0][0] as string;
    expect(callArg).toContain('test');
    expect(callArg).toContain('[Circular]');
  });

  // Group 3, T11: logger bridge with circular object (fields parameter)
  it('includes fields in log output when provided', () => {
    const logger = createNestKubeMQLogger('TestContext');

    logger.debug('connecting', { host: 'localhost', port: 50000 });
    logger.info('connected', { latency: 42 });
    logger.warn('slow query', { duration: 1500 });
    logger.error('failed', { code: 'TIMEOUT' });

    expect(mockLoggerInstance.debug).toHaveBeenCalledWith(
      expect.stringContaining('"host":"localhost"'),
    );
    expect(mockLoggerInstance.log).toHaveBeenCalledWith(
      expect.stringContaining('"latency":42'),
    );
    expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
      expect.stringContaining('"duration":1500'),
    );
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(
      expect.stringContaining('"code":"TIMEOUT"'),
    );
  });
});
