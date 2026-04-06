import { MessagePattern } from '@nestjs/microservices';
import { KUBEMQ_TRANSPORT, KUBEMQ_HANDLER_METADATA } from '../constants.js';
import type { KubeMQPatternType } from '../constants.js';
import type { CommandHandlerOptions } from '../interfaces/decorator-options.interface.js';

export function CommandHandler(
  channel: string | string[],
  options?: CommandHandlerOptions,
): MethodDecorator {
  const channels = Array.isArray(channel) ? channel : [channel];
  const metadata = {
    transport: KUBEMQ_TRANSPORT,
    type: 'command' as KubeMQPatternType,
    ...options,
  };

  return (target, propertyKey, descriptor) => {
    for (const ch of channels) {
      MessagePattern(ch, metadata)(target, propertyKey, descriptor);
    }
    Reflect.defineMetadata(
      KUBEMQ_HANDLER_METADATA,
      { type: 'command', channels, ...options },
      descriptor.value!,
    );
    return descriptor;
  };
}
