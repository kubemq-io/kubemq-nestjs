/**
 * Example: Custom Timeouts
 *
 * Demonstrates configuring connection timeout, command timeout, query timeout,
 * and callback timeout in KubeMQServerOptions.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/configuration/custom-timeouts/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';

const logger = new Logger('CustomTimeoutsExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  const kubemqServer = new KubeMQServer({
    address,
    clientId: 'nestjs-configuration-custom-timeouts-server',
    defaultCommandTimeout: 30,
    defaultQueryTimeout: 60,
    callbackTimeoutSeconds: 10,
    retry: { maxRetries: 3, initialBackoffMs: 1000, maxBackoffMs: 30000, multiplier: 2, jitter: 'full' },
    keepalive: { timeMs: 30000, timeoutMs: 5000, permitWithoutCalls: true },
  });

  app.connectMicroservice({ strategy: kubemqServer });
  await app.startAllMicroservices();

  logger.log('Microservice started with custom timeouts');
  logger.log('Command timeout: 30s, Query timeout: 60s, Callback timeout: 10s');

  setTimeout(async () => {
    try {
      await app.close();
    } catch (err) {
      logger.error('Shutdown error', err);
      process.exitCode = 1;
    }
  }, 3000).unref();
}

main().catch((err) => {
  logger.error('Bootstrap failed', err);
  process.exit(1);
});

// Expected output:
// [CustomTimeoutsExample] Microservice started with custom timeouts
// [CustomTimeoutsExample] Command timeout: 30s, Query timeout: 60s, Callback timeout: 10s
