import { EventPattern } from '@nestjs/microservices';
import { KUBEMQ_TRANSPORT, KUBEMQ_HANDLER_METADATA } from '../constants.js';
import type { KubeMQPatternType } from '../constants.js';
import type { QueueHandlerOptions } from '../interfaces/decorator-options.interface.js';

export function QueueHandler(
  channel: string | string[],
  options?: QueueHandlerOptions,
): MethodDecorator {
  const channels = Array.isArray(channel) ? channel : [channel];
  const metadata = {
    transport: KUBEMQ_TRANSPORT,
    type: 'queue' as KubeMQPatternType,
    queue: true,
    ...options,
  };

  return (target, propertyKey, descriptor) => {
    for (const ch of channels) {
      EventPattern(ch, metadata)(target, propertyKey, descriptor);
    }
    Reflect.defineMetadata(
      KUBEMQ_HANDLER_METADATA,
      { type: 'queue', channels, ...options },
      descriptor.value!,
    );
    return descriptor;
  };
}
