import { QueryHandler as NestQueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GetOrderQuery, GetOrderResult } from './get-order.query.js';
import { OrderStore } from './order.store.js';

@NestQueryHandler(GetOrderQuery)
export class GetOrderHandler implements IQueryHandler<GetOrderQuery, GetOrderResult> {
  private readonly logger = new Logger(GetOrderHandler.name);

  constructor(private readonly store: OrderStore) {}

  async execute(query: GetOrderQuery): Promise<GetOrderResult> {
    this.logger.log(`Querying order: ${query.orderId}`);
    const order = this.store.findById(query.orderId);
    if (!order) {
      throw new Error(`Order ${query.orderId} not found`);
    }
    return new GetOrderResult(order.orderId, order.productId, order.quantity, order.status);
  }
}
