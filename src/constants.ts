export const KUBEMQ_TRANSPORT = 'kubemq';
export const KUBEMQ_MODULE_OPTIONS = 'KUBEMQ_MODULE_OPTIONS';
// KUBEMQ_CLIENT_TOKEN REMOVED (M-27) -- was unused
export const KUBEMQ_HANDLER_METADATA = 'kubemq:handler';

export const TAG_PATTERN = 'nestjs:pattern';
export const TAG_ID = 'nestjs:id';
export const TAG_TYPE = 'nestjs:type';
export const TAG_CONTENT_TYPE = 'nestjs:content-type';

export type KubeMQPatternType = 'command' | 'query' | 'event' | 'event_store' | 'queue';
