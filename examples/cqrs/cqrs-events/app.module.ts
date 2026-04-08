import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { KubeMQCqrsModule } from '@kubemq/nestjs-transport/cqrs';
import { OrderCreatedHandler } from './order-created.handler.js';
import { OrderService } from './order.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-cqrs-events',
      isGlobal: true,
    }),
    CqrsModule,
    KubeMQCqrsModule.forRoot({
      eventChannelPrefix: 'nestjs-cqrs.events',
      persistEvents: true,
    }),
  ],
  providers: [OrderCreatedHandler, OrderService],
})
export class AppModule {}
