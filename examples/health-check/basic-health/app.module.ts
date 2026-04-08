import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-health-basic',
      isGlobal: true,
    }),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}
