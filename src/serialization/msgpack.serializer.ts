import type { KubeMQSerializer, KubeMQDeserializer } from './interfaces.js';

 
let msgpack: any = null;

 
function loadMsgpack(): any {
  if (!msgpack) {
    throw new Error(
      '@msgpack/msgpack is required for MessagePack serialization. ' +
        'Install it: npm install @msgpack/msgpack — then call MessagePackSerializer.initialize() at startup.',
    );
  }
  return msgpack;
}

async function ensureMsgpackLoaded(): Promise<void> {
  if (msgpack) return;
  try {
    const moduleName = '@msgpack/msgpack';
    msgpack = await import(/* webpackIgnore: true */ moduleName);
  } catch {
    throw new Error(
      '@msgpack/msgpack is required for MessagePack serialization. Install it: npm install @msgpack/msgpack',
    );
  }
}

export class MessagePackSerializer implements KubeMQSerializer {
  readonly contentType = 'application/msgpack';

  /** Call once at startup to eagerly load @msgpack/msgpack. */
  async initialize(): Promise<void> {
    await ensureMsgpackLoaded();
  }

  serialize(value: unknown): Uint8Array {
    const mp = loadMsgpack();
    return mp.encode(value);
  }
}

export class MessagePackDeserializer implements KubeMQDeserializer {
  /** Call once at startup to eagerly load @msgpack/msgpack. */
  async initialize(): Promise<void> {
    await ensureMsgpackLoaded();
  }

  deserialize(data: Uint8Array): unknown {
    const mp = loadMsgpack();
    return mp.decode(data);
  }
}
