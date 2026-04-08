/**
 * Example: Delete Channel (Management)
 *
 * Demonstrates using client.unwrap() to access the raw kubemq-js client
 * and call deleteChannel(). Creates channels first, verifies they exist,
 * then deletes them.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/management/delete-channel/main.ts
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
// [ManagementService] Created events channel: nestjs-management.delete-channel-events
// [ManagementService] Created queues channel: nestjs-management.delete-channel-queues
// [ManagementService] Verifying channels exist...
// [ManagementService] Found 1 events channel(s)
// [ManagementService] Deleted events channel: nestjs-management.delete-channel-events
// [ManagementService] Deleted queues channel: nestjs-management.delete-channel-queues
// [ManagementService] All channels deleted
// [Main] Done
