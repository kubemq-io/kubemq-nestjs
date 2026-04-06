import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted so classes and mock are available inside hoisted vi.mock() factory
const {
  mockClient,
  KubeMQError,
  KubeMQTimeoutError,
  NotFoundError,
  TransientError,
  ConnectionError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  ConfigurationError,
  ThrottlingError,
  FatalError,
  CancellationError,
  BufferFullError,
  StreamBrokenError,
  ClientClosedError,
  ConnectionNotReadyError,
  RetryExhaustedError,
  NotImplementedError,
  PartialFailureError,
  HandlerError,
} = vi.hoisted(() => {
  class KubeMQError extends Error {
    code = '';
    category = '';
    channel?: string;
    constructor(msg: string) { super(msg); this.name = 'KubeMQError'; }
  }
  class KubeMQTimeoutError extends KubeMQError {
    constructor(msg = 'timeout') { super(msg); this.name = 'KubeMQTimeoutError'; this.code = 'TIMEOUT'; this.category = 'Timeout'; }
  }
  class NotFoundError extends KubeMQError {
    constructor(msg = 'not found') { super(msg); this.name = 'NotFoundError'; this.code = 'NOT_FOUND'; this.category = 'NotFound'; }
  }
  class TransientError extends KubeMQError {
    constructor(msg = 'transient') { super(msg); this.name = 'TransientError'; this.code = 'TRANSIENT'; this.category = 'Transient'; }
  }
  class ConnectionError extends KubeMQError {
    constructor(msg = 'conn') { super(msg); this.name = 'ConnectionError'; this.code = 'CONNECTION'; this.category = 'Connection'; }
  }
  class AuthenticationError extends KubeMQError {
    constructor(msg = 'auth') { super(msg); this.name = 'AuthenticationError'; this.code = 'AUTH'; this.category = 'Authentication'; }
  }
  class AuthorizationError extends KubeMQError {
    constructor(msg = 'authz') { super(msg); this.name = 'AuthorizationError'; this.code = 'AUTHZ'; this.category = 'Authorization'; }
  }
  class ValidationError extends KubeMQError {
    constructor(msg = 'validation') { super(msg); this.name = 'ValidationError'; this.code = 'VALIDATION'; this.category = 'Validation'; }
  }
  class ConfigurationError extends KubeMQError {
    constructor(msg = 'config') { super(msg); this.name = 'ConfigurationError'; this.code = 'CONFIG'; this.category = 'Configuration'; }
  }
  class ThrottlingError extends KubeMQError {
    constructor(msg = 'throttle') { super(msg); this.name = 'ThrottlingError'; this.code = 'THROTTLE'; this.category = 'Throttling'; }
  }
  class FatalError extends KubeMQError {
    constructor(msg = 'fatal') { super(msg); this.name = 'FatalError'; this.code = 'FATAL'; this.category = 'Fatal'; }
  }
  class CancellationError extends KubeMQError {
    constructor(msg = 'cancel') { super(msg); this.name = 'CancellationError'; this.code = 'CANCEL'; this.category = 'Cancellation'; }
  }
  class BufferFullError extends KubeMQError {
    constructor(msg = 'buffer') { super(msg); this.name = 'BufferFullError'; this.code = 'BUFFER_FULL'; this.category = 'Buffer'; }
  }
  class StreamBrokenError extends KubeMQError {
    constructor(msg = 'stream') { super(msg); this.name = 'StreamBrokenError'; this.code = 'STREAM_BROKEN'; this.category = 'Stream'; }
  }
  class ClientClosedError extends KubeMQError {
    constructor(msg = 'closed') { super(msg); this.name = 'ClientClosedError'; this.code = 'CLIENT_CLOSED'; this.category = 'Fatal'; }
  }
  class ConnectionNotReadyError extends KubeMQError {
    constructor(msg = 'not ready') { super(msg); this.name = 'ConnectionNotReadyError'; this.code = 'CONN_NOT_READY'; this.category = 'Connection'; }
  }
  class RetryExhaustedError extends KubeMQError {
    constructor(msg = 'retry') { super(msg); this.name = 'RetryExhaustedError'; this.code = 'RETRY_EXHAUSTED'; this.category = 'Retry'; }
  }
  class NotImplementedError extends KubeMQError {
    constructor(msg = 'not impl') { super(msg); this.name = 'NotImplementedError'; this.code = 'NOT_IMPL'; this.category = 'NotImplemented'; }
  }
  class PartialFailureError extends KubeMQError {
    constructor(msg = 'partial') { super(msg); this.name = 'PartialFailureError'; this.code = 'PARTIAL'; this.category = 'Partial'; }
  }
  class HandlerError extends KubeMQError {
    constructor(msg = 'handler') { super(msg); this.name = 'HandlerError'; this.code = 'HANDLER'; this.category = 'Handler'; }
  }

  const mockClient = {
    sendCommand: vi.fn(),
    sendQuery: vi.fn(),
    sendEvent: vi.fn(),
    sendEventStore: vi.fn(),
    sendQueueMessage: vi.fn(),
    sendCommandResponse: vi.fn(),
    sendQueryResponse: vi.fn(),
    subscribeToCommands: vi.fn(),
    subscribeToQueries: vi.fn(),
    subscribeToEvents: vi.fn(),
    subscribeToEventsStore: vi.fn(),
    streamQueueMessages: vi.fn(),
    ping: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
  };

  return {
    mockClient,
    KubeMQError,
    KubeMQTimeoutError,
    NotFoundError,
    TransientError,
    ConnectionError,
    AuthenticationError,
    AuthorizationError,
    ValidationError,
    ConfigurationError,
    ThrottlingError,
    FatalError,
    CancellationError,
    BufferFullError,
    StreamBrokenError,
    ClientClosedError,
    ConnectionNotReadyError,
    RetryExhaustedError,
    NotImplementedError,
    PartialFailureError,
    HandlerError,
  };
});

