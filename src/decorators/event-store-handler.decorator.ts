import { EventPattern } from '@nestjs/microservices';
import { KUBEMQ_TRANSPORT, KUBEMQ_HANDLER_METADATA } from '../constants.js';
import type { KubeMQPatternType } from '../constants.js';
import type { EventStoreHandlerOptions } from '../interfaces/decorator-options.interface.js';

export function EventStoreHandler(
  channel: string | string[],
  options?: EventStoreHandlerOptions,
): MethodDecorator {
  const channels = Array.isArray(channel) ? channel : [channel];
  const metadata = {
    transport: KUBEMQ_TRANSPORT,
    type: 'event_store' as KubeMQPatternType,
    store: true,
    ...options,
  };

  return (target, propertyKey, descriptor) => {
    for (const ch of channels) {
      EventPattern(ch, metadata)(target, propertyKey, descriptor);
    }
    Reflect.defineMetadata(
      KUBEMQ_HANDLER_METADATA,
      { type: 'event_store', channels, ...options },
      descriptor.value!,
    );
    return descriptor;
  };
}
