import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import type { KubeMQClient } from 'kubemq-js';

const CHANNEL = 'nestjs-queues-stream.delay-policy';

@Injectable()
export class DelayPolicyService {
  private readonly logger = new Logger(DelayPolicyService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async run(): Promise<void> {
    await this.client.connect();
    const raw = this.client.unwrap<KubeMQClient>();

    this.logger.log('Sending message with 3s delay via upstream...');
    const upstream = raw.createQueueUpstream();
    try {
      await upstream.send([
        {
          channel: CHANNEL,
          body: JSON.stringify({ task: 'delayed-task' }),
          policy: { delaySeconds: 3 },
        },
      ]);
    } finally {
      upstream.close();
    }
    this.logger.log('Delayed message sent');

    this.logger.log('Waiting 4s for delay to expire...');
    await new Promise((r) => setTimeout(r, 4000));

    this.logger.log('Polling for delayed message...');
    const messages = await raw.receiveQueueMessages({
      channel: CHANNEL,
      maxMessages: 1,
      waitTimeoutSeconds: 5,
    });

    for (const msg of messages) {
      const body = new TextDecoder().decode(msg.body ?? new Uint8Array());
      this.logger.log(`Received delayed message: ${body}`);
      await msg.ack();
    }
  }
}
