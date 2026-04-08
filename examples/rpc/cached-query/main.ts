/**
 * Example: Cached Query (RPC)
 *
 * Demonstrates sending a query with cacheKey and cacheTtlInSeconds metadata
 * via KubeMQRecord.asQuery().withMetadata({ cacheKey, cacheTtl }). The broker
 * caches the response for subsequent identical queries.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/rpc/cached-query/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { QueryService } from './query.service.js';

const logger = new Logger('CachedQueryExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-rpc-cached-query-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started');

  await new Promise((r) => setTimeout(r, 1500));

  const service = app.get(QueryService);
  await service.sendCachedQuery();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [CachedQueryExample] KubeMQ microservice started
// [QueryService] Sending query with cacheKey and cacheTtl...
// [QueryHandler] Processing query on nestjs-rpc.cached-query: {"configKey":"app.settings"}
// [QueryService] Query response: {"configKey":"app.settings","value":"production","version":1,"cached":false}
