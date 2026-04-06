import { describe, it, expect, beforeEach } from 'vitest';
import { firstValueFrom, of, EMPTY } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { MockKubeMQClient } from '../../../src/testing/mock-kubemq-client.js';
import { MockKubeMQServer } from '../../../src/testing/mock-kubemq-server.js';

describe('MockKubeMQClient', () => {
  let mockClient: MockKubeMQClient;

  beforeEach(() => {
    mockClient = new MockKubeMQClient();
  });

  // 16.115: send() records call and returns pre-configured response
  it('send() records call and returns pre-configured response', async () => {
    const expectedResponse = { orderId: '123', status: 'created' };
    mockClient.setResponse('orders.create', expectedResponse);

    const result = await firstValueFrom(mockClient.send('orders.create', { name: 'test' }));

    expect(result).toEqual(expectedResponse);
    expect(mockClient.sendCalls).toHaveLength(1);
    expect(mockClient.sendCalls[0]).toEqual({
      pattern: 'orders.create',
      data: { name: 'test' },
    });
  });

  // 16.116: send() returns pre-configured error
  it('send() returns pre-configured error', async () => {
    const expectedError = new Error('command failed');
    mockClient.setError('orders.create', expectedError);

    await expect(
      firstValueFrom(mockClient.send('orders.create', { name: 'test' })),
    ).rejects.toThrow('command failed');

    expect(mockClient.sendCalls).toHaveLength(1);
  });

  // 16.117: emit() records call and completes
  it('emit() records call and completes', async () => {
    const _result = await firstValueFrom(mockClient.emit('orders.updated', { orderId: '123' }));

    expect(mockClient.emitCalls).toHaveLength(1);
    expect(mockClient.emitCalls[0]).toEqual({
      pattern: 'orders.updated',
      data: { orderId: '123' },
    });
  });

  // 16.118: reset() clears all recorded calls and responses
  it('reset() clears all recorded calls and responses', async () => {
    mockClient.setResponse('orders.create', { id: '1' });
    mockClient.setError('orders.delete', new Error('fail'));
    await firstValueFrom(mockClient.send('orders.create', {}));
    await firstValueFrom(mockClient.emit('orders.updated', {}));

    expect(mockClient.sendCalls).toHaveLength(1);
    expect(mockClient.emitCalls).toHaveLength(1);

    mockClient.reset();

    expect(mockClient.sendCalls).toHaveLength(0);
    expect(mockClient.emitCalls).toHaveLength(0);

    // After reset, response is cleared. ClientProxy.send() with undefined response
    // completes without emitting, so firstValueFrom throws EmptyError.
    // Verify by setting a new response and checking it works.
    mockClient.setResponse('orders.create', { id: '2' });
    const result = await firstValueFrom(mockClient.send('orders.create', {}));
    expect(result).toEqual({ id: '2' });
  });

  // Group 10, T1: MockKubeMQClient extends ClientProxy
  it('extends ClientProxy', () => {
    expect(mockClient).toBeInstanceOf(ClientProxy);
  });

  // Group 10, T2: MockKubeMQClient.close() is async
  it('close() returns a Promise', async () => {
    const result = mockClient.close();
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBeUndefined();
  });

  it('unwrap() returns an empty object', () => {
    const result = mockClient.unwrap();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });
});

