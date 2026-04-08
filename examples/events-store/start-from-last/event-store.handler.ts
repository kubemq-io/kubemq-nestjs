import { Injectable, Logger } from '@nestjs/common';
import { EventStoreHandler, KubeMQEventStoreContext } from '@kubemq/nestjs-transport';

@Injectable()
export class EventStoreHandlerService {
  private readonly logger = new Logger('EventStoreHandler');

  @EventStoreHandler('nestjs-events-store.start-from-last', {
    startFrom: 'last',
  })
  async handleEvent(data: unknown, ctx: KubeMQEventStoreContext): Promise<void> {
    this.logger.log(
      `Event (seq=${ctx.sequence}) on ${ctx.channel}: ${JSON.stringify(data)}`,
    );
  }
}
