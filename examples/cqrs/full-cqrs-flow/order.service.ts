import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateOrderCommand } from './create-order.command.js';
import { GetOrderQuery, GetOrderResult } from './get-order.query.js';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async createAndVerifyOrder(productId: string, quantity: number): Promise<void> {
    this.logger.log(`Step 1: Dispatching CreateOrderCommand for product=${productId}`);
    const orderId = await this.commandBus.execute<CreateOrderCommand, string>(
      new CreateOrderCommand(productId, quantity),
    );
    this.logger.log(`Step 1 complete: orderId=${orderId}`);

    await new Promise((r) => setTimeout(r, 500));

    this.logger.log(`Step 2: Querying order ${orderId}`);
    const result = await this.queryBus.execute<GetOrderQuery, GetOrderResult>(
      new GetOrderQuery(orderId),
    );
    this.logger.log(`Step 2 complete: ${JSON.stringify(result)}`);
  }
}
