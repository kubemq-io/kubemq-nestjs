import { Injectable, Logger } from '@nestjs/common';
import { EventHandler, KubeMQContext } from '@kubemq/nestjs-transport';

@Injectable()
export class EventHandlerService {
  private readonly logger = new Logger('EventHandler');

  @EventHandler('nestjs-events.consumer-group', { group: 'nestjs-events-cg' })
  async handleEvent(data: unknown, ctx: KubeMQContext): Promise<void> {
    this.logger.log(
      `[group=nestjs-events-cg] Event received on ${ctx.channel}: ${JSON.stringify(data)}`,
    );
  }
}
