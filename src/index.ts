// Server
export { KubeMQServer } from './server/kubemq.server.js';

// Client
export { KubeMQClientProxy } from './client/kubemq-client.proxy.js';
export { KubeMQRecord, isKubeMQRecord, KUBEMQ_RECORD_SYMBOL } from './client/kubemq-record.js';

// Module
export { KubeMQModule } from './module/kubemq.module.js';

// Contexts
export { KubeMQContext } from './context/kubemq.context.js';
export { KubeMQCommandContext } from './context/kubemq-command.context.js';
export { KubeMQQueryContext } from './context/kubemq-query.context.js';
export { KubeMQRequestContext } from './context/kubemq-request.context.js';
export { KubeMQEventStoreContext } from './context/kubemq-event-store.context.js';
export { KubeMQQueueContext } from './context/kubemq-queue.context.js';
export { KubeMQQueueBatchContext } from './context/kubemq-queue-batch.context.js';

// Decorators
export {
  CommandHandler,
  QueryHandler,
  EventHandler,
  EventStoreHandler,
  QueueHandler,
} from './decorators/index.js';

// Serialization
export type { KubeMQSerializer, KubeMQDeserializer } from './serialization/interfaces.js';
export { JsonSerializer } from './serialization/json.serializer.js';
export { JsonDeserializer } from './serialization/json.deserializer.js';

// Health
export { KubeMQHealthIndicator } from './health/kubemq.health-indicator.js';
export type { HealthIndicatorResult } from './health/kubemq.health-indicator.js';

// Errors
export { KubeMQRpcException } from './errors/kubemq-rpc.exception.js';
export type { KubeMQRpcError } from './errors/kubemq-rpc.exception.js';
export { mapErrorToRpcException, mapToRpcException } from './errors/error-mapper.js';
export { SerializationError } from './errors/serialization.error.js';
export { ConnectionNotReadyError } from 'kubemq-js';

// Observability
export { createNestKubeMQLogger } from './observability/logger-bridge.js';

// Events
export { KubeMQStatus } from './events/kubemq.events.js';

// Testing (also available via @kubemq/nestjs-transport/testing)
export { MockKubeMQClient } from './testing/mock-kubemq-client.js';
export { MockKubeMQServer } from './testing/mock-kubemq-server.js';

// Interfaces
export type {
  KubeMQServerOptions,
  KubeMQClientOptions,
  QueueMessagePolicyOptions,
  KubeMQModuleOptions,
  KubeMQOptionsFactory,
  KubeMQModuleAsyncOptions,
  KubeMQRegisterOptions,
  KubeMQClientOptionsFactory,
  KubeMQRegisterAsyncOptions,
  KubeMQTestOptions,
  KubeMQHandlerBaseOptions,
  CommandHandlerOptions,
  QueryHandlerOptions,
  EventHandlerOptions,
  EventStoreHandlerOptions,
  QueueHandlerOptions,
} from './interfaces/index.js';
export type {
  KubeMQHandlerMetadata,
  EventStoreStartFrom,
} from './interfaces/handler-metadata.interface.js';

// Constants
export {
  KUBEMQ_TRANSPORT,
  KUBEMQ_MODULE_OPTIONS,
  KUBEMQ_HANDLER_METADATA,
  TAG_PATTERN,
  TAG_ID,
  TAG_TYPE,
  TAG_CONTENT_TYPE,
} from './constants.js';
export type { KubeMQPatternType } from './constants.js';
