/**
 * Example: Command Group (RPC)
 *
 * Demonstrates @CommandHandler with a group option for load-balanced command
 * handling. When multiple handlers share the same group, each command is
 * delivered to only one member of the group.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/rpc/command-group/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { CommandService } from './command.service.js';

const logger = new Logger('CommandGroupExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-rpc-command-group-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started with command group handler');

  await new Promise((r) => setTimeout(r, 1500));

  const service = app.get(CommandService);
  await service.sendCommands();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [CommandGroupExample] KubeMQ microservice started with command group handler
// [CommandService] Sending 3 commands to group channel...
// [CommandHandler] [group=nestjs-rpc-cmd-group] Command 1 on nestjs-rpc.command-group: {"seq":1,"task":"process"}
// [CommandHandler] [group=nestjs-rpc-cmd-group] Command 2 on nestjs-rpc.command-group: {"seq":2,"task":"process"}
// [CommandHandler] [group=nestjs-rpc-cmd-group] Command 3 on nestjs-rpc.command-group: {"seq":3,"task":"process"}
// [CommandService] All commands completed
