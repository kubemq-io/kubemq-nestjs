import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DlqHandler } from '../../../src/server/dlq-handler.js';

describe('DlqHandler', () => {
  let emitEvent: ReturnType<typeof vi.fn>;
  let mockSendQueueMessage: ReturnType<typeof vi.fn>;
  let mockClient: { sendQueueMessage: ReturnType<typeof vi.fn> };
  let dlqHandler: DlqHandler;

  const baseParams = {
    sourceChannel: 'orders',
    dlqChannel: 'orders.dlq',
    patternType: 'queue',
    messageId: 'msg-1',
    body: new TextEncoder().encode('test'),
    metadata: 'test-meta',
    retryCount: 3,
    error: new Error('handler failure'),
  };

  beforeEach(() => {
    emitEvent = vi.fn();
    mockSendQueueMessage = vi.fn().mockResolvedValue(undefined);
    mockClient = { sendQueueMessage: mockSendQueueMessage };
    dlqHandler = new DlqHandler(
      () => mockClient as any,
      emitEvent,
    );
  });

  // DLQ-1: Queue handler fails, message routed to DLQ after maxRetries
  it('routes message to DLQ channel', async () => {
    await dlqHandler.routeToDlq(baseParams);

    expect(mockSendQueueMessage).toHaveBeenCalledTimes(1);
    const call = mockSendQueueMessage.mock.calls[0][0];
    expect(call.channel).toBe('orders.dlq');
    expect(call.body).toBe(baseParams.body);
    expect(call.tags['x-dlq-source-channel']).toBe('orders');
    expect(call.tags['x-dlq-retry-count']).toBe('3');
    expect(dlqHandler.dlqRoutedCount).toBe(1);
  });

  // DLQ-2: deadLetter event emitted on successful DLQ routing
  it('emits deadLetter event on successful routing', async () => {
    await dlqHandler.routeToDlq(baseParams);

    expect(emitEvent).toHaveBeenCalledWith('deadLetter', expect.objectContaining({
      channel: 'orders',
      dlqChannel: 'orders.dlq',
      messageId: 'msg-1',
      error: 'handler failure',
      retryCount: 3,
    }));
  });

  // DLQ-3: DLQ channel send fails, error logged, deadLetter event emitted with sendError
  it('emits deadLetter with sendError when DLQ send fails', async () => {
    mockSendQueueMessage.mockRejectedValue(new Error('connection lost'));

    await dlqHandler.routeToDlq(baseParams);

    expect(emitEvent).toHaveBeenCalledWith('deadLetter', expect.objectContaining({
      sendError: 'connection lost',
    }));
    expect(dlqHandler.dlqRoutedCount).toBe(0);
  });

  // DLQ-4: No client connected, emits deadLetter with sendError
  it('emits deadLetter with sendError when client is null', async () => {
    const disconnectedHandler = new DlqHandler(
      () => null,
      emitEvent,
    );

    await disconnectedHandler.routeToDlq(baseParams);

    expect(emitEvent).toHaveBeenCalledWith('deadLetter', expect.objectContaining({
      sendError: expect.stringContaining('not connected'),
    }));
  });

  // DLQ-5: Tags include source channel, pattern type, and failure reason
  it('includes diagnostic tags in DLQ message', async () => {
    await dlqHandler.routeToDlq(baseParams);

    const tags = mockSendQueueMessage.mock.calls[0][0].tags;
    expect(tags['x-dlq-source-channel']).toBe('orders');
    expect(tags['x-dlq-source-pattern-type']).toBe('queue');
    expect(tags['x-dlq-source-id']).toBe('msg-1');
    expect(tags['x-dlq-failure-reason']).toBe('handler failure');
    expect(tags['x-dlq-timestamp']).toBeDefined();
  });

  // DLQ-6: Command handler DLQ routing
  it('routes command handler failures to DLQ', async () => {
    await dlqHandler.routeToDlq({ ...baseParams, patternType: 'command' });

    const tags = mockSendQueueMessage.mock.calls[0][0].tags;
    expect(tags['x-dlq-source-pattern-type']).toBe('command');
  });

  // DLQ-7: Query handler DLQ routing
  it('routes query handler failures to DLQ', async () => {
    await dlqHandler.routeToDlq({ ...baseParams, patternType: 'query' });

    const tags = mockSendQueueMessage.mock.calls[0][0].tags;
    expect(tags['x-dlq-source-pattern-type']).toBe('query');
  });
});
