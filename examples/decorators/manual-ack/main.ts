/**
 * Example: Manual Ack (Decorators)
 *
 * Demonstrates @QueueHandler with { manualAck: true } and explicit
 * ctx.ack(), ctx.nack(), and ctx.reQueue() calls for fine-grained
 * queue message acknowledgement control.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/decorators/manual-ack/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { SenderService } from './sender.service.js';

const logger = new Logger('ManualAckExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-decorators-manual-ack-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started — manual ack mode');

  await new Promise((r) => setTimeout(r, 1500));

  const sender = app.get(SenderService);
  await sender.sendTasks();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [ManualAckExample] KubeMQ microservice started — manual ack mode
// [SenderService] Sending task T-001 (type=valid)...
// [ManualAckHandler] Received task T-001 (type=valid, priority=1) on nestjs-decorators.manual-ack
// [ManualAckHandler] Task T-001 — ACK (processed successfully)
// [SenderService] Sending task T-002 (type=invalid)...
// [ManualAckHandler] Received task T-002 (type=invalid, priority=2) on nestjs-decorators.manual-ack
// [ManualAckHandler] Task T-002 — NACK (rejected)
// [SenderService] Sending task T-003 (type=retry)...
// [ManualAckHandler] Received task T-003 (type=retry, priority=3) on nestjs-decorators.manual-ack
// [ManualAckHandler] Task T-003 — REQUEUE to nestjs-decorators.manual-ack-retry
// [SenderService] All tasks sent
