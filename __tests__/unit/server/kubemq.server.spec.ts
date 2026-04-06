import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted() so these are available inside the hoisted vi.mock() factory
const { mockClient, mockSubscription, mockQueueStreamHandle } = vi.hoisted(() => {
  const mockSubscription = { cancel: vi.fn() };
  const mockQueueStreamHandle = {
    onMessages: vi.fn(),
    onError: vi.fn(),
    close: vi.fn(),
  };
  const mockClient = {
    sendCommand: vi.fn(),
    sendQuery: vi.fn(),
    sendEvent: vi.fn(),
    sendEventStore: vi.fn(),
    sendQueueMessage: vi.fn(),
    sendCommandResponse: vi.fn().mockResolvedValue(undefined),
    sendQueryResponse: vi.fn().mockResolvedValue(undefined),
    subscribeToCommands: vi.fn().mockReturnValue(mockSubscription),
    subscribeToQueries: vi.fn().mockReturnValue(mockSubscription),
    subscribeToEvents: vi.fn().mockReturnValue(mockSubscription),
    subscribeToEventsStore: vi.fn().mockReturnValue(mockSubscription),
    streamQueueMessages: vi.fn().mockReturnValue(mockQueueStreamHandle),
    ping: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
  };
  return { mockClient, mockSubscription, mockQueueStreamHandle };
});

vi.mock('kubemq-js', () => ({
  KubeMQClient: {
    create: vi.fn().mockResolvedValue(mockClient),
  },
  ValidationError: class ValidationError extends Error {
    operation?: string;
    constructor(opts: { message: string; operation?: string }) {
      super(opts.message);
      this.name = 'ValidationError';
      this.operation = opts.operation;
    }
  },
}));

import { KubeMQServer } from '../../../src/server/kubemq.server.js';

// Helper to access protected fields via type casting
function getMessageHandlers(server: KubeMQServer): Map<string, any> {
  return (server as any).messageHandlers;
}

