/**
 * Example: Handle Command (RPC)
 *
 * Demonstrates a @CommandHandler that processes incoming commands and returns
 * a response. A built-in test client sends a command to verify the handler.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/rpc/handle-command/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { CommandService } from './command.service.js';

const logger = new Logger('HandleCommandExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-rpc-handle-command-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started');

  await new Promise((r) => setTimeout(r, 1500));

  const service = app.get(CommandService);
  await service.sendCommand();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [HandleCommandExample] KubeMQ microservice started
// [CommandService] Sending command to handler...
// [CommandHandler] Processing command on nestjs-rpc.handle-command: {"orderId":"ORD-001","status":"approved"}
// [CommandHandler] Command processed — order ORD-001 approved
// [CommandService] Handler response: {"processed":true,"orderId":"ORD-001","result":"order-approved"}
