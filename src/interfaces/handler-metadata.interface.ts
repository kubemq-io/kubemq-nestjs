// src/interfaces/handler-metadata.interface.ts
import type { KubeMQPatternType } from '../constants.js';

export type EventStoreStartFrom =
  | 'new'
  | 'first'
  | 'last'
  | 'sequence'
  | 'time'
  | 'timeDelta'
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6;

export interface KubeMQHandlerMetadata {
  readonly transport?: string;
  readonly type?: KubeMQPatternType;
  readonly group?: string;
  readonly maxConcurrent?: number;
  readonly query?: boolean;
  readonly store?: boolean;
  readonly queue?: boolean;
  readonly manualAck?: boolean;
  readonly startFrom?: EventStoreStartFrom;
  readonly startValue?: number;
  readonly maxMessages?: number;
  readonly waitTimeoutSeconds?: number;
  readonly batch?: boolean;
}
