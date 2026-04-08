/**
 * Example: TLS Setup
 *
 * Demonstrates TLS connection with server certificate verification.
 * Note: This example requires a TLS-enabled KubeMQ broker and valid certificates.
 *
 * Prerequisites:
 *   - KubeMQ server running with TLS enabled
 *   - CA certificate file at /path/to/ca.pem (or adjust path)
 *
 * Run: npx tsx examples/configuration/tls-setup/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';

const logger = new Logger('TlsSetupExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  const kubemqServer = new KubeMQServer({
    address,
    clientId: 'nestjs-configuration-tls-setup-server',
    tls: {
      caCert: process.env.KUBEMQ_CA_CERT ?? '/path/to/ca.pem',
    },
  });

  app.connectMicroservice({ strategy: kubemqServer });
  logger.log('TLS configuration applied — connecting to broker...');

  try {
    await app.startAllMicroservices();
    logger.log('Connected to KubeMQ broker with TLS');
  } catch (err) {
    logger.error('TLS connection failed — ensure broker has TLS enabled and cert paths are correct');
    process.exitCode = 1;
  }

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
// [TlsSetupExample] TLS configuration applied — connecting to broker...
// [TlsSetupExample] Connected to KubeMQ broker with TLS
