/**
 * Example: Terminus Integration
 *
 * Demonstrates KubeMQHealthIndicator integrated with @nestjs/terminus
 * HealthCheckService for production-grade health endpoints. Terminus
 * provides standardized health check responses with aggregated status.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *   - @nestjs/terminus installed: npm install @nestjs/terminus
 *
 * Run: npx tsx examples/health-check/terminus-integration/main.ts
 * Test: curl http://localhost:3000/health
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer, KubeMQHealthIndicator } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { HealthController } from './health.controller.js';

const logger = new Logger('TerminusIntegrationExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';
const port = Number(process.env.PORT ?? 3000);

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  const kubemqServer = new KubeMQServer({
    address,
    clientId: 'nestjs-health-terminus-server',
  });

  app.connectMicroservice({ strategy: kubemqServer });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started');

  const healthController = app.get(HealthController);
  // Health indicator is wired imperatively because KubeMQServer is created
  // outside the DI container. In production, consider using a custom provider factory.
  healthController.setIndicator(KubeMQHealthIndicator.fromServer(kubemqServer));
  logger.log('Terminus health indicator initialized');

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
// [TerminusIntegrationExample] KubeMQ microservice started
// [TerminusIntegrationExample] Terminus health indicator initialized
// [TerminusIntegrationExample] HTTP server listening on http://localhost:3000
// [TerminusIntegrationExample] Health endpoint: http://localhost:3000/health
//
// curl http://localhost:3000/health
// → {"status":"ok","info":{"kubemq":{"status":"up","latencyMs":2}},"error":{},"details":{"kubemq":{"status":"up","latencyMs":2}}}
