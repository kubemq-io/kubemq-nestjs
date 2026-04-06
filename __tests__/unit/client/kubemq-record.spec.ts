import { describe, it, expect } from 'vitest';
import { KubeMQRecord, isKubeMQRecord, KUBEMQ_RECORD_SYMBOL } from '../../../src/client/kubemq-record.js';

describe('KubeMQRecord', () => {
  // Group 6, T1: withMetadata strips type key
  it('withMetadata strips the "type" key from metadata', () => {
    const record = new KubeMQRecord({ data: 'test' })
      .asQuery()
      .withMetadata({ type: 'should-be-stripped', timeout: 5000, cacheKey: 'abc' });

    // type should NOT be in metadata
    expect(record.__kubemq_metadata).not.toHaveProperty('type');
    // Other keys should be preserved
    expect(record.__kubemq_metadata).toEqual({ timeout: 5000, cacheKey: 'abc' });
    // KubeMQ type should remain as set by asQuery()
    expect(record.__kubemq_type).toBe('query');
  });

  // Group 7, T4: isKubeMQRecord type guard
  it('isKubeMQRecord correctly identifies KubeMQRecord instances', () => {
    const record = new KubeMQRecord({ data: 'test' });
    expect(isKubeMQRecord(record)).toBe(true);

    // Non-record objects
    expect(isKubeMQRecord(null)).toBe(false);
    expect(isKubeMQRecord(undefined)).toBe(false);
    expect(isKubeMQRecord({})).toBe(false);
    expect(isKubeMQRecord({ data: 'test' })).toBe(false);
    expect(isKubeMQRecord('string')).toBe(false);
    expect(isKubeMQRecord(42)).toBe(false);

    // Object with the symbol but wrong value
    const fake = { [KUBEMQ_RECORD_SYMBOL]: false };
    expect(isKubeMQRecord(fake)).toBe(false);

    // Object with the symbol and correct value
    const trueish = { [KUBEMQ_RECORD_SYMBOL]: true };
    expect(isKubeMQRecord(trueish)).toBe(true);
  });

  it('withTags() sets user tags and filters nestjs: prefixed keys', () => {
    const record = new KubeMQRecord({ data: 'test' })
      .withTags({ 'app:version': '1.0', 'nestjs:type': 'should-be-stripped', custom: 'ok' });

    expect(record.__kubemq_tags).toEqual({ 'app:version': '1.0', custom: 'ok' });
    expect(record.__kubemq_tags).not.toHaveProperty('nestjs:type');
  });

  it('withTags() merges with existing tags', () => {
    const record = new KubeMQRecord({ data: 'test' })
      .withTags({ first: '1' })
      .withTags({ second: '2' });

    expect(record.__kubemq_tags).toEqual({ first: '1', second: '2' });
  });
});
