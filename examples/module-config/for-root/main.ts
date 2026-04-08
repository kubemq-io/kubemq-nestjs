/**
 * Example: forRoot — Static Module Configuration
 *
 * Demonstrates KubeMQModule.forRoot() with inline static options.
 * This is the simplest configuration pattern: address and options are
 * passed directly at module import time.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/module-config/for-root/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';

const logger = new Logger('ForRootExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-module-config-for-root-server',
    }),
  });
  await app.startAllMicroservices();

  logger.log('KubeMQ microservice started with forRoot() configuration');
  logger.log(`Broker address: ${address}`);

  setTimeout(async () => {
    try {
      logger.log('Shutting down...');
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
// [ForRootExample] KubeMQ microservice started with forRoot() configuration
// [ForRootExample] Broker address: localhost:50000
// [ForRootExample] Shutting down...
