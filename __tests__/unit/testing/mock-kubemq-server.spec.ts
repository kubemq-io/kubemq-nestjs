import { describe, it, expect, vi } from 'vitest';
import { MockKubeMQServer } from '../../../src/testing/mock-kubemq-server.js';

describe('MockKubeMQServer', () => {
  it('dispatchCommandWithTags invokes handler and passes tags in context', async () => {
    const server = new MockKubeMQServer();
    const handler = vi.fn().mockReturnValue({ ok: true });
    server.addHandler('orders.create', handler);

    const tags = { 'x-request-id': 'abc-123' };
    const result = await server.dispatchCommandWithTags('orders.create', { amount: 100 }, tags);

    expect(result.executed).toBe(true);
    expect(handler).toHaveBeenCalled();
    const ctx = handler.mock.calls[0][1];
    expect(ctx.tags).toEqual(tags);
  });

  it('dispatchCommandWithTags with no handler returns error', async () => {
    const server = new MockKubeMQServer();
    const result = await server.dispatchCommandWithTags('missing', {});
    expect(result.executed).toBe(false);
    expect(result.error).toContain('No handler');
  });

  it('dispatchEventWithTags invokes handler with tags', async () => {
    const server = new MockKubeMQServer();
    const handler = vi.fn();
    server.addHandler('events.notify', handler);

    const tags = { 'x-source': 'test' };
    await server.dispatchEventWithTags('events.notify', { msg: 'hello' }, tags);

    expect(handler).toHaveBeenCalledWith({ msg: 'hello' }, { tags });
  });

  it('dispatchEventWithTags throws for unregistered pattern', async () => {
    const server = new MockKubeMQServer();
    await expect(server.dispatchEventWithTags('missing.pattern', {}, {})).rejects.toThrow(
      'No handler registered for "missing.pattern"',
    );
  });

  it('dispatchQueueMessageWithRetry returns acked on success', async () => {
    const server = new MockKubeMQServer();
    server.addHandler('queue.process', vi.fn());

    const result = await server.dispatchQueueMessageWithRetry('queue.process', { data: 1 }, 1);
    expect(result.acked).toBe(true);
  });

  it('dispatchQueueMessageWithRetry returns dlqRouted when receiveCount >= 3', async () => {
    const server = new MockKubeMQServer();
    server.addHandler('queue.fail', vi.fn().mockRejectedValue(new Error('boom')));

    const result = await server.dispatchQueueMessageWithRetry('queue.fail', {}, 3);
    expect(result.acked).toBe(false);
    expect(result.dlqRouted).toBe(true);
  });

  it('dispatchQueueMessageWithRetry returns no dlqRouted when receiveCount < 3', async () => {
    const server = new MockKubeMQServer();
    server.addHandler('queue.fail', vi.fn().mockRejectedValue(new Error('boom')));

    const result = await server.dispatchQueueMessageWithRetry('queue.fail', {}, 1);
    expect(result.acked).toBe(false);
    expect(result.dlqRouted).toBe(false);
  });

  it('dispatchQueueMessageWithRetry throws for unregistered pattern', async () => {
    const server = new MockKubeMQServer();
    await expect(
      server.dispatchQueueMessageWithRetry('missing', {}, 1),
    ).rejects.toThrow('No handler registered');
  });

  it('dispatchQueueMessageWithIdempotencyKey returns acked on success', async () => {
    const server = new MockKubeMQServer();
    server.addHandler('queue.dedup', vi.fn());

    const result = await server.dispatchQueueMessageWithIdempotencyKey(
      'queue.dedup',
      { data: 1 },
      'key-123',
    );
    expect(result.acked).toBe(true);
    expect(result.deduplicated).toBe(false);
  });

  it('dispatchQueueMessageWithIdempotencyKey returns not acked on failure', async () => {
    const server = new MockKubeMQServer();
    server.addHandler('queue.dedup-fail', vi.fn().mockRejectedValue(new Error('fail')));

    const result = await server.dispatchQueueMessageWithIdempotencyKey(
      'queue.dedup-fail',
      {},
      'key-456',
    );
    expect(result.acked).toBe(false);
    expect(result.deduplicated).toBe(false);
  });

  it('dispatchQueueMessageWithIdempotencyKey throws for unregistered pattern', async () => {
    const server = new MockKubeMQServer();
    await expect(
      server.dispatchQueueMessageWithIdempotencyKey('missing', {}, 'key'),
    ).rejects.toThrow('No handler registered');
  });

  it('dispatchQueueMessage reQueue callback sets reQueued', async () => {
    const server = new MockKubeMQServer();
    server.addHandler('queue.reroute', (_data: unknown, ctx: any) => {
      ctx.reQueue('dlq-channel');
    });

    const result = await server.dispatchQueueMessage('queue.reroute', { data: 1 });
    expect(result.reQueued).toBe('dlq-channel');
    expect(result.acked).toBe(false);
  });

  it('reset clears all handlers', async () => {
    const server = new MockKubeMQServer();
    server.addHandler('test.one', vi.fn().mockReturnValue('ok'));
    server.addHandler('test.two', vi.fn().mockReturnValue('ok'));

    server.reset();

    const result = await server.dispatchCommand('test.one', {});
    expect(result.executed).toBe(false);
    expect(result.error).toContain('No handler');
  });

  it('handler error returns error result for commands', async () => {
    const server = new MockKubeMQServer();
    server.addHandler('cmd.fail', () => {
      throw new Error('handler exploded');
    });

    const result = await server.dispatchCommand('cmd.fail', {});
    expect(result.executed).toBe(false);
    expect(result.error).toContain('handler exploded');
  });

  it('handler error returns error result for queries', async () => {
    const server = new MockKubeMQServer();
    server.addHandler('query.fail', () => {
      throw new Error('query error');
    });

    const result = await server.dispatchQuery('query.fail', {});
    expect(result.executed).toBe(false);
    expect(result.error).toContain('query error');
  });
});
