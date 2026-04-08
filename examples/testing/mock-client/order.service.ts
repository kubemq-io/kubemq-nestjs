import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrderService {
  constructor(@Inject('KUBEMQ_SERVICE') private readonly client: ClientProxy) {}

  async createOrder(product: string, quantity: number): Promise<{ orderId: string }> {
    await this.client.connect();
    return firstValueFrom(
      this.client.send<{ orderId: string }>('nestjs-testing.orders.create', { product, quantity }),
    );
  }

  async notifyOrderShipped(orderId: string): Promise<void> {
    await this.client.connect();
    await firstValueFrom(
      this.client.emit('nestjs-testing.orders.shipped', { orderId }),
    );
  }
}
