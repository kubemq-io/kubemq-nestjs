import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import type { KubeMQClient } from 'kubemq-js';

const CHANNEL = 'nestjs-queues-stream.poll-mode';

@Injectable()
export class PollModeService {
  private readonly logger = new Logger(PollModeService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async run(): Promise<void> {
    await this.client.connect();
    const raw = this.client.unwrap<KubeMQClient>();

    this.logger.log('Sending 5 messages to queue...');
    for (let i = 1; i <= 5; i++) {
      await raw.sendQueueMessage({
        channel: CHANNEL,
        body: JSON.stringify({ item: i }),
      });
    }

    let pollCount = 0;
    let totalReceived = 0;

    const maxPolls = 10;
    while (totalReceived < 5 && pollCount < maxPolls) {
      pollCount++;
      const messages = await raw.receiveQueueMessages({
        channel: CHANNEL,
        maxMessages: 3,
        waitTimeoutSeconds: 5,
      });

      this.logger.log(`Poll ${pollCount}: received ${messages.length} messages`);
      for (const msg of messages) {
        const body = new TextDecoder().decode(msg.body ?? new Uint8Array());
        this.logger.log(`  msg seq=${msg.sequence}: ${body}`);
        await msg.ack();
        totalReceived++;
      }

      if (messages.length === 0) {
        this.logger.warn(`Poll ${pollCount} returned empty batch`);
        break;
      }
    }

    if (totalReceived >= 5) {
      this.logger.log('All messages consumed via polling');
    } else {
      this.logger.warn(`Polling ended with only ${totalReceived}/5 messages consumed`);
    }
  }
}
