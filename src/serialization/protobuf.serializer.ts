import type { KubeMQSerializer, KubeMQDeserializer } from './interfaces.js';

 
let protobufjs: any = null;

async function ensureProtobufjsLoaded(): Promise<void> {
  if (protobufjs) return;
  try {
    protobufjs = await import('protobufjs');
  } catch {
    throw new Error(
      'protobufjs is required for Protobuf serialization. Install it: npm install protobufjs',
    );
  }
}

export class ProtobufSerializer implements KubeMQSerializer {
  readonly contentType = 'application/x-protobuf';
  private readonly root: any;

  constructor(root: any) {
    this.root = root;
  }

  /** Call once at startup to eagerly load protobufjs. */
  async initialize(): Promise<void> {
    await ensureProtobufjsLoaded();
  }

  serialize(value: unknown): Uint8Array {
    if (!value || typeof value !== 'object') {
      throw new Error('Protobuf serializer requires an object with a $type property or a message type name');
    }

    const obj = value as Record<string, unknown>;
    const typeName = (obj.$type as string) ?? (obj.constructor?.name);
    if (!typeName) {
      throw new Error('Cannot determine protobuf message type. Set $type property on the object.');
    }

    const MessageType = this.root.lookupType(typeName);
    const errMsg = MessageType.verify(obj);
    if (errMsg) throw new Error(`Protobuf verification failed: ${errMsg}`);

    const message = MessageType.create(obj);
    return MessageType.encode(message).finish();
  }
}

export class ProtobufDeserializer implements KubeMQDeserializer {
  readonly contentType = 'application/x-protobuf';
  private readonly root: any;
  private readonly defaultType?: string;

  constructor(root: any, defaultType?: string) {
    this.root = root;
    this.defaultType = defaultType;
  }

  /** Call once at startup to eagerly load protobufjs. */
  async initialize(): Promise<void> {
    await ensureProtobufjsLoaded();
  }

  deserialize(data: Uint8Array, tags?: Record<string, string>): unknown {
    const typeName = tags?.['x-proto-type'] ?? this.defaultType;
    if (!typeName) {
      throw new Error(
        'Cannot determine protobuf message type for deserialization. ' +
          'Set x-proto-type tag or provide a defaultType to ProtobufDeserializer.',
      );
    }

    const MessageType = this.root.lookupType(typeName);
    const message = MessageType.decode(data);
    return MessageType.toObject(message, { defaults: true, longs: String });
  }
}
