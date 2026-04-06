/**
 * Integration tests: Event handler receives, multiple subscribers
 *
 * Requires a live KubeMQ broker on localhost:50000.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { firstValueFrom } from 'rxjs';

import { KubeMQClient } from 'kubemq-js';
import {
  KubeMQClientProxy,
} from '../../src/index.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const BROKER_ADDRESS = 'localhost:50000';

async function checkBroker(): Promise<boolean> {
  try {
    const c = await KubeMQClient.create({ address: BROKER_ADDRESS, clientId: 'ping-check-ev' });
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

describe('Events integration', () => {
  let client: KubeMQClientProxy;

  beforeAll(async () => {
    if (!brokerAvailable) return;

    client = new KubeMQClientProxy({
      address: BROKER_ADDRESS,
      clientId: `test-client-event-${Date.now()}`,
    });

    await client.connect();
  }, 30_000);

  afterAll(async () => {
    if (!brokerAvailable) return;
    try {
      await client?.close();
    } catch { /* ignore */ }
  }, 15_000);

  it.skipIf(!brokerAvailable)('should deliver event to subscriber', async () => {
    const channel = uniqueChannel('event-basic');
    const payload = { action: 'user.login', userId: 'u-100' };

    // Set up event subscriber using raw kubemq-js
    const sdkClient = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `event-sub-${Date.now()}`,
    });

    const receivedEvents: any[] = [];

    const sub = sdkClient.subscribeToEvents({
      channel,
      onEvent: (event) => {
        const body = JSON.parse(new TextDecoder().decode(event.body));
        receivedEvents.push(body);
      },
      onError: (err) => {
        console.error('Event subscription error:', err);
      },
    });

    // Give subscription time to establish
    await new Promise((r) => setTimeout(r, 500));

    // Emit event via KubeMQClientProxy
    await firstValueFrom(client.emit(channel, payload));

    // Wait for event delivery
    const received = await waitForCondition(() => receivedEvents.length >= 1);

    expect(received).toBe(true);
    expect(receivedEvents[0]).toEqual(payload);

    sub.cancel();
    await sdkClient.close({ timeoutSeconds: 2 });
  }, 15_000);

  it.skipIf(!brokerAvailable)('should deliver event to multiple subscribers', async () => {
    const channel = uniqueChannel('event-multi');
    const payload = { action: 'broadcast', data: 'hello-all' };

    // Set up two subscribers
    const sdkClient1 = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `event-sub1-${Date.now()}`,
    });
    const sdkClient2 = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `event-sub2-${Date.now()}`,
    });

    const received1: any[] = [];
    const received2: any[] = [];

    const sub1 = sdkClient1.subscribeToEvents({
      channel,
      onEvent: (event) => {
        const body = JSON.parse(new TextDecoder().decode(event.body));
        received1.push(body);
      },
      onError: () => {},
    });

    const sub2 = sdkClient2.subscribeToEvents({
      channel,
      onEvent: (event) => {
        const body = JSON.parse(new TextDecoder().decode(event.body));
        received2.push(body);
      },
      onError: () => {},
    });

    await new Promise((r) => setTimeout(r, 500));

    // Emit event
    await firstValueFrom(client.emit(channel, payload));

    // Both subscribers should receive the event
    const bothReceived = await waitForCondition(
      () => received1.length >= 1 && received2.length >= 1,
    );

    expect(bothReceived).toBe(true);
    expect(received1[0]).toEqual(payload);
    expect(received2[0]).toEqual(payload);

    sub1.cancel();
    sub2.cancel();
    await sdkClient1.close({ timeoutSeconds: 2 });
    await sdkClient2.close({ timeoutSeconds: 2 });
  }, 15_000);

  it.skipIf(!brokerAvailable)('should deliver only to one subscriber in same group', async () => {
    const channel = uniqueChannel('event-group');
    const group = `group-${Date.now()}`;
    const payload = { action: 'grouped', seq: 1 };

    // Two subscribers in the same group
    const sdkClient1 = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `event-grp1-${Date.now()}`,
    });
    const sdkClient2 = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `event-grp2-${Date.now()}`,
    });

    const received1: any[] = [];
    const received2: any[] = [];

    const sub1 = sdkClient1.subscribeToEvents({
      channel,
      group,
      onEvent: (event) => {
        const body = JSON.parse(new TextDecoder().decode(event.body));
        received1.push(body);
      },
      onError: () => {},
    });

    const sub2 = sdkClient2.subscribeToEvents({
      channel,
      group,
      onEvent: (event) => {
        const body = JSON.parse(new TextDecoder().decode(event.body));
        received2.push(body);
      },
      onError: () => {},
    });

    await new Promise((r) => setTimeout(r, 500));

    // Emit several events to increase reliability of the test
    for (let i = 0; i < 5; i++) {
      await firstValueFrom(client.emit(channel, { ...payload, seq: i }));
    }

    // Wait for events to be received
    await waitForCondition(
      () => received1.length + received2.length >= 5,
      5000,
    );

    // In a consumer group, total should equal 5 (distributed between the two)
    const total = received1.length + received2.length;
    expect(total).toBe(5);

    sub1.cancel();
    sub2.cancel();
    await sdkClient1.close({ timeoutSeconds: 2 });
    await sdkClient2.close({ timeoutSeconds: 2 });
  }, 15_000);

  it.skipIf(!brokerAvailable)('should emit fire-and-forget without error even if no subscribers', async () => {
    const channel = uniqueChannel('event-nosub');

    // Should not throw — events are fire-and-forget
    await expect(
      firstValueFrom(client.emit(channel, { data: 'ignored' })),
    ).resolves.not.toThrow();
  }, 10_000);
});
