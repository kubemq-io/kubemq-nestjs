import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { PingService } from './ping.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.register({
      name: 'KUBEMQ_SERVICE',
      address,
      clientId: 'nestjs-connection-ping-client',
    }),
  ],
  providers: [PingService],
})
export class AppModule {}
