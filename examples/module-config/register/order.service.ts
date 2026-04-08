import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(@Inject('ORDER_SERVICE') private readonly client: KubeMQClientProxy) {}

  async createOrder(): Promise<void> {
    await this.client.connect();
    this.logger.log('Sending order command via named client...');
    const result = await firstValueFrom(
      this.client.send('nestjs-module-config.register', {
        orderId: 'ORD-100',
        product: 'Widget',
        quantity: 3,
      }),
    );
    this.logger.log(`Order response: ${JSON.stringify(result)}`);
  }
}
