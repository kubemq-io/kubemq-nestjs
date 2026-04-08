/**
 * Example: Reconnection
 *
 * Demonstrates ReconnectionPolicy configuration options with explanatory
 * comments for each option. Shows waitForConnection behavior.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/error-handling/reconnection/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';

const logger = new Logger('ReconnectionExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  // Server reconnection is configured here; client-side options are in app.module.ts
  const kubemqServer = new KubeMQServer({
    address,
    clientId: 'nestjs-error-handling-reconnection-server',
    waitForConnection: false,
    reconnect: {
      maxAttempts: 10,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
      multiplier: 2,
      jitter: 'full',
    },
  });

  app.connectMicroservice({ strategy: kubemqServer });
  await app.startAllMicroservices();

  logger.log('Microservice started with reconnection policy');
  logger.log('waitForConnection=false — app starts even if broker is down');
  logger.log('Reconnect: max 10 attempts, 1s initial delay, 30s max delay, exponential backoff with jitter');

  setTimeout(async () => {
    try {
      await app.close();
    } catch (err) {
      logger.error('Shutdown error', err);
      process.exitCode = 1;
    }
  }, 5000).unref();
}

main().catch((err) => {
  logger.error('Bootstrap failed', err);
  process.exit(1);
});

// Expected output:
// [ReconnectionExample] Microservice started with reconnection policy
// [ReconnectionExample] waitForConnection=false — app starts even if broker is down
// [ReconnectionExample] Reconnect: max 10 attempts, 1s initial delay, 30s max delay, exponential backoff with jitter
