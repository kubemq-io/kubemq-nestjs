/**
 * Example: Queue Send & Receive
 *
 * Demonstrates sending a queue message via KubeMQClientProxy and receiving it
 * with a @QueueHandler decorator. The handler acknowledges each message via
 * KubeMQQueueContext.ack().
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/queues/send-receive/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { QueueSenderService } from './queue.service.js';

const logger = new Logger('SendReceiveExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-queues-send-receive-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started');

  await new Promise((r) => setTimeout(r, 1500));

  const sender = app.get(QueueSenderService);
  await sender.send();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [SendReceiveExample] KubeMQ microservice started
// [QueueSenderService] Sending queue message...
// [QueueHandlerService] Received on nestjs-queues.send-receive: {"orderId":"ORD-001","item":"Widget"}
// [QueueHandlerService] Message acknowledged
// [QueueSenderService] Queue message sent successfully
