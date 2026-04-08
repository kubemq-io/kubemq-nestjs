/**
 * Example: Logger Bridge Setup (Observability)
 *
 * Demonstrates createNestKubeMQLogger — a bridge that routes kubemq-js
 * internal debug/info/warn/error logs through the NestJS Logger system.
 * KubeMQServer and KubeMQClientProxy use this bridge automatically, but
 * you can also create custom bridges for your own logging contexts.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/observability/logger-bridge-setup/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer, createNestKubeMQLogger } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';

const logger = new Logger('LoggerBridgeExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  const kubemqLogger = createNestKubeMQLogger('MyApp-KubeMQ');

  kubemqLogger.info('Logger bridge created — kubemq-js logs flow through NestJS');
  kubemqLogger.debug('Debug-level message', { component: 'transport', latencyMs: 12 });
  kubemqLogger.warn('Warning-level message', { retryAttempt: 2 });
  kubemqLogger.error('Error-level message', { code: 'CONN_REFUSED', address });

  const kubemqServer = new KubeMQServer({
    address,
    clientId: 'nestjs-observability-logger-bridge-server',
  });

  app.connectMicroservice({ strategy: kubemqServer });
  await app.startAllMicroservices();

  logger.log('Microservice started — internal kubemq-js logs use NestJS Logger');

  setTimeout(async () => {
    try {
      await app.close();
      logger.log('Closed');
    } catch (err) {
      logger.error('Shutdown error', err);
      process.exitCode = 1;
    }
  }, 5000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [MyApp-KubeMQ] Logger bridge created — kubemq-js logs flow through NestJS
// [MyApp-KubeMQ] Debug-level message {"component":"transport","latencyMs":12}
// [MyApp-KubeMQ] Warning-level message {"retryAttempt":2}
// [MyApp-KubeMQ] Error-level message {"code":"CONN_REFUSED","address":"localhost:50000"}
// [LoggerBridgeExample] Microservice started — internal kubemq-js logs use NestJS Logger
