/**
 * Example: Connect
 *
 * Demonstrates basic NestJS app bootstrap with KubeMQModule.forRoot,
 * verifying broker connection via connectMicroservice.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/connection/connect/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';

const logger = new Logger('ConnectExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  const kubemqServer = new KubeMQServer({
    address,
    clientId: 'nestjs-connection-connect-server',
  });

  app.connectMicroservice({ strategy: kubemqServer });
  await app.startAllMicroservices();

  logger.log('KubeMQ microservice connected successfully');
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
// [ConnectExample] KubeMQ microservice connected successfully
// [ConnectExample] Broker address: localhost:50000
// [ConnectExample] Shutting down...
