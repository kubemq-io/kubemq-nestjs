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
export class OptionsHandlerService {
  private readonly logger = new Logger('OptionsHandler');

  @CommandHandler('nestjs-decorators.options-cmd', { group: 'cmd-workers' })
  async handleCommand(data: unknown, ctx: KubeMQCommandContext) {
    this.logger.log(`[CMD group=cmd-workers] ${ctx.channel}: ${JSON.stringify(data)}`);
    return { processed: true };
  }

  @QueryHandler('nestjs-decorators.options-query', {
    group: 'query-workers',
    maxConcurrent: 5,
  })
  async handleQuery(data: unknown, ctx: KubeMQQueryContext) {
    this.logger.log(`[QUERY group=query-workers, maxConcurrent=5] ${ctx.channel}: ${JSON.stringify(data)}`);
    return { result: 'found' };
  }

  @EventHandler('nestjs-decorators.options-event', { group: 'event-group' })
  async handleEvent(data: unknown, ctx: KubeMQContext): Promise<void> {
    this.logger.log(`[EVENT group=event-group] ${ctx.channel}: ${JSON.stringify(data)}`);
  }

  @EventStoreHandler('nestjs-decorators.options-event-store', {
    group: 'store-group',
    startFrom: 'first',
  })
  async handleEventStore(data: unknown, ctx: KubeMQEventStoreContext): Promise<void> {
    this.logger.log(
      `[EVENT_STORE group=store-group, startFrom=first] seq=${ctx.sequence}: ${JSON.stringify(data)}`,
    );
  }

  @QueueHandler('nestjs-decorators.options-queue', {
    manualAck: true,
    maxMessages: 10,
    waitTimeoutSeconds: 5,
  })
  async handleQueue(data: unknown, ctx: KubeMQQueueContext): Promise<void> {
    this.logger.log(
      `[QUEUE manualAck, maxMessages=10, wait=5s] ${ctx.channel}: ${JSON.stringify(data)}`,
    );
    ctx.ack();
  }
}
