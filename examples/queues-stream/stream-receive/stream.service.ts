import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import type { KubeMQClient } from 'kubemq-js';

const CHANNEL = 'nestjs-queues-stream.receive';

@Injectable()
export class StreamReceiveService {
  private readonly logger = new Logger(StreamReceiveService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async run(): Promise<void> {
    await this.client.connect();
    const raw = this.client.unwrap<KubeMQClient>();

    this.logger.log('Sending 3 messages to queue...');
    for (let i = 1; i <= 3; i++) {
      await raw.sendQueueMessage({
        channel: CHANNEL,
        body: JSON.stringify({ index: i }),
      });
    }

    this.logger.log('Starting stream consumer...');
    const handle = raw.streamQueueMessages({
      channel: CHANNEL,
      maxMessages: 10,
      waitTimeoutSeconds: 5,
    });

    handle.onMessages((messages) => {
      this.logger.log(`Stream batch received (${messages.length} messages):`);
      for (const msg of messages) {
        const body = new TextDecoder().decode(msg.body ?? new Uint8Array());
        this.logger.log(`  msg seq=${msg.sequence}: ${body}`);
      }
      handle.ackAll();
      this.logger.log('Acked all messages');
    });

    handle.onError((err) => {
      this.logger.error(`Stream error: ${err.message}`);
    });

    handle.onClose(() => {
      this.logger.log('Stream closed');
    });
  }
}
