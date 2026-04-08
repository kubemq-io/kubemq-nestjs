/**
 * Example: Full CQRS Flow
 *
 * Demonstrates a complete CQRS flow: CommandBus dispatches a CreateOrderCommand,
 * the handler emits an OrderCreatedEvent via EventBus which updates the read model,
 * then QueryBus queries the read model for the order state.
 *
 * Flow: Command → Handler → Event → EventHandler (store) → Query → Result
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/cqrs/full-cqrs-flow/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { OrderService } from './order.service.js';

const logger = new Logger('FullCqrsFlowExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-cqrs-full-flow-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started');

  await new Promise((r) => setTimeout(r, 1500));

  const orderService = app.get(OrderService);
  await orderService.createAndVerifyOrder('WIDGET-42', 3);

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 5_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [FullCqrsFlowExample] KubeMQ microservice started
// [OrderService] Step 1: Dispatching CreateOrderCommand for product=WIDGET-42
// [CreateOrderHandler] Creating order ORD-001: product=WIDGET-42, qty=3
// [OrderCreatedHandler] Event received — storing order ORD-001
// [OrderService] Step 1 complete: orderId=ORD-001
// [OrderService] Step 2: Querying order ORD-001
// [GetOrderHandler] Querying order: ORD-001
// [OrderService] Step 2 complete: {"orderId":"ORD-001","productId":"WIDGET-42","quantity":3,"status":"created"}
