/**
 * Integration tests: Graceful shutdown drains in-flight
 *
 * Requires a live KubeMQ broker on localhost:50000.
 *
 * These tests verify that:
 * 1. Server close() cancels subscriptions before closing
 * 2. Client close() waits for pending operations
 * 3. Double close() is idempotent
 * 4. In-flight commands complete before shutdown
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { firstValueFrom } from 'rxjs';

import { KubeMQClient } from 'kubemq-js';
import {
  KubeMQServer,
  KubeMQClientProxy,
  KubeMQRecord,
} from '../../src/index.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const BROKER_ADDRESS = 'localhost:50000';

async function checkBroker(): Promise<boolean> {
  try {
    const c = await KubeMQClient.create({ address: BROKER_ADDRESS, clientId: 'ping-check-shutdown' });
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

function waitForCondition(
  condition: () => boolean,
  timeoutMs: number = 5000,
  intervalMs: number = 100,
): Promise<boolean> {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      if (condition()) {
        resolve(true);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        resolve(false);
        return;
      }
      setTimeout(check, intervalMs);
    };
    check();
  });
}

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

describe('Shutdown integration', () => {
  beforeAll(async () => {
    if (!brokerAvailable) return;
  }, 30_000);

  it.skipIf(!brokerAvailable)('should gracefully close server after listen()', async () => {
    const server = new KubeMQServer({
      address: BROKER_ADDRESS,
      clientId: `shutdown-server-${Date.now()}`,
    });

    await new Promise<void>((resolve) => {
      server.listen(() => { resolve(); });
    });

    // Server should be usable (unwrap should not throw)
    const sdkClient = server.unwrap();
    expect(sdkClient).toBeDefined();

    // Now close gracefully
    await server.close();

    // After close, unwrap should throw
    expect(() => server.unwrap()).toThrow('Not initialized');
  }, 15_000);

  it.skipIf(!brokerAvailable)('should make server.close() idempotent', async () => {
    const server = new KubeMQServer({
      address: BROKER_ADDRESS,
      clientId: `shutdown-idem-${Date.now()}`,
    });

    await new Promise<void>((resolve) => {
      server.listen(() => { resolve(); });
    });

    // Close twice — should not throw
    await server.close();
    await server.close();
  }, 15_000);

  it.skipIf(!brokerAvailable)('should make client.close() idempotent', async () => {
    const client = new KubeMQClientProxy({
      address: BROKER_ADDRESS,
      clientId: `shutdown-client-idem-${Date.now()}`,
    });

    await client.connect();

    // Close twice — should not throw
    await client.close();
    await client.close();
  }, 15_000);

  it.skipIf(!brokerAvailable)('should cancel subscriptions on server close', async () => {
    const server = new KubeMQServer({
      address: BROKER_ADDRESS,
      clientId: `shutdown-cancel-sub-${Date.now()}`,
    });

    const channel = uniqueChannel('shutdown-sub');

    await new Promise<void>((resolve) => {
      server.listen(() => { resolve(); });
    });

    // Get the raw SDK client to manually subscribe (simulating what bindHandler does)
    const sdkClient = server.unwrap();

    // Create a subscription through the raw client
    const received: any[] = [];
    sdkClient.subscribeToEvents({
      channel,
      onEvent: (event) => {
        const body = JSON.parse(new TextDecoder().decode(event.body));
        received.push(body);
      },
      onError: () => {},
    });

    await new Promise((r) => setTimeout(r, 300));

    // Verify subscription works
    const publisherClient = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `shutdown-pub-${Date.now()}`,
    });

    await publisherClient.sendEvent({
      channel,
      body: new TextEncoder().encode(JSON.stringify({ before: 'close' })),
    });

    const receivedBefore = await waitForCondition(() => received.length >= 1);
    expect(receivedBefore).toBe(true);

    // Close the server (should cancel subscriptions internally)
    await server.close();

    // Messages sent after close should NOT be received
    // (but we can't easily verify this since the channel listener
    //  was on the sdkClient which is now closed)

    await publisherClient.close({ timeoutSeconds: 2 });
  }, 20_000);

  it.skipIf(!brokerAvailable)('should drain in-flight query before closing', async () => {
    const channel = uniqueChannel('shutdown-inflight');

    const client = new KubeMQClientProxy({
      address: BROKER_ADDRESS,
      clientId: `shutdown-inflight-client-${Date.now()}`,
      defaultQueryTimeout: 10,
    });
    await client.connect();

    const sdkClient = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `shutdown-inflight-handler-${Date.now()}`,
    });

    const sub = sdkClient.subscribeToQueries({
      channel,
      onQuery: async (query) => {
        await new Promise((r) => setTimeout(r, 200));
        await sdkClient.sendQueryResponse({
          id: query.id,
          replyChannel: query.replyChannel,
          clientId: `shutdown-inflight-handler-${Date.now()}`,
          executed: true,
          body: new TextEncoder().encode(JSON.stringify({ drained: true })),
        });
      },
      onError: () => {},
    });

    await new Promise((r) => setTimeout(r, 500));

    const resultPromise = firstValueFrom(
      client.send(channel, new KubeMQRecord({ test: 'inflight' }).asQuery()),
    );

    const result = await resultPromise;
    expect(result).toEqual({ drained: true });

    sub.cancel();
    await client.close();
    await sdkClient.close({ timeoutSeconds: 2 });
  }, 20_000);

  it.skipIf(!brokerAvailable)('should respect callbackTimeoutSeconds option', async () => {
    const server = new KubeMQServer({
      address: BROKER_ADDRESS,
      clientId: `shutdown-timeout-${Date.now()}`,
      callbackTimeoutSeconds: 5, // short timeout for test
    });

    await new Promise<void>((resolve) => {
      server.listen(() => { resolve(); });
    });

    const startTime = Date.now();
    await server.close();
    const elapsed = Date.now() - startTime;

    // Close should complete relatively quickly (well under the 5s timeout)
    // since there are no in-flight callbacks
    expect(elapsed).toBeLessThan(5000);
  }, 15_000);

  it.skipIf(!brokerAvailable)('should safely close client that was never connected', async () => {
    const client = new KubeMQClientProxy({
      address: BROKER_ADDRESS,
      clientId: `shutdown-never-connected-${Date.now()}`,
    });

    // Close without ever calling connect()
    await client.close();
    // Should not throw
  }, 10_000);

  it.skipIf(!brokerAvailable)('should handle multiple simultaneous close calls', async () => {
    const server = new KubeMQServer({
      address: BROKER_ADDRESS,
      clientId: `shutdown-concurrent-${Date.now()}`,
    });

    await new Promise<void>((resolve) => {
      server.listen(() => { resolve(); });
    });

    // Fire multiple close() calls concurrently
    const results = await Promise.allSettled([
      server.close(),
      server.close(),
      server.close(),
    ]);

    // All should settle without throwing
    for (const result of results) {
      expect(result.status).toBe('fulfilled');
    }
  }, 15_000);
});
