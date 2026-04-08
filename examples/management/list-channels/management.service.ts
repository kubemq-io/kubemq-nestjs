import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import type { KubeMQClient } from 'kubemq-js';

@Injectable()
export class ManagementService {
  private readonly logger = new Logger(ManagementService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async run(): Promise<void> {
    await this.client.connect();
    const raw = this.client.unwrap<KubeMQClient>();

    const types = ['events', 'events_store', 'queues', 'commands', 'queries'] as const;

    for (const type of types) {
      const channels = await raw.listChannels(type, 'nestjs-');
      this.logger.log(`[${type}] Found ${channels.length} channel(s) matching "nestjs-":`);
      for (const ch of channels) {
        this.logger.log(`  ${ch.name} — type: ${ch.type}, active: ${ch.isActive}`);
      }
    }
  }
}
