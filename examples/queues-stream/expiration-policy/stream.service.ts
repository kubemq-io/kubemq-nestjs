import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import type { KubeMQClient } from 'kubemq-js';

const CHANNEL = 'nestjs-queues-stream.expiration-policy';

@Injectable()
export class ExpirationPolicyService {
  private readonly logger = new Logger(ExpirationPolicyService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async run(): Promise<void> {
    await this.client.connect();
    const raw = this.client.unwrap<KubeMQClient>();
    const upstream = raw.createQueueUpstream();
    try {
      this.logger.log('Sending message with 3s expiration via upstream...');
      await upstream.send([
        {
          channel: CHANNEL,
          body: JSON.stringify({ data: 'time-sensitive' }),
          policy: { expirationSeconds: 3 },
        },
      ]);

      this.logger.log('Consuming immediately (should succeed)...');
      const immediate = await raw.receiveQueueMessages({
        channel: CHANNEL,
        maxMessages: 1,
        waitTimeoutSeconds: 2,
      });
      for (const msg of immediate) {
        const body = new TextDecoder().decode(msg.body ?? new Uint8Array());
        this.logger.log(`Received before expiry: ${body}`);
        await msg.ack();
      }

      this.logger.log('Sending another message with 2s expiration...');
      await upstream.send([
        {
          channel: CHANNEL,
          body: JSON.stringify({ data: 'will-expire' }),
          policy: { expirationSeconds: 2 },
        },
      ]);
    } finally {
      upstream.close();
    }

    this.logger.log('Waiting 3s for expiration...');
    await new Promise((r) => setTimeout(r, 3000));

    this.logger.log('Polling for expired message — expecting 0 results...');
    const expired = await raw.receiveQueueMessages({
      channel: CHANNEL,
      maxMessages: 1,
      waitTimeoutSeconds: 2,
    });
    this.logger.log(`Messages received: ${expired.length} (expired as expected)`);
  }
}
