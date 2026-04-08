/**
 * Example: Send Query (RPC)
 *
 * Demonstrates sending a query via client.send() with KubeMQRecord.asQuery()
 * and receiving a JSON response from a @QueryHandler.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/rpc/send-query/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { QueryService } from './query.service.js';

const logger = new Logger('SendQueryExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-rpc-send-query-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started');

  await new Promise((r) => setTimeout(r, 1500));

  const service = app.get(QueryService);
  await service.sendQuery();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [SendQueryExample] KubeMQ microservice started
// [QueryService] Sending query...
// [QueryHandler] Received query on nestjs-rpc.send-query: {"userId":"USR-42"}
// [QueryService] Query response: {"userId":"USR-42","name":"Alice","email":"alice@example.com","role":"admin"}
