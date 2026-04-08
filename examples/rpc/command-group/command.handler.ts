import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, KubeMQCommandContext } from '@kubemq/nestjs-transport';

@Injectable()
export class CommandHandlerService {
  private readonly logger = new Logger('CommandHandler');
  private count = 0;

  @CommandHandler('nestjs-rpc.command-group', { group: 'nestjs-rpc-cmd-group' })
  async handle(data: Record<string, unknown>, ctx: KubeMQCommandContext) {
    this.count++;
    this.logger.log(
      `[group=nestjs-rpc-cmd-group] Command ${this.count} on ${ctx.channel}: ${JSON.stringify(data)}`,
    );
    return { executed: true, seq: data.seq, group: 'nestjs-rpc-cmd-group' };
  }
}
