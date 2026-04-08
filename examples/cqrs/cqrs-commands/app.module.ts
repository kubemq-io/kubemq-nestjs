import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { KubeMQCqrsModule } from '@kubemq/nestjs-transport/cqrs';
import { CreateOrderHandler } from './create-order.handler.js';
import { OrderService } from './order.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-cqrs-commands',
      isGlobal: true,
    }),
    CqrsModule,
    KubeMQCqrsModule.forRoot({
      commandChannelPrefix: 'nestjs-cqrs.commands',
      commandTimeout: 10,
    }),
  ],
  providers: [CreateOrderHandler, OrderService],
})
export class AppModule {}
