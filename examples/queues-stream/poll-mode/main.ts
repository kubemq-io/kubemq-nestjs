/**
 * Example: Queue Stream — Poll Mode
 *
 * Demonstrates non-streaming queue polling via receiveQueueMessages().
 * This is a simple pull-based approach where the client explicitly polls
 * for messages at its own pace.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/queues-stream/poll-mode/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { PollModeService } from './stream.service.js';

const logger = new Logger('PollModeExample');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
  await app.init();
  logger.log('Application initialized');

  const service = app.get(PollModeService);
  await service.run();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 10_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [PollModeExample] Application initialized
// [PollModeService] Sending 5 messages to queue...
// [PollModeService] Poll 1: received 3 messages
// [PollModeService]   msg seq=1: {"item":1}
// [PollModeService]   msg seq=2: {"item":2}
// [PollModeService]   msg seq=3: {"item":3}
// [PollModeService] Poll 2: received 2 messages
// [PollModeService]   msg seq=4: {"item":4}
// [PollModeService]   msg seq=5: {"item":5}
// [PollModeService] All messages consumed via polling
