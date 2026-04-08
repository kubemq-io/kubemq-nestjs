import { Injectable, Logger } from '@nestjs/common';
import {
  CommandHandler,
  QueryHandler,
  KubeMQCommandContext,
  KubeMQQueryContext,
} from '@kubemq/nestjs-transport';

@Injectable()
export class RequestReplyHandler {
  private readonly logger = new Logger('RequestReplyHandler');

  @CommandHandler('nestjs-patterns.request-reply.commands')
  async handleCommand(data: { action: string; payload: string }, ctx: KubeMQCommandContext) {
    this.logger.log(`Command received on ${ctx.channel}: ${JSON.stringify(data)}`);
    return { executed: true, action: data.action, processedAt: new Date().toISOString() };
  }

  @QueryHandler('nestjs-patterns.request-reply.queries')
  async handleQuery(data: { id: string }, ctx: KubeMQQueryContext) {
    this.logger.log(`Query received on ${ctx.channel}: ${JSON.stringify(data)}`);
    return { id: data.id, name: 'Sample Item', status: 'active', queriedAt: new Date().toISOString() };
  }
}
