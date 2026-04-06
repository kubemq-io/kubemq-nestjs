import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { KubeMQRecord } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

/**
 * Order service demonstrating all 5 KubeMQ messaging patterns via the client proxy.
 *
 * - Commands: client.send() for create operations (request-reply)
 * - Queries: client.send() with KubeMQRecord.asQuery() for read operations
 * - Events: client.emit() for fire-and-forget notifications
 * - EventStore: client.emit() with KubeMQRecord.asEventStore() for persistent events
 * - Queues: client.emit() with KubeMQRecord.asQueue() for reliable job processing
 */
@Injectable()
export class OrderService {
  constructor(
    @Inject('ORDER_KUBEMQ') private readonly client: ClientProxy,
  ) {}

  /**
   * Create an order using a KubeMQ Command (request-reply).
   * Default type for client.send() is "command" -- no KubeMQRecord needed.
   */
  async createOrder(data: { name: string; total: number }) {
    const result = await firstValueFrom(
      this.client.send('orders.create', data),
    );
    return result;
  }

  /**
   * Get an order using a KubeMQ Query (request-reply with optional caching).
   * Use KubeMQRecord.asQuery() to send as a query instead of a command.
   */
  async getOrder(id: string) {
    const record = new KubeMQRecord({ id }).asQuery();
    const result = await firstValueFrom(
      this.client.send('orders.get', record),
    );
    return result;
  }

  /**
   * Publish an order update as a KubeMQ Event (fire-and-forget).
   * Default type for client.emit() is "event" -- no KubeMQRecord needed.
   */
  async updateOrder(id: string, status: string) {
    await firstValueFrom(
      this.client.emit('orders.updated', { id, status }),
    );
    return { success: true, message: 'Update event emitted' };
  }

  /**
   * Record an order history entry as a KubeMQ EventStore (persistent event).
   * Use KubeMQRecord.asEventStore() to persist the event in the store.
   */
  async recordHistory(id: string, action: string) {
    const record = new KubeMQRecord({
      orderId: id,
      action,
      timestamp: new Date().toISOString(),
    }).asEventStore();

    await firstValueFrom(
      this.client.emit('orders.history', record),
    );
    return { success: true, message: 'History event stored' };
  }

  /**
   * Enqueue an order for background processing via KubeMQ Queue.
   * Use KubeMQRecord.asQueue() for reliable, at-least-once delivery.
   */
  async enqueueOrder(id: string) {
    const record = new KubeMQRecord({
      orderId: id,
      enqueuedAt: new Date().toISOString(),
    }).asQueue();

    await firstValueFrom(
      this.client.emit('orders.process', record),
    );
    return { success: true, message: 'Order enqueued for processing' };
  }
}
