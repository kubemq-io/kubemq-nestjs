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
      { name: 'nestjs-management.delete-channel-events', type: 'events' },
      { name: 'nestjs-management.delete-channel-queues', type: 'queues' },
    ];

    for (const ch of channels) {
      await raw.createChannel(ch.name, ch.type);
      this.logger.log(`Created ${ch.type} channel: ${ch.name}`);
    }

    this.logger.log('Verifying channels exist...');
    const eventChannels = await raw.listChannels('events', 'nestjs-management.delete-channel');
    this.logger.log(`Found ${eventChannels.length} events channel(s)`);

    for (const ch of channels) {
      await raw.deleteChannel(ch.name, ch.type);
      this.logger.log(`Deleted ${ch.type} channel: ${ch.name}`);
    }

    this.logger.log('All channels deleted');
  }
}
