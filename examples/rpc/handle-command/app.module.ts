import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { CommandHandlerService } from './command.handler.js';
import { CommandService } from './command.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-rpc-handle-command-server',
      isGlobal: true,
    }),
    KubeMQModule.register({
      name: 'KUBEMQ_CLIENT',
      address,
      clientId: 'nestjs-rpc-handle-command-client',
    }),
  ],
  providers: [CommandHandlerService, CommandService],
})
export class AppModule {}
