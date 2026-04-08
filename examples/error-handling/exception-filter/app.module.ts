import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { KubeMQExceptionFilter } from './kubemq-exception.filter.js';
import { DemoController } from './demo.controller.js';
import { DemoService } from './demo.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-error-handling-exception-filter-server',
      isGlobal: true,
    }),
    KubeMQModule.register({
      name: 'KUBEMQ_SERVICE',
      address,
      clientId: 'nestjs-error-handling-exception-filter-client',
    }),
  ],
  controllers: [DemoController],
  providers: [
    DemoService,
    { provide: APP_FILTER, useClass: KubeMQExceptionFilter },
  ],
})
export class AppModule {}
