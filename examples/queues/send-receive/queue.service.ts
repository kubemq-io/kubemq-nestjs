import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy, KubeMQRecord } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class QueueSenderService {
  private readonly logger = new Logger(QueueSenderService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async send(): Promise<void> {
    await this.client.connect();
    this.logger.log('Sending queue message...');
    const record = new KubeMQRecord({ orderId: 'ORD-001', item: 'Widget' }).asQueue();
    await firstValueFrom(this.client.emit('nestjs-queues.send-receive', record));
    this.logger.log('Queue message sent successfully');
  }
}
