/**
 * Integration tests: Query round-trip, cache hit
 *
 * Requires a live KubeMQ broker on localhost:50000.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { firstValueFrom } from 'rxjs';

import { KubeMQClient } from 'kubemq-js';
import {
  KubeMQClientProxy,
  KubeMQRecord,
} from '../../src/index.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const BROKER_ADDRESS = 'localhost:50000';

async function checkBroker(): Promise<boolean> {
  try {
    const c = await KubeMQClient.create({ address: BROKER_ADDRESS, clientId: 'ping-check-q' });
    await c.ping();
    await c.close({ timeoutSeconds: 2 });
    return true;
  } catch {
    return false;
  }
}

const brokerAvailable = await checkBroker();

function uniqueChannel(prefix: string): string {
  return `test.${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
}

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

describe('Queries integration', () => {
  let client: KubeMQClientProxy;

  beforeAll(async () => {
    if (!brokerAvailable) return;

    client = new KubeMQClientProxy({
      address: BROKER_ADDRESS,
      clientId: `test-client-query-${Date.now()}`,
      defaultQueryTimeout: 10,
      verboseErrors: true,
    });

    await client.connect();
  }, 30_000);

  afterAll(async () => {
    if (!brokerAvailable) return;
    try {
      await client?.close();
    } catch { /* ignore */ }
  }, 15_000);

  it.skipIf(!brokerAvailable)('should perform query round-trip: send -> handler -> response', async () => {
    const channel = uniqueChannel('query-roundtrip');
    const payload = { productId: 'abc-123' };

    // Set up a query subscriber using raw kubemq-js
    const sdkClient = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `query-handler-${Date.now()}`,
    });

    const receivedQueries: any[] = [];

    const sub = sdkClient.subscribeToQueries({
      channel,
      onQuery: async (query) => {
        receivedQueries.push(query);
        const body = JSON.parse(new TextDecoder().decode(query.body));
        await sdkClient.sendQueryResponse({
          id: query.id,
          replyChannel: query.replyChannel,
          clientId: `query-handler-${Date.now()}`,
          executed: true,
          body: new TextEncoder().encode(
            JSON.stringify({ product: body.productId, name: 'Widget', price: 9.99 }),
          ),
        });
      },
      onError: (err) => {
        console.error('Query subscription error:', err);
      },
    });

    await new Promise((r) => setTimeout(r, 500));

    // Send query via KubeMQClientProxy using KubeMQRecord.asQuery()
    const result = await firstValueFrom(
      client.send(channel, new KubeMQRecord(payload).asQuery()),
    );

    expect(result).toEqual({ product: 'abc-123', name: 'Widget', price: 9.99 });
    expect(receivedQueries.length).toBe(1);

    sub.cancel();
    await sdkClient.close({ timeoutSeconds: 2 });
  }, 15_000);

  it.skipIf(!brokerAvailable)('should return error when query handler reports failure', async () => {
    const channel = uniqueChannel('query-error');

    const sdkClient = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `query-err-handler-${Date.now()}`,
    });

    const sub = sdkClient.subscribeToQueries({
      channel,
      onQuery: async (query) => {
        await sdkClient.sendQueryResponse({
          id: query.id,
          replyChannel: query.replyChannel,
          clientId: `query-err-handler-${Date.now()}`,
          executed: false,
          error: 'Product not found',
        });
      },
      onError: () => {},
    });

    await new Promise((r) => setTimeout(r, 500));

    try {
      await firstValueFrom(
        client.send(channel, new KubeMQRecord({ id: 'missing' }).asQuery()),
      );
      expect.unreachable('Should have thrown');
    } catch (err: any) {
      expect(err).toBeDefined();
      expect(err.message || err.error?.message || JSON.stringify(err)).toContain('Product not found');
    }

    sub.cancel();
    await sdkClient.close({ timeoutSeconds: 2 });
  }, 15_000);

  it.skipIf(!brokerAvailable)('should handle query with cache parameters', async () => {
    const channel = uniqueChannel('query-cache');

    const sdkClient = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `query-cache-handler-${Date.now()}`,
    });

    let queryCount = 0;

    const sub = sdkClient.subscribeToQueries({
      channel,
      onQuery: async (query) => {
        queryCount++;
        const body = JSON.parse(new TextDecoder().decode(query.body));
        await sdkClient.sendQueryResponse({
          id: query.id,
          replyChannel: query.replyChannel,
          clientId: `query-cache-handler-${Date.now()}`,
          executed: true,
          body: new TextEncoder().encode(
            JSON.stringify({ result: body.key, queryNum: queryCount }),
          ),
        });
      },
      onError: () => {},
    });

    await new Promise((r) => setTimeout(r, 500));

    // Send a query with cache key and TTL
    const record = new KubeMQRecord({ key: 'cached-value' })
      .asQuery()
      .withMetadata({ cacheKey: `cache-${channel}`, cacheTtl: 60 });

    const result1 = await firstValueFrom(client.send(channel, record));
    expect(result1).toBeDefined();
    expect(result1.result).toBe('cached-value');

    // Second query with same cache key may hit cache (depends on broker config)
    // We just verify it succeeds
    const record2 = new KubeMQRecord({ key: 'cached-value' })
      .asQuery()
      .withMetadata({ cacheKey: `cache-${channel}`, cacheTtl: 60 });

    const result2 = await firstValueFrom(client.send(channel, record2));
    expect(result2).toBeDefined();
    expect(result2.result).toBe('cached-value');

    sub.cancel();
    await sdkClient.close({ timeoutSeconds: 2 });
  }, 15_000);

  it.skipIf(!brokerAvailable)('should timeout when no query handler responds', async () => {
    const channel = uniqueChannel('query-timeout');

    const shortClient = new KubeMQClientProxy({
      address: BROKER_ADDRESS,
      clientId: `test-client-qtimeout-${Date.now()}`,
      defaultQueryTimeout: 2,
    });
    await shortClient.connect();

    try {
      await firstValueFrom(
        shortClient.send(channel, new KubeMQRecord({ test: true }).asQuery()),
      );
      expect.unreachable('Should have thrown');
    } catch (err: any) {
      expect(err).toBeDefined();
    }

    await shortClient.close();
  }, 15_000);
});
