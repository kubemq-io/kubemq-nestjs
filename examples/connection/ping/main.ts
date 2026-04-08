/**
 * Example: Ping
 *
 * Demonstrates health check ping via KubeMQClientProxy, accessing the
 * underlying kubemq-js client to retrieve server info (host, version, uptime).
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/connection/ping/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { PingService } from './ping.service.js';

const logger = new Logger('PingExample');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  const pingService = app.get(PingService);
  await pingService.ping();

  await app.close();
}

main().catch((err) => {
  logger.error('Bootstrap failed', err);
  process.exit(1);
});

// Expected output:
// [PingService] Pinging KubeMQ broker...
// [PingService] Server host: localhost
// [PingService] Server version: ...
// [PingService] Server uptime: ...
