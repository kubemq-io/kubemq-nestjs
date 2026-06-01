export { KubeMQRpcException } from './kubemq-rpc.exception.js';
export type { KubeMQRpcError } from './kubemq-rpc.exception.js';
export { mapErrorToRpcException, mapToRpcException } from './error-mapper.js';
export { SerializationError } from './serialization.error.js';
// Re-export ConnectionNotReadyError from kubemq-js for convenience (no local class -- see spec 5.1.1b)
export { ConnectionNotReadyError } from 'kubemq-js';
export { CircuitBreakerOpenError } from './circuit-breaker.error.js';
export { BackpressureOverflowError } from './backpressure-overflow.error.js';
export { DeadLetterError } from './dlq.error.js';
export { MessageValidationError } from './validation.error.js';
export { DuplicateMessageError } from './idempotency.error.js';
export { ConfigurationError } from './configuration.error.js';
