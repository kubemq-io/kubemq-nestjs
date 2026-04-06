import type { EventStoreStartFrom } from './handler-metadata.interface.js';

export interface KubeMQHandlerBaseOptions {
  group?: string;
  maxConcurrent?: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- intentionally empty; reserved for future command-specific options
export interface CommandHandlerOptions extends KubeMQHandlerBaseOptions {
  // timeout REMOVED -- server-side decorators do not control send timeouts
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- intentionally empty; reserved for future query-specific options
export interface QueryHandlerOptions extends KubeMQHandlerBaseOptions {
  // timeout, cacheKey, cacheTtl REMOVED -- client-only concepts
}

export type EventHandlerOptions = KubeMQHandlerBaseOptions;

export interface EventStoreHandlerOptions extends KubeMQHandlerBaseOptions {
  startFrom?: EventStoreStartFrom; // CHANGED (M-15) -- now accepts numeric 1-6
  startValue?: number;
}

export interface QueueHandlerOptions extends KubeMQHandlerBaseOptions {
  manualAck?: boolean;
  maxMessages?: number;
  waitTimeoutSeconds?: number;
  /** When true, handler receives the full batch of messages as an array. */
  batch?: boolean;
}
