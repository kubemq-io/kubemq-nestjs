import { describe, it, expect } from 'vitest';
import { safeStringify } from '../../../src/utils/safe-stringify.js';

describe('safeStringify', () => {
  it('stringifies plain objects', () => {
    expect(safeStringify({ a: 1, b: 'two' })).toBe('{"a":1,"b":"two"}');
  });

  it('handles circular references with [Circular]', () => {
    const obj: Record<string, unknown> = { name: 'root' };
    obj.self = obj;
    const result = safeStringify(obj);
    expect(result).toContain('"name":"root"');
    expect(result).toContain('"self":"[Circular]"');
  });

  it('returns "[unserializable]" when JSON.stringify throws', () => {
    const result = safeStringify(BigInt(123));
    expect(result).toBe('[unserializable]');
  });
});
