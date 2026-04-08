import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy, KubeMQRecord } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EventStoreService {
  private readonly logger = new Logger(EventStoreService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async publishBatch(): Promise<void> {
    await this.client.connect();
    this.logger.log('Publishing 5 events to store...');

    for (let i = 1; i <= 5; i++) {
      await firstValueFrom(
        this.client.emit(
          'nestjs-events-store.consumer-group',
          new KubeMQRecord({ seq: i }).asEventStore(),
        ),
      );
    }

    this.logger.log('All events published to store');
  }
}
