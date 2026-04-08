import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { KubeMQCqrsModule } from '@kubemq/nestjs-transport/cqrs';
import { CreateOrderHandler } from './create-order.handler.js';
import { OrderCreatedHandler } from './order-created.handler.js';
import { GetOrderHandler } from './get-order.handler.js';
import { OrderStore } from './order.store.js';
import { OrderService } from './order.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-cqrs-full-flow',
      isGlobal: true,
    }),
    CqrsModule,
    KubeMQCqrsModule.forRoot({
      commandChannelPrefix: 'nestjs-cqrs.full-flow.commands',
      queryChannelPrefix: 'nestjs-cqrs.full-flow.queries',
      eventChannelPrefix: 'nestjs-cqrs.full-flow.events',
      commandTimeout: 10,
      queryTimeout: 10,
    }),
  ],
  providers: [
    OrderStore,
    CreateOrderHandler,
    OrderCreatedHandler,
    GetOrderHandler,
    OrderService,
  ],
})
export class AppModule {}
