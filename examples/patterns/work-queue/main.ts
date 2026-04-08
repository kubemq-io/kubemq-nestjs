/**
 * Example: Work Queue Pattern (Competing Consumers)
 *
 * Demonstrates @QueueHandler with a consumer group for competing-consumer
 * message distribution. Multiple workers in the same group share the workload —
 * each message is delivered to exactly one worker.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/patterns/work-queue/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { ProducerService } from './producer.service.js';

const logger = new Logger('WorkQueueExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-patterns-work-queue-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started with work-queue consumer');

  await new Promise((r) => setTimeout(r, 1500));

  const producer = app.get(ProducerService);
  await producer.enqueueJobs();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [WorkQueueExample] KubeMQ microservice started with work-queue consumer
// [ProducerService] Enqueuing job #1: resize-image
// [ProducerService] Enqueuing job #2: send-email
// [ProducerService] Enqueuing job #3: generate-report
// [ProducerService] Enqueued 3 jobs
// [Worker] Processing job #1 (task: resize-image) on nestjs-patterns.work-queue (seq: 1, deliveries: 1)
// [Worker] Processing job #2 (task: send-email) on nestjs-patterns.work-queue (seq: 2, deliveries: 1)
// [Worker] Processing job #3 (task: generate-report) on nestjs-patterns.work-queue (seq: 3, deliveries: 1)
