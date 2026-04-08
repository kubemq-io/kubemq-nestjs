import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { OrderHandlerService } from './order.handler.js';
import { OrderService } from './order.service.js';
import { SenderService } from './sender.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-module-config-register-server',
      isGlobal: true,
    }),
    KubeMQModule.register({
      name: 'ORDER_SERVICE',
      address,
      clientId: 'nestjs-module-config-register-client',
    }),
  ],
  providers: [OrderHandlerService, OrderService, SenderService],
})
export class AppModule {}
