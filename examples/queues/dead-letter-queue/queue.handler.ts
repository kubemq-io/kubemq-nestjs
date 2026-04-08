import { Injectable, Logger } from '@nestjs/common';
import { QueueHandler, KubeMQQueueContext } from '@kubemq/nestjs-transport';

@Injectable()
export class PrimaryHandlerService {
  private readonly logger = new Logger('PrimaryHandler');

  @QueueHandler('nestjs-queues.dead-letter-queue', { manualAck: true })
  async handleMessage(data: unknown, ctx: KubeMQQueueContext): Promise<void> {
    this.logger.log('Received poison message — NACK to trigger DLQ');
    ctx.nack();
  }
}
