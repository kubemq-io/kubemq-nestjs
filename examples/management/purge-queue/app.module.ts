import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { ManagementService } from './management.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.register({
      name: 'KUBEMQ_CLIENT',
      address,
      clientId: 'nestjs-mgmt-purge-queue-client',
    }),
  ],
  providers: [ManagementService],
})
export class AppModule {}
