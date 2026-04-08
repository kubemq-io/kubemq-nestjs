/**
 * Example: CQRS Commands
 *
 * Demonstrates dispatching commands via @nestjs/cqrs CommandBus with KubeMQ
 * as the transport. Commands are sent over KubeMQ command channels and
 * handled by @CommandHandler-decorated handlers.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/cqrs/cqrs-commands/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { OrderService } from './order.service.js';

const logger = new Logger('CqrsCommandsExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-cqrs-commands-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started');

  await new Promise((r) => setTimeout(r, 1500));

  const orderService = app.get(OrderService);
  await orderService.createOrder('WIDGET-42', 3);

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 5_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [CqrsCommandsExample] KubeMQ microservice started
// [OrderService] Dispatching CreateOrderCommand: product=WIDGET-42
// [CreateOrderHandler] Processing order: product=WIDGET-42, qty=3
// [OrderService] Command executed successfully
