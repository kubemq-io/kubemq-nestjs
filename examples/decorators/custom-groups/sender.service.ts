import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SenderService {
  private readonly logger = new Logger(SenderService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async run(): Promise<void> {
    await this.client.connect();

    this.logger.log('Sending command to orders channel (billing & shipping groups compete)...');
    const result = await firstValueFrom(
      this.client.send('nestjs-decorators.custom-groups-orders', {
        orderId: 'ORD-500',
        total: 99.99,
      }),
    );
    this.logger.log(`Command response: ${JSON.stringify(result)}`);

    this.logger.log('Emitting notification (each group receives a copy)...');
    await firstValueFrom(
      this.client.emit('nestjs-decorators.custom-groups-notifications', {
        type: 'order-placed',
        orderId: 'ORD-500',
      }),
    );
    this.logger.log('Notification emitted to all groups');
  }
}
