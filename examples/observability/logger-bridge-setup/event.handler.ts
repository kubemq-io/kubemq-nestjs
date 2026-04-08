import { Injectable, Logger } from '@nestjs/common';
import { EventHandler, KubeMQContext } from '@kubemq/nestjs-transport';

@Injectable()
export class LoggerDemoHandler {
  private readonly logger = new Logger('LoggerDemoHandler');

  @EventHandler('nestjs-observability.logger-bridge')
  async handleEvent(data: unknown, ctx: KubeMQContext): Promise<void> {
    this.logger.log(`Received event on ${ctx.channel}: ${JSON.stringify(data)}`);
  }
}
