import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CreateOrderCommand } from './create-order.command.js';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(private readonly commandBus: CommandBus) {}

  async createOrder(productId: string, quantity: number): Promise<void> {
    this.logger.log(`Dispatching CreateOrderCommand: product=${productId}`);
    await this.commandBus.execute(new CreateOrderCommand(productId, quantity));
    this.logger.log('Command executed successfully');
  }
}
