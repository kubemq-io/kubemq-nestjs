import { Injectable, Logger } from '@nestjs/common';
import { QueueHandler, KubeMQQueueContext } from '@kubemq/nestjs-transport';

@Injectable()
export class DLQHandlerService {
  private readonly logger = new Logger('DLQHandler');

  @QueueHandler('nestjs-queues.dead-letter-queue.dlq', { manualAck: true })
  async handleDeadLetter(data: unknown, ctx: KubeMQQueueContext): Promise<void> {
    this.logger.log(`Dead-letter received: ${JSON.stringify(data)}`);
    ctx.ack();
    this.logger.log('DLQ message acknowledged');
  }
}
