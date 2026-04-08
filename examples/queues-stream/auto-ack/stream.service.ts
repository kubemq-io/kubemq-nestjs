import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import type { KubeMQClient } from 'kubemq-js';

const CHANNEL = 'nestjs-queues-stream.auto-ack';

@Injectable()
export class AutoAckService {
  private readonly logger = new Logger(AutoAckService.name);

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

    this.logger.log('Starting stream consumer with autoAck: true...');
    await new Promise<void>((resolve, reject) => {
      const handle = raw.streamQueueMessages({
        channel: CHANNEL,
        maxMessages: 10,
        waitTimeoutSeconds: 5,
        autoAck: true,
      });

      handle.onMessages((messages) => {
        for (const msg of messages) {
          const body = new TextDecoder().decode(msg.body ?? new Uint8Array());
          this.logger.log(`Auto-acked message seq=${msg.sequence}: ${body}`);
        }
        this.logger.log('All messages auto-acknowledged — no manual ack needed');
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
