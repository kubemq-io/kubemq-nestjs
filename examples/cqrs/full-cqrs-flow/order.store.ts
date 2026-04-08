import { Injectable } from '@nestjs/common';

export interface OrderRecord {
  orderId: string;
  productId: string;
  quantity: number;
  status: string;
}

@Injectable()
export class OrderStore {
  private readonly orders = new Map<string, OrderRecord>();

  save(order: OrderRecord): void {
    this.orders.set(order.orderId, order);
  }

  findById(orderId: string): OrderRecord | undefined {
    return this.orders.get(orderId);
  }
}
