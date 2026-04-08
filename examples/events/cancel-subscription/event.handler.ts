import { Injectable, Logger } from '@nestjs/common';
import { EventHandler, KubeMQContext } from '@kubemq/nestjs-transport';

@Injectable()
export class EventHandlerService {
  private readonly logger = new Logger('EventHandler');
  private count = 0;
  private resolveComplete!: () => void;

  readonly complete = new Promise<void>((resolve) => {
    this.resolveComplete = resolve;
  });

  @EventHandler('nestjs-events.cancel-subscription')
  async handleEvent(data: unknown, ctx: KubeMQContext): Promise<void> {
    this.count++;
    if (this.count >= 3) {
      this.logger.log(
        `Event ${this.count} received on ${ctx.channel} — target reached`,
      );
      this.resolveComplete();
    } else {
      this.logger.log(`Event ${this.count} received on ${ctx.channel}`);
    }
  }
}
