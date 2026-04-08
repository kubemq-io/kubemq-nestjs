import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { PrimaryHandlerService } from './queue.handler.js';
import { DLQHandlerService } from './dlq.handler.js';
import { QueueSenderService } from './queue.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-queues-dead-letter-queue-server',
      isGlobal: true,
    }),
    KubeMQModule.register({
      name: 'KUBEMQ_CLIENT',
      address,
      clientId: 'nestjs-queues-dead-letter-queue-client',
    }),
  ],
  providers: [PrimaryHandlerService, DLQHandlerService, QueueSenderService],
})
export class AppModule {}
