import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy, KubeMQRecord } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EventStoreService {
  private readonly logger = new Logger(EventStoreService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async publish(): Promise<void> {
    await this.client.connect();
    this.logger.log('Publishing event to store...');
    await firstValueFrom(
      this.client.emit(
        'nestjs-events-store.persistent-pubsub',
        new KubeMQRecord({ message: 'persistent event' }).asEventStore(),
      ),
    );
    this.logger.log('Event store message published');
  }
}