vi.mock('kubemq-js', () => ({
  KubeMQClient: {
    create: vi.fn().mockResolvedValue(mockClient),
  },
  KubeMQError,
  KubeMQTimeoutError,
  NotFoundError,
  TransientError,
  ConnectionError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  ConfigurationError,
  ThrottlingError,
  FatalError,
  CancellationError,
  BufferFullError,
  StreamBrokenError,
  ClientClosedError,
  ConnectionNotReadyError,
  RetryExhaustedError,
  NotImplementedError,
  PartialFailureError,
  HandlerError,
}));

import { KubeMQClientProxy } from '../../../src/client/kubemq-client.proxy.js';
import { KubeMQRecord } from '../../../src/client/kubemq-record.js';

describe('KubeMQClientProxy', () => {
  let proxy: KubeMQClientProxy;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.close.mockResolvedValue(undefined);
    proxy = new KubeMQClientProxy({
      address: 'localhost:50000',
      clientId: 'test-client',
    });
  });

  // 16.47: connect() creates kubemq-js client
  it('connect() creates kubemq-js client', async () => {
    await proxy.connect();

    const { KubeMQClient } = await import('kubemq-js');
    expect(KubeMQClient.create).toHaveBeenCalledWith(
      expect.objectContaining({ address: 'localhost:50000' }),
    );
  });

  // 16.48: close() closes underlying client
  it('close() closes underlying client', async () => {
    await proxy.connect();
    await proxy.close();

    expect(mockClient.close).toHaveBeenCalledOnce();
  });

  // 16.49: publish() sends command and returns response Observable
  it('publish() sends command and returns response via callback', async () => {
    await proxy.connect();

    mockClient.sendCommand.mockResolvedValueOnce({
      executed: true,
      body: new TextEncoder().encode(JSON.stringify({ result: 'ok' })),
    });

    const callback = vi.fn();
    (proxy as any).publish(
      { pattern: 'orders.create', data: { name: 'test' } },
      callback,
    );

    await vi.waitFor(() => { expect(callback).toHaveBeenCalled(); });

    expect(mockClient.sendCommand).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'orders.create' }),
      expect.anything(),
    );
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ response: { result: 'ok' }, isDisposed: true }),
    );
  });

  // 16.50: publish() sends query (via KubeMQRecord.asQuery())
  it('publish() sends query via KubeMQRecord and returns response', async () => {
    await proxy.connect();

    mockClient.sendQuery.mockResolvedValueOnce({
      executed: true,
      body: new TextEncoder().encode(JSON.stringify({ items: [1, 2] })),
    });

    const record = new KubeMQRecord({ id: '123' }).asQuery();
    const callback = vi.fn();
    (proxy as any).publish(
      { pattern: 'orders.get', data: record },
      callback,
    );

    await vi.waitFor(() => { expect(callback).toHaveBeenCalled(); });

    expect(mockClient.sendQuery).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'orders.get' }),
      expect.anything(),
    );
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ response: { items: [1, 2] }, isDisposed: true }),
    );
  });

  // 16.51: dispatchEvent() sends event (fire-and-forget)
  it('dispatchEvent() sends event', async () => {
    await proxy.connect();
    mockClient.sendEvent.mockResolvedValueOnce(undefined);

    await (proxy as any).dispatchEvent({
      pattern: 'orders.updated',
      data: { orderId: '123' },
    });

    expect(mockClient.sendEvent).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'orders.updated' }),
    );
  });

  // 16.52: dispatchEvent() sends event-store
  it('dispatchEvent() sends event-store via KubeMQRecord', async () => {
    await proxy.connect();
    mockClient.sendEventStore.mockResolvedValueOnce({ sent: true });

    const record = new KubeMQRecord({ event: 'created' }).asEventStore();
    await (proxy as any).dispatchEvent({
      pattern: 'orders.history',
      data: record,
    });

    expect(mockClient.sendEventStore).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'orders.history' }),
    );
  });

  // 16.53: dispatchEvent() sends queue message
  it('dispatchEvent() sends queue message via KubeMQRecord', async () => {
    await proxy.connect();
    mockClient.sendQueueMessage.mockResolvedValueOnce({ messageId: 'q-1', isError: false });

    const record = new KubeMQRecord({ task: 'process' }).asQueue();
    await (proxy as any).dispatchEvent({
      pattern: 'orders.process',
      data: record,
    });

    expect(mockClient.sendQueueMessage).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'orders.process' }),
    );
  });

  // --- Per-pattern error behavior tests (client-side) ---

  // 16.90: Command timeout -> 408 to caller
  it('command timeout maps to 408 via error callback', async () => {
    await proxy.connect();

    mockClient.sendCommand.mockRejectedValueOnce(new KubeMQTimeoutError('command timed out'));

    const callback = vi.fn();
    (proxy as any).publish(
      { pattern: 'orders.create', data: { name: 'test' } },
      callback,
    );

    await vi.waitFor(() => { expect(callback).toHaveBeenCalled(); });

    const callArg = callback.mock.calls[0][0];
    expect(callArg.err).toBeDefined();
    const errObj = callArg.err.getError();
    expect(errObj.statusCode).toBe(408);
  });

  // 16.91: Command no subscribers -> 404 to caller
  it('command no subscribers maps to 404', async () => {
    await proxy.connect();

    mockClient.sendCommand.mockRejectedValueOnce(new NotFoundError('no subscribers'));

    const callback = vi.fn();
    (proxy as any).publish(
      { pattern: 'orders.create', data: {} },
      callback,
    );

    await vi.waitFor(() => { expect(callback).toHaveBeenCalled(); });

    const callArg = callback.mock.calls[0][0];
    expect(callArg.err.getError().statusCode).toBe(404);
  });

  // 16.93: Query timeout -> 408 to caller
  it('query timeout maps to 408', async () => {
    await proxy.connect();

    mockClient.sendQuery.mockRejectedValueOnce(new KubeMQTimeoutError('query timed out'));

    const record = new KubeMQRecord({ id: '1' }).asQuery();
    const callback = vi.fn();
    (proxy as any).publish(
      { pattern: 'orders.get', data: record },
      callback,
    );

    await vi.waitFor(() => { expect(callback).toHaveBeenCalled(); });

    const callArg = callback.mock.calls[0][0];
    expect(callArg.err.getError().statusCode).toBe(408);
  });

  // 16.94: Query no subscribers -> 404 to caller
  it('query no subscribers maps to 404', async () => {
    await proxy.connect();

    mockClient.sendQuery.mockRejectedValueOnce(new NotFoundError('no subscribers'));

    const record = new KubeMQRecord({ id: '1' }).asQuery();
    const callback = vi.fn();
    (proxy as any).publish(
      { pattern: 'orders.get', data: record },
      callback,
    );

    await vi.waitFor(() => { expect(callback).toHaveBeenCalled(); });

    const callArg = callback.mock.calls[0][0];
    expect(callArg.err.getError().statusCode).toBe(404);
  });

  // 16.96: Event send failure -> logged (fire-and-forget)
  it('event send failure propagates as rejected promise', async () => {
    await proxy.connect();

    mockClient.sendEvent.mockRejectedValueOnce(new Error('send failed'));

    await expect(
      (proxy as any).dispatchEvent({
        pattern: 'orders.updated',
        data: { orderId: '1' },
      }),
    ).rejects.toThrow('send failed');
  });

  // 16.101: Queue send failure -> 503 to caller
  it('queue send failure propagates as error', async () => {
    await proxy.connect();

    mockClient.sendQueueMessage.mockRejectedValueOnce(
      new TransientError('queue unavailable'),
    );

    const record = new KubeMQRecord({ task: 'process' }).asQueue();

    await expect(
      (proxy as any).dispatchEvent({
        pattern: 'orders.process',
        data: record,
      }),
    ).rejects.toThrow('queue unavailable');
  });

  // --- Connect guard and safety tests ---

  // Group 3, T1: publish() before connect() throws clear error
  it('publish() before connect() invokes callback with ConnectionNotReadyError', () => {
    const freshProxy = new KubeMQClientProxy({
      address: 'localhost:50000',
      clientId: 'no-connect',
    });

    const callback = vi.fn();
    (freshProxy as any).publish(
      { pattern: 'test.channel', data: { name: 'test' } },
      callback,
    );

    expect(callback).toHaveBeenCalledOnce();
    const callArg = callback.mock.calls[0][0];
    expect(callArg.err).toBeDefined();
    expect(callArg.err.name).toBe('ConnectionNotReadyError');
    expect(callArg.isDisposed).toBe(true);
  });

  // Group 3, T2: dispatchEvent() before connect() throws
  it('dispatchEvent() before connect() throws ConnectionNotReadyError', async () => {
    const freshProxy = new KubeMQClientProxy({
      address: 'localhost:50000',
      clientId: 'no-connect-evt',
    });

    try {
      await (freshProxy as any).dispatchEvent({
        pattern: 'test.channel',
        data: { name: 'test' },
      });
      expect.unreachable('should have thrown');
    } catch (err: unknown) {
      expect((err as any).name).toBe('ConnectionNotReadyError');
    }
  });

  // Group 3, T3: unwrap() before connect() throws
  it('unwrap() before connect() throws', () => {
    const freshProxy = new KubeMQClientProxy({
      address: 'localhost:50000',
      clientId: 'no-connect-unwrap',
    });

    expect(() => freshProxy.unwrap()).toThrow('Not initialized');
  });

  // Group 3, T12: catch block with non-Error rejection
  it('catch block with non-Error rejection normalizes to Error', async () => {
    await proxy.connect();

    // Reject with a string instead of an Error
    mockClient.sendCommand.mockRejectedValueOnce('string rejection');

    const callback = vi.fn();
    (proxy as any).publish(
      { pattern: 'orders.create', data: { name: 'test' } },
      callback,
    );

    await vi.waitFor(() => { expect(callback).toHaveBeenCalled(); });

    const callArg = callback.mock.calls[0][0];
    expect(callArg.err).toBeDefined();
  });

  // Group 5, T1: KubeMQClientProxy.onApplicationShutdown calls close
  it('onApplicationShutdown() calls close()', async () => {
    await proxy.connect();
    await proxy.onApplicationShutdown();

    expect(mockClient.close).toHaveBeenCalledOnce();
  });

  // Group 5, T2: close() uses callbackTimeoutSeconds from options
  it('close() uses callbackTimeoutSeconds from options', async () => {
    const customProxy = new KubeMQClientProxy({
      address: 'localhost:50000',
      clientId: 'timeout-test',
      callbackTimeoutSeconds: 15,
    });
    await customProxy.connect();
    await customProxy.close();

    expect(mockClient.close).toHaveBeenCalledWith(
      expect.objectContaining({
        timeoutSeconds: 15,
        callbackTimeoutSeconds: 15,
      }),
    );
  });

  // Group 2, T5: close() nulls client even if close() rejects
  it('close() nulls client even if underlying close() rejects', async () => {
    await proxy.connect();
    mockClient.close.mockRejectedValueOnce(new Error('close failed'));

    // close() re-throws (try/finally without catch) but still nulls client
    await expect(proxy.close()).rejects.toThrow('close failed');

    // After close, unwrap should throw (client is null due to finally block)
    expect(() => proxy.unwrap()).toThrow('Not initialized');
  });

  // Group 7, T1: extractPacketMetadata does not mutate packet.data
  it('extractPacketMetadata does not mutate packet.data', async () => {
    await proxy.connect();

    mockClient.sendCommand.mockResolvedValueOnce({
      executed: true,
      body: new TextEncoder().encode(JSON.stringify({ result: 'ok' })),
    });

    const record = new KubeMQRecord({ id: '123' });
    const originalData = record.data;
    const originalType = record.__kubemq_type;

    const callback = vi.fn();
    (proxy as any).publish(
      { pattern: 'orders.create', data: record },
      callback,
    );

    await vi.waitFor(() => { expect(callback).toHaveBeenCalled(); });

    // Original record should not be mutated
    expect(record.data).toEqual(originalData);
    expect(record.__kubemq_type).toBe(originalType);
  });

  // Group 7, T6: command/query symmetric undefined for empty body
  it('command response with no body returns undefined as response', async () => {
    await proxy.connect();

    mockClient.sendCommand.mockResolvedValueOnce({
      executed: true,
      body: undefined,
    });

    const callback = vi.fn();
    (proxy as any).publish(
      { pattern: 'orders.create', data: { name: 'test' } },
      callback,
    );

    await vi.waitFor(() => { expect(callback).toHaveBeenCalled(); });

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ response: undefined, isDisposed: true }),
    );
  });

  // Group 8, T1: custom serializer contentType used in tags
  it('custom serializer contentType is used in tags', async () => {
    const customProxy = new KubeMQClientProxy({
      address: 'localhost:50000',
      clientId: 'content-type-test',
      serializer: {
        serialize: (value: unknown) => new TextEncoder().encode(JSON.stringify(value)),
        contentType: 'application/msgpack',
      },
    });
    await customProxy.connect();

    mockClient.sendCommand.mockResolvedValueOnce({
      executed: true,
      body: undefined,
    });

    const callback = vi.fn();
    (customProxy as any).publish(
      { pattern: 'orders.create', data: { name: 'test' } },
      callback,
    );

    await vi.waitFor(() => { expect(callback).toHaveBeenCalled(); });

    expect(mockClient.sendCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: expect.objectContaining({
          'nestjs:content-type': 'application/msgpack',
        }),
      }),
      expect.anything(),
    );
  });

  it('close() waits for in-flight connect promise before closing', async () => {
    const { KubeMQClient } = await import('kubemq-js');
    let resolveCreate: (v: any) => void;
    (KubeMQClient.create as any).mockReturnValueOnce(
      new Promise((resolve) => { resolveCreate = resolve; }),
    );

    const slowProxy = new KubeMQClientProxy({
      address: 'localhost:50000',
      clientId: 'slow-connect',
    });

    const connectPromise = slowProxy.connect();
    const closePromise = slowProxy.close();

    resolveCreate!(mockClient);

    await connectPromise.catch(() => {});
    await closePromise;
  });

  it('close() is safe when connect was never called', async () => {
    const neverConnected = new KubeMQClientProxy({
      address: 'localhost:50000',
      clientId: 'never-connected',
    });
    await expect(neverConnected.close()).resolves.toBeUndefined();
  });
});
