import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy, KubeMQRecord } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class QueueSenderService {
  private readonly logger = new Logger(QueueSenderService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async sendPoisonMessage(): Promise<void> {
    await this.client.connect();
    this.logger.log('Sending poison message with DLQ policy...');
    const record = new KubeMQRecord({ action: 'poison', reason: 'bad-format' })
      .asQueue()
      .withMetadata({
        policy: {
          maxReceiveCount: 1,
          maxReceiveQueue: 'nestjs-queues.dead-letter-queue.dlq',
        },
      });
    await firstValueFrom(this.client.emit('nestjs-queues.dead-letter-queue', record));
    this.logger.log('Poison message sent');
  }
}
