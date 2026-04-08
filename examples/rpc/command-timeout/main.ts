/**
 * Example: Command Timeout (RPC)
 *
 * Demonstrates error handling when a command times out because no handler
 * is registered to respond. The service sends a command with a short timeout
 * and catches the resulting KubeMQRpcException.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/rpc/command-timeout/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { CommandService } from './command.service.js';

const logger = new Logger('CommandTimeoutExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-rpc-command-timeout-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started (no handler registered for timeout channel)');

  await new Promise((r) => setTimeout(r, 1500));

  const service = app.get(CommandService);
  await service.sendCommandWithTimeout();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [CommandTimeoutExample] KubeMQ microservice started (no handler registered for timeout channel)
// [CommandService] Sending command with 2s timeout (no handler will respond)...
// [CommandService] Caught expected timeout error:
// [CommandService]   statusCode: 408
// [CommandService]   message: Transport operation failed
// [CommandService]   kubemqCode: TIMEOUT
// [CommandService] Timeout handling completed successfully
