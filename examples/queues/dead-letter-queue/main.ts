/**
 * Example: Dead Letter Queue
 *
 * Demonstrates a primary queue handler that nacks poison messages, which are
 * then routed to a separate DLQ channel. A second @QueueHandler listens on
 * the DLQ channel to capture failed messages.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/queues/dead-letter-queue/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { QueueSenderService } from './queue.service.js';

const logger = new Logger('DeadLetterQueueExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-queues-dead-letter-queue-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started');

  await new Promise((r) => setTimeout(r, 1500));

  const sender = app.get(QueueSenderService);
  await sender.sendPoisonMessage();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [DeadLetterQueueExample] KubeMQ microservice started
// [QueueSenderService] Sending poison message with DLQ policy...
// [PrimaryHandler] Received poison message — NACK to trigger DLQ
// [DLQHandler] Dead-letter received: {"action":"poison","reason":"bad-format"}
// [DLQHandler] DLQ message acknowledged
