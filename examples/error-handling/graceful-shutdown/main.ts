/**
 * Example: Graceful Shutdown
 *
 * Demonstrates clean shutdown with multiple active subscriptions,
 * enableShutdownHooks(), and drain callbacks.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/error-handling/graceful-shutdown/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';

const logger = new Logger('GracefulShutdownExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
  app.enableShutdownHooks();

  const kubemqServer = new KubeMQServer({
    address,
    clientId: 'nestjs-error-handling-graceful-shutdown-server',
    callbackTimeoutSeconds: 5,
  });

  app.connectMicroservice({ strategy: kubemqServer });
  await app.startAllMicroservices();

  logger.log('Microservice started with multiple handlers');
  logger.log('Shutdown hooks enabled — will drain on SIGTERM/SIGINT');

  setTimeout(async () => {
    try {
      logger.log('Initiating graceful shutdown...');
      await app.close();
      logger.log('All handlers drained, connections closed');
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
// [GracefulShutdownExample] Microservice started with multiple handlers
// [GracefulShutdownExample] Shutdown hooks enabled — will drain on SIGTERM/SIGINT
// [GracefulShutdownExample] Initiating graceful shutdown...
// [KubeMQServer] Shutting down KubeMQ transport...
// [KubeMQServer] KubeMQ transport shut down
// [GracefulShutdownExample] All handlers drained, connections closed
