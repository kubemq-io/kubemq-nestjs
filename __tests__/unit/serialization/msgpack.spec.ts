import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockEncode, mockDecode } = vi.hoisted(() => ({
  mockEncode: vi.fn((v: unknown) => new Uint8Array([1, 2, 3])),
  mockDecode: vi.fn(() => ({ hello: 'world' })),
}));

vi.mock('@msgpack/msgpack', () => ({
  encode: mockEncode,
  decode: mockDecode,
}));

describe('MessagePackSerializer', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('serialize before initialize throws with install message', async () => {
    const { MessagePackSerializer } = await import(
      '../../../src/serialization/msgpack.serializer.js'
    );
    const ser = new MessagePackSerializer();
    expect(() => ser.serialize({ foo: 'bar' })).toThrow(
      '@msgpack/msgpack is required',
    );
  });

  it('initialize loads module successfully', async () => {
    const { MessagePackSerializer } = await import(
      '../../../src/serialization/msgpack.serializer.js'
    );
    const ser = new MessagePackSerializer();
    await expect(ser.initialize()).resolves.not.toThrow();
  });

  it('serialize after init calls encode and returns Uint8Array', async () => {
    const { MessagePackSerializer } = await import(
      '../../../src/serialization/msgpack.serializer.js'
    );
    const ser = new MessagePackSerializer();
    await ser.initialize();
    const result = ser.serialize({ foo: 'bar' });
    expect(mockEncode).toHaveBeenCalledWith({ foo: 'bar' });
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('has contentType set to application/msgpack', async () => {
    const { MessagePackSerializer } = await import(
      '../../../src/serialization/msgpack.serializer.js'
    );
    expect(new MessagePackSerializer().contentType).toBe('application/msgpack');
  });
});

describe('MessagePackDeserializer', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('deserialize before initialize throws with install message', async () => {
    const { MessagePackDeserializer } = await import(
      '../../../src/serialization/msgpack.serializer.js'
    );
    const des = new MessagePackDeserializer();
    expect(() => des.deserialize(new Uint8Array([1, 2, 3]))).toThrow(
      '@msgpack/msgpack is required',
    );
  });

  it('initialize loads module successfully', async () => {
    const { MessagePackDeserializer } = await import(
      '../../../src/serialization/msgpack.serializer.js'
    );
    const des = new MessagePackDeserializer();
    await expect(des.initialize()).resolves.not.toThrow();
  });

  it('deserialize after init calls decode and returns object', async () => {
    const { MessagePackDeserializer } = await import(
      '../../../src/serialization/msgpack.serializer.js'
    );
    const des = new MessagePackDeserializer();
    await des.initialize();
    const input = new Uint8Array([10, 20, 30]);
    const result = des.deserialize(input);
    expect(mockDecode).toHaveBeenCalledWith(input);
    expect(result).toEqual({ hello: 'world' });
  });
});

describe('MessagePack (module not installed)', () => {
  it('MessagePackSerializer.initialize throws when module unavailable', async () => {
    vi.resetModules();
    vi.doMock('@msgpack/msgpack', () => {
      throw new Error('MODULE_NOT_FOUND');
    });
    const { MessagePackSerializer } = await import(
      '../../../src/serialization/msgpack.serializer.js'
    );
    const ser = new MessagePackSerializer();
    await expect(ser.initialize()).rejects.toThrow(
      '@msgpack/msgpack is required',
    );
  });

  it('MessagePackDeserializer.initialize throws when module unavailable', async () => {
    vi.resetModules();
    vi.doMock('@msgpack/msgpack', () => {
      throw new Error('MODULE_NOT_FOUND');
    });
    const { MessagePackDeserializer } = await import(
      '../../../src/serialization/msgpack.serializer.js'
    );
    const des = new MessagePackDeserializer();
    await expect(des.initialize()).rejects.toThrow(
      '@msgpack/msgpack is required',
    );
  });
});
