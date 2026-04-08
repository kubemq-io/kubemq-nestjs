import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { OrderCreatedEvent } from './order-created.event.js';

@EventsHandler(OrderCreatedEvent)
export class OrderCreatedHandler implements IEventHandler<OrderCreatedEvent> {
  private readonly logger = new Logger(OrderCreatedHandler.name);

  handle(event: OrderCreatedEvent): void {
    this.logger.log(
      `Order created: id=${event.orderId}, product=${event.product}, qty=${event.quantity}`,
    );
  }
}
