/**
 * Example: Basic Health Check
 *
 * Demonstrates KubeMQHealthIndicator with a simple HTTP health endpoint.
 * After the KubeMQ microservice starts, the health indicator is created
 * from the server and exposed at GET /health.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/health-check/basic-health/main.ts
 * Test: curl http://localhost:3000/health
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer, KubeMQHealthIndicator } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { HealthService } from './health.service.js';

const logger = new Logger('BasicHealthExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';
const port = Number(process.env.PORT ?? 3000);

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  const kubemqServer = new KubeMQServer({
    address,
    clientId: 'nestjs-health-basic-server',
  });

  app.connectMicroservice({ strategy: kubemqServer });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started');

  const healthService = app.get(HealthService);
  // Health indicator is wired imperatively because KubeMQServer is created
  // outside the DI container. In production, consider using a custom provider factory.
  healthService.setIndicator(KubeMQHealthIndicator.fromServer(kubemqServer));
  logger.log('Health indicator initialized from KubeMQ server');

  app.enableShutdownHooks();
  await app.listen(port);
  logger.log(`HTTP server listening on http://localhost:${port}`);
  logger.log(`Health endpoint: http://localhost:${port}/health`);

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 30_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [BasicHealthExample] KubeMQ microservice started
// [BasicHealthExample] Health indicator initialized from KubeMQ server
// [BasicHealthExample] HTTP server listening on http://localhost:3000
// [BasicHealthExample] Health endpoint: http://localhost:3000/health
//
// curl http://localhost:3000/health
// → {"kubemq":{"status":"up","latencyMs":2}}
