import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async publish(): Promise<void> {
    await this.client.connect();
    this.logger.log('Publishing event with MessagePack serializer...');
    await firstValueFrom(
      this.client.emit('nestjs-serialization.msgpack', {
        message: 'Hello from MessagePack',
        numbers: [1, 2, 3],
        nested: { key: 'value' },
      }),
    );
    this.logger.log('Event published (body was serialized as MessagePack binary)');
  }
}
