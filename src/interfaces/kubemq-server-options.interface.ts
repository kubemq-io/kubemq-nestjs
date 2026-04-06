import type {
  TlsOptions,
  RetryPolicy,
  ReconnectionPolicy,
  KeepaliveOptions,
  EventStoreStartPosition,
} from 'kubemq-js';
import type { KubeMQSerializer, KubeMQDeserializer } from '../serialization/interfaces.js';

export interface KubeMQServerOptions {
  address: string;
  clientId?: string;
  credentials?: string;
  tls?: TlsOptions | boolean;
  group?: string;
  defaultCommandTimeout?: number;
  defaultQueryTimeout?: number;
  eventsStore?: {
    startFrom?: EventStoreStartPosition;
    startValue?: number;
  };
  queue?: {
    maxMessages?: number;
    waitTimeoutSeconds?: number;
  };
  serializer?: KubeMQSerializer;
  deserializer?: KubeMQDeserializer;
  waitForConnection?: boolean;
  callbackTimeoutSeconds?: number;
  retry?: RetryPolicy;
  reconnect?: ReconnectionPolicy;
  keepalive?: KeepaliveOptions;
  tracerProvider?: unknown;
  meterProvider?: unknown;
  verboseErrors?: boolean; // NEW (H-9) -- default false
  verboseHealth?: boolean; // NEW (M-13) -- default false
}
