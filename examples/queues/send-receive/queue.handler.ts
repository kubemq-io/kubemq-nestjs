import { Injectable, Logger } from '@nestjs/common';
import { QueueHandler, KubeMQQueueContext } from '@kubemq/nestjs-transport';

@Injectable()
export class QueueHandlerService {
  private readonly logger = new Logger('QueueHandlerService');

  @QueueHandler('nestjs-queues.send-receive', { manualAck: true })
  async handleMessage(data: unknown, ctx: KubeMQQueueContext): Promise<void> {
    this.logger.log(`Received on ${ctx.channel}: ${JSON.stringify(data)}`);
    ctx.ack();
    this.logger.log('Message acknowledged');
  }
}
