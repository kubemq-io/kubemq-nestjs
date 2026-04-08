import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { RequestReplyHandler } from './request-reply.handler.js';
import { RequestReplyService } from './request-reply.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-patterns-request-reply-server',
      isGlobal: true,
    }),
    KubeMQModule.register({
      name: 'KUBEMQ_CLIENT',
      address,
      clientId: 'nestjs-patterns-request-reply-client',
    }),
  ],
  providers: [RequestReplyHandler, RequestReplyService],
})
export class AppModule {}
