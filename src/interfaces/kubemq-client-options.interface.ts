import type { TlsOptions, RetryPolicy, ReconnectionPolicy, KeepaliveOptions } from 'kubemq-js';
import type { KubeMQSerializer, KubeMQDeserializer } from '../serialization/interfaces.js';

export interface KubeMQClientOptions {
  address: string;
  clientId?: string;
  credentials?: string;
  tls?: TlsOptions | boolean;
  defaultCommandTimeout?: number;
  defaultQueryTimeout?: number;
  serializer?: KubeMQSerializer;
  deserializer?: KubeMQDeserializer;
  defaultQueuePolicy?: QueueMessagePolicyOptions;
  retry?: RetryPolicy;
  reconnect?: ReconnectionPolicy;
  keepalive?: KeepaliveOptions;
  tracerProvider?: unknown;
  meterProvider?: unknown;
  callbackTimeoutSeconds?: number;
  /** When true, include raw broker/transport messages in {@link KubeMQRpcException} (default: false). */
  verboseErrors?: boolean;
}

export interface QueueMessagePolicyOptions {
  expirationSeconds?: number;
  delaySeconds?: number;
  maxReceiveCount?: number;
  maxReceiveQueue?: string;
}
