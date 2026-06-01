export const KUBEMQ_TRANSPORT = 'kubemq';
export const KUBEMQ_MODULE_OPTIONS = 'KUBEMQ_MODULE_OPTIONS';
// KUBEMQ_CLIENT_TOKEN REMOVED (M-27) -- was unused
export const KUBEMQ_HANDLER_METADATA = 'kubemq:handler';
export const KUBEMQ_SDK_CLIENT = 'KUBEMQ_SDK_CLIENT';

export const TAG_PATTERN = 'nestjs:pattern';
export const TAG_ID = 'nestjs:id';
export const TAG_TYPE = 'nestjs:type';
export const TAG_CONTENT_TYPE = 'nestjs:content-type';

export const TAG_CORRELATION_ID = 'x-correlation-id';
export const TAG_CAUSATION_ID = 'x-causation-id';
export const TAG_IDEMPOTENCY_KEY = 'x-idempotency-key';
export const TAG_TRACEPARENT = 'traceparent';
export const TAG_TRACESTATE = 'tracestate';

export type KubeMQPatternType = 'command' | 'query' | 'event' | 'event_store' | 'queue';
