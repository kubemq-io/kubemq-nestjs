import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy, KubeMQRecord } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SenderService {
  private readonly logger = new Logger(SenderService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async runAll(): Promise<void> {
    await this.client.connect();

    this.logger.log('--- Sending command ---');
    const cmdResult = await firstValueFrom(
      this.client.send('nestjs-decorators.all-handlers-cmd', { action: 'create' }),
    );
    this.logger.log(`Command response: ${JSON.stringify(cmdResult)}`);

    this.logger.log('--- Sending query ---');
    const queryResult = await firstValueFrom(
      this.client.send('nestjs-decorators.all-handlers-query', new KubeMQRecord({ search: 'items' }).asQuery()),
    );
    this.logger.log(`Query response: ${JSON.stringify(queryResult)}`);

    this.logger.log('--- Emitting event ---');
    await firstValueFrom(
      this.client.emit('nestjs-decorators.all-handlers-event', { alert: 'user-login' }),
    );
    this.logger.log('Event emitted');

    this.logger.log('--- Emitting event-store ---');
    await firstValueFrom(
      this.client.emit(
        'nestjs-decorators.all-handlers-event-store',
        new KubeMQRecord({ audit: 'config-changed' }).asEventStore(),
      ),
    );
    this.logger.log('Event-store emitted');

    this.logger.log('--- Sending queue message ---');
    await firstValueFrom(
      this.client.emit(
        'nestjs-decorators.all-handlers-queue',
        new KubeMQRecord({ task: 'process-image' }).asQueue(),
      ),
    );
    this.logger.log('Queue message sent');
  }
}
