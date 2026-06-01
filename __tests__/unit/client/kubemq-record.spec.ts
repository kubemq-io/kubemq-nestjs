import { describe, it, expect } from 'vitest';
import { KubeMQRecord, isKubeMQRecord } from '../../../src/client/kubemq-record.js';
import { TAG_IDEMPOTENCY_KEY, TAG_CORRELATION_ID } from '../../../src/constants.js';

describe('KubeMQRecord', () => {
  // DM-1: withDelay(30) sets delaySeconds on policy
  it('withDelay sets delaySeconds in metadata policy', () => {
    const record = new KubeMQRecord({ order: 'abc' }).asQueue().withDelay(30);

    expect(record.__kubemq_metadata.policy).toEqual(
      expect.objectContaining({ delaySeconds: 30 }),
    );
  });

  // DM-2: withDelay on non-queue record still sets metadata (warning at dispatch time)
  it('withDelay sets metadata regardless of type (validated at dispatch)', () => {
    const record = new KubeMQRecord({ data: 1 }).asQuery().withDelay(10);
    expect(record.__kubemq_metadata.policy).toEqual(
      expect.objectContaining({ delaySeconds: 10 }),
    );
  });

  it('withIdempotencyKey sets the idempotency tag', () => {
    const record = new KubeMQRecord({}).withIdempotencyKey('dedup-123');
    expect(record.__kubemq_tags[TAG_IDEMPOTENCY_KEY]).toBe('dedup-123');
  });

  it('withCorrelationId sets the correlation tag', () => {
    const record = new KubeMQRecord({}).withCorrelationId('corr-456');
    expect(record.__kubemq_tags[TAG_CORRELATION_ID]).toBe('corr-456');
  });

  it('withTags ignores reserved nestjs: prefix keys', () => {
    const record = new KubeMQRecord({}).withTags({
      'nestjs:pattern': 'should-be-ignored',
      'custom-tag': 'kept',
    });
    expect(record.__kubemq_tags['nestjs:pattern']).toBeUndefined();
    expect(record.__kubemq_tags['custom-tag']).toBe('kept');
  });

  it('isKubeMQRecord returns true for KubeMQRecord instances', () => {
    expect(isKubeMQRecord(new KubeMQRecord({}))).toBe(true);
    expect(isKubeMQRecord({ data: 1 })).toBe(false);
    expect(isKubeMQRecord(null)).toBe(false);
    expect(isKubeMQRecord('string')).toBe(false);
  });

  it('type builder methods set correct __kubemq_type', () => {
    expect(new KubeMQRecord({}).asQuery().__kubemq_type).toBe('query');
    expect(new KubeMQRecord({}).asEventStore().__kubemq_type).toBe('event_store');
    expect(new KubeMQRecord({}).asQueue().__kubemq_type).toBe('queue');
    expect(new KubeMQRecord({}).__kubemq_type).toBeUndefined();
  });

  it('withMetadata strips type key', () => {
    const record = new KubeMQRecord({}).withMetadata({ type: 'override', timeout: 5000 });
    expect(record.__kubemq_metadata).toEqual({ timeout: 5000 });
  });
});
