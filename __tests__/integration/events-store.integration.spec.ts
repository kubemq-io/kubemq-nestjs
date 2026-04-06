/**
 * Integration tests: EventsStore handler with sequence, replay from first
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
    const c = await KubeMQClient.create({ address: BROKER_ADDRESS, clientId: 'ping-check-es' });
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

describe('EventsStore integration', () => {
  let client: KubeMQClientProxy;

  beforeAll(async () => {
    if (!brokerAvailable) return;

    client = new KubeMQClientProxy({
      address: BROKER_ADDRESS,
      clientId: `test-client-es-${Date.now()}`,
    });

    await client.connect();
  }, 30_000);

  afterAll(async () => {
    if (!brokerAvailable) return;
    try {
      await client?.close();
    } catch { /* ignore */ }
  }, 15_000);

  it.skipIf(!brokerAvailable)('should deliver event-store message to subscriber with sequence', async () => {
    const channel = uniqueChannel('es-basic');

    // Set up an events-store subscriber listening from "new" (startFrom: 1)
    const sdkClient = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `es-sub-${Date.now()}`,
    });

    const receivedEvents: Array<{ body: any; sequence: number }> = [];

    const sub = sdkClient.subscribeToEventsStore({
      channel,
      startFrom: 1, // StartFromNew
      onEvent: (event) => {
        const body = JSON.parse(new TextDecoder().decode(event.body));
        receivedEvents.push({ body, sequence: event.sequence });
      },
      onError: (err) => {
        console.error('EventStore subscription error:', err);
      },
    });

    await new Promise((r) => setTimeout(r, 500));

    // Emit events-store message via client
    await firstValueFrom(
      client.emit(channel, new KubeMQRecord({ event: 'created', id: 1 }).asEventStore()),
    );

    const received = await waitForCondition(() => receivedEvents.length >= 1);

    expect(received).toBe(true);
    expect(receivedEvents[0]!.body).toEqual({ event: 'created', id: 1 });
    expect(receivedEvents[0]!.sequence).toBeGreaterThan(0);

    sub.cancel();
    await sdkClient.close({ timeoutSeconds: 2 });
  }, 15_000);

  it.skipIf(!brokerAvailable)('should provide monotonically increasing sequence numbers', async () => {
    const channel = uniqueChannel('es-sequence');

    const sdkClient = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `es-seq-sub-${Date.now()}`,
    });

    const receivedEvents: Array<{ sequence: number }> = [];

    const sub = sdkClient.subscribeToEventsStore({
      channel,
      startFrom: 1, // StartFromNew
      onEvent: (event) => {
        receivedEvents.push({ sequence: event.sequence });
      },
      onError: () => {},
    });

    await new Promise((r) => setTimeout(r, 500));

    // Send 3 events
    for (let i = 0; i < 3; i++) {
      await firstValueFrom(
        client.emit(channel, new KubeMQRecord({ seq: i }).asEventStore()),
      );
    }

    const received = await waitForCondition(() => receivedEvents.length >= 3);

    expect(received).toBe(true);

    // Sequences should be monotonically increasing
    for (let i = 1; i < receivedEvents.length; i++) {
      expect(receivedEvents[i]!.sequence).toBeGreaterThan(receivedEvents[i - 1]!.sequence);
    }

    sub.cancel();
    await sdkClient.close({ timeoutSeconds: 2 });
  }, 15_000);

  it.skipIf(!brokerAvailable)('should replay from first when subscribing with startFrom: first', async () => {
    const channel = uniqueChannel('es-replay');

    // First, publish some events BEFORE subscribing
    const publisherClient = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `es-publisher-${Date.now()}`,
    });

    // We need a subscriber first to create the channel in KubeMQ for events-store
    const initSub = publisherClient.subscribeToEventsStore({
      channel,
      startFrom: 1, // StartFromNew
      onEvent: () => {},
      onError: () => {},
    });

    await new Promise((r) => setTimeout(r, 300));

    // Publish 3 events
    for (let i = 0; i < 3; i++) {
      await publisherClient.sendEventStore({
        channel,
        body: new TextEncoder().encode(JSON.stringify({ idx: i })),
      });
    }

    await new Promise((r) => setTimeout(r, 300));
    initSub.cancel();

    // Now subscribe from "first" (startFrom: 2 = StartFromFirst) — should replay all
    const receivedEvents: any[] = [];

    const replaySub = publisherClient.subscribeToEventsStore({
      channel,
      startFrom: 2, // StartFromFirst
      onEvent: (event) => {
        const body = JSON.parse(new TextDecoder().decode(event.body));
        receivedEvents.push(body);
      },
      onError: (err) => {
        console.error('Replay subscription error:', err);
      },
    });

    const received = await waitForCondition(() => receivedEvents.length >= 3, 5000);

    expect(received).toBe(true);
    expect(receivedEvents.length).toBeGreaterThanOrEqual(3);
    expect(receivedEvents[0]).toEqual({ idx: 0 });
    expect(receivedEvents[1]).toEqual({ idx: 1 });
    expect(receivedEvents[2]).toEqual({ idx: 2 });

    replaySub.cancel();
    await publisherClient.close({ timeoutSeconds: 2 });
  }, 20_000);

  it.skipIf(!brokerAvailable)('should replay from specific sequence number', async () => {
    const channel = uniqueChannel('es-replay-seq');

    const sdkClient = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `es-seqreplay-${Date.now()}`,
    });

    // Create channel with initial subscriber
    const sequences: number[] = [];
    const initSub = sdkClient.subscribeToEventsStore({
      channel,
      startFrom: 1, // StartFromNew
      onEvent: (event) => {
        sequences.push(event.sequence);
      },
      onError: () => {},
    });

    await new Promise((r) => setTimeout(r, 300));

    // Publish 5 events
    for (let i = 0; i < 5; i++) {
      await sdkClient.sendEventStore({
        channel,
        body: new TextEncoder().encode(JSON.stringify({ num: i })),
      });
    }

    await waitForCondition(() => sequences.length >= 5, 5000);
    initSub.cancel();

    // Subscribe from sequence 3 (startFrom: 4 = StartAtSequence)
    const thirdSeq = sequences[2]!;
    const replayed: Array<{ body: any; sequence: number }> = [];

    const replaySub = sdkClient.subscribeToEventsStore({
      channel,
      startFrom: 4, // StartAtSequence
      startValue: thirdSeq,
      onEvent: (event) => {
        const body = JSON.parse(new TextDecoder().decode(event.body));
        replayed.push({ body, sequence: event.sequence });
      },
      onError: () => {},
    });

    const received = await waitForCondition(() => replayed.length >= 3, 5000);

    expect(received).toBe(true);
    // Should get events starting from sequence 3
    expect(replayed[0]!.body.num).toBe(2);
    expect(replayed[0]!.sequence).toBe(thirdSeq);

    replaySub.cancel();
    await sdkClient.close({ timeoutSeconds: 2 });
  }, 20_000);
});
