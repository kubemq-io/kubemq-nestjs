import type { TlsOptions, RetryPolicy, ReconnectionPolicy, KeepaliveOptions } from 'kubemq-js';
import type { KubeMQSerializer, KubeMQDeserializer } from '../serialization/interfaces.js';

export interface CircuitBreakerOptions {
  /** Number of consecutive failures to open the circuit (default: 5). */
  failureThreshold?: number;
  /** Milliseconds to wait before transitioning from open to half-open (default: 30000). */
  resetTimeout?: number;
  /** Number of probe requests allowed in half-open state (default: 1). */
  halfOpenRequests?: number;
}

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
  /** Circuit breaker wrapping client operations. */
  circuitBreaker?: CircuitBreakerOptions;
  /** Channel prefix prepended to all send/emit channel names (set by forFeature). */
  channelPrefix?: string;
}

export interface QueueMessagePolicyOptions {
  expirationSeconds?: number;
  delaySeconds?: number;
  maxReceiveCount?: number;
  maxReceiveQueue?: string;
}
