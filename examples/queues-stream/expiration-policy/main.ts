/**
 * Example: Queue Stream — Expiration Policy
 *
 * Demonstrates sending messages with expirationSeconds policy via upstream.
 * Messages that are not consumed within the expiration window are discarded.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/queues-stream/expiration-policy/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { ExpirationPolicyService } from './stream.service.js';

const logger = new Logger('ExpirationPolicyExample');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
  await app.init();
  logger.log('Application initialized');

  const service = app.get(ExpirationPolicyService);
  await service.run();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [ExpirationPolicyExample] Application initialized
// [ExpirationPolicyService] Sending message with 3s expiration via upstream...
// [ExpirationPolicyService] Consuming immediately (should succeed)...
// [ExpirationPolicyService] Received before expiry: {"data":"time-sensitive"}
// [ExpirationPolicyService] Sending another message with 2s expiration...
// [ExpirationPolicyService] Waiting 3s for expiration...
// [ExpirationPolicyService] Polling for expired message — expecting 0 results...
// [ExpirationPolicyService] Messages received: 0 (expired as expected)
