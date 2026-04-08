/**
 * Example: Queue Stream — High-Throughput Send
 *
 * Demonstrates high-throughput queue sending via createQueueUpstream(),
 * which keeps a persistent gRPC stream open for batch sends.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/queues-stream/stream-send/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { StreamSendService } from './stream.service.js';

const logger = new Logger('StreamSendExample');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
  await app.init();
  logger.log('Application initialized');

  const service = app.get(StreamSendService);
  await service.run();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 10_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [StreamSendExample] Application initialized
// [StreamSendService] Creating upstream stream...
// [StreamSendService] Sending batch 1 (3 messages)...
// [StreamSendService] Batch 1 sent — results: 3
// [StreamSendService] Sending batch 2 (3 messages)...
// [StreamSendService] Batch 2 sent — results: 3
// [StreamSendService] Upstream stream closed
