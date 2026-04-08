import type { KubeMQDeserializer } from '@kubemq/nestjs-transport';

const decoder = new TextDecoder('utf-8', { fatal: true });

/**
 * Custom deserializer that validates JSON payloads during deserialization.
 * Demonstrates implementing the KubeMQDeserializer interface with
 * tag-based content-type awareness.
 */
export class ValidatedJsonDeserializer implements KubeMQDeserializer {
  deserialize(data: Uint8Array, tags?: Record<string, string>): unknown {
    let text: string;
    try {
      text = decoder.decode(data);
    } catch {
      throw new Error('Invalid UTF-8: payload is not valid UTF-8');
    }
    if (!text) return undefined;

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('Invalid JSON: payload is not valid JSON');
    }

    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      (parsed as Record<string, unknown>).__deserializedAt = new Date().toISOString();
      if (tags?.['x-source']) {
        (parsed as Record<string, unknown>).__source = tags['x-source'];
      }
    }

    return parsed;
  }
}
