import { describe, it, expect, beforeEach } from 'vitest';
import { KubeMQQueueBatchContext } from '../../../src/context/kubemq-queue-batch.context.js';
import { KubeMQQueueContext } from '../../../src/context/kubemq-queue.context.js';
import { MockKubeMQServer } from '../../../src/testing/mock-kubemq-server.js';

function makeQueueContext(
  channel: string,
  sequence: number,
  rawMessage: any = null,
): KubeMQQueueContext {
  return new KubeMQQueueContext([
    {
      channel,
      id: `msg-${sequence}`,
      timestamp: new Date(),
      tags: {},
      metadata: '',
      patternType: 'queue',
      sequence,
      receiveCount: 1,
      isReRouted: false,
      _rawMessage: rawMessage,
    },
  ]);
}

describe('KubeMQQueueBatchContext', () => {
  it('reports correct size', () => {
    const ctxs = [makeQueueContext('ch', 1), makeQueueContext('ch', 2), makeQueueContext('ch', 3)];
    const msgs = ctxs.map(() => ({ ack: () => {}, nack: () => {} }));
    const batch = new KubeMQQueueBatchContext(ctxs, msgs, true);

    expect(batch.size).toBe(3);
  });

  it('getContexts() returns all contexts', () => {
    const ctxs = [makeQueueContext('ch', 1), makeQueueContext('ch', 2)];
    const msgs = ctxs.map(() => ({ ack: () => {}, nack: () => {} }));
    const batch = new KubeMQQueueBatchContext(ctxs, msgs, true);

    expect(batch.getContexts()).toHaveLength(2);
    expect(batch.getContexts()).toBe(ctxs);
  });

  it('getContext(index) returns specific context', () => {
    const ctxs = [makeQueueContext('ch', 1), makeQueueContext('ch', 2)];
    const msgs = ctxs.map(() => ({ ack: () => {}, nack: () => {} }));
    const batch = new KubeMQQueueBatchContext(ctxs, msgs, true);

    expect(batch.getContext(0)).toBe(ctxs[0]);
    expect(batch.getContext(1)).toBe(ctxs[1]);
  });

  it('ackAll() calls ack on all messages in manual ack mode', () => {
    const ctxs = [makeQueueContext('ch', 1), makeQueueContext('ch', 2)];
    const ackFns = [{ ack: vi.fn(), nack: vi.fn() }, { ack: vi.fn(), nack: vi.fn() }];
    const batch = new KubeMQQueueBatchContext(ctxs, ackFns, true);

    batch.ackAll();

    expect(ackFns[0].ack).toHaveBeenCalledOnce();
    expect(ackFns[1].ack).toHaveBeenCalledOnce();
    expect(ackFns[0].nack).not.toHaveBeenCalled();
  });

  it('nackAll() calls nack on all messages in manual ack mode', () => {
    const ctxs = [makeQueueContext('ch', 1), makeQueueContext('ch', 2)];
    const nackFns = [{ ack: vi.fn(), nack: vi.fn() }, { ack: vi.fn(), nack: vi.fn() }];
    const batch = new KubeMQQueueBatchContext(ctxs, nackFns, true);

    batch.nackAll();

    expect(nackFns[0].nack).toHaveBeenCalledOnce();
    expect(nackFns[1].nack).toHaveBeenCalledOnce();
    expect(nackFns[0].ack).not.toHaveBeenCalled();
  });

  it('ackAll() throws when not in manual ack mode', () => {
    const ctxs = [makeQueueContext('ch', 1)];
    const msgs = [{ ack: vi.fn(), nack: vi.fn() }];
    const batch = new KubeMQQueueBatchContext(ctxs, msgs, false);

    expect(() => batch.ackAll()).toThrow('manual ack mode');
  });

  it('nackAll() throws when not in manual ack mode', () => {
    const ctxs = [makeQueueContext('ch', 1)];
    const msgs = [{ ack: vi.fn(), nack: vi.fn() }];
    const batch = new KubeMQQueueBatchContext(ctxs, msgs, false);

    expect(() => batch.nackAll()).toThrow('manual ack mode');
  });
});

import { vi } from 'vitest';

describe('MockKubeMQServer.dispatchQueueBatch()', () => {
  let server: MockKubeMQServer;

  beforeEach(() => {
    server = new MockKubeMQServer();
  });

  it('dispatches batch to handler and returns ack status', async () => {
    server.addHandler('orders.batch', async (payloads: unknown[], ctx: any) => {
      ctx.ackAll();
    });

    const result = await server.dispatchQueueBatch('orders.batch', [
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ]);

    expect(result.acked).toEqual([true, true, true]);
  });

  it('returns unacked state when no handler exists', async () => {
    const result = await server.dispatchQueueBatch('nonexistent', [{ id: 1 }]);
    expect(result.acked).toEqual([false]);
  });

  it('handler receives array of payloads', async () => {
    let receivedPayloads: unknown[] = [];

    server.addHandler('batch.test', async (payloads: unknown[]) => {
      receivedPayloads = payloads;
    });

    await server.dispatchQueueBatch('batch.test', ['a', 'b', 'c']);

    expect(receivedPayloads).toEqual(['a', 'b', 'c']);
  });

  it('handler receives KubeMQQueueBatchContext with correct size', async () => {
    let batchSize = 0;

    server.addHandler('batch.ctx', async (_payloads: unknown[], ctx: any) => {
      batchSize = ctx.size;
    });

    await server.dispatchQueueBatch('batch.ctx', [1, 2, 3, 4]);

    expect(batchSize).toBe(4);
  });
});
