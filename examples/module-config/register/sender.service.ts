import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SenderService {
  private readonly logger = new Logger(SenderService.name);

  constructor(@Inject('ORDER_SERVICE') private readonly client: KubeMQClientProxy) {}

  async sendEvent(): Promise<void> {
    await this.client.connect();
    this.logger.log('Sending event via named ORDER_SERVICE client...');
    await firstValueFrom(
      this.client.emit('nestjs-module-config.register', {
        orderId: 'ORD-100',
        product: 'Widget',
        quantity: 3,
      }),
    );
    this.logger.log('Event sent successfully');
  }
}
