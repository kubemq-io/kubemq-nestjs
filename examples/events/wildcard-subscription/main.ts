/**
 * Example: Wildcard Subscription
 *
 * Demonstrates subscribing to events using a wildcard channel pattern.
 * The handler receives events published to any channel matching
 * 'nestjs-events.wildcard.*'.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/events/wildcard-subscription/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { EventService } from './event.service.js';

const logger = new Logger('WildcardSubscriptionExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-events-wildcard-subscription-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('Microservice started with wildcard handler');

  await new Promise((r) => setTimeout(r, 1500));

  const eventService = app.get(EventService);
  await eventService.publishToSubChannels();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [WildcardSubscriptionExample] Microservice started with wildcard handler
// [EventService] Publishing to nestjs-events.wildcard.orders...
// [EventService] Publishing to nestjs-events.wildcard.users...
// [EventService] Publishing to nestjs-events.wildcard.payments...
// [EventHandler] Wildcard match on nestjs-events.wildcard.orders: {"type":"order","id":1}
// [EventHandler] Wildcard match on nestjs-events.wildcard.users: {"type":"user","id":2}
// [EventHandler] Wildcard match on nestjs-events.wildcard.payments: {"type":"payment","id":3}
