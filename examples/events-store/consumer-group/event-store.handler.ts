import { Injectable, Logger } from '@nestjs/common';
import { EventStoreHandler, KubeMQEventStoreContext } from '@kubemq/nestjs-transport';

@Injectable()
export class EventStoreHandlerService {
  private readonly logger = new Logger('EventStoreHandler');

  @EventStoreHandler('nestjs-events-store.consumer-group', {
    group: 'nestjs-es-cg',
  })
  async handleEvent(data: unknown, ctx: KubeMQEventStoreContext): Promise<void> {
    this.logger.log(
      `[group=nestjs-es-cg] Event (seq=${ctx.sequence}) on ${ctx.channel}: ${JSON.stringify(data)}`,
    );
  }
}
