/**
 * Example: Queue Stream — Dead Letter Policy
 *
 * Demonstrates sending messages with DLQ policy via upstream, then nacking
 * them via stream receive to trigger dead-letter routing.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/queues-stream/dead-letter-policy/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { DeadLetterPolicyService } from './stream.service.js';

const logger = new Logger('DeadLetterPolicyExample');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
  await app.init();
  logger.log('Application initialized');

  const service = app.get(DeadLetterPolicyService);
  await service.run();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [DeadLetterPolicyExample] Application initialized
// [DeadLetterPolicyService] Sending message with DLQ policy via upstream...
// [DeadLetterPolicyService] Nacking message to trigger DLQ routing...
// [DeadLetterPolicyService] Nacked — message routed to DLQ channel
// [DeadLetterPolicyService] Checking DLQ channel...
// [DeadLetterPolicyService] DLQ message: {"poison":"data"}
