/**
 * Example: Purge Queue (Management)
 *
 * Demonstrates using client.unwrap() to access the raw kubemq-js client
 * and call purgeQueue(). Sends messages to a queue channel first, then
 * purges all pending messages.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/management/purge-queue/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { ManagementService } from './management.service.js';

const logger = new Logger('Main');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
  const svc = app.get(ManagementService);
  await svc.run();
  await app.close();
  logger.log('Done');
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [ManagementService] Sent 5 messages to queue
// [ManagementService] Queue "nestjs-management.purge-queue" purged successfully
// [ManagementService] Cleanup: deleted queue channel
// [Main] Done
