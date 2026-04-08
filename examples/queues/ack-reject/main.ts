/**
 * Example: Queue Ack & Reject
 *
 * Demonstrates selective acknowledgment and rejection of queue messages.
 * The handler acks valid messages and nacks invalid ones via
 * KubeMQQueueContext.ack() / KubeMQQueueContext.nack().
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/queues/ack-reject/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { QueueSenderService } from './queue.service.js';

const logger = new Logger('AckRejectExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-queues-ack-reject-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started');

  await new Promise((r) => setTimeout(r, 1500));

  const sender = app.get(QueueSenderService);
  await sender.sendMessages();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [AckRejectExample] KubeMQ microservice started
// [QueueSenderService] Sending valid message...
// [QueueSenderService] Sending invalid message...
// [QueueHandlerService] Received: {"status":"valid","data":"process-me"} — ACK
// [QueueHandlerService] Received: {"status":"invalid","data":"bad-data"} — NACK (rejected)
