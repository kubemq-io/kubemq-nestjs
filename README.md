# @kubemq/nestjs-transport

[![npm version](https://img.shields.io/npm/v/@kubemq/nestjs-transport.svg)](https://www.npmjs.com/package/@kubemq/nestjs-transport)
[![npm downloads](https://img.shields.io/npm/dm/@kubemq/nestjs-transport.svg)](https://www.npmjs.com/package/@kubemq/nestjs-transport)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.11.0-brightgreen.svg)](https://nodejs.org)
[![NestJS](https://img.shields.io/badge/NestJS-10.x%20%7C%2011.x-E0234E.svg)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6.svg)](https://www.typescriptlang.org)

KubeMQ transport for [NestJS](https://nestjs.com/) microservices. Integrates all five KubeMQ messaging patterns — Commands, Queries, Events, Events Store, and Queues — into the NestJS ecosystem with custom decorators, dynamic module registration, health checks, a CQRS bridge, pluggable serialization, and testing utilities. Built on [kubemq-js](https://www.npmjs.com/package/kubemq-js) with TypeScript-first types and ESM + CJS dual builds.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Messaging Patterns](#messaging-patterns)
  - [Commands (Request-Reply)](#commands-request-reply)
  - [Queries (Request-Reply)](#queries-request-reply)
  - [Events (Fire-and-Forget)](#events-fire-and-forget)
  - [Events Store (Persistent Events)](#events-store-persistent-events)
  - [Queues (Reliable Delivery)](#queues-reliable-delivery)
- [Module Configuration](#module-configuration)
  - [forRoot / forRootAsync](#forroot--forrootasync)
  - [register / registerAsync](#register--registerasync)
  - [forTest](#fortest)
- [KubeMQRecord Builder](#kubemqrecord-builder)
- [Custom Decorators](#custom-decorators)
- [Error Handling & Exception Filters](#error-handling--exception-filters)
- [Reconnection Behavior](#reconnection-behavior)
- [TLS & Authentication](#tls--authentication)
- [Health Check](#health-check)
- [CQRS Bridge](#cqrs-bridge)
- [Custom Serialization](#custom-serialization)
- [Logger Bridge](#logger-bridge)
- [Testing Utilities](#testing-utilities)
- [Examples](#examples)
- [API Reference](#api-reference)
- [Configuration Reference](#configuration-reference)
- [Troubleshooting / FAQ](#troubleshooting--faq)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Five messaging patterns** — Commands, Queries, Events, Events Store, and Queues
- **Custom decorators** — `@CommandHandler`, `@QueryHandler`, `@EventHandler`, `@EventStoreHandler`, `@QueueHandler`
- **Dynamic module** — `forRoot` / `forRootAsync` / `register` / `registerAsync` / `forTest`
- **KubeMQRecord builder** — fluent API for selecting message type (`.asQuery()`, `.asEventStore()`, `.asQueue()`)
- **Health check indicator** — `@nestjs/terminus`-compatible `KubeMQHealthIndicator`
- **CQRS bridge** — `CommandBus` / `QueryBus` / `EventBus` routed through KubeMQ channels via `@nestjs/cqrs`
- **Custom serialization** — pluggable `KubeMQSerializer` / `KubeMQDeserializer` interfaces
- **Logger bridge** — routes kubemq-js internal logs to the NestJS `Logger`
- **Automatic reconnection** — configurable `ReconnectionPolicy` with backoff and jitter
- **Testing utilities** — `MockKubeMQClient`, `MockKubeMQServer`, `KubeMQModule.forTest()`
- **TypeScript-first** — full type safety with ESM + CJS dual build

## Installation

```bash
npm install @kubemq/nestjs-transport kubemq-js
```

**Peer dependencies** (most are already in a typical NestJS project):

```bash
npm install @nestjs/common @nestjs/core @nestjs/microservices rxjs reflect-metadata
```

**Optional peer dependencies** for specific features:

```bash
# Health checks
npm install @nestjs/terminus

# CQRS bridge
npm install @nestjs/cqrs
```

**Prerequisites:**

- Node.js 20.11.0 or later
- A running KubeMQ server (default: `localhost:50000`)

## Quick Start

### 1. Server Setup

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

### 2. Module Registration

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

### 3. Message Handler

```typescript
// order.handler.ts
import { CommandHandler, KubeMQCommandContext } from '@kubemq/nestjs-transport';
import { Payload, Ctx } from '@nestjs/microservices';

export class OrderHandler {
  @CommandHandler('orders.create')
  handleCreate(@Payload() data: any, @Ctx() ctx: KubeMQCommandContext) {
    return { orderId: '123', status: 'created' };
  }
}
```

### 4. Client (Send Messages)

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

## Messaging Patterns

### Commands (Request-Reply)

Commands provide true request-reply semantics with server-enforced timeouts.

**Client:**

```typescript
const result = await firstValueFrom(
  this.client.send('orders.create', { name: 'Widget', total: 29.99 }),
);
```

**Handler:**

```typescript
import { CommandHandler, KubeMQCommandContext } from '@kubemq/nestjs-transport';
import { Payload, Ctx } from '@nestjs/microservices';

@CommandHandler('orders.create', { group: 'order-writers' })
handleCreateOrder(
  @Payload() data: { name: string; total: number },
  @Ctx() ctx: KubeMQCommandContext,
) {
  console.log(`Command from ${ctx.fromClientId} on ${ctx.channel}`);
  return { orderId: 'order-123', status: 'created' };
}
```

### Queries (Request-Reply)

Queries return data from a responder. Use `KubeMQRecord.asQuery()` to send a query via `client.send()`.

**Client:**

```typescript
import { KubeMQRecord } from '@kubemq/nestjs-transport';

const record = new KubeMQRecord({ id: 'order-123' }).asQuery();
const order = await firstValueFrom(this.client.send('orders.get', record));
```

**Handler:**

```typescript
import { QueryHandler, KubeMQQueryContext } from '@kubemq/nestjs-transport';

@QueryHandler('orders.get')
handleGetOrder(
  @Payload() data: { id: string },
  @Ctx() ctx: KubeMQQueryContext,
) {
  return { orderId: data.id, name: 'Widget', total: 29.99 };
}
```

### Events (Fire-and-Forget)

Events are one-way messages with no response. `client.emit()` sends an Event by default.

**Client:**

```typescript
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

### Events Store (Persistent Events)

Events Store provides persistent, ordered event streams with replay and sequence tracking.

**Client:**

```typescript
import { KubeMQRecord } from '@kubemq/nestjs-transport';

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

Start positions: `'new'` | `'first'` | `'last'` | `'sequence'` | `'time'` | `'timeDelta'` (or numeric `1`–`6`).

### Queues (Reliable Delivery)

Queues provide at-least-once delivery with visibility timeout, dead-letter queues, and ack/nack support.

**Client:**

```typescript
import { KubeMQRecord } from '@kubemq/nestjs-transport';

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
    ctx.ack();
  } catch {
    ctx.nack();
    // or: ctx.reQueue('orders.dlq');
  }
}
```

## Module Configuration

### forRoot / forRootAsync

`forRoot` registers a global KubeMQ configuration shared by all modules. Health checks should be wired separately from the `KubeMQServer` instance you pass to `connectMicroservice` (see [Health Check](#health-check)).

```typescript
// Static configuration
KubeMQModule.forRoot({
  address: 'localhost:50000',
  clientId: 'my-server',
  isGlobal: true,
})
```

```typescript
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

| Parameter | Type | Default | Required | Description |
|-----------|------|---------|----------|-------------|
| `isGlobal` | `boolean` | `true` | No | Register as a global module |
| `imports` | `Array<...>` | `[]` | No | Modules to import (async only) |
| `useFactory` | `Function` | — | Yes* | Factory function returning `KubeMQModuleOptions` |
| `useClass` | `Type` | — | Yes* | Class implementing `KubeMQOptionsFactory` |
| `useExisting` | `Type` | — | Yes* | Existing provider implementing `KubeMQOptionsFactory` |
| `inject` | `InjectionToken[]` | `[]` | No | Tokens to inject into factory |

*One of `useFactory`, `useClass`, or `useExisting` is required for async.

### register / registerAsync

`register` creates a named `KubeMQClientProxy` instance for dependency injection:

```typescript
// Static configuration
KubeMQModule.register({
  name: 'ORDER_SERVICE',
  address: 'localhost:50000',
  clientId: 'order-client',
})
```

```typescript
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

### forTest

`forTest` provides a `MockKubeMQClient` for unit testing without a live broker:

```typescript
const module = await Test.createTestingModule({
  imports: [
    KubeMQModule.forTest({ name: 'KUBEMQ_SERVICE', isGlobal: true }),
  ],
  providers: [OrderService],
}).compile();
```

| Parameter | Type | Default | Required | Description |
|-----------|------|---------|----------|-------------|
| `name` | `string \| symbol` | `KUBEMQ_CLIENT_TOKEN` | No | Injection token for the mock client |
| `isGlobal` | `boolean` | `false` | No | Register as a global module |

## KubeMQRecord Builder

By default, `client.send()` sends a **Command** and `client.emit()` sends an **Event**. Use `KubeMQRecord` to specify a different message type:

| Method | Pattern Type | client API |
|--------|-------------|------------|
| *(default)* | Command | `client.send(channel, data)` |
| `.asQuery()` | Query | `client.send(channel, record)` |
| *(default)* | Event | `client.emit(channel, data)` |
| `.asEventStore()` | Events Store | `client.emit(channel, record)` |
| `.asQueue()` | Queue | `client.emit(channel, record)` |

```typescript
import { KubeMQRecord } from '@kubemq/nestjs-transport';

// Command (default — no KubeMQRecord needed)
this.client.send('ch', data);

// Query
this.client.send('ch', new KubeMQRecord(data).asQuery());

// Event (default — no KubeMQRecord needed)
this.client.emit('ch', data);

// Events Store
this.client.emit('ch', new KubeMQRecord(data).asEventStore());

// Queue
this.client.emit('ch', new KubeMQRecord(data).asQueue());

// Queue with metadata (expiration, delay)
this.client.emit('ch', new KubeMQRecord(data).asQueue().withMetadata({
  expirationSeconds: 300,
  delaySeconds: 10,
}));
```

## Custom Decorators

Five custom decorators replace manual `@MessagePattern` / `@EventPattern` metadata configuration:

| Decorator | NestJS Equivalent | Pattern Type | Options |
|-----------|-------------------|--------------|---------|
| `@CommandHandler(channel, opts?)` | `@MessagePattern(channel, { type: 'command' })` | Request-Reply | `group`, `maxConcurrent` |
| `@QueryHandler(channel, opts?)` | `@MessagePattern(channel, { type: 'query' })` | Request-Reply | `group`, `maxConcurrent` |
| `@EventHandler(channel, opts?)` | `@EventPattern(channel, { type: 'event' })` | Fire-and-Forget | `group`, `maxConcurrent` |
| `@EventStoreHandler(channel, opts?)` | `@EventPattern(channel, { type: 'event_store' })` | Fire-and-Forget | `group`, `maxConcurrent`, `startFrom`, `startValue` |
| `@QueueHandler(channel, opts?)` | `@EventPattern(channel, { type: 'queue' })` | Fire-and-Forget | `group`, `maxConcurrent`, `manualAck`, `maxMessages`, `waitTimeoutSeconds`, `batch` |

All decorators accept a single channel string or an array of channels:

```typescript
// Single channel
@EventHandler('orders.updated')

// Multiple channels
@EventHandler(['orders.updated', 'orders.created'])
```

### Decorator Options

```typescript
@CommandHandler('ch', { group: 'writers', maxConcurrent: 5 })

@EventStoreHandler('ch', { startFrom: 'sequence', startValue: 100 })

@QueueHandler('ch', { manualAck: true, maxMessages: 5, waitTimeoutSeconds: 60 })

@QueueHandler('ch', { batch: true, maxMessages: 10 })
```

## Error Handling & Exception Filters

### KubeMQRpcException

`KubeMQRpcException` extends the NestJS `RpcException` with structured error details:

```typescript
interface KubeMQRpcError {
  statusCode: number;
  message: string;
  kubemqCode: string;
  kubemqCategory: string;
  channel?: string;
}
```

### Error Mapping

The SDK provides two helper functions that convert kubemq-js errors into `KubeMQRpcException`:

| Function | Description |
|----------|-------------|
| `mapErrorToRpcException(error)` | Maps a kubemq-js error to `KubeMQRpcException` |
| `mapToRpcException(error)` | Maps any error to `KubeMQRpcException` |

### Custom Exception Filter

```typescript
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';
import { KubeMQRpcException } from '@kubemq/nestjs-transport';
import type { KubeMQRpcError } from '@kubemq/nestjs-transport';

@Catch(KubeMQRpcException)
export class KubeMQExceptionFilter extends BaseRpcExceptionFilter {
  catch(exception: KubeMQRpcException, host: ArgumentsHost) {
    const error = exception.getError() as KubeMQRpcError;
    console.error(
      `[${error.kubemqCategory}] ${error.kubemqCode}: ${error.message}`,
    );
    return super.catch(exception, host);
  }
}
```

### Additional Error Types

| Export | Description |
|--------|-------------|
| `SerializationError` | Thrown when serialization or deserialization fails |
| `ConnectionNotReadyError` | Re-exported from kubemq-js; thrown when operating on an unready connection |

## Reconnection Behavior

The KubeMQ transport supports automatic reconnection through the `reconnect` option on both server and client. The `ReconnectionPolicy` is provided by kubemq-js:

```typescript
new KubeMQServer({
  address: 'localhost:50000',
  reconnect: {
    maxAttempts: -1,
    initialDelayMs: 500,
    maxDelayMs: 30_000,
    multiplier: 2.0,
    jitter: 'full',
  },
  waitForConnection: true,
})
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `maxAttempts` | `number` | `-1` | Maximum reconnection attempts (`-1` = unlimited) |
| `initialDelayMs` | `number` | `500` | Initial backoff interval (milliseconds) |
| `maxDelayMs` | `number` | `30000` | Maximum backoff interval (milliseconds) |
| `multiplier` | `number` | `2.0` | Backoff multiplier |
| `jitter` | `string` | `'full'` | Jitter strategy (`'none'` \| `'full'` \| `'decorrelated'`) |

**`waitForConnection`** (default: `true`) — when `true`, the server waits for a successful connection before completing startup. Set to `false` for non-blocking startup that retries in the background.

## TLS & Authentication

### TLS

```typescript
new KubeMQServer({
  address: 'kubemq-server:50000',
  tls: {
    enabled: true,
    caCert: '/path/to/ca.pem',
  },
})
```

### Mutual TLS (mTLS)

```typescript
new KubeMQServer({
  address: 'kubemq-server:50000',
  tls: {
    enabled: true,
    caCert: '/path/to/ca.pem',
    clientCert: '/path/to/client.pem',
    clientKey: '/path/to/client-key.pem',
  },
})
```

### Token Authentication

```typescript
new KubeMQServer({
  address: 'kubemq-server:50000',
  credentials: 'my-auth-token',
})
```

## Health Check

The package includes a `KubeMQHealthIndicator` compatible with `@nestjs/terminus`. Construct it from your microservice `KubeMQServer` instance so health checks use the same connection and subscription error map as the transport.

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
        KubeMQModule.forRoot({
          address: 'localhost:50000',
          clientId: 'my-app',
          isGlobal: true,
        }),
        HealthModule.register(kubemqServer),
      ],
    };
  }
}

async function bootstrap() {
  const kubemqServer = new KubeMQServer({
    address: 'localhost:50000',
    clientId: 'my-server',
  });
  const app = await NestFactory.create(AppModule.forRoot(kubemqServer));
  app.connectMicroservice({ strategy: kubemqServer });
  await app.startAllMicroservices();
  await app.listen(3000);
}
```

**Health check response:**

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

The optional `KubeMQCqrsModule` bridges `@nestjs/cqrs` `CommandBus`, `QueryBus`, and `EventBus` through KubeMQ channels. Commands sent via `CommandBus.execute()` are routed to KubeMQ command channels (`{prefix}.{CommandName}`), and the same applies to queries and events. This enables distributed CQRS across microservices.

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
      persistEvents: true,
      commandTimeout: 10,
      queryTimeout: 10,
    }),
  ],
})
export class AppModule {}
```

See [Configuration Reference — KubeMQCqrsOptions](#kubemqcqrsoptions) for all available options.

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

Bridge kubemq-js internal logs to the NestJS `Logger`:

```typescript
import { createNestKubeMQLogger } from '@kubemq/nestjs-transport';

const logger = createNestKubeMQLogger('MyKubeMQService');
```

The logger bridge is used internally by `KubeMQServer` and `KubeMQClientProxy`. Use it directly when interacting with kubemq-js outside the NestJS transport layer.

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
    server.addHandler('orders.updated', (data, ctx) => {});
    await server.dispatchEvent('orders.updated', { id: '123' });
  });

  it('should dispatch queue messages', async () => {
    server.addHandler('orders.process', (data, ctx) => {});
    const result = await server.dispatchQueueMessage('orders.process', { id: '123' });
    expect(result.acked).toBe(true);
  });

  afterEach(() => server.reset());
});
```

### KubeMQModule.forTest()

Shortcut to register a `MockKubeMQClient` via the module system:

```typescript
const module = await Test.createTestingModule({
  imports: [
    KubeMQModule.forTest({ name: 'KUBEMQ_SERVICE', isGlobal: true }),
  ],
  providers: [OrderService],
}).compile();
```

## Examples

78 standalone NestJS mini-app examples across 16 folders demonstrate all features of the KubeMQ NestJS transport. Each example is a self-contained NestJS application that can be run independently.

**Run any example:**

```bash
cd kubemq-nestjs/examples
npm install
npx tsx examples/{folder}/{name}/main.ts
```

### Connection

Basic connection lifecycle — connect, disconnect, and ping.

| Example | Description | Run |
|---------|-------------|-----|
| [connect](examples/connection/connect/) | Connect to KubeMQ broker | `npx tsx examples/connection/connect/main.ts` |
| [close](examples/connection/close/) | Graceful connection close | `npx tsx examples/connection/close/main.ts` |
| [ping](examples/connection/ping/) | Ping broker for health check | `npx tsx examples/connection/ping/main.ts` |

### Configuration

Server and client configuration options.

| Example | Description | Run |
|---------|-------------|-----|
| [custom-logger](examples/configuration/custom-logger/) | NestJS Logger bridge for kubemq-js | `npx tsx examples/configuration/custom-logger/main.ts` |
| [custom-timeouts](examples/configuration/custom-timeouts/) | Command and query timeout configuration | `npx tsx examples/configuration/custom-timeouts/main.ts` |
| [tls-setup](examples/configuration/tls-setup/) | TLS connection configuration | `npx tsx examples/configuration/tls-setup/main.ts` |
| [mtls-setup](examples/configuration/mtls-setup/) | Mutual TLS (mTLS) configuration | `npx tsx examples/configuration/mtls-setup/main.ts` |
| [token-auth](examples/configuration/token-auth/) | Token-based authentication | `npx tsx examples/configuration/token-auth/main.ts` |

### Error Handling

Error handling, exception filters, and reconnection strategies.

| Example | Description | Run |
|---------|-------------|-----|
| [connection-error](examples/error-handling/connection-error/) | Handle connection failures gracefully | `npx tsx examples/error-handling/connection-error/main.ts` |
| [graceful-shutdown](examples/error-handling/graceful-shutdown/) | Drain and shutdown with `enableShutdownHooks` | `npx tsx examples/error-handling/graceful-shutdown/main.ts` |
| [reconnection](examples/error-handling/reconnection/) | Automatic reconnection with `ReconnectionPolicy` | `npx tsx examples/error-handling/reconnection/main.ts` |
| [exception-filter](examples/error-handling/exception-filter/) | Custom `KubeMQRpcException` filter | `npx tsx examples/error-handling/exception-filter/main.ts` |

### Events

Fire-and-forget pub/sub messaging.

| Example | Description | Run |
|---------|-------------|-----|
| [basic-pubsub](examples/events/basic-pubsub/) | Basic event publish and subscribe | `npx tsx examples/events/basic-pubsub/main.ts` |
| [cancel-subscription](examples/events/cancel-subscription/) | Cancel event subscription | `npx tsx examples/events/cancel-subscription/main.ts` |
| [consumer-group](examples/events/consumer-group/) | Load-balanced event consumption with groups | `npx tsx examples/events/consumer-group/main.ts` |
| [multiple-subscribers](examples/events/multiple-subscribers/) | Multiple handlers on the same channel | `npx tsx examples/events/multiple-subscribers/main.ts` |
| [wildcard-subscription](examples/events/wildcard-subscription/) | Wildcard channel matching | `npx tsx examples/events/wildcard-subscription/main.ts` |

### Events Store

Persistent event streams with replay and sequence tracking.

| Example | Description | Run |
|---------|-------------|-----|
| [persistent-pubsub](examples/events-store/persistent-pubsub/) | Persistent event publish and subscribe | `npx tsx examples/events-store/persistent-pubsub/main.ts` |
| [replay-from-sequence](examples/events-store/replay-from-sequence/) | Replay events from a specific sequence | `npx tsx examples/events-store/replay-from-sequence/main.ts` |
| [replay-from-time](examples/events-store/replay-from-time/) | Replay events from a specific time | `npx tsx examples/events-store/replay-from-time/main.ts` |
| [start-from-first](examples/events-store/start-from-first/) | Subscribe from the first stored event | `npx tsx examples/events-store/start-from-first/main.ts` |
| [start-from-last](examples/events-store/start-from-last/) | Subscribe from the last stored event | `npx tsx examples/events-store/start-from-last/main.ts` |
| [start-new-only](examples/events-store/start-new-only/) | Subscribe to new events only | `npx tsx examples/events-store/start-new-only/main.ts` |
| [cancel-subscription](examples/events-store/cancel-subscription/) | Cancel events store subscription | `npx tsx examples/events-store/cancel-subscription/main.ts` |
| [consumer-group](examples/events-store/consumer-group/) | Load-balanced events store consumption | `npx tsx examples/events-store/consumer-group/main.ts` |

### Queues

Reliable delivery with ack/nack, dead-letter, and batch operations.

| Example | Description | Run |
|---------|-------------|-----|
| [send-receive](examples/queues/send-receive/) | Basic queue send and receive | `npx tsx examples/queues/send-receive/main.ts` |
| [ack-reject](examples/queues/ack-reject/) | Manual ack and reject (nack) | `npx tsx examples/queues/ack-reject/main.ts` |
| [ack-all](examples/queues/ack-all/) | Acknowledge all messages in a batch | `npx tsx examples/queues/ack-all/main.ts` |
| [batch-send](examples/queues/batch-send/) | Send multiple queue messages | `npx tsx examples/queues/batch-send/main.ts` |
| [peek-messages](examples/queues/peek-messages/) | Peek at messages without consuming | `npx tsx examples/queues/peek-messages/main.ts` |
| [delayed-messages](examples/queues/delayed-messages/) | Delayed message delivery | `npx tsx examples/queues/delayed-messages/main.ts` |
| [dead-letter-queue](examples/queues/dead-letter-queue/) | Dead-letter queue routing | `npx tsx examples/queues/dead-letter-queue/main.ts` |

### Queue Streams

Streaming queue operations with advanced policies.

| Example | Description | Run |
|---------|-------------|-----|
| [stream-send](examples/queues-stream/stream-send/) | Stream-send queue messages | `npx tsx examples/queues-stream/stream-send/main.ts` |
| [stream-receive](examples/queues-stream/stream-receive/) | Stream-receive queue messages | `npx tsx examples/queues-stream/stream-receive/main.ts` |
| [poll-mode](examples/queues-stream/poll-mode/) | Poll-based queue consumption | `npx tsx examples/queues-stream/poll-mode/main.ts` |
| [auto-ack](examples/queues-stream/auto-ack/) | Automatic message acknowledgment | `npx tsx examples/queues-stream/auto-ack/main.ts` |
| [ack-range](examples/queues-stream/ack-range/) | Acknowledge a range of messages | `npx tsx examples/queues-stream/ack-range/main.ts` |
| [nack-all](examples/queues-stream/nack-all/) | Reject all messages | `npx tsx examples/queues-stream/nack-all/main.ts` |
| [requeue-all](examples/queues-stream/requeue-all/) | Requeue all messages | `npx tsx examples/queues-stream/requeue-all/main.ts` |
| [expiration-policy](examples/queues-stream/expiration-policy/) | Message expiration configuration | `npx tsx examples/queues-stream/expiration-policy/main.ts` |
| [dead-letter-policy](examples/queues-stream/dead-letter-policy/) | Dead-letter policy configuration | `npx tsx examples/queues-stream/dead-letter-policy/main.ts` |
| [delay-policy](examples/queues-stream/delay-policy/) | Delay policy configuration | `npx tsx examples/queues-stream/delay-policy/main.ts` |

### RPC (Commands & Queries)

Request-reply messaging with commands and queries.

| Example | Description | Run |
|---------|-------------|-----|
| [send-command](examples/rpc/send-command/) | Send a command | `npx tsx examples/rpc/send-command/main.ts` |
| [handle-command](examples/rpc/handle-command/) | Handle incoming commands | `npx tsx examples/rpc/handle-command/main.ts` |
| [command-timeout](examples/rpc/command-timeout/) | Command timeout configuration | `npx tsx examples/rpc/command-timeout/main.ts` |
| [command-group](examples/rpc/command-group/) | Load-balanced command handling with groups | `npx tsx examples/rpc/command-group/main.ts` |
| [send-query](examples/rpc/send-query/) | Send a query | `npx tsx examples/rpc/send-query/main.ts` |
| [handle-query](examples/rpc/handle-query/) | Handle incoming queries | `npx tsx examples/rpc/handle-query/main.ts` |
| [cached-query](examples/rpc/cached-query/) | Query with server-side caching | `npx tsx examples/rpc/cached-query/main.ts` |
| [query-cache-hit](examples/rpc/query-cache-hit/) | Verify query cache hit behavior | `npx tsx examples/rpc/query-cache-hit/main.ts` |
| [query-group](examples/rpc/query-group/) | Load-balanced query handling with groups | `npx tsx examples/rpc/query-group/main.ts` |

### Patterns

Common messaging patterns built on KubeMQ primitives.

| Example | Description | Run |
|---------|-------------|-----|
| [request-reply](examples/patterns/request-reply/) | Request-reply pattern with commands | `npx tsx examples/patterns/request-reply/main.ts` |
| [fan-out](examples/patterns/fan-out/) | Fan-out pattern with events | `npx tsx examples/patterns/fan-out/main.ts` |
| [work-queue](examples/patterns/work-queue/) | Work queue pattern with queues | `npx tsx examples/patterns/work-queue/main.ts` |

### Management

Channel management operations.

| Example | Description | Run |
|---------|-------------|-----|
| [create-channel](examples/management/create-channel/) | Create KubeMQ channels | `npx tsx examples/management/create-channel/main.ts` |
| [delete-channel](examples/management/delete-channel/) | Delete KubeMQ channels | `npx tsx examples/management/delete-channel/main.ts` |
| [list-channels](examples/management/list-channels/) | List all channels | `npx tsx examples/management/list-channels/main.ts` |
| [purge-queue](examples/management/purge-queue/) | Purge queue messages | `npx tsx examples/management/purge-queue/main.ts` |

### Observability

Logging and monitoring integration.

| Example | Description | Run |
|---------|-------------|-----|
| [logger-bridge-setup](examples/observability/logger-bridge-setup/) | Bridge kubemq-js logs to NestJS Logger | `npx tsx examples/observability/logger-bridge-setup/main.ts` |

### Module Configuration

Dynamic module registration patterns.

| Example | Description | Run |
|---------|-------------|-----|
| [for-root](examples/module-config/for-root/) | Static `forRoot` configuration | `npx tsx examples/module-config/for-root/main.ts` |
| [for-root-async](examples/module-config/for-root-async/) | Async `forRootAsync` with `ConfigService` | `npx tsx examples/module-config/for-root-async/main.ts` |
| [register](examples/module-config/register/) | Named client with `register` | `npx tsx examples/module-config/register/main.ts` |
| [register-async](examples/module-config/register-async/) | Async named client with `registerAsync` | `npx tsx examples/module-config/register-async/main.ts` |
| [for-test](examples/module-config/for-test/) | Test module with `forTest` | `npx tsx examples/module-config/for-test/main.ts` |
| [multi-broker](examples/module-config/multi-broker/) | Multi-broker configuration | `npx tsx examples/module-config/multi-broker/main.ts` |

### Decorators

Custom decorator usage and options.

| Example | Description | Run |
|---------|-------------|-----|
| [all-handlers](examples/decorators/all-handlers/) | All five handler decorators in one app | `npx tsx examples/decorators/all-handlers/main.ts` |
| [decorator-options](examples/decorators/decorator-options/) | Decorator options (group, maxConcurrent, etc.) | `npx tsx examples/decorators/decorator-options/main.ts` |
| [custom-groups](examples/decorators/custom-groups/) | Consumer group configuration | `npx tsx examples/decorators/custom-groups/main.ts` |
| [manual-ack](examples/decorators/manual-ack/) | Manual ack with `@QueueHandler` | `npx tsx examples/decorators/manual-ack/main.ts` |

### CQRS Bridge

`@nestjs/cqrs` integration with KubeMQ channels.

| Example | Description | Run |
|---------|-------------|-----|
| [cqrs-commands](examples/cqrs/cqrs-commands/) | Distributed commands via `CommandBus` | `npx tsx examples/cqrs/cqrs-commands/main.ts` |
| [cqrs-queries](examples/cqrs/cqrs-queries/) | Distributed queries via `QueryBus` | `npx tsx examples/cqrs/cqrs-queries/main.ts` |
| [cqrs-events](examples/cqrs/cqrs-events/) | Distributed events via `EventBus` | `npx tsx examples/cqrs/cqrs-events/main.ts` |
| [full-cqrs-flow](examples/cqrs/full-cqrs-flow/) | Complete CQRS flow with all buses | `npx tsx examples/cqrs/full-cqrs-flow/main.ts` |

### Serialization

Custom serializer and deserializer implementations.

| Example | Description | Run |
|---------|-------------|-----|
| [custom-serializer](examples/serialization/custom-serializer/) | Custom `KubeMQSerializer` implementation | `npx tsx examples/serialization/custom-serializer/main.ts` |
| [custom-deserializer](examples/serialization/custom-deserializer/) | Custom `KubeMQDeserializer` implementation | `npx tsx examples/serialization/custom-deserializer/main.ts` |
| [msgpack-serializer](examples/serialization/msgpack-serializer/) | MsgPack serialization with `msgpackr` | `npx tsx examples/serialization/msgpack-serializer/main.ts` |

### Health Check

`@nestjs/terminus` health indicator integration.

| Example | Description | Run |
|---------|-------------|-----|
| [basic-health](examples/health-check/basic-health/) | Basic health check endpoint | `npx tsx examples/health-check/basic-health/main.ts` |
| [terminus-integration](examples/health-check/terminus-integration/) | Full Terminus integration with `KubeMQHealthIndicator` | `npx tsx examples/health-check/terminus-integration/main.ts` |

## API Reference

### Server

| Export | Description |
|--------|-------------|
| `KubeMQServer` | Custom transport strategy implementing NestJS `CustomTransportStrategy` |

### Client

| Export | Description |
|--------|-------------|
| `KubeMQClientProxy` | Client proxy extending NestJS `ClientProxy` |
| `KubeMQRecord` | Record builder for specifying message type (`.asQuery()`, `.asEventStore()`, `.asQueue()`) |
| `isKubeMQRecord(value)` | Type guard to check if a value is a `KubeMQRecord` |
| `KUBEMQ_RECORD_SYMBOL` | Symbol used to identify `KubeMQRecord` instances |

### Module

| Export | Description |
|--------|-------------|
| `KubeMQModule.forRoot(options)` | Global server configuration |
| `KubeMQModule.forRootAsync(options)` | Async global server configuration |
| `KubeMQModule.register(options)` | Named client proxy registration |
| `KubeMQModule.registerAsync(options)` | Async named client proxy registration |
| `KubeMQModule.forTest(options?)` | Test module with `MockKubeMQClient` |

### Decorators

| Export | Description |
|--------|-------------|
| `@CommandHandler(channel, options?)` | KubeMQ command handler (request-reply) |
| `@QueryHandler(channel, options?)` | KubeMQ query handler (request-reply) |
| `@EventHandler(channel, options?)` | KubeMQ event handler (fire-and-forget) |
| `@EventStoreHandler(channel, options?)` | KubeMQ events store handler (persistent events) |
| `@QueueHandler(channel, options?)` | KubeMQ queue handler (reliable delivery) |

### Contexts

| Export | Description |
|--------|-------------|
| `KubeMQContext` | Base context with `channel`, `id`, `timestamp`, `tags`, `metadata`, `patternType` |
| `KubeMQCommandContext` | Adds `fromClientId`, `replyChannel` |
| `KubeMQQueryContext` | Adds `fromClientId`, `replyChannel` |
| `KubeMQRequestContext` | Union context for commands and queries |
| `KubeMQEventStoreContext` | Adds `sequence` |
| `KubeMQQueueContext` | Adds `sequence`, `receiveCount`, `isReRouted`, `ack()`, `nack()`, `reQueue(channel)` |
| `KubeMQQueueBatchContext` | Context for batch queue processing |

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
| `HealthIndicatorResult` | Type alias for health indicator result |

### Errors

| Export | Description |
|--------|-------------|
| `KubeMQRpcException` | `RpcException` subclass with kubemq-js error details |
| `KubeMQRpcError` | Interface for structured error data |
| `mapErrorToRpcException(error)` | Maps kubemq-js errors to `KubeMQRpcException` |
| `mapToRpcException(error)` | Maps any error to `KubeMQRpcException` |
| `SerializationError` | Thrown on serialization/deserialization failure |
| `ConnectionNotReadyError` | Re-exported from kubemq-js; thrown on unready connections |

### Observability

| Export | Description |
|--------|-------------|
| `createNestKubeMQLogger(context)` | Creates a kubemq-js `Logger` backed by NestJS `Logger` |
| `KubeMQStatus` | Enum: `DISCONNECTED`, `RECONNECTING`, `CONNECTED`, `CLOSED` |

### Constants

| Export | Description |
|--------|-------------|
| `KUBEMQ_TRANSPORT` | Transport identifier (`'kubemq'`) |
| `KUBEMQ_MODULE_OPTIONS` | Injection token for module options |
| `KUBEMQ_CLIENT_TOKEN` | Default client injection token |
| `KUBEMQ_HANDLER_METADATA` | Metadata key for handler decorator options |
| `TAG_PATTERN` | KubeMQ message tag key for pattern |
| `TAG_ID` | KubeMQ message tag key for id |
| `TAG_TYPE` | KubeMQ message tag key for type |
| `TAG_CONTENT_TYPE` | KubeMQ message tag key for content type |
| `KubeMQPatternType` | Type: `'command'` \| `'query'` \| `'event'` \| `'event_store'` \| `'queue'` |

### Interfaces

| Export | Description |
|--------|-------------|
| `KubeMQServerOptions` | Server configuration (20 fields) |
| `KubeMQClientOptions` | Client configuration (16 fields) |
| `QueueMessagePolicyOptions` | Queue message policy (expiration, delay, DLQ) |
| `KubeMQModuleOptions` | Module options (`KubeMQServerOptions` + `isGlobal`) |
| `KubeMQOptionsFactory` | Factory interface for `forRootAsync` / `useClass` |
| `KubeMQModuleAsyncOptions` | Async module options |
| `KubeMQRegisterOptions` | Register options (`KubeMQClientOptions` + `name`) |
| `KubeMQClientOptionsFactory` | Factory interface for `registerAsync` / `useClass` |
| `KubeMQRegisterAsyncOptions` | Async register options |
| `KubeMQTestOptions` | Test module options (`name`, `isGlobal`) |
| `KubeMQHandlerBaseOptions` | Base decorator options (`group`, `maxConcurrent`) |
| `CommandHandlerOptions` | Command decorator options |
| `QueryHandlerOptions` | Query decorator options |
| `EventHandlerOptions` | Event decorator options |
| `EventStoreHandlerOptions` | Events store decorator options |
| `QueueHandlerOptions` | Queue decorator options |
| `KubeMQHandlerMetadata` | Internal handler metadata interface |
| `EventStoreStartFrom` | Type: `'new'` \| `'first'` \| `'last'` \| `'sequence'` \| `'time'` \| `'timeDelta'` \| `1`–`6` |

### Testing (`@kubemq/nestjs-transport/testing`)

| Export | Description |
|--------|-------------|
| `MockKubeMQClient` | In-memory mock of `KubeMQClientProxy` |
| `MockKubeMQServer` | In-memory mock of `KubeMQServer` |

### CQRS (`@kubemq/nestjs-transport/cqrs`)

| Export | Description |
|--------|-------------|
| `KubeMQCqrsModule` | Dynamic module bridging `@nestjs/cqrs` with KubeMQ |
| `KubeMQCommandPubSub` | PubSub adapter for `CommandBus` |
| `KubeMQQueryPubSub` | PubSub adapter for `QueryBus` |
| `KubeMQEventPubSub` | PubSub adapter for `EventBus` |
| `KubeMQCqrsOptions` | CQRS module configuration (10 fields) |
| `KubeMQCqrsAsyncOptions` | Async CQRS module options |

## Configuration Reference

### KubeMQServerOptions

| Parameter | Type | Default | Required | Description |
|-----------|------|---------|----------|-------------|
| `address` | `string` | — | **Yes** | KubeMQ server address (`host:port`) |
| `clientId` | `string` | Auto-generated | No | Unique client identifier |
| `credentials` | `string` | `undefined` | No | Authentication token |
| `tls` | `TlsOptions \| boolean` | `undefined` | No | TLS configuration |
| `group` | `string` | `undefined` | No | Default consumer group for all handlers |
| `defaultCommandTimeout` | `number` | `10` | No | Default command timeout (seconds) |
| `defaultQueryTimeout` | `number` | `10` | No | Default query timeout (seconds) |
| `eventsStore` | `object` | `undefined` | No | Events store defaults |
| `eventsStore.startFrom` | `EventStoreStartPosition` | `'new'` | No | Default start position |
| `eventsStore.startValue` | `number` | `undefined` | No | Sequence or time value for `startFrom` |
| `queue` | `object` | `undefined` | No | Queue defaults |
| `queue.maxMessages` | `number` | `1` | No | Max messages per poll |
| `queue.waitTimeoutSeconds` | `number` | `5` | No | Poll wait timeout (seconds) |
| `serializer` | `KubeMQSerializer` | `JsonSerializer` | No | Outbound message serializer |
| `deserializer` | `KubeMQDeserializer` | `JsonDeserializer` | No | Inbound message deserializer |
| `waitForConnection` | `boolean` | `true` | No | Block startup until connected |
| `callbackTimeoutSeconds` | `number` | `30` | No | Handler callback timeout (seconds) |
| `retry` | `RetryPolicy` | kubemq-js default | No | Retry policy for transient errors |
| `reconnect` | `ReconnectionPolicy` | kubemq-js default | No | Reconnection policy |
| `keepalive` | `KeepaliveOptions` | kubemq-js default | No | gRPC keepalive settings |
| `tracerProvider` | `unknown` | `undefined` | No | OpenTelemetry tracer provider |
| `meterProvider` | `unknown` | `undefined` | No | OpenTelemetry meter provider |
| `verboseErrors` | `boolean` | `false` | No | Include raw broker messages in exceptions |
| `verboseHealth` | `boolean` | `false` | No | Include detailed health data in checks |

> **Timeout units:** Fields ending in `*Seconds` (e.g., `callbackTimeoutSeconds`, `waitTimeoutSeconds`) are in **seconds**. Fields without the suffix (e.g., `initialDelayMs`, `maxDelayMs`) are in **milliseconds**.

### KubeMQClientOptions

| Parameter | Type | Default | Required | Description |
|-----------|------|---------|----------|-------------|
| `address` | `string` | — | **Yes** | KubeMQ server address (`host:port`) |
| `clientId` | `string` | Auto-generated | No | Unique client identifier |
| `credentials` | `string` | `undefined` | No | Authentication token |
| `tls` | `TlsOptions \| boolean` | `undefined` | No | TLS configuration |
| `defaultCommandTimeout` | `number` | `10` | No | Default command timeout (seconds) |
| `defaultQueryTimeout` | `number` | `10` | No | Default query timeout (seconds) |
| `serializer` | `KubeMQSerializer` | `JsonSerializer` | No | Outbound message serializer |
| `deserializer` | `KubeMQDeserializer` | `JsonDeserializer` | No | Inbound message deserializer |
| `defaultQueuePolicy` | `QueueMessagePolicyOptions` | `undefined` | No | Default queue message policy |
| `retry` | `RetryPolicy` | kubemq-js default | No | Retry policy for transient errors |
| `reconnect` | `ReconnectionPolicy` | kubemq-js default | No | Reconnection policy |
| `keepalive` | `KeepaliveOptions` | kubemq-js default | No | gRPC keepalive settings |
| `tracerProvider` | `unknown` | `undefined` | No | OpenTelemetry tracer provider |
| `meterProvider` | `unknown` | `undefined` | No | OpenTelemetry meter provider |
| `callbackTimeoutSeconds` | `number` | `30` | No | Handler callback timeout (seconds) |
| `verboseErrors` | `boolean` | `false` | No | Include raw broker messages in exceptions |

### QueueMessagePolicyOptions

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `expirationSeconds` | `number` | `undefined` | Message TTL (seconds) |
| `delaySeconds` | `number` | `undefined` | Delivery delay (seconds) |
| `maxReceiveCount` | `number` | `undefined` | Max delivery attempts before dead-letter |
| `maxReceiveQueue` | `string` | `undefined` | Dead-letter queue channel |

### KubeMQCqrsOptions

| Parameter | Type | Default | Required | Description |
|-----------|------|---------|----------|-------------|
| `commandChannelPrefix` | `string` | `'cqrs.commands'` | No | Channel prefix for commands |
| `queryChannelPrefix` | `string` | `'cqrs.queries'` | No | Channel prefix for queries |
| `eventChannelPrefix` | `string` | `'cqrs.events'` | No | Channel prefix for events |
| `persistEvents` | `boolean` | `false` | No | Use Events Store instead of Events |
| `commandTimeout` | `number` | `10` | No | Command timeout (seconds) |
| `queryTimeout` | `number` | `10` | No | Query timeout (seconds) |
| `drainTimeoutSeconds` | `number` | `5` | No | Drain timeout on module destroy (seconds) |
| `channelResolver` | `(message: object) => string` | `constructor.name` | No | Custom channel segment resolver |
| `serializer` | `KubeMQSerializer` | `JsonSerializer` | No | Outbound message serializer |
| `deserializer` | `KubeMQDeserializer` | `JsonDeserializer` | No | Inbound message deserializer |

## Troubleshooting / FAQ

| Problem | Solution |
|---------|----------|
| **Connection refused** (`ECONNREFUSED`) | Verify KubeMQ server is running on the configured address. Start a local broker with `docker run -p 50000:50000 kubemq/kubemq-community`. |
| **Connection timeout** | Check network connectivity and firewall rules. Increase `connectionTimeoutSeconds` if the broker is remote. |
| **Decorator not firing** | Ensure the handler class is registered as a provider in a module that imports `KubeMQModule`. The handler must be a NestJS-managed provider, not a standalone class. |
| **`Cannot find module '@kubemq/nestjs-transport'`** | Run `npm install @kubemq/nestjs-transport kubemq-js`. Verify `node_modules/@kubemq/nestjs-transport` exists. |
| **`Cannot find module '@kubemq/nestjs-transport/testing'`** | Requires package version with the `./testing` export map entry. Check `package.json` `exports` field. |
| **`Cannot find module '@kubemq/nestjs-transport/cqrs'`** | Install the optional peer dependency: `npm install @nestjs/cqrs`. |
| **Serialization mismatch** | Ensure the same `KubeMQSerializer` and `KubeMQDeserializer` are configured on both `KubeMQServer` and `KubeMQModule.register()`. A `SerializationError` is thrown when deserialization fails. |
| **Messages not received** | Verify the channel name matches between sender and receiver. Check that the server microservice is started (`app.startAllMicroservices()`). |
| **Queue messages reappearing** | Messages are redelivered when not acknowledged. Use `manualAck: true` and call `ctx.ack()`, or rely on auto-ack (default). |
| **`KubeMQRpcException` with unknown error** | Enable `verboseErrors: true` in server/client options to include raw broker error details in the exception. |
| **Health check failing** | Ensure `KubeMQHealthIndicator.fromServer()` receives the same `KubeMQServer` instance passed to `connectMicroservice`. |
| **CQRS events not distributed** | Verify `KubeMQCqrsModule.forRoot()` is imported *after* `CqrsModule` and `KubeMQModule.forRoot()`. Check that `KubeMQModule.forRoot()` provides the connection configuration. |

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](https://github.com/kubemq-io/kubemq-nestjs-transport/blob/main/CONTRIBUTING.md) for development setup, coding standards, and pull request guidelines.

## License

MIT — see [LICENSE](LICENSE) for details.
