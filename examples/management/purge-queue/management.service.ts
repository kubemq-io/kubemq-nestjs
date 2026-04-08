import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy, KubeMQRecord } from '@kubemq/nestjs-transport';
import type { KubeMQClient } from 'kubemq-js';
import { firstValueFrom } from 'rxjs';

const CHANNEL = 'nestjs-management.purge-queue';

@Injectable()
export class ManagementService {
  private readonly logger = new Logger(ManagementService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async run(): Promise<void> {
    await this.client.connect();
    const raw = this.client.unwrap<KubeMQClient>();

    const messageCount = 5;
    for (let i = 1; i <= messageCount; i++) {
      await firstValueFrom(
        this.client.emit(CHANNEL, new KubeMQRecord({ seq: i, data: `message-${i}` }).asQueue()),
      );
    }
    this.logger.log(`Sent ${messageCount} messages to queue`);

    await raw.purgeQueue(CHANNEL);
    this.logger.log(`Queue "${CHANNEL}" purged successfully`);

    await raw.deleteChannel(CHANNEL, 'queues');
    this.logger.log('Cleanup: deleted queue channel');
  }
}
