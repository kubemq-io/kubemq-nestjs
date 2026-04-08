import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { AllHandlersService } from './all.handler.js';
import { SenderService } from './sender.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-decorators-all-handlers-server',
      isGlobal: true,
    }),
    KubeMQModule.register({
      name: 'KUBEMQ_CLIENT',
      address,
      clientId: 'nestjs-decorators-all-handlers-client',
    }),
  ],
  providers: [AllHandlersService, SenderService],
})
export class AppModule {}
