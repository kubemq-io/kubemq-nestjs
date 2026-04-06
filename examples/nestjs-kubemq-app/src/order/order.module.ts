import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { OrderService } from './order.service';
import { OrderHandlers } from './order.handlers';

@Module({
  imports: [
    // Register a named KubeMQ client for the order feature module
    KubeMQModule.register({
      name: 'ORDER_KUBEMQ',
      address: process.env.KUBEMQ_ADDRESS ?? 'localhost:50000',
      clientId: 'nestjs-example-order-client',
      defaultCommandTimeout: 10,
      defaultQueryTimeout: 10,
    }),
  ],
  providers: [OrderService, OrderHandlers],
  exports: [OrderService],
})
export class OrderModule {}
