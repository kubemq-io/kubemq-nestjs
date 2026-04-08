import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import type { KubeMQClient } from 'kubemq-js';

const SOURCE_CHANNEL = 'nestjs-queues-stream.requeue-all';
const TARGET_CHANNEL = 'nestjs-queues-stream.requeue-all.target';

@Injectable()
export class ReQueueAllService {
  private readonly logger = new Logger(ReQueueAllService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async run(): Promise<void> {
    await this.client.connect();
    const raw = this.client.unwrap<KubeMQClient>();

    this.logger.log('Sending 2 messages to source channel...');
    for (let i = 1; i <= 2; i++) {
      await raw.sendQueueMessage({
        channel: SOURCE_CHANNEL,
        body: JSON.stringify({ item: i }),
      });
    }

    this.logger.log('Re-queuing all messages to target channel...');
    await new Promise<void>((resolve, reject) => {
      const handle = raw.streamQueueMessages({
        channel: SOURCE_CHANNEL,
        maxMessages: 10,
        waitTimeoutSeconds: 5,
      });

      handle.onMessages(() => {
        handle.reQueueAll(TARGET_CHANNEL);
        this.logger.log(`Messages re-queued to ${TARGET_CHANNEL}`);
        handle.close();
        resolve();
      });

      handle.onError((err) => {
        handle.close();
        reject(err);
      });
    });

    await new Promise((r) => setTimeout(r, 1000));

    this.logger.log('Verifying messages on target channel...');
    const targetMsgs = await raw.receiveQueueMessages({
      channel: TARGET_CHANNEL,
      maxMessages: 10,
      waitTimeoutSeconds: 5,
    });

    for (const msg of targetMsgs) {
      const body = new TextDecoder().decode(msg.body ?? new Uint8Array());
      this.logger.log(`Target msg seq=${msg.sequence}: ${body}`);
      await msg.ack();
    }
  }
}
