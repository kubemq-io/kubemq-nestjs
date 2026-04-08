/**
 * Example: Delayed Queue Messages
 *
 * Demonstrates sending queue messages with a delay policy. The message becomes
 * visible to consumers only after the specified delay period.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/queues/delayed-messages/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { QueueSenderService } from './queue.service.js';

const logger = new Logger('DelayedMessagesExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-queues-delayed-messages-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started');

  await new Promise((r) => setTimeout(r, 1500));

  const sender = app.get(QueueSenderService);
  await sender.sendDelayed();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 20_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [DelayedMessagesExample] KubeMQ microservice started
// [QueueSenderService] Sending message with 5s delay...
// [QueueSenderService] Delayed message sent — will be visible in ~5s
// [QueueHandlerService] Received delayed message: {"task":"scheduled-job","scheduledFor":"5s-later"}
// [QueueHandlerService] Message acknowledged