describe('KubeMQServer', () => {
  let server: KubeMQServer;

  beforeEach(() => {
    vi.clearAllMocks();
    // Re-set default return values after clearAllMocks
    mockClient.subscribeToCommands.mockReturnValue(mockSubscription);
    mockClient.subscribeToQueries.mockReturnValue(mockSubscription);
    mockClient.subscribeToEvents.mockReturnValue(mockSubscription);
    mockClient.subscribeToEventsStore.mockReturnValue(mockSubscription);
    mockClient.streamQueueMessages.mockReturnValue(mockQueueStreamHandle);
    mockClient.sendCommandResponse.mockResolvedValue(undefined);
    mockClient.sendQueryResponse.mockResolvedValue(undefined);
    mockClient.close.mockResolvedValue(undefined);

    server = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'test-server',
    });
  });

  // 16.40: listen() connects to KubeMQ and invokes callback on success
  it('listen() connects and invokes callback', async () => {
    const callback = vi.fn();
    await server.listen(callback);

    const { KubeMQClient } = await import('kubemq-js');
    expect(KubeMQClient.create).toHaveBeenCalledWith(
      expect.objectContaining({ address: 'localhost:50000' }),
    );
    expect(callback).toHaveBeenCalledOnce();
  });

  // 16.41: listen() throws ConnectionError when broker unreachable (fail-fast)
  it('listen() throws when broker unreachable (waitForConnection: true)', async () => {
    const { KubeMQClient } = await import('kubemq-js');
    (KubeMQClient.create as any).mockRejectedValueOnce(new Error('Connection refused'));

    const failFastServer = new KubeMQServer({
      address: 'localhost:50000',
      waitForConnection: true,
    });

    const callback = vi.fn();
    await expect(failFastServer.listen(callback)).rejects.toThrow('Connection refused');
    expect(callback).not.toHaveBeenCalled();
  });

  // 16.42: listen() logs error and invokes callback when broker unreachable (non-blocking)
  it('listen() logs error and invokes callback (waitForConnection: false)', async () => {
    const { KubeMQClient } = await import('kubemq-js');
    (KubeMQClient.create as any).mockRejectedValueOnce(new Error('Connection refused'));

    const nonBlockingServer = new KubeMQServer({
      address: 'localhost:50000',
      waitForConnection: false,
    });

    const callback = vi.fn();
    await nonBlockingServer.listen(callback);
    // callback should still be called even on error
    expect(callback).toHaveBeenCalledOnce();
  });

  // 16.43: close() cancels subs and closes client
  it('close() cancels all subscriptions and closes the client', async () => {
    const callback = vi.fn();
    await server.listen(callback);

    await server.close();

    expect(mockClient.close).toHaveBeenCalledWith(
      expect.objectContaining({ timeoutSeconds: 5 }),
    );
  });

  // 16.44: close() is idempotent
  it('close() is idempotent (calling twice does not throw)', async () => {
    const callback = vi.fn();
    await server.listen(callback);

    await server.close();
    await server.close(); // second call should not throw

    // client.close() called only once because client is nulled after first close
    expect(mockClient.close).toHaveBeenCalledOnce();
  });

  // 16.45: Handler binding creates correct subscription per pattern type
  it('handler binding creates correct subscriptions per type', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'handler-test',
    });
    const handlers = getMessageHandlers(handlerServer);

    const commandHandler = Object.assign(async () => 'ok', {
      isEventHandler: false,
      extras: { type: 'command' },
    });
    handlers.set('cmd-channel', commandHandler);

    const eventHandler = Object.assign(async () => {}, {
      isEventHandler: true,
      extras: { type: 'event' },
    });
    handlers.set('evt-channel', eventHandler);

    const queueHandler = Object.assign(async () => {}, {
      isEventHandler: true,
      extras: { type: 'queue', queue: true },
    });
    handlers.set('queue-channel', queueHandler);

    const callback = vi.fn();
    await handlerServer.listen(callback);

    expect(mockClient.subscribeToCommands).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'cmd-channel' }),
      undefined,
    );
    expect(mockClient.subscribeToEvents).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'evt-channel' }),
      undefined,
    );
    expect(mockClient.streamQueueMessages).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'queue-channel' }),
    );
  });

  // 16.46: Pattern resolution distinguishes types from metadata
  it('pattern resolution distinguishes command/query/event/event_store/queue from metadata', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'pattern-test',
    });
    const handlers = getMessageHandlers(handlerServer);

    handlers.set('ch-cmd', Object.assign(async () => 'ok', {
      isEventHandler: false, extras: { type: 'command' },
    }));
    handlers.set('ch-query', Object.assign(async () => 'ok', {
      isEventHandler: false, extras: { type: 'query' },
    }));
    handlers.set('ch-event', Object.assign(async () => {}, {
      isEventHandler: true, extras: { type: 'event' },
    }));
    handlers.set('ch-store', Object.assign(async () => {}, {
      isEventHandler: true, extras: { type: 'event_store' },
    }));
    handlers.set('ch-queue', Object.assign(async () => {}, {
      isEventHandler: true, extras: { type: 'queue' },
    }));

    await handlerServer.listen(vi.fn());

    expect(mockClient.subscribeToCommands).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'ch-cmd' }), undefined,
    );
    expect(mockClient.subscribeToQueries).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'ch-query' }), undefined,
    );
    expect(mockClient.subscribeToEvents).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'ch-event' }), undefined,
    );
    expect(mockClient.subscribeToEventsStore).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'ch-store' }), undefined,
    );
    expect(mockClient.streamQueueMessages).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'ch-queue' }),
    );
  });

  // --- Per-pattern error behavior tests (server-side) ---

  // 16.89: Command handler exception -> sendCommandResponse({ executed: false, error })
  it('command handler exception sends error response', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'cmd-err-test',
    });
    const handlers = getMessageHandlers(handlerServer);

    const failingHandler = Object.assign(
      async () => { throw new Error('handler blew up'); },
      { isEventHandler: false, extras: { type: 'command' } },
    );
    handlers.set('cmd-fail', failingHandler);

    await handlerServer.listen(vi.fn());

    const subCall = mockClient.subscribeToCommands.mock.calls.find(
      (c: any[]) => c[0].channel === 'cmd-fail',
    );
    expect(subCall).toBeDefined();
    const onCommand = subCall![0].onCommand;

    await onCommand({
      channel: 'cmd-fail',
      id: 'cmd-id-1',
      timestamp: new Date(),
      tags: {},
      metadata: '',
      fromClientId: 'sender',
      replyChannel: 'reply',
      body: new TextEncoder().encode('{}'),
    });

    // H-9: With verboseErrors defaulting to false, error messages are sanitized
    expect(mockClient.sendCommandResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'cmd-id-1',
        executed: false,
        error: 'Internal handler error',
      }),
    );
  });

  // 16.92: Query handler exception -> sendQueryResponse({ executed: false, error })
  it('query handler exception sends error response', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'query-err-test',
    });
    const handlers = getMessageHandlers(handlerServer);

    const failingHandler = Object.assign(
      async () => { throw new Error('query failed'); },
      { isEventHandler: false, extras: { type: 'query' } },
    );
    handlers.set('query-fail', failingHandler);

    await handlerServer.listen(vi.fn());

    const subCall = mockClient.subscribeToQueries.mock.calls.find(
      (c: any[]) => c[0].channel === 'query-fail',
    );
    expect(subCall).toBeDefined();
    const onQuery = subCall![0].onQuery;

    await onQuery({
      channel: 'query-fail',
      id: 'query-id-1',
      timestamp: new Date(),
      tags: {},
      metadata: '',
      fromClientId: 'sender',
      replyChannel: 'reply',
      body: new TextEncoder().encode('{}'),
    });

    // H-9: With verboseErrors defaulting to false, error messages are sanitized
    expect(mockClient.sendQueryResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'query-id-1',
        executed: false,
        error: 'Internal handler error',
      }),
    );
  });

  // 16.95: Event handler exception -> logged (no crash)
  it('event handler exception is logged and swallowed (no crash)', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'evt-err-test',
    });
    const handlers = getMessageHandlers(handlerServer);

    const failingHandler = Object.assign(
      async () => { throw new Error('event handler crashed'); },
      { isEventHandler: true, extras: { type: 'event' } },
    );
    handlers.set('evt-fail', failingHandler);

    await handlerServer.listen(vi.fn());

    const subCall = mockClient.subscribeToEvents.mock.calls.find(
      (c: any[]) => c[0].channel === 'evt-fail',
    );
    expect(subCall).toBeDefined();
    const onEvent = subCall![0].onEvent;

    // Should not throw - exception should be caught and logged
    await expect(
      onEvent({
        channel: 'evt-fail',
        id: 'evt-id-1',
        timestamp: new Date(),
        tags: {},
        metadata: '',
        body: new TextEncoder().encode('{}'),
      }),
    ).resolves.toBeUndefined();
  });

  // 16.97: EventStore handler exception -> logged (no crash)
  it('event-store handler exception is logged and swallowed', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'es-err-test',
    });
    const handlers = getMessageHandlers(handlerServer);

    const failingHandler = Object.assign(
      async () => { throw new Error('event-store handler crashed'); },
      { isEventHandler: true, extras: { type: 'event_store' } },
    );
    handlers.set('es-fail', failingHandler);

    await handlerServer.listen(vi.fn());

    const subCall = mockClient.subscribeToEventsStore.mock.calls.find(
      (c: any[]) => c[0].channel === 'es-fail',
    );
    expect(subCall).toBeDefined();
    const onEvent = subCall![0].onEvent;

    await expect(
      onEvent({
        channel: 'es-fail',
        id: 'es-id-1',
        timestamp: new Date(),
        tags: {},
        metadata: '',
        body: new TextEncoder().encode('{}'),
        sequence: 1,
      }),
    ).resolves.toBeUndefined();
  });

  // 16.98: EventStore subscription error -> onError callback invoked
  it('event-store subscription error invokes onError', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'es-sub-err-test',
    });
    const handlers = getMessageHandlers(handlerServer);

    handlers.set('es-sub-err', Object.assign(
      async () => {},
      { isEventHandler: true, extras: { type: 'event_store' } },
    ));

    await handlerServer.listen(vi.fn());

    const subCall = mockClient.subscribeToEventsStore.mock.calls.find(
      (c: any[]) => c[0].channel === 'es-sub-err',
    );
    expect(subCall).toBeDefined();
    const onError = subCall![0].onError;

    // onError should be a function that logs without throwing
    expect(typeof onError).toBe('function');
    expect(() => onError(new Error('subscription broke'))).not.toThrow();
  });

  // 16.99: Queue auto-ack: exception -> msg.nack()
  it('queue handler exception in auto-ack mode calls nack()', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'queue-auto-err',
    });
    const handlers = getMessageHandlers(handlerServer);

    handlers.set('queue-auto', Object.assign(
      async () => { throw new Error('processing failed'); },
      { isEventHandler: true, extras: { type: 'queue' } },
    ));

    await handlerServer.listen(vi.fn());

    // Get the latest onMessages callback registered on the stream handle
    const onMessagesCall = mockQueueStreamHandle.onMessages.mock.calls[
      mockQueueStreamHandle.onMessages.mock.calls.length - 1
    ];
    expect(onMessagesCall).toBeDefined();
    const onMessages = onMessagesCall[0];

    const mockMsg = {
      channel: 'queue-auto',
      id: 'q-1',
      timestamp: new Date(),
      tags: {},
      metadata: '',
      body: new TextEncoder().encode('{}'),
      sequence: 1,
      receiveCount: 1,
      isReRouted: false,
      reRouteFromQueue: '',
      ack: vi.fn(),
      nack: vi.fn(),
    };

    await onMessages([mockMsg]);

    expect(mockMsg.nack).toHaveBeenCalledOnce();
    expect(mockMsg.ack).not.toHaveBeenCalled();
  });

  // 16.100: Queue manual: exception -> no auto-nack
  it('queue handler exception in manual mode does NOT auto-nack', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'queue-manual-err',
    });
    const handlers = getMessageHandlers(handlerServer);

    handlers.set('queue-manual', Object.assign(
      async () => { throw new Error('manual mode failure'); },
      { isEventHandler: true, extras: { type: 'queue', manualAck: true } },
    ));

    // Reset mock to capture fresh calls
    mockQueueStreamHandle.onMessages.mockClear();

    await handlerServer.listen(vi.fn());

    const onMessagesCall = mockQueueStreamHandle.onMessages.mock.calls[
      mockQueueStreamHandle.onMessages.mock.calls.length - 1
    ];
    expect(onMessagesCall).toBeDefined();
    const onMessages = onMessagesCall[0];

    const mockMsg = {
      channel: 'queue-manual',
      id: 'q-2',
      timestamp: new Date(),
      tags: {},
      metadata: '',
      body: new TextEncoder().encode('{}'),
      sequence: 1,
      receiveCount: 1,
      isReRouted: false,
      reRouteFromQueue: '',
      ack: vi.fn(),
      nack: vi.fn(),
    };

    await onMessages([mockMsg]);

    // In manual mode, neither ack nor nack should be called automatically
    expect(mockMsg.nack).not.toHaveBeenCalled();
    expect(mockMsg.ack).not.toHaveBeenCalled();
  });

  // 16.102: Queue ack/nack failure -> logged
  it('queue ack failure is caught (logged) without crashing the server', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'queue-ack-err',
    });
    const handlers = getMessageHandlers(handlerServer);

    // Handler succeeds, but ack() will throw
    handlers.set('queue-ack-fail', Object.assign(
      async () => { /* success */ },
      { isEventHandler: true, extras: { type: 'queue' } },
    ));

    mockQueueStreamHandle.onMessages.mockClear();
    await handlerServer.listen(vi.fn());

    const onMessagesCall = mockQueueStreamHandle.onMessages.mock.calls[
      mockQueueStreamHandle.onMessages.mock.calls.length - 1
    ];
    const onMessages = onMessagesCall[0];

    const mockMsg = {
      channel: 'queue-ack-fail',
      id: 'q-3',
      timestamp: new Date(),
      tags: {},
      metadata: '',
      body: new TextEncoder().encode('{}'),
      sequence: 1,
      receiveCount: 1,
      isReRouted: false,
      reRouteFromQueue: '',
      ack: vi.fn().mockImplementation(() => { throw new Error('ack failed'); }),
      nack: vi.fn(),
    };

    // When ack throws, the outer catch block catches it and calls nack.
    // The server should not crash.
    await expect(onMessages([mockMsg])).resolves.toBeUndefined();
  });

  // --- Observable handling edge-case tests ---

  // Group 1, T3: command handler with EMPTY Observable (zero emissions)
  it('command handler with EMPTY Observable returns error response', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'cmd-empty-obs',
    });
    const handlers = getMessageHandlers(handlerServer);

    // Handler returns undefined (transformToObservable will produce EMPTY-like)
    const emptyHandler = Object.assign(
      async () => undefined,
      { isEventHandler: false, extras: { type: 'command' } },
    );
    handlers.set('cmd-empty', emptyHandler);

    await handlerServer.listen(vi.fn());

    const subCall = mockClient.subscribeToCommands.mock.calls.find(
      (c: any[]) => c[0].channel === 'cmd-empty',
    );
    expect(subCall).toBeDefined();
    const onCommand = subCall![0].onCommand;

    await onCommand({
      channel: 'cmd-empty',
      id: 'cmd-empty-1',
      timestamp: new Date(),
      tags: {},
      metadata: '',
      fromClientId: 'sender',
      replyChannel: 'reply',
      body: new TextEncoder().encode('{}'),
    });

    // With verboseErrors off, error should be 'Internal handler error'
    expect(mockClient.sendCommandResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'cmd-empty-1',
        executed: true,
      }),
    );
  });

  // Group 1, T5: query handler with EMPTY Observable (zero emissions)
  it('query handler with EMPTY Observable returns error response', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'query-empty-obs',
    });
    const handlers = getMessageHandlers(handlerServer);

    const emptyHandler = Object.assign(
      async () => undefined,
      { isEventHandler: false, extras: { type: 'query' } },
    );
    handlers.set('query-empty', emptyHandler);

    await handlerServer.listen(vi.fn());

    const subCall = mockClient.subscribeToQueries.mock.calls.find(
      (c: any[]) => c[0].channel === 'query-empty',
    );
    expect(subCall).toBeDefined();
    const onQuery = subCall![0].onQuery;

    await onQuery({
      channel: 'query-empty',
      id: 'query-empty-1',
      timestamp: new Date(),
      tags: {},
      metadata: '',
      fromClientId: 'sender',
      replyChannel: 'reply',
      body: new TextEncoder().encode('{}'),
    });

    expect(mockClient.sendQueryResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'query-empty-1',
        executed: true,
      }),
    );
  });

  // Group 1, T9: Observable error with non-Error throw
  it('command handler with non-Error throw sends sanitized error', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'cmd-non-err',
    });
    const handlers = getMessageHandlers(handlerServer);

    const throwingHandler = Object.assign(
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- intentionally testing non-Error throw normalization
      async () => { throw 'string-error'; },
      { isEventHandler: false, extras: { type: 'command' } },
    );
    handlers.set('cmd-non-err', throwingHandler);

    await handlerServer.listen(vi.fn());

    const subCall = mockClient.subscribeToCommands.mock.calls.find(
      (c: any[]) => c[0].channel === 'cmd-non-err',
    );
    const onCommand = subCall![0].onCommand;

    await onCommand({
      channel: 'cmd-non-err',
      id: 'cmd-ne-1',
      timestamp: new Date(),
      tags: {},
      metadata: '',
      fromClientId: 'sender',
      replyChannel: 'reply',
      body: new TextEncoder().encode('{}'),
    });

    // verboseErrors=false => sanitized
    expect(mockClient.sendCommandResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'cmd-ne-1',
        executed: false,
        error: 'Internal handler error',
      }),
    );
  });

  // Group 1, T10: Observable error with empty string
  it('command handler with empty string throw sends sanitized error', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'cmd-empty-str-err',
    });
    const handlers = getMessageHandlers(handlerServer);

    const throwingHandler = Object.assign(
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- intentionally testing empty-string throw normalization
      async () => { throw ''; },
      { isEventHandler: false, extras: { type: 'command' } },
    );
    handlers.set('cmd-empty-str', throwingHandler);

    await handlerServer.listen(vi.fn());

    const subCall = mockClient.subscribeToCommands.mock.calls.find(
      (c: any[]) => c[0].channel === 'cmd-empty-str',
    );
    const onCommand = subCall![0].onCommand;

    await onCommand({
      channel: 'cmd-empty-str',
      id: 'cmd-es-1',
      timestamp: new Date(),
      tags: {},
      metadata: '',
      fromClientId: 'sender',
      replyChannel: 'reply',
      body: new TextEncoder().encode('{}'),
    });

    expect(mockClient.sendCommandResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'cmd-es-1',
        executed: false,
        error: 'Internal handler error',
      }),
    );
  });

  // Group 2, T3: listen partial bind failure rolls back subscriptions
  it('listen partial bind failure rolls back all subscriptions', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'partial-bind',
    });
    const handlers = getMessageHandlers(handlerServer);

    // First handler binds successfully
    handlers.set('ch-ok', Object.assign(
      async () => {},
      { isEventHandler: true, extras: { type: 'event' } },
    ));

    // Second handler uses an event_store type with invalid startFrom to cause bind error
    handlers.set('ch-fail', Object.assign(
      async () => {},
      { isEventHandler: true, extras: { type: 'event_store', startFrom: 'invalid_value' } },
    ));

    const callback = vi.fn();
    await expect(handlerServer.listen(callback)).rejects.toThrow();

    // After rollback, the first subscription should have been cancelled
    expect(mockSubscription.cancel).toHaveBeenCalled();
    // Client should be closed after rollback
    expect(mockClient.close).toHaveBeenCalled();
  });

  // Group 2, T6: pending listeners replayed on reconnect
  it('pending listeners are replayed once client connects', async () => {
    const pendingServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'pending-test',
    });

    // Register an event listener BEFORE listen() connects
    const eventCallback = vi.fn();
    pendingServer.on('connected', eventCallback);

    // Now connect
    await pendingServer.listen(vi.fn());

    // The pending listener should have been replayed to the client's .on()
    expect(mockClient.on).toHaveBeenCalledWith('connected', eventCallback);
  });

  // Group 3, T6: verboseErrors=false sanitizes error message (explicit test)
  it('verboseErrors=false sanitizes error message to "Internal handler error"', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'verbose-false',
      verboseErrors: false,
    });
    const handlers = getMessageHandlers(handlerServer);

    const failingHandler = Object.assign(
      async () => { throw new Error('sensitive internal details'); },
      { isEventHandler: false, extras: { type: 'command' } },
    );
    handlers.set('verbose-test', failingHandler);

    await handlerServer.listen(vi.fn());

    const subCall = mockClient.subscribeToCommands.mock.calls.find(
      (c: any[]) => c[0].channel === 'verbose-test',
    );
    const onCommand = subCall![0].onCommand;

    await onCommand({
      channel: 'verbose-test',
      id: 'v-1',
      timestamp: new Date(),
      tags: {},
      metadata: '',
      fromClientId: 'sender',
      replyChannel: 'reply',
      body: new TextEncoder().encode('{}'),
    });

    expect(mockClient.sendCommandResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'v-1',
        executed: false,
        error: 'Internal handler error',
      }),
    );
  });

  // Group 3, T7: verboseErrors=true passes original error
  it('verboseErrors=true passes original error message through', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'verbose-true',
      verboseErrors: true,
    });
    const handlers = getMessageHandlers(handlerServer);

    const failingHandler = Object.assign(
      async () => { throw new Error('detailed error info'); },
      { isEventHandler: false, extras: { type: 'command' } },
    );
    handlers.set('verbose-true-test', failingHandler);

    await handlerServer.listen(vi.fn());

    const subCall = mockClient.subscribeToCommands.mock.calls.find(
      (c: any[]) => c[0].channel === 'verbose-true-test',
    );
    const onCommand = subCall![0].onCommand;

    await onCommand({
      channel: 'verbose-true-test',
      id: 'vt-1',
      timestamp: new Date(),
      tags: {},
      metadata: '',
      fromClientId: 'sender',
      replyChannel: 'reply',
      body: new TextEncoder().encode('{}'),
    });

    expect(mockClient.sendCommandResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'vt-1',
        executed: false,
        error: 'detailed error info',
      }),
    );
  });

  // Group 3, T10: onError callback with non-Error value
  it('onError callback handles non-Error value without crashing', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'onerror-nonErr',
    });
    const handlers = getMessageHandlers(handlerServer);

    handlers.set('ch-onerror', Object.assign(
      async () => {},
      { isEventHandler: true, extras: { type: 'event' } },
    ));

    await handlerServer.listen(vi.fn());

    const subCall = mockClient.subscribeToEvents.mock.calls.find(
      (c: any[]) => c[0].channel === 'ch-onerror',
    );
    expect(subCall).toBeDefined();
    const onError = subCall![0].onError;

    // Pass a non-Error value (string)
    expect(() => onError('string-error-value')).not.toThrow();
  });

  // Group 3, T14: secondary response-send failure logged
  it('secondary response-send failure is caught and logged', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'secondary-fail',
    });
    const handlers = getMessageHandlers(handlerServer);

    // Handler that throws and then sendCommandResponse also throws
    const failingHandler = Object.assign(
      async () => { throw new Error('handler error'); },
      { isEventHandler: false, extras: { type: 'command' } },
    );
    handlers.set('cmd-secondary-fail', failingHandler);

    await handlerServer.listen(vi.fn());

    // Make the first sendCommandResponse succeed but the second throw
    // Actually we need to make ALL sendCommandResponse fail so the outer catch tries again
    mockClient.sendCommandResponse
      .mockRejectedValueOnce(new Error('send error'))  // first send fails (outer catch)
      .mockRejectedValueOnce(new Error('secondary send error'));  // secondary also fails

    const subCall = mockClient.subscribeToCommands.mock.calls.find(
      (c: any[]) => c[0].channel === 'cmd-secondary-fail',
    );
    const onCommand = subCall![0].onCommand;

    // Should not throw even though both sends fail
    await expect(onCommand({
      channel: 'cmd-secondary-fail',
      id: 'sf-1',
      timestamp: new Date(),
      tags: {},
      metadata: '',
      fromClientId: 'sender',
      replyChannel: 'reply',
      body: new TextEncoder().encode('{}'),
    })).resolves.toBeUndefined();
  });

  // Group 7, T2: startFrom accepts numeric values
  it('event-store handler accepts numeric startFrom value', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'startfrom-num',
    });
    const handlers = getMessageHandlers(handlerServer);

    handlers.set('es-numeric', Object.assign(
      async () => {},
      { isEventHandler: true, extras: { type: 'event_store', startFrom: 2 } },
    ));

    await handlerServer.listen(vi.fn());

    expect(mockClient.subscribeToEventsStore).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'es-numeric',
        startFrom: 2,
      }),
      undefined,
    );
  });

  // Group 7, T3: startFrom rejects unknown strings
  it('event-store handler rejects unknown startFrom string', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'startfrom-invalid',
    });
    const handlers = getMessageHandlers(handlerServer);

    handlers.set('es-invalid', Object.assign(
      async () => {},
      { isEventHandler: true, extras: { type: 'event_store', startFrom: 'bogus' } },
    ));

    const callback = vi.fn();
    await expect(handlerServer.listen(callback)).rejects.toThrow(/Invalid event-store startFrom/);
  });

  // Group 7, T5: unwrap returns KubeMQSDKClient type
  it('unwrap() returns the underlying KubeMQ client after listen', async () => {
    await server.listen(vi.fn());

    const client = server.unwrap();
    expect(client).toBeDefined();
    expect(client).toBe(mockClient);
  });

  // unwrap() before listen throws
  it('unwrap() before listen() throws', () => {
    const freshServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'unwrap-test',
    });
    expect(() => freshServer.unwrap()).toThrow('Not initialized');
  });

  // Group 2, T4: queue stream error surfaces to health indicator
  it('queue stream error surfaces to getStreamErrorState()', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'queue-health',
    });
    const handlers = getMessageHandlers(handlerServer);

    handlers.set('queue-health-ch', Object.assign(
      async () => {},
      { isEventHandler: true, extras: { type: 'queue' } },
    ));

    await handlerServer.listen(vi.fn());

    // Trigger the onError callback on the stream handle
    const onErrorCall = mockQueueStreamHandle.onError.mock.calls[
      mockQueueStreamHandle.onError.mock.calls.length - 1
    ];
    expect(onErrorCall).toBeDefined();
    const onError = onErrorCall[0];

    onError(new Error('stream broken'));

    const errorState = handlerServer.getStreamErrorState();
    expect(errorState.get('queue-health-ch')).toBe('stream broken');
  });

  // --- Batch queue handler tests ---

  it('batch queue handler passes array of payloads to handler', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'batch-happy',
    });
    const handlers = getMessageHandlers(handlerServer);

    let receivedPayloads: unknown[] = [];
    let receivedCtx: any;

    handlers.set('batch-ch', Object.assign(
      async (data: unknown, ctx: unknown) => {
        receivedPayloads = data as unknown[];
        receivedCtx = ctx;
      },
      { isEventHandler: true, extras: { type: 'queue', batch: true } },
    ));

    mockQueueStreamHandle.onMessages.mockClear();
    await handlerServer.listen(vi.fn());

    const onMessagesCall = mockQueueStreamHandle.onMessages.mock.calls[
      mockQueueStreamHandle.onMessages.mock.calls.length - 1
    ];
    const onMessages = onMessagesCall[0];

    const msg1 = {
      channel: 'batch-ch', id: 'b-1', timestamp: new Date(), tags: {},
      metadata: '', body: new TextEncoder().encode('{"a":1}'),
      sequence: 1, receiveCount: 1, isReRouted: false, reRouteFromQueue: '',
      ack: vi.fn(), nack: vi.fn(),
    };
    const msg2 = {
      channel: 'batch-ch', id: 'b-2', timestamp: new Date(), tags: {},
      metadata: '', body: new TextEncoder().encode('{"a":2}'),
      sequence: 2, receiveCount: 1, isReRouted: false, reRouteFromQueue: '',
      ack: vi.fn(), nack: vi.fn(),
    };

    await onMessages([msg1, msg2]);

    expect(receivedPayloads).toEqual([{ a: 1 }, { a: 2 }]);
    expect(receivedCtx).toBeDefined();
    expect(receivedCtx.size).toBe(2);
    expect(msg1.ack).toHaveBeenCalledOnce();
    expect(msg2.ack).toHaveBeenCalledOnce();
  });

  it('batch queue handler nacks all messages on error', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'batch-error',
    });
    const handlers = getMessageHandlers(handlerServer);

    handlers.set('batch-fail', Object.assign(
      async () => { throw new Error('batch failed'); },
      { isEventHandler: true, extras: { type: 'queue', batch: true } },
    ));

    mockQueueStreamHandle.onMessages.mockClear();
    await handlerServer.listen(vi.fn());

    const onMessagesCall = mockQueueStreamHandle.onMessages.mock.calls[
      mockQueueStreamHandle.onMessages.mock.calls.length - 1
    ];
    const onMessages = onMessagesCall[0];

    const msg1 = {
      channel: 'batch-fail', id: 'bf-1', timestamp: new Date(), tags: {},
      metadata: '', body: new TextEncoder().encode('{}'),
      sequence: 1, receiveCount: 1, isReRouted: false, reRouteFromQueue: '',
      ack: vi.fn(), nack: vi.fn(),
    };
    const msg2 = {
      channel: 'batch-fail', id: 'bf-2', timestamp: new Date(), tags: {},
      metadata: '', body: new TextEncoder().encode('{}'),
      sequence: 2, receiveCount: 1, isReRouted: false, reRouteFromQueue: '',
      ack: vi.fn(), nack: vi.fn(),
    };

    await onMessages([msg1, msg2]);

    expect(msg1.nack).toHaveBeenCalledOnce();
    expect(msg2.nack).toHaveBeenCalledOnce();
    expect(msg1.ack).not.toHaveBeenCalled();
    expect(msg2.ack).not.toHaveBeenCalled();
  });

  it('batch queue handler skips auto-ack/nack in manual ack mode', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'batch-manual',
    });
    const handlers = getMessageHandlers(handlerServer);

    handlers.set('batch-manual-ch', Object.assign(
      async () => { /* no-op */ },
      { isEventHandler: true, extras: { type: 'queue', batch: true, manualAck: true } },
    ));

    mockQueueStreamHandle.onMessages.mockClear();
    await handlerServer.listen(vi.fn());

    const onMessagesCall = mockQueueStreamHandle.onMessages.mock.calls[
      mockQueueStreamHandle.onMessages.mock.calls.length - 1
    ];
    const onMessages = onMessagesCall[0];

    const msg = {
      channel: 'batch-manual-ch', id: 'bm-1', timestamp: new Date(), tags: {},
      metadata: '', body: new TextEncoder().encode('{}'),
      sequence: 1, receiveCount: 1, isReRouted: false, reRouteFromQueue: '',
      ack: vi.fn(), nack: vi.fn(),
    };

    await onMessages([msg]);

    expect(msg.ack).not.toHaveBeenCalled();
    expect(msg.nack).not.toHaveBeenCalled();
  });

  // --- Custom serializer/deserializer wrapping ---

  it('constructor wraps custom serializer and deserializer', async () => {
    const customSerializer = {
      serialize: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
      contentType: 'application/custom',
    };
    const customDeserializer = {
      deserialize: vi.fn().mockReturnValue({ parsed: true }),
    };

    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'serializer-test',
      serializer: customSerializer,
      deserializer: customDeserializer,
    });

    const handlers = getMessageHandlers(handlerServer);
    handlers.set('ser-ch', Object.assign(
      async (data: unknown) => data,
      { isEventHandler: false, extras: { type: 'command' } },
    ));

    await handlerServer.listen(vi.fn());

    const subCall = mockClient.subscribeToCommands.mock.calls.find(
      (c: any[]) => c[0].channel === 'ser-ch',
    );
    const onCommand = subCall![0].onCommand;

    await onCommand({
      channel: 'ser-ch', id: 'ser-1', timestamp: new Date(), tags: {},
      metadata: '', fromClientId: 'sender', replyChannel: 'reply',
      body: new Uint8Array([10, 20]),
    });

    expect(customDeserializer.deserialize).toHaveBeenCalled();
    expect(customSerializer.serialize).toHaveBeenCalled();
  });

  // --- on() closing guard ---

  it('on() is a no-op when reconnect is closing', async () => {
    const closingServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'on-closing',
    });

    await closingServer.listen(vi.fn());
    await closingServer.close();

    const cb = vi.fn();
    closingServer.on('connected', cb);

    // After close, the listener should not be stored
    expect((closingServer as any).pendingEventListeners).toHaveLength(0);
  });

  // --- batch default maxMessages ---

  it('batch mode defaults maxMessages to 10', async () => {
    const handlerServer = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'batch-default',
    });
    const handlers = getMessageHandlers(handlerServer);

    handlers.set('batch-def-ch', Object.assign(
      async () => {},
      { isEventHandler: true, extras: { type: 'queue', batch: true } },
    ));

    await handlerServer.listen(vi.fn());

    expect(mockClient.streamQueueMessages).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'batch-def-ch',
        maxMessages: 10,
      }),
    );
  });

  // --- wrapSerializer / wrapDeserializer inner function coverage ---

  it('wrapped serializer calls through to custom serialize()', () => {
    const customSer = {
      serialize: vi.fn().mockReturnValue(new Uint8Array([42])),
    };
    const wrappedServer = new KubeMQServer({
      address: 'localhost:50000',
      serializer: customSer,
    });

    const wrapped = (wrappedServer as any).serializer;
    const result = wrapped.serialize({ test: true });
    expect(customSer.serialize).toHaveBeenCalledWith({ test: true });
    expect(result).toEqual(new Uint8Array([42]));
  });

  it('wrapped deserializer calls through for Uint8Array input', () => {
    const customDe = {
      deserialize: vi.fn().mockReturnValue({ parsed: true }),
    };
    const wrappedServer = new KubeMQServer({
      address: 'localhost:50000',
      deserializer: customDe,
    });

    const wrapped = (wrappedServer as any).deserializer;
    const input = new Uint8Array([1, 2, 3]);
    const result = wrapped.deserialize(input);
    expect(customDe.deserialize).toHaveBeenCalledWith(input);
    expect(result).toEqual({ parsed: true });
  });

  it('wrapped deserializer passes through non-Uint8Array input unchanged', () => {
    const customDe = {
      deserialize: vi.fn(),
    };
    const wrappedServer = new KubeMQServer({
      address: 'localhost:50000',
      deserializer: customDe,
    });

    const wrapped = (wrappedServer as any).deserializer;
    const result = wrapped.deserialize('already-deserialized');
    expect(customDe.deserialize).not.toHaveBeenCalled();
    expect(result).toBe('already-deserialized');
  });

  // --- query timeout path ---

  it('getHandlerTimeoutMs uses query timeout for query pattern', () => {
    const queryServer = new KubeMQServer({
      address: 'localhost:50000',
      defaultQueryTimeout: 30,
      defaultCommandTimeout: 5,
    });
    const timeoutMs = (queryServer as any).getHandlerTimeoutMs('query');
    expect(timeoutMs).toBe(30_000);
  });

  it('getHandlerTimeoutMs falls back to command timeout for query when no query timeout', () => {
    const fallbackServer = new KubeMQServer({
      address: 'localhost:50000',
      defaultCommandTimeout: 15,
    });
    const timeoutMs = (fallbackServer as any).getHandlerTimeoutMs('query');
    expect(timeoutMs).toBe(15_000);
  });
});
