import { Injectable, Logger } from '@nestjs/common';
import { Payload, Ctx } from '@nestjs/microservices';
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

/**
 * Order handlers demonstrating all 5 KubeMQ handler types.
 * Each handler processes messages received on its respective KubeMQ channel.
 */
@Injectable()
export class OrderHandlers {
  private readonly logger = new Logger(OrderHandlers.name);

  /**
   * Command handler: processes order creation requests.
   * Commands are request-reply -- the return value is sent back to the caller.
   */
  @CommandHandler('orders.create', { timeout: 10, group: 'order-writers' })
  handleCreateOrder(
    @Payload() data: { name: string; total: number },
    @Ctx() ctx: KubeMQCommandContext,
  ) {
    this.logger.log(
      `Command received on ${ctx.channel} from ${ctx.fromClientId}`,
    );

    const orderId = `order-${Date.now()}`;
    this.logger.log(`Order created: ${orderId} - ${data.name} ($${data.total})`);

    return {
      orderId,
      name: data.name,
      total: data.total,
      status: 'created',
    };
  }

  /**
   * Query handler: retrieves order details.
   * Queries support optional server-side caching via cacheKey and cacheTtl.
   */
  @QueryHandler('orders.get', {
    timeout: 10,
    cacheKey: 'order:{id}',
    cacheTtl: 60,
  })
  handleGetOrder(
    @Payload() data: { id: string },
    @Ctx() ctx: KubeMQQueryContext,
  ) {
    this.logger.log(
      `Query received on ${ctx.channel} from ${ctx.fromClientId}`,
    );

    // Simulate fetching from a database
    return {
      orderId: data.id,
      name: 'Sample Order',
      total: 99.99,
      status: 'completed',
      queriedAt: new Date().toISOString(),
    };
  }

  /**
   * Event handler: processes fire-and-forget order update notifications.
   * Events have no return value -- they are one-way messages.
   */
  @EventHandler('orders.updated')
  handleOrderUpdated(
    @Payload() data: { id: string; status: string },
    @Ctx() ctx: KubeMQContext,
  ) {
    this.logger.log(`Event received on ${ctx.channel}: Order ${data.id} -> ${data.status}`);
    // Process the update (e.g., update analytics, notify other services)
  }

  /**
   * EventStore handler: processes persistent order history events.
   * EventStore events include a sequence number for ordering guarantees.
   */
  @EventStoreHandler('orders.history', { startFrom: 'first' })
  handleOrderHistory(
    @Payload() data: { orderId: string; action: string; timestamp: string },
    @Ctx() ctx: KubeMQEventStoreContext,
  ) {
    this.logger.log(
      `EventStore received on ${ctx.channel} (seq: ${ctx.sequence}): ` +
        `Order ${data.orderId} - ${data.action} at ${data.timestamp}`,
    );
    // Process the stored event (e.g., build read model, audit log)
  }

  /**
   * Queue handler: processes queued orders for background work.
   * Queue messages support auto-ack (default) or manual ack/nack.
   *
   * With manualAck: true, you must explicitly call ctx.ack() or ctx.nack().
   * Without it (default), success auto-acks and exceptions auto-nack.
   */
  @QueueHandler('orders.process', {
    maxMessages: 1,
    waitTimeoutSeconds: 30,
  })
  handleProcessOrder(
    @Payload() data: { orderId: string; enqueuedAt: string },
    @Ctx() ctx: KubeMQQueueContext,
  ) {
    this.logger.log(
      `Queue message received on ${ctx.channel} (seq: ${ctx.sequence}, ` +
        `deliveries: ${ctx.receiveCount}): Order ${data.orderId}`,
    );

    // Simulate order processing
    this.logger.log(`Processing order ${data.orderId} (enqueued at ${data.enqueuedAt})`);

    // Auto-ack on success (default behavior).
    // For manual ack, add { manualAck: true } to @QueueHandler options and call:
    //   ctx.ack();    // acknowledge
    //   ctx.nack();   // reject (redelivery)
    //   ctx.reQueue('orders.dlq');  // move to another queue
  }
}
