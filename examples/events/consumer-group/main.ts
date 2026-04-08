/**
 * Example: Consumer Group Events
 *
 * Demonstrates load-balanced event delivery using the group option on
 * @EventHandler. When multiple subscribers share the same group, each event
 * is delivered to only one member of the group.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/events/consumer-group/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { EventService } from './event.service.js';

const logger = new Logger('ConsumerGroupExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-events-consumer-group-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('Microservice started with consumer group handler');

  await new Promise((r) => setTimeout(r, 1500));

  const eventService = app.get(EventService);
  await eventService.publishBatch();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [ConsumerGroupExample] Microservice started with consumer group handler
// [EventService] Publishing 5 events to consumer group channel...
// [EventHandler] [group=nestjs-events-cg] Event received on nestjs-events.consumer-group: {"seq":1}
// [EventHandler] [group=nestjs-events-cg] Event received on nestjs-events.consumer-group: {"seq":2}
// ...
// [EventService] All events published
