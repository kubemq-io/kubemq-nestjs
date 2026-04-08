import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { ExpirationPolicyService } from './stream.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.register({
      name: 'KUBEMQ_CLIENT',
      address,
      clientId: 'nestjs-queues-stream-expiration-policy-client',
    }),
  ],
  providers: [ExpirationPolicyService],
})
export class AppModule {}
