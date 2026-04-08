import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import type { KubeMQClient } from 'kubemq-js';

const CHANNEL = 'nestjs-queues-stream.dead-letter-policy';
const DLQ_CHANNEL = 'nestjs-queues-stream.dead-letter-policy.dlq';

@Injectable()
export class DeadLetterPolicyService {
  private readonly logger = new Logger(DeadLetterPolicyService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async run(): Promise<void> {
    await this.client.connect();
    const raw = this.client.unwrap<KubeMQClient>();

    this.logger.log('Sending message with DLQ policy via upstream...');
    const upstream = raw.createQueueUpstream();
    try {
      await upstream.send([
        {
          channel: CHANNEL,
          body: JSON.stringify({ poison: 'data' }),
          policy: {
            maxReceiveCount: 1,
            maxReceiveQueue: DLQ_CHANNEL,
          },
        },
      ]);
    } finally {
      upstream.close();
    }

    this.logger.log('Nacking message to trigger DLQ routing...');
    await new Promise<void>((resolve, reject) => {
      const handle = raw.streamQueueMessages({
        channel: CHANNEL,
        maxMessages: 1,
        waitTimeoutSeconds: 5,
      });

      handle.onMessages(() => {
        handle.nackAll();
        this.logger.log('Nacked — message routed to DLQ channel');
        handle.close();
        resolve();
      });

      handle.onError((err) => {
        handle.close();
        reject(err);
      });
    });

    await new Promise((r) => setTimeout(r, 1000));

    this.logger.log('Checking DLQ channel...');
    const dlqMessages = await raw.receiveQueueMessages({
      channel: DLQ_CHANNEL,
      maxMessages: 1,
      waitTimeoutSeconds: 5,
    });

    for (const msg of dlqMessages) {
      const body = new TextDecoder().decode(msg.body ?? new Uint8Array());
      this.logger.log(`DLQ message: ${body}`);
      await msg.ack();
    }
  }
}
