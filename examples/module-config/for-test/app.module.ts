import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { OrderService } from './order.service.js';

@Module({
  imports: [KubeMQModule.forTest()],
  providers: [OrderService],
})
export class AppModule {}
