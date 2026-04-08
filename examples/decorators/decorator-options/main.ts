/**
 * Example: Decorator Options
 *
 * Demonstrates handler decorator options: group, maxConcurrent, startFrom,
 * manualAck, maxMessages, and waitTimeoutSeconds across all handler types.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/decorators/decorator-options/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { SenderService } from './sender.service.js';

const logger = new Logger('DecoratorOptionsExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-decorators-options-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started — decorator options configured');

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
// [DecoratorOptionsExample] KubeMQ microservice started — decorator options configured
// [SenderService] Sending command (group=cmd-workers)...
// [OptionsHandler] [CMD group=cmd-workers] nestjs-decorators.options-cmd: {"action":"deploy"}
// [SenderService] Command response: {"processed":true}
// [SenderService] Sending query (group=query-workers, maxConcurrent=5)...
// [OptionsHandler] [QUERY group=query-workers, maxConcurrent=5] nestjs-decorators.options-query: {"search":"config"}
// [SenderService] Query response: {"result":"found"}
// [SenderService] Emitting event (group=event-group)...
// [OptionsHandler] [EVENT group=event-group] nestjs-decorators.options-event: {"type":"alert"}
// [SenderService] Emitting event-store (startFrom=first)...
// [OptionsHandler] [EVENT_STORE group=store-group, startFrom=first] seq=...: {"audit":"access"}
// [SenderService] Sending queue message (maxMessages=10, wait=5s)...
// [OptionsHandler] [QUEUE manualAck, maxMessages=10, wait=5s] nestjs-decorators.options-queue: {"task":"resize"}
// [SenderService] All messages sent
