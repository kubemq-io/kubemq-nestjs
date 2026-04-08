/**
 * Example: CQRS Events
 *
 * Demonstrates publishing domain events via @nestjs/cqrs EventBus with KubeMQ
 * as the transport. Events are published to KubeMQ event-store channels
 * (persistEvents: true) and handled by @EventsHandler-decorated handlers.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/cqrs/cqrs-events/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { OrderService } from './order.service.js';

const logger = new Logger('CqrsEventsExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-cqrs-events-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started');

  await new Promise((r) => setTimeout(r, 1500));

  const orderService = app.get(OrderService);
  await orderService.createOrder('ORD-100', 'GADGET-7', 5);

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 5_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [CqrsEventsExample] KubeMQ microservice started
// [OrderService] Publishing OrderCreatedEvent: id=ORD-100
// [OrderCreatedHandler] Order created: id=ORD-100, product=GADGET-7, qty=5
// [OrderService] Event published successfully
