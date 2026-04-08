/**
 * Example: Query Group (RPC)
 *
 * Demonstrates @QueryHandler with a group option for load-balanced query
 * handling. When multiple handlers share the same group, each query is
 * delivered to only one member of the group.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/rpc/query-group/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { QueryService } from './query.service.js';

const logger = new Logger('QueryGroupExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-rpc-query-group-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started with query group handler');

  await new Promise((r) => setTimeout(r, 1500));

  const service = app.get(QueryService);
  await service.sendQueries();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [QueryGroupExample] KubeMQ microservice started with query group handler
// [QueryService] Sending 3 queries to group channel...
// [QueryHandler] [group=nestjs-rpc-query-group] Query 1 on nestjs-rpc.query-group: {"seq":1,"lookup":"inventory"}
// [QueryHandler] [group=nestjs-rpc-query-group] Query 2 on nestjs-rpc.query-group: {"seq":2,"lookup":"inventory"}
// [QueryHandler] [group=nestjs-rpc-query-group] Query 3 on nestjs-rpc.query-group: {"seq":3,"lookup":"inventory"}
// [QueryService] All queries completed
