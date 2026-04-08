import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import type { KubeMQClient } from 'kubemq-js';

const CHANNEL = 'nestjs-queues-stream.send';

@Injectable()
export class StreamSendService {
  private readonly logger = new Logger(StreamSendService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async run(): Promise<void> {
    await this.client.connect();
    const raw = this.client.unwrap<KubeMQClient>();

    this.logger.log('Creating upstream stream...');
    const upstream = raw.createQueueUpstream();
    try {
      for (let batch = 1; batch <= 2; batch++) {
        const messages = Array.from({ length: 3 }, (_, i) => ({
          channel: CHANNEL,
          body: JSON.stringify({ batch, item: i + 1 }),
        }));

        this.logger.log(`Sending batch ${batch} (${messages.length} messages)...`);
        const result = await upstream.send(messages);
        this.logger.log(`Batch ${batch} sent — results: ${result.results.length}`);
      }
    } finally {
      upstream.close();
      this.logger.log('Upstream stream closed');
    }
  }
}
