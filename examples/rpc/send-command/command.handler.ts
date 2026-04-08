import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, KubeMQCommandContext } from '@kubemq/nestjs-transport';

@Injectable()
export class CommandHandlerService {
  private readonly logger = new Logger('CommandHandler');

  @CommandHandler('nestjs-rpc.send-command')
  async handle(data: Record<string, unknown>, ctx: KubeMQCommandContext) {
    this.logger.log(`Received command on ${ctx.channel}: ${JSON.stringify(data)}`);
    return { executed: true, action: data.action };
  }
}
