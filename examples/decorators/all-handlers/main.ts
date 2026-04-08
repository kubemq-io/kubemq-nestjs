/**
 * Example: All Handlers (Decorators)
 *
 * Demonstrates all 5 handler decorators (@CommandHandler, @QueryHandler,
 * @EventHandler, @EventStoreHandler, @QueueHandler) in a single service.
 * A sender service exercises each handler type.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/decorators/all-handlers/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { SenderService } from './sender.service.js';

const logger = new Logger('AllHandlersExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-decorators-all-handlers-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started — all 5 handler types registered');

  await new Promise((r) => setTimeout(r, 1500));

  const sender = app.get(SenderService);
  await sender.runAll();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [AllHandlersExample] KubeMQ microservice started — all 5 handler types registered
// [SenderService] --- Sending command ---
// [AllHandlers] [CMD] nestjs-decorators.all-handlers-cmd: {"action":"create"}
// [SenderService] Command response: {"executed":true,"type":"command"}
// [SenderService] --- Sending query ---
// [AllHandlers] [QUERY] nestjs-decorators.all-handlers-query: {"search":"items"}
// [SenderService] Query response: {"items":["a","b","c"],"type":"query"}
// [SenderService] --- Emitting event ---
// [AllHandlers] [EVENT] nestjs-decorators.all-handlers-event: {"alert":"user-login"}
// [SenderService] Event emitted
// [SenderService] --- Emitting event-store ---
// [AllHandlers] [EVENT_STORE] nestjs-decorators.all-handlers-event-store (seq=...): {"audit":"config-changed"}
// [SenderService] Event-store emitted
// [SenderService] --- Sending queue message ---
// [AllHandlers] [QUEUE] nestjs-decorators.all-handlers-queue: {"task":"process-image"}
// [SenderService] Queue message sent
