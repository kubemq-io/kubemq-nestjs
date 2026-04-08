import { Injectable, Logger } from '@nestjs/common';
import { EventHandler, KubeMQContext } from '@kubemq/nestjs-transport';

@Injectable()
export class EventHandlerService {
  private readonly logger = new Logger('EventHandler');

  @EventHandler('nestjs-events.wildcard.*')
  async handleEvent(data: unknown, ctx: KubeMQContext): Promise<void> {
    this.logger.log(
      `Wildcard match on ${ctx.channel}: ${JSON.stringify(data)}`,
    );
  }
}
