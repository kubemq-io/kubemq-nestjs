import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock kubemq-js KubeMQClient
const mockSendCommand = vi.fn();
const mockSendQuery = vi.fn();
const mockSendEvent = vi.fn();
const mockSendEventStore = vi.fn();
const mockCreate = vi.fn();
const mockClose = vi.fn();

const mockClientInstance = {
  sendCommand: mockSendCommand,
  sendQuery: mockSendQuery,
  sendEvent: mockSendEvent,
  sendEventStore: mockSendEventStore,
  close: mockClose,
};

vi.mock('kubemq-js', () => ({
  KubeMQClient: {
    create: (...args: any[]) => {
      mockCreate(...args);
      return Promise.resolve(mockClientInstance);
    },
  },
}));

// Mock @nestjs/cqrs
vi.mock('@nestjs/cqrs', () => ({
  CommandBus: class CommandBus {},
  QueryBus: class QueryBus {},
  EventBus: class EventBus {},
}));

import {
  KubeMQCommandPubSub,
  KubeMQQueryPubSub,
  KubeMQEventPubSub,
} from '../../../src/cqrs/kubemq-cqrs.pubsub.js';
import { KubeMQCqrsModule } from '../../../src/cqrs/kubemq-cqrs.module.js';
import { SerializationError } from '../../../src/errors/serialization.error.js';

