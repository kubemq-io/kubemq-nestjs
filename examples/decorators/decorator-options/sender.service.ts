import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy, KubeMQRecord } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SenderService {
  private readonly logger = new Logger(SenderService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async runAll(): Promise<void> {
    await this.client.connect();

    this.logger.log('Sending command (group=cmd-workers)...');
    const cmdResult = await firstValueFrom(
      this.client.send('nestjs-decorators.options-cmd', { action: 'deploy' }),
    );
    this.logger.log(`Command response: ${JSON.stringify(cmdResult)}`);

    this.logger.log('Sending query (group=query-workers, maxConcurrent=5)...');
    const queryResult = await firstValueFrom(
      this.client.send('nestjs-decorators.options-query', new KubeMQRecord({ search: 'config' }).asQuery()),
    );
    this.logger.log(`Query response: ${JSON.stringify(queryResult)}`);

    this.logger.log('Emitting event (group=event-group)...');
    await firstValueFrom(
      this.client.emit('nestjs-decorators.options-event', { type: 'alert' }),
    );

    this.logger.log('Emitting event-store (startFrom=first)...');
    await firstValueFrom(
      this.client.emit(
        'nestjs-decorators.options-event-store',
        new KubeMQRecord({ audit: 'access' }).asEventStore(),
      ),
    );

    this.logger.log('Sending queue message (maxMessages=10, wait=5s)...');
    await firstValueFrom(
      this.client.emit(
        'nestjs-decorators.options-queue',
        new KubeMQRecord({ task: 'resize' }).asQueue(),
      ),
    );

    this.logger.log('All messages sent');
  }
}
