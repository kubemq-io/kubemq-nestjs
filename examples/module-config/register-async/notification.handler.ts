import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, KubeMQCommandContext } from '@kubemq/nestjs-transport';

@Injectable()
export class NotificationHandlerService {
  private readonly logger = new Logger('NotificationHandler');

  @CommandHandler('nestjs-module-config.register-async')
  async handle(data: Record<string, unknown>, ctx: KubeMQCommandContext) {
    this.logger.log(`Notification received on ${ctx.channel}: ${JSON.stringify(data)}`);
    return { sent: true, to: data.to };
  }
}
