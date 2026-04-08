/**
 * Example: Create Channel (Management)
 *
 * Demonstrates using client.unwrap() to access the raw kubemq-js client
 * and call createChannel() for different channel types (events, events_store,
 * queues, commands, queries). Cleans up created channels on exit.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/management/create-channel/main.ts
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
// [ManagementService] Created events channel: nestjs-management.create-channel-events
// [ManagementService] Created events_store channel: nestjs-management.create-channel-events-store
// [ManagementService] Created queues channel: nestjs-management.create-channel-queues
// [ManagementService] Created commands channel: nestjs-management.create-channel-commands
// [ManagementService] Created queries channel: nestjs-management.create-channel-queries
// [ManagementService] All channels created
// [ManagementService] Cleanup: deleted all created channels
// [Main] Done
