import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, EventHandler, KubeMQCommandContext, KubeMQContext } from '@kubemq/nestjs-transport';

@Injectable()
export class BillingHandlerService {
  private readonly logger = new Logger('BillingHandler');

  @CommandHandler('nestjs-decorators.custom-groups-orders', { group: 'billing' })
  async handleOrder(data: Record<string, unknown>, ctx: KubeMQCommandContext) {
    this.logger.log(`[billing] Order on ${ctx.channel}: ${JSON.stringify(data)}`);
    return { handler: 'billing', invoiceCreated: true };
  }

  @EventHandler('nestjs-decorators.custom-groups-notifications', { group: 'billing' })
  async handleNotification(data: unknown, ctx: KubeMQContext): Promise<void> {
    this.logger.log(`[billing] Notification on ${ctx.channel}: ${JSON.stringify(data)}`);
  }
}
