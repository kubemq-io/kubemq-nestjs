/**
 * Example: Queue Stream — Auto Ack
 *
 * Demonstrates streamQueueMessages with autoAck: true. Messages are
 * automatically acknowledged upon delivery — no manual ack needed.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/queues-stream/auto-ack/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { AutoAckService } from './stream.service.js';

const logger = new Logger('AutoAckExample');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
  await app.init();
  logger.log('Application initialized');

  const service = app.get(AutoAckService);
  await service.run();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [AutoAckExample] Application initialized
// [AutoAckService] Sending 3 messages to queue...
// [AutoAckService] Starting stream consumer with autoAck: true...
// [AutoAckService] Auto-acked message seq=1: {"index":1}
// [AutoAckService] Auto-acked message seq=2: {"index":2}
// [AutoAckService] Auto-acked message seq=3: {"index":3}
// [AutoAckService] All messages auto-acknowledged — no manual ack needed
