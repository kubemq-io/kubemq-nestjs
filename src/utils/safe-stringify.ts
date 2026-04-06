// src/utils/safe-stringify.ts

/**
 * JSON.stringify with cycle detection and error safety.
 * Returns "[unserializable]" on failure.
 */
export function safeStringify(value: unknown): string {
  try {
    const seen = new WeakSet();
    return JSON.stringify(value, (_key, val: unknown) => {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '[Circular]';
        seen.add(val);
      }
      return val;
    });
  } catch {
    return '[unserializable]';
  }
}
