import type { Type, DynamicModule, ForwardReference, InjectionToken } from '@nestjs/common';
import type { KubeMQSerializer, KubeMQDeserializer } from '../serialization/interfaces.js';

export interface KubeMQCqrsOptions {
  commandChannelPrefix?: string;
  queryChannelPrefix?: string;
  eventChannelPrefix?: string;
  persistEvents?: boolean;
  commandTimeout?: number;
  queryTimeout?: number;
  drainTimeoutSeconds?: number;
  /** Override channel segment (after prefix) — default is `message.constructor.name`. */
  channelResolver?: (message: object) => string;
  serializer?: KubeMQSerializer;
  deserializer?: KubeMQDeserializer;
}

export interface KubeMQCqrsAsyncOptions {
  imports?: Array<Type<unknown> | DynamicModule | Promise<DynamicModule> | ForwardReference>;
  useFactory: (...args: unknown[]) => KubeMQCqrsOptions | Promise<KubeMQCqrsOptions>;
  inject?: InjectionToken[];
}
