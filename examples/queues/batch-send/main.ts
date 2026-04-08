/**
 * Example: Batch Send Queue Messages
 *
 * Demonstrates sending multiple queue messages in a loop using
 * the underlying kubemq-js client via KubeMQClientProxy.unwrap().
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/queues/batch-send/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { BatchSendService } from './batch-send.service.js';

const logger = new Logger('BatchSendExample');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
  await app.init();
  logger.log('Application initialized');

  const batchService = app.get(BatchSendService);
  await batchService.sendBatch();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 10_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [BatchSendExample] Application initialized
// [BatchSendService] Sending 5 queue messages...
// [BatchSendService] Sent message 1/5 to nestjs-queues.batch-send
// [BatchSendService] Sent message 2/5 to nestjs-queues.batch-send
// [BatchSendService] Sent message 3/5 to nestjs-queues.batch-send
// [BatchSendService] Sent message 4/5 to nestjs-queues.batch-send
// [BatchSendService] Sent message 5/5 to nestjs-queues.batch-send
// [BatchSendService] Batch send complete
