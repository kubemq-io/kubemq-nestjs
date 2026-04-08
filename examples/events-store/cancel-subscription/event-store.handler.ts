import { Injectable, Logger } from '@nestjs/common';
import { EventStoreHandler, KubeMQEventStoreContext } from '@kubemq/nestjs-transport';

@Injectable()
export class EventStoreHandlerService {
  private readonly logger = new Logger('EventStoreHandler');
  private count = 0;
  private resolveComplete!: () => void;

  readonly complete = new Promise<void>((resolve) => {
    this.resolveComplete = resolve;
  });

  @EventStoreHandler('nestjs-events-store.cancel-subscription')
  async handleEvent(data: unknown, ctx: KubeMQEventStoreContext): Promise<void> {
    this.count++;
    if (this.count >= 3) {
      this.logger.log(
        `Event ${this.count} (seq=${ctx.sequence}) received — target reached`,
      );
      this.resolveComplete();
    } else {
      this.logger.log(
        `Event ${this.count} (seq=${ctx.sequence}) received on ${ctx.channel}`,
      );
    }
  }
}
