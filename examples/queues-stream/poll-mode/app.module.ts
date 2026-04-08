import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { PollModeService } from './stream.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.register({
      name: 'KUBEMQ_CLIENT',
      address,
      clientId: 'nestjs-queues-stream-poll-mode-client',
    }),
  ],
  providers: [PollModeService],
})
export class AppModule {}