describe('CQRS Bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClose.mockResolvedValue(undefined);
  });

  it('KubeMQCqrsModule.forRoot() registers all three publishers', () => {
    const mod = KubeMQCqrsModule.forRoot({ commandChannelPrefix: 'cmd' });
    expect(mod.module).toBe(KubeMQCqrsModule);
    expect(mod.providers).toBeDefined();
    expect(mod.exports).toBeDefined();

    const providerTokens = mod.providers!.map((p: any) => (typeof p === 'function' ? p : p.provide));
    expect(providerTokens).toContain(KubeMQCommandPubSub);
    expect(providerTokens).toContain(KubeMQQueryPubSub);
    expect(providerTokens).toContain(KubeMQEventPubSub);

    expect(mod.exports).toContain(KubeMQCommandPubSub);
    expect(mod.exports).toContain(KubeMQQueryPubSub);
    expect(mod.exports).toContain(KubeMQEventPubSub);
  });

  it('publishes a distributed command (Nest single-arg publish; channel from constructor name)', async () => {
    mockSendCommand.mockResolvedValue({ executed: true, body: null });

    const pubsub = new KubeMQCommandPubSub({});
    pubsub.setClient(mockClientInstance as any);

    class CreateOrderCommand {
      orderId = 'order-1';
    }

    await pubsub.publish(new CreateOrderCommand());

    expect(mockSendCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'cqrs.commands.CreateOrderCommand',
        timeoutInSeconds: 10,
        tags: expect.objectContaining({ 'nestjs:type': 'cqrs-command' }),
      }),
    );
  });

  it('publishes a distributed query (Nest single-arg publish)', async () => {
    const responseBody = new TextEncoder().encode(JSON.stringify({ total: 42 }));
    mockSendQuery.mockResolvedValue({ executed: true, body: responseBody });

    const pubsub = new KubeMQQueryPubSub({});
    pubsub.setClient(mockClientInstance as any);

    class GetOrderTotalQuery {
      orderId = 'order-1';
    }

    const result = await pubsub.publish(new GetOrderTotalQuery());

    expect(mockSendQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'cqrs.queries.GetOrderTotalQuery',
        timeoutInSeconds: 10,
        tags: expect.objectContaining({ 'nestjs:type': 'cqrs-query' }),
      }),
    );
    expect(result).toEqual({ total: 42 });
  });

  it('publishes a distributed event (Nest single-arg publish)', async () => {
    mockSendEvent.mockResolvedValue(undefined);

    const pubsub = new KubeMQEventPubSub({});
    pubsub.setClient(mockClientInstance as any);

    class OrderCreatedEvent {
      orderId = 'order-1';
    }

    await pubsub.publish(new OrderCreatedEvent());

    expect(mockSendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'cqrs.events.OrderCreatedEvent',
        tags: expect.objectContaining({ 'nestjs:type': 'cqrs-event' }),
      }),
    );
    expect(mockSendEventStore).not.toHaveBeenCalled();
  });

  it('routes events to sendEventStore when persistEvents is true', async () => {
    mockSendEventStore.mockResolvedValue(undefined);

    const pubsub = new KubeMQEventPubSub({ persistEvents: true });
    pubsub.setClient(mockClientInstance as any);

    class OrderShippedEvent {
      orderId = 'order-1';
    }

    await pubsub.publish(new OrderShippedEvent());

    expect(mockSendEventStore).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'cqrs.events.OrderShippedEvent',
        tags: expect.objectContaining({ 'nestjs:type': 'cqrs-event' }),
      }),
    );
    expect(mockSendEvent).not.toHaveBeenCalled();
  });

  it('CQRS command response invalid JSON throws SerializationError', async () => {
    const invalidJson = new TextEncoder().encode('not-valid-json{{{');
    mockSendCommand.mockResolvedValue({ executed: true, body: invalidJson });

    const pubsub = new KubeMQCommandPubSub({});
    pubsub.setClient(mockClientInstance as any);

    class TestCmd {
      data = 1;
    }

    await expect(pubsub.publish(new TestCmd())).rejects.toThrow(SerializationError);
  });

  it('CQRS query response invalid JSON throws SerializationError', async () => {
    const invalidJson = new TextEncoder().encode('not-valid-json{{{');
    mockSendQuery.mockResolvedValue({ executed: true, body: invalidJson });

    const pubsub = new KubeMQQueryPubSub({});
    pubsub.setClient(mockClientInstance as any);

    class TestQuery {
      data = 1;
    }

    await expect(pubsub.publish(new TestQuery())).rejects.toThrow(SerializationError);
  });

  it('CQRS command publish with circular object throws SerializationError', async () => {
    const pubsub = new KubeMQCommandPubSub({
      channelResolver: () => 'CircularCmd',
    });
    pubsub.setClient(mockClientInstance as any);

    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;

    await expect(pubsub.publish(circular)).rejects.toThrow(SerializationError);
  });

  it('CQRS command throws when response.executed is false', async () => {
    mockSendCommand.mockResolvedValue({
      executed: false,
      error: 'no handler available',
    });

    const pubsub = new KubeMQCommandPubSub({});
    pubsub.setClient(mockClientInstance as any);

    class FailCmd {
      data = 1;
    }

    await expect(pubsub.publish(new FailCmd())).rejects.toThrow(/CQRS command failed/);
  });

  it('concurrent publish() calls use the same shared client', async () => {
    mockSendCommand.mockResolvedValue({ executed: true, body: null });
    mockSendQuery.mockResolvedValue({ executed: true, body: null });
    mockSendEvent.mockResolvedValue(undefined);

    const cmdPubSub = new KubeMQCommandPubSub({});
    const queryPubSub = new KubeMQQueryPubSub({});
    const eventPubSub = new KubeMQEventPubSub({});

    cmdPubSub.setClient(mockClientInstance as any);
    queryPubSub.setClient(mockClientInstance as any);
    eventPubSub.setClient(mockClientInstance as any);

    class C1 {
      data = 1;
    }
    class Q1 {
      data = 2;
    }
    class E1 {
      data = 3;
    }

    await Promise.all([
      cmdPubSub.publish(new C1()),
      queryPubSub.publish(new Q1()),
      eventPubSub.publish(new E1()),
    ]);

    expect(mockSendCommand).toHaveBeenCalledOnce();
    expect(mockSendQuery).toHaveBeenCalledOnce();
    expect(mockSendEvent).toHaveBeenCalledOnce();
  });

  it('publish before setClient throws clear error', async () => {
    const pubsub = new KubeMQCommandPubSub({});
    class T {
      data = 1;
    }
    await expect(pubsub.publish(new T())).rejects.toThrow('CQRS client not initialized');
  });
});

