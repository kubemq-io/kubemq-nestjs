import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { EventStoreHandlerService } from './event-store.handler.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-events-store-replay-from-time-server',
      isGlobal: true,
    }),
  ],
  providers: [EventStoreHandlerService],
})
export class AppModule {}
