import type { KubeMQDeserializer } from './interfaces.js';
import { SerializationError } from '../errors/serialization.error.js';
import { errorMessage } from '../utils/error-helpers.js';

const decoder = new TextDecoder('utf-8', { fatal: true });

export class JsonDeserializer implements KubeMQDeserializer {
  deserialize(data: Uint8Array, _tags?: Record<string, string>): unknown {
    let text: string;
    try {
      text = decoder.decode(data);
    } catch (err) {
      throw new SerializationError(`Invalid UTF-8 body: ${errorMessage(err)}`, {
        operation: 'json-deserialize',
        cause: err instanceof Error ? err : undefined,
      });
    }
    if (!text) return undefined;
    try {
      return JSON.parse(text);
    } catch (err) {
      throw new SerializationError(`Failed to parse JSON body: ${errorMessage(err)}`, {
        operation: 'json-deserialize',
        cause: err instanceof Error ? err : undefined,
      });
    }
  }
}
