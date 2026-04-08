import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { QueueHandlerService } from './queue.handler.js';
import { QueueSenderService } from './queue.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-queues-send-receive-server',
      isGlobal: true,
    }),
    KubeMQModule.register({
      name: 'KUBEMQ_CLIENT',
      address,
      clientId: 'nestjs-queues-send-receive-client',
    }),
  ],
  providers: [QueueHandlerService, QueueSenderService],
})
export class AppModule {}
