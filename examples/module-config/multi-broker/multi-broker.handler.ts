import { Injectable, Logger } from '@nestjs/common';
import { EventHandler, KubeMQContext } from '@kubemq/nestjs-transport';

@Injectable()
export class MultiBrokerHandlerService {
  private readonly logger = new Logger('MultiBrokerHandler');

  @EventHandler('nestjs-module-config.multi-broker-primary')
  async handlePrimary(data: unknown, ctx: KubeMQContext): Promise<void> {
    this.logger.log(`[PRIMARY] Received on ${ctx.channel}: ${JSON.stringify(data)}`);
  }

  @EventHandler('nestjs-module-config.multi-broker-secondary')
  async handleSecondary(data: unknown, ctx: KubeMQContext): Promise<void> {
    this.logger.log(`[SECONDARY] Received on ${ctx.channel}: ${JSON.stringify(data)}`);
  }
}