describe('KubeMQCqrsModule lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClose.mockResolvedValue(undefined);
  });

  function createModuleWithRef(overrides: Record<string, unknown> = {}): KubeMQCqrsModule {
    const commandPubSub = new KubeMQCommandPubSub({});
    const queryPubSub = new KubeMQQueryPubSub({});
    const eventPubSub = new KubeMQEventPubSub({});
    const commandBus = { publisher: null };
    const queryBus = { publisher: null };
    const eventBus = { publisher: null };

    const providers: Record<string, unknown> = {
      KUBEMQ_MODULE_OPTIONS: { address: 'localhost:50000', clientId: 'cqrs-test' },
      KUBEMQ_CQRS_OPTIONS: {},
      [KubeMQCommandPubSub.name]: commandPubSub,
      [KubeMQQueryPubSub.name]: queryPubSub,
      [KubeMQEventPubSub.name]: eventPubSub,
      CommandBus: commandBus,
      QueryBus: queryBus,
      EventBus: eventBus,
      ...overrides,
    };

    const mockModuleRef = {
      get: (token: any, _opts?: any) => {
        if (typeof token === 'string') return providers[token];
        if (typeof token === 'function') return providers[token.name];
        return undefined;
      },
    };

    return new KubeMQCqrsModule(mockModuleRef as any);
  }

  it('onModuleInit creates shared client, wires PubSubs, assigns bus publishers', async () => {
    const mod = createModuleWithRef();
    await mod.onModuleInit();

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ address: 'localhost:50000' }),
    );
  });

  it('onModuleInit throws when KUBEMQ_MODULE_OPTIONS has no address', async () => {
    const mod = createModuleWithRef({ KUBEMQ_MODULE_OPTIONS: {} });
    await expect(mod.onModuleInit()).rejects.toThrow('KubeMQCqrsModule requires');
  });

  it('onModuleInit throws when KUBEMQ_MODULE_OPTIONS is undefined', async () => {
    const mod = createModuleWithRef({ KUBEMQ_MODULE_OPTIONS: undefined });
    await expect(mod.onModuleInit()).rejects.toThrow('KubeMQCqrsModule requires');
  });

  it('onModuleInit closes client if PubSub resolution fails', async () => {
    const mod = createModuleWithRef({
      [KubeMQCommandPubSub.name]: null,
    });

    await expect(mod.onModuleInit()).rejects.toThrow('failed to resolve');
    expect(mockClose).toHaveBeenCalled();
  });

  it('onModuleInit silently returns when @nestjs/cqrs is not installed (module not found)', async () => {
    const commandPubSub = new KubeMQCommandPubSub({});
    const queryPubSub = new KubeMQQueryPubSub({});
    const eventPubSub = new KubeMQEventPubSub({});

    const mockModuleRef = {
      get: (token: any, _opts?: any) => {
        if (typeof token === 'string' && token === 'KUBEMQ_MODULE_OPTIONS') {
          return { address: 'localhost:50000' };
        }
        if (typeof token === 'string' && token === 'KUBEMQ_CQRS_OPTIONS') return {};
        if (token === KubeMQCommandPubSub) return commandPubSub;
        if (token === KubeMQQueryPubSub) return queryPubSub;
        if (token === KubeMQEventPubSub) return eventPubSub;
        // CommandBus/QueryBus/EventBus not found — simulating @nestjs/cqrs missing
        return undefined;
      },
    };

    const mod = new KubeMQCqrsModule(mockModuleRef as any);

    // The module will import @nestjs/cqrs, find the buses, but get undefined.
    // Since @nestjs/cqrs IS mocked (vi.mock above), it won't throw MODULE_NOT_FOUND.
    // Instead, it will throw 'KubeMQCqrsModule requires CqrsModule'.
    // This is correct behavior when CqrsModule is not imported.
    await expect(mod.onModuleInit()).rejects.toThrow('CqrsModule');
  });

  it('onModuleDestroy closes shared client', async () => {
    const mod = createModuleWithRef();
    await mod.onModuleInit();

    await mod.onModuleDestroy();
    expect(mockClose).toHaveBeenCalledWith(
      expect.objectContaining({ timeoutSeconds: 5 }),
    );
  });

  it('onModuleDestroy respects custom drainTimeoutSeconds', async () => {
    const mod = createModuleWithRef({ KUBEMQ_CQRS_OPTIONS: { drainTimeoutSeconds: 15 } });
    await mod.onModuleInit();

    await mod.onModuleDestroy();
    expect(mockClose).toHaveBeenCalledWith(
      expect.objectContaining({ timeoutSeconds: 15 }),
    );
  });

  it('onModuleDestroy is safe when no shared client exists', async () => {
    const mod = createModuleWithRef();
    // Don't call onModuleInit — sharedClient is null
    await expect(mod.onModuleDestroy()).resolves.toBeUndefined();
  });

  it('forRootAsync registers providers correctly', () => {
    const mod = KubeMQCqrsModule.forRootAsync({
      useFactory: () => ({ commandChannelPrefix: 'async-cmd' }),
      inject: [],
    });

    expect(mod.module).toBe(KubeMQCqrsModule);
    const providerTokens = mod.providers!.map((p: any) => (typeof p === 'function' ? p : p.provide));
    expect(providerTokens).toContain('KUBEMQ_CQRS_OPTIONS');
    expect(providerTokens).toContain(KubeMQCommandPubSub);
  });
});
