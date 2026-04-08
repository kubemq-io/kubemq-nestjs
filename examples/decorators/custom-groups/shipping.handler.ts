import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, EventHandler, KubeMQCommandContext, KubeMQContext } from '@kubemq/nestjs-transport';

@Injectable()
export class ShippingHandlerService {
  private readonly logger = new Logger('ShippingHandler');

  @CommandHandler('nestjs-decorators.custom-groups-orders', { group: 'shipping' })
  async handleOrder(data: Record<string, unknown>, ctx: KubeMQCommandContext) {
    this.logger.log(`[shipping] Order on ${ctx.channel}: ${JSON.stringify(data)}`);
    return { handler: 'shipping', shipmentScheduled: true };
  }

  @EventHandler('nestjs-decorators.custom-groups-notifications', { group: 'shipping' })
  async handleNotification(data: unknown, ctx: KubeMQContext): Promise<void> {
    this.logger.log(`[shipping] Notification on ${ctx.channel}: ${JSON.stringify(data)}`);
  }
}
