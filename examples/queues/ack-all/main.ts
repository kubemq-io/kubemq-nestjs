/**
 * Example: Ack All Queue Messages
 *
 * Demonstrates receiving and acknowledging all queue messages using
 * the underlying kubemq-js client via KubeMQClientProxy.unwrap().
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/queues/ack-all/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { AckAllService } from './ack-all.service.js';

const logger = new Logger('AckAllExample');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
  await app.init();
  logger.log('Application initialized');

  const ackAllService = app.get(AckAllService);
  await ackAllService.sendAndAckAll();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 10_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [AckAllExample] Application initialized
// [AckAllService] Sending 3 messages to queue...
// [AckAllService] Receiving and acking all messages...
// [AckAllService] Received message seq=1: {"item":1}
// [AckAllService] Received message seq=2: {"item":2}
// [AckAllService] Received message seq=3: {"item":3}
// [AckAllService] All 3 messages received and acknowledged
