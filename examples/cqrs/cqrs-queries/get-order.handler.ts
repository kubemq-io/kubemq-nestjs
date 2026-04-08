import { QueryHandler as NestQueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GetOrderQuery, GetOrderResult } from './get-order.query.js';

@NestQueryHandler(GetOrderQuery)
export class GetOrderHandler implements IQueryHandler<GetOrderQuery, GetOrderResult> {
  private readonly logger = new Logger(GetOrderHandler.name);

  async execute(query: GetOrderQuery): Promise<GetOrderResult> {
    this.logger.log(`Fetching order: ${query.orderId}`);
    return new GetOrderResult(query.orderId, 'WIDGET-42', 'shipped');
  }
}
