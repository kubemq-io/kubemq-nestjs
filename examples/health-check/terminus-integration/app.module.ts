import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { HealthController } from './health.controller.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-health-terminus',
      isGlobal: true,
    }),
    TerminusModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
