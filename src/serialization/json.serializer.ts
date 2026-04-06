import type { KubeMQSerializer } from './interfaces.js';
import { SerializationError } from '../errors/serialization.error.js';
import { errorMessage } from '../utils/error-helpers.js';

const encoder = new TextEncoder();

export class JsonSerializer implements KubeMQSerializer {
  readonly contentType = 'application/json' as const;

  serialize(value: unknown): Uint8Array {
    try {
      return encoder.encode(JSON.stringify(value === undefined ? null : value));
    } catch (err) {
      throw new SerializationError(`Failed to serialize value: ${errorMessage(err)}`, {
        operation: 'json-serialize',
        cause: err instanceof Error ? err : undefined,
      });
    }
  }
}
