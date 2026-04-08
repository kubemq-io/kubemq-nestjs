import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async publish(): Promise<void> {
    await this.client.connect();
    this.logger.log('Publishing event for custom deserializer...');
    await firstValueFrom(
      this.client.emit('nestjs-serialization.custom-deserializer', {
        message: 'Hello from custom deserializer example',
        value: 42,
      }),
    );
    this.logger.log('Event published');
  }
}
