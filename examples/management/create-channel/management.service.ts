import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import type { KubeMQClient, ChannelType } from 'kubemq-js';

@Injectable()
export class ManagementService {
  private readonly logger = new Logger(ManagementService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async run(): Promise<void> {
    await this.client.connect();
    const raw = this.client.unwrap<KubeMQClient>();

    const channels: Array<{ name: string; type: ChannelType }> = [
      { name: 'nestjs-management.create-channel-events', type: 'events' },
      { name: 'nestjs-management.create-channel-events-store', type: 'events_store' },
      { name: 'nestjs-management.create-channel-queues', type: 'queues' },
      { name: 'nestjs-management.create-channel-commands', type: 'commands' },
      { name: 'nestjs-management.create-channel-queries', type: 'queries' },
    ];

    for (const ch of channels) {
      await raw.createChannel(ch.name, ch.type);
      this.logger.log(`Created ${ch.type} channel: ${ch.name}`);
    }

    this.logger.log('All channels created');

    for (const ch of channels) {
      await raw.deleteChannel(ch.name, ch.type);
    }
    this.logger.log('Cleanup: deleted all created channels');
  }
}
