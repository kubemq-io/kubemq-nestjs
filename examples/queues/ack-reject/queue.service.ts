import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy, KubeMQRecord } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class QueueSenderService {
  private readonly logger = new Logger(QueueSenderService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async sendMessages(): Promise<void> {
    await this.client.connect();

    this.logger.log('Sending valid message...');
    const valid = new KubeMQRecord({ status: 'valid', data: 'process-me' }).asQueue();
    await firstValueFrom(this.client.emit('nestjs-queues.ack-reject', valid));

    this.logger.log('Sending invalid message...');
    const invalid = new KubeMQRecord({ status: 'invalid', data: 'bad-data' }).asQueue();
    await firstValueFrom(this.client.emit('nestjs-queues.ack-reject', invalid));
  }
}
