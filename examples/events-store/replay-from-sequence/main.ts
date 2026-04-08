/**
 * Example: Replay from Sequence
 *
 * Demonstrates subscribing to an event store starting from a specific
 * sequence number. The handler replays all events from sequence 1 onward.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *   - Events previously published to the channel (or publish separately)
 *
 * Run: npx tsx examples/events-store/replay-from-sequence/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';

const logger = new Logger('ReplayFromSequenceExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-events-store-replay-from-sequence-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('Subscribed to event store from sequence 1');

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [ReplayFromSequenceExample] Subscribed to event store from sequence 1
// [EventStoreHandler] Replayed event (seq=1) on nestjs-events-store.replay-from-sequence: ...
// [EventStoreHandler] Replayed event (seq=2) on nestjs-events-store.replay-from-sequence: ...
