import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import type { KubeMQClient } from 'kubemq-js';

const CHANNEL = 'nestjs-queues.batch-send';
const BATCH_SIZE = 5;

@Injectable()
export class BatchSendService {
  private readonly logger = new Logger(BatchSendService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async sendBatch(): Promise<void> {
    await this.client.connect();
    const raw = this.client.unwrap<KubeMQClient>();

    this.logger.log(`Sending ${BATCH_SIZE} queue messages...`);
    for (let i = 1; i <= BATCH_SIZE; i++) {
      await raw.sendQueueMessage({
        channel: CHANNEL,
        body: JSON.stringify({ batchItem: i, payload: `item-${i}` }),
      });
      this.logger.log(`Sent message ${i}/${BATCH_SIZE} to ${CHANNEL}`);
    }
    this.logger.log('Batch send complete');
  }
}
