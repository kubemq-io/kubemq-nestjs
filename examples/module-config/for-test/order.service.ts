import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

interface CreateOrderResponse {
  orderId: string;
  status: string;
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(@Inject('KUBEMQ_SERVICE') private readonly client: KubeMQClientProxy) {}

  async createOrder(orderId: string, item: string): Promise<CreateOrderResponse> {
    await this.client.connect();
    this.logger.log(`Creating order ${orderId}...`);
    const result = await firstValueFrom(
      this.client.send('orders.create', { orderId, item }),
    );
    return result as CreateOrderResponse;
  }

  async publishEvent(event: string, data: unknown): Promise<void> {
    await this.client.connect();
    this.logger.log(`Publishing event: ${event}`);
    await firstValueFrom(this.client.emit(event, data));
  }
}
