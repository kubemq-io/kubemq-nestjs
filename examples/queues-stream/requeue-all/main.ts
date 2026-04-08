/**
 * Example: Queue Stream — ReQueue All
 *
 * Demonstrates receiving messages via streamQueueMessages and re-routing
 * them all to a different channel using reQueueAll().
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/queues-stream/requeue-all/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { ReQueueAllService } from './stream.service.js';

const logger = new Logger('ReQueueAllExample');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
  await app.init();
  logger.log('Application initialized');

  const service = app.get(ReQueueAllService);
  await service.run();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [ReQueueAllExample] Application initialized
// [ReQueueAllService] Sending 2 messages to source channel...
// [ReQueueAllService] Re-queuing all messages to target channel...
// [ReQueueAllService] Messages re-queued to nestjs-queues-stream.requeue-all.target
// [ReQueueAllService] Verifying messages on target channel...
// [ReQueueAllService] Target msg seq=1: {"item":1}
// [ReQueueAllService] Target msg seq=2: {"item":2}
