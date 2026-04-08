import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async publishBatch(): Promise<void> {
    await this.client.connect();
    this.logger.log('Publishing 5 events to consumer group channel...');

    for (let i = 1; i <= 5; i++) {
      await firstValueFrom(
        this.client.emit('nestjs-events.consumer-group', { seq: i }),
      );
    }

    this.logger.log('All events published');
  }
}
