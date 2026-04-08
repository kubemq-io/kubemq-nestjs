import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import type { KubeMQClient } from 'kubemq-js';

const CHANNEL = 'nestjs-queues.ack-all';

@Injectable()
export class AckAllService {
  private readonly logger = new Logger(AckAllService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async sendAndAckAll(): Promise<void> {
    await this.client.connect();
    const raw = this.client.unwrap<KubeMQClient>();

    this.logger.log('Sending 3 messages to queue...');
    for (let i = 1; i <= 3; i++) {
      await raw.sendQueueMessage({
        channel: CHANNEL,
        body: JSON.stringify({ item: i }),
      });
    }

    this.logger.log('Receiving and acking all messages...');
    const messages = await raw.receiveQueueMessages({
      channel: CHANNEL,
      maxMessages: 10,
      waitTimeoutSeconds: 5,
    });

    for (const msg of messages) {
      const body = new TextDecoder().decode(msg.body ?? new Uint8Array());
      this.logger.log(`Received message seq=${msg.sequence}: ${body}`);
      await msg.ack();
    }
    this.logger.log(`All ${messages.length} messages received and acknowledged`);
  }
}
