/**
 * Example: Start from First
 *
 * Demonstrates subscribing to an event store starting from the very first
 * event. All historical events are replayed before receiving new ones.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/events-store/start-from-first/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';

const logger = new Logger('StartFromFirstExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-events-store-start-from-first-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('Subscribed to event store — starting from first event');

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [StartFromFirstExample] Subscribed to event store — starting from first event
// [EventStoreHandler] Event (seq=1) on nestjs-events-store.start-from-first: ...
// [EventStoreHandler] Event (seq=2) on nestjs-events-store.start-from-first: ...
