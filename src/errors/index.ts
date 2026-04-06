export { KubeMQRpcException } from './kubemq-rpc.exception.js';
export type { KubeMQRpcError } from './kubemq-rpc.exception.js';
export { mapErrorToRpcException, mapToRpcException } from './error-mapper.js';
export { SerializationError } from './serialization.error.js';
// Re-export ConnectionNotReadyError from kubemq-js for convenience (no local class -- see spec 5.1.1b)
export { ConnectionNotReadyError } from 'kubemq-js';
