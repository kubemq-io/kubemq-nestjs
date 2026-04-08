import { Injectable, Logger } from '@nestjs/common';
import { EventHandler, KubeMQContext } from '@kubemq/nestjs-transport';

@Injectable()
export class AnalyticsHandlerService {
  private readonly logger = new Logger('AnalyticsHandler');

  @EventHandler('nestjs-decorators.custom-groups-notifications', { group: 'analytics' })
  async handleNotification(data: unknown, ctx: KubeMQContext): Promise<void> {
    this.logger.log(`[analytics] Notification on ${ctx.channel}: ${JSON.stringify(data)}`);
  }
}
