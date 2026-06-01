import { describe, it, expect } from 'vitest';
import { CorrelationContext } from '../../../src/correlation/correlation-context.js';
import { TAG_CORRELATION_ID, TAG_CAUSATION_ID } from '../../../src/constants.js';

describe('CorrelationContext', () => {
  // COR-1: Incoming correlation ID propagated to outgoing
  it('propagates incoming correlation ID from tags', () => {
    const tags = { [TAG_CORRELATION_ID]: 'existing-corr-id' };
    const store = CorrelationContext.createFromTags(tags, 'msg-1', TAG_CORRELATION_ID, TAG_CAUSATION_ID);

    expect(store.correlationId).toBe('existing-corr-id');
  });

  // COR-2: No incoming correlation ID, new UUID generated
  it('generates a new UUID when no incoming correlation ID', () => {
    const store = CorrelationContext.createFromTags({}, 'msg-1', TAG_CORRELATION_ID, TAG_CAUSATION_ID);

    expect(store.correlationId).toBeDefined();
    expect(store.correlationId.length).toBeGreaterThan(0);
    expect(store.correlationId).not.toBe('msg-1');
  });

  // COR-3: Context.getCorrelationId() returns correct value
  it('returns correlation ID from async local storage', () => {
    const store = { correlationId: 'test-corr', causationId: 'test-cause' };
    CorrelationContext.run(store, () => {
      expect(CorrelationContext.getCorrelationId()).toBe('test-corr');
      expect(CorrelationContext.getCausationId()).toBe('test-cause');
    });
  });

  // COR-4: Causation ID set to incoming message ID
  it('sets causation ID to the incoming message ID', () => {
    const store = CorrelationContext.createFromTags({}, 'msg-42', TAG_CORRELATION_ID, TAG_CAUSATION_ID);

    expect(store.causationId).toBe('msg-42');
  });

  // COR-5: Concurrent handlers have isolated correlation contexts
  it('isolates context across concurrent handlers', async () => {
    const results: string[] = [];

    const p1 = new Promise<void>((resolve) => {
      CorrelationContext.run({ correlationId: 'corr-A', causationId: 'cause-A' }, () => {
        setTimeout(() => {
          results.push(CorrelationContext.getCorrelationId()!);
          resolve();
        }, 10);
      });
    });

    const p2 = new Promise<void>((resolve) => {
      CorrelationContext.run({ correlationId: 'corr-B', causationId: 'cause-B' }, () => {
        results.push(CorrelationContext.getCorrelationId()!);
        resolve();
      });
    });

    await Promise.all([p1, p2]);

    expect(results).toContain('corr-A');
    expect(results).toContain('corr-B');
    expect(results.length).toBe(2);
  });
});
