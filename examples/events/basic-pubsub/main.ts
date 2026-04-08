/**
 * Example: Basic Pub/Sub Events
 *
 * Demonstrates @EventHandler decorator + client.emit() for fire-and-forget events.
 * The handler logs received events, the service publishes events, both in same app.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/events/basic-pubsub/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { EventService } from './event.service.js';

const logger = new Logger('BasicPubSubExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-events-basic-pubsub-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started');

  await new Promise((r) => setTimeout(r, 1500));

  const eventService = app.get(EventService);
  await eventService.publish();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [BasicPubSubExample] KubeMQ microservice started
// [EventService] Publishing event...
// [EventHandler] Received event on nestjs-events.basic-pubsub: {"message":"Hello from NestJS"}
// [EventService] Event published successfully
