import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { WorkerHandler } from './worker.handler.js';
import { ProducerService } from './producer.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-patterns-work-queue-server',
      isGlobal: true,
    }),
    KubeMQModule.register({
      name: 'KUBEMQ_CLIENT',
      address,
      clientId: 'nestjs-patterns-work-queue-client',
    }),
  ],
  providers: [WorkerHandler, ProducerService],
})
export class AppModule {}
