// src/serialization/helpers.ts
import type { KubeMQSerializer, KubeMQDeserializer } from './interfaces.js';
import { SerializationError } from '../errors/serialization.error.js';
import { errorMessage } from '../utils/error-helpers.js';

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

export function serializeBody(value: unknown, serializer?: KubeMQSerializer): Uint8Array {
  if (serializer) {
    return serializer.serialize(value);
  }
  try {
    return encoder.encode(JSON.stringify(value === undefined ? null : value));
  } catch (err) {
    throw new SerializationError(`Failed to serialize value: ${errorMessage(err)}`, {
      operation: 'serialize',
      cause: err instanceof Error ? err : undefined,
    });
  }
}

export function deserializeBody(
  data: Uint8Array,
  tags?: Record<string, string>,
  deserializer?: KubeMQDeserializer,
): unknown {
  if (deserializer) {
    return deserializer.deserialize(data, tags);
  }
  let text: string;
  try {
    text = decoder.decode(data);
  } catch (err) {
    throw new SerializationError(`Invalid UTF-8 body: ${errorMessage(err)}`, {
      operation: 'deserialize',
      cause: err instanceof Error ? err : undefined,
    });
  }
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new SerializationError(`Failed to parse JSON body: ${errorMessage(err)}`, {
      operation: 'deserialize',
      cause: err instanceof Error ? err : undefined,
    });
  }
}
