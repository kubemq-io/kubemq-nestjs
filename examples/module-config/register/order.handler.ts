import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, KubeMQCommandContext } from '@kubemq/nestjs-transport';

@Injectable()
export class OrderHandlerService {
  private readonly logger = new Logger('OrderHandler');

  @CommandHandler('nestjs-module-config.register')
  async handle(data: Record<string, unknown>, ctx: KubeMQCommandContext) {
    this.logger.log(`Order received on ${ctx.channel}: ${JSON.stringify(data)}`);
    return { accepted: true, orderId: data.orderId };
  }
}
