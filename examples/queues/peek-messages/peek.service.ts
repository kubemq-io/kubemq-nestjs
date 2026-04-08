import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import type { KubeMQClient } from 'kubemq-js';

const CHANNEL = 'nestjs-queues.peek-messages';

@Injectable()
export class PeekService {
  private readonly logger = new Logger(PeekService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async sendAndPeek(): Promise<void> {
    await this.client.connect();
    const raw = this.client.unwrap<KubeMQClient>();

    this.logger.log('Sending 3 messages to queue...');
    for (let i = 0; i < 3; i++) {
      await raw.sendQueueMessage({
        channel: CHANNEL,
        body: JSON.stringify({ index: i, info: 'peek-test' }),
      });
    }

    this.logger.log('Peeking at queue (messages remain unconsumed)...');
    const peeked = await raw.peekQueueMessages({
      channel: CHANNEL,
      maxMessages: 10,
      waitTimeoutSeconds: 5,
    });

    for (let i = 0; i < peeked.length; i++) {
      const msg = peeked[i];
      const body = new TextDecoder().decode(msg.body ?? new Uint8Array());
      this.logger.log(`Peeked message ${i + 1}: seq=${msg.sequence} body=${body}`);
    }
    this.logger.log('Peek complete — messages are still in the queue');
  }
}
