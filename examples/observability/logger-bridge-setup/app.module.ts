import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { LoggerDemoHandler } from './event.handler.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-observability-logger-bridge-server',
      isGlobal: true,
    }),
  ],
  providers: [LoggerDemoHandler],
})
export class AppModule {}
