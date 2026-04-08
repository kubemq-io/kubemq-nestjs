import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { ErrorDemoService } from './error-demo.service.js';

@Module({
  imports: [
    KubeMQModule.register({
      name: 'KUBEMQ_SERVICE',
      address: 'localhost:59999',
      clientId: 'nestjs-error-handling-connection-error-client',
    }),
  ],
  providers: [ErrorDemoService],
})
export class AppModule {}
