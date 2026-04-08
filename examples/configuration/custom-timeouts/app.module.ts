import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { TimeoutHandler } from './timeout.handler.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-configuration-custom-timeouts-server',
      isGlobal: true,
    }),
  ],
  providers: [TimeoutHandler],
})
export class AppModule {}
