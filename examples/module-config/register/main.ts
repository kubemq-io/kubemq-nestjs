/**
 * Example: register — Named Client Injection
 *
 * Demonstrates KubeMQModule.register() for creating a named client proxy.
 * The client is injected via @Inject('KUBEMQ_SERVICE') and used to send
 * events to the broker.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/module-config/register/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { SenderService } from './sender.service.js';

const logger = new Logger('RegisterExample');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  logger.log('App created with KubeMQModule.register() — named client injection');

  const sender = app.get(SenderService);
  await sender.sendEvent();

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
// [RegisterExample] App created with KubeMQModule.register() — named client injection
// [SenderService] Sending event via named KUBEMQ_SERVICE client...
// [SenderService] Event sent successfully
// [RegisterExample] Shutting down...
