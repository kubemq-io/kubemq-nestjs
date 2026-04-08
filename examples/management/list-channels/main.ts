/**
 * Example: List Channels (Management)
 *
 * Demonstrates using client.unwrap() to access the raw kubemq-js client
 * and call listChannels() for each channel type. No microservice/handlers
 * are needed — this is a pure management operation.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/management/list-channels/main.ts
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
// [ManagementService] [events] Found N channel(s) matching "nestjs-":
// [ManagementService]   nestjs-events.basic-pubsub — type: events, active: true
// [ManagementService] [events_store] Found N channel(s) matching "nestjs-":
// ...
// [Main] Done
