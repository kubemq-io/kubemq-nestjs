/**
 * Integration tests: Queue handler ack/nack/reQueue
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
    const c = await KubeMQClient.create({ address: BROKER_ADDRESS, clientId: 'ping-check-queue' });
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

describe('Queues integration', () => {
  let client: KubeMQClientProxy;

  beforeAll(async () => {
    if (!brokerAvailable) return;

    client = new KubeMQClientProxy({
      address: BROKER_ADDRESS,
      clientId: `test-client-queue-${Date.now()}`,
    });

    await client.connect();
  }, 30_000);

  afterAll(async () => {
    if (!brokerAvailable) return;
    try {
      await client?.close();
    } catch { /* ignore */ }
  }, 15_000);

  it.skipIf(!brokerAvailable)('should send and receive queue message with auto-ack', async () => {
    const channel = uniqueChannel('queue-basic');
    const payload = { task: 'process-order', orderId: 'ORD-001' };

    // Set up queue consumer using raw kubemq-js
    const sdkClient = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `queue-consumer-${Date.now()}`,
    });

    const receivedMessages: any[] = [];

    const stream = sdkClient.streamQueueMessages({
      channel,
      autoAck: true,
      maxMessages: 1,
      waitTimeoutSeconds: 10,
    });

    stream.onMessages(async (messages) => {
      for (const msg of messages) {
        const body = JSON.parse(new TextDecoder().decode(msg.body));
        receivedMessages.push(body);
      }
    });

    stream.onError((err) => {
      console.error('Queue stream error:', err);
    });

    await new Promise((r) => setTimeout(r, 500));

    // Send queue message via KubeMQClientProxy
    const result = await firstValueFrom(
      client.emit(channel, new KubeMQRecord(payload).asQueue()),
    );

    expect(result).toBeDefined();

    const received = await waitForCondition(() => receivedMessages.length >= 1, 10_000);

    expect(received).toBe(true);
    expect(receivedMessages[0]).toEqual(payload);

    stream.close();
    await sdkClient.close({ timeoutSeconds: 2 });
  }, 20_000);

  it.skipIf(!brokerAvailable)('should send queue message with manual ack and nack', async () => {
    const channel = uniqueChannel('queue-manual');
    const payload = { task: 'manual-ack-test' };

    const sdkClient = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `queue-manual-consumer-${Date.now()}`,
    });

    const receivedMessages: any[] = [];
    const ackedIds: string[] = [];

    const stream = sdkClient.streamQueueMessages({
      channel,
      autoAck: false,
      maxMessages: 1,
      waitTimeoutSeconds: 10,
    });

    stream.onMessages(async (messages) => {
      for (const msg of messages) {
        const body = JSON.parse(new TextDecoder().decode(msg.body));
        receivedMessages.push(body);
        // Manually ack the message
        msg.ack();
        ackedIds.push(msg.id);
      }
    });

    stream.onError(() => {});

    await new Promise((r) => setTimeout(r, 500));

    // Send message
    await firstValueFrom(
      client.emit(channel, new KubeMQRecord(payload).asQueue()),
    );

    const received = await waitForCondition(() => receivedMessages.length >= 1, 10_000);

    expect(received).toBe(true);
    expect(receivedMessages[0]).toEqual(payload);
    expect(ackedIds.length).toBe(1);

    stream.close();
    await sdkClient.close({ timeoutSeconds: 2 });
  }, 20_000);

  it.skipIf(!brokerAvailable)('should re-queue message to another channel', async () => {
    const sourceChannel = uniqueChannel('queue-reroute-src');
    const targetChannel = uniqueChannel('queue-reroute-dst');
    const payload = { task: 'rerouted-task' };

    const sdkClient = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `queue-reroute-${Date.now()}`,
    });

    // Consumer on source channel that re-queues to target
    const stream1 = sdkClient.streamQueueMessages({
      channel: sourceChannel,
      autoAck: false,
      maxMessages: 1,
      waitTimeoutSeconds: 10,
    });

    stream1.onMessages(async (messages) => {
      for (const msg of messages) {
        msg.reQueue(targetChannel);
      }
    });
    stream1.onError(() => {});

    // Consumer on target channel
    const reroutedMessages: any[] = [];
    const stream2 = sdkClient.streamQueueMessages({
      channel: targetChannel,
      autoAck: true,
      maxMessages: 1,
      waitTimeoutSeconds: 10,
    });

    stream2.onMessages(async (messages) => {
      for (const msg of messages) {
        const body = JSON.parse(new TextDecoder().decode(msg.body));
        reroutedMessages.push(body);
      }
    });
    stream2.onError(() => {});

    await new Promise((r) => setTimeout(r, 500));

    // Send to source channel
    await firstValueFrom(
      client.emit(sourceChannel, new KubeMQRecord(payload).asQueue()),
    );

    const received = await waitForCondition(() => reroutedMessages.length >= 1, 10_000);

    expect(received).toBe(true);
    expect(reroutedMessages[0]).toEqual(payload);

    stream1.close();
    stream2.close();
    await sdkClient.close({ timeoutSeconds: 2 });
  }, 25_000);

  it.skipIf(!brokerAvailable)('should send queue message with policy (expiration)', async () => {
    const channel = uniqueChannel('queue-policy');
    const payload = { task: 'expiring-task' };

    // Send with a short expiration policy
    const record = new KubeMQRecord(payload)
      .asQueue()
      .withMetadata({ policy: { expirationSeconds: 60 } });

    const result = await firstValueFrom(client.emit(channel, record));
    expect(result).toBeDefined();

    // Verify the message can be consumed
    const sdkClient = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `queue-policy-consumer-${Date.now()}`,
    });

    const received: any[] = [];
    const stream = sdkClient.streamQueueMessages({
      channel,
      autoAck: true,
      maxMessages: 1,
      waitTimeoutSeconds: 5,
    });

    stream.onMessages(async (messages) => {
      for (const msg of messages) {
        const body = JSON.parse(new TextDecoder().decode(msg.body));
        received.push(body);
      }
    });
    stream.onError(() => {});

    const consumed = await waitForCondition(() => received.length >= 1, 8000);

    expect(consumed).toBe(true);
    expect(received[0]).toEqual(payload);

    stream.close();
    await sdkClient.close({ timeoutSeconds: 2 });
  }, 20_000);
});
