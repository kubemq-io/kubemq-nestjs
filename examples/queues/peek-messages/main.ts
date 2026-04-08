/**
 * Example: Peek Queue Messages
 *
 * Demonstrates peeking at queue messages without consuming them using
 * the underlying kubemq-js client via KubeMQClientProxy.unwrap().
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/queues/peek-messages/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { PeekService } from './peek.service.js';

const logger = new Logger('PeekMessagesExample');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
  await app.init();
  logger.log('Application initialized');

  const peekService = app.get(PeekService);
  await peekService.sendAndPeek();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 10_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [PeekMessagesExample] Application initialized
// [PeekService] Sending 3 messages to queue...
// [PeekService] Peeking at queue (messages remain unconsumed)...
// [PeekService] Peeked message 1: seq=1 body={"index":0,"info":"peek-test"}
// [PeekService] Peeked message 2: seq=2 body={"index":1,"info":"peek-test"}
// [PeekService] Peeked message 3: seq=3 body={"index":2,"info":"peek-test"}
// [PeekService] Peek complete — messages are still in the queue
