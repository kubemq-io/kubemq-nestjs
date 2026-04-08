import { CommandHandler as NestCommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { CreateOrderCommand } from './create-order.command.js';
import { OrderCreatedEvent } from './order-created.event.js';

@NestCommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  private readonly logger = new Logger(CreateOrderHandler.name);
  private orderCounter = 0;

  constructor(private readonly eventBus: EventBus) {}

  async execute(command: CreateOrderCommand): Promise<string> {
    this.orderCounter++;
    const orderId = `ORD-${String(this.orderCounter).padStart(3, '0')}`;
    this.logger.log(`Creating order ${orderId}: product=${command.productId}, qty=${command.quantity}`);

    this.eventBus.publish(new OrderCreatedEvent(orderId, command.productId, command.quantity));
    return orderId;
  }
}
