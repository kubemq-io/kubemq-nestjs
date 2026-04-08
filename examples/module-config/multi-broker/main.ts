/**
 * Example: multi-broker (Module Config)
 *
 * Demonstrates two KubeMQModule.register() calls to connect to different brokers
 * (or the same broker with different client identities). Each client is injected
 * by its own DI token and can target a different address.
 *
 * Prerequisites:
 *   - KubeMQ server(s) running
 *     (defaults: KUBEMQ_PRIMARY_ADDRESS=localhost:50000, KUBEMQ_SECONDARY_ADDRESS=localhost:50000)
 *
 * Run: npx tsx examples/module-config/multi-broker/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { MultiBrokerService } from './multi-broker.service.js';

const logger = new Logger('MultiBrokerExample');
const primaryAddress = process.env.KUBEMQ_PRIMARY_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address: primaryAddress,
      clientId: 'nestjs-module-config-multi-broker-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started with multi-broker config');

  await new Promise((r) => setTimeout(r, 1500));

  const service = app.get(MultiBrokerService);
  await service.sendToPrimary();
  await service.sendToSecondary();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [MultiBrokerExample] KubeMQ microservice started with multi-broker config
// [MultiBrokerService] Sending event to primary broker...
// [MultiBrokerHandler] [PRIMARY] Received on nestjs-module-config.multi-broker-primary: {"source":"primary","message":"Hello from primary broker"}
// [MultiBrokerService] Event sent to primary broker
// [MultiBrokerService] Sending event to secondary broker...
// [MultiBrokerHandler] [SECONDARY] Received on nestjs-module-config.multi-broker-secondary: {"source":"secondary","message":"Hello from secondary broker"}
// [MultiBrokerService] Event sent to secondary broker
