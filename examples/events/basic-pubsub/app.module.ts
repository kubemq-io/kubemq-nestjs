import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { EventHandlerService } from './event.handler.js';
import { EventService } from './event.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-events-basic-pubsub-server',
      isGlobal: true,
    }),
    KubeMQModule.register({
      name: 'KUBEMQ_CLIENT',
      address,
      clientId: 'nestjs-events-basic-pubsub-client',
    }),
  ],
  providers: [EventHandlerService, EventService],
})
export class AppModule {}
