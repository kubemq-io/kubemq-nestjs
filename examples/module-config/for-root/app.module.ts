import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-module-config-for-root-server',
      isGlobal: true,
      reconnect: { maxAttempts: -1, initialDelayMs: 1000, maxDelayMs: 30000, multiplier: 2, jitter: 'full' },
    }),
  ],
})
export class AppModule {}
