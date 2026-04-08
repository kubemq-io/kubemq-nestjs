import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { SubscriberA } from './subscriber-a.handler.js';
import { SubscriberB } from './subscriber-b.handler.js';
import { EventService } from './event.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-events-multiple-subscribers-server',
      isGlobal: true,
    }),
    KubeMQModule.register({
      name: 'KUBEMQ_CLIENT',
      address,
      clientId: 'nestjs-events-multiple-subscribers-client',
    }),
  ],
  providers: [SubscriberA, SubscriberB, EventService],
})
export class AppModule {}
