import { Injectable, Logger } from '@nestjs/common';
import {
  CommandHandler,
  QueryHandler,
  EventHandler,
  EventStoreHandler,
  QueueHandler,
  KubeMQCommandContext,
  KubeMQQueryContext,
  KubeMQContext,
  KubeMQEventStoreContext,
  KubeMQQueueContext,
} from '@kubemq/nestjs-transport';

@Injectable()
export class AllHandlersService {
  private readonly logger = new Logger('AllHandlers');

  @CommandHandler('nestjs-decorators.all-handlers-cmd')
  async handleCommand(data: Record<string, unknown>, ctx: KubeMQCommandContext) {
    this.logger.log(`[CMD] ${ctx.channel}: ${JSON.stringify(data)}`);
    return { executed: true, type: 'command' };
  }

  @QueryHandler('nestjs-decorators.all-handlers-query')
  async handleQuery(data: Record<string, unknown>, ctx: KubeMQQueryContext) {
    this.logger.log(`[QUERY] ${ctx.channel}: ${JSON.stringify(data)}`);
    return { items: ['a', 'b', 'c'], type: 'query' };
  }

  @EventHandler('nestjs-decorators.all-handlers-event')
  async handleEvent(data: unknown, ctx: KubeMQContext): Promise<void> {
    this.logger.log(`[EVENT] ${ctx.channel}: ${JSON.stringify(data)}`);
  }

  @EventStoreHandler('nestjs-decorators.all-handlers-event-store')
  async handleEventStore(data: unknown, ctx: KubeMQEventStoreContext): Promise<void> {
    this.logger.log(`[EVENT_STORE] ${ctx.channel} (seq=${ctx.sequence}): ${JSON.stringify(data)}`);
  }

  @QueueHandler('nestjs-decorators.all-handlers-queue', { manualAck: true })
  async handleQueue(data: unknown, ctx: KubeMQQueueContext): Promise<void> {
    this.logger.log(`[QUEUE] ${ctx.channel}: ${JSON.stringify(data)}`);
    ctx.ack();
  }
}
