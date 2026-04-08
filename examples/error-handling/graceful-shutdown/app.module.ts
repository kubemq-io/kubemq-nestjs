import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { ShutdownHandlers } from './handlers.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-error-handling-graceful-shutdown-server',
      isGlobal: true,
    }),
  ],
  providers: [ShutdownHandlers],
})
export class AppModule {}
