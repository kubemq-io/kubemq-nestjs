/**
 * Example: Custom Groups (Decorators)
 *
 * Demonstrates multiple handlers on the same channel with different `group`
 * options. For commands, one group wins (load-balanced). For events, each
 * group receives a copy (fan-out within groups, one delivery per group).
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/decorators/custom-groups/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { SenderService } from './sender.service.js';

const logger = new Logger('CustomGroupsExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-decorators-custom-groups-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started — 3 groups: billing, shipping, analytics');

  await new Promise((r) => setTimeout(r, 1500));

  const sender = app.get(SenderService);
  await sender.run();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [CustomGroupsExample] KubeMQ microservice started — 3 groups: billing, shipping, analytics
// [SenderService] Sending command to orders channel (billing & shipping groups compete)...
// [BillingHandler] [billing] Order on nestjs-decorators.custom-groups-orders: {"orderId":"ORD-500","total":99.99}
//   OR
// [ShippingHandler] [shipping] Order on nestjs-decorators.custom-groups-orders: {"orderId":"ORD-500","total":99.99}
// [SenderService] Command response: {"handler":"billing","invoiceCreated":true}
// [SenderService] Emitting notification (each group receives a copy)...
// [BillingHandler] [billing] Notification on nestjs-decorators.custom-groups-notifications: {"type":"order-placed","orderId":"ORD-500"}
// [ShippingHandler] [shipping] Notification on nestjs-decorators.custom-groups-notifications: {"type":"order-placed","orderId":"ORD-500"}
// [AnalyticsHandler] [analytics] Notification on nestjs-decorators.custom-groups-notifications: {"type":"order-placed","orderId":"ORD-500"}
// [SenderService] Notification emitted to all groups
