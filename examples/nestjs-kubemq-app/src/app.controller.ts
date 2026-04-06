import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { OrderService } from './order/order.service';

/**
 * HTTP controller that triggers KubeMQ operations through the OrderService.
 * Demonstrates how HTTP endpoints interact with KubeMQ messaging patterns.
 */
@Controller()
export class AppController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  info() {
    return {
      name: 'nestjs-kubemq-example',
      description: 'Example NestJS app using @kubemq/nestjs-transport',
      endpoints: {
        'POST /orders': 'Create order (Command)',
        'GET /orders/:id': 'Get order (Query)',
        'POST /orders/:id/update': 'Update order (Event)',
        'POST /orders/:id/history': 'Record order event (EventStore)',
        'POST /orders/:id/process': 'Process order (Queue)',
      },
    };
  }

  @Post('orders')
  async createOrder(@Body() body: { name: string; total: number }) {
    return this.orderService.createOrder(body);
  }

  @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    return this.orderService.getOrder(id);
  }

  @Post('orders/:id/update')
  async updateOrder(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.orderService.updateOrder(id, body.status);
  }

  @Post('orders/:id/history')
  async recordHistory(
    @Param('id') id: string,
    @Body() body: { action: string },
  ) {
    return this.orderService.recordHistory(id, body.action);
  }

  @Post('orders/:id/process')
  async processOrder(@Param('id') id: string) {
    return this.orderService.enqueueOrder(id);
  }
}
