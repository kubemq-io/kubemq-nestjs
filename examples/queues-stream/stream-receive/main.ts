/**
 * Example: Queue Stream — Streaming Receive
 *
 * Demonstrates streaming queue consumption via streamQueueMessages().
 * Messages are received in batches and acknowledged via ackAll().
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/queues-stream/stream-receive/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { StreamReceiveService } from './stream.service.js';

const logger = new Logger('StreamReceiveExample');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
  await app.init();
  logger.log('Application initialized');

  const service = app.get(StreamReceiveService);
  await service.run();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [StreamReceiveExample] Application initialized
// [StreamReceiveService] Sending 3 messages to queue...
// [StreamReceiveService] Starting stream consumer...
// [StreamReceiveService] Stream batch received (3 messages):
// [StreamReceiveService]   msg seq=1: {"index":1}
// [StreamReceiveService]   msg seq=2: {"index":2}
// [StreamReceiveService]   msg seq=3: {"index":3}
// [StreamReceiveService] Acked all messages
