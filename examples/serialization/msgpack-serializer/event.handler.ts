import { Controller, Logger } from '@nestjs/common';
import { EventHandler, KubeMQContext } from '@kubemq/nestjs-transport';
import { Ctx, Payload } from '@nestjs/microservices';

@Controller()
export class EventHandlerService {
  private readonly logger = new Logger('MsgPackHandler');

  @EventHandler('nestjs-serialization.msgpack')
  handleEvent(@Payload() data: unknown, @Ctx() ctx: KubeMQContext): void {
    this.logger.log(`Received (MessagePack decoded): ${JSON.stringify(data)}`);
    this.logger.log(`Channel: ${ctx.channel}`);
  }
}
