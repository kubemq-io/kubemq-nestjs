/**
 * Example: Replay from Time Delta
 *
 * Demonstrates subscribing to an event store starting from a time offset.
 * The handler replays all events published within the last 30 seconds.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *   - Events recently published to the channel (within the time window)
 *
 * Run: npx tsx examples/events-store/replay-from-time/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';

const logger = new Logger('ReplayFromTimeExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-events-store-replay-from-time-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('Subscribed to event store — replaying last 30 seconds');

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [ReplayFromTimeExample] Subscribed to event store — replaying last 30 seconds
// [EventStoreHandler] Replayed event (seq=...) on nestjs-events-store.replay-from-time: ...
