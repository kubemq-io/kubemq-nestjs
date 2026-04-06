import { describe, it, expect } from 'vitest';
import { JsonSerializer } from '../../../src/serialization/json.serializer.js';
import { JsonDeserializer } from '../../../src/serialization/json.deserializer.js';
import { SerializationError } from '../../../src/errors/serialization.error.js';
import { serializeBody, deserializeBody } from '../../../src/serialization/helpers.js';
import type { KubeMQSerializer, KubeMQDeserializer } from '../../../src/serialization/interfaces.js';

describe('Serialization', () => {
  // 16.61: JSON serializer produces UTF-8 bytes
  it('JsonSerializer produces valid UTF-8 bytes', () => {
    const serializer = new JsonSerializer();
    const data = { hello: 'world', num: 42, unicode: '\u00e9\u00e0\u00fc' };
    const bytes = serializer.serialize(data);

    expect(bytes).toBeInstanceOf(Uint8Array);

    // Decode and verify the JSON content
    const decoded = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(decoded);
    expect(parsed).toEqual(data);
  });

  // 16.62: JSON deserializer parses correctly
  it('JsonDeserializer parses JSON body correctly', () => {
    const deserializer = new JsonDeserializer();
    const original = { key: 'value', nested: { a: 1 } };
    const bytes = new TextEncoder().encode(JSON.stringify(original));

    const result = deserializer.deserialize(bytes);
    expect(result).toEqual(original);
  });

  // 16.63: Empty body returns undefined
  it('JsonDeserializer handles empty body (returns undefined)', () => {
    const deserializer = new JsonDeserializer();

    // Empty Uint8Array
    const emptyResult = deserializer.deserialize(new Uint8Array(0));
    expect(emptyResult).toBeUndefined();

    // Empty string encoded
    const emptyStringResult = deserializer.deserialize(new TextEncoder().encode(''));
    expect(emptyStringResult).toBeUndefined();
  });

  // Group 3, T13: invalid JSON deserialization throws SerializationError
  it('JsonDeserializer throws SerializationError on invalid JSON', () => {
    const deserializer = new JsonDeserializer();
    const nonJson = 'this is not json at all';
    const bytes = new TextEncoder().encode(nonJson);

    expect(() => deserializer.deserialize(bytes)).toThrow(SerializationError);
    expect(() => deserializer.deserialize(bytes)).toThrow(/Failed to parse JSON body/);
  });

  // Group 3, T8: JSON.stringify failure in serializeBody throws SerializationError
  it('JsonSerializer throws SerializationError on non-serializable value', () => {
    const serializer = new JsonSerializer();

    // Create a circular object that JSON.stringify cannot handle
    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;

    expect(() => serializer.serialize(circular)).toThrow(SerializationError);
    expect(() => serializer.serialize(circular)).toThrow(/Failed to serialize value/);
  });

  // Group 3, T9: undefined input serializes as null
  it('JsonSerializer serializes undefined as null', () => {
    const serializer = new JsonSerializer();
    const bytes = serializer.serialize(undefined);
    const decoded = new TextDecoder().decode(bytes);
    expect(decoded).toBe('null');
  });

  // 16.65: Custom serializer/deserializer plugs in via options
  it('custom serializer/deserializer plug in via interface', () => {
    // Create custom serializer that prefixes with a marker
    const customSerializer: KubeMQSerializer = {
      serialize(value: unknown): Uint8Array {
        const json = JSON.stringify({ wrapped: value });
        return new TextEncoder().encode(json);
      },
    };

    // Create custom deserializer that unwraps
    const customDeserializer: KubeMQDeserializer = {
      deserialize(data: Uint8Array, _tags?: Record<string, string>): unknown {
        const text = new TextDecoder().decode(data);
        const parsed = JSON.parse(text);
        return parsed.wrapped;
      },
    };

    // Verify the custom serializer
    const original = { name: 'test' };
    const bytes = customSerializer.serialize(original);
    const decoded = JSON.parse(new TextDecoder().decode(bytes));
    expect(decoded).toEqual({ wrapped: original });

    // Verify the custom deserializer round-trips
    const result = customDeserializer.deserialize(bytes);
    expect(result).toEqual(original);
  });

  // JsonSerializer exposes contentType property
  it('JsonSerializer has contentType property set to application/json', () => {
    const serializer = new JsonSerializer();
    expect(serializer.contentType).toBe('application/json');
  });

  // Group 8, T2: custom serializer/deserializer round-trip
  it('custom serializer/deserializer round-trip preserves data', () => {
    const serializer = new JsonSerializer();
    const deserializer = new JsonDeserializer();

    const original = { name: 'test', nested: { arr: [1, 2, 3] }, flag: true };
    const bytes = serializer.serialize(original);
    const result = deserializer.deserialize(bytes);

    expect(result).toEqual(original);
  });

  // --- serializeBody / deserializeBody helpers ---

  it('serializeBody uses custom serializer when provided', () => {
    const custom: KubeMQSerializer = {
      serialize: (v: unknown) => new TextEncoder().encode(`custom:${JSON.stringify(v)}`),
    };
    const result = serializeBody({ x: 1 }, custom);
    const text = new TextDecoder().decode(result);
    expect(text).toBe('custom:{"x":1}');
  });

  it('serializeBody defaults to JSON without custom serializer', () => {
    const result = serializeBody({ y: 2 });
    const text = new TextDecoder().decode(result);
    expect(JSON.parse(text)).toEqual({ y: 2 });
  });

  it('serializeBody serializes undefined as null', () => {
    const result = serializeBody(undefined);
    expect(new TextDecoder().decode(result)).toBe('null');
  });

  it('deserializeBody uses custom deserializer when provided', () => {
    const custom: KubeMQDeserializer = {
      deserialize: (_data: Uint8Array, _tags?: Record<string, string>) => ({ custom: true }),
    };
    const result = deserializeBody(new Uint8Array(0), {}, custom);
    expect(result).toEqual({ custom: true });
  });

  it('deserializeBody throws SerializationError on invalid UTF-8 bytes', () => {
    const invalidUtf8 = new Uint8Array([0xff, 0xfe, 0x80]);
    expect(() => deserializeBody(invalidUtf8)).toThrow(SerializationError);
    expect(() => deserializeBody(invalidUtf8)).toThrow(/Invalid UTF-8 body/);
  });

  it('deserializeBody returns undefined for empty body', () => {
    expect(deserializeBody(new Uint8Array(0))).toBeUndefined();
  });

  it('JsonSerializer error path throws SerializationError for BigInt', () => {
    const serializer = new JsonSerializer();
    expect(() => serializer.serialize(BigInt(999))).toThrow(SerializationError);
    expect(() => serializer.serialize(BigInt(999))).toThrow(/Failed to serialize/);
  });

  it('serializeBody error path throws SerializationError for circular object', () => {
    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;
    expect(() => serializeBody(circular)).toThrow(SerializationError);
  });
});
