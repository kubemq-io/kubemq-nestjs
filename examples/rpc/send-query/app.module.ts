import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { QueryHandlerService } from './query.handler.js';
import { QueryService } from './query.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-rpc-send-query-server',
      isGlobal: true,
    }),
    KubeMQModule.register({
      name: 'KUBEMQ_CLIENT',
      address,
      clientId: 'nestjs-rpc-send-query-client',
    }),
  ],
  providers: [QueryHandlerService, QueryService],
})
export class AppModule {}
