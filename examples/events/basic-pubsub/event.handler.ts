import { Injectable, Logger } from '@nestjs/common';
import { EventHandler, KubeMQContext } from '@kubemq/nestjs-transport';

@Injectable()
export class EventHandlerService {
  private readonly logger = new Logger('EventHandler');

  @EventHandler('nestjs-events.basic-pubsub')
  async handleEvent(data: unknown, ctx: KubeMQContext): Promise<void> {
    this.logger.log(`Received event on ${ctx.channel}: ${JSON.stringify(data)}`);
  }
}
