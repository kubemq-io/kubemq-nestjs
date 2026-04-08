/**
 * Example: Exception Filter
 *
 * Demonstrates a custom NestJS ExceptionFilter that handles KubeMQRpcException
 * and maps KubeMQ errors to structured HTTP responses.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/error-handling/exception-filter/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';

const logger = new Logger('ExceptionFilterExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  const kubemqServer = new KubeMQServer({
    address,
    clientId: 'nestjs-error-handling-exception-filter-server',
  });

  app.connectMicroservice({ strategy: kubemqServer });
  await app.startAllMicroservices();
  app.enableShutdownHooks();
  await app.listen(3000);

  logger.log('HTTP server on http://localhost:3000');
  logger.log('Try: curl http://localhost:3000/demo/send');

  setTimeout(async () => {
    try {
      await app.close();
    } catch (err) {
      logger.error('Shutdown error', err);
      process.exitCode = 1;
    }
  }, 15000).unref();
}

main().catch((err) => {
  logger.error('Bootstrap failed', err);
  process.exit(1);
});

// Expected output:
// [ExceptionFilterExample] HTTP server on http://localhost:3000
// [ExceptionFilterExample] Try: curl http://localhost:3000/demo/send
