import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockMessageType = {
  verify: vi.fn(() => null),
  create: vi.fn((obj: any) => obj),
  encode: vi.fn(() => ({ finish: () => new Uint8Array([10, 20]) })),
  decode: vi.fn(() => ({ field1: 'decoded' })),
  toObject: vi.fn((_msg: any, _opts?: any) => ({ field1: 'decoded-value' })),
};

const mockRoot = {
  lookupType: vi.fn(() => mockMessageType),
};

import {
  ProtobufSerializer,
  ProtobufDeserializer,
} from '../../../src/serialization/protobuf.serializer.js';

describe('ProtobufSerializer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when value is null', () => {
    const ser = new ProtobufSerializer(mockRoot);
    expect(() => ser.serialize(null)).toThrow(
      'Protobuf serializer requires an object',
    );
  });

  it('throws for non-object values', () => {
    const ser = new ProtobufSerializer(mockRoot);
    expect(() => ser.serialize('string')).toThrow(
      'Protobuf serializer requires an object',
    );
    expect(() => ser.serialize(42)).toThrow(
      'Protobuf serializer requires an object',
    );
  });

  it('serialize with $type looks up type, verifies, creates, and encodes', () => {
    const ser = new ProtobufSerializer(mockRoot);
    const obj = { $type: 'MyType', field1: 'value' };
    const result = ser.serialize(obj);

    expect(mockRoot.lookupType).toHaveBeenCalledWith('MyType');
    expect(mockMessageType.verify).toHaveBeenCalledWith(obj);
    expect(mockMessageType.create).toHaveBeenCalledWith(obj);
    expect(mockMessageType.encode).toHaveBeenCalledWith(obj);
    expect(result).toEqual(new Uint8Array([10, 20]));
  });

  it('throws when verify returns an error message', () => {
    mockMessageType.verify.mockReturnValueOnce('field1 is required');
    const ser = new ProtobufSerializer(mockRoot);
    expect(() => ser.serialize({ $type: 'MyType' })).toThrow(
      'Protobuf verification failed: field1 is required',
    );
  });

  it('uses constructor.name when $type is not set', () => {
    class MyMessage {
      field1 = 'hello';
    }
    const ser = new ProtobufSerializer(mockRoot);
    ser.serialize(new MyMessage());
    expect(mockRoot.lookupType).toHaveBeenCalledWith('MyMessage');
  });

  it('throws when type cannot be determined', () => {
    const ser = new ProtobufSerializer(mockRoot);
    const obj = Object.create(null);
    expect(() => ser.serialize(obj)).toThrow(
      'Cannot determine protobuf message type',
    );
  });

  it('has contentType set to application/x-protobuf', () => {
    const ser = new ProtobufSerializer(mockRoot);
    expect(ser.contentType).toBe('application/x-protobuf');
  });
});

describe('ProtobufDeserializer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deserializes with x-proto-type tag', () => {
    const des = new ProtobufDeserializer(mockRoot);
    const data = new Uint8Array([10, 20, 30]);
    const result = des.deserialize(data, { 'x-proto-type': 'MyType' });

    expect(mockRoot.lookupType).toHaveBeenCalledWith('MyType');
    expect(mockMessageType.decode).toHaveBeenCalledWith(data);
    expect(mockMessageType.toObject).toHaveBeenCalledWith(
      { field1: 'decoded' },
      { defaults: true, longs: String },
    );
    expect(result).toEqual({ field1: 'decoded-value' });
  });

  it('deserializes with defaultType when no tag present', () => {
    const des = new ProtobufDeserializer(mockRoot, 'DefaultMsg');
    const data = new Uint8Array([5, 6]);
    des.deserialize(data);

    expect(mockRoot.lookupType).toHaveBeenCalledWith('DefaultMsg');
    expect(mockMessageType.decode).toHaveBeenCalledWith(data);
  });

  it('x-proto-type tag takes precedence over defaultType', () => {
    const des = new ProtobufDeserializer(mockRoot, 'DefaultMsg');
    des.deserialize(new Uint8Array([1]), { 'x-proto-type': 'OverrideType' });
    expect(mockRoot.lookupType).toHaveBeenCalledWith('OverrideType');
  });

  it('throws when no type can be determined', () => {
    const des = new ProtobufDeserializer(mockRoot);
    expect(() => des.deserialize(new Uint8Array([1]))).toThrow(
      'Cannot determine protobuf message type for deserialization',
    );
  });

  it('has contentType set to application/x-protobuf', () => {
    const des = new ProtobufDeserializer(mockRoot);
    expect(des.contentType).toBe('application/x-protobuf');
  });
});

describe('Protobuf initialize', () => {
  it('ProtobufSerializer.initialize loads protobufjs', async () => {
    vi.resetModules();
    vi.doMock('protobufjs', () => ({ Root: {} }));
    const mod = await import(
      '../../../src/serialization/protobuf.serializer.js'
    );
    const ser = new mod.ProtobufSerializer(mockRoot);
    await expect(ser.initialize()).resolves.not.toThrow();
  });

  it('ProtobufSerializer.initialize throws when protobufjs unavailable', async () => {
    vi.resetModules();
    vi.doMock('protobufjs', () => {
      throw new Error('MODULE_NOT_FOUND');
    });
    const mod = await import(
      '../../../src/serialization/protobuf.serializer.js'
    );
    const ser = new mod.ProtobufSerializer(mockRoot);
    await expect(ser.initialize()).rejects.toThrow(
      'protobufjs is required',
    );
  });

  it('ProtobufDeserializer.initialize loads protobufjs', async () => {
    vi.resetModules();
    vi.doMock('protobufjs', () => ({ Root: {} }));
    const mod = await import(
      '../../../src/serialization/protobuf.serializer.js'
    );
    const des = new mod.ProtobufDeserializer(mockRoot, 'Msg');
    await expect(des.initialize()).resolves.not.toThrow();
  });

  it('ProtobufDeserializer.initialize throws when protobufjs unavailable', async () => {
    vi.resetModules();
    vi.doMock('protobufjs', () => {
      throw new Error('MODULE_NOT_FOUND');
    });
    const mod = await import(
      '../../../src/serialization/protobuf.serializer.js'
    );
    const des = new mod.ProtobufDeserializer(mockRoot, 'Msg');
    await expect(des.initialize()).rejects.toThrow(
      'protobufjs is required',
    );
  });
});
