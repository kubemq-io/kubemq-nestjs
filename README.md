# @kubemq/nestjs-transport

KubeMQ transport for NestJS microservices. Integrates all five KubeMQ messaging patterns -- Commands, Queries, Events, EventsStore, and Queues -- into the NestJS ecosystem with custom decorators, dynamic modules, health checks, CQRS bridge, and testing utilities.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Messaging Patterns](#messaging-patterns)
  - [Commands (Request-Reply)](#commands-request-reply)
  - [Queries (Request-Reply with Caching)](#queries-request-reply-with-caching)
  - [Events (Fire-and-Forget)](#events-fire-and-forget)
  - [EventsStore (Persistent Events)](#eventsstore-persistent-events)
  - [Queues (Reliable Delivery)](#queues-reliable-delivery)
- [Custom Decorators](#custom-decorators)
- [Module Configuration](#module-configuration)
  - [forRoot / forRootAsync](#forroot--forrootasync)
  - [register / registerAsync](#register--registerasync)
- [KubeMQRecord Builder](#kubemqrecord-builder)
- [Health Check](#health-check)
- [CQRS Bridge](#cqrs-bridge)
- [Custom Serialization](#custom-serialization)
- [Logger Bridge](#logger-bridge)
- [Testing Utilities](#testing-utilities)
- [API Reference](#api-reference)
- [Example App](#example-app)
- [License](#license)

## Installation

```bash
npm install @kubemq/nestjs-transport kubemq-js
```

### Peer Dependencies

The package requires the following peer dependencies (most are likely already in your NestJS project):

```bash
npm install @nestjs/common @nestjs/core @nestjs/microservices rxjs reflect-metadata
```

Optional peer dependencies for specific features:

```bash
# Health checks
npm install @nestjs/terminus

# CQRS bridge
npm install @nestjs/cqrs
```

## Quick Start

### 1. Server Setup (Receive Messages)

Create a NestJS hybrid application with the KubeMQ transport:

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address: 'localhost:50000',
      clientId: 'my-server',
      group: 'my-group',
    }),
  });

  await app.startAllMicroservices();
  await app.listen(3000);
}
bootstrap();
```

### 2. Module Setup

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address: 'localhost:50000',
      clientId: 'my-app',
      isGlobal: true,
    }),
    KubeMQModule.register({
      name: 'KUBEMQ_SERVICE',
      address: 'localhost:50000',
      clientId: 'my-client',
    }),
  ],
})
export class AppModule {}
```

### 3. Client (Send Messages)

```typescript
// order.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrderService {
  constructor(@Inject('KUBEMQ_SERVICE') private client: ClientProxy) {}

  async createOrder(data: any) {
    return firstValueFrom(this.client.send('orders.create', data));
  }
}
```

### 4. Handler (Process Messages)

```typescript
// order.handler.ts
import { CommandHandler } from '@kubemq/nestjs-transport';
import { Payload, Ctx } from '@nestjs/microservices';
import { KubeMQCommandContext } from '@kubemq/nestjs-transport';

export class OrderHandler {
  @CommandHandler('orders.create')
  handleCreate(@Payload() data: any, @Ctx() ctx: KubeMQCommandContext) {
    return { orderId: '123', status: 'created' };
  }
}
```

## Messaging Patterns

### Commands (Request-Reply)

Commands provide true request-reply semantics with server-enforced timeouts.

**Client:**

```typescript
// Send a command (default type for client.send())
const result = await firstValueFrom(
  this.client.send('orders.create', { name: 'Widget', total: 29.99 }),
);
```

**Handler:**

```typescript
import { CommandHandler, KubeMQCommandContext } from '@kubemq/nestjs-transport';
import { Payload, Ctx } from '@nestjs/microservices';

@CommandHandler('orders.create', { timeout: 15, group: 'order-writers' })
handleCreateOrder(
  @Payload() data: { name: string; total: number },
  @Ctx() ctx: KubeMQCommandContext,
) {
  console.log(`Command from ${ctx.fromClientId} on ${ctx.channel}`);
  return { orderId: 'order-123', status: 'created' };
}
```

### Queries (Request-Reply with Caching)

Queries support server-side caching via `cacheKey` and `cacheTtl`.

**Client:**

```typescript
import { KubeMQRecord } from '@kubemq/nestjs-transport';

// Use KubeMQRecord.asQuery() to send as a query
const record = new KubeMQRecord({ id: 'order-123' }).asQuery();
const order = await firstValueFrom(this.client.send('orders.get', record));
```

**Handler:**

```typescript
import { QueryHandler, KubeMQQueryContext } from '@kubemq/nestjs-transport';

@QueryHandler('orders.get', { cacheKey: 'order:{id}', cacheTtl: 60 })
handleGetOrder(
  @Payload() data: { id: string },
  @Ctx() ctx: KubeMQQueryContext,
) {
  return { orderId: data.id, name: 'Widget', total: 29.99 };
}
```

### Events (Fire-and-Forget)

Events are one-way messages with no response.

**Client:**

```typescript
// Send an event (default type for client.emit())
await firstValueFrom(
  this.client.emit('orders.updated', { id: 'order-123', status: 'shipped' }),
);
```

**Handler:**

```typescript
import { EventHandler, KubeMQContext } from '@kubemq/nestjs-transport';

@EventHandler('orders.updated')
handleOrderUpdated(
  @Payload() data: { id: string; status: string },
  @Ctx() ctx: KubeMQContext,
) {
  console.log(`Order ${data.id} updated to ${data.status}`);
}
```

### EventsStore (Persistent Events)

EventsStore provides persistent, ordered event streams with sequence tracking.

**Client:**

```typescript
import { KubeMQRecord } from '@kubemq/nestjs-transport';

// Use KubeMQRecord.asEventStore() for persistent events
const record = new KubeMQRecord({
  orderId: 'order-123',
  action: 'shipped',
  timestamp: new Date().toISOString(),
}).asEventStore();

await firstValueFrom(this.client.emit('orders.history', record));
```

**Handler:**

```typescript
import { EventStoreHandler, KubeMQEventStoreContext } from '@kubemq/nestjs-transport';

@EventStoreHandler('orders.history', { startFrom: 'first' })
handleOrderHistory(
  @Payload() data: any,
  @Ctx() ctx: KubeMQEventStoreContext,
) {
  console.log(`Event #${ctx.sequence} on ${ctx.channel}`);
}
```

EventStore start positions: `'new'`, `'first'`, `'last'`, `'sequence'`, `'time'`, `'timeDelta'`.

### Queues (Reliable Delivery)

Queues provide at-least-once delivery with visibility timeout, dead-letter queues, and ack/nack support.

**Client:**

```typescript
import { KubeMQRecord } from '@kubemq/nestjs-transport';

// Use KubeMQRecord.asQueue() for queue messages
const record = new KubeMQRecord({ orderId: 'order-123' }).asQueue();
await firstValueFrom(this.client.emit('orders.process', record));
```

**Handler (auto-ack):**

```typescript
import { QueueHandler, KubeMQQueueContext } from '@kubemq/nestjs-transport';

@QueueHandler('orders.process', { maxMessages: 1 })
handleProcessOrder(
  @Payload() data: any,
  @Ctx() ctx: KubeMQQueueContext,
) {
  console.log(`Queue message #${ctx.sequence}, delivery #${ctx.receiveCount}`);
  // Auto-ack on success, auto-nack on exception
}
```

**Handler (manual-ack):**

```typescript
@QueueHandler('orders.process', { manualAck: true })
async handleProcessOrder(
  @Payload() data: any,
  @Ctx() ctx: KubeMQQueueContext,
) {
  try {
    await processOrder(data);
    ctx.ack();                          // Acknowledge the message
  } catch {
    ctx.nack();                         // Reject (redeliver)
    // or: ctx.reQueue('orders.dlq');   // Move to another queue
  }
}
```

## Custom Decorators

Five custom decorators replace the need to manually configure `@MessagePattern` / `@EventPattern` metadata:

| Decorator | NestJS Equivalent | Pattern Type |
|-----------|-------------------|--------------|
| `@CommandHandler(channel, opts?)` | `@MessagePattern(channel, { type: 'command' })` | Request-Reply |
| `@QueryHandler(channel, opts?)` | `@MessagePattern(channel, { type: 'query' })` | Request-Reply |
| `@EventHandler(channel, opts?)` | `@EventPattern(channel, { type: 'event' })` | Fire-and-Forget |
| `@EventStoreHandler(channel, opts?)` | `@EventPattern(channel, { type: 'event_store' })` | Fire-and-Forget |
| `@QueueHandler(channel, opts?)` | `@EventPattern(channel, { type: 'queue' })` | Fire-and-Forget |

All decorators accept a single channel string or an array of channels:

```typescript
// Single channel
@EventHandler('orders.updated')

// Multiple channels
@EventHandler(['orders.updated', 'orders.created'])
```

### Decorator Options

```typescript
// CommandHandler options
@CommandHandler('ch', { timeout: 15, group: 'writers', maxConcurrent: 5 })

// QueryHandler options (with server-side caching)
@QueryHandler('ch', { timeout: 10, cacheKey: 'user:{id}', cacheTtl: 60 })

// EventStoreHandler options (start position)
@EventStoreHandler('ch', { startFrom: 'sequence', startValue: 100 })

// QueueHandler options
@QueueHandler('ch', { manualAck: true, maxMessages: 5, waitTimeoutSeconds: 60 })
```

## Module Configuration

### forRoot / forRootAsync

`forRoot` registers a global KubeMQ configuration (shared options for clients and CQRS). Wire `KubeMQHealthIndicator` separately using the same `KubeMQServer` instance you pass to `connectMicroservice` (see [Health Check](#health-check)).

```typescript
// Static configuration
KubeMQModule.forRoot({
  address: 'localhost:50000',
  clientId: 'my-server',
  isGlobal: true, // default: true
})

// Async configuration (e.g., from ConfigService)
KubeMQModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    address: config.get('KUBEMQ_ADDRESS'),
    clientId: config.get('KUBEMQ_CLIENT_ID'),
  }),
  inject: [ConfigService],
  isGlobal: true,
})
```

### register / registerAsync

`register` creates a named `KubeMQClientProxy` instance for dependency injection:

```typescript
// Static configuration
KubeMQModule.register({
  name: 'ORDER_SERVICE',
  address: 'localhost:50000',
  clientId: 'order-client',
})

// Async configuration
KubeMQModule.registerAsync({
  name: 'ORDER_SERVICE',
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    address: config.get('KUBEMQ_ADDRESS'),
  }),
  inject: [ConfigService],
})
```

Then inject the client:

```typescript
@Injectable()
export class OrderService {
  constructor(@Inject('ORDER_SERVICE') private client: ClientProxy) {}
}
```

## KubeMQRecord Builder

By default, `client.send()` sends a Command and `client.emit()` sends an Event. Use `KubeMQRecord` to specify a different message type:

```typescript
import { KubeMQRecord } from '@kubemq/nestjs-transport';

// Command (default -- no record needed)
this.client.send('ch', data);

// Query
this.client.send('ch', new KubeMQRecord(data).asQuery());

// Event (default -- no record needed)
this.client.emit('ch', data);

// EventStore
this.client.emit('ch', new KubeMQRecord(data).asEventStore());

// Queue
this.client.emit('ch', new KubeMQRecord(data).asQueue());

// With metadata (timeout, policy, etc.)
this.client.emit('ch', new KubeMQRecord(data).asQueue().withMetadata({
  expirationSeconds: 300,
  delaySeconds: 10,
}));
```

## Health Check

The package includes a `KubeMQHealthIndicator` compatible with `@nestjs/terminus`. It is **not** registered by `KubeMQModule.forRoot`; construct it from your microservice `KubeMQServer` so health uses the same client and subscription error map as the transport.

```typescript
import { DynamicModule, Module, Controller, Get } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { TerminusModule, HealthCheck, HealthCheckService } from '@nestjs/terminus';
import {
  KubeMQHealthIndicator,
  KubeMQModule,
  KubeMQServer,
} from '@kubemq/nestjs-transport';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private kubemq: KubeMQHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.kubemq.isHealthy('kubemq')]);
  }
}

@Module({})
export class HealthModule {
  static register(kubemqServer: KubeMQServer): DynamicModule {
    return {
      module: HealthModule,
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [
        {
          provide: KubeMQHealthIndicator,
          useFactory: () => KubeMQHealthIndicator.fromServer(kubemqServer),
        },
      ],
    };
  }
}

@Module({})
export class AppModule {
  static forRoot(kubemqServer: KubeMQServer): DynamicModule {
    return {
      module: AppModule,
      imports: [
        KubeMQModule.forRoot({ address: 'localhost:50000', clientId: 'my-app', isGlobal: true }),
        HealthModule.register(kubemqServer),
      ],
    };
  }
}

async function bootstrap() {
  const kubemqServer = new KubeMQServer({ address: 'localhost:50000', clientId: 'my-server' });
  const app = await NestFactory.create(AppModule.forRoot(kubemqServer));
  app.connectMicroservice({ strategy: kubemqServer });
  await app.startAllMicroservices();
  await app.listen(3000);
}
```

The health check calls `ping()` on the KubeMQ broker and returns:

```json
{
  "status": "ok",
  "info": {
    "kubemq": {
      "status": "up",
      "host": "localhost",
      "version": "v2.7.0",
      "serverStartTime": 1700000000,
      "serverUpTime": 3600
    }
  }
}
```

## CQRS Bridge

The optional `KubeMQCqrsModule` bridges `@nestjs/cqrs` CommandBus, QueryBus, and EventBus through KubeMQ channels:

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { KubeMQCqrsModule } from '@kubemq/nestjs-transport/cqrs';

@Module({
  imports: [
    KubeMQModule.forRoot({ address: 'localhost:50000' }),
    CqrsModule,
    KubeMQCqrsModule.forRoot({
      commandChannelPrefix: 'myapp.commands',
      queryChannelPrefix: 'myapp.queries',
      eventChannelPrefix: 'myapp.events',
      persistEvents: true,    // Use EventsStore instead of Events
      commandTimeout: 10,
      queryTimeout: 10,
    }),
  ],
})
export class AppModule {}
```

Commands sent via `CommandBus.execute()` are routed to KubeMQ command channels (`myapp.commands.{CommandName}`). Same for queries and events. This enables distributed CQRS across microservices.

## Custom Serialization

The default serializer uses JSON (`JsonSerializer` / `JsonDeserializer`). Replace them by implementing the `KubeMQSerializer` and `KubeMQDeserializer` interfaces:

```typescript
import type { KubeMQSerializer, KubeMQDeserializer } from '@kubemq/nestjs-transport';
import * as msgpack from 'msgpackr';

export class MsgPackSerializer implements KubeMQSerializer {
  serialize(value: any): Uint8Array {
    return msgpack.encode(value);
  }
}

export class MsgPackDeserializer implements KubeMQDeserializer {
  deserialize(data: Uint8Array, _tags?: Record<string, string>): any {
    return msgpack.decode(data);
  }
}
```

Pass custom serializers in the server and client options:

```typescript
// Server
new KubeMQServer({
  address: 'localhost:50000',
  serializer: new MsgPackSerializer(),
  deserializer: new MsgPackDeserializer(),
})

// Client
KubeMQModule.register({
  name: 'KUBEMQ_SERVICE',
  address: 'localhost:50000',
  serializer: new MsgPackSerializer(),
  deserializer: new MsgPackDeserializer(),
})
```

## Logger Bridge

Bridge kubemq-js internal logs to the NestJS Logger:

```typescript
import { createNestKubeMQLogger } from '@kubemq/nestjs-transport';

// The logger bridge is used internally by KubeMQServer and KubeMQClientProxy.
// You can also use it directly if you interact with kubemq-js:
const logger = createNestKubeMQLogger('MyKubeMQService');
```

## Testing Utilities

The `@kubemq/nestjs-transport/testing` entry point provides mock implementations for unit testing without a live broker.

### MockKubeMQClient

Mock the client proxy to test services that send messages:

```typescript
import { Test } from '@nestjs/testing';
import { MockKubeMQClient } from '@kubemq/nestjs-transport/testing';

describe('OrderService', () => {
  let service: OrderService;
  let mockClient: MockKubeMQClient;

  beforeEach(async () => {
    mockClient = new MockKubeMQClient();
    mockClient.setResponse('orders.create', { orderId: '123' });

    const module = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: 'KUBEMQ_SERVICE', useValue: mockClient },
      ],
    }).compile();

    service = module.get(OrderService);
  });

  it('should create an order', async () => {
    const result = await service.createOrder({ name: 'Test' });
    expect(result).toEqual({ orderId: '123' });
    expect(mockClient.sendCalls).toHaveLength(1);
    expect(mockClient.sendCalls[0].pattern).toBe('orders.create');
  });

  it('should emit events', async () => {
    await service.updateOrder('123', 'shipped');
    expect(mockClient.emitCalls).toHaveLength(1);
  });

  afterEach(() => mockClient.reset());
});
```

### MockKubeMQServer

Mock the server to test message handlers:

```typescript
import { MockKubeMQServer } from '@kubemq/nestjs-transport/testing';

describe('OrderHandler', () => {
  let server: MockKubeMQServer;

  beforeEach(() => {
    server = new MockKubeMQServer();
    server.addHandler('orders.create', (data, ctx) => {
      return { orderId: 'new-123', ...data };
    });
  });

  it('should handle a command', async () => {
    const result = await server.dispatchCommand('orders.create', { name: 'Test' });
    expect(result.executed).toBe(true);
    expect(result.response.orderId).toBe('new-123');
  });

  it('should dispatch events', async () => {
    server.addHandler('orders.updated', (data, ctx) => {
      // Process event
    });
    await server.dispatchEvent('orders.updated', { id: '123' });
  });

  it('should dispatch queue messages', async () => {
    server.addHandler('orders.process', (data, ctx) => {
      // Auto-ack on success
    });
    const result = await server.dispatchQueueMessage('orders.process', { id: '123' });
    expect(result.acked).toBe(true);
  });

  afterEach(() => server.reset());
});
```

## API Reference

### Server

| Export | Description |
|--------|-------------|
| `KubeMQServer` | Custom transport strategy implementing `CustomTransportStrategy` |

### Client

| Export | Description |
|--------|-------------|
| `KubeMQClientProxy` | Client proxy extending NestJS `ClientProxy` |
| `KubeMQRecord` | Record builder for specifying message type (`.asQuery()`, `.asEventStore()`, `.asQueue()`) |

### Module

| Export | Description |
|--------|-------------|
| `KubeMQModule.forRoot(options)` | Global server configuration |
| `KubeMQModule.forRootAsync(options)` | Async global server configuration |
| `KubeMQModule.register(options)` | Named client proxy registration |
| `KubeMQModule.registerAsync(options)` | Async named client proxy registration |

### Decorators

| Export | Description |
|--------|-------------|
| `@CommandHandler(channel, options?)` | KubeMQ command handler (request-reply) |
| `@QueryHandler(channel, options?)` | KubeMQ query handler (request-reply with caching) |
| `@EventHandler(channel, options?)` | KubeMQ event handler (fire-and-forget) |
| `@EventStoreHandler(channel, options?)` | KubeMQ event store handler (persistent events) |
| `@QueueHandler(channel, options?)` | KubeMQ queue handler (reliable delivery) |

### Contexts

| Export | Description |
|--------|-------------|
| `KubeMQContext` | Base context with `channel`, `id`, `timestamp`, `tags`, `metadata`, `patternType` |
| `KubeMQCommandContext` | Adds `fromClientId`, `replyChannel` |
| `KubeMQQueryContext` | Adds `fromClientId`, `replyChannel` |
| `KubeMQEventStoreContext` | Adds `sequence` |
| `KubeMQQueueContext` | Adds `sequence`, `receiveCount`, `isReRouted`, `ack()`, `nack()`, `reQueue(channel)` |

### Serialization

| Export | Description |
|--------|-------------|
| `KubeMQSerializer` | Interface for outbound serialization |
| `KubeMQDeserializer` | Interface for inbound deserialization |
| `JsonSerializer` | Default JSON serializer |
| `JsonDeserializer` | Default JSON deserializer |

### Health

| Export | Description |
|--------|-------------|
| `KubeMQHealthIndicator` | Terminus-compatible health indicator using `ping()` |

### Errors

| Export | Description |
|--------|-------------|
| `KubeMQRpcException` | RpcException subclass with kubemq-js error details |
| `mapErrorToRpcException(error)` | Maps kubemq-js errors to `KubeMQRpcException` |
| `mapToRpcException(error)` | Maps any error to `KubeMQRpcException` |

### Observability

| Export | Description |
|--------|-------------|
| `createNestKubeMQLogger(context)` | Creates a kubemq-js Logger backed by NestJS Logger |

### Constants

| Export | Description |
|--------|-------------|
| `KUBEMQ_TRANSPORT` | Transport identifier (`'kubemq'`) |
| `KUBEMQ_MODULE_OPTIONS` | Injection token for module options |
| `KUBEMQ_CLIENT_TOKEN` | Default client injection token |
| `KUBEMQ_HANDLER_METADATA` | Metadata key for handler decorator options |
| `TAG_PATTERN`, `TAG_ID`, `TAG_TYPE`, `TAG_CONTENT_TYPE` | KubeMQ message tag keys |

### Testing (`@kubemq/nestjs-transport/testing`)

| Export | Description |
|--------|-------------|
| `MockKubeMQClient` | In-memory mock of `KubeMQClientProxy` |
| `MockKubeMQServer` | In-memory mock of `KubeMQServer` |

### CQRS (`@kubemq/nestjs-transport/cqrs`)

| Export | Description |
|--------|-------------|
| `KubeMQCqrsModule` | Dynamic module bridging `@nestjs/cqrs` with KubeMQ |
| `KubeMQCommandPubSub` | PubSub for CommandBus |
| `KubeMQQueryPubSub` | PubSub for QueryBus |
| `KubeMQEventPubSub` | PubSub for EventBus |

### Server Options

```typescript
interface KubeMQServerOptions {
  address: string;
  clientId?: string;
  credentials?: string;
  tls?: TlsOptions | boolean;
  group?: string;
  defaultCommandTimeout?: number;   // default: 10
  defaultQueryTimeout?: number;     // default: 10
  eventsStore?: { startFrom?: EventStoreStartPosition; startValue?: number };
  queue?: { maxMessages?: number; waitTimeoutSeconds?: number };
  serializer?: KubeMQSerializer;
  deserializer?: KubeMQDeserializer;
  waitForConnection?: boolean;      // default: true (fail-fast)
  callbackTimeoutSeconds?: number;  // default: 30
  retry?: RetryPolicy;
  reconnect?: ReconnectionPolicy;
  keepalive?: KeepaliveOptions;
  tracerProvider?: unknown;
  meterProvider?: unknown;
}
```

### Client Options

```typescript
interface KubeMQClientOptions {
  address: string;
  clientId?: string;
  credentials?: string;
  tls?: TlsOptions | boolean;
  defaultCommandTimeout?: number;
  defaultQueryTimeout?: number;
  serializer?: KubeMQSerializer;
  deserializer?: KubeMQDeserializer;
  defaultQueuePolicy?: QueueMessagePolicyOptions;
  retry?: RetryPolicy;
  reconnect?: ReconnectionPolicy;
  keepalive?: KeepaliveOptions;
  tracerProvider?: unknown;
  meterProvider?: unknown;
}
```

## Example App

A complete example application is available in `examples/nestjs-kubemq-app/`. It demonstrates:

- Hybrid HTTP + KubeMQ microservice bootstrap
- `KubeMQModule.forRoot()` for global configuration
- `KubeMQModule.register()` for named client proxy
- All 5 messaging patterns (Command, Query, Event, EventStore, Queue)
- HTTP endpoints that trigger KubeMQ operations
- Health check with `@nestjs/terminus`

### Running the Example

```bash
cd examples/nestjs-kubemq-app

# Start KubeMQ broker
docker compose up -d

# Install dependencies
npm install

# Run
npm run start:dev
```

Endpoints:
- `POST /orders` -- Create order (Command)
- `GET /orders/:id` -- Get order (Query)
- `POST /orders/:id/update` -- Update order (Event)
- `POST /orders/:id/history` -- Record history (EventStore)
- `POST /orders/:id/process` -- Process order (Queue)
- `GET /health` -- Health check

## License

MIT
