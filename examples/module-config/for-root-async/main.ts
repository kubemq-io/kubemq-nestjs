/**
 * Example: forRootAsync — Async Module Configuration with ConfigService
 *
 * Demonstrates KubeMQModule.forRootAsync() with @nestjs/config ConfigService.
 * Options are resolved asynchronously at runtime, enabling environment-based
 * configuration via .env files or environment variables.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/module-config/for-root-async/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';

const logger = new Logger('ForRootAsyncExample');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  const config = app.get(ConfigService);
  const address = config.get('KUBEMQ_ADDRESS', 'localhost:50000');

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-module-config-for-root-async-server',
    }),
  });
  await app.startAllMicroservices();

  logger.log('KubeMQ microservice started with forRootAsync() configuration');
  logger.log(`Broker address (from ConfigService): ${address}`);

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
// [ForRootAsyncExample] KubeMQ microservice started with forRootAsync() configuration
// [ForRootAsyncExample] Broker address (from ConfigService): localhost:50000
// [ForRootAsyncExample] Shutting down...
