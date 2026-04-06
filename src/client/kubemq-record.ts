import type { KubeMQPatternType } from '../constants.js';

export const KUBEMQ_RECORD_SYMBOL = Symbol.for('kubemq.record');

/**
 * Record builder for specifying KubeMQ message type metadata.
 *
 * By default:
 * - `client.send(pattern, data)` sends a **Command** (no record needed)
 * - `client.emit(pattern, data)` sends an **Event** (no record needed)
 *
 * Use `KubeMQRecord` to override the default type:
 *
 * @example
 * ```typescript
 * // Command (default — no record needed)
 * this.client.send('orders.create', data);
 *
 * // Query (must use record builder)
 * this.client.send('orders.get', new KubeMQRecord({ id }).asQuery());
 *
 * // Event (default — no record needed)
 * this.client.emit('orders.updated', data);
 *
 * // EventStore (must use record builder)
 * this.client.emit('orders.history', new KubeMQRecord(data).asEventStore());
 *
 * // Queue (must use record builder)
 * this.client.emit('orders.process', new KubeMQRecord(data).asQueue());
 * ```
 */
export const KUBEMQ_TAG_PREFIX = 'nestjs:';

export class KubeMQRecord<T = unknown> {
  readonly [KUBEMQ_RECORD_SYMBOL] = true; // M-22: Symbol marker
  private _type: KubeMQPatternType | undefined;
  private _metadata: Record<string, unknown> = {};
  private _tags: Record<string, string> = {};

  constructor(public readonly data: T) {}

  /** Mark this record as a Query (for use with client.send()). */
  asQuery(): this {
    this._type = 'query';
    return this;
  }

  /** Mark this record as an EventStore message (for use with client.emit()). */
  asEventStore(): this {
    this._type = 'event_store';
    return this;
  }

  /** Mark this record as a Queue message (for use with client.emit()). */
  asQueue(): this {
    this._type = 'queue';
    return this;
  }

  /** Attach additional metadata (timeout, cacheKey, policy, etc.). */
  withMetadata(meta: Record<string, unknown>): this {
    // M-12: Strip 'type' key — type is set only via asQuery/asEventStore/asQueue
    const { type: _ignored, ...safeMeta } = meta;
    this._metadata = { ...this._metadata, ...safeMeta };
    return this;
  }

  /**
   * Wire-level tags merged after Nest transport tags. Keys starting with `nestjs:` are ignored.
   */
  withTags(tags: Record<string, string>): this {
    const next: Record<string, string> = { ...this._tags };
    for (const [k, v] of Object.entries(tags)) {
      if (k.startsWith(KUBEMQ_TAG_PREFIX)) continue;
      next[k] = v;
    }
    this._tags = next;
    return this;
  }

  /** @internal — used by the transport to read the KubeMQ type. */
  get __kubemq_type(): KubeMQPatternType | undefined {
    return this._type;
  }

  /** @internal — used by the transport to read additional metadata. */
  get __kubemq_metadata(): Record<string, unknown> {
    return this._metadata;
  }

  /** @internal — user wire tags (excluding reserved `nestjs:*` keys). */
  get __kubemq_tags(): Record<string, string> {
    return this._tags;
  }
}

// M-22: Type guard
export function isKubeMQRecord(value: unknown): value is KubeMQRecord {
  return (
    value !== null &&
    typeof value === 'object' &&
    KUBEMQ_RECORD_SYMBOL in value &&
    (value as Record<symbol, unknown>)[KUBEMQ_RECORD_SYMBOL] === true
  );
}
