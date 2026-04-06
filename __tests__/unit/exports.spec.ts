import { describe, it, expect } from 'vitest';
import * as indexExports from '../../src/index.js';

describe('Index Exports', () => {
  it('exports HealthIndicatorResult type and KubeMQHealthIndicator class', () => {
    expect(indexExports.KubeMQHealthIndicator).toBeDefined();
    expect(typeof indexExports.KubeMQHealthIndicator).toBe('function');

    expect(indexExports.SerializationError).toBeDefined();
    expect(indexExports.isKubeMQRecord).toBeDefined();
    expect(typeof indexExports.isKubeMQRecord).toBe('function');
    expect(indexExports.KUBEMQ_RECORD_SYMBOL).toBeDefined();
    expect(typeof indexExports.KUBEMQ_RECORD_SYMBOL).toBe('symbol');
    expect(indexExports.KubeMQRequestContext).toBeDefined();
    expect(indexExports.ConnectionNotReadyError).toBeDefined();
  });

  it('does not export KUBEMQ_CLIENT_TOKEN', () => {
    expect('KUBEMQ_CLIENT_TOKEN' in indexExports).toBe(false);
  });

  it('exports KubeMQQueueBatchContext', () => {
    expect(indexExports.KubeMQQueueBatchContext).toBeDefined();
    expect(typeof indexExports.KubeMQQueueBatchContext).toBe('function');
  });

  it('exports MockKubeMQClient and MockKubeMQServer from main entry', () => {
    expect(indexExports.MockKubeMQClient).toBeDefined();
    expect(typeof indexExports.MockKubeMQClient).toBe('function');
    expect(indexExports.MockKubeMQServer).toBeDefined();
    expect(typeof indexExports.MockKubeMQServer).toBe('function');
  });
});
