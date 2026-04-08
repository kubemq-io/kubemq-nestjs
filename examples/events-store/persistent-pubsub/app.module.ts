import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { EventStoreHandlerService } from './event-store.handler.js';
import { EventStoreService } from './event-store.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-events-store-persistent-pubsub-server',
      isGlobal: true,
    }),
    KubeMQModule.register({
      name: 'KUBEMQ_CLIENT',
      address,
      clientId: 'nestjs-events-store-persistent-pubsub-client',
    }),
  ],
  providers: [EventStoreHandlerService, EventStoreService],
})
export class AppModule {}
