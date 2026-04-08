/**
 * Example: Request-Reply Pattern
 *
 * Demonstrates the full request-reply cycle using both @CommandHandler and
 * @QueryHandler. Commands use client.send() directly; queries use
 * KubeMQRecord.asQuery() to override the default command type.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/patterns/request-reply/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { RequestReplyService } from './request-reply.service.js';

const logger = new Logger('RequestReplyExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-patterns-request-reply-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started');

  await new Promise((r) => setTimeout(r, 1500));

  const service = app.get(RequestReplyService);
  await service.run();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [RequestReplyExample] KubeMQ microservice started
// [RequestReplyService] Sending command (request-reply)...
// [RequestReplyHandler] Command received on nestjs-patterns.request-reply.commands: {"action":"create-item","payload":"item-data"}
// [RequestReplyService] Command response: {"executed":true,"action":"create-item","processedAt":"..."}
// [RequestReplyService] Sending query (request-reply)...
// [RequestReplyHandler] Query received on nestjs-patterns.request-reply.queries: {"id":"item-42"}
// [RequestReplyService] Query response: {"id":"item-42","name":"Sample Item","status":"active","queriedAt":"..."}
