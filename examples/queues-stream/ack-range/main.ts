/**
 * Example: Queue Stream — Ack Range
 *
 * Demonstrates selectively acknowledging specific messages by their sequence
 * numbers using ackRange() on a stream handle.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/queues-stream/ack-range/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { AckRangeService } from './stream.service.js';

const logger = new Logger('AckRangeExample');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
  await app.init();
  logger.log('Application initialized');

  const service = app.get(AckRangeService);
  await service.run();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [AckRangeExample] Application initialized
// [AckRangeService] Sending 4 messages to queue...
// [AckRangeService] Streaming receive — will ack only specific sequences...
// [AckRangeService] Received 4 messages, acking sequences: [1, 3]
// [AckRangeService] Ack range applied — sequences 1 and 3 acknowledged
