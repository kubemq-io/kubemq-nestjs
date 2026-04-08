import type { KubeMQSerializer } from '@kubemq/nestjs-transport';

const encoder = new TextEncoder();

/**
 * Custom serializer that converts values to uppercase JSON.
 * Demonstrates implementing the KubeMQSerializer interface.
 */
export class UppercaseJsonSerializer implements KubeMQSerializer {
  readonly contentType = 'application/json+uppercase';

  serialize(value: unknown): Uint8Array {
    const json = JSON.stringify(value === undefined ? null : value);
    return encoder.encode(json.toUpperCase());
  }
}
