import { Injectable, Logger } from '@nestjs/common';
import { QueueHandler, KubeMQQueueContext } from '@kubemq/nestjs-transport';

interface OrderMessage {
  status: string;
  data: string;
}

@Injectable()
export class QueueHandlerService {
  private readonly logger = new Logger('QueueHandlerService');

  @QueueHandler('nestjs-queues.ack-reject', { manualAck: true })
  async handleMessage(data: OrderMessage, ctx: KubeMQQueueContext): Promise<void> {
    if (data.status === 'valid') {
      ctx.ack();
      this.logger.log(`Received: ${JSON.stringify(data)} — ACK`);
    } else {
      ctx.nack();
      this.logger.log(`Received: ${JSON.stringify(data)} — NACK (rejected)`);
    }
  }
}
