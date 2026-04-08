/**
 * Example: Mutual TLS Setup
 *
 * Demonstrates mutual TLS with client certificates for both server
 * and client authentication.
 *
 * Prerequisites:
 *   - KubeMQ server running with mTLS enabled
 *   - CA cert, client cert, and client key files
 *
 * Run: npx tsx examples/configuration/mtls-setup/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';

const logger = new Logger('MtlsSetupExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  const kubemqServer = new KubeMQServer({
    address,
    clientId: 'nestjs-configuration-mtls-setup-server',
    tls: {
      caCert: process.env.KUBEMQ_CA_CERT ?? '/path/to/ca.pem',
      clientCert: process.env.KUBEMQ_CLIENT_CERT ?? '/path/to/client.pem',
      clientKey: process.env.KUBEMQ_CLIENT_KEY ?? '/path/to/client-key.pem',
    },
  });

  app.connectMicroservice({ strategy: kubemqServer });
  logger.log('mTLS configuration applied — connecting to broker...');

  try {
    await app.startAllMicroservices();
    logger.log('Connected to KubeMQ broker with mutual TLS');
  } catch (err) {
    logger.error('mTLS connection failed — ensure cert paths are correct');
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
// [MtlsSetupExample] mTLS configuration applied — connecting to broker...
// [MtlsSetupExample] Connected to KubeMQ broker with mutual TLS
