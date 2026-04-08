/**
 * Example: Multiple Subscribers (Fan-Out)
 *
 * Demonstrates fan-out delivery where two separate handler classes subscribe
 * to the same channel without a consumer group. Every event is delivered
 * to both subscribers.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/events/multiple-subscribers/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { EventService } from './event.service.js';

const logger = new Logger('MultipleSubscribersExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-events-multiple-subscribers-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('Microservice started with two subscriber classes');

  await new Promise((r) => setTimeout(r, 1500));

  const eventService = app.get(EventService);
  await eventService.publish();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [MultipleSubscribersExample] Microservice started with two subscriber classes
// [EventService] Publishing event to fan-out channel...
// [SubscriberA] Received event on nestjs-events.multiple-subscribers: {"message":"fan-out test"}
// [SubscriberB] Received event on nestjs-events.multiple-subscribers: {"message":"fan-out test"}
// [EventService] Event published — both subscribers should receive it
