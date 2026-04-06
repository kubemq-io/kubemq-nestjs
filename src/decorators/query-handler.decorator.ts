import { MessagePattern } from '@nestjs/microservices';
import { KUBEMQ_TRANSPORT, KUBEMQ_HANDLER_METADATA } from '../constants.js';
import type { KubeMQPatternType } from '../constants.js';
import type { QueryHandlerOptions } from '../interfaces/decorator-options.interface.js';

export function QueryHandler(
  channel: string | string[],
  options?: QueryHandlerOptions,
): MethodDecorator {
  const channels = Array.isArray(channel) ? channel : [channel];
  const metadata = {
    transport: KUBEMQ_TRANSPORT,
    type: 'query' as KubeMQPatternType,
    query: true,
    ...options,
  };

  return (target, propertyKey, descriptor) => {
    for (const ch of channels) {
      MessagePattern(ch, metadata)(target, propertyKey, descriptor);
    }
    Reflect.defineMetadata(
      KUBEMQ_HANDLER_METADATA,
      { type: 'query', channels, ...options },
      descriptor.value!,
    );
    return descriptor;
  };
}
