import { Controller, Logger } from '@nestjs/common';
import { EventHandler } from '@kubemq/nestjs-transport';
import { KubeMQContext } from '@kubemq/nestjs-transport';
import { Ctx, Payload } from '@nestjs/microservices';

@Controller()
export class EventHandlerService {
  private readonly logger = new Logger('DeserializerHandler');

  @EventHandler('nestjs-serialization.custom-deserializer')
  handleEvent(@Payload() data: unknown, @Ctx() ctx: KubeMQContext): void {
    this.logger.log(`Received (deserialized): ${JSON.stringify(data)}`);
    this.logger.log(`Channel: ${ctx.channel}`);
  }
}
