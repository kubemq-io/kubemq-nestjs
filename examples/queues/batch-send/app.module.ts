import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { BatchSendService } from './batch-send.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.register({
      name: 'KUBEMQ_CLIENT',
      address,
      clientId: 'nestjs-queues-batch-send-client',
    }),
  ],
  providers: [BatchSendService],
})
export class AppModule {}
