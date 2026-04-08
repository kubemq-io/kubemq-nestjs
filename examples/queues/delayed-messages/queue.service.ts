import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy, KubeMQRecord } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class QueueSenderService {
  private readonly logger = new Logger(QueueSenderService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async sendDelayed(): Promise<void> {
    await this.client.connect();
    this.logger.log('Sending message with 5s delay...');
    const record = new KubeMQRecord({
      task: 'scheduled-job',
      scheduledFor: '5s-later',
    })
      .asQueue()
      .withMetadata({ policy: { delaySeconds: 5 } });

    await firstValueFrom(this.client.emit('nestjs-queues.delayed-messages', record));
    this.logger.log('Delayed message sent — will be visible in ~5s');
  }
}
