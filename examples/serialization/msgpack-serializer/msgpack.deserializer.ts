import { unpack } from 'msgpackr';
import type { KubeMQDeserializer } from '@kubemq/nestjs-transport';

/**
 * MessagePack deserializer using msgpackr.
 * Decodes compact binary payloads produced by MsgPackSerializer.
 */
export class MsgPackDeserializer implements KubeMQDeserializer {
  deserialize(data: Uint8Array): unknown {
    if (data.length === 0) return undefined;
    try {
      return unpack(Buffer.from(data));
    } catch (cause) {
      const detail =
        cause instanceof Error ? cause.message : String(cause);
      throw new Error(
        `MessagePack deserialization failed (invalid or corrupt payload): ${detail}`,
        { cause },
      );
    }
  }
}
