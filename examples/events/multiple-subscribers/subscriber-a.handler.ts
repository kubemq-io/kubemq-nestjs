import { Injectable, Logger } from '@nestjs/common';
import { EventHandler, KubeMQContext } from '@kubemq/nestjs-transport';

@Injectable()
export class SubscriberA {
  private readonly logger = new Logger('SubscriberA');

  @EventHandler('nestjs-events.multiple-subscribers')
  async handleEvent(data: unknown, ctx: KubeMQContext): Promise<void> {
    this.logger.log(`Received event on ${ctx.channel}: ${JSON.stringify(data)}`);
  }
}
