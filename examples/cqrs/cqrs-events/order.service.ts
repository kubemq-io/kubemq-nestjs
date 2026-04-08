import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { OrderCreatedEvent } from './order-created.event.js';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(private readonly eventBus: EventBus) {}

  async createOrder(orderId: string, product: string, quantity: number): Promise<void> {
    this.logger.log(`Publishing OrderCreatedEvent: id=${orderId}`);
    this.eventBus.publish(new OrderCreatedEvent(orderId, product, quantity));
    this.logger.log('Event published successfully');
  }
}
