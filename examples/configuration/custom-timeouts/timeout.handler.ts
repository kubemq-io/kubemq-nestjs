import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, KubeMQCommandContext } from '@kubemq/nestjs-transport';

@Injectable()
export class TimeoutHandler {
  private readonly logger = new Logger(TimeoutHandler.name);

  @CommandHandler('nestjs-configuration.custom-timeouts')
  async handleCommand(data: unknown, ctx: KubeMQCommandContext): Promise<{ ok: true }> {
    this.logger.log(`Received command on ${ctx.channel} from ${ctx.fromClientId}`);
    return { ok: true };
  }
}
