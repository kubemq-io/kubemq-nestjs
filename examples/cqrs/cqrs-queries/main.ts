/**
 * Example: CQRS Queries
 *
 * Demonstrates dispatching queries via @nestjs/cqrs QueryBus with KubeMQ
 * as the transport. Queries are sent over KubeMQ query channels and
 * return results from @QueryHandler-decorated handlers.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/cqrs/cqrs-queries/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { OrderService } from './order.service.js';

const logger = new Logger('CqrsQueriesExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-cqrs-queries-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started');

  await new Promise((r) => setTimeout(r, 1500));

  const orderService = app.get(OrderService);
  await orderService.getOrder('ORD-001');

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 5_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [CqrsQueriesExample] KubeMQ microservice started
// [OrderService] Querying order: ORD-001
// [GetOrderHandler] Fetching order: ORD-001
// [OrderService] Query result: {"orderId":"ORD-001","product":"WIDGET-42","status":"shipped"}
