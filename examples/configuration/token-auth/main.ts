/**
 * Example: Token Authentication
 *
 * Demonstrates token-based authentication via the credentials option
 * on both server and client sides.
 *
 * Prerequisites:
 *   - KubeMQ server running with token auth enabled
 *   - Set KUBEMQ_TOKEN environment variable with a valid JWT token
 *
 * Run: KUBEMQ_TOKEN=your-jwt-token npx tsx examples/configuration/token-auth/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';

const logger = new Logger('TokenAuthExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';
const token = process.env.KUBEMQ_TOKEN;
if (!token) {
  throw new Error('KUBEMQ_TOKEN environment variable is required. Set it before running this example.');
}

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  const kubemqServer = new KubeMQServer({
    address,
    clientId: 'nestjs-configuration-token-auth-server',
    credentials: token,
  });

  app.connectMicroservice({ strategy: kubemqServer });
  logger.log('Token auth configured — connecting to broker...');

  try {
    await app.startAllMicroservices();
    logger.log('Connected to KubeMQ broker with token authentication');
  } catch (err) {
    logger.error('Token auth failed — ensure token is valid');
    process.exitCode = 1;
  }

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
// [TokenAuthExample] Token auth configured — connecting to broker...
// [TokenAuthExample] Connected to KubeMQ broker with token authentication
