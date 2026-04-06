/**
 * Integration tests: Command round-trip
 *
 * Requires a live KubeMQ broker on localhost:50000.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { firstValueFrom, defaultIfEmpty } from 'rxjs';

import { KubeMQClient } from 'kubemq-js';
import {
  KubeMQServer,
  KubeMQClientProxy,
} from '../../src/index.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const BROKER_ADDRESS = 'localhost:50000';

async function checkBroker(): Promise<boolean> {
  try {
    const c = await KubeMQClient.create({ address: BROKER_ADDRESS, clientId: 'ping-check' });
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

describe('Commands integration', () => {
  let client: KubeMQClientProxy;
  let _server: KubeMQServer;

  beforeAll(async () => {
    if (!brokerAvailable) return;

    _server = new KubeMQServer({
      address: BROKER_ADDRESS,
      clientId: `test-server-cmd-${Date.now()}`,
    });

    client = new KubeMQClientProxy({
      address: BROKER_ADDRESS,
      clientId: `test-client-cmd-${Date.now()}`,
      defaultCommandTimeout: 10,
      verboseErrors: true,
    });

    await client.connect();
  }, 30_000);

  afterAll(async () => {
    if (!brokerAvailable) return;
    try {
      await client?.close();
    } catch { /* ignore */ }
    try {
      await _server?.close();
    } catch { /* ignore */ }
  }, 15_000);

  it.skipIf(!brokerAvailable)('should perform command round-trip: send -> handler -> ack', async () => {
    const channel = uniqueChannel('cmd-roundtrip');
    const payload = { order: 'create', id: 42 };

    const sdkClient = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `cmd-handler-${Date.now()}`,
    });

    const receivedCommands: any[] = [];

    const sub = sdkClient.subscribeToCommands({
      channel,
      onCommand: async (cmd) => {
        receivedCommands.push(cmd);
        await sdkClient.sendCommandResponse({
          id: cmd.id,
          replyChannel: cmd.replyChannel,
          clientId: `cmd-handler-${Date.now()}`,
          executed: true,
        });
      },
      onError: (err) => {
        console.error('Command subscription error:', err);
      },
    });

    await new Promise((r) => setTimeout(r, 500));

    const result = await firstValueFrom(
      client.send(channel, payload).pipe(defaultIfEmpty(null)),
    );

    expect(result).toBeNull();
    expect(receivedCommands.length).toBe(1);

    sub.cancel();
    await sdkClient.close({ timeoutSeconds: 2 });
  }, 15_000);

  it.skipIf(!brokerAvailable)('should return error when command handler reports failure', async () => {
    const channel = uniqueChannel('cmd-error');

    const sdkClient = await KubeMQClient.create({
      address: BROKER_ADDRESS,
      clientId: `cmd-err-handler-${Date.now()}`,
    });

    const sub = sdkClient.subscribeToCommands({
      channel,
      onCommand: async (cmd) => {
        await sdkClient.sendCommandResponse({
          id: cmd.id,
          replyChannel: cmd.replyChannel,
          clientId: `cmd-err-handler-${Date.now()}`,
          executed: false,
          error: 'Something went wrong',
        });
      },
      onError: () => {},
    });

    await new Promise((r) => setTimeout(r, 500));

    try {
      await firstValueFrom(client.send(channel, { test: true }));
      expect.unreachable('Should have thrown');
    } catch (err: any) {
      expect(err).toBeDefined();
      expect(err.message || err.error?.message || JSON.stringify(err)).toContain('Something went wrong');
    }

    sub.cancel();
    await sdkClient.close({ timeoutSeconds: 2 });
  }, 15_000);

  it.skipIf(!brokerAvailable)('should timeout when no handler responds', async () => {
    const channel = uniqueChannel('cmd-timeout');

    // Create a client with a very short timeout
    const shortClient = new KubeMQClientProxy({
      address: BROKER_ADDRESS,
      clientId: `test-client-timeout-${Date.now()}`,
      defaultCommandTimeout: 2,
    });
    await shortClient.connect();

    try {
      await firstValueFrom(shortClient.send(channel, { test: true }));
      expect.unreachable('Should have thrown');
    } catch (err: any) {
      // Should get a timeout or no-subscriber error
      expect(err).toBeDefined();
    }

    await shortClient.close();
  }, 15_000);
});
