/**
 * Example: Query Cache Hit (RPC)
 *
 * Demonstrates KubeMQ query caching by sending two identical queries with
 * cacheKey and cacheTtlInSeconds. The first query hits the handler; the
 * second returns the cached response without invoking the handler.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/rpc/query-cache-hit/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module.js';
import { QueryService } from './query.service.js';

const logger = new Logger('QueryCacheHitExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-rpc-query-cache-hit-server',
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started');

  await new Promise((r) => setTimeout(r, 1500));

  const service = app.get(QueryService);
  await service.demonstrateCacheHit();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [QueryCacheHitExample] KubeMQ microservice started
// [QueryService] --- Query 1 (cache miss) ---
// [QueryService] Sending query with cacheKey...
// [QueryHandler] Processing query on nestjs-rpc.query-cache-hit: {"key":"exchange-rate","currency":"USD"}
// [QueryService] Response 1: {"currency":"USD","rate":1.0,"source":"handler","timestamp":...}
// [QueryService] --- Query 2 (cache hit) ---
// [QueryService] Sending same query again (should hit cache)...
// [QueryService] Response 2: {"currency":"USD","rate":1.0,"source":"handler","timestamp":...}
// [QueryService] Cache hit confirmed — handler was NOT invoked for query 2
