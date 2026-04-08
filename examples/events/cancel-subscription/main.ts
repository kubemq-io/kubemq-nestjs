/**
 * Example: Cancel Subscription
 *
 * Demonstrates cancelling an event subscription by calling app.close()
 * after receiving a target number of events. The handler tracks the count
 * and signals completion to the bootstrap function.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/events/cancel-subscription/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer, KubeMQClientProxy } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';
import { AppModule } from './app.module.js';
import { EventHandlerService } from './event.handler.js';

const logger = new Logger('CancelSubscriptionExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-events-cancel-subscription-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('Microservice started — subscribing to events');

  await new Promise((r) => setTimeout(r, 1500));

  const handler = app.get(EventHandlerService);
  const client = app.get<KubeMQClientProxy>('KUBEMQ_CLIENT');
  await client.connect();

  for (let i = 1; i <= 5; i++) {
    await firstValueFrom(
      client.emit('nestjs-events.cancel-subscription', { seq: i }),
    );
    await new Promise((r) => setTimeout(r, 300));
  }

  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out waiting for messages')), 30_000));
  await Promise.race([handler.complete, timeout]);
  logger.log('Handler signalled completion — closing app to cancel subscription');
  await app.close();
  logger.log('Subscription cancelled, app closed');
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [CancelSubscriptionExample] Microservice started — subscribing to events
// [EventHandler] Event 1 received on nestjs-events.cancel-subscription
// [EventHandler] Event 2 received on nestjs-events.cancel-subscription
// [EventHandler] Event 3 received on nestjs-events.cancel-subscription — target reached
// [CancelSubscriptionExample] Handler signalled completion — closing app to cancel subscription
// [CancelSubscriptionExample] Subscription cancelled, app closed
