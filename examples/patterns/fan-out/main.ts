/**
 * Example: Fan-Out Pattern
 *
 * Demonstrates fan-out delivery where two separate @EventHandler classes subscribe
 * to the same channel without a consumer group. Every event is delivered to both
 * subscribers independently.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/patterns/fan-out/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { FanOutService } from './fan-out.service.js';

const logger = new Logger('FanOutExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-patterns-fan-out-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('Microservice started with two subscriber classes');

  await new Promise((r) => setTimeout(r, 1500));

  const service = app.get(FanOutService);
  await service.publish();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [FanOutExample] Microservice started with two subscriber classes
// [FanOutService] Publishing event to fan-out channel...
// [SubscriberA] Received event on nestjs-patterns.fan-out: {"message":"broadcast to all subscribers"}
// [SubscriberB] Received event on nestjs-patterns.fan-out: {"message":"broadcast to all subscribers"}
// [FanOutService] Event published — both subscribers should receive it
