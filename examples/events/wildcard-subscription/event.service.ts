import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async publishToSubChannels(): Promise<void> {
    await this.client.connect();

    const channels = [
      { channel: 'nestjs-events.wildcard.orders', data: { type: 'order', id: 1 } },
      { channel: 'nestjs-events.wildcard.users', data: { type: 'user', id: 2 } },
      { channel: 'nestjs-events.wildcard.payments', data: { type: 'payment', id: 3 } },
    ];

    for (const { channel, data } of channels) {
      this.logger.log(`Publishing to ${channel}...`);
      await firstValueFrom(this.client.emit(channel, data));
    }
  }
}
