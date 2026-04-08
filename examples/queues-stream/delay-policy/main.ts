/**
 * Example: Queue Stream — Delay Policy
 *
 * Demonstrates sending messages with delaySeconds policy via upstream stream.
 * Messages become visible to consumers only after the delay period.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/queues-stream/delay-policy/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { DelayPolicyService } from './stream.service.js';

const logger = new Logger('DelayPolicyExample');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
  await app.init();
  logger.log('Application initialized');

  const service = app.get(DelayPolicyService);
  await service.run();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 20_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [DelayPolicyExample] Application initialized
// [DelayPolicyService] Sending message with 3s delay via upstream...
// [DelayPolicyService] Delayed message sent
// [DelayPolicyService] Waiting 4s for delay to expire...
// [DelayPolicyService] Polling for delayed message...
// [DelayPolicyService] Received delayed message: {"task":"delayed-task"}
