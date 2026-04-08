/**
 * Example: Persistent Pub/Sub (Event Store)
 *
 * Demonstrates @EventStoreHandler decorator for persistent event subscriptions
 * and KubeMQRecord.asEventStore() for publishing to the event store. The handler
 * receives events with sequence numbers for ordered, durable delivery.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/events-store/persistent-pubsub/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { EventStoreService } from './event-store.service.js';

const logger = new Logger('PersistentPubSubExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-events-store-persistent-pubsub-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started with event store handler');

  await new Promise((r) => setTimeout(r, 1500));

  const service = app.get(EventStoreService);
  await service.publish();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [PersistentPubSubExample] KubeMQ microservice started with event store handler
// [EventStoreService] Publishing event to store...
// [EventStoreHandler] Received event (seq=1) on nestjs-events-store.persistent-pubsub: {"message":"persistent event"}
// [EventStoreService] Event store message published
