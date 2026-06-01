import type { EventStoreStartFrom } from './handler-metadata.interface.js';

export interface KubeMQHandlerBaseOptions {
  group?: string;
  maxConcurrent?: number;
  /** Alias for maxConcurrent — limits concurrent handler executions. When both are set, concurrency takes precedence. */
  concurrency?: number;
  /** Max depth of internal FIFO backpressure queue when concurrency is limited (default: 1000). */
  maxQueueDepth?: number;
  /** Dead letter channel for failed messages. */
  deadLetterChannel?: string;
  /**
   * Max retry attempts before routing to DLQ.
   * Defaults: 0 when deadLetterChannel is not set; 3 when deadLetterChannel is set and maxRetries is omitted.
   */
  maxRetries?: number;
}

export interface CommandHandlerOptions extends KubeMQHandlerBaseOptions {
  /** DTO class for class-validator validation on incoming payloads. */
  validate?: new (...args: any[]) => any;
}

export interface QueryHandlerOptions extends KubeMQHandlerBaseOptions {
  /** DTO class for class-validator validation on incoming payloads. */
  validate?: new (...args: any[]) => any;
}

export interface EventHandlerOptions extends KubeMQHandlerBaseOptions {
  /** DTO class for class-validator validation on incoming payloads. */
  validate?: new (...args: any[]) => any;
}

export interface EventStoreHandlerOptions extends KubeMQHandlerBaseOptions {
  startFrom?: EventStoreStartFrom; // CHANGED (M-15) -- now accepts numeric 1-6
  startValue?: number;
  /** DTO class for class-validator validation on incoming payloads. */
  validate?: new (...args: any[]) => any;
}

export interface QueueHandlerOptions extends KubeMQHandlerBaseOptions {
  manualAck?: boolean;
  maxMessages?: number;
  waitTimeoutSeconds?: number;
  /** When true, handler receives the full batch of messages as an array. */
  batch?: boolean;
  /** DTO class for class-validator validation on incoming payloads. */
  validate?: new (...args: any[]) => any;
  /** Idempotency deduplication config (QueueHandler only for v1.0). */
  idempotency?: {
    /** TTL in seconds for the deduplication window (default: 300). */
    ttlSeconds?: number;
    /** Max cache entries (default: 10000). */
    maxCacheSize?: number;
  };
}
