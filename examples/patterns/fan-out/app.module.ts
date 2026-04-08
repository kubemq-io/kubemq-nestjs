import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { SubscriberA } from './subscriber-a.handler.js';
import { SubscriberB } from './subscriber-b.handler.js';
import { FanOutService } from './fan-out.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-patterns-fan-out-server',
      isGlobal: true,
    }),
    KubeMQModule.register({
      name: 'KUBEMQ_CLIENT',
      address,
      clientId: 'nestjs-patterns-fan-out-client',
    }),
  ],
  providers: [SubscriberA, SubscriberB, FanOutService],
})
export class AppModule {}