describe('MockKubeMQServer', () => {
  let mockServer: MockKubeMQServer;

  beforeEach(() => {
    mockServer = new MockKubeMQServer();
  });

  // 16.119: dispatchCommand() invokes handler and returns response
  it('dispatchCommand() invokes handler and returns response', async () => {
    mockServer.addHandler('orders.create', async (data: unknown, ctx: unknown) => {
      expect((ctx as any).channel).toBe('orders.create');
      expect((ctx as any).patternType).toBe('command');
      return { orderId: '123', name: (data as any).name };
    });

    const result = await mockServer.dispatchCommand('orders.create', { name: 'test' });

    expect(result.executed).toBe(true);
    expect(result.response).toEqual({ orderId: '123', name: 'test' });
    expect(result.error).toBeUndefined();
  });

  // 16.120: dispatchQuery() invokes handler and returns response
  it('dispatchQuery() invokes handler and returns response', async () => {
    mockServer.addHandler('orders.get', async (data: unknown, ctx: unknown) => {
      expect((ctx as any).patternType).toBe('query');
      return { order: { id: (data as any).id, status: 'active' } };
    });

    const result = await mockServer.dispatchQuery('orders.get', { id: '456' });

    expect(result.executed).toBe(true);
    expect(result.response).toEqual({ order: { id: '456', status: 'active' } });
  });

  // 16.121: dispatchEvent() invokes handler
  it('dispatchEvent() invokes handler', async () => {
    let receivedData: unknown;
    mockServer.addHandler('orders.updated', async (data: unknown, ctx: unknown) => {
      receivedData = data;
      expect((ctx as any).patternType).toBe('event');
    });

    await mockServer.dispatchEvent('orders.updated', { orderId: '789' });
    expect(receivedData).toEqual({ orderId: '789' });
  });

  // 16.122: dispatchEventStore() provides sequence in context
  it('dispatchEventStore() provides sequence in context', async () => {
    let capturedSequence: number | undefined;
    mockServer.addHandler('orders.history', async (data: unknown, ctx: unknown) => {
      capturedSequence = (ctx as any).sequence;
      expect((ctx as any).patternType).toBe('event_store');
    });

    await mockServer.dispatchEventStore('orders.history', { event: 'created' }, 42);
    expect(capturedSequence).toBe(42);
  });

  // 16.123: dispatchQueueMessage() auto-acks on success, auto-nacks on error
  it('dispatchQueueMessage() auto-acks on success and auto-nacks on error', async () => {
    // Success case: auto-ack
    mockServer.addHandler('orders.process', async (_data: unknown) => {
      return { processed: true };
    });

    const successResult = await mockServer.dispatchQueueMessage('orders.process', { orderId: '1' });
    expect(successResult.acked).toBe(true);

    // Error case: auto-nack
    mockServer.addHandler('orders.process', async () => {
      throw new Error('processing failed');
    });

    const errorResult = await mockServer.dispatchQueueMessage('orders.process', { orderId: '2' });
    expect(errorResult.acked).toBe(false);
  });

  // Group 10, T3: MockKubeMQServer mirrors Observable execution
  it('mirrors Observable execution in dispatchCommand', async () => {
    // Handler returns an Observable via of()
    mockServer.addHandler('orders.create', (_data: unknown) => {
      return of({ orderId: 'obs-123' });
    });

    const result = await mockServer.dispatchCommand('orders.create', { name: 'test' });

    expect(result.executed).toBe(true);
    expect(result.response).toEqual({ orderId: 'obs-123' });
  });

  // Group 10, T4: MockKubeMQServer handles EMPTY Observable
  it('handles EMPTY Observable (no emission)', async () => {
    mockServer.addHandler('orders.create', (_data: unknown) => {
      return EMPTY;
    });

    const result = await mockServer.dispatchCommand('orders.create', { name: 'test' });

    expect(result.executed).toBe(false);
    expect(result.error).toBe('Handler completed without emitting a response');
  });

  it('dispatchCommand returns error for missing handler', async () => {
    const result = await mockServer.dispatchCommand('no.handler', {});
    expect(result.executed).toBe(false);
    expect(result.error).toContain('No handler for pattern');
  });

  it('dispatchEvent is no-op for missing handler', async () => {
    await expect(mockServer.dispatchEvent('no.handler', {})).resolves.toBeUndefined();
  });

  it('dispatchEventStore is no-op for missing handler', async () => {
    await expect(mockServer.dispatchEventStore('no.handler', {})).resolves.toBeUndefined();
  });

  it('dispatchQueueMessage returns acked:false for missing handler', async () => {
    const result = await mockServer.dispatchQueueMessage('no.handler', {});
    expect(result.acked).toBe(false);
  });

  it('dispatchQueueBatch returns unacked for missing handler', async () => {
    const result = await mockServer.dispatchQueueBatch('no.handler', [1, 2]);
    expect(result.acked).toEqual([false, false]);
  });

  it('dispatchQueueBatch handles handler error gracefully', async () => {
    mockServer.addHandler('batch.fail', async () => { throw new Error('boom'); });
    const result = await mockServer.dispatchQueueBatch('batch.fail', [1, 2]);
    expect(result.acked).toEqual([false, false]);
  });

  it('dispatchQueueMessage manual ack via context', async () => {
    mockServer.addHandler('q.manual', async (_data: unknown, ctx: any) => {
      ctx.ack();
    });

    const result = await mockServer.dispatchQueueMessage('q.manual', { id: 1 });
    expect(result.acked).toBe(true);
  });

  it('dispatchQueueMessage manual reQueue via context', async () => {
    mockServer.addHandler('q.reroute', async (_data: unknown, ctx: any) => {
      ctx.reQueue('dlq-channel');
    });

    const result = await mockServer.dispatchQueueMessage('q.reroute', {});
    expect(result.reQueued).toBe('dlq-channel');
  });
});
