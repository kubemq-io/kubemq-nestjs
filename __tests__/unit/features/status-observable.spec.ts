import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firstValueFrom, take, toArray } from 'rxjs';

const { mockClient, mockSubscription, mockQueueStreamHandle } = vi.hoisted(() => {
  const mockSubscription = { cancel: vi.fn() };
  const mockQueueStreamHandle = {
    onMessages: vi.fn(),
    onError: vi.fn(),
    close: vi.fn(),
  };
  const mockClient = {
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
    constructor(opts: { message: string }) {
      super(opts.message);
    }
  },
}));

import { KubeMQServer } from '../../../src/server/kubemq.server.js';
import { KubeMQClientProxy } from '../../../src/client/kubemq-client.proxy.js';

describe('status Observable — KubeMQServer', () => {
  let server: KubeMQServer;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.subscribeToCommands.mockReturnValue(mockSubscription);
    mockClient.subscribeToQueries.mockReturnValue(mockSubscription);
    mockClient.subscribeToEvents.mockReturnValue(mockSubscription);
    mockClient.subscribeToEventsStore.mockReturnValue(mockSubscription);
    mockClient.streamQueueMessages.mockReturnValue(mockQueueStreamHandle);
    mockClient.close.mockResolvedValue(undefined);

    server = new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'test-server',
    });
  });

  it('emits "connected" after successful listen()', async () => {
    const callback = vi.fn();
    await server.listen(callback);

    const status = await firstValueFrom(server.status);
    expect(status).toBe('connected');
  });

  it('emits "closed" after close()', async () => {
    const callback = vi.fn();
    await server.listen(callback);

    await server.close();

    const status = await firstValueFrom(server.status);
    expect(status).toBe('closed');
  });

  it('emits status via setupConnectionListeners', async () => {
    const callback = vi.fn();
    await server.listen(callback);

    const onCalls = mockClient.on.mock.calls;
    const disconnectedCb = onCalls.find(([event]: any) => event === 'disconnected')?.[1];
    const reconnectingCb = onCalls.find(([event]: any) => event === 'reconnecting')?.[1];
    const reconnectedCb = onCalls.find(([event]: any) => event === 'reconnected')?.[1];

    expect(disconnectedCb).toBeDefined();
    expect(reconnectingCb).toBeDefined();
    expect(reconnectedCb).toBeDefined();

    const collected: string[] = [];
    const sub = server.status.subscribe((s) => collected.push(s));

    disconnectedCb!();
    reconnectingCb!();
    reconnectedCb!();

    expect(collected).toContain('disconnected');
    expect(collected).toContain('reconnecting');
    expect(collected).toContain('connected');

    sub.unsubscribe();
  });
});

describe('status Observable — KubeMQClientProxy', () => {
  let client: KubeMQClientProxy;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.close.mockResolvedValue(undefined);

    client = new KubeMQClientProxy({
      address: 'localhost:50000',
      clientId: 'test-client',
    });
  });

  it('emits "connected" after successful connect()', async () => {
    await client.connect();

    const status = await firstValueFrom(client.status);
    expect(status).toBe('connected');
  });

  it('emits "closed" after close()', async () => {
    await client.connect();
    await client.close();

    const status = await firstValueFrom(client.status);
    expect(status).toBe('closed');
  });

  it('emits status via connection event listeners', async () => {
    await client.connect();

    const onCalls = mockClient.on.mock.calls;
    const disconnectedCb = onCalls.find(([event]: any) => event === 'disconnected')?.[1];
    const reconnectingCb = onCalls.find(([event]: any) => event === 'reconnecting')?.[1];

    expect(disconnectedCb).toBeDefined();
    expect(reconnectingCb).toBeDefined();

    const collected: string[] = [];
    const sub = client.status.subscribe((s) => collected.push(s));

    disconnectedCb!();
    reconnectingCb!();

    expect(collected).toContain('disconnected');
    expect(collected).toContain('reconnecting');

    sub.unsubscribe();
  });
});
