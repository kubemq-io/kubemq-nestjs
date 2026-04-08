/**
 * Example: Start New Only
 *
 * Demonstrates subscribing to an event store receiving only new events
 * published after the subscription starts. Historical events are not replayed.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/events-store/start-new-only/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';

const logger = new Logger('StartNewOnlyExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-events-store-start-new-only-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('Subscribed to event store — new events only (no replay)');

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [StartNewOnlyExample] Subscribed to event store — new events only (no replay)
// (only new events published after this point will appear)
// [EventStoreHandler] New event (seq=...) on nestjs-events-store.start-new-only: ...
