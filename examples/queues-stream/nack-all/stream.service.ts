import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import type { KubeMQClient } from 'kubemq-js';

const CHANNEL = 'nestjs-queues-stream.nack-all';

@Injectable()
export class NackAllService {
  private readonly logger = new Logger(NackAllService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async run(): Promise<void> {
    await this.client.connect();
    const raw = this.client.unwrap<KubeMQClient>();

    this.logger.log('Sending 3 messages to queue...');
    for (let i = 1; i <= 3; i++) {
      await raw.sendQueueMessage({
        channel: CHANNEL,
        body: JSON.stringify({ item: i }),
      });
    }

    this.logger.log('Stream receive — will NACK all messages...');
    await new Promise<void>((resolve, reject) => {
      const handle = raw.streamQueueMessages({
        channel: CHANNEL,
        maxMessages: 10,
        waitTimeoutSeconds: 5,
      });

      handle.onMessages((messages) => {
        this.logger.log(`Received ${messages.length} messages — nacking all`);
        handle.nackAll();
        this.logger.log('All messages nacked (returned to queue for redelivery)');
        handle.close();
        resolve();
      });

      handle.onError((err) => {
        handle.close();
        reject(err);
      });
    });

    await new Promise((r) => setTimeout(r, 1000));

    this.logger.log('Re-receiving to verify redelivery...');
    const redelivered = await raw.receiveQueueMessages({
      channel: CHANNEL,
      maxMessages: 1,
      waitTimeoutSeconds: 5,
    });
    for (const msg of redelivered) {
      this.logger.log(`Redelivered msg seq=${msg.sequence} receiveCount=${msg.receiveCount}`);
      await msg.ack();
    }
  }
}
