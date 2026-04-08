/**
 * Example: Queue Stream — Nack All
 *
 * Demonstrates receiving messages via streamQueueMessages and rejecting
 * the entire batch using nackAll(). Nacked messages are returned to the
 * queue for redelivery.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/queues-stream/nack-all/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { NackAllService } from './stream.service.js';

const logger = new Logger('NackAllExample');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
  await app.init();
  logger.log('Application initialized');

  const service = app.get(NackAllService);
  await service.run();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [NackAllExample] Application initialized
// [NackAllService] Sending 3 messages to queue...
// [NackAllService] Stream receive — will NACK all messages...
// [NackAllService] Received 3 messages — nacking all
// [NackAllService] All messages nacked (returned to queue for redelivery)
// [NackAllService] Re-receiving to verify redelivery...
// [NackAllService] Redelivered msg seq=1 receiveCount=2
