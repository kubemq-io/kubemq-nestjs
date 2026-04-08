/**
 * Example: Custom Logger
 *
 * Demonstrates createNestKubeMQLogger bridge connecting kubemq-js internal
 * logs to the NestJS Logger, showing debug/info/warn/error logs flowing
 * through the NestJS logging system.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/configuration/custom-logger/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer, createNestKubeMQLogger } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';

const logger = new Logger('CustomLoggerExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  const kubemqLogger = createNestKubeMQLogger('MyKubeMQTransport');
  kubemqLogger.info('Logger bridge created');
  kubemqLogger.debug('This debug message flows through NestJS Logger');
  kubemqLogger.warn('This warning flows through NestJS Logger');

  const kubemqServer = new KubeMQServer({
    address,
    clientId: 'nestjs-configuration-custom-logger-server',
  });

  app.connectMicroservice({ strategy: kubemqServer });
  await app.startAllMicroservices();

  logger.log('Microservice started with custom logger bridge');

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
// [MyKubeMQTransport] Logger bridge created
// [MyKubeMQTransport] This debug message flows through NestJS Logger
// [MyKubeMQTransport] This warning flows through NestJS Logger
// [CustomLoggerExample] Microservice started with custom logger bridge
