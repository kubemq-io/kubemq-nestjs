import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import type { KubeMQClient } from 'kubemq-js';

const CHANNEL = 'nestjs-queues-stream.ack-range';

@Injectable()
export class AckRangeService {
  private readonly logger = new Logger(AckRangeService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async run(): Promise<void> {
    await this.client.connect();
    const raw = this.client.unwrap<KubeMQClient>();

    this.logger.log('Sending 4 messages to queue...');
    for (let i = 1; i <= 4; i++) {
      await raw.sendQueueMessage({
        channel: CHANNEL,
        body: JSON.stringify({ item: i }),
      });
    }

    this.logger.log('Streaming receive — will ack only specific sequences...');
    await new Promise<void>((resolve, reject) => {
      const handle = raw.streamQueueMessages({
        channel: CHANNEL,
        maxMessages: 10,
        waitTimeoutSeconds: 5,
      });

      handle.onMessages((messages) => {
        const seqs = messages.filter((_, idx) => idx % 2 === 0).map((m) => m.sequence);
        this.logger.log(`Received ${messages.length} messages, acking sequences: [${seqs.join(', ')}]`);
        handle.ackRange(seqs);
        this.logger.log(`Ack range applied — sequences ${seqs.join(' and ')} acknowledged`);
        handle.close();
        resolve();
      });

      handle.onError((err) => {
        handle.close();
        reject(err);
      });
    });
  }
}
