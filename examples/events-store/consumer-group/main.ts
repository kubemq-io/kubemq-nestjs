/**
 * Example: Consumer Group (Event Store)
 *
 * Demonstrates load-balanced event store subscriptions using the group
 * option on @EventStoreHandler. When multiple subscribers share the same
 * group, each stored event is delivered to only one member.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/events-store/consumer-group/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { EventStoreService } from './event-store.service.js';

const logger = new Logger('ConsumerGroupExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-events-store-consumer-group-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('Microservice started with event store consumer group');

  await new Promise((r) => setTimeout(r, 1500));

  const service = app.get(EventStoreService);
  await service.publishBatch();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [ConsumerGroupExample] Microservice started with event store consumer group
// [EventStoreService] Publishing 5 events to store...
// [EventStoreHandler] [group=nestjs-es-cg] Event (seq=1) on nestjs-events-store.consumer-group: {"seq":1}
// [EventStoreHandler] [group=nestjs-es-cg] Event (seq=2) on nestjs-events-store.consumer-group: {"seq":2}
// ...
// [EventStoreService] All events published to store
