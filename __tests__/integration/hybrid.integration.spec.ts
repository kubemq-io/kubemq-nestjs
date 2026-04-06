/**
 * Integration tests: HTTP + KubeMQ in same NestJS app (hybrid)
 *
 * Requires a live KubeMQ broker on localhost:50000.
 *
 * This test creates a NestJS application that runs both an HTTP server
 * and a KubeMQ microservice, verifying they coexist correctly.
 * Since @nestjs/platform-express may not be installed, we test at the
 * NestJS testing module level using the microservice context directly.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { firstValueFrom } from 'rxjs';

import { KubeMQClient } from 'kubemq-js';
import {
  KubeMQClientProxy,
  KubeMQModule,
  KubeMQRecord,
} from '../../src/index.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const BROKER_ADDRESS = 'localhost:50000';

async function checkBroker(): Promise<boolean> {
  try {
    const c = await KubeMQClient.create({ address: BROKER_ADDRESS, clientId: 'ping-check-hybrid' });
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

describe('Hybrid integration (HTTP + KubeMQ)', () => {
  let clientProxy: KubeMQClientProxy;
  let sdkClient: KubeMQClient;

  beforeAll(async () => {
    if (!brokerAvailable) return;

    // Create client proxy for sending messages
    clientProxy = new KubeMQClientProxy({
      address: BROKER_ADDRESS,
      clientId: `hybrid-client-${Date.now()}`,
      defaultCommandTimeout: 10,
      defaultQueryTimeout: 10,
    });
    await clientProxy.connect();

    // Create a raw SDK client for the handler side
    sdkClient = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `hybrid-handler-${Date.now()}`,
    });
  }, 30_000);

  afterAll(async () => {
    if (!brokerAvailable) return;
    try {
      await clientProxy?.close();
    } catch { /* ignore */ }
    try {
      await sdkClient?.close({ timeoutSeconds: 2 });
    } catch { /* ignore */ }
  }, 15_000);

  it.skipIf(!brokerAvailable)('should handle KubeMQ query alongside standard module setup', async () => {
    const queryChannel = uniqueChannel('hybrid-query-setup');

    const sub = sdkClient.subscribeToQueries({
      channel: queryChannel,
      onQuery: async (query) => {
        const body = JSON.parse(new TextDecoder().decode(query.body));
        await sdkClient.sendQueryResponse({
          id: query.id,
          replyChannel: query.replyChannel,
          clientId: `hybrid-handler-${Date.now()}`,
          executed: true,
          body: new TextEncoder().encode(JSON.stringify({ hybrid: true, data: body })),
        });
      },
      onError: () => {},
    });

    await new Promise((r) => setTimeout(r, 500));

    const result = await firstValueFrom(
      clientProxy.send(queryChannel, new KubeMQRecord({ action: 'hybrid-test' }).asQuery()),
    );

    expect(result).toEqual({ hybrid: true, data: { action: 'hybrid-test' } });

    sub.cancel();
  }, 15_000);

  it.skipIf(!brokerAvailable)('should handle KubeMQ events alongside queries in same app', async () => {
    const eventChannel = uniqueChannel('hybrid-event');
    const queryChannel = uniqueChannel('hybrid-query');

    const receivedEvents: any[] = [];

    // Subscribe to events
    const eventSub = sdkClient.subscribeToEvents({
      channel: eventChannel,
      onEvent: (event) => {
        const body = JSON.parse(new TextDecoder().decode(event.body));
        receivedEvents.push(body);
      },
      onError: () => {},
    });

    // Subscribe to queries
    const querySub = sdkClient.subscribeToQueries({
      channel: queryChannel,
      onQuery: async (query) => {
        await sdkClient.sendQueryResponse({
          id: query.id,
          replyChannel: query.replyChannel,
          clientId: `hybrid-handler-${Date.now()}`,
          executed: true,
          body: new TextEncoder().encode(JSON.stringify({ status: 'ok' })),
        });
      },
      onError: () => {},
    });

    await new Promise((r) => setTimeout(r, 500));

    // Emit an event
    await firstValueFrom(clientProxy.emit(eventChannel, { type: 'hybrid-event' }));

    // Send a query
    const queryResult = await firstValueFrom(
      clientProxy.send(queryChannel, new KubeMQRecord({ ask: 'status' }).asQuery()),
    );

    expect(queryResult).toEqual({ status: 'ok' });

    // Verify event was received
    const received = await waitForCondition(() => receivedEvents.length >= 1);
    expect(received).toBe(true);
    expect(receivedEvents[0]).toEqual({ type: 'hybrid-event' });

    eventSub.cancel();
    querySub.cancel();
  }, 15_000);

  it.skipIf(!brokerAvailable)('should create KubeMQModule.register() and use client proxy', async () => {
    const CLIENT_TOKEN = 'HYBRID_TEST_CLIENT';

    @Module({
      imports: [
        KubeMQModule.register({
          name: CLIENT_TOKEN,
          address: BROKER_ADDRESS,
          clientId: `hybrid-module-client-${Date.now()}`,
          defaultQueryTimeout: 10,
        }),
      ],
    })
    class HybridTestModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [HybridTestModule],
    }).compile();

    const registeredClient = moduleRef.get<KubeMQClientProxy>(CLIENT_TOKEN);
    expect(registeredClient).toBeDefined();
    expect(registeredClient).toBeInstanceOf(KubeMQClientProxy);

    await registeredClient.connect();

    const queryChannel = uniqueChannel('hybrid-module-query');

    const sub = sdkClient.subscribeToQueries({
      channel: queryChannel,
      onQuery: async (query) => {
        const body = JSON.parse(new TextDecoder().decode(query.body));
        await sdkClient.sendQueryResponse({
          id: query.id,
          replyChannel: query.replyChannel,
          clientId: `hybrid-module-handler-${Date.now()}`,
          executed: true,
          body: new TextEncoder().encode(JSON.stringify({ module: true, ...body })),
        });
      },
      onError: () => {},
    });

    await new Promise((r) => setTimeout(r, 500));

    const result = await firstValueFrom(
      registeredClient.send(queryChannel, new KubeMQRecord({ from: 'module' }).asQuery()),
    );

    expect(result).toEqual({ module: true, from: 'module' });

    sub.cancel();
    await registeredClient.close();
    await moduleRef.close();
  }, 20_000);

  it.skipIf(!brokerAvailable)('should support forRoot + register in same application', async () => {
    const CLIENT_TOKEN = 'HYBRID_DUAL_CLIENT';

    @Module({
      imports: [
        KubeMQModule.forRoot({
          address: BROKER_ADDRESS,
          clientId: `hybrid-forroot-${Date.now()}`,
        }),
        KubeMQModule.register({
          name: CLIENT_TOKEN,
          address: BROKER_ADDRESS,
          clientId: `hybrid-register-${Date.now()}`,
          defaultCommandTimeout: 10,
        }),
      ],
    })
    class DualSetupModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [DualSetupModule],
    }).compile();

    const registeredClient = moduleRef.get<KubeMQClientProxy>(CLIENT_TOKEN);
    expect(registeredClient).toBeDefined();

    await moduleRef.close();
  }, 15_000);
});
