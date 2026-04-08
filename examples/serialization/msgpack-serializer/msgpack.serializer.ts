import { pack } from 'msgpackr';
import type { KubeMQSerializer } from '@kubemq/nestjs-transport';

/**
 * MessagePack serializer using msgpackr.
 * Produces compact binary payloads, significantly smaller than JSON.
 */
export class MsgPackSerializer implements KubeMQSerializer {
  readonly contentType = 'application/msgpack';

  serialize(value: unknown): Uint8Array {
    return pack(value === undefined ? null : value);
  }
}
