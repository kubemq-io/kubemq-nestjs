/**
 * Example: Connection Error
 *
 * Demonstrates handling ConnectionError, KubeMQTimeoutError, and
 * ConnectionNotReadyError by attempting connection to an invalid address.
 *
 * Prerequisites:
 *   - No KubeMQ server needed (this example intentionally fails)
 *
 * Run: npx tsx examples/error-handling/connection-error/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { ErrorDemoService } from './error-demo.service.js';

const logger = new Logger('ConnectionErrorExample');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  const errorDemo = app.get(ErrorDemoService);
  await errorDemo.demonstrateErrors();

  await app.close();
}

main().catch((err) => {
  logger.error('Bootstrap failed', err);
  process.exit(1);
});

// Expected output:
// [ErrorDemoService] Attempting to connect to invalid address...
// [ErrorDemoService] Caught ConnectionNotReadyError: KubeMQ client is not connected...
// [ErrorDemoService] Caught KubeMQRpcException: statusCode=503, kubemqCode=...
