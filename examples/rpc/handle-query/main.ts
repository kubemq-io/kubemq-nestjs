/**
 * Example: Handle Query (RPC)
 *
 * Demonstrates a @QueryHandler that processes incoming queries and returns
 * a rich JSON response. A built-in test client sends a query to verify.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/rpc/handle-query/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { QueryService } from './query.service.js';

const logger = new Logger('HandleQueryExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-rpc-handle-query-server',
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
// [HandleQueryExample] KubeMQ microservice started
// [QueryService] Sending query...
// [QueryHandler] Processing query on nestjs-rpc.handle-query: {"productId":"PROD-100"}
// [QueryService] Query response: {"productId":"PROD-100","name":"Widget Pro","price":29.99,"inStock":true,"categories":["electronics","gadgets"]}
