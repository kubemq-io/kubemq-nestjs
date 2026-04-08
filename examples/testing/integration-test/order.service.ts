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

  async getOrder(orderId: string): Promise<{ orderId: string; status: string }> {
    await this.client.connect();
    return firstValueFrom(
      this.client.send<{ orderId: string; status: string }>('nestjs-testing.orders.get', {
        orderId,
      }),
    );
  }

  async emitEvent(channel: string, data: unknown): Promise<void> {
    await this.client.connect();
    await firstValueFrom(this.client.emit(channel, data));
  }
}
