import { describe, it, expect } from 'vitest';
import { KubeMQContext } from '../../../src/context/kubemq.context.js';
import { KubeMQCommandContext } from '../../../src/context/kubemq-command.context.js';
import { KubeMQQueryContext } from '../../../src/context/kubemq-query.context.js';
import { KubeMQRequestContext } from '../../../src/context/kubemq-request.context.js';
import { KubeMQEventStoreContext } from '../../../src/context/kubemq-event-store.context.js';
import { KubeMQQueueContext } from '../../../src/context/kubemq-queue.context.js';

describe('Context Hierarchy', () => {
  // 16.103: KubeMQContext provides all fields
  it('KubeMQContext provides channel, id, timestamp, tags, metadata, patternType', () => {
    const now = new Date();
    const ctx = new KubeMQContext([
      {
        channel: 'test-channel',
        id: 'msg-123',
        timestamp: now,
        tags: { key: 'value' },
        metadata: 'some-metadata',
        patternType: 'event',
      },
    ]);

    expect(ctx.channel).toBe('test-channel');
    expect(ctx.id).toBe('msg-123');
    expect(ctx.timestamp).toBe(now);
    expect(ctx.tags).toEqual({ key: 'value' });
    expect(ctx.metadata).toBe('some-metadata');
    expect(ctx.patternType).toBe('event');
  });

  // 16.104: KubeMQCommandContext provides fromClientId, replyChannel
  it('KubeMQCommandContext provides fromClientId and replyChannel', () => {
    const ctx = new KubeMQCommandContext([
      {
        channel: 'cmd-channel',
        id: 'cmd-1',
        timestamp: new Date(),
        tags: {},
        metadata: '',
        patternType: 'command',
        fromClientId: 'sender-client',
        replyChannel: 'reply-channel',
      },
    ]);

    expect(ctx.fromClientId).toBe('sender-client');
    expect(ctx.replyChannel).toBe('reply-channel');
    // Also verify base context fields are accessible
    expect(ctx.channel).toBe('cmd-channel');
    expect(ctx.patternType).toBe('command');
  });

  // 16.105: KubeMQQueryContext provides fromClientId, replyChannel
  it('KubeMQQueryContext provides fromClientId and replyChannel', () => {
    const ctx = new KubeMQQueryContext([
      {
        channel: 'query-channel',
        id: 'query-1',
        timestamp: new Date(),
        tags: {},
        metadata: '',
        patternType: 'query',
        fromClientId: 'query-sender',
        replyChannel: 'query-reply',
      },
    ]);

    expect(ctx.fromClientId).toBe('query-sender');
    expect(ctx.replyChannel).toBe('query-reply');
    expect(ctx.channel).toBe('query-channel');
    expect(ctx.patternType).toBe('query');
  });

  // 16.106: KubeMQEventStoreContext provides sequence
  it('KubeMQEventStoreContext provides sequence number', () => {
    const ctx = new KubeMQEventStoreContext([
      {
        channel: 'store-channel',
        id: 'es-1',
        timestamp: new Date(),
        tags: {},
        metadata: '',
        patternType: 'event_store',
        sequence: 42,
      },
    ]);

    expect(ctx.sequence).toBe(42);
    expect(ctx.channel).toBe('store-channel');
    expect(ctx.patternType).toBe('event_store');
  });

  // 16.107: KubeMQQueueContext provides ack/nack/reQueue, sequence, receiveCount, isReRouted
  it('KubeMQQueueContext provides ack(), nack(), reQueue(), sequence, receiveCount, isReRouted', () => {
    let acked = false;
    let nacked = false;
    let reQueuedTo: string | undefined;

    const mockMsg = {
      ack: () => { acked = true; },
      nack: () => { nacked = true; },
      reQueue: (ch: string) => { reQueuedTo = ch; },
    };

    const ctx = new KubeMQQueueContext([
      {
        channel: 'queue-channel',
        id: 'q-1',
        timestamp: new Date(),
        tags: {},
        metadata: '',
        patternType: 'queue',
        sequence: 7,
        receiveCount: 3,
        isReRouted: true,
        reRouteFromQueue: 'original-queue',
        _rawMessage: mockMsg,
      },
    ]);

    expect(ctx.sequence).toBe(7);
    expect(ctx.receiveCount).toBe(3);
    expect(ctx.isReRouted).toBe(true);
    expect(ctx.reRouteFromQueue).toBe('original-queue');

    // Test ack
    ctx.ack();
    expect(acked).toBe(true);

    // Test nack
    ctx.nack();
    expect(nacked).toBe(true);

    // Test reQueue
    ctx.reQueue('dlq-channel');
    expect(reQueuedTo).toBe('dlq-channel');
  });

  // Group 9, T2: sequence property exists on EventStoreContext
  it('EventStoreContext.sequence returns the sequence number', () => {
    const ctx = new KubeMQEventStoreContext([
      {
        channel: 'store-channel',
        id: 'es-seq',
        timestamp: new Date(),
        tags: {},
        metadata: '',
        patternType: 'event_store',
        sequence: 99,
      },
    ]);

    expect(ctx.sequence).toBe(99);
    expect(typeof ctx.sequence).toBe('number');
  });

  // Queue context error paths: ack/nack/reQueue throw when _rawMessage is null
  it('ack() throws when _rawMessage is null (auto-ack mode)', () => {
    const ctx = new KubeMQQueueContext([{
      channel: 'q', id: 'q-err', timestamp: new Date(), tags: {}, metadata: '',
      patternType: 'queue', sequence: 1, receiveCount: 1, isReRouted: false,
      _rawMessage: null,
    }]);
    expect(() => ctx.ack()).toThrow('manual ack mode');
  });

  it('nack() throws when _rawMessage is null (auto-ack mode)', () => {
    const ctx = new KubeMQQueueContext([{
      channel: 'q', id: 'q-err', timestamp: new Date(), tags: {}, metadata: '',
      patternType: 'queue', sequence: 1, receiveCount: 1, isReRouted: false,
      _rawMessage: null,
    }]);
    expect(() => ctx.nack()).toThrow('manual ack mode');
  });

  it('reQueue() throws when _rawMessage is null (auto-ack mode)', () => {
    const ctx = new KubeMQQueueContext([{
      channel: 'q', id: 'q-err', timestamp: new Date(), tags: {}, metadata: '',
      patternType: 'queue', sequence: 1, receiveCount: 1, isReRouted: false,
      _rawMessage: null,
    }]);
    expect(() => ctx.reQueue('dlq')).toThrow('manual ack mode');
  });

  // Verify KubeMQCommandContext and KubeMQQueryContext are re-exported from KubeMQRequestContext
  it('KubeMQCommandContext and KubeMQQueryContext are aliases for KubeMQRequestContext', () => {
    expect(KubeMQCommandContext).toBe(KubeMQRequestContext);
    expect(KubeMQQueryContext).toBe(KubeMQRequestContext);

    // Both should work identically
    const cmdCtx = new KubeMQCommandContext([
      {
        channel: 'cmd-ch',
        id: 'cmd-alias',
        timestamp: new Date(),
        tags: {},
        metadata: '',
        patternType: 'command',
        fromClientId: 'client-1',
        replyChannel: 'reply-1',
      },
    ]);
    expect(cmdCtx.fromClientId).toBe('client-1');
    expect(cmdCtx.replyChannel).toBe('reply-1');
  });
});
