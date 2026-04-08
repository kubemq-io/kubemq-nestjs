/**
 * Example: registerAsync (Module Config)
 *
 * Demonstrates KubeMQModule.registerAsync() with @nestjs/config ConfigService.
 * The named client proxy is created asynchronously with options resolved from
 * environment variables at bootstrap time.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/module-config/register-async/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { NotificationService } from './notification.service.js';

const logger = new Logger('RegisterAsyncExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-module-config-register-async-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started with registerAsync()');

  await new Promise((r) => setTimeout(r, 1500));

  const service = app.get(NotificationService);
  await service.sendNotification();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [RegisterAsyncExample] KubeMQ microservice started with registerAsync()
// [NotificationService] Sending notification via async-registered client...
// [NotificationHandler] Notification received on nestjs-module-config.register-async: {"to":"user@example.com","subject":"Welcome"}
// [NotificationService] Notification response: {"sent":true,"to":"user@example.com"}
