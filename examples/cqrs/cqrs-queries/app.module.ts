import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { KubeMQCqrsModule } from '@kubemq/nestjs-transport/cqrs';
import { GetOrderHandler } from './get-order.handler.js';
import { OrderService } from './order.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-cqrs-queries',
      isGlobal: true,
    }),
    CqrsModule,
    KubeMQCqrsModule.forRoot({
      queryChannelPrefix: 'nestjs-cqrs.queries',
      queryTimeout: 10,
    }),
  ],
  providers: [GetOrderHandler, OrderService],
})
export class AppModule {}
