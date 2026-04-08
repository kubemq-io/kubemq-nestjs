import { Injectable, Logger } from '@nestjs/common';
import {
  EventHandler,
  CommandHandler,
  KubeMQContext,
  KubeMQCommandContext,
} from '@kubemq/nestjs-transport';

@Injectable()
export class ShutdownHandlers {
  private readonly logger = new Logger(ShutdownHandlers.name);

  @EventHandler('nestjs-error-handling.graceful-shutdown.events')
  async handleEvent(data: unknown, ctx: KubeMQContext): Promise<void> {
    this.logger.log(`Event received on ${ctx.channel}`);
  }

  @CommandHandler('nestjs-error-handling.graceful-shutdown.commands')
  async handleCommand(data: unknown, ctx: KubeMQCommandContext): Promise<{ ok: true }> {
    this.logger.log(`Command received on ${ctx.channel}`);
    return { ok: true };
  }
}
