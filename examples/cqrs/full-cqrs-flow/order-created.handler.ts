import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { OrderCreatedEvent } from './order-created.event.js';
import { OrderStore } from './order.store.js';

@EventsHandler(OrderCreatedEvent)
export class OrderCreatedHandler implements IEventHandler<OrderCreatedEvent> {
  private readonly logger = new Logger(OrderCreatedHandler.name);

  constructor(private readonly store: OrderStore) {}

  handle(event: OrderCreatedEvent): void {
    this.logger.log(`Event received — storing order ${event.orderId}`);
    this.store.save({
      orderId: event.orderId,
      productId: event.productId,
      quantity: event.quantity,
      status: 'created',
    });
  }
}
