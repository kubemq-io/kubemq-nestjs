/**
 * Example: Close
 *
 * Demonstrates graceful shutdown with app.close(), proper resource cleanup,
 * and enableShutdownHooks() for OS signal handling.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/connection/close/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';

const logger = new Logger('CloseExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.enableShutdownHooks();

  const kubemqServer = new KubeMQServer({
    address,
    clientId: 'nestjs-connection-close-server',
  });

  app.connectMicroservice({ strategy: kubemqServer });
  await app.startAllMicroservices();

  logger.log('Microservice started — shutdown hooks enabled');

  setTimeout(async () => {
    try {
      logger.log('Triggering graceful close...');
      await app.close();
      logger.log('Application closed cleanly');
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
// [CloseExample] Microservice started — shutdown hooks enabled
// [CloseExample] Triggering graceful close...
// [KubeMQServer] Shutting down KubeMQ transport...
// [KubeMQServer] KubeMQ transport shut down
// [CloseExample] Application closed cleanly
