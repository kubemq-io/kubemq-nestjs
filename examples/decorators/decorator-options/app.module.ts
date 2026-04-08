import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { OptionsHandlerService } from './options.handler.js';
import { SenderService } from './sender.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-decorators-options-server',
      isGlobal: true,
    }),
    KubeMQModule.register({
      name: 'KUBEMQ_CLIENT',
      address,
      clientId: 'nestjs-decorators-options-client',
    }),
  ],
  providers: [OptionsHandlerService, SenderService],
})
export class AppModule {}
