import { CommandHandler as NestCommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { CreateOrderCommand } from './create-order.command.js';

@NestCommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  private readonly logger = new Logger(CreateOrderHandler.name);

  async execute(command: CreateOrderCommand): Promise<{ orderId: string; status: string }> {
    this.logger.log(`Processing: product=${command.productId}, qty=${command.quantity}`);

    if (command.quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    if (command.quantity > 100) {
      throw new Error('Quantity exceeds maximum of 100');
    }

    return {
      orderId: `ORD-${command.productId}-${command.quantity}`,
      status: 'created',
    };
  }
}
