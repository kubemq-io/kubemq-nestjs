import { CommandHandler as NestCommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { CreateOrderCommand } from './create-order.command.js';

@NestCommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  private readonly logger = new Logger(CreateOrderHandler.name);

  async execute(command: CreateOrderCommand): Promise<void> {
    this.logger.log(
      `Processing order: product=${command.productId}, qty=${command.quantity}`,
    );
  }
}
