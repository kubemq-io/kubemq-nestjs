import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetOrderQuery, GetOrderResult } from './get-order.query.js';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(private readonly queryBus: QueryBus) {}

  async getOrder(orderId: string): Promise<GetOrderResult> {
    this.logger.log(`Querying order: ${orderId}`);
    const result = await this.queryBus.execute<GetOrderQuery, GetOrderResult>(
      new GetOrderQuery(orderId),
    );
    this.logger.log(`Query result: ${JSON.stringify(result)}`);
    return result;
  }
}
