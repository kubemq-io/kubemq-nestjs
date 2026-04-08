/**
 * Example: Send Command (RPC)
 *
 * Demonstrates sending a command via client.send() and receiving the response
 * from a @CommandHandler. The handler processes the command and returns a result.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/rpc/send-command/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { CommandService } from './command.service.js';

const logger = new Logger('SendCommandExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-rpc-send-command-server',
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
// [SendCommandExample] KubeMQ microservice started
// [CommandService] Sending command...
// [CommandHandler] Received command on nestjs-rpc.send-command: {"action":"create-user","name":"Alice"}
// [CommandService] Command response: {"executed":true,"action":"create-user"}
