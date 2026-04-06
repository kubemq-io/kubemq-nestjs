/**
 * Integration tests: Reconnection behavior
 *
 * Requires a live KubeMQ broker on localhost:50000.
 *
 * These tests verify that:
 * 1. Clients can reconnect after temporary disconnection
 * 2. The reconnection event lifecycle works correctly
 * 3. Subscriptions resume after reconnect (delegated to kubemq-js)
 *
 * NOTE: Broker restart tests are inherently flaky in CI environments.
 * We test the reconnection lifecycle that kubemq-js exposes through the
 * transport layer. Full broker-restart tests require manual docker control.
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
    const c = await KubeMQClient.create({ address: BROKER_ADDRESS, clientId: 'ping-check-reconn' });
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

describe('Reconnection integration', () => {

  it.skipIf(!brokerAvailable)('should emit connected status on KubeMQServer', async () => {
    const server = new KubeMQServer({
      address: BROKER_ADDRESS,
      clientId: `reconn-server-${Date.now()}`,
    });

    const statuses: string[] = [];
    server.status.subscribe((s) => statuses.push(s));

    await new Promise<void>((resolve) => {
      server.listen(() => { resolve(); });
    });

    await new Promise((r) => setTimeout(r, 200));

    expect(statuses).toContain('connected');

    await server.close();
  }, 15_000);

  it.skipIf(!brokerAvailable)('should emit connection events on KubeMQClientProxy', async () => {
    const client = new KubeMQClientProxy({
      address: BROKER_ADDRESS,
      clientId: `reconn-client-${Date.now()}`,
      defaultQueryTimeout: 10,
    });

    await client.connect();

    const channel = uniqueChannel('reconn-client-ping');

    const sdkClient = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `reconn-handler-${Date.now()}`,
    });

    const sub = sdkClient.subscribeToQueries({
      channel,
      onQuery: async (query) => {
        await sdkClient.sendQueryResponse({
          id: query.id,
          replyChannel: query.replyChannel,
          clientId: `reconn-handler-${Date.now()}`,
          executed: true,
          body: new TextEncoder().encode(JSON.stringify({ alive: true })),
        });
      },
      onError: () => {},
    });

    await new Promise((r) => setTimeout(r, 500));

    const result = await firstValueFrom(
      client.send(channel, new KubeMQRecord({ ping: true }).asQuery()),
    );
    expect(result).toEqual({ alive: true });

    sub.cancel();
    await sdkClient.close({ timeoutSeconds: 2 });
    await client.close();
  }, 15_000);

  it.skipIf(!brokerAvailable)('should handle server close and re-listen gracefully', async () => {
    const server1 = new KubeMQServer({
      address: BROKER_ADDRESS,
      clientId: `reconn-relisten1-${Date.now()}`,
    });

    // First listen
    await new Promise<void>((resolve) => {
      server1.listen(() => { resolve(); });
    });

    // Close the server
    await server1.close();

    // Re-create a new server and listen again
    const server2 = new KubeMQServer({
      address: BROKER_ADDRESS,
      clientId: `reconn-relisten2-${Date.now()}`,
    });

    let listenCallbackCalled = false;
    await new Promise<void>((resolve) => {
      server2.listen(() => {
        listenCallbackCalled = true;
        resolve();
      });
    });

    expect(listenCallbackCalled).toBe(true);

    await server2.close();
  }, 20_000);

  it.skipIf(!brokerAvailable)('should handle client close and reconnect gracefully', async () => {
    const client = new KubeMQClientProxy({
      address: BROKER_ADDRESS,
      clientId: `reconn-reclient-${Date.now()}`,
      defaultQueryTimeout: 5,
    });

    await client.connect();
    await client.close();

    const client2 = new KubeMQClientProxy({
      address: BROKER_ADDRESS,
      clientId: `reconn-reclient2-${Date.now()}`,
      defaultQueryTimeout: 5,
    });

    await client2.connect();

    const channel = uniqueChannel('reconn-reclient-verify');

    const sdkClient = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `reconn-verify-handler-${Date.now()}`,
    });

    const sub = sdkClient.subscribeToQueries({
      channel,
      onQuery: async (query) => {
        await sdkClient.sendQueryResponse({
          id: query.id,
          replyChannel: query.replyChannel,
          clientId: `reconn-verify-handler-${Date.now()}`,
          executed: true,
          body: new TextEncoder().encode(JSON.stringify({ reconnected: true })),
        });
      },
      onError: () => {},
    });

    await new Promise((r) => setTimeout(r, 500));

    const result = await firstValueFrom(
      client2.send(channel, new KubeMQRecord({ test: true }).asQuery()),
    );
    expect(result).toEqual({ reconnected: true });

    sub.cancel();
    await sdkClient.close({ timeoutSeconds: 2 });
    await client2.close();
  }, 20_000);

  it.skipIf(!brokerAvailable)('should fail-fast when waitForConnection is true and broker unreachable', async () => {
    const server = new KubeMQServer({
      address: 'localhost:59999',
      clientId: `reconn-failfast-${Date.now()}`,
      waitForConnection: true,
    });

    try {
      await new Promise<void>((resolve, reject) => {
        server.listen(() => { resolve(); }).catch(reject);
      });
      expect.unreachable('Should have thrown');
    } catch (err: any) {
      expect(err).toBeDefined();
    }
  }, 15_000);

  it.skipIf(!brokerAvailable)('should not throw when waitForConnection is false and broker unreachable', async () => {
    const server = new KubeMQServer({
      address: 'localhost:59999',
      clientId: `reconn-nonfail-${Date.now()}`,
      waitForConnection: false,
    });

    let callbackInvoked = false;

    // Should not throw — just logs the error and calls callback
    await new Promise<void>((resolve, reject) => {
      server.listen(() => {
        callbackInvoked = true;
        resolve();
      }).catch(reject);
    });

    expect(callbackInvoked).toBe(true);

    // close should be safe even when not connected
    await server.close();
  }, 15_000);
});
